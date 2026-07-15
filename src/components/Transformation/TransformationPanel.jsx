import { useState, useCallback } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import { transformImpureToPure, transformCapacityToOrdinary } from '../../utils/transformations';

const TransformationPanel = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const importNet = usePetriStore((s) => s.importNet);
  const [result, setResult] = useState(null);

  const handleImpureToPure = useCallback(() => {
    const res = transformImpureToPure(nodes, edges);
    if (res.transformed) {
      importNet({ nodes: res.nodes, edges: res.edges });
    }
    setResult({ type: 'impureToPure', ...res });
  }, [nodes, edges, importNet]);

  const handleCapacityToOrdinary = useCallback(() => {
    const res = transformCapacityToOrdinary(nodes, edges);
    if (res.transformed) {
      importNet({ nodes: res.nodes, edges: res.edges });
    }
    setResult({ type: 'capacityToOrdinary', ...res });
  }, [nodes, edges, importNet]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-base font-bold text-gray-800">Transformations</h3>
      <p className="text-xs text-gray-500">
        Ces transformations modifient le réseau en place.
      </p>

      <div className="space-y-3">
        <div className="p-3 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">RdP Impur → Pur</h4>
          <p className="text-xs text-gray-500 mb-2">
            Élimine les boucles (P→T et T→P) en ajoutant des places intermédiaires P₀.
          </p>
          <button
            onClick={handleImpureToPure}
            className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
          >
            Transformer
          </button>
        </div>

        <div className="p-3 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">RdP à Capacité → Ordinaire</h4>
          <p className="text-xs text-gray-500 mb-2">
            Remplace les places à capacité K par des places avec complémentaires P'.
          </p>
          <button
            onClick={handleCapacityToOrdinary}
            className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition"
          >
            Transformer
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`p-3 rounded-lg text-sm ${
            result.transformed
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
};

export default TransformationPanel;