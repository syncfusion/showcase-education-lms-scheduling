// App entry: license registration, theme bundle, router with the base path.

import { createRoot } from 'react-dom/client';
import { registerLicense } from '@syncfusion/ej2-base';
import { BrowserRouter } from 'react-router-dom';
import '@syncfusion/ej2-tailwind3-theme/styles/tailwind3.css'; // all-in-one bundle (data-syncfusion-theme-light)
import { AppProvider } from './application/app-context';
import { App } from './ui/App';
import './app.css';

const licenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY;
if (licenseKey) registerLicense(licenseKey);

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>
);