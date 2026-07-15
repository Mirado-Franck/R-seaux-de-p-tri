import { create } from 'zustand';
import { PANEL_TABS } from '../constants/defaults';

const useUIStore = create((set) => ({
  rightPanelOpen: true,
  activeTab: PANEL_TABS.PROPERTIES,
  showMinimap: true,
  showGrid: true,

  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setActiveTab: (tab) => set({ activeTab: tab, rightPanelOpen: true }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
}));

export default useUIStore;