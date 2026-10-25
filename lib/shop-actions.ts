import type { Product, ShopData } from "./demo-data";

export function recordSale(data: ShopData, productId: string, quantity: number, requestId: string, createdAt = new Date().toISOString()): ShopData {
  if (data.sales.some(s => s.id === requestId)) return data;
  const product = data.products.find(p => p.id === productId);
  if (!product) throw new Error("This product is no longer available. Choose another product.");
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error("Enter a whole quantity greater than zero.");
  if (quantity > product.stock) throw new Error(`Only ${new Intl.NumberFormat("en-ET").format(product.stock)} in stock. Please update the quantity.`);
  const cents = Math.round(quantity * product.price * 100);
  if (!Number.isSafeInteger(cents)) throw new Error("This sale total is too large. Enter a smaller quantity.");
  return {
    ...data,
    products: data.products.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p),
    sales: [{ id: requestId, productId, productName: product.name, quantity, unit: product.unit, total: cents / 100, createdAt }, ...data.sales],
  };
}

export function recordReceipt(data: ShopData, productId: string, quantity: number, requestId: string, createdAt = new Date().toISOString()): ShopData {
  if (data.receipts.some(r => r.id === requestId)) return data;
  const product = data.products.find(p => p.id === productId);
  if (!product || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(product.stock + quantity)) throw new Error("Enter a valid whole quantity received.");
  return {
    ...data,
    products: data.products.map(p => p.id === productId ? { ...p, stock: p.stock + quantity } : p),
    receipts: [{ id: requestId, productId, quantity, createdAt }, ...data.receipts],
  };
}

export function saveProductDetails(data: ShopData, product: Product, editing: boolean): ShopData {
  if (editing && !data.products.some(p => p.id === product.id)) throw new Error("This product could not be found.");
  if (!editing && data.products.some(p => p.id === product.id)) return data;
  return {
    ...data,
    products: editing ? data.products.map(p => p.id === product.id ? { ...p, name: product.name, price: product.price, category: product.category, threshold: product.threshold } : p) : [...data.products, product],
  };
}
