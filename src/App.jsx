import { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import PetriNetEditor from './components/Editor/PetriNetEditor';
import PropertiesPanel from './components/Editor/PropertiesPanel';
import SimulationControls from './components/Simulation/SimulationControls';
import AnalysisPanel from './components/Analysis/AnalysisPanel';
import PropertyChecker from './components/Properties/PropertyChecker';
import NetValidator from './components/Properties/NetValidator';  // ← AJOUT
import TransformationPanel from './components/Transformation/TransformationPanel';
import useUIStore from './stores/useUIStore';
import usePetriStore from './stores/usePetriStore';
import projectMedical from './data/project_medical.json';
import {
  Settings,
  Play,
  BarChart3,
  ShieldCheck,
  Shuffle,
  CheckSquare,               // ← AJOUT
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

const TABS = [
  { id: 'properties', label: 'Propriétés', icon: Settings },
  { id: 'validator', label: 'Validation', icon: CheckSquare },   // ← AJOUT
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'analysis', label: 'Analyse', icon: BarChart3 },
  { id: 'verification', label: 'Vérification', icon: ShieldCheck },
  { id: 'transformation', label: 'Transformation', icon: Shuffle },
];

function App() {
  const rightPanelOpen = useUIStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useUIStore((s) => s.toggleRightPanel);
  const [activeTab, setActiveTab] = useState('properties');
  const nodes = usePetriStore((s) => s.nodes);

  const netData = projectMedical.net || (projectMedical.nodes ? { nodes: projectMedical.nodes, edges: projectMedical.edges } : null);
  const sysName = projectMedical.systemName || 'Système de visite médical chez le médecin';
  const sysDesc = projectMedical.description || 'Parcours médical : prise de poids → tension → médecin → sortie';
  const legendData = legendData || [];
  const defaultN = projectMedical.n || (netData && netData.nodes ? (netData.nodes.find((n: any) => n.id === 'place-attente')?.data?.tokens ?? 10) : 10);

  useEffect(() => {
    if (nodes.length === 0 && netData) {
      usePetriStore.getState().importNet(netData);
      usePetriStore.getState().setMarking({ 'place-attente': defaultN });
    }
  }, [nodes.length, netData, defaultN]);


  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg, #0c4a6e 0%, #0e7490 60%, #14b8a6 100%)', color: 'white', fontWeight: 600, fontSize: '15px', letterSpacing: '0.3px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
            🏥 {sysName}
            <span style={{ float: 'right', fontWeight: 400, fontSize: '12px', opacity: 0.9 }}>{sysDesc}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '8px 16px', background: '#f0fdfa', borderBottom: '1px solid #ccfbf1', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0c4a6e', whiteSpace: 'nowrap' }}>
              👥 Nombre de personnes (n) :
            </div>
            <input
              type="number"
              min={1}
              max={100}
              defaultValue={projectMedical.n}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val > 0) usePetriStore.getState().setMarking({ 'place-attente': val });
              }}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #99f6e4', width: '70px', fontWeight: 600, color: '#0c4a6e', background: '#fff' }}
            />
            <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>(chaque service traite 1 personne)</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Légende :</span>
            {legendData?.map((item) => (
              <button
                key={item.id}
                onClick={() => alert(item.id + ' : ' + item.label)}
                style={{
                  background: item.type === 'place' ? '#e0f2f1' : '#ecfdf5',
                  border: '1px solid ' + (item.type === 'place' ? '#99f6e4' : '#a7f3d0'),
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0c4a6e',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
                title={item.label}
              >
                <span style={{ fontWeight: 800 }}>{item.id}</span> — {item.label}
              </button>
            ))}
          </div>
          <PetriNetEditor />
        </div>

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

        {rightPanelOpen && (
          <div className="side-panel">
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              overflowX: 'auto',
            }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  title={label}
                  style={{
                    flex: 1,
                    minWidth: '60px',
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

            <div style={{ flex: 1, overflow: 'auto' }}>
              {activeTab === 'properties' && <PropertiesPanel />}
              {activeTab === 'validator' && <NetValidator />}    {/* ← AJOUT */}
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