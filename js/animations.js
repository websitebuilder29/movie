import { gsap } from "gsap";

export function fadeInScene(sceneEl) {
  const content = sceneEl.querySelector(".scene-inner");
  if (!content) return;

  gsap.fromTo(content,
    { opacity: 0, y: 40, filter: "blur(16px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, ease: "expo.out", overwrite: "auto" }
  );

  const children = content.querySelectorAll(":scope > *");
  gsap.fromTo(children,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 1, stagger: 0.16, ease: "power3.out", delay: 0.2, overwrite: "auto" }
  );

  const choices = sceneEl.querySelector(".choices");
  if (choices) {
    gsap.fromTo(choices.children,
      { opacity: 0, x: (i) => (i === 0 ? -50 : 50), scale: 0.85 },
      { opacity: 1, x: 0, scale: 1, duration: 1.1, stagger: 0.18, ease: "elastic.out(1, 0.5)", delay: 0.6 }
    );
  }

  const big = sceneEl.querySelector(".title-split--big");
  if (big) {
    gsap.fromTo(big,
      { letterSpacing: "0.3em", scale: 0.92, filter: "blur(8px)" },
      { letterSpacing: "0.02em", scale: 1, filter: "blur(0px)", duration: 2, ease: "expo.out" }
    );
  }
}

export function typewriter(el) {
  if (!el || el.dataset.typedDone === "true") return;
  el.dataset.typedDone = "true";

  const fullText = el.dataset.typed || "";
  el.textContent = "";
  const caret = document.createElement("span");
  caret.className = "caret";
  el.appendChild(caret);

  let i = 0;
  function tick() {
    if (i < fullText.length) {
      const span = document.createElement("span");
      span.textContent = fullText[i];
      if (fullText[i] !== " ") span.className = "char-spark";
      caret.before(span);
      i++;
      setTimeout(tick, 28);
    } else {
      setTimeout(() => caret.remove(), 2200);
    }
  }
  tick();
}

export function scrambleText(el) {
  if (!el) return;
  const finalText = el.dataset.scramble || el.textContent;
  const chars = "!<>-_\\/[]{}—=+*^?#";
  let frame = 0;
  const totalFrames = 30;
  const revealAt = Math.floor(totalFrames * 0.6);

  function update() {
    let output = "";
    for (let i = 0; i < finalText.length; i++) {
      if (frame > revealAt + i) output += finalText[i];
      else if (finalText[i] === " ") output += " ";
      else output += chars[Math.floor(Math.random() * chars.length)];
    }
    el.textContent = output;
    frame++;
    if (frame <= totalFrames) requestAnimationFrame(update);
    else el.textContent = finalText;
  }
  update();
}

export function glitchIn(el) {
  if (!el) return;
  gsap.fromTo(el,
    { opacity: 0, scale: 0.88, filter: "blur(10px)" },
    { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "expo.out" }
  );
  gsap.to(el, {
    x: -3, duration: 0.05, repeat: 3, yoyo: true, ease: "none", delay: 0.5,
    onComplete: () => gsap.set(el, { x: 0 })
  });
}