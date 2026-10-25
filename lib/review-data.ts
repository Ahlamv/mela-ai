import { createDemoData, type Product, type ShopData } from "./demo-data";

export const reviewModes = ["demo", "worst", "empty", "one", "huge"] as const;
export type ReviewMode = typeof reviewModes[number];

// Development fixtures. Values remain valid ShopData and never enter saved storage.
export function createReviewData(mode: ReviewMode): ShopData {
  const data = createDemoData();
  if (mode === "demo") return data;
  if (mode === "empty") return { products: [], sales: [], receipts: [], shopName: "New shop" };
  if (mode === "one") {
    const product = { ...data.products[0], name: "J", stock: 1, threshold: 1, forecast: [1, 0, 0, 0, 0, 0, 0] };
    return { ...data, shopName: "Jo", products: [product], sales: [{ ...data.sales[0], productName: "J", quantity: 1, total: product.price }], receipts: [{ id: "one-receipt", productId: product.id, quantity: 1, createdAt: new Date().toISOString() }] };
  }
  const examples: Partial<Product>[] = [
    { name: "Extra virgin cold-pressed sunflower cooking oil · family refill bottle 5 litres", stock: 1234567, price: 12345678.9, threshold: 2000000, forecast: [200000, 210000, 240000, 190000, 260000, 220000, 230000] },
    { name: "LaundryDetergentConcentratedProfessionalRefillPack5Litres", stock: 0, forecast: [1, 2, 0, 3, 1, 0, 2] },
    { name: "J", stock: 1, threshold: 1, price: 0.1 + 0.2, forecast: [1, 0, 0, 0, 0, 0, 0] },
    { name: "የኢትዮጵያ ቡና · በተፈጥሮ የተዘጋጀ · 250 ግራም ☕", forecast: null, category: "Uncategorized" },
    { name: "Đặng Thị Ngọc Hân · Jasmine rice · 1 kg", stock: 0, price: 0 },
    { name: "نور الهدى · قهوة محمصة · ٢٥٠ غرام", stock: 1 },
    { name: "<b>Special offer</b> & family pack", forecast: null },
    { name: "Coffee · 250 g", stock: 0 },
    { name: "Coffee · 250 g", stock: 12, unit: "box" },
  ];
  const count = mode === "huge" ? 1284 : examples.length;
  const products = Array.from({ length: count }, (_, i) => ({ ...data.products[i % data.products.length], ...examples[i % examples.length], id: `review-${i}`, ...(mode === "huge" ? { name: `${examples[i % examples.length].name} · batch ${i + 1}` } : {}) }));
  const now = Date.now();
  const saleCount = mode === "huge" ? 1284 : 8;
  return {
    // Fits the 60-character setup field, but challenges header width.
    shopName: "Aleksandra Wiśniewska-Kowalczyk · Addis Wholesale Market",
    // Missing optional snapshot tests the explicit unavailable-date fallback.
    products,
    sales: Array.from({ length: saleCount }, (_, i) => {
      const p = products[i % products.length];
      return { id: `review-sale-${i}`, productId: p.id, productName: p.name, quantity: i === 0 ? 1 : 1284, unit: p.unit, total: i === 0 ? 12345678.9 : 0.3, createdAt: new Date(now - (mode === "huge" ? i * 60000 : [0, 86400000 * 12, 86400000 * 365 * 3, 60000][i % 4])).toISOString() };
    }),
    receipts: [],
  };
}
