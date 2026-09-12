import { useCallback, useEffect, useRef } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react';
import usePetriStore from '../../stores/usePetriStore';
import useSimulationStore from '../../stores/useSimulationStore';
import useDemoStore from '../../stores/useDemoStore';

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

  // --- Mode Démonstration ---
  const isPlaying = useDemoStore((s) => s.isPlaying);
  const play = useDemoStore((s) => s.play);
  const pause = useDemoStore((s) => s.pause);
  const setHighlight = useDemoStore((s) => s.setHighlight);
  const clearHighlight = useDemoStore((s) => s.clearHighlight);
  const intervalRef = useRef(null);

  const handleNext = useCallback(() => {
    const petri = usePetriStore.getState();
    const paused = useDemoStore.getState().pausedTransitions;
    const enabled = petri.nodes.filter((n) => n.type === 'transition' && n.data.enabled && !paused.has(n.id));
    if (enabled.length === 0) {
      useDemoStore.getState().pause();
      useDemoStore.getState().clearHighlight();
      return;
    }
    const target = enabled[0];
    const success = petri.fireTransition(target.id);
    if (success) {
      const markingObj = petri.getMarkingObject();
      useSimulationStore.getState().recordFiring(target.data.label, markingObj);
      useDemoStore.getState().setHighlight(target.id);
      setTimeout(() => useDemoStore.getState().clearHighlight(), 700);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const prev = useSimulationStore.getState().undo();
    if (prev) {
      usePetriStore.getState().setMarking(prev);
    }
    useDemoStore.getState().clearHighlight();
  }, []);

  // Clavier : flèches gauche/droite pour Suivant / Précédent
  useEffect(() => {
    const isEditableTarget = (target) => {
      if (!target) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };
    const handler = (e) => {
      if (isEditableTarget(e.target)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    if (isPlaying) {
      const speedMs = useDemoStore.getState().speed;
      intervalRef.current = setInterval(() => {
        handleNext();
      }, speedMs || 900);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, handleNext]);


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

      {/* Démonstration pas à pas + auto */}
      <div className="flex gap-2">
        <button
          onClick={() => { play(); }}
          disabled={isPlaying}
          className="flex-1 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-40 flex items-center justify-center gap-1"
          title="Démarrer la démo jusqu'à la fin"
        >
          <Play size={14} /> Démo
        </button>
        {isPlaying && (
          <button
            onClick={() => { pause(); clearInterval(intervalRef.current); }}
            className="flex-1 py-2 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-1"
            title="Arrêter la démo"
          >
            <Pause size={14} /> Pause
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-1"
          title="Suivant (flèche droite)"
        >
          <ChevronRight size={14} /> Suivant
        </button>
        <button
          onClick={handlePrev}
          disabled={history.length <= 1}
          className="flex-1 py-2 bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition disabled:opacity-40 flex items-center justify-center gap-1"
          title="Précédent (flèche gauche)"
        >
          <ChevronLeft size={14} /> Précédent
        </button>
      </div>


      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 0', flexWrap: 'wrap', borderTop: '1px solid #ccfbf1', marginTop: '4px' }}>
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#0c4a6e', whiteSpace: 'nowrap' }}>Vitesse :</label>
        <input type="range" min={200} max={3000} step={100} defaultValue={900} onChange={e => useDemoStore.getState().setSpeed(parseInt(e.target.value))} style={{ width: '120px' }} />
        <span style={{ fontSize: '11px', color: '#64748b' }}>{useDemoStore.getState().speed} ms</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Services :</span>
        {['t1','t3','t5'].map(id => (
          <button key={id} onClick={() => {
                  const isPaused = useDemoStore.getState().pausedTransitions.has(id);
                  const resMap = {t1: {di:'res-poids-di',pa:'res-poids-pa'}, t3:{di:'res-tens-di',pa:'res-tens-pa'}, t5:{di:'res-med-di',pa:'res-med-pa'}};
                  const r = resMap[id];
                  if (r) {
                    usePetriStore.getState().setMarking(isPaused ? { [r.di]: 1, [r.pa]: 0 } : { [r.di]: 0, [r.pa]: 1 });
                  }
                  useDemoStore.getState().togglePaused(id);
                }} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ccc', background: useDemoStore.getState().pausedTransitions.has(id) ? '#fee2e2' : '#ecfdf5', color: useDemoStore.getState().pausedTransitions.has(id) ? '#991b1b' : '#0c4a6e', cursor: 'pointer', fontWeight: 600 }}>
            {id.toUpperCase()} {useDemoStore.getState().pausedTransitions.has(id) ? '⏸ Pause' : '▶ Disponible'}
          </button>
        ))}
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