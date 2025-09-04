import React from 'react';

// Toast Context
const ToastContext = React.createContext({
  toast: () => {},
  showToast: () => {},
  notify: () => {}
});

// Toast Hook
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback implementation if context is not available
    return {
      toast: (options) => {
        console.log('Toast:', options);
        // Simple browser notification as fallback
        if (options.title) {
          console.log(`${options.title}: ${options.description || ''}`);
        }
      },
      showToast: (options) => {
        console.log('ShowToast:', options);
      },
      notify: (options) => {
        console.log('Notify:', options);
      }
    };
  }
  return context;
};

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback((options) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = {
      id,
      title: options.title || '',
      description: options.description || options.message || '',
      variant: options.variant || 'default',
      type: options.type || 'info',
      timeout: options.timeout ?? 3000
    };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (newToast.timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.timeout);
    }
  }, []);

  const showToast = React.useCallback((options) => {
    toast(options);
  }, [toast]);

  const notify = React.useCallback((options) => {
    toast(options);
  }, [toast]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue = React.useMemo(() => ({
    toast,
    showToast,
    notify
  }), [toast, showToast, notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-sm p-3 rounded-lg shadow-md border text-sm bg-white ${
              t.variant === 'destructive' || t.type === 'error'
                ? 'border-red-200 bg-red-50'
                : t.variant === 'success' || t.type === 'success'
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {t.variant === 'destructive' || t.type === 'error'
                  ? '⚠️'
                  : t.variant === 'success' || t.type === 'success'
                  ? '✅'
                  : 'ℹ️'}
              </div>
              <div className="flex-1">
                {t.title && (
                  <div className="font-medium mb-0.5">{t.title}</div>
                )}
                {t.description && (
                  <div className="text-gray-700">{t.description}</div>
                )}
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => removeToast(t.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default useToast;