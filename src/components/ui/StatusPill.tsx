'use client';

import { cn } from '@/lib/utils';

type Status = 'new' | 'working' | 'hot' | 'circle-back' | 'approved' | 'no-contact' | 'dead';

interface StatusPillProps {
  status: Status;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<Status, { label: string; color: string; activeColor: string }> = {
  new: {
    label: 'New',
    color: 'bg-info/10 text-info border-info/20',
    activeColor: 'bg-info text-white border-info',
  },
  working: {
    label: 'Working',
    color: 'bg-primary-500/10 text-primary-700 border-primary-500/20',
    activeColor: 'bg-primary-700 text-white border-primary-700',
  },
  hot: {
    label: 'Hot',
    color: 'bg-error/10 text-error border-error/20',
    activeColor: 'bg-error text-white border-error',
  },
  'circle-back': {
    label: 'Circle Back',
    color: 'bg-warning/10 text-warning border-warning/20',
    activeColor: 'bg-warning text-white border-warning',
  },
  approved: {
    label: 'Approved',
    color: 'bg-success/10 text-success border-success/20',
    activeColor: 'bg-success text-white border-success',
  },
  'no-contact': {
    label: 'No Contact',
    color: 'bg-muted/10 text-muted border-muted/20',
    activeColor: 'bg-muted text-white border-muted',
  },
  dead: {
    label: 'Dead',
    color: 'bg-foreground/10 text-foreground border-foreground/20',
    activeColor: 'bg-foreground text-white border-foreground',
  },
};

export function StatusPill({ status, onClick, active = false, size = 'md' }: StatusPillProps) {
  const config = statusConfig[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full border-2 transition-all duration-200',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        active ? config.activeColor : config.color,
        onClick && 'cursor-pointer hover:opacity-80',
        !onClick && 'cursor-default'
      )}
    >
      {config.label}
    </button>
  );
}

export function getStatusLabel(status: Status): string {
  return statusConfig[status]?.label || status;
}

