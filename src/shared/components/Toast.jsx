import React from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
          <Transition
            key={t.id}
            show={true}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className={`min-w-[280px] max-w-sm p-4 rounded-lg shadow-lg border text-sm bg-white transform transition-all duration-200 hover:shadow-xl hover:scale-105 ${
                t.type === 'success' ? 'border-green-200 bg-green-50' : 
                t.type === 'error' ? 'border-red-200 bg-red-50' : 
                t.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {t.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  {t.type === 'error' && <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />}
                  {t.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />}
                  {(t.type === 'info' || !t.type) && <InformationCircleIcon className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <div className={`font-semibold mb-1 ${
                    t.type === 'success' ? 'text-green-800' :
                    t.type === 'error' ? 'text-red-800' :
                    t.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>{t.title}</div>}
                  {t.message && <div className={`text-sm ${
                    t.type === 'success' ? 'text-green-700' :
                    t.type === 'error' ? 'text-red-700' :
                    t.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>{t.message}</div>}
                </div>
                <button 
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:bg-gray-100 rounded-full p-1" 
                  onClick={() => remove(t.id)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Transition>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

