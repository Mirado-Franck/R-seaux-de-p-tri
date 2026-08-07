import { useState, useMemo } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import {
  computeIncidenceMatrices,
  computeEvolution,
  isValidMarking,
  firingSequenceToVector,
  simulateSequence,
} from '../../utils/matrixCalculations';
import { NODE_TYPES } from '../../constants/defaults';

const EvolutionCalculator = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const [sequenceInput, setSequenceInput] = useState('');
  const [result, setResult] = useState(null);

  const matrices = useMemo(() => {
    if (nodes.length === 0) return null;
    return computeIncidenceMatrices(nodes, edges);
  }, [nodes, edges]);

  const places = useMemo(
    () =>
      nodes
        .filter((n) => n.type === NODE_TYPES.PLACE)
        .sort((a, b) =>
          a.data.label.localeCompare(b.data.label, undefined, { numeric: true })
        ),
    [nodes]
  );

  const handleCalculate = () => {
    if (!matrices) return;

    const { W, placeLabels, transitionLabels, transitionIds } = matrices;
    const Mi = places.map((p) => p.data.tokens);

    // Parser la séquence (ex: "T1, T2, T1" ou "T1 T2 T1")
    const sequence = sequenceInput
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sequence.length === 0) {
      setResult({ empty: true });
      return;
    }

    const S = firingSequenceToVector(sequence, transitionLabels);

    // Calcul algébrique ( Mk = Mi + W·S^T ), utile pour l'affichage
    const MkAlgebraic = computeEvolution(Mi, W, S);
    const algebraicallyValid = isValidMarking(MkAlgebraic);

    // Simulation pas à pas (gère arcs inhibiteurs et capacités)
    const sim = simulateSequence(Mi, sequence, {
      edges,
      transitionIds,
      transitionLabels,
      places,
    });

    setResult({
      Mi,
      S,
      sequence,
      placeLabels,
      transitionLabels,
      MkAlgebraic,
      algebraicallyValid,
      simulation: sim,
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
      <p className="text-xs text-gray-500 -mt-2">
        La simulation pas à pas vérifie en plus la franchissabilité, les arcs
        inhibiteurs et les capacités.
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCalculate();
          }}
        />
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
      >
        Calculer M<sub>k</sub>
      </button>

      {result && result.empty && (
        <p className="text-xs text-amber-600">Saisissez une séquence non vide.</p>
      )}

      {result && !result.empty && (
        <div className="space-y-3">
          <div
            className={`p-3 rounded-lg ${
              result.simulation.feasible ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
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
                <span className="font-medium text-gray-600">
                  M<sub>k</sub> (simulation) ={' '}
                </span>
                <span
                  className={`font-mono font-bold ${
                    result.simulation.feasible
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  ({result.simulation.marking.join(', ')})
                </span>
              </p>

              {!result.simulation.feasible && (
                <p className="text-red-600 text-xs font-medium mt-1">
                  ⚠ Séquence non réalisable à l'étape{' '}
                  <b>
                    {result.simulation.failedAt + 1} (
                    {result.simulation.failedLabel})
                  </b>
                  {result.simulation.reason &&
                  result.simulation.reason !== 'unknown'
                    ? ` : ${result.simulation.reason}`
                    : result.simulation.reason === 'unknown'
                    ? ' : transition inconnue'
                    : ''}
                  .
                </p>
              )}
            </div>
          </div>

          {!result.algebraicallyValid && result.simulation.feasible && (
            <p className="text-xs text-amber-600">
              Remarque : la formule algébrique donnerait des jetons négatifs,
              mais la simulation pas à pas reste valide (cas d'arcs inhibiteurs
              ou de séquences particulières).
            </p>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 font-medium">
              Voir le détail des marquages intermédiaires (
              {result.simulation.steps.length})
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {result.simulation.steps.map((step) => (
                <div
                  key={step.index}
                  className="font-mono p-1.5 bg-white border border-gray-100 rounded"
                >
                  <span className="text-gray-400">#{step.index}</span>{' '}
                  {step.label && (
                    <span className="text-blue-600">[{step.label}]</span>
                  )}{' '}
                  <span className="text-gray-700">
                    ({step.marking.join(', ')})
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default EvolutionCalculator;
