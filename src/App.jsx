import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b z-20">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img alt="Branding Pioneers" className="w-8 h-8 rounded"/>
            <div className="font-bold">Branding Pioneers • Codex</div>
          </div>
          <div className="text-xs md:text-sm text-gray-600">Employee Form • v1</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Branding Pioneers Codex</h1>
        <p>This is a placeholder App component. The complete application logic should be imported from the original App.jsx file.</p>
      </main>
      <footer className="max-w-6xl mx-auto p-8 text-center text-xs text-gray-500">Placeholder App Component</footer>
    </div>
  );
}

export default App;
