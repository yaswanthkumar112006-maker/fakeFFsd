import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import exact existing stylesheets
import '../css/main.css';
import '../css/components/layout.css';
import '../css/components/button.css';
import '../css/components/card.css';
import '../css/components/table.css';
import '../css/components/form.css';
import '../css/components/badge.css';
import '../css/components/toast.css';
import '../css/components/stock-monitoring.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
