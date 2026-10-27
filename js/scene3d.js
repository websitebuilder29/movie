import * as THREE from "three";

let scene, camera, renderer, embers, ash, eyes, rider, clock;
let px = 0, py = 0;
let pulse = 1;
let rafId = null;
let lightningIntensity = 0;
let ambientLightRef = null;

export function initScene3D(canvas) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0504, 0.06);

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.8, 9);
  camera.lookAt(0, 0, 0);

  clock = new THREE.Clock();

  // Brasas rojas flotando
  createEmbers(isMobile ? 400 : 900);

  // Ceniza gris
  createAsh(isMobile ? 600 : 1500);

  // Ojos rojos del Charro
  createDistantEyes();

  // Silueta de jinete lejana
  createDistantRider();

  // Luces
  const moonLight = new THREE.DirectionalLight(0x667799, 0.25);
  moonLight.position.set(-8, 6, 2);
  scene.add(moonLight);

  const hellGlow = new THREE.PointLight(0x8b1a1a, 2.5, 20, 2);
  hellGlow.position.set(0, -2, 2);
  scene.add(hellGlow);

  const charroGlow = new THREE.PointLight(0x4a0a0a, 1.2, 18, 2);
  charroGlow.position.set(-4, 0, -8);
  scene.add(charroGlow);

  ambientLightRef = new THREE.AmbientLight(0x0a0504, 1.2);
  scene.add(ambientLightRef);

  window.addEventListener("resize", onResize);
  animate();

  return { scene, camera, renderer };
}

function createEmbers(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const emberRed = new THREE.Color(0x8b1a1a);
  const emberBright = new THREE.Color(0xc0392b);
  const emberOrange = new THREE.Color(0xd4641e);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = -4 + Math.random() * 12;
    positions[i * 3 + 2] = -10 + Math.random() * 20;

    const t = Math.random();
    const c = t < 0.5 ? emberRed : t < 0.8 ? emberBright : emberOrange;
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  embers = new THREE.Points(geometry, material);
  scene.add(embers);
}

function createAsh(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = -15 + Math.random() * 25;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x5a4a3a,
    size: 0.06,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    sizeAttenuation: true,
  });

  ash = new THREE.Points(geometry, material);
  scene.add(ash);
}

function createDistantEyes() {
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xff2200,
    transparent: true,
    opacity: 0.0,
  });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
  leftEye.position.set(-4.5, 0.8, -9);
  rightEye.position.set(-3.8, 0.8, -9);

  scene.add(leftEye, rightEye);
  eyes = { left: leftEye, right: rightEye };
}

function createDistantRider() {
  const riderGroup = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.2, 8);
  const bodyMat = new THREE.MeshBasicMaterial({
    color: 0x0a0504,
    transparent: true,
    opacity: 0.0,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  riderGroup.add(body);

  const hatGeo = new THREE.ConeGeometry(0.35, 0.3, 8);
  const hat = new THREE.Mesh(hatGeo, bodyMat.clone());
  hat.position.y = 1.35;
  riderGroup.add(hat);

  riderGroup.position.set(6, -1.5, -12);
  scene.add(riderGroup);
  rider = { group: riderGroup, bodyMat, hatMat: hat.material };
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  const cs = getComputedStyle(document.documentElement);
  const mx = parseFloat(cs.getPropertyValue("--mx")) || 0;
  const my = parseFloat(cs.getPropertyValue("--my")) || 0;
  px += (mx - px) * 0.03;
  py += (my - py) * 0.03;

  camera.position.x = px * 0.5;
  camera.position.y = 0.8 - py * 0.3;
  camera.lookAt(0, 0, 0);

  if (embers) {
    embers.rotation.y = t * 0.01;
    const pos = embers.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      y += 0.003;
      if (y > 8) y = -4;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  if (ash) {
    ash.rotation.y = -t * 0.005;
    const pos = ash.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i);
      y -= 0.0015;
      if (y < -7) y = 8;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  if (eyes) {
    const cycle = (Math.sin(t * 0.15) + 1) / 2;
    const blink = Math.sin(t * 8) > 0.95 ? 0.0 : 1.0;
    const opacity = cycle > 0.6 ? (cycle - 0.6) * 2.5 * blink : 0;
    eyes.left.material.opacity = Math.min(opacity, 0.9);
    eyes.right.material.opacity = Math.min(opacity, 0.9);
  }

  if (rider) {
    const riderCycle = (Math.sin(t * 0.08) + 1) / 2;
    const riderOpacity = riderCycle > 0.7 ? (riderCycle - 0.7) * 1.5 : 0;
    rider.bodyMat.opacity = Math.min(riderOpacity, 0.5);
    rider.hatMat.opacity = Math.min(riderOpacity, 0.5);
  }

  // Relámpago
  if (lightningIntensity > 0) {
    lightningIntensity -= 0.04;
    if (lightningIntensity < 0) lightningIntensity = 0;
    if (ambientLightRef) {
      ambientLightRef.intensity = 1.2 + lightningIntensity * 4;
      ambientLightRef.color.setHex(lightningIntensity > 0.3 ? 0x5a1a1a : 0x0a0504);
    }
  }

  // Respiración lenta del ambiente
  const breath = 1 + Math.sin(t * 0.4) * 0.008;
  pulse += (breath - pulse) * 0.02;
  scene.scale.setScalar(pulse);

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function pulseScene(intensity = 1) {
  pulse = 1 + 0.12 * intensity;
}

export function triggerLightning() {
  lightningIntensity = 1.0;
}