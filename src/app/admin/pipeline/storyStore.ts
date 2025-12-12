import { useSyncExternalStore } from 'react';

// Minimal centralized store (Zustand-like) for the "Automated Storyteller"
// - Tracks active tutorial step and whether the panel is open
// - Keeps UI in sync without adding external dependencies

export type StoryState = {
  isOpen: boolean;
  sequence: string[];
  stepIndex: number;
};

type Listener = () => void;

let state: StoryState = {
  isOpen: false,
  sequence: [],
  stepIndex: 0,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export const storyActions = {
  open(sequence: string[]) {
    state = { isOpen: true, sequence, stepIndex: 0 };
    emit();
  },
  close() {
    state = { ...state, isOpen: false };
    emit();
  },
  setSequence(sequence: string[]) {
    state = { ...state, sequence, stepIndex: 0 };
    emit();
  },
  next() {
    state = { ...state, stepIndex: Math.min(state.stepIndex + 1, Math.max(0, state.sequence.length - 1)) };
    emit();
  },
  prev() {
    state = { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    emit();
  },
  goTo(stepIndex: number) {
    state = { ...state, stepIndex: Math.max(0, Math.min(stepIndex, Math.max(0, state.sequence.length - 1))) };
    emit();
  },
};

export function useStoryStore<T>(selector: (s: StoryState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
    () => selector(state),
  );
}


