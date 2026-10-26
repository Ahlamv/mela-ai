"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle, ChartLineUp, Eye, EyeSlash, LockKey, Package, Receipt, Storefront } from "@phosphor-icons/react";
import { FIELD_LIMITS, nameError } from "@/lib/demo-data";
import { BrandLogo } from "./brand-logo";
import styles from "./entry-flow.module.css";

export type EntryPreviewData = { name: string; email: string; shopName: string };

type Stage = "intro" | "tour" | "access" | "signin" | "signup" | "verify" | "forgot" | "reset" | "resetDone" | "setup";
const slides = [
  { image: "stock", eyebrow: "01 / KNOW YOUR SHELVES", title: <>A place for every<br />little thing.</>, description: "Add your products and see what’s in stock. Your whole shop, in one clear view.", label: "Your stock, at a glance", value: "24", unit: "products on your shelves", icon: Package },
  { image: "sale", eyebrow: "02 / MAKE EVERY SALE COUNT", title: <>One sale. Less<br />to keep in mind.</>, description: "Record a sale in a few taps. Your stock updates with it, so you can get back to your customers.", label: "Cooking oil · 1 L", value: "12", unit: "bottles in stock", icon: Receipt },
  { image: "forecast", eyebrow: "03 / LOOK A LITTLE AHEAD", title: <>Tomorrow, with<br />a little more clarity.</>, description: "See what may sell next and what needs restocking. A helpful estimate. The final call is yours.", label: "A little preparation", value: "+18", unit: "bottles suggested to restock", icon: ChartLineUp },
];

function PasswordField({ label = "Password", value, onChange, error, id, autoComplete = "current-password" }: { label?: string; value: string; onChange: (value: string) => void; error?: string; id: string; autoComplete?: "current-password" | "new-password" }) {
  const [visible, setVisible] = useState(false);
  return <label className={styles.field} htmlFor={id}>{label}<span className={styles.passwordWrap}>
    <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} placeholder="At least 8 characters" required />
    <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeSlash size={20} /> : <Eye size={20} />}</button>
  </span>{error && <span className={styles.error} id={`${id}-error`} role="alert">{error}</span>}</label>;
}

