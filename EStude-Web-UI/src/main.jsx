import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ToastProvider } from "./contexts/ToastContext.jsx";
import { ConfirmProvider } from "./contexts/ConfirmContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import socketService from "./services/socketService.js";
import config from "./config/config";

function AppWithSocket() {
  useEffect(() => {
    const WS_URL = `${config.BASE_URL}/ws-attendance`;

    socketService.connect({
      url: WS_URL,
      onConnect: () => console.log("✅ Socket connected"),
      onError: (err) => console.error("❌ Socket error:", err),
      onDisconnect: () => console.log("🔌 Socket disconnected"),
    });

    return () => {
      socketService.disconnect();
      console.log("🛑 AppWithSocket cleanup");
    };
  }, []);

  return <App />;
}

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
