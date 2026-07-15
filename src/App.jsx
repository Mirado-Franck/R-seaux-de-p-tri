import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import PetriNetEditor from './components/Editor/PetriNetEditor';
import PropertiesPanel from './components/Editor/PropertiesPanel';
import SimulationControls from './components/Simulation/SimulationControls';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import PropertyChecker from './components/Properties/PropertyChecker';
import TransformationPanel from './components/Transformation/TransformationPanel';
import useUIStore from './stores/useUIStore';
import {
  Settings,
  Play,
  BarChart3,
  ShieldCheck,
  Shuffle,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

const TABS = [
  { id: 'properties', label: 'Propriétés', icon: Settings },
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'analysis', label: 'Analyse', icon: BarChart3 },
  { id: 'verification', label: 'Vérification', icon: ShieldCheck },
  { id: 'transformation', label: 'Transformation', icon: Shuffle },
];

function App() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const [activeTab, setActiveTab] = useState('properties');

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        {/* Zone éditeur */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <PetriNetEditor />
        </div>

        {/* Bouton toggle panel */}
        <button
          onClick={toggleRightPanel}
          style={{
            position: 'absolute',
            right: rightPanelOpen ? 361 : 1,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px 0 0 8px',
            padding: '8px 4px',
            cursor: 'pointer',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
            transition: 'right 0.3s ease',
          }}
        >
          {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>

        {/* Panneau latéral droit */}
        {rightPanelOpen && (
          <div className="side-panel">
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={label}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    border: 'none',
                    background: activeTab === id ? 'white' : 'transparent',
                    borderBottom: activeTab === id ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    color: activeTab === id ? '#2563eb' : '#6b7280',
                    transition: 'all 0.15s ease',
                    fontSize: '10px',
                    fontWeight: activeTab === id ? 600 : 400,
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenu du tab */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 'properties' && <PropertiesPanel />}
              {activeTab === 'simulation' && <SimulationControls />}
              {activeTab === 'analysis' && <AnalysisPanel />}
              {activeTab === 'verification' && <PropertyChecker />}
              {activeTab === 'transformation' && <TransformationPanel />}
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;