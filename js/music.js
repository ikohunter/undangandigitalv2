/* Musik latar via YouTube IFrame API (pemutar tersembunyi).
   Atur di js/config.js -> music.youtubeId. Bila gagal/dilarang embed, otomatis
   memakai file lokal music.src (jika ada). */
const parseYT = v => {
  v = String(v || "").trim(); if (!v) return "";
  const x = v.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/|\/v\/)([\w-]{11})/) || v.match(/^([\w-]{11})$/);
  return x ? x[1] : "";
};
const Music = (() => {
  let btn, yt, ytReady = false, wantPlay = false, playing = false, audio = null;
  const sync = () => { if (!btn) return; btn.classList.toggle("playing", playing); btn.setAttribute("aria-pressed", String(playing)); };

  function initLocal() {
    const src = CONFIG.music && CONFIG.music.src;
    if (!src || audio) return;
    audio = new Audio(); audio.preload = "none"; audio.src = src;
    audio.loop = CONFIG.music.loop !== false; audio.volume = CONFIG.music.volume ?? 0.4;
    audio.addEventListener("error", () => { audio = null; playing = false; sync(); if (btn) btn.title = "Musik tidak tersedia"; });
  }

  function loadYT() {
    const host = document.createElement("div");
    host.id = "yt-host"; host.setAttribute("aria-hidden", "true");
    host.innerHTML = '<div id="yt-player"></div>';
    document.body.append(host);
    window.onYouTubeIframeAPIReady = () => {
      const id = CONFIG.music.youtubeId;
      yt = new YT.Player("yt-player", {
        width: "200", height: "200", videoId: id,
        playerVars: { playsinline: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, loop: 1, playlist: id, start: CONFIG.music.startAt || 0, origin: location.origin },
        events: {
          onReady: () => { ytReady = true; yt.setVolume(Math.round((CONFIG.music.volume ?? 0.4) * 100)); if (wantPlay) yt.playVideo(); },
          onStateChange: e => {
            if (e.data === YT.PlayerState.PLAYING) { playing = true; sync(); }
            else if (e.data === YT.PlayerState.PAUSED) { playing = false; sync(); }
            else if (e.data === YT.PlayerState.ENDED) yt.playVideo();
          },
          onError: () => { yt = null; ytReady = false; initLocal(); if (wantPlay && audio) audio.play().then(() => { playing = true; sync(); }).catch(() => {}); }
        }
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api"; s.async = true;
    s.onerror = () => { initLocal(); };
    document.head.append(s);
  }

  function fadeIn() {
    const goal = Math.round((CONFIG.music.volume ?? 0.4) * 100); let v = 0; yt.setVolume(0);
    const t = setInterval(() => { v += 5; yt.setVolume(Math.min(v, goal)); if (v >= goal) clearInterval(t); }, 150);
  }
  function play() {
    wantPlay = true;
    if (yt && ytReady) { yt.playVideo(); fadeIn(); }
    else if (audio) audio.play().then(() => { playing = true; sync(); }).catch(() => {});
  }
  function pause() {
    wantPlay = false;
    if (yt && ytReady) yt.pauseVideo();
    if (audio) audio.pause();
    playing = false; sync();
  }

  function init() {
    btn = document.getElementById("music-btn");
    const m = CONFIG.music; if (m) m.youtubeId = parseYT(m.youtubeId);
    if (!m || (!m.youtubeId && !m.src)) { btn.remove(); btn = null; return; }
    if (m.youtubeId) loadYT(); else initLocal();
    btn.addEventListener("click", () => (playing ? pause() : play()));
  }
  function start() { if (!btn) return; btn.classList.add("show"); play(); }
  return { init, start };
})();
