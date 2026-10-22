// إضافات: وردة افتتاحية 3D، سماء النجوم، صندوق الهدية، خريطة المسافة، رسالة يومية، قلوب اللمس
(function () {
  const $ = id => document.getElementById(id);
  const D = () => (typeof appData !== "undefined" && appData) ? appData : (window.DEFAULT_APP_DATA || { settings: {}, timeline: [] });
  const S = () => D().settings || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Safe shape generator for confetti (handles any version of canvas-confetti)
  const getShapes = (chars) => {
    if (typeof confetti !== "undefined" && typeof confetti.shapeFromText === "function") {
      try {
        return chars.map(c => confetti.shapeFromText({ text: c, scalar: 2 }));
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  };

  /* ---------- 1) قلوب وبتلات من اللمس ---------- */
  function touchHearts() {
    if (typeof confetti === "undefined" || reduce) return;
    const shapes = getShapes(["❤️", "🌹", "💗"]);
    let last = 0;
    document.addEventListener("pointerdown", e => {
      if (e.target.closest("input,textarea,select,audio,.admin-card")) return;
      const n = Date.now(); if (n - last < 140) return; last = n;
      const opts = { particleCount: 6, spread: 70, startVelocity: 16, gravity: 0.65, scalar: 1.5, ticks: 80, zIndex: 600,
        origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight } };
      if (shapes) opts.shapes = shapes;
      confetti(opts);
    }, { passive: true });
  }

  /* ---------- 2) الوردة الافتتاحية ---------- */
  function rose() {
    const root = $("introScreen"); if (!root) return;
    if (sessionStorage.getItem("rose_seen") || typeof THREE === "undefined") { root.remove(); return; }
    const box = $("roseBox"), cap = $("introCaption"), hint = $("introHint"), msg = $("introMsg"), enter = $("introEnter");
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); box.appendChild(r.domElement);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, .1, 50);
    cam.position.set(0, 2.3, 5.0); cam.lookAt(0, 0.25, 0);
    sc.add(new THREE.AmbientLight(0xffc0d0, .85));
    const k = new THREE.DirectionalLight(0xffffff, 1.3); k.position.set(2, 5, 4); sc.add(k);
    const g1 = new THREE.PointLight(0xf3cf9a, 1.3, 12); g1.position.set(-3, 1, 3); sc.add(g1);
    const topL = new THREE.PointLight(0xffd6e1, 1.6, 10); topL.position.set(0, 3.5, 2.5); sc.add(topL);

    const p = new THREE.Shape(); p.moveTo(0, 0); p.bezierCurveTo(.6, .15, .75, .95, 0, 1.25); p.bezierCurveTo(-.75, .95, -.6, .15, 0, 0);
    const pg = new THREE.ShapeGeometry(p, 14), pp = pg.attributes.position;
    for (let i = 0; i < pp.count; i++) pp.setZ(i, -(pp.getX(i) ** 2) * .8); pg.computeVertexNormals();

    const roseG = new THREE.Group(); sc.add(roseG);
    const cols = [0x6e0a28, 0xa31238, 0xc81e4d, 0xe0385f, 0xff5d86], counts = [3, 5, 6, 7, 8], rings = [];
    cols.forEach((c, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: .45, metalness: .05 });
      const ring = { holds: [], closed: .05 + i * .045, open: .48 + i * .18, cur: .05 + i * .045 };
      for (let j = 0; j < counts[i]; j++) {
        const pivot = new THREE.Object3D(); pivot.rotation.y = j / counts[i] * Math.PI * 2 + i * .55; pivot.position.y = -i * .04;
        const hold = new THREE.Object3D(); hold.position.z = .04 + i * .065;
        const m = new THREE.Mesh(pg, mat); m.scale.setScalar(.5 + i * .11); hold.add(m); pivot.add(hold); roseG.add(pivot); ring.holds.push(hold);
      }
      rings.push(ring);
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: .6 }));
    stem.position.y = -1.25; roseG.add(stem);
    [[1, .5], [-1, .15]].forEach(([d, y]) => {
      const l = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: .55 }));
      l.scale.set(1.5, .12, .65); l.position.set(d * .34, -1.2 - y, 0); l.rotation.z = d * .5; roseG.add(l);
    });
    roseG.position.y = .4;

    function fit() { const w = box.clientWidth, h = box.clientHeight; r.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    fit(); addEventListener("resize", fit);

    const caps = ["بتلة ضحكتك 😊", "بتلة طيبتك 🤍", "بتلة شطارتك 🎓", "بتلة دلعك 🥰", "وبتلة إنتي كلك 🌹"];
    let opened = 0, alive = true;
    function openMsg() {
      const nm = S().yaraName || "يارا";
      msg.textContent = `كل بتلة فيها حاجة بحبها فيكي يا ${nm}.. ومهما بعدت المسافة هتفضلي وردة قلبي اللي مبتدبلش أبداً.`;
      msg.classList.add("show"); hint.style.display = "none"; enter.style.display = "inline-flex";
      if (typeof confetti !== "undefined") {
        const sList = getShapes(["🌹", "❤️"]);
        const cOpts = { particleCount: 90, spread: 100, origin: { y: .5 }, zIndex: 600, scalar: 2 };
        if (sList) cOpts.shapes = sList;
        confetti(cOpts);
      }
    }
    box.addEventListener("click", () => {
      if (opened >= 5) return;
      cap.textContent = caps[opened]; opened++;
      hint.textContent = opened < 5 ? `كمّلي.. فاضل ${5 - opened}` : "";
      if (opened === 5) setTimeout(openMsg, 1100);
    });
    function leave() {
      sessionStorage.setItem("rose_seen", "1"); root.classList.add("leaving");
      setTimeout(() => { alive = false; r.dispose(); root.remove(); }, 950);
    }
    enter.addEventListener("click", leave); $("introSkip").addEventListener("click", leave);

    const clk = new THREE.Clock();
    (function loop() {
      if (!alive) return; requestAnimationFrame(loop);
      const t = clk.getElapsedTime();
      rings.forEach((ring, i) => {
        const target = (4 - i) < opened ? ring.open : ring.closed;
        ring.cur += (target - ring.cur) * .07;
        ring.holds.forEach(h => h.rotation.x = ring.cur);
      });
      // ميل الوردة للأمام بزاوية مريحة لرؤية البتلات بوضوح وهي بتتفتح من فوق
      roseG.rotation.x = 0.52 + (reduce ? 0 : Math.sin(t * 0.8) * 0.03);
      roseG.rotation.y = reduce ? 0.15 : t * .32;
      roseG.rotation.z = -0.08 + (reduce ? 0 : Math.cos(t * 0.7) * 0.02);
      roseG.position.y = .32 + (reduce ? 0 : Math.sin(t * 1.2) * .03);
      r.render(sc, cam);
    })();
  }

  /* ---------- 3) سماء النجوم ---------- */
  function sky() {
    const cv = $("skyCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"); let W, H, bg = [], name = [], mem = [], shoot = null;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    function rnd(seed) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }
    function build() {
      const r = cv.getBoundingClientRect(); if (!r.width) return;
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg = Array.from({ length: 80 }, (_, i) => ({ x: rnd(i + 1) * W, y: rnd(i + 200) * H, r: rnd(i + 400) * 1.1 + .3, p: rnd(i + 600) * 6 }));
      // اسمها بالنجوم
      const off = document.createElement("canvas"); off.width = 260; off.height = 110; const o = off.getContext("2d");
      o.fillStyle = "#fff"; o.font = '700 92px "Aref Ruqaa", serif'; o.textAlign = "center"; o.textBaseline = "middle"; o.direction = "rtl";
      o.fillText(S().yaraName || "يارا", 130, 58);
      const d = o.getImageData(0, 0, 260, 110).data; name = [];
      for (let y = 0; y < 110; y += 4) for (let x = 0; x < 260; x += 4) if (d[(y * 260 + x) * 4 + 3] > 140)
        name.push({ x: W / 2 + (x - 130) * Math.min(1, W / 300), y: 30 + y * .9, p: Math.random() * 6 });
      // نجوم الذكريات
      const items = [...document.querySelectorAll("#timelineItemsContainer .timeline-item")]; const n = items.length;
      mem = items.map((el, i) => ({
        el, x: W * (.14 + .72 * (n < 2 ? .5 : (i / (n - 1)))) + (rnd(i + 9) - .5) * 24,
        y: H * (.62 + .22 * Math.sin(i * 1.9 + 1)), p: i,
        title: (el.querySelector(".timeline-title") || {}).textContent || ""
      }));
    }
    function draw(t) {
      requestAnimationFrame(draw);
      if (document.hidden) return;
      if (!W) { build(); return; }
      const rect = cv.getBoundingClientRect();
      if (rect.width === 0 || rect.bottom < -20 || rect.top > window.innerHeight + 20) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      bg.forEach(s => { ctx.globalAlpha = .35 + .5 * Math.abs(Math.sin(t / 900 + s.p)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); });
      name.forEach(s => { ctx.globalAlpha = .65 + .35 * Math.sin(t / 600 + s.p); ctx.fillStyle = "#ffd6e1"; ctx.beginPath(); ctx.arc(s.x, s.y, 1.3, 0, 7); ctx.fill(); });
      ctx.globalAlpha = .5; ctx.strokeStyle = "#f3cf9a"; ctx.setLineDash([4, 5]); ctx.beginPath();
      mem.forEach((m, i) => i ? ctx.lineTo(m.x, m.y) : ctx.moveTo(m.x, m.y)); ctx.stroke(); ctx.setLineDash([]);
      mem.forEach(m => {
        const pulse = 1 + .18 * Math.sin(t / 500 + m.p), g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 26 * pulse);
        g.addColorStop(0, "rgba(255,230,170,.95)"); g.addColorStop(1, "rgba(255,200,120,0)");
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, 26 * pulse, 0, 7); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "16px serif"; ctx.textAlign = "center"; ctx.fillText("✦", m.x, m.y + 6);
      });
      if (!shoot && !reduce && Math.random() < .004) shoot = { x: W * Math.random(), y: 10, life: 0 };
      if (shoot) { shoot.x -= 6; shoot.y += 3.2; shoot.life++; ctx.globalAlpha = 1 - shoot.life / 40; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x + 28, shoot.y - 15); ctx.stroke(); ctx.lineWidth = 1; if (shoot.life > 40) shoot = null; }
      ctx.globalAlpha = 1;
    }
    cv.addEventListener("click", e => {
      const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      let best = null, bd = 34; mem.forEach(m => { const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } });
      if (best) best.el.click();
    });
    new ResizeObserver(build).observe(cv);
    new MutationObserver(() => setTimeout(build, 50)).observe($("timelineItemsContainer"), { childList: true });
    (document.fonts && document.fonts.ready || Promise.resolve()).then(build);
    requestAnimationFrame(draw);
  }

  /* ---------- 4) صندوق الهدية ---------- */
  function gift() {
    const st = $("giftStage"); if (!st) return;
    st.addEventListener("click", () => {
      if (typeof window.toggleGiftBox === "function") {
        window.toggleGiftBox();
      }
    });
  }

  /* ---------- 5) خريطة المسافة (حركة ديناميكية بحسب تقدم الأيام) ---------- */
  function distance() {
    if (!$("distDays")) return;
    const arc = $("loveArc"), traveled = $("traveledArc"), marker = $("distMarker"), pctText = $("distPercentText");
    let currentP = 0, targetP = 0, animFrame = null;

    function updateSvg(p) {
      if (!arc) return;
      const len = arc.getTotalLength();
      if (traveled) {
        traveled.style.strokeDasharray = `${len}`;
        traveled.style.strokeDashoffset = `${len * (1 - p)}`;
      }
      if (marker) {
        const pt = arc.getPointAtLength(len * p);
        marker.setAttribute("transform", `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
      }
      if (pctText) {
        pctText.textContent = `${Math.round(p * 100)}%`;
      }
    }

    function renderProgress() {
      currentP += (targetP - currentP) * 0.06;
      if (Math.abs(targetP - currentP) < 0.001) currentP = targetP;
      updateSvg(currentP);
      if (currentP !== targetP) {
        animFrame = requestAnimationFrame(renderProgress);
      }
    }

    function tick() {
      const s = S();
      const targetDate = new Date(s.armyLeaveDate).getTime();
      const startDate = new Date(s.armyStartDate || "2026-10-15T00:00:00").getTime();
      const now = Date.now();
      const totalTime = Math.max(86400000, targetDate - startDate);
      const elapsed = Math.max(0, now - startDate);
      targetP = Math.min(1, Math.max(0, elapsed / totalTime));

      const percent = Math.round(targetP * 100);
      const daysLeft = Math.max(0, Math.ceil((targetDate - now) / 86400000));
      const daysPassed = Math.max(0, Math.floor(elapsed / 86400000));

      const meName = (typeof getPartnerDisplayTitle === "function") ? getPartnerDisplayTitle() : (s.partnerName || "زيزو");
      if ($("distMe")) $("distMe").textContent = meName;
      if ($("distYara")) $("distYara").textContent = s.yaraName || "يارا";

      if ($("distDays")) {
        if (daysLeft > 0) {
          $("distDays").textContent = `باقي ${daysLeft} يوم على حضنك ❤️ (عدى ${daysPassed} يوم)`;
        } else {
          $("distDays").textContent = "🎉 المسافة خلصت وزيزو معاكي دلوقتي!";
        }
      }

      if ($("distSub")) {
        if (daysLeft > 0) {
          $("distSub").textContent = `قطعنا ${percent}% من مسافة الطريق ليكي.. كل يوم بيقربنا خطوة ✨`;
        } else {
          $("distSub").textContent = "100% تم الوصول بنجاح لحضن يارا ❤️";
        }
      }

      cancelAnimationFrame(animFrame);
      renderProgress();
    }

    tick();
    setInterval(tick, 60000);
  }

  /* ---------- 6) الرسالة اليومية ---------- */
  const NOTES = [
    "صباح الخير يا لالا ☀️ قومي بنشاط، النهاردة يوم جديد وأنا فخور بيكي من الصبح.",
    "افتكري إن كل يوم بيعدي هو يوم أقرب لحضني.. وأنا بعده يوم يوم عشانك.",
    "ذاكري النهاردة براحة وبحب، وأنا واثق إن ربنا هيكرمك على قد تعبك.",
    "لو حسيتي بزهق النهاردة، افتكري إني بتمسك بضحكتك كل ما الطابور يطول.",
    "اشربي ماية وكلي كويس، صحتك عندي أهم من أي حاجة في الدنيا. 💧",
    "في حد في الكتيبة بيحكي عنك لكل اللي حواليه.. وبيقول 'دي أحلى وأشطر حاجة في حياتي' بكل فخر.",
    "النهاردة أنا مش عاوز منك حاجة غير إنك تبتسمي.. الباقي عليا.",
    "إنتي أحلى حاجة حصلت في حياتي، ومفيش مسافة هتغير ده.",
    "خدي بريك النهاردة واعملي حاجة بتحبيها.. تعبك بيتشاف وأنا شايفه.",
    "كل ما أفتكر ضحكتك الدنيا بتهون عليا.. فمتبطليش تضحكي النهاردة.",
    "اطمني، أنا بخير وبفكر فيكي، وبدعي لك كل يوم قبل ما أنام. 🌙",
    "النهاردة قولي لنفسك قدام المراية: أنا قدها. وأنا بقولهالك معاكي.",
    "لسه فاكر أول مرة ضحكتي فيها.. وأنا لحد النهاردة بتسلى بالفكرة دي.",
    "بحبك النهاردة أكتر من إمبارح، وأقل من بكرة. وده وعد.",
  ];
  function daily() {
    const env = $("dailyEnv"); if (!env) return;
    const d = new Date(), key = d.toISOString().slice(0, 10), list = (D().dailyNotes && D().dailyNotes.length) ? D().dailyNotes : NOTES;
    const idx = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5) % list.length;
    $("dailyText").textContent = list[idx];
    $("dailyDate").textContent = d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
    const seen = localStorage.getItem("yara_daily_opened") === key;
    if (seen) env.classList.add("open");
    env.addEventListener("click", () => {
      if (env.classList.contains("open")) return;
      env.classList.add("open"); localStorage.setItem("yara_daily_opened", key);
      if (typeof confetti !== "undefined") {
        const sList = getShapes(["💗"]);
        const dOpts = { particleCount: 30, spread: 60, scalar: 1.4, zIndex: 600 };
        if (sList) dOpts.shapes = sList;
        confetti(dOpts);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(() => { touchHearts(); rose(); sky(); gift(); distance(); daily(); }, 0));
})();
