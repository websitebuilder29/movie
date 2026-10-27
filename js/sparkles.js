let canvas, ctx, particles = [], rings = [], rafId = null;

export function initSparkles(canvasEl) {
  canvas = canvasEl;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

/** Explosión MASIVA al aceptar: 3 capas (ondas + brasas + monedas) */
export function burstAcceptance() {
  if (!ctx) return;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  // Capa 1: ondas de choque
  for (let i = 0; i < 4; i++) {
    rings.push({
      x: cx,
      y: cy,
      radius: 0,
      maxRadius: 200 + i * 120,
      life: 1,
      decay: 0.018,
      width: 3,
      color: i % 2 === 0 ? "#c0392b" : "#b8943e",
    });
  }

  // Capa 2: brasas (explosión radial)
  const emberColors = ["#8b1a1a", "#c0392b", "#d4641e", "#ff4400", "#ffaa00"];
  const emberCount = window.innerWidth < 768 ? 100 : 220;
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 14;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      decay: 0.012 + Math.random() * 0.022,
      size: 1.5 + Math.random() * 4,
      color: emberColors[(Math.random() * emberColors.length) | 0],
      gravity: 0.12,
      isCoin: false,
    });
  }

  // Capa 3: monedas malditas (lluvia desde arriba)
  const coinColors = ["#8a6d2b", "#5c4818", "#b8943e", "#d4c4a8"];
  const coinCount = window.innerWidth < 768 ? 40 : 80;
  for (let i = 0; i < coinCount; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2 + Math.random() * 3,
      life: 1,
      decay: 0.005 + Math.random() * 0.007,
      size: 5 + Math.random() * 7,
      color: coinColors[(Math.random() * coinColors.length) | 0],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      isCoin: true,
    });
  }

  if (!rafId) loop();
}

/** Compatibilidad con código anterior */
export function burstSparkles() {
  burstAcceptance();
}

function loop() {
  rafId = requestAnimationFrame(loop);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // Ondas
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.radius += (r.maxRadius - r.radius) * 0.08;
    r.life -= r.decay;
    if (r.life <= 0) { rings.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(r.life, 0) * 0.7;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width * r.life;
    ctx.shadowBlur = 20;
    ctx.shadowColor = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.isCoin) {
      p.vy += 0.06;
      p.rotation += p.rotSpeed;
    } else {
      p.vy += p.gravity;
      p.vx *= 0.975;
      p.vy *= 0.975;
    }

    p.life -= p.decay;

    if (p.life <= 0 || p.y > window.innerHeight + 100) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.max(p.life, 0);

    if (p.isCoin) {
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.max(p.life, 0) * 0.5;
      ctx.fillStyle = "#f0e6d0";
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.2, -p.size * 0.08, p.size * 0.25, p.size * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.max(p.life, 0) * 0.35;
      ctx.fillStyle = "#ffaa00";
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (particles.length === 0 && rings.length === 0) {
    cancelAnimationFrame(rafId);
    rafId = null;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}