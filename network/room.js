export class Room {
  constructor({code, host, onOpen, onConnection, onData, onClose, onError}) {
    this.code = code;
    this.host = host;
    this.peer = null;
    this.conn = null;
    this.handlers = {onOpen, onConnection, onData, onClose, onError};
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
      const peer = new window.Peer(peerId, {debug: 0});
      this.peer = peer;
      let settled = false;

      const fail = (error) => {
        if (!settled) {
          settled = true;
          try { peer.destroy(); } catch (_) {}
          reject(error);
        }
        if (this.handlers.onError) this.handlers.onError(error);
      };

      peer.on("open", id => {
        settled = true;
        this.handlers.onOpen?.(id);
        resolve(id);
        if (!this.host) this.attachConnection(peer.connect(this.code, {reliable: true}));
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

      peer.on("error", error => fail(error));
      peer.on("disconnected", () => this.handlers.onClose?.());
      peer.on("close", () => this.handlers.onClose?.());
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
    try { this.conn?.close(); } catch (_) {}
    try { this.peer?.destroy(); } catch (_) {}
    this.conn = null;
    this.peer = null;
  }

  isConnected() {
    return !!(this.conn && this.conn.open);
  }
}
