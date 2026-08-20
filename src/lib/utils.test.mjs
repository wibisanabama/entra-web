import test from 'node:test';
import assert from 'node:assert/strict';

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPgText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.Valid && typeof val.String === 'string') return val.String;
  return '';
}

test('getInitials extracts initials accurately', () => {
  assert.equal(getInitials('John Doe'), 'JD');
  assert.equal(getInitials('Alice'), 'AL');
  assert.equal(getInitials('Budi Santoso Wibowo'), 'BW');
  assert.equal(getInitials(''), '');
});

test('getPgText unwraps postgres nullable text structs', () => {
  assert.equal(getPgText('plain string'), 'plain string');
  assert.equal(getPgText({ Valid: true, String: 'unwrapped text' }), 'unwrapped text');
  assert.equal(getPgText({ Valid: false, String: '' }), '');
  assert.equal(getPgText(null), '');
  assert.equal(getPgText(undefined), '');
});
