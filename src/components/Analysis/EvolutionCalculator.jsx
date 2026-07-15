import { useState, useMemo } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import { computeIncidenceMatrices, computeEvolution, isValidMarking, firingSequenceToVector } from '../../utils/matrixCalculations';

const EvolutionCalculator = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const [sequenceInput, setSequenceInput] = useState('');
  const [result, setResult] = useState(null);

  const matrices = useMemo(() => {
    if (nodes.length === 0) return null;
    return computeIncidenceMatrices(nodes, edges);
  }, [nodes, edges]);

  const handleCalculate = () => {
    if (!matrices) return;

    const { W, placeLabels, transitionLabels } = matrices;
    const Mi = placeLabels.map((l) => {
      const place = nodes.find((n) => n.data.label === l);
      return place?.data.tokens || 0;
    });

    // Parser la séquence (ex: "T1, T2, T1" ou "T1 T2 T1")
    const sequence = sequenceInput
      .split(/[\s,;]+/)
      .filter((s) => s.trim().length > 0);

    const S = firingSequenceToVector(sequence, transitionLabels);
    const Mk = computeEvolution(Mi, W, S);
    const valid = isValidMarking(Mk);

    setResult({
      Mi,
      Mk,
      S,
      sequence,
      valid,
      placeLabels,
      transitionLabels,
    });
  };

  if (!matrices) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Construisez un réseau pour utiliser le calculateur.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-base font-bold text-gray-800">Calcul d'Évolution</h3>
      <p className="text-xs text-gray-500">
        Formule : M<sub>k</sub> = M<sub>i</sub> + W · S<sup>T</sup>
      </p>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Séquence de tir (ex: T1, T2, T1)
        </label>
        <input
          type="text"
          value={sequenceInput}
          onChange={(e) => setSequenceInput(e.target.value)}
          placeholder="T1, T2, T3..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
      >
        Calculer Mk
      </button>

      {result && (
        <div className={`p-3 rounded-lg ${result.valid ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-gray-600">M₀ = </span>
              <span className="font-mono">({result.Mi.join(', ')})</span>
            </p>
            <p>
              <span className="font-medium text-gray-600">S = </span>
              <span className="font-mono">({result.S.join(', ')})</span>
              <span className="text-xs text-gray-400 ml-1">
                [{result.transitionLabels.join(', ')}]
              </span>
            </p>
            <p>
              <span className="font-medium text-gray-600">M<sub>k</sub> = </span>
              <span className={`font-mono font-bold ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                ({result.Mk.join(', ')})
              </span>
            </p>
            {!result.valid && (
              <p className="text-red-600 text-xs font-medium mt-1">
                ⚠ Marquage invalide (valeurs négatives) — Séquence non réalisable.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvolutionCalculator;