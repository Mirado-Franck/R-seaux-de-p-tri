import { useState, useCallback } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import { checkBoundedness, checkLiveness, detectConflicts } from '../../utils/propertyChecker';

const ResultCard = ({ title, result, color }) => (
  <div className={`p-3 rounded-lg border ${color}`}>
    <h4 className="text-sm font-semibold mb-1">{title}</h4>
    <p className="text-xs">{result.message}</p>
    {result.details && (
      <div className="mt-2 text-xs space-y-0.5">
        {Object.entries(result.details).map(([k, v]) => (
          <p key={k}>
            <span className="font-medium">{k}:</span> {String(v)}
          </p>
        ))}
      </div>
    )}
  </div>
);

const PropertyChecker = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);
  const [results, setResults] = useState(null);

  const handleCheck = useCallback(() => {
    const boundedness = checkBoundedness(nodes, edges);
    const liveness = checkLiveness(nodes, edges);
    const conflicts = detectConflicts(nodes, edges);
    setResults({ boundedness, liveness, conflicts });
  }, [nodes, edges]);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-base font-bold text-gray-800">Vérification des Propriétés</h3>

      <button
        onClick={handleCheck}
        className="w-full py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition"
      >
        Analyser les propriétés
      </button>

      {results && (
        <div className="space-y-3">
          {/* Bornage */}
          <ResultCard
            title="📏 Bornage"
            result={{
              message: results.boundedness.message,
              details: {
                'Borné': results.boundedness.bounded ? 'Oui' : 'Non',
                'Sauf (binaire)': results.boundedness.safe ? 'Oui' : 'Non',
                ...(results.boundedness.bounded ? { 'k-borné': results.boundedness.kBounded } : {}),
                'États explorés': results.boundedness.stateCount,
                ...(results.boundedness.maxTokens
                  ? Object.fromEntries(
                      Object.entries(results.boundedness.maxTokens).map(([k, v]) => [`Max ${k}`, v])
                    )
                  : {}),
              },
            }}
            color={
              results.boundedness.safe
                ? 'bg-green-50 border-green-200 text-green-800'
                : results.boundedness.bounded
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-800'
            }
          />

          {/* Vivacité */}
          <ResultCard
            title="🔄 Vivacité & Blocages"
            result={{
              message: results.liveness.message,
              details: {
                'Blocage': results.liveness.hasDeadlock ? `${results.liveness.deadlockCount} état(s)` : 'Aucun',
                'Quasi-vivant': results.liveness.quasiLive ? 'Oui' : 'Non',
                ...(results.liveness.deadTransitions.length > 0
                  ? { 'Transitions mortes': results.liveness.deadTransitions.join(', ') }
                  : {}),
                ...(results.liveness.hasDeadlock
                  ? { 'Marquages bloquants': results.liveness.deadlocks.join(', ') }
                  : {}),
              },
            }}
            color={
              results.liveness.hasDeadlock
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }
          />

          {/* Conflits */}
          <ResultCard
            title="⚡ Conflits"
            result={{
              message: results.conflicts.message,
              details: results.conflicts.hasConflicts
                ? Object.fromEntries(
                    results.conflicts.conflicts.map((c) => [
                      `Place ${c.place}`,
                      `${c.transitions.map((t) => t.label).join(' vs ')} ${c.isEffective ? '(effectif)' : '(structurel)'}`,
                    ])
                  )
                : {},
            }}
            color={
              results.conflicts.effectiveConflicts?.length > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : results.conflicts.hasConflicts
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-green-50 border-green-200 text-green-800'
            }
          />
        </div>
      )}
    </div>
  );
};

export default PropertyChecker;