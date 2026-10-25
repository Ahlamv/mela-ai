"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, ArrowClockwise, Bag,
  BatteryFull, Bell, BowlFood, CaretRight, CellSignalFull, ChartLineUp,
  Check, CheckCircle, Clock, Coffee, Cube, Drop, Grains, HandSoap,
  House, MagnifyingGlass, Minus, Package, Plant, Plus, Receipt,
  Storefront, WarningCircle, WifiHigh, X, IconContext, type Icon,
} from "@phosphor-icons/react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  createDemoData, demand, isShopData, lowStock, money, restock, statusText, units,
  type Category, type Product, type ShopData,
} from "@/lib/demo-data";

import { BrandLogo } from "@/components/brand-logo";
import { EntryFlow } from "@/components/entry-flow";
import { recordSale, recordReceipt, saveProductDetails } from "@/lib/shop-actions";

type Tab = "home" | "products" | "sales" | "forecasts";
type Screen = "main" | "product" | "add" | "edit" | "receive" | "forecast" | "settings";
type Route = { tab: Tab; screen: Screen; productId?: string; justAdded?: boolean };
type StockFilter = "All" | "Low stock" | "Out of stock";
const ICON_STYLE = { weight: "regular" as const, size: 20, "aria-hidden": true as const };
type DraftChange = (dirty: boolean, saving?: boolean) => void;

