import React from 'react';
import ReactDOM from 'react-dom/client'; // Update the import
import './index.css';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Create a root for rendering
const root = ReactDOM.createRoot(document.getElementById('root')); // Create the root

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
