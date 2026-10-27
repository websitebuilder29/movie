let initScene3D = () => {};
let pulseScene = () => {};
let triggerLightning = () => {};
let initAudio = () => {};
let toggleAudio = () => false;
let playAccept = () => {};
let initSparkles = () => {};
let burstSparkles = () => {};
let burstAcceptance = () => {};
let fadeInScene = () => {};
let typewriter = () => {};
let scrambleText = () => {};
let glitchIn = () => {};

async function loadModules() {
  const results = await Promise.allSettled([
    import("./scene3d.js").then(m => {
      initScene3D = m.initScene3D || initScene3D;
      pulseScene = m.pulseScene || pulseScene;
      triggerLightning = m.triggerLightning || triggerLightning;
    }),
    import("./audio.js").then(m => {
      initAudio = m.initAudio || initAudio;
      toggleAudio = m.toggleAudio || toggleAudio;
      playAccept = m.playAccept || playAccept;
    }),
    import("./sparkles.js").then(m => {
      initSparkles = m.initSparkles || initSparkles;
      burstSparkles = m.burstSparkles || burstSparkles;
      burstAcceptance = m.burstAcceptance || burstAcceptance;
    }),
    import("./animations.js").then(m => {
      fadeInScene = m.fadeInScene || fadeInScene;
      typewriter = m.typewriter || typewriter;
      scrambleText = m.scrambleText || scrambleText;
      glitchIn = m.glitchIn || glitchIn;
    }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`[módulo ${i}] falló:`, r.reason);
  });
}

const state = { currentScene: 0, userAccepted: null };

const scenes = Array.from(document.querySelectorAll(".scene"));
const bgCanvas = document.getElementById("bg-canvas");
const sparkleCanvas = document.getElementById("sparkle-canvas");
const audioBtn = document.getElementById("audio-toggle");
const transition = document.querySelector(".scene-transition");

async function boot() {
  await loadModules();

  try { initScene3D(bgCanvas); } catch (err) { console.error("[3D]", err); }
  try { initSparkles(sparkleCanvas); } catch (err) { console.error("[sparkles]", err); }
  try { initAudio(); } catch (err) { console.warn("[audio]", err); }

  if (audioBtn) {
    audioBtn.addEventListener("click", () => {
      const on = toggleAudio();
      audioBtn.querySelector(".audio-icon").textContent = on ? "🔊" : "🔇";
    });
  }

  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => handleAction(btn, e));
    btn.addEventListener("pointerdown", (e) => createRipple(btn, e));
  });

  initMagneticButtons();
  initTiltCards();
  initCursor();
  initParallax();

  resetResponses();

  await wait(1800);
  goToScene(1);
}

function resetResponses() {
  const yes = document.getElementById("response-yes");
  const maybe = document.getElementById("response-maybe");
  const choices = document.getElementById("choices");
  if (yes) yes.style.display = "none";
  if (maybe) maybe.style.display = "none";
  if (choices) {
    choices.style.display = "flex";
    choices.style.opacity = "1";
    choices.style.transform = "none";
  }
}

function handleAction(btn, e) {
  const action = btn.dataset.action;

  if (action === "start") {
    try { pulseScene(); } catch {}
    try { triggerLightning(); } catch {}
    goToScene(2);
  }

  if (action === "next") {
    goToScene(parseInt(btn.dataset.to, 10));
  }

  if (action === "accept") {
    state.userAccepted = true;
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    try { burstAcceptance(); } catch {}
    try { playAccept(); } catch {}
    try { pulseScene(2.5); } catch {}
    try { triggerLightning(); } catch {}
    showResponse("yes");
  }

  if (action === "think") {
    state.userAccepted = false;
    showResponse("maybe");
  }

  if (action === "back-to-proposal") {
    state.userAccepted = null;
    backToProposal();
  }

  if (action === "restart") {
    state.userAccepted = null;
    resetUI();
    goToScene(1);
  }
}

function goToScene(index) {
  if (index === state.currentScene) return;

  const current = scenes[state.currentScene];
  const next = scenes[index];
  if (!next) return;

  if (transition) {
    transition.classList.remove("is-active");
    void transition.offsetWidth;
    transition.classList.add("is-active");
  }

  if (current) {
    current.classList.add("is-leaving");
    setTimeout(() => {
      current.classList.remove("is-active", "is-leaving");
      current.setAttribute("aria-hidden", "true");
    }, 900);
  }

  next.setAttribute("aria-hidden", "false");
  next.classList.add("is-active");

  requestAnimationFrame(() => {
    try { fadeInScene(next); } catch {}
    next.querySelectorAll(".glitch-text").forEach(el => { try { glitchIn(el); } catch {} });
    next.querySelectorAll("[data-scramble]").forEach(el => { try { scrambleText(el); } catch {} });
    const typed = next.querySelector(".typed-text");
    if (typed) { try { typewriter(typed); } catch {} }
  });

  state.currentScene = index;
  try { pulseScene(index === 3 ? 1.5 : 1); } catch {}
}

function showResponse(kind) {
  const choices = document.getElementById("choices");
  const yes = document.getElementById("response-yes");
  const maybe = document.getElementById("response-maybe");
  if (!choices || !yes || !maybe) return;

  choices.style.transition = "opacity 0.4s, transform 0.4s";
  choices.style.opacity = "0";
  choices.style.transform = "translateY(-10px)";

  setTimeout(() => {
    choices.style.display = "none";
    if (kind === "yes") {
      yes.style.display = "flex";
      maybe.style.display = "none";
    } else {
      maybe.style.display = "flex";
      yes.style.display = "none";
    }
  }, 400);
}

function backToProposal() {
  const choices = document.getElementById("choices");
  const yes = document.getElementById("response-yes");
  const maybe = document.getElementById("response-maybe");
  if (!choices || !yes || !maybe) return;

  yes.style.display = "none";
  maybe.style.display = "none";
  choices.style.display = "flex";
  choices.style.opacity = "1";
  choices.style.transform = "none";
}

function resetUI() {
  resetResponses();
  document.querySelectorAll(".typed-text").forEach(el => {
    el.textContent = "";
    el.dataset.typedDone = "false";
  });
}

function createRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const size = Math.max(rect.width, rect.height) * 2;
  const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
}

function initMagneticButtons() {
  if (window.matchMedia("(hover: none)").matches) return;
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) translateZ(0)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

function initTiltCards() {
  if (window.matchMedia("(hover: none)").matches) return;
  document.querySelectorAll(".tilt-card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      card.style.transform = `perspective(1000px) rotateX(${(y - 0.5) * -8}deg) rotateY(${(x - 0.5) * 8}deg) translateZ(0)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

function initCursor() {
  if (window.matchMedia("(hover: none)").matches) return;
  const cursor = document.querySelector(".cursor");
  if (!cursor) return;
  const dot = cursor.querySelector(".cursor-dot");
  const ring = cursor.querySelector(".cursor-ring");
  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });
  function loop() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll(".btn, .audio-toggle, a").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

function initParallax() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("pointermove", (e) => {
    document.documentElement.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5) * 2);
    document.documentElement.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5) * 2);
  });
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    document.addEventListener("click", async function ask() {
      document.removeEventListener("click", ask);
      try {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p === "granted") window.addEventListener("deviceorientation", onOrient);
      } catch {}
    }, { once: true });
  } else {
    window.addEventListener("deviceorientation", onOrient);
  }
  function onOrient(e) {
    document.documentElement.style.setProperty("--mx", (e.gamma || 0) / 45);
    document.documentElement.style.setProperty("--my", (e.beta || 0) / 45);
  }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

window.addEventListener("DOMContentLoaded", boot);