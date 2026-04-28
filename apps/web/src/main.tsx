import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HermesUiProvider } from '@hermes-recipes/ui';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <HermesUiProvider>
        <App />
      </HermesUiProvider>
    </BrowserRouter>
  </React.StrictMode>
);
