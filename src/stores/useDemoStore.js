import { create } from 'zustand';

const useDemoStore = create((set) => ({
  isPlaying: false,
  highlightId: null,
  speed: 900,
  pausedTransitions: new Set(),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setHighlight: (id) => set({ highlightId: id }),
  clearHighlight: () => set({ highlightId: null }),
  setSpeed: (ms) => set({ speed: ms }),
  togglePaused: (id) => set((s) => {
    const next = new Set(s.pausedTransitions);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { pausedTransitions: next };
  }),
}));

export default useDemoStore;
