import { create } from 'zustand';

const useSimulationStore = create((set, get) => ({
  // Historique des tirs
  history: [],
  initialMarking: null,
  firingSequence: [],

  // Sauvegarder le marquage initial
  saveInitialMarking: (marking) => {
    set({ initialMarking: { ...marking }, history: [{ marking: { ...marking }, transition: null }], firingSequence: [] });
  },

  // Enregistrer un tir
  recordFiring: (transitionLabel, newMarking) => {
    const { history, firingSequence } = get();
    set({
      history: [...history, { marking: { ...newMarking }, transition: transitionLabel }],
      firingSequence: [...firingSequence, transitionLabel],
    });
  },

  // Réinitialiser
  resetSimulation: () => {
    set({ history: [], initialMarking: null, firingSequence: [] });
  },

  // Undo : revenir au marquage précédent
  undo: () => {
    const { history, firingSequence } = get();
    if (history.length <= 1) return null;
    const newHistory = history.slice(0, -1);
    const newSequence = firingSequence.slice(0, -1);
    set({ history: newHistory, firingSequence: newSequence });
    return newHistory[newHistory.length - 1].marking;
  },

  // Obtenir le nombre de pas
  getStepCount: () => get().firingSequence.length,
}));

export default useSimulationStore;