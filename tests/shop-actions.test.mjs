import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData, isShopData, restock } from '../lib/demo-data.ts';
import { recordSale, recordReceipt, saveProductDetails } from '../lib/shop-actions.ts';

test('sale updates stock, historic totals and restock together without mutating the original', () => {
  const original = createDemoData();
  const result = recordSale(original, 'oil', 2, 'sale-1');
  assert.equal(original.products[0].stock, 10);
  assert.equal(result.products[0].stock, 8);
  assert.equal(result.sales[0].total, 640);
  assert.equal(restock(result.products[0]), 27);
  assert.ok(isShopData(result));
});
test('retrying the same sale or stock receipt does not apply it twice', () => {
  const sold = recordSale(createDemoData(), 'oil', 2, 'sale-1');
  assert.equal(recordSale(sold, 'oil', 2, 'sale-1'), sold);
  const received = recordReceipt(sold, 'oil', 5, 'receipt-1');
  assert.equal(received.products[0].stock, 13);
  assert.equal(restock(received.products[0]), 22);
  assert.equal(recordReceipt(received, 'oil', 5, 'receipt-1'), received);
});
test('rejects invalid, missing and out-of-stock sales', () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity, 11]) assert.throws(() => recordSale(createDemoData(), 'oil', quantity, 'bad'));
  assert.throws(() => recordSale(createDemoData(), 'soap', 1, 'bad'));
  assert.throws(() => recordSale(createDemoData(), 'missing', 1, 'bad'));
});
test('rejects unsafe totals and overflowing stock quantities', () => {
  const data = createDemoData();
  data.products[0].stock = Number.MAX_SAFE_INTEGER;
  assert.throws(() => recordReceipt(data, 'oil', 1, 'overflow'));
  assert.throws(() => recordSale(data, 'oil', Number.MAX_SAFE_INTEGER, 'overflow'));
});
test('editing a product preserves historic sales, stock and stock unit', () => {
  const data = recordSale(createDemoData(), 'oil', 2, 'historic-sale');
  const updated = saveProductDetails(data, { ...data.products[0], price: 999, name: 'Updated oil', stock: 999, unit: 'box' }, true);
  assert.equal(updated.sales[0].total, 640);
  assert.equal(updated.sales[0].productName, 'Cooking oil · 1 L');
  assert.equal(updated.products[0].stock, 8);
  assert.equal(updated.products[0].unit, 'bottle');
});
test('new product retries are idempotent and no history never creates demand', () => {
  const data = createDemoData();
  const product = { ...data.products[0], id: 'new', forecast: null, category: 'Uncategorized' };
  const saved = saveProductDetails(data, product, false);
  assert.equal(saved.products.length, 9);
  assert.equal(saveProductDetails(saved, product, false), saved);
  assert.equal(restock(product), 0);
  assert.ok(isShopData(saved));
});
test('malformed persisted records are safely rejected without throwing', () => {
  for (const value of [null, {}, { products: [null], sales: [], receipts: [] }, { products: [], sales: [null], receipts: [] }]) assert.equal(isShopData(value), false);
  const data = createDemoData();
  assert.ok(isShopData(data));
  assert.ok(isShopData({ products: [], sales: [], receipts: [], shopName: 'My shop' }));
  assert.equal(isShopData({ ...data, receipts: [null] }), false);
  assert.equal(isShopData({ ...data, products: [...data.products, data.products[0]] }), false);
  assert.equal(isShopData({ ...data, sales: [{ ...data.sales[0], createdAt: 'not a date' }] }), false);
  assert.equal(isShopData({ ...data, products: [{ ...data.products[0], stock: 0.5 }] }), false);
});
test('restock never goes negative after a large delivery', () => {
  const data = recordReceipt(createDemoData(), 'oil', 100, 'delivery');
  assert.equal(restock(data.products[0]), 0);
});
