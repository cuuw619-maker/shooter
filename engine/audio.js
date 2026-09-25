export function createAudioEngine() {
  let ctx = null;
  let master = null;
  let lastShot = 0;
  let lastStep = 0;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.30;
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
    osc.frequency.setValueAtTime(Math.max(20, frequency), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.015);
  }

  function noise({duration=0.08, gain=0.12, highpass=900, lowpass=12000, when=0}) {
    const audio = ensure();
    const now = audio.currentTime + when;
    const buffer = audio.createBuffer(1, Math.max(1, Math.floor(audio.sampleRate * duration)), audio.sampleRate);
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

  function click(pitch=1, when=0) {
    tone({
      frequency: 850 * pitch,
      endFrequency: 540 * pitch,
      duration: 0.035,
      gain: 0.035,
      type: "square",
      when
    });
  }

  return {
    unlock() { ensure(); },

    shot(weapon="rifle") {
      const now = performance.now();
      const gap = weapon === "sniper" ? 800 : weapon === "pistol" ? 180 : 70;
      if (now - lastShot < gap) return;
      lastShot = now;

      if (weapon === "sniper") {
        // Layered AWP-style transient: mechanical snap + large low-end report.
        noise({duration:0.16, gain:0.22, highpass:500, lowpass:9800});
        noise({duration:0.08, gain:0.12, highpass:1800, lowpass:14500});
        tone({frequency:135, endFrequency:38, duration:0.26, gain:0.23, type:"sawtooth"});
        tone({frequency:62, endFrequency:30, duration:0.34, gain:0.12, type:"sine"});
      } else if (weapon === "pistol") {
        noise({duration:0.075, gain:0.14, highpass:900, lowpass:10000});
        tone({frequency:190, endFrequency:70, duration:0.10, gain:0.10, type:"square"});
      } else {
        noise({duration:0.06, gain:0.105, highpass:1150, lowpass:11000});
        tone({frequency:155, endFrequency:58, duration:0.075, gain:0.078, type:"square"});
      }
    },

    hit() {
      tone({frequency:1040, endFrequency:430, duration:0.065, gain:0.10, type:"triangle"});
      click(1.2, 0.018);
    },

    dry() {
      click(0.7);
      tone({frequency:130, endFrequency:95, duration:0.06, gain:0.05, type:"square", when:0.035});
    },

    reload() {
      click(0.85);
      tone({frequency:430, endFrequency:250, duration:0.045, gain:0.052, type:"triangle", when:0.08});
      tone({frequency:680, endFrequency:390, duration:0.045, gain:0.042, type:"triangle", when:0.20});
      click(1.1, 0.34);
    },

    bolt() {
      noise({duration:0.035, gain:0.032, highpass:900, lowpass:4500});
      click(0.82, 0.025);
      tone({frequency:260, endFrequency:170, duration:0.055, gain:0.035, type:"triangle", when:0.07});
    },

    jump() {
      tone({frequency:240, endFrequency:420, duration:0.08, gain:0.045, type:"triangle"});
    },

    hurt() {
      tone({frequency:170, endFrequency:90, duration:0.09, gain:0.06, type:"sawtooth"});
    },

    step(sprint=false) {
      const now = performance.now();
      if (now - lastStep < (sprint ? 260 : 350)) return;
      lastStep = now;
      noise({duration:0.05, gain:sprint ? 0.043 : 0.030, highpass:85, lowpass:690});
      tone({
        frequency:sprint ? 94 : 80,
        endFrequency:sprint ? 54 : 47,
        duration:0.055,
        gain:sprint ? 0.024 : 0.017,
        type:"triangle"
      });
    },

    land() {
      noise({duration:0.085, gain:0.06, highpass:70, lowpass:520});
      tone({frequency:105, endFrequency:50, duration:0.095, gain:0.032, type:"triangle"});
    },

    switchWeapon() {
      click(0.9);
      tone({frequency:520, endFrequency:310, duration:0.045, gain:0.038, type:"triangle", when:0.05});
      tone({frequency:760, endFrequency:470, duration:0.035, gain:0.026, type:"triangle", when:0.12});
    },

    aim(on) {
      if (on) {
        tone({frequency:260, endFrequency:340, duration:0.06, gain:0.025, type:"sine"});
      } else {
        tone({frequency:340, endFrequency:240, duration:0.05, gain:0.020, type:"sine"});
      }
    }
  };
}
