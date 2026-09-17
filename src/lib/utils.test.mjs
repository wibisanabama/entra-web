import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCompiledModule } from '../test-helpers/component-loader.mjs';

const { getInitials, getPgText, formatDateRange } = await loadCompiledModule('src/lib/utils.ts');

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

test('formatDateRange formats dates cleanly and without awkward abbreviations', () => {
  // Rentang bulan & tahun yang sama: "15 - 16 September 2026"
  const sameMonth1 = '2026-09-15T10:00:00Z';
  const sameMonth2 = '2026-09-16T10:00:00Z';
  assert.equal(formatDateRange(sameMonth1, sameMonth2), '15 - 16 September 2026');

  // Satu hari saja: "15 September 2026"
  assert.equal(formatDateRange(sameMonth1), '15 September 2026');
  assert.equal(formatDateRange(sameMonth1, sameMonth1), '15 September 2026');

  // Beda bulan, tahun yang sama: "15 Agustus - 16 September 2026"
  const diffMonth1 = '2026-08-15T10:00:00Z';
  assert.equal(formatDateRange(diffMonth1, sameMonth2), '15 Agustus - 16 September 2026');

  // Beda tahun: "15 Desember 2025 - 16 Januari 2026"
  const diffYear1 = '2025-12-15T10:00:00Z';
  const diffYear2 = '2026-01-16T10:00:00Z';
  assert.equal(formatDateRange(diffYear1, diffYear2), '15 Desember 2025 - 16 Januari 2026');

  // Fallback nilai kosong
  assert.equal(formatDateRange(''), 'Tanggal Belum Ditentukan');
  assert.equal(formatDateRange(undefined), 'Tanggal Belum Ditentukan');
});
