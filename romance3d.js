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

  /* ========== 4) صندوق الهدية 3D الحقيقي (Three.js WebGL) ========== */
  const giftBox = document.getElementById("gift3dContainer");
  const giftStage = document.getElementById("giftStage");
  if (giftBox && giftStage) {
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(dpr);
    giftBox.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    camera.position.set(0, 1.25, 4.4);
    camera.lookAt(0, 0, 0);

    // الإضاءة
    const amb = new THREE.AmbientLight(0xffe4ec, 0.85);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.25);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    const goldPt = new THREE.PointLight(0xf7d58a, 1.1, 10);
    goldPt.position.set(-2.5, 2, 2.5);
    scene.add(goldPt);
    const rimPt = new THREE.PointLight(0xff2a7a, 0.9, 10);
    rimPt.position.set(2.5, -0.5, -2.5);
    scene.add(rimPt);
    const innerPt = new THREE.PointLight(0xffd700, 0.1, 5);
    innerPt.position.set(0, 0.4, 0);
    scene.add(innerPt);

    // الخامات الفاخرة
    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x9e1236,
      roughness: 0.35,
      metalness: 0.14,
      emissive: 0x1a0208
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf6cb6a,
      roughness: 0.22,
      metalness: 0.82
    });
    const insideMat = new THREE.MeshStandardMaterial({
      color: 0x3d0312,
      roughness: 0.7,
      metalness: 0.05
    });

    // المجموعة الأساسية
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ظل الصندوق على الأرض بتدرج ناعم
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128; shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext("2d");
    const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    grad.addColorStop(0, "rgba(5, 1, 3, 0.75)");
    grad.addColorStop(0.5, "rgba(5, 1, 3, 0.35)");
    grad.addColorStop(1, "rgba(5, 1, 3, 0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.66;
    rootGroup.add(shadowMesh);

    // جسم الصندوق
    const bodyGroup = new THREE.Group();
    rootGroup.add(bodyGroup);
    const boxBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.4), velvetMat);
    bodyGroup.add(boxBase);
    const ribbonV1 = new THREE.Mesh(new THREE.BoxGeometry(1.41, 1.11, 0.24), goldMat);
    bodyGroup.add(ribbonV1);
    const ribbonV2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.11, 1.41), goldMat);
    bodyGroup.add(ribbonV2);
    const innerCavity = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.05, 1.28), insideMat);
    innerCavity.position.y = 0.53;
    bodyGroup.add(innerCavity);

    // غطاء الصندوق (Lid Group)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.56, 0);
    rootGroup.add(lidGroup);

    const lidCap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.5), velvetMat);
    lidCap.position.y = 0.11;
    lidGroup.add(lidCap);
    const lidRib1 = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.23, 0.24), goldMat);
    lidRib1.position.y = 0.11;
    lidGroup.add(lidRib1);
    const lidRib2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.23, 1.52), goldMat);
    lidRib2.position.y = 0.11;
    lidGroup.add(lidRib2);

    // الفيونكة الذهبية 3D
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.23, 0);
    lidGroup.add(bowGroup);

    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), goldMat);
    bowGroup.add(knot);

    const loopGeo = new THREE.TorusGeometry(0.19, 0.06, 12, 24, Math.PI * 1.55);
    const l1 = new THREE.Mesh(loopGeo, goldMat);
    l1.position.set(-0.16, 0.14, 0); l1.rotation.set(0.35, 0.75, 1.25);
    bowGroup.add(l1);
    const l2 = new THREE.Mesh(loopGeo, goldMat);
    l2.position.set(0.16, 0.14, 0); l2.rotation.set(0.35, -0.75, -1.25);
    bowGroup.add(l2);
    const l3 = new THREE.Mesh(loopGeo, goldMat);
    l3.position.set(0, 0.14, -0.16); l3.rotation.set(1.25, 0.75, 0.35);
    bowGroup.add(l3);
    const l4 = new THREE.Mesh(loopGeo, goldMat);
    l4.position.set(0, 0.14, 0.16); l4.rotation.set(-1.25, -0.75, -0.35);
    bowGroup.add(l4);

    const tailGeo = new THREE.BoxGeometry(0.12, 0.32, 0.02);
    const t1 = new THREE.Mesh(tailGeo, goldMat);
    t1.position.set(-0.14, -0.04, 0.18); t1.rotation.set(0.45, 0.2, -0.45);
    bowGroup.add(t1);
    const t2 = new THREE.Mesh(tailGeo, goldMat);
    t2.position.set(0.14, -0.04, 0.18); t2.rotation.set(0.45, -0.2, 0.45);
    bowGroup.add(t2);

    // المفاجأة داخل الصندوق (قلب 3D وكريستالات)
    const surpriseGroup = new THREE.Group();
    surpriseGroup.position.set(0, 0.3, 0);
    surpriseGroup.scale.setScalar(0.001);
    rootGroup.add(surpriseGroup);

    const hs = new THREE.Shape();
    hs.moveTo(0.25, 0.25);
    hs.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
    hs.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
    hs.bezierCurveTo(-0.3, 0.55, -0.15, 0.77, 0.25, 0.95);
    hs.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
    hs.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
    hs.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
    const hg = new THREE.ExtrudeGeometry(hs, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
      curveSegments: 16
    });
    hg.center(); hg.rotateZ(Math.PI); hg.scale(0.7, 0.7, 0.7);
    const surpriseHeart = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({
      color: 0xff1e56,
      roughness: 0.2,
      metalness: 0.25,
      emissive: 0x440011
    }));
    surpriseGroup.add(surpriseHeart);

    const sparkleGeo = new THREE.OctahedronGeometry(0.05, 0);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffea78 });
    const sparkles = [];
    for (let i = 0; i < 16; i++) {
      const sp = new THREE.Mesh(sparkleGeo, sparkleMat);
      sp.userData = {
        origX: (Math.random() - 0.5) * 0.8,
        origY: 0.3,
        origZ: (Math.random() - 0.5) * 0.8,
        targetY: 0.9 + Math.random() * 0.8,
        speed: 1.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        rad: 0.3 + Math.random() * 0.45
      };
      sp.scale.setScalar(0.001);
      rootGroup.add(sp);
      sparkles.push(sp);
    }

    // دالة الفتح والإغلاق الموحدة والمحمية من التكرار
    let lastToggle = 0;
    window.toggleGiftBox = function(force) {
      const now = Date.now();
      if (now - lastToggle < 300) return;
      lastToggle = now;

      const st = document.getElementById("giftStage");
      if (!st) return;
      const currentlyOpen = st.classList.contains("open");
      const open = (typeof force === "boolean") ? force : !currentlyOpen;

      if (open) {
        st.classList.add("open");
      } else {
        st.classList.remove("open");
      }

      const drawer = document.getElementById("lockedLettersContainer");
      if (drawer) {
        if (open) {
          drawer.classList.add("visible");
        } else {
          drawer.classList.remove("visible");
        }
      }

      const note = document.getElementById("giftNote");
      if (note) {
        note.textContent = open 
          ? "الجوابات ظهرت ليكي تحت 💌 اختاري الجواب واقريه (اضغطي لقفل الهدية)" 
          : "دوسي على الهدية عشان تتفتح والجوابات تظهر 🎁";
      }

      if (open && typeof confetti !== "undefined") {
        const b = st.getBoundingClientRect();
        const sList = (typeof getShapes === "function") ? getShapes(["❤️", "🌹"]) : null;
        const gOpts = {
          particleCount: 75,
          spread: 85,
          startVelocity: 34,
          gravity: 0.8,
          scalar: 1.7,
          zIndex: 600,
          origin: { x: (b.left + b.width / 2) / innerWidth, y: (b.top + 50) / innerHeight }
        };
        if (sList) gOpts.shapes = sList;
        confetti(gOpts);

        setTimeout(() => {
          const target = document.getElementById("lockedLettersContainer") || document.getElementById("lockedLettersList");
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 650);
      }

      return open;
    };

    // تفاعل التدوير والضغط باللمس والماوس
    let lidProgress = 0;
    let rotY = 0.5, rotX = 0.22;
    let velY = 0, velX = 0;
    let isDragging = false, hasDragged = false, startX = 0, startY = 0, lastX = 0, lastY = 0, dragDist = 0;

    const canvas = renderer.domElement;

    canvas.addEventListener("pointerdown", e => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      lastX = e.clientX; lastY = e.clientY;
      dragDist = 0;
      hasDragged = false;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener("pointermove", e => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dragDist += Math.hypot(dx, dy);
      if (dragDist > 6) {
        hasDragged = true;
      }
      velY = dx * 0.012;
      velX = dy * 0.008;
      rotY += velY;
      rotX += velX;
      rotX = Math.max(-0.45, Math.min(0.65, rotX));
      lastX = e.clientX;
      lastY = e.clientY;
    });

    const onPointerUp = e => {
      if (!isDragging) return;
      isDragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!hasDragged) {
        window.toggleGiftBox();
      }
    };
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", () => { isDragging = false; });

    // منع ارتداد حدث click الأصلي لمنع التكرار
    canvas.addEventListener("click", e => {
      e.stopPropagation();
      e.preventDefault();
    }, true);

    giftStage.addEventListener("click", e => {
      if (e.target !== canvas) {
        window.toggleGiftBox();
      }
    });

    const giftNote = document.getElementById("giftNote");
    if (giftNote) {
      giftNote.addEventListener("click", () => window.toggleGiftBox());
    }

    let lastW = 0, lastH = 0;
    function fitGift() {
      const w = giftBox.clientWidth || 300;
      const h = giftBox.clientHeight || 250;
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        lastW = w; lastH = h;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
    fitGift();
    window.addEventListener("resize", fitGift);

    const giftClock = new THREE.Clock();

    (function giftLoop() {
      requestAnimationFrame(giftLoop);
      if (document.hidden || !giftStage.offsetParent) return;

      fitGift();

      const t = giftClock.getElapsedTime();
      const isOpen = giftStage.classList.contains("open");
      const targetLid = isOpen ? 1 : 0;
      lidProgress += (targetLid - lidProgress) * (isOpen ? 0.12 : 0.16);

      if (!isDragging) {
        velY *= 0.94;
        velX *= 0.94;
        rotY += velY;
        rotX += velX;
        if (Math.abs(velY) < 0.0005) {
          rotY += 0.0025;
        }
      }

      const floatY = reduce ? 0 : Math.sin(t * 2.2) * 0.04;
      rootGroup.position.y = floatY;
      rootGroup.rotation.y = rotY;
      rootGroup.rotation.x = rotX;

      // حركة الغطاء 3D
      lidGroup.position.y = 0.56 + lidProgress * 0.85;
      lidGroup.position.z = -lidProgress * 0.45;
      lidGroup.rotation.x = -lidProgress * 0.72;
      lidGroup.rotation.z = lidProgress * 0.14;

      // الإضاءة الداخلية
      innerPt.intensity = 0.1 + lidProgress * 2.4;

      // القلب المفاجئ
      surpriseGroup.scale.setScalar(Math.max(0.001, lidProgress));
      surpriseGroup.position.y = 0.3 + lidProgress * 0.75 + Math.sin(t * 3.5) * 0.06;
      surpriseGroup.rotation.y = t * 1.5;
      surpriseHeart.scale.setScalar(1 + 0.08 * Math.sin(t * 4));

      // الكريستالات المتطايرة
      sparkles.forEach((sp, idx) => {
        const u = sp.userData;
        if (lidProgress > 0.15) {
          sp.scale.setScalar(lidProgress * (0.8 + 0.3 * Math.sin(t * u.speed + u.phase)));
          sp.position.y = u.origY + lidProgress * (u.targetY - u.origY) + Math.sin(t * 2 + idx) * 0.08;
          sp.position.x = Math.sin(t * u.speed + u.phase) * u.rad;
          sp.position.z = Math.cos(t * u.speed + u.phase) * u.rad;
          sp.rotation.x += 0.03;
          sp.rotation.y += 0.04;
        } else {
          sp.scale.setScalar(0.001);
        }
      });

      shadowMesh.scale.setScalar(1 - floatY * 0.8);
      shadowMat.opacity = 0.5 - floatY * 0.2;

      renderer.render(scene, camera);
    })();
  }

})();
