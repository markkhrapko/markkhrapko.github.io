/* neural.js — a small neural field.
   Neurons ride an incompressible flow field (the curl of a time-evolving
   stream function, so the ambient motion is divergence-free and swirls
   like 2D fluid), form synapses with their nearest neighbors, and fire
   action potentials that travel along the connections and can trigger
   downstream spikes (leaky integrate-and-fire, with refractory periods).
   The cursor is a vortex neurons orbit; clicks detonate a shockwave.
   Zero dependencies, single rAF loop, spatial-hash neighbor lookup. */

(function () {
  'use strict';

  var REDUCED = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE = window.innerWidth <= 600;

  var CFG = {
    autoSpawn:   2,          // the only neurons that ever appear on their own
    maxNeurons:  MOBILE ? 90 : 180,
    linkDist:    MOBILE ? 115 : 140,
    maxLinks:    3,          // synapses per neuron (k-nearest)
    flowMax:     150,        // px/s cap on flow-following velocity
    followRate:  3.6,        // 1/s velocity lerp toward the flow target
    impulseDecay: 2.6,       // 1/s exponential decay of impulses
    pulseSpeed:  240,        // px/s action-potential travel
    synWeight:   0.55,       // EPSP per arriving pulse
    threshold:   1.0,        // firing threshold
    leakTau:     2.6,        // s, membrane leak
    refractory:  [1.6, 3.4], // s
    spontaneous: 13,         // s, mean interval between spontaneous spikes
    mouseR:      260,        // px, cursor influence radius
    pullG:       420,        // px/s^2 gravity toward the cursor at full urge
    blastR:      240,        // px, click excitation radius (primes firing)
    maxPulses:   400,
    color:       '212, 212, 216'
  };

  var mount = document.getElementById('particles-js');
  if (!mount) return;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, DPR = 1;
  function fit() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    // mount is fixed at 100% x 100%: clientWidth excludes a classic
    // scrollbar, unlike window.innerWidth, so drawn and displayed
    // coordinates stay aligned
    W = mount.clientWidth || window.innerWidth;
    H = mount.clientHeight || window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.lineCap = 'round';
  }
  fit();

  /* Pre-rendered glow sprite (radial gradient once, drawImage forever). */
  var SPRITE = 64;
  var glow = document.createElement('canvas');
  glow.width = glow.height = SPRITE;
  (function () {
    var g = glow.getContext('2d');
    var grad = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grad.addColorStop(0, 'rgba(' + CFG.color + ',0.85)');
    grad.addColorStop(0.25, 'rgba(' + CFG.color + ',0.28)');
    grad.addColorStop(1, 'rgba(' + CFG.color + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
  })();

  /* ------------------------------------------------------------------ */
  /* Flow field: v = curl(psi), psi a sum of traveling plane waves.      */
  /* Divergence-free by construction, so the field swirls without        */
  /* sources or sinks — neurons stream along evolving vortices.          */

  var FLOW = [];
  (function () {
    // three broad vortices plus one short-wavelength turbulence term:
    // large-scale streaming with fine chaotic churn on top
    var waveLen = [430, 250, 660, 150];    // px
    var speed   = [62, 48, 36, 26];        // px/s contribution (A*k)
    var omega   = [0.5, 0.85, 0.3, 1.3];   // rad/s temporal evolution
    for (var i = 0; i < waveLen.length; i++) {
      var k = (Math.PI * 2) / waveLen[i];
      var th = Math.random() * Math.PI * 2;
      FLOW.push({
        kx: Math.cos(th) * k,
        ky: Math.sin(th) * k,
        w: omega[i],
        A: speed[i] / k,
        p: Math.random() * Math.PI * 2
      });
    }
  })();

  function flowVel(x, y, t, out) {
    var vx = 0, vy = 0;
    for (var i = 0; i < FLOW.length; i++) {
      var f = FLOW[i];
      var c = Math.cos(f.kx * x + f.ky * y + f.w * t + f.p) * f.A;
      vx += c * f.ky;   // dpsi/dy
      vy -= c * f.kx;   // -dpsi/dx
    }
    out.x = vx;
    out.y = vy;
  }
  var flowOut = { x: 0, y: 0 };

  /* ------------------------------------------------------------------ */

  var neurons = [];
  var pulses = [];
  var flushing = false;
  var respawnAt = null;     // simT at which the field self-seeds if empty
  var simT = 0;
  var nextId = 1;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeNeuron(x, y, instant) {
    var z = rand(0.65, 1.15); // depth: scales size, speed, brightness
    return {
      id: nextId++,
      x: x, y: y,
      vx: 0, vy: 0,           // flow-following velocity
      ix: 0, iy: 0,           // impulse velocity (shockwaves, births)
      z: z,
      r: rand(1.2, 2.4) * z,
      swirl: rand(0.7, 1.3),              // gain — no two paths alike
      curF: rand(0.3, 0.8),               // rad/s, personal curiosity rhythm
      curP: rand(0, Math.PI * 2),
      impK: 2.6,                          // 1/s personal impulse decay
      nextTwitch: simT + rand(0.3, 2.5),  // organism-like darting, own clock
      born: instant ? -10 : simT,
      flash: 0,
      pot: 0,
      refr: rand(0, 1.2),
      dying: -1,   // simT at which this neuron starts to fade
      dieDur: 1,   // s, individual fade duration
      adj: null
    };
  }

  /* ------------------------------------------------------------------ */
  /* Discovery (reveal is per-session, on first click). The field itself
     is never persisted: every visit starts empty, two neurons drift in
     on their own, everything else comes from clicks.                    */

  try {
    localStorage.removeItem('neuralCount'); // retired keys
    localStorage.removeItem('neuralTouched');
  } catch (e) {}

  var controls = document.querySelector('.glymphatic-container');
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    if (controls) controls.classList.add('revealed');
  }

  if (REDUCED) {
    for (var s2 = 0; s2 < CFG.autoSpawn; s2++) {
      neurons.push(makeNeuron(rand(W * 0.2, W * 0.8), rand(H * 0.25, H * 0.75), true));
    }
  } else {
    // empty field; two neurons drift in on their own after a few seconds
    respawnAt = 4;
  }

  function autoSeed() {
    // the quiet tease: one neuron left, one right, not persisted
    neurons.push(makeNeuron(W * 0.22, rand(H * 0.3, H * 0.7)));
    neurons.push(makeNeuron(W * 0.78, rand(H * 0.3, H * 0.7)));
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                              */

  var mouse = { x: -1e4, y: -1e4, active: false, blocked: false };

  // pointermove + pointerType guard: on touch devices the compatibility
  // mousemove fired before each tap would otherwise park a permanent
  // phantom vortex at the last tap point
  document.addEventListener(window.PointerEvent ? 'pointermove' : 'mousemove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    mouse.blocked = !!(e.target && e.target.closest &&
      e.target.closest('a, button, .carousel-container, .glymphatic-container'));
  }, { passive: true });

  document.addEventListener('mouseleave', function () { mouse.active = false; });

  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest &&
        e.target.closest('a, button, .carousel-container, .glymphatic-container')) {
      return;
    }
    explodeAt(e.clientX, e.clientY);
  });

  /* Click = neurogenesis burst: shockwave knockback on the field,
     a ripple ring, a handful of new neurons thrown outward, and an
     immediate spike cascade from the epicenter. */
  function explodeAt(x, y) {
    if (flushing) return;
    reveal();

    // existing neurons stay put — the click only excites them
    var nearest = null, nd = Infinity;
    for (var i = 0; i < neurons.length; i++) {
      var n = neurons[i];
      var dx = n.x - x, dy = n.y - y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < nd) { nd = d; nearest = n; }
      if (d < CFG.blastR) n.pot += 0.3 * (1 - d / CFG.blastR);
    }

    // spawn a burst of new neurons radiating from the click
    var toSpawn = neurons.length === 0 ? 2 : 3;
    for (var b = 0; b < toSpawn; b++) {
      if (neurons.length >= CFG.maxNeurons) break;
      var a = rand(0, Math.PI * 2);
      var r0 = rand(6, 26);
      var nb = makeNeuron(x + Math.cos(a) * r0, y + Math.sin(a) * r0, REDUCED);
      // newborns glide far across the screen: moderate speed, slow decay
      var bv = rand(180, 300);
      nb.ix = Math.cos(a) * bv;
      nb.iy = Math.sin(a) * bv;
      nb.impK = 0.45;
      nb.flash = 0.7;
      neurons.push(nb);
    }

    // detonate the cascade through existing wiring
    if (!REDUCED && nearest && nearest.adj) forceFire(nearest);

    if (REDUCED) {
      // flash never decays without the update loop — render calm
      for (var f = 0; f < neurons.length; f++) neurons[f].flash = 0;
      buildAdjacency();
      render();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Buttons                                                            */

  var flushBtn = document.getElementById('reset-curse');

  if (flushBtn) flushBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (flushing || !neurons.length) return;
    flushing = true;
    pulses.length = 0;
    // staggered die-off: each neuron gets its own moment and pace,
    // the colony winks out over ~2 seconds
    for (var i = 0; i < neurons.length; i++) {
      neurons[i].dying = simT + rand(0, 1.5);
      neurons[i].dieDur = rand(0.3, 0.7);
    }
    if (REDUCED) {
      // no update loop to run the 5s reseed, so recover immediately
      neurons.length = 0;
      flushing = false;
      for (var r2 = 0; r2 < CFG.autoSpawn; r2++) {
        neurons.push(makeNeuron(rand(W * 0.2, W * 0.8), rand(H * 0.25, H * 0.75), true));
      }
      buildAdjacency();
      render();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Simulation                                                         */

  function fire(n) {
    if (n.refr > 0 || n.dying >= 0) return;
    n.flash = 1;
    n.pot = 0;
    n.refr = rand(CFG.refractory[0], CFG.refractory[1]);
    if (REDUCED || !n.adj) return;
    for (var k = 0; k < n.adj.length && k < CFG.maxLinks; k++) {
      if (pulses.length >= CFG.maxPulses) break;
      pulses.push({ a: n, b: n.adj[k].n, t: 0, dur: n.adj[k].d / CFG.pulseSpeed });
    }
  }

  function forceFire(n) { n.refr = 0; fire(n); }

  function pairBow(a, b) {
    // stable, deterministic curvature per synapse
    var h = ((a.id * 73856093) ^ (b.id * 19349663)) >>> 0;
    return ((h % 1000) / 1000 - 0.5) * 0.34;
  }

  /* spatial hash for neighbor lookup */
  function buildAdjacency() {
    var cell = CFG.linkDist;
    var cols = Math.max(1, Math.ceil(W / cell));
    var grid = {};
    var i, n, key;
    for (i = 0; i < neurons.length; i++) {
      n = neurons[i];
      key = Math.floor(n.x / cell) + Math.floor(n.y / cell) * cols;
      (grid[key] || (grid[key] = [])).push(n);
      n.adj = [];
    }
    for (i = 0; i < neurons.length; i++) {
      n = neurons[i];
      var cx = Math.floor(n.x / cell), cy = Math.floor(n.y / cell);
      for (var gx = cx - 1; gx <= cx + 1; gx++) {
        for (var gy = cy - 1; gy <= cy + 1; gy++) {
          var bucket = grid[gx + gy * cols];
          if (!bucket) continue;
          for (var j = 0; j < bucket.length; j++) {
            var m = bucket[j];
            if (m.id <= n.id) continue;
            var dx = m.x - n.x, dy = m.y - n.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < CFG.linkDist) {
              n.adj.push({ n: m, d: d });
              m.adj.push({ n: n, d: d });
            }
          }
        }
      }
    }
    for (i = 0; i < neurons.length; i++) {
      neurons[i].adj.sort(function (p, q) { return p.d - q.d; });
      if (neurons[i].adj.length > CFG.maxLinks + 2) neurons[i].adj.length = CFG.maxLinks + 2;
    }
  }

  function update(dt) {
    simT += dt;

    // self-seed once the field has been empty for a while
    if (respawnAt !== null && simT >= respawnAt && !flushing) {
      respawnAt = null;
      if (neurons.length === 0) autoSeed();
    }

    buildAdjacency();

    var margin = 26;
    var leak = Math.exp(-dt / CFG.leakTau);
    var follow = Math.min(1, dt * CFG.followRate);

    for (var i = neurons.length - 1; i >= 0; i--) {
      var n = neurons[i];

      // scheduled death (glymphatic flush): the neuron keeps swimming
      // with the flow and simply dissolves when its moment comes
      if (n.dying >= 0 && simT >= n.dying + n.dieDur) {
        neurons.splice(i, 1);
        continue;
      }

      // membrane
      n.pot *= leak;
      if (n.refr > 0) n.refr -= dt;
      if (n.flash > 0) n.flash -= dt / 0.6;

      // ambient target: the flow field, scaled by depth
      flowVel(n.x, n.y, simT, flowOut);
      var tx = flowOut.x * n.z;
      var ty = flowOut.y * n.z;

      // cursor gravity: a straightforward pull that breathes between a
      // strong surge and a brief wander-off on each neuron's own rhythm,
      // fading out up close so they mill around the cursor rather than
      // piling onto it — simple attraction, alive at the edges
      var excited = 1;
      if (mouse.active && !mouse.blocked) {
        var mdx = mouse.x - n.x, mdy = mouse.y - n.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        if (md < CFG.mouseR) {
          var prox = 1 - md / CFG.mouseR;
          excited = 1 + 8 * prox * prox;
          var urge = 0.7 + 0.9 * Math.sin(simT * n.curF + n.curP);
          var g = CFG.pullG * prox * urge * Math.min(1, md / 60);
          n.ix += (mdx / md) * g * dt;
          n.iy += (mdy / md) * g * dt;
        }
      }

      // steer the flow target away from walls so sustained outward flow
      // can't pin neurons against the hard clamp
      var steerM = 90;
      if (n.x < steerM) tx += (steerM - n.x) * 1.6;
      else if (n.x > W - steerM) tx -= (n.x - (W - steerM)) * 1.6;
      if (n.y < steerM) ty += (steerM - n.y) * 1.6;
      else if (n.y > H - steerM) ty -= (n.y - (H - steerM)) * 1.6;

      // cap the ambient target and chase it
      var tmag = Math.sqrt(tx * tx + ty * ty);
      if (tmag > 160) {
        var tsc = 160 / tmag;
        tx *= tsc; ty *= tsc;
      }
      n.vx += (tx - n.vx) * follow;
      n.vy += (ty - n.vy) * follow;

      // impulses ring down at the neuron's own rate (newborn gliders
      // decay slowly, then return to the normal rate once they settle)
      var keep = Math.exp(-n.impK * dt);
      n.ix *= keep;
      n.iy *= keep;
      if (n.impK < CFG.impulseDecay && (n.ix * n.ix + n.iy * n.iy) < 400) {
        n.impK = CFG.impulseDecay;
      }

      // organism twitch: an occasional small dart on the neuron's own
      // clock — the decaying impulse renders it as a smooth flick
      if (simT >= n.nextTwitch) {
        n.nextTwitch = simT + rand(0.7, 2.8);
        var ta = rand(0, Math.PI * 2);
        var tk = rand(30, 90) * n.z;
        n.ix += Math.cos(ta) * tk;
        n.iy += Math.sin(ta) * tk;
      }

      // colony spacing: gentle short-range repulsion so close neighbors
      // breathe apart instead of overlapping
      if (n.adj) {
        for (var sp2 = 0; sp2 < n.adj.length && sp2 < 3; sp2++) {
          var pr = n.adj[sp2];
          if (pr.d < 26 && pr.d > 0.01) {
            var push = (26 - pr.d) * 3 * dt;
            n.ix += ((n.x - pr.n.x) / pr.d) * push;
            n.iy += ((n.y - pr.n.y) / pr.d) * push;
          }
        }
      }

      // spontaneous spikes (Poisson-ish), livelier near the cursor
      if (Math.random() < (dt / CFG.spontaneous) * excited) fire(n);

      // soft bounds push back through the impulse channel
      if (n.x < margin) n.ix += (margin - n.x) * 6 * dt;
      if (n.x > W - margin) n.ix -= (n.x - (W - margin)) * 6 * dt;
      if (n.y < margin) n.iy += (margin - n.y) * 6 * dt;
      if (n.y > H - margin) n.iy -= (n.y - (H - margin)) * 6 * dt;

      n.x += (n.vx + n.ix) * dt;
      n.y += (n.vy + n.iy) * dt;

      // hard clamp with a soft bounce so blasts never strand anyone
      if (n.x < 4) { n.x = 4; n.ix = Math.abs(n.ix) * 0.4; }
      if (n.x > W - 4) { n.x = W - 4; n.ix = -Math.abs(n.ix) * 0.4; }
      if (n.y < 4) { n.y = 4; n.iy = Math.abs(n.iy) * 0.4; }
      if (n.y > H - 4) { n.y = H - 4; n.iy = -Math.abs(n.iy) * 0.4; }
    }

    if (flushing && neurons.length === 0) {
      flushing = false;
      respawnAt = simT + 5; // the field quietly comes back to life
    }

    // action potentials
    for (var p = pulses.length - 1; p >= 0; p--) {
      var pu = pulses[p];
      if (pu.a.dying >= 0 || pu.b.dying >= 0) { pulses.splice(p, 1); continue; }
      pu.t += dt / pu.dur;
      if (pu.t >= 1) {
        var b = pu.b;
        b.pot += CFG.synWeight * rand(0.8, 1.2);
        b.flash = Math.min(1, b.flash + 0.25);
        if (b.pot >= CFG.threshold) fire(b);
        pulses.splice(p, 1);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                          */

  function bezier(ax, ay, bx, by, bow, t) {
    var mx = (ax + bx) / 2, my = (ay + by) / 2;
    var dx = bx - ax, dy = by - ay;
    var cx = mx - dy * bow, cy = my + dx * bow;
    var u = 1 - t;
    return {
      x: u * u * ax + 2 * u * t * cx + t * t * bx,
      y: u * u * ay + 2 * u * t * cy + t * t * by,
      cx: cx, cy: cy
    };
  }

  function neuronAlpha(n) {
    var a = 0.5 + 0.28 * (n.z - 0.65);
    var age = simT - n.born;
    if (age < 0.35) { var g = age / 0.35; a *= g * g; }
    if (n.dying >= 0 && simT >= n.dying) {
      a *= Math.max(0, 1 - (simT - n.dying) / n.dieDur);
    }
    return a;
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // synapses: union of both endpoints' nearest links, each pair drawn
    // once in canonical (low id -> high id) direction so the curve is
    // identical to the one pulses travel along
    ctx.lineWidth = 1;
    var i, j, k, n;
    for (i = 0; i < neurons.length; i++) {
      n = neurons[i];
      if (!n.adj) continue;
      for (j = 0; j < n.adj.length && j < CFG.maxLinks; j++) {
        var m = n.adj[j].n;
        if (m.id < n.id) {
          // skip iff m also links n in its top set (m draws the pair)
          var drawnByM = false;
          if (m.adj) {
            for (k = 0; k < m.adj.length && k < CFG.maxLinks; k++) {
              if (m.adj[k].n === n) { drawnByM = true; break; }
            }
          }
          if (drawnByM) continue;
        }
        var d = n.adj[j].d;
        var alpha = 0.08 * (1 - d / CFG.linkDist) * neuronAlpha(n) * neuronAlpha(m);
        alpha *= 1 + 0.6 * Math.max(n.flash, m.flash);
        if (alpha < 0.004) continue;
        var lo = n.id < m.id ? n : m;
        var hi = lo === n ? m : n;
        var bow = pairBow(lo, hi);
        var mid = bezier(lo.x, lo.y, hi.x, hi.y, bow, 0.5);
        ctx.strokeStyle = 'rgba(' + CFG.color + ',' + Math.min(alpha, 0.18).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(lo.x, lo.y);
        ctx.quadraticCurveTo(mid.cx, mid.cy, hi.x, hi.y);
        ctx.stroke();
      }
    }

    // traveling action potentials: bright head + fading trail, evaluated
    // on the same canonical curve as the drawn synapse
    for (i = 0; i < pulses.length; i++) {
      var pu = pulses[i];
      var plo = pu.a.id < pu.b.id ? pu.a : pu.b;
      var phi = plo === pu.a ? pu.b : pu.a;
      var rev = plo !== pu.a; // travel direction vs canonical direction
      var bow2 = pairBow(plo, phi);
      var tHead = rev ? 1 - pu.t : pu.t;
      var tTail = rev ? Math.min(1, tHead + 0.22) : Math.max(0, tHead - 0.22);
      var head = bezier(plo.x, plo.y, phi.x, phi.y, bow2, tHead);
      var tail = bezier(plo.x, plo.y, phi.x, phi.y, bow2, tTail);
      ctx.strokeStyle = 'rgba(235,235,240,' + (0.2 * Math.sin(Math.PI * Math.min(pu.t, 1))).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
      var hs = 5;
      ctx.globalAlpha = 0.35 * Math.sin(Math.PI * Math.min(pu.t, 1));
      ctx.drawImage(glow, head.x - hs / 2, head.y - hs / 2, hs, hs);
      ctx.globalAlpha = 1;
    }

    // somata
    for (i = 0; i < neurons.length; i++) {
      n = neurons[i];
      var a = neuronAlpha(n);
      if (a <= 0.01) continue;
      var flash = Math.max(0, n.flash);
      // slow individual breathing — alive even at rest
      var breath = 1 + 0.09 * Math.sin(simT * (0.8 + n.swirl) + n.id);
      var size = n.r * 4 * breath * (1 + flash * 0.5);
      ctx.globalAlpha = a * (0.09 + 0.2 * flash);
      ctx.drawImage(glow, n.x - size / 2, n.y - size / 2, size, size);
      ctx.globalAlpha = a * (0.6 + 0.25 * flash);
      ctx.fillStyle = flash > 0.3 ? 'rgba(235,235,240,0.9)' : 'rgba(' + CFG.color + ',0.8)';
      // area-preserving elongation along the velocity vector — fast
      // neurons stretch like swimming cells, slow ones stay round
      var tvx = n.vx + n.ix, tvy = n.vy + n.iy;
      var spd = Math.sqrt(tvx * tvx + tvy * tvy);
      var stretch = REDUCED ? 1 : 1 + Math.min(spd / 320, 0.35);
      ctx.save();
      ctx.translate(n.x, n.y);
      if (stretch > 1.01) {
        ctx.rotate(Math.atan2(tvy, tvx));
        ctx.scale(stretch, 1 / stretch);
      }
      ctx.beginPath();
      ctx.arc(0, 0, n.r * breath * (1 + flash * 0.3), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Loop                                                               */

  var rafId = null;
  var lastT = 0;

  function frame(now) {
    var dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    update(dt);
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null || REDUCED) return;
    lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      fit();
      for (var i = 0; i < neurons.length; i++) {
        neurons[i].x = Math.min(Math.max(neurons[i].x, 10), W - 10);
        neurons[i].y = Math.min(Math.max(neurons[i].y, 10), H - 10);
      }
      if (REDUCED) { buildAdjacency(); render(); }
    }, 150);
  });

  if (REDUCED) {
    buildAdjacency();
    render();
  } else {
    start();
  }

  try {
    console.log('%cneurogenesis: click anywhere.', 'color:#808080;font:11px monospace');
  } catch (e) {}
})();
