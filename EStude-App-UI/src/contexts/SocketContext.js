import { createContext, useContext, useEffect } from "react";
import socketService from "../services/socketService";
import { useAuth } from "./AuthContext";
import config from "../configs/config";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const url = `${config.BASE_URL}/ws-attendance`;
      console.log(
        "SocketProvider: connecting to",
        url,
        "userId:",
        user.userId ?? user.id
      );
      socketService.connect({
        url,
        onConnect: () => console.log("SocketProvider: STOMP connected"),
        onError: (e) => console.error("SocketProvider: STOMP error", e),
      });
      return () => {
        console.log("SocketProvider: disconnect on cleanup");
        socketService.disconnect();
      };
    } else {
      socketService.disconnect();
    }
  }, [user?.userId]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
