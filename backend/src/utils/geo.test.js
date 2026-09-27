const assert = require('node:assert/strict');
const test = require('node:test');
const { distanceKm, parseCoordinates, sortByDistance } = require('./geo');

test('calculates distance between coordinates in kilometers', () => {
  assert.equal(Number(distanceKm(0, 0, 0, 1).toFixed(1)), 111.2);
});

test('accepts valid coordinate query values and rejects out-of-range values', () => {
  assert.deepEqual(parseCoordinates({ latitude: '11.018', longitude: '76.97' }), {
    latitude: 11.018,
    longitude: 76.97,
  });
  assert.equal(parseCoordinates({ latitude: '91', longitude: '0' }), null);
  assert.equal(parseCoordinates({ latitude: '10' }), null);
});

test('sorts nearby records from closest to farthest', () => {
  const sorted = sortByDistance([
    { name: 'Far', latitude: 0, longitude: 2 },
    { name: 'Near', latitude: 0, longitude: 1 },
  ], 0, 0);
  assert.deepEqual(sorted.map((item) => item.name), ['Near', 'Far']);
});