import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import "./i18n";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
