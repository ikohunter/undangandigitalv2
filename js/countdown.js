const Countdown = (() => {
  const pad = n => String(n).padStart(2, "0");
  function init() {
    // ISO +07:00 = Asia/Jakarta, tidak bergantung zona waktu perangkat
    const target = new Date(CONFIG.weddingDate).getTime();
    const g = id => document.getElementById(id);
    const d = g("cd-d"), h = g("cd-h"), m = g("cd-m"), s = g("cd-s");
    let timer;
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const dd = Math.floor(diff / 864e5); diff %= 864e5;
      d.textContent = dd; h.textContent = pad(Math.floor(diff / 36e5));
      m.textContent = pad(Math.floor((diff % 36e5) / 6e4)); s.textContent = pad(Math.floor((diff % 6e4) / 1e3));
      if (target <= Date.now()) { clearInterval(timer); const b = document.querySelector(".cd"); if (b) { const p = document.createElement("p"); p.className = "cd-done"; p.textContent = "Alhamdulillah, hari bahagia telah tiba."; b.replaceWith(p); } }
    };
    tick(); timer = setInterval(tick, 1000);
  }
  return { init };
})();
