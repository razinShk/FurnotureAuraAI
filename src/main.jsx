import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ClerkProvider>
    ) : (
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )}
  </React.StrictMode>
);
