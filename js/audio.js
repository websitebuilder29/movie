const Howl = window.Howl || null;

let ambient = null;
let isOn = false;
let unlocked = false;
let ambientReady = false;

export function initAudio() {
  if (!Howl) {
    console.warn("[audio] Howler no disponible; audio desactivado.");
    return;
  }

  ambient = new Howl({
    src: ["./assets/audio/ambient.mp3"],
    loop: true,
    volume: 0.0,
    html5: true,
    preload: true,
    onload: () => {
      ambientReady = true;
      console.log("[audio] ambient.mp3 cargado correctamente.");
    },
    onloaderror: (_id, err) => {
      console.warn("[audio] No se pudo cargar ./assets/audio/ambient.mp3", err);
      console.warn("[audio] Verifica que el archivo exista y se llame 'ambient.mp3'.");
    },
    onplayerror: () => {
      console.warn("[audio] Reproducción bloqueada, esperando gesto del usuario...");
      unlockAndPlay();
    },
  });

  const unlockAndPlay = async () => {
    if (unlocked) return;
    unlocked = true;

    if (Howler.ctx && Howler.ctx.state !== "running") {
      try { await Howler.ctx.resume(); } catch (e) { console.warn(e); }
    }

    if (!ambient || !ambientReady) {
      setTimeout(() => {
        if (ambient && ambientReady && !isOn) {
          try { ambient.play(); ambient.fade(0, 0.35, 2500); isOn = true; } catch (e) { console.warn(e); }
        }
      }, 500);
      return;
    }

    if (!isOn) {
      try {
        ambient.play();
        ambient.fade(0, 0.35, 2500);
        isOn = true;
      } catch (e) {
        console.warn("[audio] Error al reproducir:", e);
      }
    }
  };

  document.body.addEventListener("touchstart", unlockAndPlay, { passive: true, once: true });
  document.body.addEventListener("pointerdown", unlockAndPlay, { once: true });
  document.body.addEventListener("click", unlockAndPlay, { once: true });
  document.body.addEventListener("keydown", unlockAndPlay, { once: true });
}

export function toggleAudio() {
  if (!ambient) return false;
  isOn = !isOn;

  if (isOn) {
    if (Howler.ctx && Howler.ctx.state !== "running") {
      Howler.ctx.resume().catch(() => {});
    }
    if (!ambient.playing()) {
      try { ambient.play(); } catch (e) { console.warn(e); }
    }
    ambient.fade(ambient.volume(), 0.35, 600);
  } else {
    ambient.fade(ambient.volume(), 0, 400);
  }
  return isOn;
}

export function playAccept() {
  if (!Howl) return;
  try {
    const sfx = new Howl({
      src: ["./assets/audio/accept.mp3"],
      volume: 0.6,
      html5: false,
    });
    sfx.play();
  } catch { /* si no existe, ignora */ }
}