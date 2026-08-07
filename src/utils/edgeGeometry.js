/**
 * Calcule le point sur le bord d'un CERCLE dans la direction d'un point cible
 */
function getCircleIntersection(cx, cy, radius, targetX, targetY) {
  const dx = targetX - cx;
  const dy = targetY - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: cx, y: cy };
  
  return {
    x: cx + (dx / distance) * radius,
    y: cy + (dy / distance) * radius,
  };
}

/**
 * Calcule le point sur le bord d'un RECTANGLE dans la direction d'un point cible
 */
function getRectangleIntersection(cx, cy, width, height, targetX, targetY) {
  const dx = targetX - cx;
  const dy = targetY - cy;
  
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  
  const halfW = width / 2;
  const halfH = height / 2;
  
  // Calculer le facteur d'échelle pour atteindre le bord
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  
  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

/**
 * Récupère le point de connexion optimal sur un nœud
 * @param {Object} node - nœud source ou cible
 * @param {number} targetX - coordonnée X de l'autre extrémité
 * @param {number} targetY - coordonnée Y de l'autre extrémité
 */
export function getNodeIntersection(node, targetX, targetY) {
  if (!node || !node.width || !node.height) {
    // Fallback : centre du nœud avec dimensions par défaut
    const w = node?.width || 60;
    const h = node?.height || 60;
    const cx = node.position.x + w / 2;
    const cy = node.position.y + h / 2;
    return { x: cx, y: cy };
  }
  
  const cx = node.position.x + node.width / 2;
  const cy = node.position.y + node.height / 2;
  
  if (node.type === 'place') {
    // Place : cercle
    const radius = node.width / 2;
    return getCircleIntersection(cx, cy, radius, targetX, targetY);
  } else {
    // Transition : rectangle
    return getRectangleIntersection(cx, cy, node.width, node.height, targetX, targetY);
  }
}

/**
 * Détermine la Position (Top/Bottom/Left/Right) la plus proche du point de sortie
 */
export function getEdgePosition(node, intersectionPoint) {
  const cx = node.position.x + (node.width || 60) / 2;
  const cy = node.position.y + (node.height || 60) / 2;
  
  const dx = intersectionPoint.x - cx;
  const dy = intersectionPoint.y - cy;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

/**
 * Calcule les paramètres complets pour dessiner un arc flottant entre deux nœuds
 */
export function getFloatingEdgeParams(sourceNode, targetNode) {
  if (!sourceNode || !targetNode) {
    return { sx: 0, sy: 0, tx: 0, ty: 0, sourcePos: 'right', targetPos: 'left' };
  }
  
  const targetCenterX = targetNode.position.x + (targetNode.width || 60) / 2;
  const targetCenterY = targetNode.position.y + (targetNode.height || 60) / 2;
  const sourceCenterX = sourceNode.position.x + (sourceNode.width || 60) / 2;
  const sourceCenterY = sourceNode.position.y + (sourceNode.height || 60) / 2;
  
  const sourceIntersection = getNodeIntersection(sourceNode, targetCenterX, targetCenterY);
  const targetIntersection = getNodeIntersection(targetNode, sourceCenterX, sourceCenterY);
  
  const sourcePos = getEdgePosition(sourceNode, sourceIntersection);
  const targetPos = getEdgePosition(targetNode, targetIntersection);
  
  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourcePos,
    targetPos,
  };
}