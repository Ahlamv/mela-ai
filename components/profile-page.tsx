"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, CaretRight, Check, User } from "@phosphor-icons/react";
import { FIELD_LIMITS, isShopProfile, nameError, type ShopData, type ShopProfile } from "@/lib/demo-data";
import { useDraftGuard, type DraftChange } from "./use-draft-guard";
import styles from "./profile-page.module.css";

export function ProfileAvatar({ photo, size = 24 }: { photo?: string; size?: number }) {
  const [failed, setFailed] = useState<string>();
  return photo && failed !== photo
    ? <img src={photo} alt="" width={size} height={size} onError={() => setFailed(photo)} />
    : <User size={size} weight="regular" aria-hidden="true" />;
}

export type ProfileUpdate = { shopName: string; profile: ShopProfile };

export function ProfilePage({ data, onSave, onSettings, onDraftChange }: {
  data: ShopData;
  onSave: (update: ProfileUpdate) => void;
  onSettings: () => void;
  onDraftChange: DraftChange;
}) {
  const initial: ProfileUpdate = {
    shopName: data.shopName ?? "Selam Mini Market",
    profile: data.profile ?? { name: "", email: "", phone: "", address: "" },
  };
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null);
  const dirty = draft.shopName !== initial.shopName || (Object.keys(draft.profile) as (keyof ShopProfile)[]).some(key => draft.profile[key] !== initial.profile[key]) || draft.profile.photo !== initial.profile.photo;
  useDraftGuard(dirty, readingPhoto, onDraftChange);
  useEffect(() => () => { if (reader.current?.readyState === FileReader.LOADING) reader.current.abort(); }, []);

  function change<K extends keyof ShopProfile>(key: K, value: ShopProfile[K]) {
    setDraft(current => ({ ...current, profile: { ...current.profile, [key]: value } }));
    setErrors(current => ({ ...current, [key]: "", form: "" }));
    setSaved(false);
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1_048_576) {
      setErrors(current => ({ ...current, photo: "Choose a JPG, PNG or WebP image up to 1 MB." }));
      return;
    }
    setReadingPhoto(true);
    const next = new FileReader();
    reader.current = next;
    next.onload = () => {
      if (typeof next.result === "string") change("photo", next.result);
      else setErrors(current => ({ ...current, photo: "Couldn’t read that photo. Try another image." }));
      setReadingPhoto(false);
    };
    next.onerror = () => { setErrors(current => ({ ...current, photo: "Couldn’t read that photo. Try again." })); setReadingPhoto(false); };
    next.readAsDataURL(file);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (readingPhoto) return;
    const next: ProfileUpdate = {
      shopName: draft.shopName.trim(),
      profile: { ...draft.profile, name: draft.profile.name.trim(), email: draft.profile.email.trim(), phone: draft.profile.phone.trim(), address: draft.profile.address.trim() },
    };
    const issues: Record<string, string> = {};
    const shopError = nameError(next.shopName, FIELD_LIMITS.shopName, initial.shopName);
    if (shopError) issues.shopName = shopError;
    if (next.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.profile.email)) issues.email = "Enter a valid email address.";
    if (!isShopProfile(next.profile)) issues.form = "Check your profile details and photo, then try again.";
    setErrors(issues);
    if (Object.keys(issues).length) {
      const key = issues.shopName ? "shopName" : issues.email ? "email" : "name";
      document.getElementById(`profile-${key}`)?.focus();
      return;
    }
    try {
      onSave(next);
      setDraft(next);
      onDraftChange(false);
      setSaved(true);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Couldn’t save your profile. Try again." });
    }
  }

  return <div className={styles.page}>
    <div className={styles.hero}>
      <span className={styles.avatar}><ProfileAvatar photo={draft.profile.photo} size={40} /></span>
      <p className="eyebrow">YOUR SPACE</p>
      <h2 dir="auto">{draft.profile.name.trim() || "Make it yours."}</h2>
      <p>Your details. Your shop. All in one place.</p>
      <div className={styles.photoActions}>
        <button type="button" disabled={readingPhoto} onClick={() => fileInput.current?.click()}>{readingPhoto ? "Reading photo…" : "Change photo"}</button>
        {draft.profile.photo && <button type="button" disabled={readingPhoto} onClick={() => change("photo", undefined)}>Remove</button>}
      </div>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} hidden aria-label="Profile photo" aria-describedby="profile-photo-help" />
      <p id="profile-photo-help" className={styles.photoHelp}>JPG, PNG or WebP · up to 1 MB</p>
      {errors.photo && <p className={styles.error} role="alert">{errors.photo}</p>}
    </div>
    <form onSubmit={submit} noValidate className={styles.form}>
      <fieldset>
        <legend>Personal details</legend>
        <p className={styles.hint}>These details are optional.</p>
        <label htmlFor="profile-name">Your name<input id="profile-name" autoComplete="name" maxLength={FIELD_LIMITS.accountName} value={draft.profile.name} onChange={event => change("name", event.target.value)} placeholder="e.g. Selam Tesfaye" /></label>
        <label htmlFor="profile-email">Email address<input id="profile-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={FIELD_LIMITS.email} value={draft.profile.email} onChange={event => change("email", event.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "profile-email-error" : undefined} />{errors.email && <span id="profile-email-error" className={styles.error}>{errors.email}</span>}</label>
        <label htmlFor="profile-phone">Phone number<input id="profile-phone" type="tel" autoComplete="tel" maxLength={FIELD_LIMITS.phone} value={draft.profile.phone} onChange={event => change("phone", event.target.value)} placeholder="e.g. +251 9…" /></label>
      </fieldset>
      <fieldset>
        <legend>Shop details</legend>
        <label htmlFor="profile-shopName">Shop name<input id="profile-shopName" autoComplete="organization" required maxLength={Math.max(FIELD_LIMITS.shopName, initial.shopName.length)} value={draft.shopName} onChange={event => { setDraft(current => ({ ...current, shopName: event.target.value })); setErrors(current => ({ ...current, shopName: "", form: "" })); setSaved(false); }} aria-invalid={!!errors.shopName} aria-describedby={errors.shopName ? "profile-shop-error" : undefined} />{errors.shopName && <span id="profile-shop-error" className={styles.error}>{errors.shopName}</span>}</label>
        <label htmlFor="profile-address">Shop address <span className={styles.optional}>Optional</span><textarea id="profile-address" autoComplete="street-address" rows={3} maxLength={FIELD_LIMITS.address} value={draft.profile.address} onChange={event => change("address", event.target.value)} placeholder="Area, street or a nearby landmark" /></label>
      </fieldset>
      {errors.form && <p className={styles.error} role="alert">{errors.form}</p>}
      <button className="button primary full" type="submit" disabled={!dirty || readingPhoto}>Save changes<Check size={18} /></button>
      <p className={styles.saveNote} role="status">{saved ? "Your changes are saved on this device." : "Saved in this browser. Email edits update your profile details, not a sign-in account."}</p>
    </form>
    <button type="button" className={styles.settingsLink} onClick={onSettings}><span><strong>App settings</strong><small>Backups, welcome tour and credits</small></span><CaretRight size={20} /></button>
    <p className={styles.footer}>A little clarity, made personal.<ArrowRight size={14} /></p>
  </div>;
}
