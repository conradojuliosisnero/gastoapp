import Link from "next/link";
import Spinner from "@/app/spinner";

export function SheetHeader({ title, cancelHref }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <Link href={cancelHref} className="flex min-h-11 items-center justify-self-start text-[17px] text-accent transition active:opacity-60">
        Cancelar
      </Link>
      <h1 className="text-[17px] font-semibold">{title}</h1>
    </div>
  );
}

// Main action pinned to the bottom, where the thumb reaches. Submits the surrounding form.
export function SaveBar({ pending, label = "Guardar" }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-glass-edge bg-glass pt-3 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur-xl backdrop-saturate-[1.8]">
      <div className="mx-auto max-w-md px-4">
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-semibold text-white shadow-[0_8px_20px_rgba(10,102,216,0.3)] transition active:scale-[0.98] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {pending && <Spinner className="size-5" />}
          {pending ? "Guardando…" : label}
        </button>
      </div>
    </div>
  );
}
