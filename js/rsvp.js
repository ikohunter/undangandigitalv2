window.RSVP = { init({ el, $ }) {
  const box = $("#rsvp-box"); if (!box) return;
  const name = el("input", { type: "text", maxlength: "60", required: "", autocomplete: "name" });
  const guests = el("input", { type: "number", min: "1", max: "10", value: "1" });
  const opt = (v, c) => el("label", {}, el("input", { type: "radio", name: "st", value: v, ...(c ? { checked: "" } : {}) }), v);
  const msg = el("p", { class: "msg", role: "status" });
  const btn = el("button", { class: "btn", type: "submit" }, "Kirim Konfirmasi");
  const form = el("form", { class: "form card", novalidate: "" },
    el("label", {}, "Nama", name), el("div", {}, el("label", {}, "Kehadiran"), el("div", { class: "opts" }, opt("Hadir", 1), opt("Tidak Hadir"), opt("Masih Ragu"))),
    el("label", {}, "Jumlah tamu", guests), btn, msg);
  box.append(form);
  const say = (t, c) => { msg.textContent = t; msg.className = "msg " + (c || ""); };
  let busy = false;
  form.addEventListener("submit", async e => {
    e.preventDefault(); if (busy) return;
    const n = name.value.trim(), g = parseInt(guests.value, 10), st = form.querySelector("input[name=st]:checked").value;
    if (n.length < 2) return say("Nama minimal 2 karakter.", "err");
    if (!(g >= 1 && g <= 10)) return say("Jumlah tamu harus 1 sampai 10.", "err");
    if (!CONFIG.scriptURL) return say("Formulir belum diaktifkan: isi scriptURL di config.js.", "err");
    busy = true; btn.disabled = true; btn.textContent = "Mengirim…"; say("");
    try {
      const r = await fetch(CONFIG.scriptURL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ type: "rsvp", name: n, status: st, guests: g }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || "gagal");
      say("Terima kasih, konfirmasi Anda sudah tercatat.", "ok"); form.reset();
    } catch (err) { say("Gagal mengirim. Periksa koneksi lalu coba lagi.", "err"); }
    finally { busy = false; btn.disabled = false; btn.textContent = "Kirim Konfirmasi"; }
  });
}};
