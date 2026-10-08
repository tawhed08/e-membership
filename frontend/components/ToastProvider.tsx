"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { id, message, kind }]);
      window.setTimeout(
        () => setToasts((items) => items.filter((item) => item.id !== id)),
        4200
      );
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={`animate-float-in pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur ${
              toast.kind === "success"
                ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-200"
                : toast.kind === "error"
                  ? "border-rose-400/30 bg-rose-950/90 text-rose-200"
                  : "border-indigo-400/30 bg-slate-900/95 text-slate-100"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
