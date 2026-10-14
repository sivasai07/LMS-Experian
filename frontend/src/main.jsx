/**
 * @file main.jsx
 * @description React Application Entry Point.
 * Initializes React 18 Concurrent Root, mounts Redux Store Provider,
 * and renders the root App component within StrictMode.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { store } from './store';
import './index.css';
import App from './App.jsx';

// Import logo for the browser tab icon
import logo from './assets/images/logo/experian_small_logo.png';

// Set the logo as the browser tab icon
const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/png';
favicon.href = logo;
if (!document.head.contains(favicon)) {
  document.head.appendChild(favicon);
}

// Render the React application
const rootElement = document.getElementById('root');

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);