import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ConfirmProvider } from "./contexts/ConfirmContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import socketService from "./services/socketService.js";

function AppWithSocket() {
  useEffect(() => {
    socketService.connect({
      url: "ws://localhost:8080/ws-attendance",
      onConnect: () => console.log("Socket connected"),
      onError: (err) => console.error("Socket error", err),
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return <App />;
}

export default AppWithSocket;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>
            <AppWithSocket />
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
