export function createSync(room) {
  let remote = null;
  let remoteScore = 0;
  let localSequence = 0;
  let lastRemoteSequence = -1;
  let lastRemoteAt = 0;

  return {
    sendState(state) {
      const packet={...state,q:++localSequence,ts:performance.now()};
      room.send(packet);
    },
    sendScore(score) {
      room.send({t:"score",s:Number(score)||0,ts:performance.now()});
    },
    sendHit(payload={}) {
      room.send({t:"hit",...payload,ts:performance.now()});
    },
    receive(data) {
      if (!data || !data.t) return null;
      if (data.t === "state") {
        const seq=Number(data.q);
        if(Number.isFinite(seq) && seq<=lastRemoteSequence) return {data:remote,remote,remoteScore};
        if(Number.isFinite(seq)) lastRemoteSequence=seq;
        remote=data;
        if (typeof data.s === "number") remoteScore = data.s;
        lastRemoteAt=performance.now();
      }
      if (data.t === "score") remoteScore = Number(data.s) || 0;
      return {data,remote,remoteScore};
    },
    getRemote() { return remote; },
    getRemoteScore() { return remoteScore; },
    remoteAge() { return lastRemoteAt ? performance.now()-lastRemoteAt : Infinity; }
  };
}
