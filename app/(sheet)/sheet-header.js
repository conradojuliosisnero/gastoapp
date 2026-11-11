import Link from "next/link";
import Spinner from "@/app/spinner";

// Sticky, blurred top bar: Cancel on the left, title centered (iOS sheet style).
export function SheetHeader({ title, cancelHref, cancelLabel = "Cancelar", back = false }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-bg/80 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2 backdrop-blur-xl backdrop-saturate-[1.8] lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <Link href={cancelHref} className="flex min-h-11 items-center gap-0.5 justify-self-start rounded-lg text-[17px] text-accent transition active:opacity-60 focus-visible:outline-2 focus-visible:outline-accent">
        {back && (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        )}
        {cancelLabel}
      </Link>
      <h1 className="text-[17px] font-semibold">{title}</h1>
    </header>
  );
}

// Main action pinned to the bottom, where the thumb reaches. Submits the surrounding form.
export function SaveBar({ pending, label = "Guardar", disabled = false }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-glass-edge bg-glass pt-3 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur-xl backdrop-saturate-[1.8] lg:sticky lg:-mx-6 lg:mt-2 lg:rounded-b-[28px] lg:px-2">
      <div className="mx-auto max-w-md px-4 lg:max-w-none">
        <button
          type="submit"
          disabled={pending || disabled}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.3)] transition active:scale-[0.98] disabled:opacity-60 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {pending && <Spinner className="size-5" />}
          {pending ? "Guardando…" : label}
        </button>
      </div>
    </div>
  );
}
