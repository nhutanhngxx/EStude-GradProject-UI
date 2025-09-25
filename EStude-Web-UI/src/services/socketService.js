import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import config from "../config/config";

class SocketService {
  constructor() {
    this.client = null;
    this.subscriptions = {};
  }

  connect({
    url = `${config.BASE_URL}/ws-attendance`,
    onConnect,
    onError,
    onDisconnect,
  }) {
    this.client = new Client({
      // Dùng SockJS thay vì brokerURL
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      connectionTimeout: 15000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: (str) => console.log("[STOMP DEBUG]:", str),
    });

    this.client.onConnect = (frame) => {
      console.log("✅ Connected to WebSocket (SockJS)");
      if (onConnect) onConnect(frame);
    };

    this.client.onDisconnect = () => {
      console.log("🔌 Disconnected from WebSocket");
      if (onDisconnect) onDisconnect();
    };

    this.client.onStompError = (frame) => {
      console.error("❌ STOMP Error:", frame.headers["message"]);
      if (onError) onError(frame);
    };

    this.client.onWebSocketError = (error) => {
      console.error("❌ WebSocket Error:", error);
      if (onError) onError(error);
    };

    this.client.activate();
  }

  subscribe(destination, callback) {
    if (!this.client || !this.client.connected) {
      console.warn("⚠️ Cannot subscribe, client not connected");
      return;
    }

    if (this.subscriptions[destination]) {
      console.log(`ℹ️ Already subscribed to ${destination}`);
      return;
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (err) {
        console.error("❌ Error parsing message", err);
        callback(message.body);
      }
    });

    this.subscriptions[destination] = subscription;
  }

  unsubscribe(destination) {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
      delete this.subscriptions[destination];
      console.log(`🛑 Unsubscribed from ${destination}`);
    }
  }

  disconnect() {
    if (this.client) {
      Object.values(this.subscriptions).forEach((sub) => sub.unsubscribe());
      this.subscriptions = {};
      this.client.deactivate();
      console.log("🔌 WebSocket disconnected");
    }
  }
}

export default new SocketService();
