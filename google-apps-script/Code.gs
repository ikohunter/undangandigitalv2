const clean = (v, max) => {
  let s = String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s; // cegah formula injection di Sheets
};
const sheet = (name, header) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); }
  return sh;
};
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents), now = new Date();
    if (d.type === "rsvp") {
      const st = ["Hadir", "Tidak Hadir", "Masih Ragu"].includes(d.status) ? d.status : null;
      const g = Math.min(10, Math.max(1, parseInt(d.guests, 10) || 1));
      if (!st || clean(d.name, 60).length < 2) return out({ ok: false, error: "invalid" });
      sheet("RSVP", ["Waktu", "Nama", "Status", "Jumlah"]).appendRow([now, clean(d.name, 60), st, g]);
    } else if (d.type === "wish") {
      if (clean(d.name, 60).length < 2 || clean(d.text, 500).length < 3) return out({ ok: false, error: "invalid" });
      sheet("Wishes", ["Waktu", "Nama", "Ucapan"]).appendRow([now, clean(d.name, 60), clean(d.text, 500)]);
    } else return out({ ok: false, error: "type" });
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: "server" }); }
  finally { lock.releaseLock(); }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== "wishes") return out({ ok: true });
  const sh = sheet("Wishes", ["Waktu", "Nama", "Ucapan"]), rows = sh.getDataRange().getValues().slice(1).reverse().slice(0, 100);
  return out({ ok: true, wishes: rows.map(r => ({ time: new Date(r[0]).toISOString(), name: String(r[1]), text: String(r[2]) })) });
}
