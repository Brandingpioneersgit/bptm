import React, { Fragment } from 'react';
import { Dialog, Transition } from "@headlessui/react";

export function LoginModal({ loginForm, setLoginForm, onLogin, loginError, onClose }) {
  return (
    <Transition appear show={true} as={Fragment}>
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
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg sm:text-xl font-bold text-gray-900">
                    {loginForm.userType === 'manager' ? '📋 Manager Login' : '👥 Employee Login'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={onLogin} className="space-y-4">
                  {loginForm.userType === 'employee' ? (
                    <>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation"
                          placeholder="Enter your full name"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (Password)
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation"
                          placeholder="Enter your phone number"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, phone: e.target.value }))}
                          autoComplete="off"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Use the phone number from your submitted form
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Access Token
                      </label>
                      <input
                        id="adminToken"
                        type="password"
                        required
                        className="w-full px-3 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation"
                        placeholder="Enter admin access token"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, phone: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                  )}

                  {loginError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                      <div className="text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
                      <div className="text-sm text-red-700 leading-relaxed">{loginError}</div>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-4 py-3 text-base border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 touch-manipulation"
                    >
                      Sign In
                    </button>
                  </div>
                </form>

                {loginForm.userType === 'employee' && (
                  <p className="text-xs text-gray-500 text-center mt-4">
                    New employee? Submit a form first, then login with your details.
                  </p>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}