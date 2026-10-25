import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.jsx';
import './index.css';

const clerkPubKey = 
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  'pk_test_c3BsZW5kaWQtdGFkcG9sZS05ODcuY2xlcmsuYWNjb3VudHMuZGV2JA';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {clerkPubKey ? (
        <ClerkProvider publishableKey={clerkPubKey}>
          <ThemeProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </ThemeProvider>
        </ClerkProvider>
      ) : (
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
