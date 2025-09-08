import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 320);
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = Date.now() + Math.random();
      const toast = { id, message, type, visible: true };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const api = {
    showToast,
    success: (msg, d = 3000) => showToast(msg, "success", d),
    error: (msg, d = 5000) => showToast(msg, "error", d),
    info: (msg, d = 3000) => showToast(msg, "info", d),
    warn: (msg, d = 4000) => showToast(msg, "warn", d),
    dismiss: removeToast,
    clear: () => setToasts([]),
  };

  const getConfig = (type) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-5 h-5 text-white" />,
          classes: "bg-green-500 text-white",
        };
      case "error":
        return {
          icon: <XCircle className="w-5 h-5 text-white" />,
          classes: "bg-red-500 text-white",
        };
      case "warn":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-black" />,
          classes: "bg-yellow-400 text-black",
        };
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5 text-white" />,
          classes: "bg-gray-800 text-white",
        };
    }
  };

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toast container */}
      <div className="fixed top-20 right-8 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => {
          const cfg = getConfig(t.type);
          return (
            <div
              key={t.id}
              className={`max-w-sm w-full px-4 py-2 rounded-lg shadow-lg transition-all
              ${t.visible ? "animate-slide-in" : "animate-slide-out"} ${
                cfg.classes
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <span className="text-sm">{t.message}</span>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="ml-2 opacity-80 hover:opacity-100"
                  aria-label="Close toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
};
