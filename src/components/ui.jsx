import React, { useState, useEffect } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { isDriveUrl, isGensparkUrl, uid } from './constants';
import { useModal } from './AppShell';

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

export const TextField = React.memo(function TextField({ label, value, onChange, placeholder, className, info, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input
        className={`w-full border border-gray-300 rounded-xl p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        placeholder={placeholder || ""}
        value={value || ""}
        onChange={e => disabled ? null : onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
});

export const NumField = React.memo(function NumField({ label, value, onChange, className, info, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="text-sm flex items-center mb-1">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input 
        type="number" 
        inputMode="numeric"
        pattern="[0-9]*"
        className={`w-full border rounded-xl p-3 text-base touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        value={Number(value || 0)} 
        onChange={e => disabled ? null : onChange(Number(e.target.value || 0))}
        disabled={disabled}
      />
    </div>
  );
});

export const TextArea = React.memo(function TextArea({ label, value, onChange, rows = 4, className, placeholder, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="text-sm block mb-2">{label}</label>
      <textarea 
        className={`w-full border rounded-xl p-3 text-base resize-y touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        rows={rows} 
        placeholder={placeholder || ""} 
        value={value || ""} 
        onChange={e => disabled ? null : onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
});

export function TinyLinks({ items, onAdd, onRemove }) {
  const [draft, setDraft] = useState({ label: '', url: '' });
  const { openModal, closeModal } = useModal();
  function add() {
    if (!draft.url) return;
    if (!isDriveUrl(draft.url) && !isGensparkUrl(draft.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
      return;
    }
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

export function MultiSelect({ options, selected, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const displayValue = selected.length > 0 ? selected.join(", ") : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full border rounded-xl p-2 text-left"
        onClick={toggleDropdown}
      >
        {displayValue}
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className={`p-2 cursor-pointer hover:bg-blue-100 ${selected.includes(option) ? 'bg-blue-50 font-semibold' : ''}`}
            >
              {option}
            </li>
          ))}
        </ul>
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

export function ProofField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label} (Drive URL)</label>
      <input className="w-full border rounded-xl p-2" placeholder="https://drive.google.com/..." value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}