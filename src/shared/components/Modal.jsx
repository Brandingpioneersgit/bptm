import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

export function Modal({ isOpen, onClose, title, message, onConfirm, onCancel, inputLabel, inputValue, onInputChange }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-2 sm:mt-3">
                  <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                  {inputLabel && (
                    <div className="mt-4">
                      <label htmlFor="modal-input" className="block text-sm font-medium text-gray-700">
                        {inputLabel}
                      </label>
                      <input
                        type="text"
                        id="modal-input"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3 sm:text-sm sm:p-2"
                        value={inputValue}
                        onChange={onInputChange}
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 sm:justify-end">
                  {onCancel && (
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 touch-manipulation"
                      onClick={onCancel}
                    >
                      Cancel
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
                      onClick={onConfirm}
                    >
                      OK
                    </button>
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

