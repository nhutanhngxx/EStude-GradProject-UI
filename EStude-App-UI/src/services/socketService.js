import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import config from "../configs/config";

class SocketService {
  constructor() {
    this.client = null;
    this.subscriptions = {};
    this.pending = [];
  }

  connect({ url, onConnect, onError } = {}) {
    // URL cho SockJS: Sử dụng HTTP/HTTPS, không ws://
    const SOCKJS_URL = url || `${config.BASE_URL}/ws-attendance`;

    if (this.client && this.client.active) {
      console.log("SocketService: already active");
      return;
    }

    this.client = new Client({
      // Sử dụng SockJS làm factory để fallback HTTP nếu WebSocket fail
      webSocketFactory: () => new SockJS(SOCKJS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 1000, // Giữ kết nối alive
      heartbeatOutgoing: 1000,
      debug: (str) => console.log("[STOMP DEBUG]", str),
      // Header xác thực nếu cần (JWT token từ AuthContext)
      connectHeaders: {
        // Authorization: `Bearer ${token}`,
      },
    });

    this.client.onConnect = (frame) => {
      console.log("STOMP connected:", frame.headers["server"]);
      console.log("STOMP connected headers:", frame.headers);
      // Xử lý pending subscriptions
      this.pending.forEach((p) => this._doSubscribe(p.dest, p.cb));
      this.pending = [];
      if (onConnect) onConnect(frame);
    };

    this.client.onStompError = (frame) => {
      const errorMsg = frame.headers?.["message"] || "Unknown STOMP error";
      console.error("STOMP error:", errorMsg, frame.body); // Log chi tiết body để debug 400
      if (onError) onError({ message: errorMsg, frame });
    };

    this.client.onWebSocketError = (err) => {
      console.error("WebSocket/SockJS error:", err.message || err); // SockJS sẽ log fallback transport
      if (onError) onError(err);
    };

    this.client.onWebSocketClose = (evt) => {
      console.warn("WebSocket đã đóng:", evt.reason || evt.code);
    };

    this.client.activate();
  }

  publish(dest, body, headers = {}) {
    if (!this.client || !this.client.connected) {
      console.warn("STOMP chưa kết nối, không thể publish:", dest);
      return;
    }
    this.client.publish({
      destination: dest,
      body: JSON.stringify(body),
      headers,
    });
  }

  // Các hàm _doSubscribe, subscribe, unsubscribe, disconnect giữ nguyên như trước
  _doSubscribe(dest, cb) {
    if (!this.client || !this.client.connected) return null;
    if (this.subscriptions[dest]) return this.subscriptions[dest];

    const sub = this.client.subscribe(dest, (msg) => {
      try {
        const body = msg.body ? JSON.parse(msg.body) : null;
        cb(body);
      } catch (e) {
        console.warn("Parse STOMP message error:", e);
        cb(msg.body);
      }
    });

    this.subscriptions[dest] = sub;
    return sub;
  }

  subscribe(dest, cb) {
    if (this.subscriptions[dest]) return this.subscriptions[dest];

    if (this.client && this.client.connected) {
      return this._doSubscribe(dest, cb);
    }

    this.pending.push({ dest, cb });
    return {
      unsubscribe: () => {
        this.pending = this.pending.filter(
          (p) => p.dest !== dest || p.cb !== cb
        );
      },
    };
  }

  unsubscribe(dest) {
    if (this.subscriptions[dest]) {
      try {
        this.subscriptions[dest].unsubscribe();
      } catch {}
      delete this.subscriptions[dest];
    }
    this.pending = this.pending.filter((p) => p.dest !== dest);
  }

  disconnect() {
    if (!this.client) return;

    Object.values(this.subscriptions).forEach((s) => {
      try {
        s.unsubscribe();
      } catch {}
    });
    this.subscriptions = {};
    this.pending = [];

    try {
      this.client.deactivate();
    } catch {}
    this.client = null;
    console.log("SocketService disconnected");
  }
}

export default new SocketService();
