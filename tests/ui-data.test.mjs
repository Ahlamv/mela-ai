import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { count, countLabel, FIELD_LIMITS, forecastSeries, isShopData, money, nameError, salesTotal, unitLabel, units } from '../lib/demo-data.ts';
import { createReviewData, entryReviewData, reviewModes } from '../lib/review-data.ts';
import { pageBounds } from '../lib/pagination.ts';

test('all review modes use valid shop data and remain within new-entry name limits', () => {
  for (const mode of reviewModes) {
    const data = createReviewData(mode);
    assert.ok(isShopData(data), mode);
    assert.ok(data.products.every(p => p.name.length <= FIELD_LIMITS.productName), mode);
    assert.ok(data.shopName.length <= FIELD_LIMITS.shopName, mode);
  }
  assert.equal(createReviewData('huge').products.length, 1284);
  assert.equal(createReviewData('huge').sales.length, 1284);
  assert.ok(entryReviewData.email.length <= FIELD_LIMITS.email);
});

test('counts, singulars and known stock units display correctly', () => {
  assert.equal(count(1234567), '1,234,567');
  assert.equal(countLabel(0, 'product'), '0 products');
  assert.equal(countLabel(1, 'sale'), '1 sale');
  assert.equal(countLabel(1284, 'record'), '1,284 records');
  assert.equal(units(1, 'box'), '1 box');
  assert.equal(units(2, 'box'), '2 boxes');
  assert.equal(units(1284, 'bottle'), '1,284 bottles');
  assert.equal(units(2, 'kg'), '2 kg');
  assert.equal(unitLabel(2, 'case of 24 bottles'), 'case of 24 bottles');
  assert.equal(money(0.1 + 0.2), '0.3');
});

test('pagination covers empty, one, exact-page, next-page and large-list boundaries', () => {
  assert.deepEqual(pageBounds(0, 1), { page: 1, pages: 1, start: 0, end: 0 });
  assert.deepEqual(pageBounds(1, 1), { page: 1, pages: 1, start: 0, end: 1 });
  assert.deepEqual(pageBounds(40, 2), { page: 1, pages: 1, start: 0, end: 40 });
  assert.deepEqual(pageBounds(41, 2), { page: 2, pages: 2, start: 40, end: 41 });
  assert.deepEqual(pageBounds(1284, 33), { page: 33, pages: 33, start: 1280, end: 1284 });
  assert.equal(pageBounds(41, -1).page, 1);
  const rows = Array.from({ length: 1284 }, (_, i) => i);
  const rendered = [];
  for (let page = 1; page <= 33; page++) {
    const { start, end } = pageBounds(rows.length, page);
    assert.ok(end - start <= 40);
    rendered.push(...rows.slice(start, end));
  }
  assert.deepEqual(rendered, rows);
});

test('undated forecasts use relative days; dated ones preserve the snapshot period', () => {
  const values = [1, 0, 2, 0, 3, 0, 4];
  const undated = forecastSeries(values);
  assert.equal(undated[0].day, 'Day 1');
  assert.equal(undated[6].date, 'Day 7');
  assert.equal(forecastSeries(values, 'invalid')[0].date, 'Day 1');
  const dated = forecastSeries(values, '2026-10-25T10:00:00Z');
  assert.equal(dated[0].date, '26 Oct');
  assert.equal(dated[6].date, '1 Nov');
  assert.equal(forecastSeries(null), undefined);
  assert.equal(forecastSeries([0, 0, 0, 0, 0, 0, 0])[0].quantity, 0);
});

test('name limits reject new overlong names without discarding legacy names', () => {
  assert.ok(nameError(' ', FIELD_LIMITS.productName));
  const legacy = 'Extra virgin cold-pressed sunflower cooking oil for family and restaurant kitchens · refill 5 litres';
  assert.ok(nameError(legacy, FIELD_LIMITS.productName));
  assert.equal(nameError(legacy, FIELD_LIMITS.productName, legacy), '');
  assert.ok(nameError(`${legacy} plus`, FIELD_LIMITS.productName, legacy));
  assert.ok(isShopData({ ...createReviewData('demo'), shopName: legacy }));
});

test('sale aggregates use safe cents and never present an unsupported total as exact', () => {
  assert.equal(salesTotal([{ total: 0.1 }, { total: 0.2 }]), 0.3);
  assert.equal(salesTotal([]), 0);
  assert.equal(salesTotal([{ total: 90071992547409 }, { total: 90071992547409 }]), null);
  assert.equal(money(null), 'Unavailable');
});

test('functional CSS no longer contains font sizes below 12px', () => {
  for (const file of ['../app/globals.css', '../components/entry-flow.module.css']) {
    const css = readFileSync(new URL(file, import.meta.url), 'utf8');
    const small = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].filter(match => Number(match[1]) < 12);
    assert.deepEqual(small.map(match => match[0]), [], file);
  }
});
