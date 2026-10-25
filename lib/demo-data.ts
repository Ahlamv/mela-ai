export type Category = "Uncategorized" | "Pantry" | "Drinks" | "Household";
export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: Category;
  unit: string;
  threshold: number;
  icon: "oil" | "sugar" | "coffee" | "soap" | "rice" | "teff" | "pasta" | "water" | "box";
  forecast: number[] | null;
  forecastKind: "demo" | "baseline";
};

export type Sale = { id: string; productId: string; productName: string; quantity: number; unit: string; total: number; createdAt: string };
export type StockReceipt = { id: string; productId: string; quantity: number; createdAt: string };
export type ShopData = { products: Product[]; sales: Sale[]; receipts: StockReceipt[]; shopName?: string; forecastCreatedAt?: string };

export const demoProducts: Product[] = [
  { id: "oil", name: "Cooking oil · 1 L", price: 320, stock: 10, category: "Pantry", unit: "bottle", threshold: 12, icon: "oil", forecast: [4, 5, 5, 4, 6, 6, 5], forecastKind: "demo" },
  { id: "sugar", name: "Sugar · 1 kg", price: 135, stock: 6, category: "Pantry", unit: "bag", threshold: 8, icon: "sugar", forecast: [2, 3, 2, 3, 3, 3, 2], forecastKind: "demo" },
  { id: "coffee", name: "Coffee · 250 g", price: 280, stock: 24, category: "Pantry", unit: "pack", threshold: 6, icon: "coffee", forecast: [2, 2, 1, 2, 3, 2, 2], forecastKind: "demo" },
  { id: "soap", name: "Laundry soap", price: 60, stock: 0, category: "Household", unit: "bar", threshold: 5, icon: "soap", forecast: [1, 2, 2, 1, 2, 2, 2], forecastKind: "demo" },
  { id: "rice", name: "Rice · 1 kg", price: 165, stock: 18, category: "Pantry", unit: "bag", threshold: 6, icon: "rice", forecast: [2, 2, 2, 2, 2, 2, 2], forecastKind: "baseline" },
  { id: "teff", name: "Teff · 1 kg", price: 185, stock: 28, category: "Pantry", unit: "bag", threshold: 8, icon: "teff", forecast: [2, 3, 2, 3, 3, 4, 3], forecastKind: "demo" },
  { id: "pasta", name: "Pasta · 500 g", price: 95, stock: 12, category: "Pantry", unit: "pack", threshold: 5, icon: "pasta", forecast: null, forecastKind: "demo" },
  { id: "water", name: "Water · 1 L", price: 45, stock: 36, category: "Drinks", unit: "bottle", threshold: 10, icon: "water", forecast: [5, 6, 4, 6, 8, 7, 6], forecastKind: "demo" },
];

export function createDemoData(): ShopData {
  const today = new Date();
  const rows = [ ["oil", 3], ["sugar", 4], ["coffee", 2], ["water", 8], ["rice", 3], ["teff", 4], ["pasta", 2], ["water", 4] ] as const;
  return {
    shopName: "Selam Mini Market",
    forecastCreatedAt: today.toISOString(),
    products: structuredClone(demoProducts),
    sales: rows.map(([id, quantity], i) => {
      const p = demoProducts.find((p) => p.id === id)!;
      const at = new Date(today.getTime() - (rows.length - i) * 7 * 60_000);
      return { id: `demo-sale-${i}`, productId: id, productName: p.name, quantity, unit: p.unit, total: quantity * p.price, createdAt: at.toISOString() };
    }),
    receipts: [],
  };
}

export const money = (n: number) => new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 }).format(n);
export const units = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
export const demand = (p: Product) => p.forecast?.reduce((a, b) => a + b, 0) ?? null;
export const restock = (p: Product) => Math.max(0, (demand(p) ?? 0) - p.stock);
export const lowStock = (p: Product) => p.stock <= p.threshold;
export const statusText = (p: Product) => p.stock === 0 ? "Out of stock" : lowStock(p) ? "Low stock" : "In stock";

export function isShopData(value: unknown): value is ShopData {
  if (!value || typeof value !== "object") return false;
  const x = value as Record<string, unknown>;
  const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
  const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
  const whole = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  const amount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && Number.isSafeInteger(Math.round(v * 100));
  const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v));
  const unique = (items: Record<string, unknown>[]) => new Set(items.map(item => item.id)).size === items.length;
  return (x.shopName === undefined || text(x.shopName)) && (x.forecastCreatedAt === undefined || date(x.forecastCreatedAt)) &&
    Array.isArray(x.products) && x.products.every(p => record(p) && text(p.id) && text(p.name) && amount(p.price) && whole(p.stock) && whole(p.threshold) && text(p.unit) && ["Uncategorized", "Pantry", "Drinks", "Household"].includes(String(p.category)) && ["oil", "sugar", "coffee", "soap", "rice", "teff", "pasta", "water", "box"].includes(String(p.icon)) && ["demo", "baseline"].includes(String(p.forecastKind)) && (p.forecast === null || (Array.isArray(p.forecast) && p.forecast.length === 7 && p.forecast.every(whole) && Number.isSafeInteger(p.forecast.reduce((a, b) => a + b, 0))))) && unique(x.products) &&
    Array.isArray(x.sales) && x.sales.every(s => record(s) && text(s.id) && text(s.productId) && text(s.productName) && text(s.unit) && date(s.createdAt) && whole(s.quantity) && s.quantity > 0 && amount(s.total)) && unique(x.sales) &&
    Array.isArray(x.receipts) && x.receipts.every(r => record(r) && text(r.id) && text(r.productId) && whole(r.quantity) && r.quantity > 0 && date(r.createdAt)) && unique(x.receipts);
}
