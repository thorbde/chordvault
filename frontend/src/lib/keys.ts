export const ALL_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
export const ALL_KEYS_MINOR = ['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm'];

export const ENHARMONIC_MAP: Record<string, string> = {
  // Prefer sharps generally, but Bb and Eb are exceptions
  'Db': 'C#',
  'Gb': 'F#',
  'Ab': 'G#',
  'A#': 'Bb',
  'D#': 'Eb',
  'Dbm': 'C#m',
  'Gbm': 'F#m',
  'Abm': 'G#m',
  'A#m': 'Bbm',
  'D#m': 'Ebm',
};

export function normalizeKey(k: string): string {
  return ENHARMONIC_MAP[k] || k;
}

export function normalizeChord(chord: string): string {
  if (!chord) return chord;
  return chord.replace(/[A-G][b#]?m?/g, (m) => ENHARMONIC_MAP[m] || m);
}

export function getTransposeDelta(fromKey: string, toKey: string): number {
  const normFrom = normalizeKey(fromKey);
  const normTo = normalizeKey(toKey);
  if (normFrom === normTo) return 0;
  
  const isMinor = normFrom && normFrom.endsWith('m') && normFrom.length > 1;
  const keys = isMinor ? ALL_KEYS_MINOR : ALL_KEYS;
  
  const fromIdx = keys.indexOf(normFrom);
  const toIdx = keys.indexOf(normTo);
  if (fromIdx === -1 || toIdx === -1) return 0;
  
  let delta = toIdx - fromIdx;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  
  return delta;
}
