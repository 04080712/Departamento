console.log('index.tsx executing...');
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  console.log('Found root element, mounting app...');
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App mounted successfully.');
} catch (err: any) {
  console.error('CRITICAL ERROR IN INDEX.TSX:', err);
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-family: sans-serif;">
      <h1>Critical Error</h1>
      <pre>${err.message}\n${err.stack}</pre>
    </div>
  `;
}