export function EntryFlow({ hasSavedShop, onBegin, onContinue, initialValues }: { initialValues?: EntryPreviewData; hasSavedShop: boolean; onBegin: (empty: boolean, name: string) => void; onContinue: () => void }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [stockMoved, setStockMoved] = useState(false);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [shopName, setShopName] = useState(initialValues?.shopName ?? "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [emailPurpose, setEmailPurpose] = useState<"signup" | "reset">("signup");
  const rootRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  function changeStage(next: Stage) { if (busyRef.current) return; setErrors({}); setStatus(""); setPassword(""); setConfirmation(""); setStage(next); }
  useEffect(() => {
    if (stage !== "intro") return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1700;
    const timer = setTimeout(() => setStage("tour"), delay);
    return () => clearTimeout(timer);
  }, [stage]);
  useEffect(() => {
    if (stage !== "tour") return;
    setStockMoved(false);
    const timer = setTimeout(() => setStockMoved(true), 1100);
    return () => clearTimeout(timer);
  }, [stage, step]);
  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0, behavior: "instant" });
    const heading = rootRef.current?.querySelector<HTMLElement>("h1");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [stage, step]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function complete(action: () => void) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setLeaving(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 480;
    timerRef.current = setTimeout(() => {
      try { action(); }
      catch (error) { setErrors({ form: error instanceof Error ? error.message : "Could not open your shop. Please try again." }); setLeaving(false); }
      finally { busyRef.current = false; setBusy(false); }
    }, delay);
  }
  function explore() { complete(() => hasSavedShop ? onContinue() : onBegin(false, "")); }
  function validateEmail() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
  function submitAuth(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (stage === "signup") { const invalidName = nameError(name, FIELD_LIMITS.accountName); if (invalidName) next.name = invalidName; }
    if (!validateEmail()) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => rootRef.current?.querySelector<HTMLInputElement>("[aria-invalid=true]")?.focus()); return; }
    // This is an interaction reference: no credential is stored or sent.
    setPassword("");
    if (stage === "signup") { setEmailPurpose("signup"); setCode(""); changeStage("verify"); }
    else if (hasSavedShop) complete(onContinue);
    else changeStage("setup");
  }
  function submitRecovery(event: FormEvent) {
    event.preventDefault();
    if (!validateEmail()) { setErrors({ email: "Enter a valid email address." }); return; }
    setEmailPurpose("reset"); setCode(""); changeStage("verify");
  }
  function verify(event: FormEvent) {
    event.preventDefault();
    if (code !== "123456") { setErrors({ code: "For this preview, enter the demo code 123456." }); return; }
    changeStage(emailPurpose === "reset" ? "reset" : "setup");
  }
  function resetPassword(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirmation !== password) next.confirmation = "Your passwords don’t match.";
    setErrors(next); if (Object.keys(next).length) return;
    changeStage("resetDone");
  }
  function setup(event: FormEvent) {
    event.preventDefault();
    const invalidName = nameError(shopName, FIELD_LIMITS.shopName);
    if (invalidName) { setErrors({ shop: invalidName }); return; }
    complete(() => onBegin(true, shopName.trim()));
  }
  function back() {
    if (busyRef.current) return;
    if (stage === "tour") { setStep(s => Math.max(0, s - 1)); return; }
    if (stage === "access") { setStep(2); changeStage("tour"); return; }
    if (stage === "verify") changeStage(emailPurpose === "reset" ? "forgot" : "signup");
    else if (stage === "forgot" || stage === "reset" || stage === "resetDone") changeStage("signin");
    else if (stage === "setup") changeStage("access");
    else changeStage("access");
  }
  const slide = slides[step];
  const Mark = slide.icon;
  const auth = stage === "signin" || stage === "signup";
  const showBack = stage !== "intro" && (stage !== "tour" || step > 0);
  return <section ref={rootRef} className={`${styles.flow} ${leaving ? styles.leaving : ""}`} aria-label="Welcome and account access" aria-busy={busy}>
    <header className={styles.header}>
      <div>{showBack && <button className={styles.back} type="button" aria-label="Go back" onClick={back} disabled={busy}><ArrowLeft size={21} /></button>}</div>
      <div className={`${styles.logoDock} ${stage === "intro" ? styles.logoIntro : ""}`}><BrandLogo /></div>
      <div>{stage === "tour" && <button className={styles.skip} type="button" onClick={() => changeStage("access")}>Skip</button>}</div>
    </header>

    {stage === "intro" && <div className={styles.splash}>
      <div className={styles.splashStock} aria-hidden="true"><span><Package size={25} /></span><span><Receipt size={25} /></span><span><ChartLineUp size={25} /></span></div>
      <h1>A little clarity.<br />A better shop day.</h1><p>Stock. Sales. A step ahead.</p>
      <button type="button" className={styles.splashContinue} onClick={() => changeStage("tour")}>Let’s take a look <ArrowRight size={17} /></button>
    </div>}

    {stage === "tour" && <div key={step} className={styles.scene}>
      <div className={styles.illustration}>
        <Image src={`/onboarding/${slide.image}.svg`} alt="" width={500} height={500} unoptimized sizes="(max-width: 500px) 100vw, 350px" loading={step === 0 ? "eager" : "lazy"} />
        <div className={`${styles.stockCard} ${stockMoved ? styles.stockChanged : ""}`} aria-hidden="true"><span className={styles.metricIcon}><Mark size={22} /></span><span><small>{slide.label}</small><strong key={stockMoved ? "after" : "before"}>{step === 1 && stockMoved ? "11" : slide.value}<span>{slide.unit}</span></strong></span>{step === 1 ? <span className={styles.saleDelta}>−1</span> : <CheckCircle size={22} className={styles.metricCheck} />}</div>
      </div>
      <div className={styles.tourCopy}><p className={styles.eyebrow}>{slide.eyebrow}</p><h1>{slide.title}</h1><p>{slide.description}</p></div>
      <footer className={styles.tourFooter}>
        <button type="button" className={styles.primary} onClick={() => step < 2 ? setStep(s => s + 1) : changeStage("access")}>{step === 2 ? "Let’s get started" : "Continue"}<ArrowRight size={19} /></button>
        <div className={styles.tourMeta}>
          <div className={styles.dots} role="group" aria-label="Onboarding pages">{slides.map((_, i) => <button type="button" key={i} aria-label={`Page ${i + 1}: ${["Stock", "Sales", "Restocking"][i]}`} aria-current={step === i ? "step" : undefined} onClick={() => setStep(i)}><span /></button>)}</div>
          <button className={styles.tourSignIn} type="button" onClick={() => changeStage("signin")}>Sign in</button>
        </div>
      </footer>
    </div>}

    {stage === "access" && <div className={styles.page} key="access">
      <div className={styles.accessArt}><Image src="/onboarding/stock.svg" alt="" width={500} height={500} unoptimized sizes="260px" /><span><Storefront size={22} /></span></div>
      <p className={styles.eyebrow}>A LITTLE CLARITY, EVERY DAY</p><h1>Your shop.<br />A fresh perspective.</h1><p className={styles.description}>A simpler way to look after the business you’re building.</p>
      <div className={styles.actions}><button type="button" className={styles.primary} onClick={() => changeStage("signup")}>Create an account<ArrowRight size={19} /></button><button type="button" className={styles.secondary} onClick={() => changeStage("signin")}>Sign in</button><button type="button" className={styles.textButton} onClick={explore} disabled={busy}>{hasSavedShop ? "Continue to my saved demo" : "Take a look around first"}<ArrowRight size={17} /></button></div>
      <p className={styles.demoNote}>You’re exploring a UI preview.<br />Account services aren’t connected yet.</p>
    </div>}

    {auth && <div className={`${styles.page} ${styles.authPage}`} key={stage}>
      <span className={styles.symbol}>{stage === "signin" ? <LockKey size={28} /> : <Storefront size={28} />}</span>
      <p className={styles.eyebrow}>{stage === "signin" ? "GOOD TO HAVE YOU BACK" : "YOUR NEXT CHAPTER"}</p><h1>{stage === "signin" ? <>Hello again.<br />How’s the shop?</> : <>Small beginnings.<br />Big possibilities.</>}</h1>
      <p className={styles.description}>{stage === "signin" ? "A clear view of your shop is just a moment away." : "Make a little room for a simpler shop day."}</p>
      <form className={styles.form} onSubmit={submitAuth} noValidate>
        {stage === "signup" && <label className={styles.field}>Your name<input autoComplete="name" value={name} maxLength={FIELD_LIMITS.accountName} onChange={e => setName(e.target.value)} placeholder="How should we call you?" aria-invalid={!!errors.name} aria-describedby={errors.name ? "entry-name-error" : undefined} required />{errors.name && <span id="entry-name-error" className={styles.error} role="alert">{errors.name}</span>}</label>}
        <label className={styles.field}>Email address<input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={FIELD_LIMITS.email} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "entry-email-error" : undefined} required />{errors.email && <span id="entry-email-error" className={styles.error} role="alert">{errors.email}</span>}</label>
        <PasswordField id={`entry-${stage}-password`} autoComplete={stage === "signup" ? "new-password" : "current-password"} value={password} onChange={setPassword} error={errors.password} />
        {stage === "signin" && <button type="button" className={styles.forgot} onClick={() => changeStage("forgot")}>Forgot password?</button>}
        <button type="submit" className={styles.primary} disabled={busy}>{busy ? "Opening your shop…" : stage === "signin" ? "Preview sign in" : "Preview account creation"}<ArrowRight size={19} /></button>
      </form>
      <p className={styles.switchPrompt}>{stage === "signin" ? "New to Mela AI?" : "Already have an account?"} <button type="button" onClick={() => changeStage(stage === "signin" ? "signup" : "signin")}>{stage === "signin" ? "Create account" : "Sign in"}</button></p>
      <p className={styles.demoNote}><LockKey size={14} />UI preview · use example details.<br />Credentials aren’t stored or sent.</p>
    </div>}

    {stage === "forgot" && <div className={styles.page} key="forgot"><span className={styles.symbol}><LockKey size={28} /></span><p className={styles.eyebrow}>LET’S GET YOU BACK IN</p><h1>A fresh start<br />for your password.</h1><p className={styles.description}>Enter the email you use for your shop.</p><form className={styles.form} onSubmit={submitRecovery} noValidate><label className={styles.field}>Email address<input type="email" autoComplete="email" autoCapitalize="none" maxLength={FIELD_LIMITS.email} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "recovery-email-error" : undefined} required />{errors.email && <span id="recovery-email-error" className={styles.error} role="alert">{errors.email}</span>}</label><button type="submit" className={styles.primary}>Preview recovery<ArrowRight size={19} /></button></form><button type="button" className={styles.textButton} onClick={() => changeStage("signin")}>Back to sign in</button><p className={styles.demoNote}>UI preview · no recovery email is sent.</p></div>}

    {stage === "verify" && <div className={styles.page} key="verify"><span className={styles.symbol}><CheckCircle size={29} /></span><p className={styles.eyebrow}>ONE LITTLE CHECK</p><h1>A small step.<br />Then you’re in.</h1><p className={styles.description}>The live app will verify your email at<br /><strong className={styles.email}>{email.trim()}</strong></p><form className={styles.form} onSubmit={verify} noValidate><label className={styles.field}>6-digit verification code<input className={styles.code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setErrors({}); }} placeholder="000000" aria-invalid={!!errors.code} aria-describedby="verification-help" required /></label><p id="verification-help" className={styles.codeHint}>Demo code: <strong>123456</strong> · No email was sent.</p>{errors.code && <p className={styles.error} role="alert">{errors.code}</p>}<button type="submit" className={styles.primary}>Continue<ArrowRight size={19} /></button></form><button type="button" className={styles.textButton} onClick={() => setStatus("Your demo code is still 123456. No email is sent in this preview.")}>Resend code</button>{status && <p className={styles.inlineStatus} role="status">{status}</p>}<button type="button" className={styles.textButton} onClick={() => changeStage(emailPurpose === "reset" ? "forgot" : "signup")}>Use a different email</button></div>}

    {stage === "reset" && <div className={styles.page} key="reset"><span className={styles.symbol}><LockKey size={28} /></span><p className={styles.eyebrow}>A FRESH START</p><h1>Make it<br />a memorable one.</h1><p className={styles.description}>Choose a new password for your shop account.</p><form className={styles.form} onSubmit={resetPassword} noValidate><PasswordField id="entry-new-password" label="New password" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} /><PasswordField id="entry-confirm-password" label="Confirm password" autoComplete="new-password" value={confirmation} onChange={setConfirmation} error={errors.confirmation} /><button type="submit" className={styles.primary}>Preview password reset<ArrowRight size={19} /></button></form><p className={styles.demoNote}>UI preview · no account password is changed.</p></div>}

    {stage === "resetDone" && <div className={`${styles.page} ${styles.successPage}`} key="resetDone"><span className={styles.successSymbol}><Check size={35} /></span><p className={styles.eyebrow}>READY FOR WHAT’S NEXT</p><h1>Back to<br />a clearer day.</h1><p className={styles.description}>That’s the password recovery flow.<br />In the live app, you could now sign in with your new password.</p><button type="button" className={styles.primary} onClick={() => changeStage("signin")}>Back to sign in<ArrowRight size={19} /></button><p className={styles.demoNote}>Preview complete · no password was changed.</p></div>}

    {stage === "setup" && <div className={styles.page} key="setup"><span className={styles.symbol}><Storefront size={30} /></span><p className={styles.eyebrow}>MAKE YOURSELF AT HOME</p><h1>Every good shop<br />starts with a name.</h1><p className={styles.description}>{hasSavedShop ? "Continue where you left off. Your products and sales will stay just as you saved them." : "Set up your space. Your first product comes next."}</p>{hasSavedShop ? <div className={styles.actions}><button type="button" className={styles.primary} disabled={busy} onClick={() => complete(onContinue)}>Continue to saved shop<ArrowRight size={19} /></button></div> : <form className={styles.form} onSubmit={setup} noValidate><label className={styles.field}>Shop name<input autoComplete="organization" maxLength={FIELD_LIMITS.shopName} value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Selam Mini Market" aria-invalid={!!errors.shop} aria-describedby={errors.shop ? "entry-shop-error" : undefined} required />{errors.shop && <span id="entry-shop-error" className={styles.error} role="alert">{errors.shop}</span>}</label><div className={styles.shopDefaults}><span>Currency<strong>ETB · Ethiopian birr</strong></span><span>Language<strong>English</strong></span></div><button type="submit" className={styles.primary} disabled={busy}>{busy ? "Getting your shop ready…" : "Open my demo shop"}<ArrowRight size={19} /></button></form>}<button type="button" className={styles.textButton} disabled={busy} onClick={explore}>{hasSavedShop ? "Back to my saved demo" : "Explore a sample shop instead"}</button><p className={styles.demoNote}>Local demo · your shop stays in this browser.</p></div>}
    {errors.form && <p className={styles.formError} role="alert">{errors.form}</p>}
  </section>;
}
