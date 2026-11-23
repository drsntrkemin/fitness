import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { reloadOnUpdate } from './platform/pwa';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

reloadOnUpdate();
