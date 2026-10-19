window.Wishes = { init({ el, $ }) {
  const box = $("#wishes-box"); if (!box) return;
  const name = el("input", { type: "text", maxlength: "60", required: "" });
  const text = el("textarea", { maxlength: "500", required: "" });
  const msg = el("p", { class: "msg", role: "status" });
  const btn = el("button", { class: "btn", type: "submit" }, "Kirim Ucapan");
  const form = el("form", { class: "form card", novalidate: "" }, el("label", {}, "Nama", name), el("label", {}, "Ucapan & doa", text), btn, msg);
  const listEl = el("div", { class: "wishes" }), more = el("button", { class: "btn ghost hidden", type: "button", style: "margin-top:16px" }, "Lihat lebih banyak");
  box.append(form, listEl, more);
  let data = [], shown = 0; const STEP = 5;
  const fmt = t => { const d = new Date(t); return isNaN(d) ? "" : new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d) + " WIB"; };
  const card = w => el("div", { class: "wish" }, el("b", { text: w.name }), el("small", { text: fmt(w.time) }), el("p", { text: w.text }));
  const draw = () => {
    listEl.replaceChildren();
    if (!data.length) { listEl.append(el("p", { class: "empty", text: "Belum ada ucapan. Jadilah yang pertama." })); more.classList.add("hidden"); return; }
    data.slice(0, shown).forEach(w => listEl.append(card(w)));
    more.classList.toggle("hidden", shown >= data.length);
  };
  more.onclick = () => { shown += STEP; draw(); };
  const say = (t, c) => { msg.textContent = t; msg.className = "msg " + (c || ""); };
  async function load() {
    if (!CONFIG.scriptURL) return draw();
    try { const j = await (await fetch(CONFIG.scriptURL + "?action=wishes")).json(); data = j.wishes || []; } catch { data = []; }
    shown = STEP; draw();
  }
  let busy = false;
  form.addEventListener("submit", async e => {
    e.preventDefault(); if (busy) return;
    const n = name.value.trim(), t = text.value.trim();
    if (n.length < 2) return say("Nama minimal 2 karakter.", "err");
    if (t.length < 3) return say("Ucapan terlalu pendek.", "err");
    if (!CONFIG.scriptURL) return say("Buku tamu belum diaktifkan: isi scriptURL di config.js.", "err");
    busy = true; btn.disabled = true; btn.textContent = "Mengirim…"; say("");
    try {
      const r = await fetch(CONFIG.scriptURL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "wish", name: n, text: t }) });
      const j = await r.json(); if (!j.ok) throw new Error();
      data.unshift({ name: n, text: t, time: new Date().toISOString() }); shown = Math.max(shown, STEP); draw();
      say("Terima kasih atas doa dan ucapannya.", "ok"); form.reset();
    } catch { say("Gagal mengirim. Coba lagi.", "err"); }
    finally { busy = false; btn.disabled = false; btn.textContent = "Kirim Ucapan"; }
  });
  load();
}};
