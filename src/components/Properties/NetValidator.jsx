import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import usePetriStore from '../../stores/usePetriStore';
import { validatePetriNet } from '../../utils/petriNetValidator';

const IssueItem = ({ icon: Icon, color, message, code }) => (
  <div className={`flex gap-2 p-2 rounded border ${color}`}>
    <Icon size={16} className="flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs leading-tight">{message}</p>
      {code && <p className="text-[10px] opacity-60 mt-0.5 font-mono">{code}</p>}
    </div>
  </div>
);

const NetValidator = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);

  const validation = useMemo(() => validatePetriNet(nodes, edges), [nodes, edges]);

  const { errors, warnings, info, isValid, stats } = validation;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-base font-bold text-gray-800">Validation du Réseau</h3>

      {/* Statut global */}
      <div
        className={`p-4 rounded-lg border-2 ${
          isValid
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle2 size={32} className="text-green-600" />
          ) : (
            <XCircle size={32} className="text-red-600" />
          )}
          <div>
            <h4 className={`font-bold ${isValid ? 'text-green-800' : 'text-red-800'}`}>
              {isValid ? 'Réseau Valide ✓' : 'Réseau Invalide ✗'}
            </h4>
            <p className="text-xs text-gray-600">
              {errors.length} erreur(s), {warnings.length} avertissement(s), {info.length} info(s)
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <div className="font-semibold text-blue-800">{stats.places}</div>
          <div className="text-blue-600">Places</div>
        </div>
        <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
          <div className="font-semibold text-emerald-800">{stats.transitions}</div>
          <div className="text-emerald-600">Transitions</div>
        </div>
        <div className="p-2 bg-gray-50 rounded border border-gray-200">
          <div className="font-semibold text-gray-800">{stats.arcs}</div>
          <div className="text-gray-600">Arcs normaux</div>
        </div>
        <div className="p-2 bg-red-50 rounded border border-red-200">
          <div className="font-semibold text-red-800">{stats.inhibitorArcs}</div>
          <div className="text-red-600">Arcs inhibiteurs</div>
        </div>
        <div className="p-2 bg-amber-50 rounded border border-amber-200 col-span-2">
          <div className="font-semibold text-amber-800">{stats.totalTokens}</div>
          <div className="text-amber-600">Total jetons dans M₀</div>
        </div>
      </div>

      {/* Erreurs */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1">
            <XCircle size={14} /> Erreurs ({errors.length})
          </h4>
          <div className="space-y-1.5">
            {errors.map((err, i) => (
              <IssueItem
                key={i}
                icon={XCircle}
                color="bg-red-50 border-red-200 text-red-800"
                message={err.message}
                code={err.code}
              />
            ))}
          </div>
        </div>
      )}

      {/* Avertissements */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-1">
            <AlertTriangle size={14} /> Avertissements ({warnings.length})
          </h4>
          <div className="space-y-1.5">
            {warnings.map((warn, i) => (
              <IssueItem
                key={i}
                icon={AlertTriangle}
                color="bg-amber-50 border-amber-200 text-amber-800"
                message={warn.message}
                code={warn.code}
              />
            ))}
          </div>
        </div>
      )}

      {/* Informations */}
      {info.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-1">
            <Info size={14} /> Informations ({info.length})
          </h4>
          <div className="space-y-1.5">
            {info.map((i, idx) => (
              <IssueItem
                key={idx}
                icon={Info}
                color="bg-blue-50 border-blue-200 text-blue-800"
                message={i.message}
                code={i.code}
              />
            ))}
          </div>
        </div>
      )}

      {/* Guide de complétude */}
      {isValid && (
        <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            📋 Checklist de complétude
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-700">
            <li className="flex items-start gap-2">
              <span>{stats.places > 0 ? '✅' : '⬜'}</span>
              <span>Au moins une place</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{stats.transitions > 0 ? '✅' : '⬜'}</span>
              <span>Au moins une transition</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{stats.arcs + stats.inhibitorArcs > 0 ? '✅' : '⬜'}</span>
              <span>Au moins un arc</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{stats.totalTokens > 0 ? '✅' : '⬜'}</span>
              <span>Marquage initial défini (M₀)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{stats.isolatedNodes === 0 ? '✅' : '⬜'}</span>
              <span>Aucun nœud isolé</span>
            </li>
            <li className="flex items-start gap-2">
              <span>{errors.length === 0 ? '✅' : '⬜'}</span>
              <span>Aucune erreur de structure</span>
            </li>
          </ul>
          <p className="text-[10px] text-gray-500 mt-3 italic">
            Ensuite, allez dans l'onglet <b>Vérification</b> pour analyser bornage, vivacité et conflits.
          </p>
        </div>
      )}
    </div>
  );
};

export default NetValidator;