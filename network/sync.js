export function createSync(room) {
  let remote = null;
  let remoteScore = 0;

  return {
    sendState(state) {
      room.send(state);
    },
    sendScore(score) {
      room.send({t: "score", s: score});
    },
    sendHit() {
      room.send({t: "hit"});
    },
    receive(data) {
      if (!data || !data.t) return null;
      if (data.t === "state") {
        remote = data;
        if (typeof data.s === "number") remoteScore = data.s;
      }
      if (data.t === "score") remoteScore = Number(data.s) || 0;
      return {data, remote, remoteScore};
    },
    getRemote() { return remote; },
    getRemoteScore() { return remoteScore; }
  };
}
