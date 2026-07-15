import { useMemo } from 'react';
import usePetriStore from '../../stores/usePetriStore';
import { computeIncidenceMatrices } from '../../utils/matrixCalculations';
import '../../styles/editor.css';

const MatrixTable = ({ matrix, rowLabels, colLabels, title }) => {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="overflow-x-auto">
        <table className="matrix-table">
          <thead>
            <tr>
              <th></th>
              {colLabels.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th>{rowLabels[i]}</th>
                {row.map((val, j) => (
                  <td
                    key={j}
                    className={val > 0 ? 'positive' : val < 0 ? 'negative' : ''}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MatrixDisplay = () => {
  const nodes = usePetriStore((s) => s.nodes);
  const edges = usePetriStore((s) => s.edges);

  const matrices = useMemo(() => {
    if (nodes.length === 0) return null;
    return computeIncidenceMatrices(nodes, edges);
  }, [nodes, edges]);

  if (!matrices) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Ajoutez des éléments au réseau pour voir les matrices.
      </div>
    );
  }

  const { Pre, Post, W, placeLabels, transitionLabels } = matrices;

  return (
    <div className="p-4">
      <h3 className="text-base font-bold text-gray-800 mb-4">Matrices d'Incidence</h3>

      <MatrixTable
        matrix={Pre}
        rowLabels={placeLabels}
        colLabels={transitionLabels}
        title="Matrice Pre (Entrées)"
      />

      <MatrixTable
        matrix={Post}
        rowLabels={placeLabels}
        colLabels={transitionLabels}
        title="Matrice Post (Sorties)"
      />

      <MatrixTable
        matrix={W}
        rowLabels={placeLabels}
        colLabels={transitionLabels}
        title="Matrice W = Post - Pre (Incidence)"
      />

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-1">Marquage initial M₀</h4>
        <p className="text-sm font-mono text-blue-700">
          ({placeLabels.map((l, i) => {
            const place = nodes.find((n) => n.data.label === l);
            return place?.data.tokens || 0;
          }).join(', ')})
        </p>
      </div>
    </div>
  );
};

export default MatrixDisplay;