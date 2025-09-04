import React, { useState, useEffect } from 'react';
import { InfoTooltip } from '@/shared/components/InfoTooltip';
import { isDriveUrl, isGensparkUrl, uid } from '@/shared/lib/constants';
import { useModal } from '@/shared/components/ModalContext';

export function Section({ title, children, number, info }) {
  return (
    <section className="my-6 sm:my-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
        {number && (
          <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {number}
          </span>
        )}
        {!number && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
        {title}
        {info && <InfoTooltip content={info} />}
      </h2>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/60 transition-shadow duration-300">
        {children}
      </div>
    </section>
  );
}

export const TextField = React.memo(function TextField({ label, value, onChange, placeholder, className, info, disabled = false, onBlur, error, warning, validateOnChange = false, required = false, id }) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputId = id || `textfield-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const descriptionId = info ? `${inputId}-description` : undefined;
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    setHasInteracted(true);
    if (onBlur) onBlur(e);
  };
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setHasInteracted(true);
    onChange(newValue);
    
    // Real-time validation if enabled
    if (validateOnChange && newValue.trim()) {
      setLocalError(null); // Clear local errors when user is typing
    }
  };
  
  const displayError = error || localError;
  const showError = displayError && hasInteracted;
  const showWarning = warning && hasInteracted && !displayError;
  
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        {info && <InfoTooltip content={info} id={descriptionId} />}
      </div>
      
      <div className="relative">
        <input
          type="text"
          id={inputId}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={`${showError ? errorId : ''} ${descriptionId || ''}`.trim() || undefined}
          className={`
            w-full px-4 py-3 border rounded-xl transition-all duration-200
            ${disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
              : isFocused
                ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
                : showError
                  ? 'border-red-500 bg-red-50'
                  : showWarning
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
            }
            focus:outline-none
          `}
        />
        
        {/* Status indicator */}
        {hasInteracted && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showError ? (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-200 hover:scale-110" aria-hidden="true">
                !
              </div>
            ) : showWarning ? (
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 hover:scale-110" aria-hidden="true">
                ⚠
              </div>
            ) : value && value.trim() ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-200 hover:scale-110">
                ✓
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error and warning messages */}
      {showError && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg animate-in slide-in-from-top-2">
          <p id={errorId} className="text-sm text-red-700 flex items-start gap-2" role="alert" aria-live="polite">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
            {error}
          </p>
        </div>
      )}
      {showWarning && (
        <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
          <p className="text-sm text-amber-700 flex items-start gap-2" role="alert" aria-live="polite">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
            {warning}
          </p>
        </div>
      )}
      
      {/* Screen reader description */}
      <div id={descriptionId} className="sr-only">
        Text input field. Enter your information here.
      </div>
    </div>
  );
});

export const NumField = React.memo(function NumField({ label, value, onChange, className, info, disabled = false, onBlur, error, warning, validateOnChange = false, min, max, required = false, id }) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [localError, setLocalError] = useState(null);
  const inputId = id || `numfield-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const descriptionId = info ? `${inputId}-description` : undefined;
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    setHasInteracted(true);
    if (onBlur) onBlur(e);
  };
  
  const handleChange = (e) => {
    const val = e.target.value;
    
    // 🚨 CRITICAL DEBUG: Check for attendance multiplication bug in NumField
    if (label && label.includes('Work From Office') && val === '3') {
      console.log('🚨 NumField WFO Debug - User typed "3":', { val, type: typeof val });
      debugger; // Pause execution when user types "3" in WFO field
    }
    
    // Allow empty string, numbers, and partial numbers (like "1." or ".5")
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setHasInteracted(true);
      
      // Real-time validation if enabled
      if (validateOnChange && val !== '') {
        const numVal = Number(val);
        if (min !== undefined && numVal < min) {
          setLocalError(`Value must be at least ${min}`);
        } else if (max !== undefined && numVal > max) {
          setLocalError(`Value must be at most ${max}`);
        } else {
          setLocalError(null);
        }
      }
      
      // 🚨 CRITICAL DEBUG: Check what we're passing to onChange
      if (label && label.includes('Work From Office')) {
        const finalValue = val === '' ? '' : val;
        console.log('🚨 NumField WFO onChange call:', { 
          originalVal: val, 
          finalValue, 
          type: typeof finalValue,
          numericValue: Number(finalValue)
        });
        
        // Check for multiplication bug
        if (val === '3' && Number(finalValue) === 30) {
          console.error('🚨🚨🚨 MULTIPLICATION BUG DETECTED in NumField!');
          console.error('Input "3" became 30!');
          console.trace('Stack trace for multiplication bug');
          debugger;
        }
      }
      
      onChange(val === '' ? '' : val);
    }
  };
  
  const displayError = error || localError;
  const showError = displayError && hasInteracted;
  const showWarning = warning && hasInteracted && !displayError;
  
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        {info && <InfoTooltip content={info} id={descriptionId} />}
      </div>
      
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          id={inputId}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={`${showError ? errorId : ''} ${descriptionId || ''}`.trim() || undefined}
          className={`
            w-full px-4 py-3 border rounded-xl transition-all duration-200
            ${disabled 
              ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
              : isFocused
                ? 'border-blue-500 ring-2 ring-blue-100 bg-white'
                : showError
                  ? 'border-red-500 bg-red-50'
                  : showWarning
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
            }
            focus:outline-none
          `}
        />
        
        {/* Status indicator */}
        {hasInteracted && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showError ? (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-200 hover:scale-110">
                !
              </div>
            ) : showWarning ? (
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-200 hover:scale-110">
                ⚠
              </div>
            ) : value && value.toString().trim() ? (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-200 hover:scale-110">
                ✓
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error/Warning messages */}
      {showError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2">
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">!</div>
          <div id={errorId} className="text-sm text-red-700 leading-relaxed" role="alert" aria-live="polite">{displayError}</div>
        </div>
      )}
      
      {showWarning && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5 flex-shrink-0">⚠</div>
          <div className="text-sm text-amber-700 leading-relaxed" role="alert" aria-live="polite">{warning}</div>
        </div>
      )}
      
      {/* Screen reader description */}
      <div id={descriptionId} className="sr-only">
        Numeric input field. Enter numbers only.
        {min !== undefined && ` Minimum value: ${min}.`}
        {max !== undefined && ` Maximum value: ${max}.`}
      </div>
    </div>
  );
});

