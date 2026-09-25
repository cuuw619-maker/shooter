export function createAudioEngine() {
  let ctx = null;
  let master = null;
  let lastShot = 0;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({frequency, endFrequency=frequency, duration=0.06, gain=0.12, type="square", when=0}) {
    const audio = ensure();
    const now = audio.currentTime + when;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function noise({duration=0.08, gain=0.12, highpass=900, lowpass=12000}) {
    const audio = ensure();
    const now = audio.currentTime;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const fade = 1 - i / data.length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    const source = audio.createBufferSource();
    const hp = audio.createBiquadFilter();
    const lp = audio.createBiquadFilter();
    const amp = audio.createGain();
    hp.type = "highpass";
    hp.frequency.value = highpass;
    lp.type = "lowpass";
    lp.frequency.value = lowpass;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.buffer = buffer;
    source.connect(hp);
    hp.connect(lp);
    lp.connect(amp);
    amp.connect(master);
    source.start(now);
  }

  return {
    unlock() { ensure(); },
    shot(weapon="rifle") {
      const now = performance.now();
      const gap = weapon === "sniper" ? 700 : weapon === "pistol" ? 180 : 75;
      if (now - lastShot < gap) return;
      lastShot = now;
      if (weapon === "sniper") {
        noise({duration:0.12, gain:0.16, highpass:650, lowpass:8000});
        tone({frequency:120, endFrequency:42, duration:0.20, gain:0.20, type:"sawtooth"});
      } else if (weapon === "pistol") {
        noise({duration:0.075, gain:0.13, highpass:950, lowpass:9500});
        tone({frequency:180, endFrequency:75, duration:0.09, gain:0.09, type:"square"});
      } else {
        noise({duration:0.06, gain:0.10, highpass:1200, lowpass:11000});
        tone({frequency:150, endFrequency:60, duration:0.07, gain:0.07, type:"square"});
      }
    },
    hit() {
      tone({frequency:920, endFrequency:420, duration:0.07, gain:0.11, type:"triangle"});
    },
    dry() {
      tone({frequency:150, endFrequency:110, duration:0.055, gain:0.08, type:"square"});
    },
    reload() {
      tone({frequency:430, endFrequency:250, duration:0.045, gain:0.055, type:"triangle"});
      tone({frequency:680, endFrequency:390, duration:0.045, gain:0.045, type:"triangle", when:0.16});
    },
    jump() {
      tone({frequency:240, endFrequency:420, duration:0.08, gain:0.045, type:"triangle"});
    },
    hurt() {
      tone({frequency:170, endFrequency:90, duration:0.09, gain:0.06, type:"sawtooth"});
    }
  };
}
