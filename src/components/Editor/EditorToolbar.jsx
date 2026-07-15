import { useCallback } from 'react';
import {
  MousePointer2,
  Circle,
  RectangleHorizontal,
  ArrowRight,
  Ban,
  Plus,
  Minus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import usePetriStore from '../../stores/usePetriStore';
import useSimulationStore from '../../stores/useSimulationStore';
import { TOOL_MODES } from '../../constants/defaults';
import '../../styles/editor.css';

const tools = [
  { mode: TOOL_MODES.SELECT, icon: MousePointer2, label: 'Sélection', shortcut: 'V' },
  { mode: TOOL_MODES.ADD_PLACE, icon: Circle, label: 'Place', shortcut: 'P' },
  { mode: TOOL_MODES.ADD_TRANSITION, icon: RectangleHorizontal, label: 'Transition', shortcut: 'T' },
  { mode: TOOL_MODES.ADD_ARC, icon: ArrowRight, label: 'Arc', shortcut: 'A' },
  { mode: TOOL_MODES.ADD_INHIBITOR, icon: Ban, label: 'Arc Inhibiteur', shortcut: 'I' },
  { mode: TOOL_MODES.ADD_TOKEN, icon: Plus, label: 'Ajouter Jeton', shortcut: '+' },
  { mode: TOOL_MODES.REMOVE_TOKEN, icon: Minus, label: 'Retirer Jeton', shortcut: '-' },
];

const EditorToolbar = () => {
  const toolMode = usePetriStore((s) => s.toolMode);
  const setToolMode = usePetriStore((s) => s.setToolMode);
  const deleteSelected = usePetriStore((s) => s.deleteSelected);
  const clearAll = usePetriStore((s) => s.clearAll);
  const exportNet = usePetriStore((s) => s.exportNet);
  const importNet = usePetriStore((s) => s.importNet);
  const updateAllTransitionsEnabled = usePetriStore((s) => s.updateAllTransitionsEnabled);
  const getMarkingObject = usePetriStore((s) => s.getMarkingObject);
  const saveInitialMarking = useSimulationStore((s) => s.saveInitialMarking);
  const resetSimulation = useSimulationStore((s) => s.resetSimulation);

  const handleExport = useCallback(() => {
    const json = exportNet();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'petri-net.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportNet]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = importNet(ev.target.result);
        if (!success) alert('Fichier invalide');
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importNet]);

  const handleClear = useCallback(() => {
    if (confirm('Supprimer tout le réseau ?')) {
      clearAll();
      resetSimulation();
    }
  }, [clearAll, resetSimulation]);

  const handleStartSim = useCallback(() => {
    updateAllTransitionsEnabled();
    saveInitialMarking(getMarkingObject());
  }, [updateAllTransitionsEnabled, saveInitialMarking, getMarkingObject]);

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {tools.map(({ mode, icon: Icon, label, shortcut }) => (
          <button
            key={mode}
            className={`toolbar-btn ${toolMode === mode ? 'active' : ''}`}
            onClick={() => setToolMode(mode)}
            title={`${label} (${shortcut})`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={handleStartSim} title="Activer la simulation">
          <RotateCcw size={16} />
          <span className="hidden sm:inline">Simuler</span>
        </button>
      </div>

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={deleteSelected} title="Supprimer sélection (Del)">
          <Trash2 size={16} />
        </button>
        <button className="toolbar-btn danger" onClick={handleClear} title="Tout effacer">
          <Trash2 size={16} />
          <span className="hidden sm:inline">Tout</span>
        </button>
      </div>

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={handleExport} title="Exporter JSON">
          <Download size={16} />
        </button>
        <button className="toolbar-btn" onClick={handleImport} title="Importer JSON">
          <Upload size={16} />
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;