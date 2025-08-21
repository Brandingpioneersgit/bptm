import React from 'react';

const ToastContext = React.createContext({ notify: () => {} });
export const useToast = () => React.useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const notify = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const t = { id, type: toast.type || 'info', title: toast.title, message: toast.message, timeout: toast.timeout ?? 3000 };
    setToasts((prev) => [...prev, t]);
    if (t.timeout > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.timeout);
    }
  }, []);
  const remove = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`min-w-[260px] max-w-sm p-3 rounded-lg shadow-md border text-sm bg-white ${
              t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {t.type === 'success' ? '✅' : t.type === 'error' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="flex-1">
                {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
                {t.message && <div className="text-gray-700">{t.message}</div>}
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => remove(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

