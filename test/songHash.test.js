const test = require('node:test');
const assert = require('node:assert/strict');
const { computeSongHash, normalizeForHash } = require('../lib/songHash');

test('normalizeForHash: CRLF and CR both become LF', () => {
  assert.equal(normalizeForHash('a\r\nb\rc'), 'a\nb\nc');
});

test('normalizeForHash: strips trailing whitespace per line', () => {
  assert.equal(normalizeForHash('a   \nb\t'), 'a\nb');
});

test('normalizeForHash: collapses 3+ blank lines and trims ends', () => {
  assert.equal(normalizeForHash('\n\nx\n\n\n\ny\n\n'), 'x\n\ny');
});

test('computeSongHash: same song with \\r\\n vs \\n → same hash', () => {
  const a = '{title: Amazing Grace}\r\n[G]Amazing [C]grace  \r\n';
  const b = '{title: Amazing Grace}\n[G]Amazing [C]grace\n';
  assert.equal(computeSongHash(a), computeSongHash(b));
});

test('computeSongHash: different chords → different hash', () => {
  assert.notEqual(computeSongHash('{title: X}\n[G]hi'), computeSongHash('{title: X}\n[A]hi'));
});

test('computeSongHash: returns 64-char hex', () => {
  assert.match(computeSongHash('anything'), /^[0-9a-f]{64}$/);
});
