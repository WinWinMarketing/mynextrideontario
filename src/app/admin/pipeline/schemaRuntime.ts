import type {
  WorkflowSchema,
  WorkflowNode,
  WorkflowEdge,
  PipelineStage,
  MessageNode,
  NodeConnection,
  TextLabel,
  StageColor,
  StrictPathType,
} from './types';
import { NODE_SIZES, deriveTutorialSequence, strictPathColor } from './types';

export type NodeSizeKey = keyof typeof NODE_SIZES;

type PlacedBox = {
  id: string;
  kind: 'stage' | 'message';
  x: number;
  y: number;
  width: number;
  height: number;
};

function nodeKind(n: WorkflowNode): PlacedBox['kind'] {
  return n.type === 'Status_Node' ? 'stage' : 'message';
}

function nodeColor(n: WorkflowNode): StageColor {
  // All schema nodes carry a StageColor
  // (Status_Node/Action_Node/Logic_Gate all include color in our schema types)
  return (n as any).color as StageColor;
}

function nodeIcon(n: WorkflowNode): string {
  return (n as any).icon || '•';
}

function nodeActionType(n: WorkflowNode): MessageNode['type'] {
  if (n.type === 'Action_Node') return (n as any).actionType as MessageNode['type'];
  // Logic gate rendered as ai-response for now (schema still preserves Logic_Gate)
  return 'ai-response';
}

function isDeadStatus(n: WorkflowNode): boolean {
  return n.type === 'Status_Node' && (n as any).statusId === 'dead';
}

function getOutgoing(schema: WorkflowSchema, id: string): WorkflowEdge[] {
  return schema.edges.filter(e => e.from === id);
}

function chooseNextMainEdge(edges: WorkflowEdge[]): WorkflowEdge | undefined {
  // Prefer Success edges for the main “gravity” path
  return edges.find(e => e.strict_path === 'Success');
}

