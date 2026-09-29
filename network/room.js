export class Room {
  constructor({code, host, onOpen, onConnection, onData, onClose, onError}) {
    this.code = code;
    this.host = host;
    this.peer = null;
    this.conn = null;
    this.handlers = {onOpen, onConnection, onData, onClose, onError};
    this.serverIndex = 0;
    this.servers = ["0.peerjs.com", "1.peerjs.com", "2.peerjs.com"];
    this.destroyed = false;
  }

  create() {
    return this.open(this.code);
  }

  join() {
    return this.open();
  }

  open(peerId) {
    return new Promise((resolve, reject) => {
      if (!window.Peer) {
        reject(new Error("PeerJS не загружен"));
        return;
      }

      this.destroyed = false;
      const tryServer = () => {
        if (this.destroyed) {
          reject(new Error("PeerJS соединение закрыто"));
          return;
        }

        const host = this.servers[this.serverIndex % this.servers.length];
        this.serverIndex++;

        let peer;
        let settled = false;
        let retryTimer = 0;

        try {
          peer = new window.Peer(peerId, {
            host,
            port: 443,
            path: "/peerjs",
            secure: true,
            debug: 0,
            config: {
              iceServers: [
                {urls: "stun:stun.l.google.com:19302"},
                {urls: "stun:stun.cloudflare.com:3478"}
              ]
            }
          });
        } catch (error) {
          if (this.serverIndex < this.servers.length) {
            tryServer();
          } else {
            reject(error);
          }
          return;
        }

        this.peer = peer;

        const retry = (error) => {
          if (settled || this.destroyed) return;
          try { clearTimeout(retryTimer); } catch (_) {}
          try { peer.destroy(); } catch (_) {}
          this.peer = null;
          if (this.serverIndex < this.servers.length) {
            retryTimer = setTimeout(tryServer, 180);
          } else {
            const finalError = error instanceof Error ? error : new Error(String(error?.message || error || "PeerJS error"));
            reject(finalError);
            this.handlers.onError?.(finalError);
          }
        };

        peer.on("open", id => {
          if (settled) return;
          settled = true;
          this.handlers.onOpen?.(id);
          resolve(id);

          if (!this.host) {
            try {
              this.attachConnection(peer.connect(this.code, {
                reliable: true,
                serialization: "json"
              }));
            } catch (error) {
              this.handlers.onError?.(error);
            }
          }
        });

        peer.on("connection", conn => {
          if (!this.host) return;
          if (this.conn && this.conn.open) {
            conn.close();
            return;
          }
          this.attachConnection(conn);
          this.handlers.onConnection?.(conn);
        });

        peer.on("error", error => {
          const retryable =
            error?.type === "server-error" ||
            error?.type === "socket-error" ||
            error?.type === "socket-closed" ||
            error?.type === "network" ||
            error?.type === "browser-incompatible";
          if (retryable || !settled) retry(error);
          else this.handlers.onError?.(error);
        });

        peer.on("disconnected", () => {
          if (this.destroyed) return;
          this.handlers.onClose?.();
        });

        peer.on("close", () => {
          if (!this.destroyed) this.handlers.onClose?.();
        });
      };

      tryServer();
    });
  }

  attachConnection(conn) {
    this.conn = conn;
    conn.on("open", () => this.handlers.onConnection?.(conn));
    conn.on("data", data => this.handlers.onData?.(data));
    conn.on("close", () => {
      if (this.conn === conn) this.conn = null;
      this.handlers.onClose?.();
    });
    conn.on("error", error => this.handlers.onError?.(error));
  }

  send(data) {
    if (this.conn && this.conn.open) this.conn.send(data);
  }

  destroy() {
    this.destroyed = true;
    try { this.conn?.close(); } catch (_) {}
    try { this.peer?.destroy(); } catch (_) {}
    this.conn = null;
    this.peer = null;
  }

  isConnected() {
    return !!(this.conn && this.conn.open);
  }
}
