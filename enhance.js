(function () {
  if (window.__vzDone) return true;
  var r = document.getElementById('radio');
  if (!r) return false;
  window.__vzDone = true;

  var css = [
    'html,body{background:#04061a!important}#radio{background:transparent!important;color:#f5ecf3!important;padding:28px 18px 44px!important;box-sizing:border-box!important;min-height:100vh!important;text-align:center}',
    '#radio h1:not(.cstrEmbed h1),#radio h2:not(.cstrEmbed h2),#radio h3:not(.cstrEmbed h3),#radio p:not(.cstrEmbed p),#radio li:not(.cstrEmbed li),#radio strong:not(.cstrEmbed strong){color:#f5ecf3!important}',
    '#radio h2:not(.cstrEmbed h2){font-size:28px!important;letter-spacing:.01em;margin:6px 0 10px!important}',
    '#radio .cstrEmbed{margin:18px auto!important;max-width:480px;border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 10px 40px rgba(232,30,77,.35),0 0 70px rgba(120,90,255,.25)}','#radio h2:not(.cstrEmbed h2){text-shadow:0 0 18px rgba(255,200,220,.55),0 0 40px rgba(232,30,77,.35)}','#radio p:not(.cstrEmbed p){opacity:.92}',
                      ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var anc = r.parentNode;
  while (anc && anc !== document.documentElement) {
    anc.style.setProperty('background', 'transparent', 'important');
    anc = anc.parentNode;
  }

  var sky = document.createElement('canvas');
  sky.id = 'sky-bg';
  sky.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:-1;pointer-events:none;display:block';
  document.body.insertBefore(sky, document.body.firstChild);
  var sx = sky.getContext('2d');
  var SW = 0, SH = 0, sdpr = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [], shooters = [], nextShot = 1.2, lastT = 0;
  var starCols = ['#ffffff', '#ffffff', '#ffe9c4', '#cfe0ff'];

  function buildSky() {
    SW = window.innerWidth; SH = window.innerHeight;
    sky.width = Math.round(SW * sdpr); sky.height = Math.round(SH * sdpr);
    sx.setTransform(sdpr, 0, 0, sdpr, 0, 0);
    stars = [];
    var n = Math.round(Math.min(160, (SW * SH) / 4200));
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * SW, y: Math.random() * SH * 0.92,
        r: 0.4 + Math.random() * 1.2,
        ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.8,
        c: starCols[Math.floor(Math.random() * starCols.length)]
      });
    }
  }
  buildSky();
  window.addEventListener('resize', buildSky);

  function skyFrame(ms) {
    var t = ms / 1000, dt = Math.min(0.05, t - lastT); lastT = t;
    var g = sx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#04061a');
    g.addColorStop(0.55, '#12103a');
    g.addColorStop(1, '#3a1245');
    sx.globalAlpha = 1;
    sx.fillStyle = g;
    sx.fillRect(0, 0, SW, SH);

    var hz = sx.createRadialGradient(SW / 2, SH * 1.05, 0, SW / 2, SH * 1.05, SH * 0.7);
    hz.addColorStop(0, 'rgba(232,30,77,0.30)');
    hz.addColorStop(1, 'rgba(232,30,77,0)');
    sx.fillStyle = hz;
    sx.fillRect(0, 0, SW, SH);

    sx.save();
    sx.shadowColor = 'rgba(255,240,200,0.75)';
    sx.shadowBlur = 34;
    sx.fillStyle = '#fff6dc';
    sx.beginPath();
    sx.arc(SW * 0.82, SH * 0.1, 17, 0, 6.2832);
    sx.fill();
    sx.restore();

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      sx.fillStyle = s.c;
      sx.globalAlpha = a;
      sx.beginPath(); sx.arc(s.x, s.y, s.r, 0, 6.2832); sx.fill();
      if (s.r > 1.1) {
        sx.globalAlpha = a * 0.15;
        sx.beginPath(); sx.arc(s.x, s.y, s.r * 3.2, 0, 6.2832); sx.fill();
      }
    }
    sx.globalAlpha = 1;

    if (t > nextShot) {
      shooters.push({
        x: SW * 0.15 + Math.random() * SW * 0.85, y: Math.random() * SH * 0.35,
        vx: -(380 + Math.random() * 240), vy: 190 + Math.random() * 130,
        life: 0, max: 0.9 + Math.random() * 0.5
      });
      nextShot = t + 1.8 + Math.random() * 3.6;
    }
    for (var j = shooters.length - 1; j >= 0; j--) {
      var p = shooters[j];
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life > p.max) { shooters.splice(j, 1); continue; }
      var al = Math.sin(Math.PI * p.life / p.max);
      var tx = p.x - p.vx * 0.13, ty = p.y - p.vy * 0.13;
      var lg = sx.createLinearGradient(tx, ty, p.x, p.y);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(1, 'rgba(255,255,255,' + (0.95 * al).toFixed(3) + ')');
      sx.strokeStyle = lg; sx.lineWidth = 2; sx.lineCap = 'round';
      sx.beginPath(); sx.moveTo(tx, ty); sx.lineTo(p.x, p.y); sx.stroke();
      sx.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
      sx.beginPath(); sx.arc(p.x, p.y, 1.8, 0, 6.2832); sx.fill();
    }
    requestAnimationFrame(skyFrame);
  }
  requestAnimationFrame(skyFrame);

  return true;
})();