function useDraftGuard(dirty: boolean, saving: boolean, onChange: DraftChange) {
  useEffect(() => { onChange(dirty, saving); return () => onChange(false, false); }, [dirty, saving, onChange]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
}

const STORAGE_KEY = "mela-ai-demo-v1";
const ONBOARDING_KEY = "mela-ai-introduction-v1";
const initialRoute: Route = { tab: "home", screen: "main" };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const iconMap: Record<Product["icon"], Icon> = { oil: Drop, sugar: Bag, coffee: Coffee, soap: HandSoap, rice: BowlFood, teff: Grains, pasta: Plant, water: Drop, box: Cube };

function ProductMark({ product, small = false }: { product: Product; small?: boolean }) {
  const Mark = iconMap[product.icon] ?? Cube;
  return <span className={`product-mark ${small ? "small" : ""} ${product.icon}`}><Mark size={small ? 19 : 24} /></span>;
}

function StockStatus({ product }: { product: Product }) {
  return <span className={`stock-status ${product.stock === 0 ? "out" : lowStock(product) ? "low" : "healthy"}`}>{statusText(product)}</span>;
}

function Ring({ value, size = 46, color = "#df6543" }: { value: number; size?: number; color?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return <div className="ring" role="img" aria-label={`${Math.round(safe)} percent`}><PieChart width={size} height={size}><Pie data={[{ value: safe }, { value: 100 - safe }]} dataKey="value" innerRadius={size / 2 - 5} outerRadius={size / 2 - 2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}><Cell fill={color} /><Cell fill="#dededb" /></Pie></PieChart></div>;
}

function QuickAction({ icon: Mark, label, onClick }: { icon: Icon; label: string; onClick: () => void }) {
  return <button type="button" className="quick-action" onClick={onClick}><span><Mark size={24} /></span><small>{label}</small></button>;
}

function EmptyState({ icon: Mark = Package, title, detail, action, onAction }: { icon?: Icon; title: string; detail: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Mark size={30} /></span><h3>{title}</h3><p>{detail}</p>{action && <button type="button" className="button primary" onClick={onAction}>{action}<ArrowRight size={17} /></button>}</div>;
}

function Search({ value, onChange, placeholder = "Find a product…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label className="search-field"><MagnifyingGlass size={20} /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button aria-label="Clear search" type="button" onClick={() => onChange("")}><X size={16} /></button>}</label>;
}

function ProductRow({ product, onClick, right }: { product: Product; onClick: () => void; right?: React.ReactNode }) {
  return <button type="button" className="product-row" onClick={onClick}><ProductMark product={product} /><span className="product-copy"><strong>{product.name}</strong><span>ETB {money(product.price)} <span className="muted">/ {product.unit}</span></span></span><span className="product-end">{right ?? <><strong>{product.stock} <small>left</small></strong><StockStatus product={product} /></>}</span><CaretRight size={15} className="row-chevron" /></button>;
}

export default function MelaApp({ previewData, forceOnboarding = false }: { previewData?: ShopData; forceOnboarding?: boolean } = {}) {
  const [data, setData] = useState<ShopData>(() => previewData ?? createDemoData());
  const dataRef = useRef(data);
  const [ready, setReady] = useState(false);
  const [welcome, setWelcome] = useState(forceOnboarding);
  const [hasSavedShop, setHasSavedShop] = useState(false);
  const [forecastSearch, setForecastSearch] = useState("");
  const [previewScale, setPreviewScale] = useState(1);
  const [route, setRoute] = useState<Route>(initialRoute);
  const [history, setHistory] = useState<Route[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("All");
  const [salesMode, setSalesMode] = useState<"record" | "history">("record");
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const corruptStorage = useRef(false);
  const dirtyForm = useRef(false);
  const savingForm = useRef(false);
  const onDraftChange = useCallback<DraftChange>((dirty, saving = false) => { dirtyForm.current = dirty; savingForm.current = saving; }, []);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resize = () => setPreviewScale(window.innerWidth <= 500 ? 1 : Math.min(1, Math.max(.35, (window.innerHeight - 130) / 846)));
    resize(); window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const replayIntroduction = forceOnboarding || new URLSearchParams(window.location.search).get("onboarding") === "1";
    if (replayIntroduction) setWelcome(true);
    // Review fixtures are isolated from the owner's saved shop.
    if (previewData) { setReady(true); return () => { if (toastRef.current) clearTimeout(toastRef.current); }; }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let value: unknown;
        try { value = JSON.parse(saved); } catch { value = null; }
        if (isShopData(value)) { dataRef.current = value; setData(value); setHasSavedShop(true); setWelcome(replayIntroduction || localStorage.getItem(ONBOARDING_KEY) !== "complete"); }
        else { corruptStorage.current = true; setStorageWarning("Your saved shop could not be read. It has not been overwritten. Export a backup from shop settings before starting again."); }
      } else { setWelcome(true); }
    } catch { setStorageWarning("Browser storage is unavailable. Changes cannot be saved until storage is enabled."); }
    setReady(true);
    return () => { if (toastRef.current) clearTimeout(toastRef.current); };
  }, [previewData, forceOnboarding]);

  function commit(next: ShopData, reset = false) {
    if (previewData) { dataRef.current = next; setData(next); return; }
    if (corruptStorage.current && !reset) throw new Error("Your saved data needs attention. Export a backup and reset the demo from shop settings before saving new changes.");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Couldn’t save in this browser. Enable browser storage, then retry. Your entries are still here."); }
    dataRef.current = next; setData(next); corruptStorage.current = false; setStorageWarning("");
  }

  function toast(message: string) {
    setNotice(message);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setNotice(""), 4200);
  }

  function navigate(action: () => void) {
    if (savingForm.current) { toast("Finishing your save. Please wait a moment."); return; }
    if (dirtyForm.current) { returnFocus.current = document.activeElement as HTMLElement; setPendingNavigation(() => action); return; }
    action();
  }
  function go(next: Route) { navigate(() => { setHistory(h => [...h, route]); setRoute(next); }); }
  function back() {
    navigate(() => {
      const previous = history.at(-1);
      setRoute(previous ?? { ...route, screen: "main", productId: undefined });
      setHistory(h => h.slice(0, -1));
    });
  }
  function chooseTab(tab: Tab) { if (route.tab === tab && route.screen === "main" && !route.productId) return; navigate(() => { setRoute({ tab, screen: "main" }); setHistory([]); }); }
  function openSale(p?: Product) { setSalesMode("record"); go({ tab: "sales", screen: "main", productId: p?.id }); }
  function showLowStock() { navigate(() => { setStockFilter("Low stock"); setProductSearch(""); setRoute({ tab: "products", screen: "main" }); setHistory([]); }); }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    const frame = requestAnimationFrame(() => {
      const heading = scrollRef.current?.querySelector<HTMLElement>("h1, h2");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);

  function closeDiscard() { setPendingNavigation(null); requestAnimationFrame(() => returnFocus.current?.focus()); }
  function beginDemo(empty: boolean, name: string) {
    commit(empty ? { products: [], sales: [], receipts: [], shopName: name.trim() || "My shop" } : createDemoData());
    setHasSavedShop(true); finishIntroduction();
  }
  function finishIntroduction() {
    // The marker is a tour preference, never an authenticated session.
    if (!previewData) { try { localStorage.setItem(ONBOARDING_KEY, "complete"); } catch { /* The app can still open when a tour preference cannot be saved. */ } }
    const url = new URL(window.location.href);
    if (url.searchParams.has("onboarding")) { url.searchParams.delete("onboarding"); window.history.replaceState(null, "", url); }
    setWelcome(false); setRoute(initialRoute); setHistory([]);
    requestAnimationFrame(() => { const heading = scrollRef.current?.querySelector<HTMLElement>("h1"); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } });
  }

  const product = data.products.find(p => p.id === route.productId);
  const low = [...data.products].filter(lowStock).sort((a, b) => a.stock - b.stock);
  const needed = data.products.filter(p => p.forecast && restock(p) > 0);
  const inStock = data.products.filter(p => p.stock > 0).length;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Addis_Ababa" });
  const todaysSales = data.sales.filter(s => new Date(s.createdAt).toLocaleDateString("en-CA", { timeZone: "Africa/Addis_Ababa" }) === today);
  const salesTotal = todaysSales.reduce((n, s) => n + s.total, 0);
  const subScreen = route.screen !== "main";
  const navItems: { id: Tab; label: string; icon: Icon }[] = [ { id: "home", label: "Home", icon: House }, { id: "products", label: "Products", icon: Package }, { id: "sales", label: "Sales", icon: Receipt }, { id: "forecasts", label: "Forecasts", icon: ChartLineUp } ];

  async function saveSale(productId: string, quantity: number, requestId: string) {
    await sleep(450);
    const next = recordSale(dataRef.current, productId, quantity, requestId);
    if (next !== dataRef.current) commit(next);
  }

  async function saveProduct(p: Product, editing: boolean) {
    await sleep(400);
    const next = saveProductDetails(dataRef.current, p, editing);
    if (next !== dataRef.current) commit(next);
    onDraftChange(false);
    if (editing) back();
    else setRoute({ tab: "products", screen: "product", productId: p.id, justAdded: true });
    toast(editing ? "Product details updated" : "Product added to your shop");
  }

  async function receiveStock(p: Product, quantity: number, requestId: string) {
    await sleep(400);
    const next = recordReceipt(dataRef.current, p.id, quantity, requestId);
    if (next !== dataRef.current) commit(next);
    onDraftChange(false); back(); toast(`${units(quantity, p.unit)} added to stock`);
  }

  const screenNames: Record<Exclude<Screen, "main">, string> = { product: "Product details", add: "Add product", edit: "Edit product", receive: "Receive stock", forecast: "Demand & restock", settings: "Your demo shop" };

  return <IconContext.Provider value={ICON_STYLE}><main className="preview-stage" style={{ "--preview-scale": previewScale } as CSSProperties}>
    <div className="preview-caption"><BrandLogo /><a className="onboarding-preview-link" href="/onboarding">Onboarding &amp; sign in <ArrowRight size={15} /></a></div>
    <div className="phone-stage"><section className="phone-frame" aria-label="Mela AI mobile app prototype">
      <div className="status-bar" aria-hidden="true"><span>9:41</span><span><CellSignalFull size={17} /><WifiHigh size={17} /><BatteryFull size={23} /></span></div>
      <div key={`${route.tab}:${route.screen}:${route.productId ?? ""}`} className="app-scroll screen-enter" inert={!!pendingNavigation || welcome} ref={scrollRef} data-testid="app-viewport">
        {!ready ? <div className="boot"><BrandLogo /><p>Getting your shop ready…</p></div> : <>
          {subScreen ? <header className="sub-header"><button className="icon-button" onClick={back} aria-label="Go back"><ArrowLeft size={21} /></button><h1>{screenNames[route.screen as Exclude<Screen, "main">]}</h1><span className="tiny-demo">DEMO</span></header> : <header className="shop-header"><button className="shop-identity" onClick={() => go({ ...route, screen: "settings" })}><BrandLogo compact /><span className="shop-label"><span>{data.shopName ?? "Selam Mini Market"}</span><small><span className="demo-dot" />Demo shop</small></span></button><button className="icon-button bell-button" aria-label={`View ${low.length} low-stock products`} onClick={showLowStock}><Bell size={19} />{low.length > 0 && <span />}</button></header>}

          {storageWarning && <p className="storage-notice" role="status">{storageWarning}</p>}

          {route.screen === "main" && route.tab === "home" && <>
            {!data.products.length && <EmptyState title="Your first product starts here." detail="Add what’s on your shelves. Then record a sale to keep your stock up to date." action="Add first product" onAction={() => go({ tab: "products", screen: "add" })} />}
            <div className="home-heading"><p>GOOD TO SEE YOU</p><h1>Let’s get your<br />shop ready.</h1></div>
            <section className="shelf-card" aria-label="Stock overview"><div className="shelf-top"><h2>{inStock} of {data.products.length} products<br />are on your shelves</h2><button className="orange-orb" aria-label="View products needing attention" onClick={showLowStock}><Package size={22} /></button></div><div className="shelf-bottom"><div className="shelf-track"><div style={{ width: `${data.products.length ? inStock / data.products.length * 100 : 0}%` }} /></div><span>{inStock}<span>/{data.products.length}</span></span></div></section>
            <div className="quick-actions"><QuickAction icon={Package} label="Add product" onClick={() => go({ tab: "products", screen: "add" })} /><QuickAction icon={Receipt} label="Record sale" onClick={() => openSale()} /><QuickAction icon={Bell} label="Low stock" onClick={showLowStock} /><QuickAction icon={ChartLineUp} label="Forecast" onClick={() => chooseTab("forecasts")} /></div>
            <div className="section-heading"><h2>Today, at a glance</h2><span>{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Addis_Ababa" })}</span></div>
            <div className="summary-grid"><button className="summary-card" onClick={() => { setSalesMode("history"); chooseTab("sales"); }}><small>Today’s sales</small><strong><span>ETB</span> {money(salesTotal)}</strong><span className="card-caption">{todaysSales.length} sales recorded</span><ArrowUpRight className="summary-arrow" size={18} /></button><button className="summary-card low-summary" onClick={showLowStock}><small>Need attention</small><strong>{low.length} <span>products</span></strong><Ring value={data.products.length ? (data.products.length - low.length) / data.products.length * 100 : 0} size={43} color="#242424" /><span className="card-caption">Check your shelves</span></button></div>
            <div className="section-heading attention-heading"><h2>A little attention</h2><button className="text-button" onClick={showLowStock}>View all <ArrowUpRight size={14} /></button></div>
            {low.length ? <div className="grouped-list home-alerts">{low.slice(0, 2).map(p => <ProductRow key={p.id} product={p} onClick={() => go({ tab: "products", screen: "product", productId: p.id })} right={<><strong>{units(p.stock, p.unit)}</strong><StockStatus product={p} /></>} />)}</div> : <div className="quiet-success"><CheckCircle size={20} /><span>{data.products.length ? "Your shelves are looking good." : "Your stock alerts will appear here."}</span></div>}
            <button className="home-forecast-link" onClick={() => chooseTab("forecasts")}><span className="small-orb"><ChartLineUp size={17} /></span><span><strong>A look at the week ahead</strong><small>{needed.length} products have demo restock suggestions</small></span><ArrowUpRight size={18} /></button>
            <p className="sample-footnote">Sample shop data · for exploring Mela AI</p>
          </>}

          {route.screen === "main" && route.tab === "products" && <>
            <div className="page-heading"><div><p>EVERYTHING ON YOUR SHELVES</p><h1>Your products.</h1></div><button className="round-add" aria-label="Add a product" onClick={() => go({ tab: "products", screen: "add" })}><Plus size={23} /></button></div>
            <div className="inline-summary"><span><strong>{data.products.length}</strong> products</span><span><span className="status-dot" />{low.length} need attention</span></div>
            <Search value={productSearch} onChange={setProductSearch} />
            <div className="segmented filters" role="group" aria-label="Stock filter">{(["All", "Low stock", "Out of stock"] as StockFilter[]).map(filter => <button key={filter} aria-pressed={stockFilter === filter} className={stockFilter === filter ? "selected" : ""} onClick={() => setStockFilter(filter)}>{filter}</button>)}</div>
            <InventoryList products={data.products} query={productSearch} filter={stockFilter} onSelect={p => go({ tab: "products", screen: "product", productId: p.id })} onClear={() => { setProductSearch(""); setStockFilter("All"); }} onAdd={() => go({ tab: "products", screen: "add" })} />
            <p className="sample-footnote">Stock alerts follow each product’s low-stock level.</p>
          </>}

          {route.screen === "main" && route.tab === "sales" && <>
            <div className="page-heading"><div><p>A LITTLE LESS PAPERWORK</p><h1>Your sales.</h1></div><span className="heading-icon"><Receipt size={27} /></span></div>
            <div className="segmented sales-toggle" role="group" aria-label="Sales view"><button className={salesMode === "record" ? "selected" : ""} aria-pressed={salesMode === "record"} onClick={() => navigate(() => setSalesMode("record"))}>Record a sale</button><button className={salesMode === "history" ? "selected" : ""} aria-pressed={salesMode === "history"} onClick={() => navigate(() => setSalesMode("history"))}>Sales history</button></div>
            {salesMode === "record" ? <SaleForm onReceive={p => go({ tab: "products", screen: "receive", productId: p.id })} onDraftChange={onDraftChange} key={route.productId ?? "sale"} products={data.products} initialProductId={route.productId} onSave={saveSale} onHistory={() => setSalesMode("history")} onAdd={() => go({ tab: "products", screen: "add" })} /> : <SalesHistory data={data} total={salesTotal} onRecord={() => setSalesMode("record")} />}
          </>}

          {route.screen === "main" && route.tab === "forecasts" && <>
            <div className="page-heading forecast-heading"><div><p>A LITTLE FORESIGHT</p><h1>The week ahead.</h1></div></div>
            <div className="horizon-label"><span><Clock size={15} /> 7-day sample outlook</span><span className="source-badge">Demo estimates</span></div>
            <ForecastOverview query={forecastSearch} onQuery={setForecastSearch} products={data.products} onSelect={p => go({ tab: "forecasts", screen: "forecast", productId: p.id })} onRecord={() => openSale()} />
          </>}

          {route.screen === "product" && product && <ProductDetail justAdded={route.justAdded} onAdd={() => go({ tab: "products", screen: "add" })} product={product} receipts={data.receipts.filter(r => r.productId === product.id).length} onSale={() => openSale(product)} onEdit={() => go({ ...route, screen: "edit" })} onReceive={() => go({ ...route, screen: "receive" })} onForecast={() => go({ tab: "forecasts", screen: "forecast", productId: product.id })} />}
          {(route.screen === "add" || route.screen === "edit") && <ProductForm key={route.screen + (product?.id ?? "new")} product={route.screen === "edit" ? product : undefined} onSave={saveProduct} onCancel={() => { dirtyForm.current = false; back(); }} onDirtyChange={onDraftChange} />}
          {route.screen === "receive" && product && <ReceiveForm onDraftChange={onDraftChange} product={product} onSave={receiveStock} onCancel={back} />}
          {route.screen === "forecast" && product && <ForecastDetail snapshotAt={data.forecastCreatedAt} product={product} onReceive={() => go({ tab: "products", screen: "receive", productId: product.id })} onRecord={() => openSale(product)} onProduct={() => go({ tab: "products", screen: "product", productId: product.id })} />}
          {route.screen === "settings" && <DemoSettings onTour={() => setWelcome(true)} shopName={data.shopName ?? "Selam Mini Market"} data={data} onReset={() => { commit(createDemoData(), true); setProductSearch(""); setForecastSearch(""); setStockFilter("All"); setSalesMode("record"); chooseTab("home"); toast("Demo shop reset to its starting stock"); }} />}
        </>}
      </div>
      {ready && <nav className="bottom-nav" style={{ "--active-tab": navItems.findIndex(item => item.id === route.tab) } as CSSProperties} inert={!!pendingNavigation || welcome} aria-label="Main navigation">{navItems.map(({ id, label, icon: Mark }) => <button key={id} aria-current={route.tab === id ? "page" : undefined} aria-label={label} className={route.tab === id ? "active" : ""} onClick={() => chooseTab(id)}><Mark size={22} weight="regular" /><span>{label}</span></button>)}</nav>}
      {notice && <div className="toast" role="status"><CheckCircle size={19} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
      {welcome && ready && <EntryFlow hasSavedShop={hasSavedShop || !!previewData} onBegin={beginDemo} onContinue={finishIntroduction} />}
      {pendingNavigation && <div className="dialog-scrim"><section className="discard-dialog" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" onKeyDown={e => { if (e.key === "Escape") closeDiscard(); if (e.key === "Tab") { const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("button"); const first = buttons[0]; const last = buttons[buttons.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } }}><span className="form-icon"><Package size={26} /></span><h2 id="discard-title">Keep your changes?</h2><p>Your entries haven’t been saved yet.</p><button className="button primary full" autoFocus onClick={closeDiscard}>Keep editing</button><button className="button white full" onClick={() => { dirtyForm.current = false; setPendingNavigation(null); pendingNavigation(); }}>Discard changes</button></section></div>}
    </section></div>
    <p className="preview-note">A working preview. A sample shop. Make yourself at home.</p>
  </main></IconContext.Provider>;
}

function InventoryList({ products, query, filter, onSelect, onClear, onAdd }: { products: Product[]; query: string; filter: StockFilter; onSelect: (p: Product) => void; onClear: () => void; onAdd: () => void }) {
  const matching = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) && (filter === "All" || (filter === "Low stock" ? lowStock(p) : p.stock === 0))).sort((a, b) => filter === "All" ? 0 : a.stock - b.stock);
  if (!products.length) return <EmptyState title="Your shelves start here" detail="Add your first product to keep track of stock and sales." action="Add first product" onAction={onAdd} />;
  if (!matching.length) return <EmptyState icon={MagnifyingGlass} title={query ? "No products found" : "All looking good"} detail={query ? "Try another name or clear the stock filter." : "No products match this stock filter."} action="Show all products" onAction={onClear} />;
  return <div className="grouped-list inventory-list">{matching.map(p => <ProductRow key={p.id} product={p} onClick={() => onSelect(p)} />)}</div>;
}

function SaleForm({ products, initialProductId, onSave, onHistory, onAdd, onDraftChange, onReceive }: { onReceive: (p: Product) => void; onDraftChange: DraftChange; products: Product[]; initialProductId?: string; onSave: (id: string, q: number, request: string) => Promise<void>; onHistory: () => void; onAdd: () => void }) {
  const [selectedId, setSelectedId] = useState(initialProductId ?? "");
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{ name: string; q: number; remaining: number; unit: string; total: number } | null>(null);
  const busy = useRef(false);
  const requestRef = useRef("");
  const p = products.find(x => x.id === selectedId);
  useDraftGuard(!!p && p.stock > 0 && !success, saving, onDraftChange);
  const qty = Number(quantity);
  const valid = p && Number.isSafeInteger(qty) && qty > 0 && qty <= p.stock && Number.isSafeInteger(Math.round(qty * p.price * 100));
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy.current || !p) return;
    if (!valid) { setError(qty > p.stock ? `Only ${units(p.stock, p.unit)} available.` : "Enter a valid whole quantity with a supported sale total."); return; }
    busy.current = true; setSaving(true); setError(""); requestRef.current ||= crypto.randomUUID();
    const previousStock = p.stock;
    try { await onSave(p.id, qty, requestRef.current); setSuccess({ name: p.name, q: qty, remaining: previousStock - qty, unit: p.unit, total: p.price * qty }); }
    catch (e) { setError(e instanceof Error ? e.message : "The sale could not be saved. Your entries are still here."); }
    finally { busy.current = false; setSaving(false); }
  }
  if (success) return <section className="sale-success"><span className="success-orb"><Check size={32} /></span><p className="eyebrow">ALL TAKEN CARE OF</p><h2>Sale recorded.</h2><p>{units(success.q, success.unit)} of<br /><strong>{success.name}</strong></p><div className="receipt-summary"><span>Total sale<strong>ETB {money(success.total)}</strong></span><span>Stock remaining<strong>{units(success.remaining, success.unit)}</strong></span></div><p className="muted small-copy">Saved in this demo shop. Your stock is up to date.</p><button className="button primary full" onClick={() => { setSuccess(null); setSelectedId(""); setQuantity("1"); setQuery(""); requestRef.current = ""; }}>Record another sale<Plus size={18} /></button><button className="button subtle full" onClick={onHistory}>View sales history<ArrowRight size={17} /></button></section>;
  if (!products.length) return <EmptyState title="Add a product first" detail="Your product list makes recording a sale quick and simple." action="Add first product" onAction={onAdd} />;
  return <form className="sale-form" onSubmit={submit} noValidate>
    <div className="section-heading"><h2>{p ? "Your selected product" : "What did you sell?"}</h2>{p && <button type="button" className="text-button" disabled={saving} onClick={() => { setSelectedId(""); setError(""); requestRef.current = ""; }}>Change</button>}</div>
    {!p ? <><Search value={query} onChange={setQuery} /><div className="grouped-list sale-product-list">{products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => <ProductRow key={p.id} product={p} onClick={() => { setSelectedId(p.id); setQuantity("1"); setError(""); }} />)}{!products.some(p => p.name.toLowerCase().includes(query.toLowerCase())) && <EmptyState icon={MagnifyingGlass} title="No matching products" detail="Try a shorter product name." action="Clear search" onAction={() => setQuery("")} />}</div></> : <>
      <div className="selected-product"><ProductMark product={p} /><div><h3>{p.name}</h3><p>ETB {money(p.price)} / {p.unit}</p></div><StockStatus product={p} /></div>
      <div className="quantity-panel"><label htmlFor="sale-quantity">Quantity sold</label><span className="available-stock">{units(p.stock, p.unit)} available</span><div className="quantity-stepper"><button type="button" aria-label="Decrease quantity" disabled={saving || !Number.isFinite(qty) || qty <= 1} onClick={() => { setQuantity(String(Math.max(1, qty - 1))); setError(""); }}><Minus size={20} /></button><input id="sale-quantity" inputMode="numeric" type="number" min="1" step="1" max={p.stock || 1} value={quantity} onChange={e => { setQuantity(e.target.value); setError(""); }} aria-invalid={!!error} aria-describedby={error ? "sale-error" : undefined} disabled={saving} /><button type="button" aria-label="Increase quantity" disabled={saving || !Number.isFinite(qty) || qty >= p.stock} onClick={() => { setQuantity(String(qty + 1)); setError(""); }}><Plus size={20} /></button></div><small>{p.unit}{qty !== 1 && "s"}</small></div>
      {(error || p.stock === 0) && <p className="field-error" id="sale-error" role="alert"><WarningCircle size={17} />{error || "This product is out of stock. Receive stock before recording a sale."}</p>}
      {p.stock === 0 && <button type="button" className="button white full" onClick={() => onReceive(p)}>Receive stock<Package size={18} /></button>}
      <div className="sale-total"><span>Total sale</span><strong><small>ETB</small> {money(Number.isFinite(qty) && qty > 0 ? qty * p.price : 0)}</strong></div>
      <p className="helper-line"><ArrowDown size={16} />Your stock updates automatically after you confirm.</p>
      <button className="button primary full" type="submit" disabled={saving || p.stock === 0}>{saving ? "Recording sale…" : "Confirm sale"}{!saving && <ArrowRight size={18} />}</button>
    </>}
  </form>;
}

