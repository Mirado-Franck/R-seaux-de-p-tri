import { useEffect } from 'react';
import usePetriStore from '../stores/usePetriStore';
import useUIStore from '../stores/useUIStore';
import { TOOL_MODES } from '../constants/defaults';

const isEditableTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

/**
 * Raccourcis clavier globaux de l'éditeur.
 * - V : sélection, P : ajouter place, T : ajouter transition
 * - A : arc, I : arc inhibiteur
 * - + / = : ajouter un jeton, - : retirer un jeton
 * - Suppr / Retour arrière : supprimer la sélection
 * - M : basculer la minimap
 * Les saisies dans les champs de texte sont ignorées.
 */
export default function useKeyboardShortcuts() {
  const setToolMode = usePetriStore((s) => s.setToolMode);
  const toolMode = usePetriStore((s) => s.toolMode);
  const deleteSelected = usePetriStore((s) => s.deleteSelected);
  const toggleMinimap = useUIStore((s) => s.toggleMinimap);

  useEffect(() => {
    const handler = (event) => {
      if (isEditableTarget(event.target)) return;

      // Suppression : ne pas intercepter si un champ est focus
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected();
        return;
      }

      // Évite les collisions avec les modifieurs
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      switch (key) {
        case 'v':
          setToolMode(TOOL_MODES.SELECT);
          break;
        case 'p':
          setToolMode(TOOL_MODES.ADD_PLACE);
          break;
        case 't':
          setToolMode(TOOL_MODES.ADD_TRANSITION);
          break;
        case 'a':
          setToolMode(TOOL_MODES.ADD_ARC);
          break;
        case 'i':
          setToolMode(TOOL_MODES.ADD_INHIBITOR);
          break;
        case '+':
        case '=':
          setToolMode(TOOL_MODES.ADD_TOKEN);
          break;
        case '-':
        case '_':
          setToolMode(TOOL_MODES.REMOVE_TOKEN);
          break;
        case 'm':
          toggleMinimap();
          break;
        case 'escape':
          setToolMode(TOOL_MODES.SELECT);
          break;
        default:
          return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, setToolMode, toggleMinimap]);

  return { toolMode };
}
