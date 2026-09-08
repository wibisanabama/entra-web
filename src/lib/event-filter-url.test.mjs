import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCompiledModule } from '../test-helpers/component-loader.mjs';

const { parseEventFilters, serializeEventFilters } = await loadCompiledModule('src/lib/event-filter-url.ts');

test('event filters round-trip through the URL', () => {
  const query = serializeEventFilters({
    query: 'musik',
    category: 'concert',
    date: 'THIS_MONTH',
    city: 'Bandung',
    price: 'PAID',
    sort: 'NEWEST',
  });

  assert.deepEqual(parseEventFilters(new URLSearchParams(query)), {
    query: 'musik',
    category: 'concert',
    date: 'THIS_MONTH',
    city: 'Bandung',
    price: 'PAID',
    sort: 'NEWEST',
  });
});

test('event filters reject unsupported enum values', () => {
  const result = parseEventFilters(new URLSearchParams('date=NEVER&price=UNKNOWN&sort=RANDOM'));
  assert.equal(result.date, 'ALL');
  assert.equal(result.price, 'ALL');
  assert.equal(result.sort, 'EARLIEST');
});