export function buildRuntimeFromSchema(schema: WorkflowSchema, nodeSize: NodeSizeKey) {
  const size = NODE_SIZES[nodeSize];

  const nodesById = new Map<string, WorkflowNode>(schema.nodes.map(n => [n.id, n]));
  const placed = new Map<string, PlacedBox>();

  // --- Layout constants (schema-first, deterministic) ---
  const startX = 560;
  const startY = 220;
  const mainY = startY + 120;
  const stepX = 540;
  const branchStepY = 320;
  const loopStepY = 260;

  // --- Main success path (horizontal progression) ---
  const mainPath: string[] = [];
  {
    const visited = new Set<string>();
    let current = schema.entryNodeId;
    for (let i = 0; i < 40; i++) {
      if (!current || visited.has(current)) break;
      visited.add(current);
      mainPath.push(current);
      const next = chooseNextMainEdge(getOutgoing(schema, current));
      current = next?.to || '';
    }
  }

  const boxFor = (n: WorkflowNode, x: number, y: number): PlacedBox => {
    if (n.type === 'Status_Node') return { id: n.id, kind: 'stage', x, y, width: size.stage.w, height: size.stage.h };
    if (n.type === 'Action_Node') return { id: n.id, kind: 'message', x, y, width: size.message.w, height: size.message.h };
    // Logic gate slightly smaller than action nodes
    return { id: n.id, kind: 'message', x, y, width: Math.round(size.message.w * 0.85), height: Math.round(size.message.h * 0.8) };
  };

  mainPath.forEach((id, idx) => {
    const n = nodesById.get(id);
    if (!n) return;
    if (isDeadStatus(n)) return; // dead zone handled separately
    placed.set(id, boxFor(n, startX + idx * stepX, mainY));
  });

  // --- Dead zone: all dead statuses at MAX_Y (bottom) ---
  const deadNodes = schema.nodes.filter(n => isDeadStatus(n));
  const deadY = mainY + branchStepY * 2.1;
  deadNodes.forEach((n, idx) => {
    placed.set(n.id, boxFor(n, startX + idx * stepX, deadY));
  });

  // --- Loop bubbles: place loop targets above their source ---
  const loopCountByFrom = new Map<string, number>();
  schema.edges
    .filter(e => e.strict_path === 'Loop')
    .forEach(e => {
      const toNode = nodesById.get(e.to);
      const fromBox = placed.get(e.from);
      if (!toNode || !fromBox) return;
      if (placed.has(e.to)) return; // already placed (main path / dead / prior)
      const count = loopCountByFrom.get(e.from) || 0;
      loopCountByFrom.set(e.from, count + 1);
      const bx = boxFor(toNode, fromBox.x + Math.round((fromBox.width - size.message.w) / 2), fromBox.y - (count + 1) * loopStepY);
      placed.set(e.to, bx);
    });

  // --- Remaining nodes: place in branch lanes below their first placed predecessor ---
  const remaining = schema.nodes.filter(n => !placed.has(n.id));
  const branchLaneByFrom = new Map<string, number>();
  remaining.forEach(n => {
    // Find first predecessor already placed
    const incoming = schema.edges.filter(e => e.to === n.id);
    const pred = incoming.map(e => e.from).find(id => placed.has(id));
    const predBox = pred ? placed.get(pred) : undefined;
    const laneKey = pred || schema.entryNodeId;
    const lane = branchLaneByFrom.get(laneKey) || 0;
    branchLaneByFrom.set(laneKey, lane + 1);
    const x = predBox ? predBox.x + Math.round(stepX * 0.55) : startX;
    const y = predBox ? predBox.y + branchStepY * (lane + 1) : mainY + branchStepY;
    placed.set(n.id, boxFor(n, x, y));
  });

  // --- Convert to runtime nodes (PipelineStage + MessageNode) ---
  const stages: PipelineStage[] = [];
  const messageNodes: MessageNode[] = [];

  for (const n of schema.nodes) {
    const b = placed.get(n.id);
    if (!b) continue;
    if (n.type === 'Status_Node') {
      stages.push({
        id: n.id,
        label: n.label,
        description: (n as any).guidance?.tutorial_title || undefined,
        statusId: (n as any).statusId,
        deadReason: (n as any).deadReason,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: nodeColor(n),
        icon: nodeIcon(n),
        autoActions: [],
        inlineActions: [],
      });
    } else {
      messageNodes.push({
        id: n.id,
        type: nodeActionType(n),
        label: n.label,
        icon: nodeIcon(n),
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: nodeColor(n),
        subject: undefined,
        message: (n as any).guidance?.tutorial_content || '',
        autoTrigger: false,
        triggerDelay: (n as any).triggerDelay,
        triggerCondition: 'manual',
        linkedStageIds: [],
        inlineActions: [],
        templateId: (n as any).templateId,
      });
    }
  }

  // --- Convert edges to runtime connections ---
  const connections: NodeConnection[] = schema.edges.map(e => {
    const fromNode = nodesById.get(e.from);
    const toNode = nodesById.get(e.to);
    const fromType: 'stage' | 'message' = fromNode?.type === 'Status_Node' ? 'stage' : 'message';
    const toType: 'stage' | 'message' = toNode?.type === 'Status_Node' ? 'stage' : 'message';
    const style: NodeConnection['style'] = e.strict_path === 'Loop' ? 'dashed' : 'solid';
    const color = strictPathColor(e.strict_path);
    const thickness = e.strict_path === 'Success' || e.strict_path === 'Failure' ? 4 : 3;
    return {
      id: e.id,
      fromNodeId: e.from,
      toNodeId: e.to,
      fromType,
      toType,
      fromAnchor: 'right',
      toAnchor: 'left',
      autoTrigger: false,
      label: e.label || e.strict_path,
      style,
      color,
      thickness,
      strictPath: e.strict_path as StrictPathType,
    };
  });

  // Minimal labels: title and dead-zone label
  const labels: TextLabel[] = [
    { id: 'schema-title', text: schema.name, x: startX, y: startY - 30, fontSize: 26, color: '#ffffff', fontWeight: '900' },
    { id: 'schema-deadzone', text: 'DEAD / TERMINATION ZONE', x: startX, y: deadY - 50, fontSize: 14, color: '#ef4444', fontWeight: '800' },
  ];

  const tutorialSequence = deriveTutorialSequence(schema);

  return {
    stages,
    messageNodes,
    connections,
    labels,
    tutorialSequence,
    entryNodeId: schema.entryNodeId,
    layout: Object.fromEntries(Array.from(placed.entries())),
  };
}


