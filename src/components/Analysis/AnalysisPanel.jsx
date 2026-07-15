import { useState } from 'react';
import MatrixDisplay from './MatrixDisplay';
import EvolutionCalculator from './EvolutionCalculator';
import ReachabilityGraphView from './ReachabilityGraphView';

const tabs = [
  { id: 'matrices', label: 'Matrices' },
  { id: 'evolution', label: 'Évolution' },
  { id: 'reachability', label: 'Graphe de Marquage' },
];

const AnalysisPanel = () => {
  const [activeTab, setActiveTab] = useState('matrices');

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-xs font-medium transition ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'matrices' && <MatrixDisplay />}
      {activeTab === 'evolution' && <EvolutionCalculator />}
      {activeTab === 'reachability' && <ReachabilityGraphView />}
    </div>
  );
};

export default AnalysisPanel;