function SalesHistory({ data, total, onRecord }: { data: ShopData; total: number; onRecord: () => void }) {
  const rows = [...data.sales].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return <><div className="sales-history-summary"><small>Today’s recorded sales</small><strong><span>ETB</span> {money(total)}</strong><button className="text-button" onClick={onRecord}>Record a sale<Plus size={16} /></button></div><div className="section-heading"><h2>Recent sales</h2><span>{rows.length} records</span></div>{!rows.length ? <EmptyState icon={Receipt} title="Your first sale is next" detail="Every recorded sale keeps your stock and sales history up to date." action="Record a sale" onAction={onRecord} /> : <div className="grouped-list">{rows.map(s => { const p = data.products.find(p => p.id === s.productId); return <div className="history-row" key={s.id}>{p ? <ProductMark product={p} small /> : <span className="product-mark small"><Package size={19} /></span>}<span><strong>{s.productName}</strong><small>{units(s.quantity, s.unit)} · {new Date(s.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "Africa/Addis_Ababa" })}, {new Date(s.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Addis_Ababa" })}</small></span><b>ETB {money(s.total)}</b></div>; })}</div>}<p className="sample-footnote">Demo sales are stored in this browser.</p></>;
}

function ProductDetail({ product: p, receipts, onSale, onEdit, onReceive, onForecast, justAdded, onAdd }: { justAdded?: boolean; onAdd: () => void; product: Product; receipts: number; onSale: () => void; onEdit: () => void; onReceive: () => void; onForecast: () => void }) {
  return <>{justAdded && <p className="saved-banner" role="status"><CheckCircle size={18} />Product added · ready to sell</p>}<div className="product-hero"><ProductMark product={p} /><span className="eyebrow">{p.category.toUpperCase()}</span><h2>{p.name}</h2><StockStatus product={p} /></div><div className="detail-grid"><div className="white-card"><small>On your shelves</small><strong>{p.stock}</strong><span>{p.unit}{p.stock !== 1 && "s"} in stock</span></div><div className="white-card"><small>Selling price</small><strong><span>ETB</span> {money(p.price)}</strong><span>per {p.unit}</span></div></div><div className="detail-actions"><button className="button primary full" onClick={onSale} disabled={p.stock === 0}>Record a sale<Receipt size={19} /></button><button className="button white full" onClick={onReceive}>Add stock received<Plus size={19} /></button></div>{justAdded && <button className="button subtle full" onClick={onAdd}>Add another product<Plus size={18} /></button>}{p.stock === 0 && <p className="helper-line">Receive stock to make this product available for sale.</p>}<div className="section-heading"><h2>A little foresight</h2></div><button className="forecast-teaser" onClick={onForecast}><span className="small-orb"><ChartLineUp size={21} /></span><span><strong>{demand(p) === null ? "Build your sales history" : restock(p) > 0 ? `Consider ${units(restock(p), p.unit)} more` : "Your week looks covered"}</strong><small>Explore the 7-day sample outlook</small></span><CaretRight size={18} /></button><div className="settings-list"><div><span>Low-stock alert</span><strong>{units(p.threshold, p.unit)} or fewer</strong></div><div><span>Stock receipts recorded</span><strong>{receipts}</strong></div><button onClick={onEdit}><span>Edit product details</span><ArrowUpRight size={18} /></button></div><p className="sample-footnote">A restock suggestion never changes your stock.<br />Add stock only when goods actually arrive.</p></>;
}

function ProductForm({ product, onSave, onCancel, onDirtyChange }: { product?: Product; onSave: (p: Product, edit: boolean) => Promise<void>; onCancel: () => void; onDirtyChange: DraftChange }) {
  const [name, setName] = useState(product?.name ?? ""); const [price, setPrice] = useState(product ? String(product.price) : ""); const [stock, setStock] = useState("0"); const [category, setCategory] = useState<Category>(product?.category ?? "Uncategorized"); const [unit, setUnit] = useState(product?.unit ?? "piece"); const [threshold, setThreshold] = useState(product ? String(product.threshold) : "5");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [saving, setSaving] = useState(false); const busy = useRef(false); const formRef = useRef<HTMLFormElement>(null); const [confirmDiscard, setConfirmDiscard] = useState(false); const idRef = useRef("");
  const dirty = name !== (product?.name ?? "") || price !== (product ? String(product.price) : "") || stock !== "0" || category !== (product?.category ?? "Uncategorized") || unit !== (product?.unit ?? "piece") || threshold !== (product ? String(product.threshold) : "5");
  useDraftGuard(dirty, saving, onDirtyChange);
  async function submit(e: FormEvent) { e.preventDefault(); if (busy.current) return; const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Give this product a name.";
    if (price === "" || !Number.isFinite(+price) || +price < 0 || +price > 1e9) next.price = "Enter a valid price of zero or more.";
    if (!product && (stock === "" || !Number.isSafeInteger(+stock) || +stock < 0)) next.stock = "Enter a whole stock quantity of zero or more.";
    if (!unit.trim()) next.unit = "Enter a stock unit.";
    if (threshold === "" || !Number.isSafeInteger(+threshold) || +threshold < 0) next.threshold = "Enter a whole alert level of zero or more.";
    setErrors(next); if (Object.keys(next).length) { setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("[aria-invalid=true]")?.focus(), 0); return; }
    busy.current = true; setSaving(true); idRef.current ||= crypto.randomUUID();
    try { await onSave({ id: product?.id ?? idRef.current, name: name.trim(), price: Math.round(+price * 100) / 100, stock: product?.stock ?? +stock, category, unit: unit.trim(), threshold: +threshold, icon: product?.icon ?? "box", forecast: product?.forecast ?? null, forecastKind: product?.forecastKind ?? "demo" }, !!product); }
    catch(e) { setErrors({ save: e instanceof Error ? e.message : "Could not save. Your entries are still here." }); busy.current = false; setSaving(false); }
  }
  return <form ref={formRef} className="product-form" onSubmit={submit} noValidate><div className="form-intro"><span className="form-icon"><Package size={27} /></span><h2>{product ? "A quick update." : "Make room for\nsomething new."}</h2><p>{product ? "Keep your product information up to date." : "Just a few details, and it’s on your shelves."}</p></div>
    <label className="form-field">Product name<input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cooking oil · 1 L" maxLength={80} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} disabled={saving} />{errors.name && <span id="name-error" className="field-error" role="alert">{errors.name}</span>}</label>
    <div className="form-columns"><label className="form-field">Selling price <span className="input-wrap"><span>ETB</span><input name="price" type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} disabled={saving} /></span>{errors.price && <span id="price-error" className="field-error" role="alert">{errors.price}</span>}</label>{!product ? <label className="form-field">Opening stock<input name="stock" type="number" inputMode="numeric" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} aria-invalid={!!errors.stock} aria-describedby={errors.stock ? "stock-error" : undefined} disabled={saving} />{errors.stock && <span id="stock-error" className="field-error" role="alert">{errors.stock}</span>}</label> : <div className="form-field">Current stock<div className="readonly-value">{units(product.stock, product.unit)}</div></div>}</div>
    <div className="form-columns"><label className="form-field">Stock unit<select value={unit} onChange={e => setUnit(e.target.value)} disabled={saving || !!product}>{Array.from(new Set(["piece", "bottle", "bag", "pack", "bar", ...(product ? [product.unit] : [])])).map(u => <option key={u}>{u}</option>)}</select></label><label className="form-field">Category <small>optional</small><select value={category} onChange={e => setCategory(e.target.value as Category)} disabled={saving}><option>Uncategorized</option><option>Pantry</option><option>Drinks</option><option>Household</option></select></label></div>
    <label className="form-field">Low-stock alert level<input name="threshold" type="number" inputMode="numeric" min="0" step="1" value={threshold} onChange={e => setThreshold(e.target.value)} aria-invalid={!!errors.threshold} aria-describedby={errors.threshold ? "threshold-error" : undefined} disabled={saving} /><small>Flag this product at {threshold || 0} {unit}{+threshold !== 1 && "s"} or fewer. Demo default: 5.</small>{errors.threshold && <span id="threshold-error" className="field-error" role="alert">{errors.threshold}</span>}</label>
    {errors.save && <p role="alert" className="field-error">{errors.save}</p>}
    <button className="button primary full" type="submit" disabled={saving}>{saving ? "Saving product…" : product ? "Save changes" : "Save product"}{!saving && <Check size={19} />}</button><button className="button subtle full" type="button" disabled={saving} onClick={() => dirty ? setConfirmDiscard(true) : onCancel()}>Cancel</button>
    {confirmDiscard && <div className="inline-confirm" role="alert"><strong>Leave without saving?</strong><p>Your changes haven’t been saved yet.</p><div><button type="button" className="button white" onClick={() => setConfirmDiscard(false)}>Keep editing</button><button type="button" className="button primary" onClick={onCancel}>Discard</button></div></div>}
  </form>;
}

function ReceiveForm({ product: p, onSave, onCancel, onDraftChange }: { onDraftChange: DraftChange; product: Product; onSave: (p: Product, q: number, id: string) => Promise<void>; onCancel: () => void }) {
  const [quantity, setQuantity] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const busy = useRef(false); const request = useRef("");
  useDraftGuard(quantity !== "", saving, onDraftChange);
  async function submit(e: FormEvent) { e.preventDefault(); if (busy.current) return; if (!Number.isSafeInteger(+quantity) || +quantity <= 0 || !Number.isSafeInteger(p.stock + +quantity)) { setError("Enter the whole quantity you actually received."); return; }busy.current = true; setSaving(true); setError("");request.current ||= crypto.randomUUID(); try { await onSave(p, +quantity, request.current); }catch(e) { setError(e instanceof Error ? e.message : "Stock could not be updated. Try again."); busy.current = false; setSaving(false); } }
  return <form onSubmit={submit} noValidate><div className="form-intro"><span className="form-icon"><Package size={27} /></span><h2>Fresh stock.<br />A fresh start.</h2><p>Record goods that have actually arrived.</p></div><div className="selected-product"><ProductMark product={p} /><div><h3>{p.name}</h3><p>{units(p.stock, p.unit)} currently in stock</p></div></div><label className="form-field receive-quantity">Quantity received<input autoFocus inputMode="numeric" type="number" min="1" step="1" placeholder="e.g. 25" value={quantity} onChange={e => { setQuantity(e.target.value); setError(""); }} aria-invalid={!!error} disabled={saving} /><small>Count in {p.unit}s.</small></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="stock-equation"><span><small>Current</small><strong>{p.stock}</strong></span><Plus size={20} /><span><small>Received</small><strong>{Number.isFinite(+quantity) && +quantity > 0 ? +quantity : 0}</strong></span><ArrowRight size={20} /><span><small>New stock</small><strong>{p.stock + (Number.isSafeInteger(+quantity) && +quantity > 0 ? +quantity : 0)}</strong></span></div><button className="button primary full" type="submit" disabled={saving}>{saving ? "Updating stock…" : "Confirm stock received"}{!saving && <Check size={19} />}</button><button className="button subtle full" type="button" onClick={onCancel} disabled={saving}>Cancel</button><p className="sample-footnote">Count the goods you received, then confirm.<br />Your stock and restock suggestion will update together.</p></form>;
}

function ForecastOverview({ products, onSelect, onRecord, query, onQuery }: { query: string; onQuery: (query: string) => void; products: Product[]; onSelect: (p: Product) => void; onRecord: () => void }) {
  const [showBanner, setShowBanner] = useState(true);
  const items = [...products].sort((a, b) => restock(b) - restock(a));
  const needs = items.filter(p => p.forecast && restock(p) > 0);
  const covered = items.filter(p => p.forecast && restock(p) === 0);
  const forecastCount = items.filter(p => p.forecast).length;
  if (!products.length) return <EmptyState icon={ChartLineUp} title="Good insights start with sales" detail="Add products and record sales to build your shop’s history." action="Record a sale" onAction={onRecord} />;
  return <>{showBanner && forecastCount > 0 && <section className="orange-card"><span className="insight-orb"><ChartLineUp size={24} /></span><h2>{needs.length ? `${needs.length} products could use\na little more stock.` : "Your shelves look ready\nfor the week ahead."}</h2><div><button className="button outline-light" onClick={() => setShowBanner(false)}>Dismiss</button><button className="button white" onClick={() => onSelect(needs[0] ?? covered[0])}>{needs.length ? "See suggestion" : "View outlook"}<ArrowUpRight size={15} /></button></div></section>}
    {forecastCount === 0 ? <EmptyState icon={ChartLineUp} title="A little more history first." detail="Record sales for your products to build a useful outlook. No demand estimates are available yet." action="Record a sale" onAction={onRecord} /> : <div className="forecast-summary"><div className="large-ring"><Ring value={forecastCount ? covered.length / forecastCount * 100 : 0} size={110} /><span>{covered.length}<small>of {forecastCount} estimated</small></span></div><div><span className="legend-line"><i />Stock coverage</span><strong>{covered.length} products covered</strong><span className="legend-line gray"><i />Needs a closer look</span><strong>{needs.length} restock suggestions</strong></div></div>}
    <div className="section-heading"><h2>Product outlook</h2><span>7-day estimates</span></div><Search value={query} onChange={onQuery} /><div className="grouped-list forecast-product-list">{items.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => <ProductRow key={p.id} product={p} onClick={() => onSelect(p)} right={<><strong className={restock(p) ? "accent-text" : ""}>{!p.forecast ? "More history" : restock(p) ? `+${units(restock(p), p.unit)}` : "Covered"}</strong><small>{!p.forecast ? "needed" : restock(p) ? "suggested restock" : "no restock needed"}</small></>} />)}{!items.some(p => p.name.toLowerCase().includes(query.toLowerCase())) && <EmptyState icon={MagnifyingGlass} title="No matching products" detail="Try another product name." action="Clear search" onAction={() => onQuery("")} />}</div><p className="sample-footnote">Illustrative demo estimates, not trained model output.<br />Your judgment makes the final call.</p></>;
}

function ForecastDetail({ product: p, onReceive, onRecord, onProduct, snapshotAt }: { snapshotAt?: string; product: Product; onReceive: () => void; onRecord: () => void; onProduct: () => void }) {
  const forecast = demand(p);
  const [showDetails, setShowDetails] = useState(false);
  const series = p.forecast?.map((quantity, i) => { const date = snapshotAt ? new Date(snapshotAt) : new Date(); date.setUTCDate(date.getUTCDate() + i + 1); return { day: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Africa/Addis_Ababa" }), date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Addis_Ababa" }), quantity }; });
  return <><button className="selected-product forecast-selected" onClick={onProduct}><ProductMark product={p} /><span><strong>{p.name}</strong><small>7-day sample outlook</small></span><CaretRight size={18} /></button>{forecast === null ? <EmptyState icon={ChartLineUp} title="A little more history first." detail="There isn’t enough sales history for this product yet. Keep recording sales so a useful estimate can be made. Your stock is still available in Products." action="Record a sale" onAction={onRecord} /> : <>
    <section className="orange-card recommendation"><span className="source-badge light">{p.forecastKind === "baseline" ? "Demo baseline estimate" : "Demo estimate"}</span><p>Suggested restock</p><h2>{restock(p)} <span>{p.unit}{restock(p) !== 1 && "s"}</span></h2><span>{restock(p) ? "A little preparation for the week ahead." : "No restock suggested for this estimate."}</span></section>
    <p className="sample-footnote">{snapshotAt ? `Sample created ${new Date(snapshotAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Addis_Ababa" })}.` : "Sample creation date unavailable."} Stock uses your latest saved quantity.</p>
    <div className="detail-grid forecast-numbers"><div className="white-card"><small>Expected demand</small><strong>{forecast}</strong><span>{p.unit}s over 7 days</span></div><div className="white-card"><small>Currently in stock</small><strong>{p.stock}</strong><span>{p.unit}s on your shelves</span></div></div>
    <div className="section-heading"><h2>A day-by-day look</h2><span>{p.unit}s / day</span></div><div className="chart-card" role="img" aria-label={`Seven day demo demand: ${series?.map(d => `${d.day} ${d.date}: ${d.quantity}`).join(", ")}. Total ${forecast} ${p.unit}s.`}><ResponsiveContainer width="100%" height={165} minWidth={0}><BarChart data={series} margin={{ top: 12, right: 4, bottom: 0, left: -30 }}><CartesianGrid stroke="#eeedeb" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 11, fill: "#767572" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b8985" }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#f5f3f0" }} contentStyle={{ border: "none", borderRadius: 14, boxShadow: "0 4px 20px #0000000a", fontSize: 12 }} formatter={v => [units(Number(v), p.unit), "Estimated demand"]} /><Bar dataKey="quantity" fill="#df6543" radius={[7, 7, 7, 7]} maxBarSize={23} isAnimationActive={false} /></BarChart></ResponsiveContainer><p>Dates: {series?.[0].date} – {series?.[6].date}</p></div>
    <button className="explanation-toggle" onClick={() => setShowDetails(v => !v)} aria-expanded={showDetails}><span>How we got this number</span><Plus size={17} style={{ transform: showDetails ? "rotate(45deg)" : undefined }} /></button>{showDetails && <div className="forecast-explanation"><p>max(0, {forecast} expected − {p.stock} in stock) = <strong>{restock(p)} suggested</strong>. Suggestions never go below zero.</p><p>Safety stock is set to zero in this demo. Supplier lead time and incoming orders are not included. This is sample data, not a trained model prediction.</p><p>The chart shows the dated sample period above. Demand is a fixed demonstration series; the suggested quantity uses your latest demo stock.</p></div>}
    <p className="helper-line"><WarningCircle size={17} />An estimate to help you decide. Never a guarantee.</p><button className="button primary full" onClick={onReceive}>Stock arrived? Add it here<Plus size={18} /></button><p className="sample-footnote">Only update stock after receiving the goods.</p>
  </>}</>;
}

