"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

// const [confirm, dialog] = useConfirm(); render {dialog}; then `if (await confirm({...}))`.
export function useConfirm() {
  const [request, setRequest] = useState(null);
  const confirm = useCallback((options) => new Promise((resolve) => setRequest({ ...options, resolve })), []);
  const close = (answer) => {
    request?.resolve(answer);
    setRequest(null);
  };
  return [confirm, <ConfirmDialog key="confirm" request={request} onClose={close} />];
}

function ConfirmDialog({ request, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!request) {
      if (dialog.open) dialog.close();
      return;
    }
    dialog.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(dialog, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
  }, [request]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      onClick={(e) => e.target === ref.current && onClose(false)}
      className="m-auto w-[min(270px,calc(100%-48px))] overflow-hidden rounded-2xl bg-card p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      {request && (
        <>
          <div className="flex flex-col gap-1 px-4 pt-5 pb-4 text-center">
            <h2 id="confirm-title" className="text-[17px] font-semibold">{request.title}</h2>
            {request.message && <p id="confirm-message" className="text-[13px] text-muted">{request.message}</p>}
          </div>
          <div className="grid grid-cols-2 border-t border-line">
            <button type="button" autoFocus onClick={() => onClose(false)} className="min-h-11 text-[17px] text-accent active:bg-fill">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onClose(true)}
              className={`min-h-11 border-l border-line text-[17px] font-semibold active:bg-fill ${request.destructive ? "text-danger" : "text-accent"}`}
            >
              {request.confirmLabel ?? "Aceptar"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