export const TextArea = React.memo(function TextArea({ label, value, onChange, rows = 4, className, placeholder, disabled = false, onBlur, error, warning, required = false, id }) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const descriptionId = `${textareaId}-description`;
  
  return (
    <div className={`transition-all duration-200 ${className || ''}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          id={textareaId}
          className={`w-full border rounded-xl p-3 text-base resize-y touch-manipulation transition-all duration-200 focus:outline-none focus:ring-2 ${
            hasError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 shadow-sm' 
              : hasWarning 
              ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500 bg-amber-50 shadow-sm'
              : disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
              : isFocused
              ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500 shadow-md bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white focus:ring-blue-500 focus:border-blue-500'
          }`}
          rows={rows}
          placeholder={placeholder || ""}
          value={value || ""}
          onChange={e => disabled ? null : onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={`${hasError ? errorId : ''} ${descriptionId}`.trim() || undefined}
        />
        {hasError && (
          <div className="absolute top-3 right-3 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold pointer-events-none" aria-hidden="true">
            !
          </div>
        )}
        {hasWarning && !hasError && (
          <div className="absolute top-3 right-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold pointer-events-none" aria-hidden="true">
            ⚠
          </div>
        )}
      </div>
      {hasError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2">
          <p id={errorId} className="text-sm text-red-700 flex items-start gap-2" role="alert" aria-live="polite">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
            {error}
          </p>
        </div>
      )}
      {hasWarning && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
          <p className="text-sm text-amber-700 flex items-start gap-2" role="alert" aria-live="polite">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" aria-hidden="true"></div>
            {warning}
          </p>
        </div>
      )}
      
      {/* Screen reader description */}
      <div id={descriptionId} className="sr-only">
        Text area input field. Enter multiple lines of text here.
      </div>
    </div>
   );
 });
 
 export function TinyLinks({ items, onAdd, onRemove }) {
  const [draft, setDraft] = useState({ label: '', url: '' });
  const { openModal, closeModal } = useModal();
  function add() {
    if (!draft.url) return;
    if (!isDriveUrl(draft.url) && !isGensparkUrl(draft.url)) { openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal); return; }
    onAdd({ id: uid(), label: draft.label || 'Link', url: draft.url });
    setDraft({ label: '', url: '' });
  }
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-lg p-2" placeholder="Scope of Work" value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
        <input className="flex-[2] border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} />
        <button className="px-3 rounded-lg bg-blue-600 text-white" onClick={add}>Add</button>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {(items || []).map(it => (
          <li key={it.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{it.label}</b> • <a className="underline" href={it.url} target="_blank" rel="noreferrer">open</a></div>
            <button className="text-red-600" onClick={() => onRemove(it.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MultiSelect({ options = [], selected = [], onChange, placeholder = "Select options", disabled = false, error = null, warning = null, label = null, validateOnChange = false, required = false, id, allowCustom = false, customPlaceholder = "Add custom option..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = React.useRef(null);
  const buttonRef = React.useRef(null);
  const safeSelected = Array.isArray(selected) ? selected : [];
  const safeOptions = Array.isArray(options) ? options : [];
  const selectId = id || `multiselect-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const descriptionId = `${selectId}-description`;
  
  const showError = error && hasInteracted;
  const showWarning = warning && hasInteracted && !error;
  
  // Real-time validation feedback
  const hasValidSelection = selected && selected.length > 0;
  
  const toggleDropdown = () => { 
    if (disabled) return; 
    setIsOpen(!isOpen);
    setIsFocused(!isOpen);
    setHasInteracted(true);
    setFocusedIndex(-1);
  };
  
  const handleSelect = (option) => { 
    if (disabled) return; 
    setHasInteracted(true);
    if (safeSelected.includes(option)) { 
      onChange(safeSelected.filter(item => item !== option)); 
    } else { 
      onChange([...safeSelected, option]); 
    } 
  };

  const handleAddCustom = () => {
    if (!customInput.trim() || disabled) return;
    const trimmedInput = customInput.trim();
    
    // Check if option already exists
    if (safeOptions.includes(trimmedInput) || safeSelected.includes(trimmedInput)) {
      setCustomInput('');
      setShowCustomInput(false);
      return;
    }
    
    // Add custom option to selected
    onChange([...safeSelected, trimmedInput]);
    setCustomInput('');
    setShowCustomInput(false);
    setHasInteracted(true);
  };

  const handleCustomInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    } else if (e.key === 'Escape') {
      setCustomInput('');
      setShowCustomInput(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          toggleDropdown();
        } else if (focusedIndex >= 0 && focusedIndex < safeOptions.length) {
          handleSelect(safeOptions[focusedIndex]);
        }
        break;
      case 'Escape':
        if (isOpen) {
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          toggleDropdown();
        } else {
          setFocusedIndex(prev => 
            prev < safeOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : safeOptions.length - 1
          );
        }
        break;
    }
  };
  
  useEffect(() => { 
    function handleClickOutside(event) { 
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { 
        setIsOpen(false);
        setIsFocused(false);
      } 
    } 
    document.addEventListener("mousedown", handleClickOutside); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
    }; 
  }, [dropdownRef]);
  
  const displayValue = safeSelected.length > 0 ? safeSelected.join(", ") : placeholder;
  
  return (
    <div className="transition-all duration-200">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          {showError && (
            <span className="ml-2 flex items-center gap-1 text-red-600 text-xs font-medium animate-in slide-in-from-right-2">
              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">!</div>
              Required
            </span>
          )}
          {showWarning && (
            <span className="ml-2 flex items-center gap-1 text-amber-600 text-xs font-medium animate-in slide-in-from-right-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">⚠</div>
              Warning
            </span>
          )}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button 
          type="button"
          ref={buttonRef}
          id={selectId}
          className={`w-full border rounded-xl p-3 text-left focus:ring-2 transition-all duration-200 touch-manipulation ${
            showError 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50 shadow-sm' 
              : showWarning 
              ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500 bg-amber-50 shadow-sm'
              : disabled 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
              : isFocused || isOpen
              ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500 shadow-md bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white focus:ring-blue-500 focus:border-blue-500'
          } ${safeSelected.length > 0 ? 'text-gray-900' : 'text-gray-500'}`} 
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled} 
          aria-expanded={isOpen} 
          aria-haspopup="listbox"
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={`${showError ? errorId : ''} ${descriptionId}`.trim() || undefined}
          aria-required={required}
        >
          <div className="flex justify-between items-center">
            <span className="truncate">{displayValue}</span>
            <div className="flex items-center gap-2">
              {hasInteracted && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  {showError ? (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse" aria-hidden="true">
                      !
                    </div>
                  ) : showWarning ? (
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse" aria-hidden="true">
                      ⚠
                    </div>
                  ) : hasValidSelection ? (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">
                      ✓
                    </div>
                  ) : null}
                </div>
              )}
              <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </div>
        </button>
        {isOpen && !disabled && (
          <ul className="absolute z-50 w-full bg-white border border-gray-300 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg animate-in slide-in-from-top-2" role="listbox" aria-labelledby={selectId}>
            {safeOptions.length === 0 && !allowCustom ? (
              <li className="p-3 text-gray-500 text-center" role="option" aria-disabled="true">No options available</li>
            ) : (
              <>
                {safeOptions.map((option, index) => (
                  <li 
                    key={option}
                    role="option"
                    aria-selected={safeSelected.includes(option)}
                    onClick={() => handleSelect(option)} 
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`p-3 cursor-pointer transition-all duration-150 hover:bg-blue-100 ${
                      focusedIndex === index ? 'bg-blue-50 ring-2 ring-blue-200' : ''
                    } ${
                      safeSelected.includes(option) 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 font-semibold border-l-4 border-blue-500' 
                        : 'text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option}</span>
                      {safeSelected.includes(option) && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">
                          ✓
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                
                {allowCustom && (
                  <>
                    {safeOptions.length > 0 && <li className="border-t border-gray-200"></li>}
                    {showCustomInput ? (
                      <li className="p-3 bg-gray-50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={handleCustomInputKeyDown}
                            placeholder={customPlaceholder}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleAddCustom}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomInput('');
                            }}
                            className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li 
                        onClick={() => setShowCustomInput(true)}
                        className="p-3 cursor-pointer text-blue-600 hover:bg-blue-50 border-t border-gray-200 flex items-center gap-2"
                      >
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                          +
                        </div>
                        <span className="text-sm font-medium">Add custom role...</span>
                      </li>
                    )}
                  </>
                )}
              </>
            )}
          </ul>
        )}
      </div>
      {showError && (
        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded-lg animate-in slide-in-from-top-2">
          <p className="text-sm text-red-700 flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            {error}
          </p>
        </div>
      )}
      {showWarning && (
        <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
          <p className="text-sm text-amber-700 flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
            {warning}
          </p>
        </div>
      )}
    </div>
  );
}

export function PrevValue({ label, value }) {
  return (
    <div>
      <label className="text-xs text-gray-600 block">{label}</label>
      <div className="w-full border rounded-xl p-2 bg-gray-100 text-gray-700 font-medium">{value}</div>
    </div>
  );
}

export function ComparativeField({ label, currentValue, previousValue, onChange, placeholder = "Enter value", unit = "", disabled = false, monthPrev = "Previous Month", monthThis = "This Month" }) {
  const prev = Number(previousValue || 0);
  const curr = Number(currentValue || 0);
  const change = curr - prev;
  const percentChange = prev > 0 ? ((change / prev) * 100) : 0;
  const getChangeColor = () => { if (change > 0) return 'text-green-600'; if (change < 0) return 'text-red-600'; return 'text-gray-600'; };
  const getChangeIcon = () => { if (change > 0) return '📈 ↗️'; if (change < 0) return '📉 ↘️'; return '📊 ➡️'; };
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input type="number" inputMode="numeric" className={`w-full border rounded-xl p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} placeholder={placeholder} value={currentValue || ""} onChange={e => disabled ? null : onChange(Number(e.target.value || 0))} disabled={disabled} />
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2"><span className="text-xs font-medium text-gray-600">Comparative Analysis</span><span className={`text-xs font-bold ${getChangeColor()}`}>{getChangeIcon()}</span></div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-gray-500">{monthPrev}</div><div className="font-semibold text-gray-700">{prev}{unit}</div></div>
          <div><div className="text-xs text-gray-500">{monthThis}</div><div className="font-semibold text-blue-700">{curr}{unit}</div></div>
        </div>
        {prev > 0 && (<div className="mt-2 pt-2 border-t border-gray-200"><div className={`text-xs font-medium ${getChangeColor()}`}>Change: {change >= 0 ? '+' : ''}{change}{unit} ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)</div></div>)}
        {prev === 0 && curr > 0 && (<div className="mt-2 pt-2 border-t border-gray-200"><div className="text-xs font-medium text-green-600">🎉 New activity this month!</div></div>)}
      </div>
    </div>
  );
}

export function ProofField({ label, value, onChange }) { return (<div><label className="text-xs text-gray-600">{label} (Drive URL)</label><input className="w-full border rounded-xl p-2" placeholder="https://drive.google.com/..." value={value || ""} onChange={e => onChange(e.target.value)} /></div>); }

export function ProgressIndicator({ current, target, label, unit = "", color = "blue", previousValue = null, showTrend = false, monthComparison = null }) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;
  const isWarning = current < target * 0.5;
  const colorClasses = { blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' }, green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' }, yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700' }, red: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700' } };
  const progressColor = isComplete ? 'green' : isWarning ? 'red' : color;
  const classes = colorClasses[progressColor];
  
  // Calculate trend if previous value is provided
  const hasTrend = showTrend && previousValue !== null && previousValue !== undefined;
  const trendValue = hasTrend ? current - previousValue : 0;
  const trendPercentage = hasTrend && previousValue > 0 ? ((trendValue / previousValue) * 100) : 0;
  const isImproving = trendValue > 0;
  const isDecreasing = trendValue < 0;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${classes.text}`}>
            {current}{unit} / {target}{unit}
            {isComplete && ' ✓'}
            {isWarning && ' ⚠️'}
          </span>
          {hasTrend && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isImproving ? 'bg-green-100 text-green-700' : 
              isDecreasing ? 'bg-red-100 text-red-700' : 
              'bg-gray-100 text-gray-700'
            }`}>
              {isImproving ? '📈' : isDecreasing ? '📉' : '➡️'}
              {trendValue > 0 ? '+' : ''}{trendValue}{unit}
            </span>
          )}
        </div>
      </div>
      
      <div className={`w-full rounded-full h-3 ${classes.light} relative overflow-hidden`}>
        <div className={`h-full ${classes.bg} rounded-full transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}>
          {isComplete && (<div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-xs font-bold">✓</span></div>)}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <div className="text-xs text-gray-500">
          {isComplete ? '✓ Target achieved!' : isWarning ? `⚠️ ${(target - current).toFixed(1)}${unit} needed to reach target` : `${(target - current).toFixed(1)}${unit} remaining`}
        </div>
        {hasTrend && monthComparison && (
          <div className="text-xs text-gray-400">
            vs {monthComparison}: {previousValue}{unit}
          </div>
        )}
      </div>
      
      {hasTrend && Math.abs(trendPercentage) > 0 && (
        <div className="mt-2 text-xs">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
            isImproving ? 'bg-green-50 text-green-600' : 
            isDecreasing ? 'bg-red-50 text-red-600' : 
            'bg-gray-50 text-gray-600'
          }`}>
            {isImproving ? '🚀' : isDecreasing ? '⚠️' : '📊'}
            <span className="font-medium">
              {Math.abs(trendPercentage).toFixed(1)}% {isImproving ? 'improvement' : isDecreasing ? 'decrease' : 'no change'}
            </span>
            {monthComparison && <span>from {monthComparison}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export function ThreeWayComparativeField({ label, currentValue, previousValue, comparisonValue, onChange, placeholder = "Enter value", unit = "", disabled = false, monthComparison = "Baseline Month", monthPrev = "Previous Month", monthThis = "This Month", error = null, warning = null, validateOnChange = false }) {
  const [localError, setLocalError] = useState(null);
  const [localWarning, setLocalWarning] = useState(null);
  
  const baseline = Number(comparisonValue || 0);
  const prev = Number(previousValue || 0);
  const curr = Number(currentValue || 0);
  const prevChange = prev - baseline;
  const currChange = curr - prev;
  const totalChange = curr - baseline;
  const getChangeColor = (change) => { if (change > 0) return 'text-green-600'; if (change < 0) return 'text-red-600'; return 'text-gray-600'; };
  const getChangeIcon = (change) => { if (change > 0) return '📈 ↗️'; if (change < 0) return '📉 ↘️'; return '📊 ➡️'; };
  
  const displayError = error || localError;
  const displayWarning = warning || localWarning;
  const hasError = displayError && displayError.trim() !== '';
  const hasWarning = displayWarning && displayWarning.trim() !== '';
  
  const handleChange = (value) => {
    if (disabled) return;
    
    if (validateOnChange) {
      // Basic validation for numeric fields
      if (value < 0) {
        setLocalError('Value cannot be negative');
      } else if (value > 31) {
        setLocalWarning('Value seems unusually high');
        setLocalError(null);
      } else {
        setLocalError(null);
        setLocalWarning(null);
      }
    }
    
    onChange(value);
  };
  
  const inputClassName = `w-full border rounded-xl p-3 text-base focus:ring-2 transition-colors ${
    disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' :
    hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' :
    hasWarning ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500' :
    'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }`;
  
  return (
    <div className="space-y-3">
      <div>
        <label className={`block text-sm font-medium mb-2 ${
          hasError ? 'text-red-700' : hasWarning ? 'text-amber-700' : 'text-gray-700'
        }`}>{label}</label>
        <input 
          type="number" 
          inputMode="numeric" 
          className={inputClassName}
          placeholder={placeholder} 
          value={currentValue || ""} 
          onChange={e => {
            const rawValue = e.target.value;
            console.log('🔍 ThreeWayComparativeField input:', { rawValue, type: typeof rawValue });
            
            // 🚨 AGGRESSIVE DEBUG: Always trigger debugger when typing "3"
            if (rawValue === '3') {
              console.error('🚨🚨🚨 DEBUG: User typed "3" - checking for multiplication bug!');
              console.error('Raw value:', rawValue, 'Type:', typeof rawValue);
              debugger; // This will ALWAYS pause when "3" is typed
            }
            
            // Handle empty input
            if (rawValue === '') {
              console.log('✅ Empty input, passing empty string');
              handleChange('');
              return;
            }
            
            // Convert to number and validate
            const numValue = Number(rawValue);
            console.log('🔢 Converted to number:', { numValue, type: typeof numValue });
            
            // 🚨 CRITICAL DEBUG: Check for any unexpected multiplication
            if (rawValue === '3' && numValue !== 3) {
              console.error('🚨🚨🚨 MULTIPLICATION BUG DETECTED! Input "3" became', numValue);
              console.error('This should not happen. Number("3") should equal 3, not', numValue);
              debugger; // This will pause execution in browser DevTools
            }
            
            // 🚨 ALSO CHECK: If any single digit becomes 10x larger
            if (rawValue.length === 1 && numValue === parseInt(rawValue) * 10) {
              console.error('🚨🚨🚨 10x MULTIPLICATION BUG! Input', rawValue, 'became', numValue);
              debugger;
            }
            
            // Only pass valid numbers
            if (!isNaN(numValue) && isFinite(numValue)) {
              handleChange(numValue);
            } else {
              console.warn('⚠️ Invalid number input:', rawValue);
            }
          }} 
          disabled={disabled} 
        />
        {hasError && (
          <div className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1">
            <span className="text-red-500">⚠️</span>
            {displayError}
          </div>
        )}
        {!hasError && hasWarning && (
          <div className="mt-1 text-sm text-amber-600 flex items-center gap-1 animate-in slide-in-from-top-1">
            <span className="text-amber-500">⚡</span>
            {displayWarning}
          </div>
        )}
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
        <div className="flex justify-between items-center mb-3"><span className="text-xs font-medium text-gray-600">Three-way Comparison</span><span className="text-xs font-bold">📊</span></div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">{monthComparison}</div>
            <div className="font-semibold text-gray-700">{baseline}{unit}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">{monthPrev}</div>
            <div className="font-semibold text-gray-700">{prev}{unit}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">{monthThis}</div>
            <div className="font-semibold text-blue-700">{curr}{unit}</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 grid grid-cols-3 gap-4 text-xs">
          <div className={`${getChangeColor(prevChange)}`}>Baseline → Prev: {prevChange >= 0 ? '+' : ''}{prevChange}{unit}</div>
          <div className={`${getChangeColor(currChange)}`}>Prev → This: {currChange >= 0 ? '+' : ''}{currChange}{unit}</div>
          <div className={`${getChangeColor(totalChange)}`}>Baseline → This: {totalChange >= 0 ? '+' : ''}{totalChange}{unit}</div>
        </div>
      </div>
    </div>
  );
}

export const SelectField = React.memo(function SelectField({ label, value, onChange, options = [], placeholder = "Select an option", className, info, disabled = false, onBlur, error, warning, required = false, id }) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const selectId = id || `selectfield-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const descriptionId = info ? `${selectId}-description` : undefined;
  
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    setHasInteracted(true);
    if (onBlur) onBlur(e);
  };
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setHasInteracted(true);
    onChange(newValue);
  };
  
  const showError = error && hasInteracted;
  const showWarning = warning && hasInteracted && !showError;
  
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {info && <InfoTooltip content={info} />}
        </label>
      )}
      
      <div className="relative">
        <select
          id={selectId}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          aria-describedby={[descriptionId, showError ? errorId : null].filter(Boolean).join(' ') || undefined}
          aria-invalid={showError ? 'true' : 'false'}
          className={`
            w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${showError ? 'border-red-300 bg-red-50' : showWarning ? 'border-amber-300 bg-amber-50' : 'border-gray-300'}
            ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={index} value={typeof option === 'object' ? option.value : option}>
              {typeof option === 'object' ? option.label : option}
            </option>
          ))}
        </select>
      </div>
      
      {showError && (
        <p id={errorId} className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {showWarning && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {warning}
        </p>
      )}
      
      {info && !showError && !showWarning && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {info}
        </p>
      )}
    </div>
  );
});