function DemoSettings({ onReset, onTour, shopName, data }: { onReset: () => void; onTour: () => void; shopName: string; data: ShopData }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  function reset() { try { onReset(); } catch (e) { setError(e instanceof Error ? e.message : "Could not reset. Try again."); } }
  function exportShop() {
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Export current in-memory records when storage is unavailable. */ }
    const url = URL.createObjectURL(new Blob([saved ?? JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "mela-ai-shop-backup.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <><div className="form-intro"><span className="form-icon"><Storefront size={28} /></span><h2>{shopName}</h2><p>A sample shop to make yourself at home in.</p></div><div className="settings-list"><div><span>Currency</span><strong>Ethiopian birr · ETB</strong></div><div><span>Language</span><strong>English</strong></div><div><span>Data</span><strong>Local demo records</strong></div><div><span>Forecasts</span><strong>Illustrative estimates</strong></div></div><p className="settings-description">Add products, record sales, and receive stock. Your demo changes stay in this browser. Real accounts, payments, and a trained forecast service aren’t connected.</p><button className="button white full" onClick={onTour}>Welcome tour &amp; account screens<ArrowRight size={18} /></button><button className="button white full" onClick={exportShop}>Export shop backup<ArrowDown size={18} /></button><button className="button subtle full" onClick={() => setConfirm(true)}><ArrowClockwise size={19} />Reset demo shop</button>{confirm && <div className="inline-confirm" role="alert"><strong>Start fresh?</strong><p>This clears your local demo changes and restores the sample shop.</p><div><button className="button white" onClick={() => setConfirm(false)}>Keep my changes</button><button className="button primary" onClick={reset}>Reset demo</button></div></div>}{error && <p className="field-error" role="alert">{error}</p>}<p className="sample-footnote">Mela AI · A little clarity for your everyday shop.</p></>;
}
