import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
// Temporary bridge from the old --app-* vocabulary to tokens.css.
// Deleted at Phase 3A step 12, once every page consumes semantic tokens.
import './styles/legacy-shim.css';
import './styles/receipt.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);