// مشهد 3D محسّن للأداء العالي وسرعة التصفح على الموبايل (Three.js)
(function () {
  if (typeof THREE === "undefined") return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.innerWidth < 768;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.75);

  /* ========== 1) القلب ثلاثي الأبعاد ========== */
  const box = document.getElementById("heart3dHero");
  if (box) {
    const r = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(dpr);
    box.appendChild(r.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    cam.position.set(0, 0, 4.2);

    const s = new THREE.Shape();
    s.moveTo(0.25, 0.25);
    s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
    s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
    s.bezierCurveTo(-0.3, 0.55, -0.15, 0.77, 0.25, 0.95);
    s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
    s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
    s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.14,
      bevelSegments: isMobile ? 4 : 8,
      curveSegments: isMobile ? 16 : 28
    });
    g.center(); g.rotateZ(Math.PI); g.scale(1.55, 1.55, 1.55);
    const heart = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: 0xe0234f, roughness: 0.22, metalness: 0.12, emissive: 0x220008
    }));
    scene.add(heart);

    scene.add(new THREE.AmbientLight(0xffb3c6, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(2, 3, 4); scene.add(key);
    const gold = new THREE.PointLight(0xf3cf9a, 1.0, 10); gold.position.set(-3, -1, 3); scene.add(gold);
    const rim = new THREE.PointLight(0xff4f8b, 1.2, 10); rim.position.set(3, 1, -3); scene.add(rim);

    function fit() {
      const w = box.clientWidth || 230;
      const h = box.clientHeight || 210;
      r.setSize(w, h);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    fit();
    window.addEventListener("resize", fit);

    let drag = false, lastX = 0, spin = 0, vel = 0;
    box.addEventListener("pointerdown", e => { drag = true; lastX = e.clientX; box.style.cursor = "grabbing"; });
    window.addEventListener("pointerup", () => { drag = false; box.style.cursor = "grab"; });
    window.addEventListener("pointermove", e => { if (drag) { vel = (e.clientX - lastX) * 0.012; spin += vel; lastX = e.clientX; } });

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (document.hidden) return; // توفير الطاقة عند قفل الشاشة أو التحويل بين التطبيقات
      const t = clock.getElapsedTime();
      const beat = reduce ? 1 : 1 + 0.06 * Math.max(0, Math.sin(t * 3.4)) + 0.03 * Math.max(0, Math.sin(t * 6.8 - 1));
      heart.scale.setScalar(beat);
      if (!drag) { vel *= 0.95; spin += vel; }
      heart.rotation.y = (reduce ? 0.35 : Math.sin(t * 0.7) * 0.55) + spin;
      heart.rotation.x = reduce ? 0 : Math.sin(t * 0.9) * 0.08;
      heart.position.y = reduce ? 0 : Math.sin(t * 1.3) * 0.06;
      rim.position.x = Math.cos(t * 0.8) * 3; gold.position.y = Math.sin(t * 0.6) * 2;
      r.render(scene, cam);
    })();
  }

  /* ========== 2) بتلات الورد في الخلفية ========== */
  const cv = document.createElement("canvas");
  cv.id = "scene3d"; document.body.prepend(cv);
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: "low-power" });
  R.setPixelRatio(isMobile ? 1.0 : Math.min(dpr, 1.25));
  const S = new THREE.Scene();
  const C = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  C.position.z = 12;
  S.add(new THREE.AmbientLight(0xffd0dc, 0.85));
  const L = new THREE.DirectionalLight(0xffffff, 0.9); L.position.set(3, 5, 6); S.add(L);

  const p = new THREE.Shape();
  p.moveTo(0, 0); p.bezierCurveTo(0.55, 0.15, 0.7, 0.95, 0, 1.25); p.bezierCurveTo(-0.7, 0.95, -0.55, 0.15, 0, 0);
  const pg = new THREE.ShapeGeometry(p, isMobile ? 8 : 12);
  const pos = pg.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getX(i) ** 2 * 0.9 + pos.getY(i) * 0.12);
  pg.computeVertexNormals();

  const cols = [0xff4f7b, 0xe0245e, 0xff8fab, 0xc2185b, 0xffb3c6, 0xf3cf9a];
  const N = reduce ? 8 : (isMobile ? 12 : 24);
  const petals = [];
  const spanX = () => 7 * (window.innerWidth / window.innerHeight);
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    const sc = 0.35 + Math.random() * 0.45;
    m.scale.setScalar(sc);
    m.position.set((Math.random() * 2 - 1) * spanX(), Math.random() * 18 - 9, Math.random() * 8 - 5);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.userData = { fall: 0.008 + Math.random() * 0.014, sway: Math.random() * 6, rx: (Math.random() - 0.5) * 0.02, ry: (Math.random() - 0.5) * 0.025, rz: (Math.random() - 0.5) * 0.015 };
    S.add(m); petals.push(m);
  }
  function fitBg() { R.setSize(innerWidth, innerHeight, false); C.aspect = innerWidth / innerHeight; C.updateProjectionMatrix(); }
  fitBg(); window.addEventListener("resize", fitBg);

  let px = 0;
  window.addEventListener("pointermove", e => { px = (e.clientX / innerWidth - 0.5) * 2; });
  (function bgLoop() {
    requestAnimationFrame(bgLoop);
    if (document.hidden) return;
    petals.forEach(m => {
      const d = m.userData;
      if (!reduce) {
        m.position.y -= d.fall; d.sway += 0.012;
        m.position.x += Math.sin(d.sway) * 0.006;
        m.rotation.x += d.rx; m.rotation.y += d.ry; m.rotation.z += d.rz;
      }
      if (m.position.y < -9) { m.position.y = 9; m.position.x = (Math.random() * 2 - 1) * spanX(); }
    });
    C.position.x += (px * 0.6 - C.position.x) * 0.03;
    R.render(S, C);
  })();

  /* ========== 3) ميلان 3D للكروت مع الماوس ========== */
  if (!reduce && window.matchMedia("(hover:hover)").matches) {
    document.addEventListener("pointermove", e => {
      const el = e.target.closest && e.target.closest(".love-card, .voice-card");
      document.querySelectorAll(".love-card[data-tilt], .voice-card[data-tilt]").forEach(c => {
        if (c !== el) { c.style.transform = ""; c.removeAttribute("data-tilt"); }
      });
      if (!el) return;
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      el.setAttribute("data-tilt", "1");
      el.style.transform = `rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
    });
  }
})();
