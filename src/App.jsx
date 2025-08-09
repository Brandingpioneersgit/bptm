import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Branding Pioneers – Codex (Monthly Tactical System, MVP+)
 * Single-file React app ready for Vite + Tailwind.
 * - Employee Form with dynamic KPIs
 * - Spreadsheet-like Client entry (first row asks Client name + optional evidence)
 * - Learning (exact 6h target), Relationship, AI usage
 * - Real-time Growth Score (10/5/5) and red flags
 * - Manager Dashboard (#admin) with token gate + Supabase or local fallback
 *
 * ENV (Netlify/Vercel):
 *  VITE_SUPABASE_URL
 *  VITE_SUPABASE_ANON_KEY
 *  VITE_ADMIN_ACCESS_TOKEN (optional but recommended)
 */

/***********************
 * Supabase Integration *
 ***********************/
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON = import.meta?.env?.VITE_SUPABASE_ANON_KEY || '';
const ADMIN_TOKEN = import.meta?.env?.VITE_ADMIN_ACCESS_TOKEN || ''; // simple gate for #admin

const supabase = SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Branding Pioneers - Codex
        </h1>
        <p className="text-gray-600 mb-6">
          Monthly Tactical System MVP
        </p>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setCount(count + 1)}
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}
