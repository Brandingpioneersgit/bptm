import React, { Fragment, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AnimatedButton } from './Transitions';

export function Modal({ isOpen, onClose, title, message, onConfirm, onCancel, inputLabel, inputValue, onInputChange }) {
  const initialFocusRef = useRef(null);
  const inputRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the input if present, otherwise focus the first button
      const focusTarget = inputRef.current || initialFocusRef.current;
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100);
      }
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={onClose}
        initialFocus={initialFocusRef}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel 
                className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all"
                onKeyDown={handleKeyDown}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
              >
                <Dialog.Title 
                  as="h3" 
                  id="modal-title"
                  className="text-base sm:text-lg font-medium leading-6 text-gray-900"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2 sm:mt-3">
                  <p 
                    id="modal-description"
                    className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed"
                  >
                    {message}
                  </p>
                  {inputLabel && (
                    <div className="mt-4">
                      <label 
                        htmlFor="modal-input" 
                        className="block text-sm font-medium text-gray-700"
                      >
                        {inputLabel}
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        id="modal-input"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3 sm:text-sm sm:p-2 focus:outline-none focus:ring-2"
                        value={inputValue}
                        onChange={onInputChange}
                        autoComplete="off"
                        aria-describedby="modal-description"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 sm:justify-end" role="group" aria-label="Modal actions">
                  {onCancel && (
                    <AnimatedButton
                      variant="outline"
                      size="medium"
                      onClick={onCancel}
                      className="w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      aria-label="Cancel and close modal"
                    >
                      Cancel
                    </AnimatedButton>
                  )}
                  {onConfirm && (
                    <AnimatedButton
                      ref={!inputLabel ? initialFocusRef : null}
                      variant="primary"
                      size="medium"
                      onClick={onConfirm}
                      className="w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Confirm action"
                    >
                      OK
                    </AnimatedButton>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