// Enhanced validation indicator with better visual feedback and animations
export function StepValidationIndicator({ errors = [], warnings = [], stepTitle = 'Step' }) {
  const hasErrors = Array.isArray(errors) && errors.length > 0;
  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;
  
  // Success state with enhanced styling
  if (!hasErrors && !hasWarnings) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 shadow-sm transition-all duration-300 animate-in slide-in-from-top-2 hover:shadow-md">
        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm animate-pulse shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-110 transition-all duration-200">
          ✓
        </div>
        <div className="flex-1">
          <div className="font-semibold text-emerald-800">{stepTitle} is complete</div>
          <div className="text-sm text-emerald-600 mt-1">All required fields are properly filled</div>
        </div>
        <div className="flex-shrink-0 text-emerald-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    );
  }
  
  // Error/Warning state with enhanced styling
  const borderColor = hasErrors ? 'border-red-300' : 'border-amber-300';
  const bgColor = hasErrors ? 'from-red-50 to-rose-50' : 'from-amber-50 to-yellow-50';
  const iconColor = hasErrors ? 'bg-red-500' : 'bg-amber-500';
  const titleColor = hasErrors ? 'text-red-800' : 'text-amber-800';
  const subtitleColor = hasErrors ? 'text-red-600' : 'text-amber-600';
  
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-r ${bgColor} border ${borderColor} shadow-sm transition-all duration-300 animate-in slide-in-from-top-2`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-8 h-8 ${iconColor} rounded-full flex items-center justify-center text-white font-bold text-sm ${hasErrors ? 'animate-bounce' : 'animate-pulse'} shadow-lg ${hasErrors ? 'shadow-red-500/30 hover:shadow-red-500/50' : 'shadow-amber-500/30 hover:shadow-amber-500/50'} hover:scale-110 transition-all duration-200`}>
          {hasErrors ? '!' : '⚠'}
        </div>
        <div className="flex-1">
          <div className={`font-semibold ${titleColor}`}>
            {hasErrors ? 'Action Required' : 'Please Review'}
          </div>
          <div className={`text-sm ${subtitleColor} mt-1`}>
            {hasErrors ? 'Fix these issues to continue' : 'Some items need attention'}
          </div>
        </div>
      </div>
      
      {hasErrors && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-red-500/30 hover:shadow-red-500/50 hover:scale-110 transition-all duration-200">!</div>
            <div className="text-red-800 font-semibold text-sm">Critical Issues</div>
          </div>
          <div className="space-y-2">
            {errors.map((error, i) => (
              <div key={`err-${i}`} className="flex items-start gap-2 p-2 bg-red-100 rounded-lg border border-red-200">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-red-700 leading-relaxed">{error}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {hasWarnings && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-110 transition-all duration-200">⚠</div>
            <div className="text-amber-800 font-semibold text-sm">Recommendations</div>
          </div>
          <div className="space-y-2">
            {warnings.map((warning, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-2 p-2 bg-amber-100 rounded-lg border border-amber-200">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="text-sm text-amber-700 leading-relaxed">{warning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
