import usePetriStore from '../../stores/usePetriStore';
import useSimulationStore from '../../stores/useSimulationStore';
import { useCallback } from 'react';

const SimulationControls = () => {
  const setMarking = usePetriStore((s) => s.setMarking);
  const getMarkingObject = usePetriStore((s) => s.getMarkingObject);
  const saveInitialMarking = useSimulationStore((s) => s.saveInitialMarking);
  const history = useSimulationStore((s) => s.history);
  const firingSequence = useSimulationStore((s) => s.firingSequence);
  const initialMarking = useSimulationStore((s) => s.initialMarking);
  const undo = useSimulationStore((s) => s.undo);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);

  const handleInit = useCallback(() => {
    saveInitialMarking(getMarkingObject());
  }, [saveInitialMarking, getMarkingObject]);

  const handleUndo = useCallback(() => {
    const prevMarking = undo();
    if (prevMarking) {
      setMarking(prevMarking);
    }
  }, [undo, setMarking]);

  const handleReset = useCallback(() => {
    if (initialMarking) {
      setMarking(initialMarking);
      resetSimulation();
      saveInitialMarking(initialMarking);
    }
  }, [initialMarking, setMarking, resetSimulation, saveInitialMarking]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-base font-bold text-gray-800">Simulation</h3>
      <p className="text-xs text-gray-500">
        Double-cliquez sur une transition activée (jaune) pour la tirer.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleInit}
          className="flex-1 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
        >
          Initialiser
        </button>
        <button
          onClick={handleUndo}
          disabled={history.length <= 1}
          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition disabled:opacity-40"
        >
          ↩ Annuler
        </button>
        <button
          onClick={handleReset}
          disabled={!initialMarking}
          className="flex-1 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition disabled:opacity-40"
        >
          ↺ Reset M₀
        </button>
      </div>

      {firingSequence.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-600 mb-1">
            Séquence de tir ({firingSequence.length} pas)
          </h4>
          <p className="text-sm font-mono text-gray-800">
            {firingSequence.join(' → ')}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-gray-600">Historique</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {history.map((entry, idx) => (
              <div key={idx} className="text-xs p-2 bg-white border border-gray-100 rounded">
                <span className="text-gray-400">#{idx} </span>
                {entry.transition && (
                  <span className="text-blue-600 font-medium">[{entry.transition}] </span>
                )}
                <span className="font-mono text-gray-700">
                  ({Object.values(entry.marking).join(', ')})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControls;