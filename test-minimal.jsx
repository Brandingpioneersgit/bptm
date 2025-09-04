import React from 'react';
import ReactDOM from 'react-dom/client';

// Minimal test component
function MinimalApp() {
  return (
    <div>
      <h1>Minimal Test App</h1>
      <p>If you see this, React is working correctly.</p>
    </div>
  );
}

// Render the minimal app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MinimalApp />
  </React.StrictMode>
);