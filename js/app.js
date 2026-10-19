(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const names = `${CONFIG.groom.nick} & ${CONFIG.bride.nick}`;
  const WIB = { timeZone: "Asia/Jakarta" };
  const fmtLong = iso => new Intl.DateTimeFormat("id-ID", { ...WIB, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  const fmtShort = iso => new Intl.DateTimeFormat("id-ID", { ...WIB, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

  // Builder DOM aman: semua teks lewat textContent
  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
      else if (k === "dataset") Object.assign(n.dataset, v); else n.setAttribute(k, v);
    }
    kids.flat().forEach(c => c != null && n.append(c));
    return n;
  }
  const safeUrl = u => { try { const x = new URL(u, location.href); return ["http:", "https:"].includes(x.protocol) ? x.href : "#"; } catch { return "#"; } };
  const compact = iso => iso.replace(/[-:]/g, "").replace("+0700", "").replace("+07:00", "");

  function guestName() {
    const raw = new URLSearchParams(location.search).get("to") || "";
    const clean = raw.replace(/[<>"'`\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
    return clean || "Tamu Undangan";
  }

  function render() {
    const d = fmtShort(CONFIG.weddingDate);
    document.title = `The Wedding of ${names}`;
    Object.entries(CONFIG.sections).forEach(([k, on]) => { if (!on) document.querySelectorAll(`[data-sec="${k}"]`).forEach(s => s.classList.add("hidden")); });
    if (!CONFIG.gift.enabled) $("#gift").classList.add("hidden");

    $("#cover-names").textContent = names; $("#cover-date").textContent = d;
    $("#hero-names").textContent = names; $("#hero-date").textContent = d;
    $("#foot-names").textContent = names; $("#guest-name").textContent = guestName();

    const person = (p, role) => el("div", { class: "person" },
      el("p", { class: "label", text: role }), el("h3", { text: p.nick }), p.full !== p.nick ? el("p", { class: "full", text: p.full }) : null,
      (p.father || p.mother) ? el("p", { text: `${role === "Mempelai Pria" ? "Putra" : "Putri"} dari ${[p.father, p.mother].filter(Boolean).join(" & ")}` }) : null,
      p.instagram ? el("a", { class: "ig", href: `https://instagram.com/${encodeURIComponent(p.instagram)}`, target: "_blank", rel: "noopener", text: `@${p.instagram}` }) : null);
    $("#couple-grid").append(person(CONFIG.groom, "Mempelai Pria"), el("p", { class: "amp", text: "&" }), person(CONFIG.bride, "Mempelai Wanita"));

    $("#events").append(...CONFIG.events.map(e => {
      const cal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.title + " " + names)}&dates=${compact(e.start)}/${compact(e.end)}&ctz=Asia/Jakarta&location=${encodeURIComponent(e.place + ", " + e.address)}`;
      return el("div", { class: "card" },
        el("h3", { text: e.title }),
        el("p", { class: "meta" }, el("b", { text: "Tanggal" }), fmtLong(e.start)),
        el("p", { class: "meta" }, el("b", { text: "Waktu" }), e.timeLabel),
        el("p", { class: "meta" }, el("b", { text: "Lokasi" }), `${e.place} — ${e.address}`),
        el("div", { class: "actions" },
          e.maps ? el("a", { class: "btn", href: safeUrl(e.maps), target: "_blank", rel: "noopener", text: "Buka Google Maps" }) : null,
          el("a", { class: "btn ghost", href: cal, target: "_blank", rel: "noopener", text: "Simpan ke Kalender" })));
    }));

    $("#story-list").append(...CONFIG.story.map(s => el("div", { class: "tl-item" },
      el("p", { class: "yr", text: s.year }), el("h3", { text: s.title }), el("p", { text: s.text }))));

    $("#accounts").append(...CONFIG.gift.accounts.map(a => el("div", { class: "card acc" },
      el("p", { class: "label", text: a.bank }), el("p", { class: "no", text: a.number }), el("p", { text: `a.n. ${a.name}` }),
      el("button", { class: "btn ghost", type: "button", dataset: { copy: a.number }, text: "Salin rekening" }))));
    $("#gift-address").textContent = CONFIG.gift.address;
    if (!CONFIG.gift.address) $("#address-card").classList.add("hidden");

    const ig = $("#foot-ig");
    if (CONFIG.instagram) { ig.href = `https://instagram.com/${encodeURIComponent(CONFIG.instagram)}`; ig.textContent = "@" + CONFIG.instagram; } else ig.remove();
  }

  async function copy(text, btn) {
    const old = btn.textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = "Tersalin"; }
    catch {
      const t = el("textarea"); t.value = text; document.body.append(t); t.select();
      try { document.execCommand("copy"); btn.textContent = "Tersalin"; } catch { btn.textContent = "Gagal menyalin"; }
      t.remove();
    }
    setTimeout(() => (btn.textContent = old), 1800);
  }

  function share() {
    const base = CONFIG.share.baseUrl || location.origin + location.pathname;
    const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nDengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami.\n\n${names}\n\nSilakan buka undangan melalui tautan berikut:\n\n${base}?to=NamaTamu\n\nMerupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  // animasi muncul halus saat digulir
  function reveal() {
    const items = document.querySelectorAll("#home > *:not(.batik), section:not(#home) > *, footer > *:not(.batik)");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    items.forEach((n, i) => { n.classList.add("rv"); n.style.setProperty("--d", (i % 3) * 0.1 + "s"); io.observe(n); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    render(); Music.init(); Countdown.init();
    $("#open-btn").addEventListener("click", () => {
      $("#cover").classList.add("gone"); document.body.classList.remove("locked"); scrollTo(0, 0);
      setTimeout(() => $("#cover").style.display = "none", 800);
      Music.start(); // dipicu klik pengguna, aman untuk autoplay
    });
    $("#share-btn").addEventListener("click", share);
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-copy],[data-copy-address]"); if (!b) return;
      copy(b.hasAttribute("data-copy") ? b.dataset.copy : CONFIG.gift.address, b);
    });
    ["RSVP", "Wishes"].forEach(m => window[m] && window[m].init({ el, $ }));
    reveal();
  });
})();
