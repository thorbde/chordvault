const crypto = require('crypto');

function normalizeForHash(content) {
  return String(content)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function computeSongHash(content) {
  return crypto.createHash('sha256').update(normalizeForHash(content)).digest('hex');
}

module.exports = { normalizeForHash, computeSongHash };
