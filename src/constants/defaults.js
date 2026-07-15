export const NODE_TYPES = {
  PLACE: 'place',
  TRANSITION: 'transition',
};

export const EDGE_TYPES = {
  ARC: 'arc',
  INHIBITOR: 'inhibitor',
};

export const TOOL_MODES = {
  SELECT: 'select',
  ADD_PLACE: 'addPlace',
  ADD_TRANSITION: 'addTransition',
  ADD_ARC: 'addArc',
  ADD_INHIBITOR: 'addInhibitor',
  ADD_TOKEN: 'addToken',
  REMOVE_TOKEN: 'removeToken',
};

export const DEFAULT_PLACE = {
  tokens: 0,
  capacity: Infinity,
  label: '',
};

export const DEFAULT_TRANSITION = {
  label: '',
  enabled: false,
};

export const DEFAULT_ARC = {
  weight: 1,
  type: EDGE_TYPES.ARC,
};

export const PANEL_TABS = {
  PROPERTIES: 'properties',
  SIMULATION: 'simulation',
  ANALYSIS: 'analysis',
  VERIFICATION: 'verification',
  TRANSFORMATION: 'transformation',
};