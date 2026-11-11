"use client";

import { useId } from "react";
import { typingMoney } from "@/lib/money";
import { pop } from "@/lib/motion";

// Shared building blocks so every form looks and behaves the same.

export const inputCls = "min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70";
export const dateCls = "rounded-lg bg-field px-2.5 py-1.5 text-[15px] font-semibold text-accent outline-none focus-visible:ring-2 focus-visible:ring-accent";

const SYMBOL = { COP: "$", USD: "US$" };

// Big amount card. `value` is the display string; the field formats as you type.
export function AmountHero({ label, value, onValue, currency = "COP", currencies, onCurrency, hint, tone = "", masked = false, trailing, name = "amount", placeholder = "0", ...input }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 rounded-[22px] bg-card px-5 pt-4 pb-5 ring-1 ring-line/70 transition-shadow focus-within:ring-2 focus-within:ring-accent/50">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-semibold uppercase tracking-wide text-muted">{label}</label>
        {currencies ? (
          <Segmented label="Moneda" name="currency" options={currencies} value={currency} onChange={onCurrency} compact />
        ) : (
          <span className="rounded-full bg-fill px-2.5 py-1 text-[12px] font-bold tracking-wide text-ink-2">{currency}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span aria-hidden="true" className={`text-[26px] font-semibold ${value ? tone || "text-ink" : "text-muted/60"}`}>{SYMBOL[currency]}</span>
        <input
          id={id}
          name={name}
          inputMode={currency === "USD" ? "decimal" : "numeric"}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValue(typingMoney(e.target.value, currency))}
          style={masked ? { WebkitTextSecurity: "disc" } : undefined}
          className={`min-w-0 flex-1 bg-transparent text-[44px] leading-tight font-bold tracking-tight tabular-nums outline-none placeholder:text-muted/40 ${tone}`}
          {...input}
        />
        {trailing}
      </div>
      {hint && <p className="text-[13px] text-muted tabular-nums">{hint}</p>}
    </div>
  );
}

// Grouped, inset card of rows with an optional title above and helper text below.
export function Section({ title, footer, children, className = "" }) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className="flex flex-col gap-1.5">
      {title && <h2 id={id} className="px-4 text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</h2>}
      <div className={`overflow-hidden rounded-2xl bg-card ring-1 ring-line/70 divide-y divide-line ${className}`}>{children}</div>
      {footer && <p className="px-4 text-[13px] leading-snug text-muted">{footer}</p>}
    </section>
  );
}

// One row: label on the left, control on the right. Rows with their own labelled control pass as="div".
export function Field({ label, children, as: Tag = "label", hint }) {
  return (
    <Tag className="flex min-h-[52px] items-center gap-3 px-4 py-1.5 transition-colors focus-within:bg-fill/60">
      <span className="flex w-28 shrink-0 flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {hint && <span className="text-[12px] text-muted">{hint}</span>}
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</span>
    </Tag>
  );
}

// iOS segmented control with a sliding thumb. Posts its value through a hidden input when `name` is set.
export function Segmented({ label, name, options, value, onChange, compact = false, full = false }) {
  const items = options.map((o) => (Array.isArray(o) ? o : [o, o]));
  const index = Math.max(0, items.findIndex(([v]) => v === value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative grid shrink-0 rounded-[10px] bg-segment p-0.5 ${full ? "w-full" : ""}`}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-lg bg-card shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none"
        style={{ width: `calc((100% - 4px) / ${items.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {items.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`relative z-10 rounded-lg font-semibold transition-colors active:scale-95 aria-[checked=false]:text-ink-2 focus-visible:outline-2 focus-visible:outline-accent ${compact ? "min-h-7 px-2.5 text-[12px]" : "min-h-8 px-3 text-[13px]"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function SwitchField({ label, hint, name, checked, defaultChecked, onChange, disabled = false }) {
  return (
    <label className={`flex min-h-[52px] items-center justify-between gap-3 px-4 py-2 transition-colors focus-within:bg-fill/60 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span className="flex flex-col">
        <span className="text-[15px] font-medium">{label}</span>
        {hint && <span className="text-[13px] text-muted">{hint}</span>}
      </span>
      <input name={name} type="checkbox" role="switch" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span aria-hidden="true" className="flex h-[31px] w-[51px] shrink-0 items-center rounded-full bg-switch p-0.5 transition-colors peer-checked:bg-ok peer-checked:*:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
        <span className="size-[27px] rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)]" />
      </span>
    </label>
  );
}

// Selectable pills (categories, types). Posts the selected id as `name`.
export function ChoiceChips({ name, label, options, value, onChange, children }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2 p-3">
      {options.map((o) => (
        <label key={o.id} className="cursor-pointer">
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={(e) => {
              onChange(o.id);
              pop(e.currentTarget.nextElementSibling);
            }} className="peer sr-only" />
          <span className="flex min-h-9 items-center gap-1.5 rounded-full bg-fill px-3.5 text-sm font-semibold text-ink-2 transition duration-200 active:scale-95 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-[0_4px_12px_rgba(10,102,216,0.3)] peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card">
            {value === o.id && (
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            )}
            {o.name}
          </span>
        </label>
      ))}
      {children}
    </div>
  );
}

export function FormError({ error }) {
  return (
    <p aria-live="polite" className="min-h-5 px-4 text-sm font-medium text-danger">
      {error}
    </p>
  );
}

export const Plus = ({ size = 14 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
