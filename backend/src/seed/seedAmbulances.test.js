const assert = require('node:assert/strict');
const test = require('node:test');
const { demoAmbulances } = require('./seedAmbulances');

test('ambulance seed records are unmistakable unavailable placeholders', () => {
  assert.ok(demoAmbulances.length > 0);
  for (const ambulance of demoAmbulances) {
    assert.match(ambulance.name, /^DEMO ONLY/);
    assert.match(ambulance.provider, /placeholder/i);
    assert.equal(ambulance.available, false);
    assert.equal(ambulance.phone, '0000000000');
  }
});