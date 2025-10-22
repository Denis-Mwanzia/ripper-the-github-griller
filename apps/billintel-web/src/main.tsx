import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
