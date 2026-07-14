const { computeSongHash } = require('./songHash');

function dedupeSongs(existingHashes, songs) {
  const seen = new Set(existingHashes);
  const toInsert = [];
  const skipped = [];
  for (const s of songs) {
    const content_hash = computeSongHash(s.content);
    if (seen.has(content_hash)) {
      skipped.push({ index: s.index, reason: 'already_exists' });
      continue;
    }
    seen.add(content_hash);
    toInsert.push({ ...s, content_hash });
  }
  return { toInsert, skipped };
}

module.exports = { dedupeSongs };
