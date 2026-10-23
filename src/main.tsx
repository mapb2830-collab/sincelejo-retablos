import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fredoka/wght.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './styles/global.css';
import { App } from './ui/App';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
