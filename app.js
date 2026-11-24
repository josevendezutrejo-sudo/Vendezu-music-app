/* ===== Elementos ===== */
const $ = (id) => document.getElementById(id);
const q = $("q"), resultados = $("resultados"), titulo = $("titulo");
const audioNormal = $("audio");
const audioB = new Audio();
audioB.preload = "auto";
let audio = audioNormal;
let audioFx = null;
const pTitulo = $("pTitulo"), pArtista = $("pArtista"), pPortada = $("pPortada"), pBoton = $("pBoton"), pSig = $("pSig");
const fondoBajo = $("fondo-bajo"), nav = $("nav"), pildora = $("pildora"), player = $("player");
const sheet = $("sheet"), grab = $("grab"), sPortada = $("sPortada"), sGlow = $("sGlow"), portada3d = $("portada3d");
const sTitulo = $("sTitulo"), sArtista = $("sArtista"), fav = $("fav"), sCalidad = $("sCalidad");
const barra = $("barra"), tAct = $("tAct"), tTot = $("tTot");
const sPlay = $("sPlay"), prev = $("prev"), next = $("next"), vol = $("vol");
const panelLetra = $("panelLetra"), letraPrev = $("letraPrev"), letraAct = $("letraAct"), letraNext = $("letraNext");
const letraPlain = $("letraPlain"), letraNota = $("letraNota");
const panelCola = $("panelCola"), colaLista = $("colaLista"), panelMas = $("panelMas"), masLista = $("masLista");
const favoritasDiv = $("favoritas"), bibTitulo = $("bibTitulo");
const fondoVivo = $("fondoVivo"), auraPortada = $("auraPortada");

const ICO_PLAY = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICO_PAUSA = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
const ICO_SIG = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>';
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/* ===== Estado ===== */
let lista = [];
let actual = -1;
let espera;
let arrastrando = false;
let pedidoPlay = 0;
let pedidoBusqueda = 0;
let enMezcla = false;
let rampaT = null;
let ultimoT = 0, sinGuardar = 0;
let djOn = false;
let djCuenta = 0;
let djRellenando = false;
let repetirUna = false;
let sleepIdx = 0;
let sleepT = null;
let letraIdx = -1, letraClave = "", letraActual = null;
const letrasMem = new Map();
let toastEl = null, toastT;
let fuente = "catalogo";
let segPintar = function () {};
let jsonpN = 0;
let generoReggaeton = null;
const SLEEP_OPC = [0, 5, 15, 30, 60];
const VELS = [0.75, 1, 1.25, 1.5];
const PAGS = ["apariencia", "reproduccion", "sonido", "dj", "icono", "privacidad", "acerca"];

/* ===== Utilidades ===== */
function leer(clave, defecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  } catch (e) { return defecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
}
function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function unicos(arr) {
  const vistos = new Set();
  return arr.filter((c) => {
    if (!c || c.trackId == null || vistos.has(c.trackId)) return false;
    vistos.add(c.trackId);
    return true;
  });
}
function mensajeDe(e) { return String((e && e.message) || e || "error desconocido").slice(0, 120); }
function soloLista(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }
function normTxt(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function claveCancion(c) { return normTxt(c.artistName) + "|" + normTxt(c.trackName); }
function normalizar(c) {
  if (c.portada) return c;
  const art = c.artworkUrl100 || "";
  return {
    trackId: c.trackId,
    trackName: c.trackName,
    artistName: c.artistName,
    portadaPeq: art.replace("100x100", "400x400"),
    portada: art.replace("100x100", "600x600"),
    previewUrl: c.previewUrl,
    fuente: "itunes"
  };
}

/* ===== Preferencias ===== */
const PREF_DEF = {
  estilo: "oscuro", acento: "#ff4d6d", tamTexto: "normal",
  intensidad: 60, espec: true, refraccion: false,
  fondoAnim: true, portadaAnim: true, efecto3d: true, desenfoqueProg: true, fondoPortada: true, fiestaDJ: true,
  reflejoTactil: true, particulas: true, parallaxDJ: true, calidad: "equilibrada", icono: 0,
  sinAnim: false, sinBlur: false, sinRend: false,
  mezclaOn: true, mezclaSeg: 6, velocidad: 1, letraVisible: true, letrasAuto: true,
  djCada: 3, djHablaSeg: 5, djVoz: true,
  guardarHist: true, guardarBusq: true, nombre: ""
};
const LIMITES = { mezclaSeg: [0, 12], djCada: [1, 10], djHablaSeg: [3, 8], intensidad: [0, 100] };
const FORMATO = {
  mezclaSeg: (v) => v + " s",
  djCada: (v) => v + (v === 1 ? " canción" : " canciones"),
  djHablaSeg: (v) => v + " s",
  intensidad: (v) => v + "%"
};
let P = Object.assign({}, PREF_DEF, leer("prefs", {}));
if (P.estilo === "normal") P.estilo = "oscuro";
if (P.estilo === "glass") P.estilo = "degradado";
function sanear() {
  Object.keys(LIMITES).forEach((k) => {
    const v = Number(P[k]);
    P[k] = Math.min(LIMITES[k][1], Math.max(LIMITES[k][0], isNaN(v) ? PREF_DEF[k] : v));
  });
  P.velocidad = VELS.indexOf(Number(P.velocidad)) >= 0 ? Number(P.velocidad) : 1;
  if (["oscuro", "claro", "degradado", "solido"].indexOf(P.estilo) < 0) P.estilo = "oscuro";
  if (["maxima", "equilibrada", "ahorro"].indexOf(P.calidad) < 0) P.calidad = "equilibrada";
  if (!/^#[0-9a-f]{6}$/i.test(String(P.acento))) P.acento = PREF_DEF.acento;
  if (["normal", "grande"].indexOf(P.tamTexto) < 0) P.tamTexto = "normal";
  Object.keys(PREF_DEF).forEach((k) => {
    if (typeof P[k] !== typeof PREF_DEF[k]) P[k] = PREF_DEF[k];
  });
  P.nombre = String(P.nombre || "");
}
sanear();
function mezclaActiva() { return P.mezclaOn && P.mezclaSeg > 0; }
function soportaRefraccion() {
  try { return !!(window.CSS && CSS.supports && CSS.supports("backdrop-filter", "url(#refrac)")); } catch (e) { return false; }
}
function aplicarPrefs() {
  const html = document.documentElement;
  html.setAttribute("data-estilo", P.estilo);
  html.style.setProperty("--acento", P.acento);
  html.style.setProperty("--v-blur", Math.round(8 + P.intensidad * 0.3) + "px");
  html.style.setProperty("--v-alpha", (0.08 + P.intensidad * 0.0016).toFixed(3));
  html.classList.toggle("sin-anim", !!P.sinAnim);
  html.classList.toggle("sin-blur", !!P.sinBlur);
  html.classList.toggle("sin-rend", !!P.sinRend);
  html.classList.toggle("sin-espec", !P.espec);
  html.classList.toggle("sin-3d", !P.efecto3d);
  html.classList.toggle("fondo-quieto", !P.fondoAnim);
  html.classList.toggle("sin-fondo-portada", !P.fondoPortada);
  html.classList.toggle("sin-pb", !P.desenfoqueProg);
  html.classList.toggle("sin-fiesta", !P.fiestaDJ);
  html.classList.toggle("sin-reflejo-tactil", !P.reflejoTactil);
  html.classList.toggle("sin-particulas", !P.particulas);
  html.classList.toggle("sin-parallax-dj", !P.parallaxDJ);
  html.classList.toggle("calidad-ahorro", P.calidad === "ahorro");
  html.classList.toggle("calidad-equilibrada", P.calidad === "equilibrada");
  html.classList.toggle("calidad-maxima", P.calidad === "maxima");
  html.classList.toggle("texto-grande", P.tamTexto === "grande");
  html.classList.toggle("refraccion", !!P.refraccion && soportaRefraccion());
  portada3d.classList.toggle("anim", !!P.portadaAnim);
  auraPortada.classList.toggle("on", !!P.fondoPortada && !!lista[actual]);
  document.querySelectorAll('[data-tipo="toggle"]').forEach((b) => b.classList.toggle("on", !!P[b.dataset.ajuste]));
  document.querySelectorAll('[data-tipo="seg"]').forEach((g) => {
    const k = g.dataset.ajuste;
    g.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", String(P[k]) === b.dataset.valor));
  });
  document.querySelectorAll('[data-tipo="rango"]').forEach((r) => {
    const k = r.dataset.ajuste;
    r.value = P[k];
    r.style.setProperty("--p", ((P[k] - Number(r.min)) / (Number(r.max) - Number(r.min))) * 100 + "%");
  });
  document.querySelectorAll("[data-para]").forEach((s) => {
    const k = s.dataset.para;
    if (FORMATO[k]) s.textContent = FORMATO[k](P[k]);
  });
  document.querySelectorAll("[data-acento]").forEach((b) => b.classList.toggle("activo", b.dataset.acento === P.acento));
  const nr = $("notaRefrac");
  if (nr) nr.textContent = soportaRefraccion()
    ? "Deforma lo que hay detrás de la barra de abajo como un vidrio de verdad. Usa más batería."
    : "Tu navegador no soporta la refracción real. Funciona en Chrome para Android.";
  pintarAvatar();
}
function aplicarVelocidad() {
  [audioNormal, audioB, audioFx].forEach((a) => { if (a) a.playbackRate = P.velocidad; });
}
function cambiarPref(k) {
  sanear();
  guardar("prefs", P);
  aplicarPrefs();
  if (k === "velocidad") aplicarVelocidad();
  if (k === "djCada" || k === "djVoz" || k === "djHablaSeg") pintarDJ();
  if (k === "mezclaOn" || k === "mezclaSeg") pintarDecks();
  if (k === "letraVisible") { panelLetra.hidden = !P.letraVisible; if (P.letraVisible) cargarLetra(); }
  if (!panelMas.hidden) pintarMas();
}
function bindPrefs() {
  document.querySelectorAll('[data-tipo="toggle"]').forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.ajuste;
    P[k] = !P[k];
    cambiarPref(k);
  }));
  document.querySelectorAll('[data-tipo="seg"]').forEach((g) => {
    const k = g.dataset.ajuste;
    g.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.valor;
      P[k] = typeof PREF_DEF[k] === "number" ? Number(v) : v;
      cambiarPref(k);
    }));
  });
  document.querySelectorAll('[data-tipo="rango"]').forEach((r) => r.addEventListener("input", () => {
    const k = r.dataset.ajuste;
    P[k] = Number(r.value);
    cambiarPref(k);
  }));
  document.querySelectorAll("[data-acento]").forEach((b) => b.addEventListener("click", () => {
    P.acento = b.dataset.acento;
    cambiarPref("acento");
  }));
  $("inNombre").value = P.nombre;
  $("inNombre").addEventListener("input", () => {
    P.nombre = $("inNombre").value;
    guardar("prefs", P);
    pintarAvatar();
  });
  $("probarVoz").addEventListener("click", () => hablarDJ("Hola, soy el DJ Vendezú. Así se escucha mi voz.", 5000));
  $("borrarHist").addEventListener("click", () => {
    if (!confirm("¿Borrar el historial de reproducción?")) return;
    historial = [];
    guardar("historial", historial);
    aviso("Historial borrado.");
    pintarInicio();
  });
  $("borrarBusq").addEventListener("click", () => {
    busqRec = [];
    guardar("busqRec", busqRec);
    aviso("Búsquedas borradas.");
  });
  $("borrarFav").addEventListener("click", () => {
    if (!confirm("¿Borrar todas tus favoritas?")) return;
    favoritos = [];
    guardar("favoritos", favoritos);
    marcarFav();
    aviso("Favoritas borradas.");
    pintarInicio();
  });
  $("reiniciarStats").addEventListener("click", () => {
    stats = { seg: 0, plays: 0, desde: Date.now() };
    guardar("stats", stats);
    aviso("Estadísticas reiniciadas.");
    pintarResumen();
  });
}

/* ===== Datos guardados ===== */
let favoritos = soloLista(leer("favoritos", [])).map(normalizar);
let historial = soloLista(leer("historial", [])).map(normalizar);
let stats = leer("stats", null) || { seg: 0, plays: 0, desde: Date.now() };
let busqRec = soloLista(leer("busqRec", []));

/* ===== Catálogo: Deezer (JSONP) + iTunes ===== */
function jsonp(url, ms) {
  return new Promise((resolve, reject) => {
    const cb = "dz" + Date.now().toString(36) + (jsonpN++);
    const s = document.createElement("script");
    let t = null;
    function limpiar() {
      clearTimeout(t);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (s.parentNode) s.parentNode.removeChild(s);
    }
    t = setTimeout(() => { limpiar(); reject(new Error("Deezer tardó demasiado")); }, ms || 8000);
    window[cb] = (d) => { limpiar(); resolve(d); };
    s.onerror = () => { limpiar(); reject(new Error("Deezer no respondió")); };
    s.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "output=jsonp&callback=" + cb;
    document.head.appendChild(s);
  });
}
function deezerATrack(t, albumFijo) {
  const al = albumFijo || t.album || {};
  const ar = t.artist || {};
  return {
    trackId: "d:" + t.id,
    dzId: t.id,
    trackName: t.title_short || t.title || "Sin título",
    artistName: ar.name || "Artista",
    portadaPeq: al.cover_medium || al.cover_big || al.cover || "icon-192.png",
    portada: al.cover_xl || al.cover_big || al.cover_medium || "icon-512.png",
    previewUrl: t.preview || "",
    albumId: al.id || null,
    albumName: al.title || "",
    fuente: "deezer"
  };
}
function listaDeezer(d, albumFijo) {
  return ((d && d.data) || []).filter((t) => t && t.id).map((t) => deezerATrack(t, albumFijo));
}
async function buscarDeezer(texto) {
  const enc = encodeURIComponent(texto);
  const [gen, art] = await Promise.allSettled([
    jsonp("https://api.deezer.com/search?q=" + enc + "&limit=50"),
    jsonp("https://api.deezer.com/search/artist?q=" + enc + "&limit=1")
  ]);
  let porArtista = [];
  if (art.status === "fulfilled" && art.value && art.value.data && art.value.data[0]) {
    const a = art.value.data[0];
    if (normTxt(a.name).indexOf(normTxt(texto)) >= 0 || normTxt(texto).indexOf(normTxt(a.name)) >= 0) {
      try { porArtista = listaDeezer(await jsonp("https://api.deezer.com/artist/" + a.id + "/top?limit=50")); } catch (e) {}
    }
  }
  const general = gen.status === "fulfilled" ? listaDeezer(gen.value) : [];
  if (gen.status === "rejected" && !porArtista.length) throw gen.reason;
  return unicos(porArtista.concat(general));
}
async function consultaItunes(texto, extra, pais) {
  let url = "https://itunes.apple.com/search?media=music&entity=song&limit=40&term=" + encodeURIComponent(texto) + extra;
  if (pais) url += "&country=" + pais;
  const r = await fetch(url);
  const datos = await r.json();
  return (datos.results || []).filter((c) => c.previewUrl).map(normalizar);
}
function regionUsuario() {
  const p = ((typeof navigator !== "undefined" && navigator.language) || "").split("-")[1];
  return p && p.length === 2 ? p.toUpperCase() : "";
}
async function buscarItunes(texto) {
  const pais = regionUsuario();
  let porArtista = [];
  try {
    porArtista = await consultaItunes(texto, "&attribute=artistTerm", pais);
    if (!porArtista.length && pais) porArtista = await consultaItunes(texto, "&attribute=artistTerm", "");
  } catch (e) {}
  if (porArtista.length >= 8) return porArtista;
  let general = [];
  try {
    general = await consultaItunes(texto, "", pais);
    if (!general.length && pais) general = await consultaItunes(texto, "", "");
  } catch (e) {
    if (!porArtista.length) throw e;
  }
  const vistos = new Set(porArtista.map((c) => c.trackId));
  return porArtista.concat(general.filter((c) => !vistos.has(c.trackId)));
}
function fusionar(a, b) {
  const out = [];
  const vistos = new Set();
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    [a[i], b[i]].forEach((c) => {
      if (!c) return;
      const k = claveCancion(c);
      if (vistos.has(k)) return;
      vistos.add(k);
      out.push(c);
    });
  }
  return out;
}
async function buscarCatalogo(texto) {
  const [d, i] = await Promise.allSettled([buscarDeezer(texto), buscarItunes(texto)]);
  const A = d.status === "fulfilled" ? d.value : [];
  const B = i.status === "fulfilled" ? i.value : [];
  if (d.status === "rejected" && i.status === "rejected") throw new Error(mensajeDe(d.reason) + " | " + mensajeDe(i.reason));
  return fusionar(A, B).slice(0, 60);
}
async function previewAlterno(c) {
  try {
    const r = await fetch("https://itunes.apple.com/search?media=music&entity=song&limit=5&term=" + encodeURIComponent(c.artistName + " " + c.trackName));
    const d = await r.json();
    const n = normTxt(c.trackName).slice(0, 12);
    const res = (d.results || []).filter((x) => x.previewUrl);
    const hit = res.find((x) => normTxt(x.trackName).indexOf(n) >= 0) || res[0];
    return hit ? hit.previewUrl : "";
  } catch (e) { return ""; }
}
async function urlDe(c) {
  if (c.previewUrl) return c.previewUrl;
  const alt = await previewAlterno(c);
  if (!alt) throw new Error("sin adelanto");
  c.previewUrl = alt;
  return alt;
}
async function renovarPreview(c) {
  if (c.fuente === "deezer" && c.dzId) {
    try {
      const t = await jsonp("https://api.deezer.com/track/" + c.dzId);
      if (t && t.preview) { c.previewUrl = t.preview; return t.preview; }
    } catch (e) {}
  }
  return previewAlterno(c);
}
async function idGeneroReggaeton() {
  if (generoReggaeton) return generoReggaeton;
  let id = 122;
  try {
    const g = await jsonp("https://api.deezer.com/genre");
    const hit = ((g && g.data) || []).find((x) => /reggae?ton/i.test(x.name || ""));
    if (hit) id = hit.id;
  } catch (e) {}
  generoReggaeton = id;
  return id;
}

/* ===== Pantallas, menú de ajustes y barra inferior ===== */
function ajPag(nombre) {
  $("aj-menu").hidden = nombre !== "menu";
  PAGS.forEach((p) => { $("aj-" + p).hidden = p !== nombre; });
}
document.querySelectorAll("[data-pag]").forEach((b) => b.addEventListener("click", () => ajPag(b.dataset.pag)));
document.querySelectorAll("[data-volver]").forEach((b) => b.addEventListener("click", () => ajPag("menu")));
ajPag("menu");

const vistas = ["inicio", "explorar", "dj", "biblioteca", "buscar", "ajustes"];
const tabsNombres = ["inicio", "explorar", "dj", "biblioteca"];
let vistaActual = "inicio";
const enlaces = Array.prototype.slice.call(document.querySelectorAll("#nav a"));

function moverPildora(vista) {
  const i = tabsNombres.indexOf(vista);
  if (i < 0 || !enlaces[i]) { pildora.style.opacity = "0"; return; }
  const a = enlaces[i];
  pildora.style.opacity = "1";
  pildora.style.width = a.offsetWidth + "px";
  pildora.style.transform = "translateX(" + a.offsetLeft + "px)";
}
function ir(vista) {
  vistaActual = vista;
  vistas.forEach((v) => $("v-" + v).classList.toggle("activa", v === vista));
  enlaces.forEach((a) => a.classList.toggle("activa", a.dataset.v === vista));
  moverPildora(vista);
  window.scrollTo(0, 0);
  fondoBajo.classList.remove("oculta");
  if (vista === "inicio") pintarInicio();
  if (vista === "dj") { pintarDJ(); pintarMixes(); pintarSugerencias("djSugs"); pintarDecks(); }
  if (vista === "biblioteca") { pintarStats(); pintarListas(); pintarFavoritas(); pintarEscuchadas(); }
  if (vista === "buscar") pintarBusqRec();
  if (vista === "ajustes") { ajPag("menu"); pintarResumen(); }
}
function tabEn(x) {
  let mejor = 0, dist = 1e9;
  enlaces.forEach((a, i) => {
    const r = a.getBoundingClientRect();
    const d = x < r.left ? r.left - x : (x > r.right ? x - r.right : 0);
    if (d < dist) { dist = d; mejor = i; }
  });
  return mejor;
}
let arr = null;
nav.addEventListener("pointerdown", (e) => {
  arr = { x0: e.clientX, xAnt: e.clientX, mov: false };
  if (nav.setPointerCapture) nav.setPointerCapture(e.pointerId);
});
nav.addEventListener("pointermove", (e) => {
  if (!arr) return;
  if (Math.abs(e.clientX - arr.x0) > 6) arr.mov = true;
  if (!arr.mov) return;
  const r = nav.getBoundingClientRect();
  const w = pildora.offsetWidth;
  const x = Math.max(0, Math.min(r.width - w, e.clientX - r.left - w / 2));
  const v = Math.abs(e.clientX - arr.xAnt);
  arr.xAnt = e.clientX;
  const est = 1 + Math.min(0.3, v / 90);
  pildora.style.transition = "none";
  pildora.style.transform = "translateX(" + x + "px) scale(" + est.toFixed(2) + "," + (1.05 - (est - 1) * 0.7).toFixed(2) + ")";
  pildora.classList.add("agua");
});
nav.addEventListener("pointerup", (e) => {
  if (!arr) return;
  const i = tabEn(e.clientX);
  arr = null;
  pildora.style.transition = "";
  pildora.classList.remove("agua");
  ir(tabsNombres[i]);
});
nav.addEventListener("pointercancel", () => {
  arr = null;
  pildora.style.transition = "";
  pildora.classList.remove("agua");
  moverPildora(vistaActual);
});
enlaces.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
window.addEventListener("resize", () => moverPildora(vistaActual));
window.addEventListener("load", () => moverPildora(vistaActual));
$("btnBuscar").addEventListener("click", () => ir("buscar"));
function abrirPerfil() {
  const n = P.nombre.trim();
  $("perfilNombre").textContent = n || "Invitado";
  $("perfilAvatar").textContent = n ? n.charAt(0).toUpperCase() : "♪";
  const d = new Date(stats.desde);
  $("perfilDesde").textContent = "Miembro desde " + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  $("perfilMin").textContent = Math.round(stats.seg / 60);
  $("perfilFav").textContent = favoritos.length;
  $("perfilFondo").hidden = false;
  $("panelPerfil").hidden = false;
}
function cerrarPerfil() {
  $("perfilFondo").hidden = true;
  $("panelPerfil").hidden = true;
}
function cerrarSesion() {
  if (!confirm("¿Cerrar sesión? Se quitará tu nombre de este dispositivo.")) return;
  P.nombre = "";
  guardar("prefs", P);
  $("inNombre").value = "";
  if (confirm("¿Borrar también tus favoritas, listas e historial?")) {
    favoritos = []; historial = []; listas = [];
    guardar("favoritos", favoritos); guardar("historial", historial); guardar("listas", listas);
    stats = { seg: 0, plays: 0, desde: Date.now() };
    guardar("stats", stats);
  }
  pintarAvatar();
  pintarInicio();
  pintarListas();
  cerrarPerfil();
  aviso("Sesión cerrada.");
}
$("avatar").addEventListener("click", abrirPerfil);
$("perfilFondo").addEventListener("click", cerrarPerfil);
$("perfilCerrar").addEventListener("click", cerrarPerfil);
$("perfilAjustes").addEventListener("click", () => { cerrarPerfil(); ir("ajustes"); });
$("perfilSalir").addEventListener("click", cerrarSesion);

function pintarAvatar() {
  const t = P.nombre.trim();
  $("avatar").textContent = t ? t.charAt(0).toUpperCase() : "♪";
}
function saludoTexto() {
  const h = new Date().getHours();
  const s = h < 12 ? "Buenos días" : (h < 19 ? "Buenas tardes" : "Buenas noches");
  const n = P.nombre.trim().split(" ")[0];
  return n ? s + ", " + n : s;
}

/* ===== Filas, carriles e inicio ===== */
function filaCancion(c, alTocar) {
  const f = el("div", "fila-c panel");
  const img = el("img");
  img.src = c.portadaPeq;
  img.alt = "";
  const t = el("div", "fila-t");
  t.append(el("b", null, c.trackName), el("small", null, c.artistName));
  f.append(img, t);
  f.addEventListener("click", alTocar);
  return f;
}
function carril(contenedor, canciones) {
  contenedor.innerHTML = "";
  for (let i = 0; i < canciones.length; i += 4) {
    const col = el("div", "col");
    canciones.slice(i, i + 4).forEach((c, k) => {
      col.append(filaCancion(c, () => reproducirDe(canciones, i + k)));
    });
    contenedor.append(col);
  }
}
function tarjetaPortada(imagen, titulo2, sub, alTocar) {
  const b = el("button", "album");
  const cov = el("span", "cov");
  const im = el("img");
  im.src = imagen;
  im.alt = "";
  cov.append(im);
  b.append(cov, el("b", null, titulo2), el("small", null, sub));
  b.addEventListener("click", alTocar);
  return b;
}
function carrilPortadas(id, canciones) {
  const cont = $(id);
  cont.innerHTML = "";
  canciones.forEach((c, i) => {
    cont.append(tarjetaPortada(c.portadaPeq, c.trackName, c.artistName, () => reproducirDe(canciones, i)));
  });
}
function pintarSugerenciasCon(id, artistas) {
  const cont = $(id);
  cont.innerHTML = "";
  artistas.forEach((a) => {
    const b = el("button", "sug");
    const circ = el("span", "sug-c");
    if (a.img) {
      const im = el("img");
      im.src = a.img;
      im.alt = "";
      circ.append(im);
    } else {
      circ.textContent = a.n.charAt(0).toUpperCase();
    }
    b.append(circ, el("small", null, a.n));
    b.addEventListener("click", () => (a.id ? abrirArtista(a.id, a.n) : irArtista(a.n)));
    cont.append(b);
  });
}
let artistasReg = null;
function pintarSugerencias(id) {
  if (artistasReg && artistasReg.length) { pintarSugerenciasCon(id, artistasReg); return; }
  const vistos = new Set();
  const base = [];
  favoritos.concat(historial).forEach((c) => {
    if (c && c.artistName && !vistos.has(c.artistName)) { vistos.add(c.artistName); base.push({ n: c.artistName, img: c.portadaPeq }); }
  });
  const fijos = ["Bad Bunny", "Rauw Alejandro", "Karol G", "Feid", "Omar Courtz", "Peso Pluma"].map((n) => ({ n: n, img: "" }));
  pintarSugerenciasCon(id, base.length ? base.slice(0, 8) : fijos);
}
const cargado = { reg: false, tend: false, alb: false, art: false };
async function cargarSeccionesInicio() {
  if (!cargado.reg) {
    cargado.reg = true;
    try {
      const g = await idGeneroReggaeton();
      let tracks = listaDeezer(await jsonp("https://api.deezer.com/chart/" + g + "/tracks?limit=20"));
      if (!tracks.length) tracks = (await buscarCatalogo("reggaeton")).slice(0, 20);
      carrilPortadas("reggaeton", tracks);
    } catch (e) {
      try { carrilPortadas("reggaeton", (await buscarItunes("reggaeton")).slice(0, 20)); } catch (e2) { cargado.reg = false; }
    }
  }
  if (!cargado.tend) {
    cargado.tend = true;
    try {
      const tracks = listaDeezer(await jsonp("https://api.deezer.com/chart/0/tracks?limit=20"));
      if (!tracks.length) throw new Error("vacío");
      carrilPortadas("tendencias", tracks);
    } catch (e) {
      try { carrilPortadas("tendencias", (await buscarItunes("top hits")).slice(0, 20)); } catch (e2) { cargado.tend = false; }
    }
  }
  if (!cargado.alb) {
    cargado.alb = true;
    try {
      const cont = $("albumes");
      const d = await jsonp("https://api.deezer.com/chart/0/albums?limit=14");
      const albs = ((d && d.data) || []).filter((x) => x && x.id);
      if (!albs.length) throw new Error("vacío");
      cont.innerHTML = "";
      albs.forEach((al) => {
        cont.append(tarjetaPortada(al.cover_medium || al.cover || "", al.title || "Álbum", (al.artist && al.artist.name) || "", () => abrirAlbumDeezer(al)));
      });
    } catch (e) { cargado.alb = false; }
  }
  if (!cargado.art) {
    cargado.art = true;
    try {
      const g = await idGeneroReggaeton();
      const d = await jsonp("https://api.deezer.com/genre/" + g + "/artists");
      artistasReg = ((d && d.data) || []).filter((x) => x && x.id).slice(0, 14).map((a) => ({ n: a.name, id: a.id, img: a.picture_medium || a.picture || "" }));
      if (artistasReg.length) { pintarSugerenciasCon("sugerencias", artistasReg); if (vistaActual === "dj") pintarSugerencias("djSugs"); }
    } catch (e) { cargado.art = false; }
  }
}
async function abrirAlbumDeezer(al) {
  try {
    const d = await jsonp("https://api.deezer.com/album/" + al.id + "/tracks?limit=50");
    const canciones = listaDeezer(d, al).map((c) => Object.assign(c, { artistName: c.artistName }));
    if (!canciones.length) { aviso("No encontré canciones de este álbum."); return; }
    reproducirDe(canciones, 0);
  } catch (e) {
    aviso("No se pudo abrir el álbum.");
  }
}
async function abrirArtista(id, nombre) {
  cerrarSheet();
  q.value = nombre;
  ir("buscar");
  titulo.textContent = "Cargando a " + nombre + "...";
  resultados.innerHTML = "";
  $("busqRec").style.display = "none";
  try {
    const canciones = listaDeezer(await jsonp("https://api.deezer.com/artist/" + id + "/top?limit=50"));
    mostrar(canciones, "Lo mejor de " + nombre);
  } catch (e) {
    titulo.textContent = "No se pudo cargar a " + nombre + ".";
  }
}
function irArtista(nombre) {
  cerrarSheet();
  q.value = nombre;
  ir("buscar");
  buscar();
}
function pintarInicio() {
  $("saludo").textContent = saludoTexto();
  const rec = historial.slice(0, 8);
  const rap = favoritos.slice(0, 8);
  $("hintRec").style.display = rec.length ? "none" : "block";
  $("hintRap").style.display = rap.length ? "none" : "block";
  carril($("recientes"), rec);
  carril($("rapidas"), rap);
  pintarSugerencias("sugerencias");
  cargarSeccionesInicio();
}

/* ===== Explorar ===== */
const CATEGORIAS = [
  { n: "Reggaetón", c: ["#ff4d6d", "#9d174d"], q: "reggaeton" },
  { n: "Trap latino", c: ["#7c3aed", "#312e81"], q: "trap latino" },
  { n: "Salsa", c: ["#f97316", "#9a3412"], q: "salsa" },
  { n: "Cumbia", c: ["#facc15", "#a16207"], q: "cumbia" },
  { n: "Pop", c: ["#ec4899", "#6b21a8"], q: "pop" },
  { n: "Rock", c: ["#6b7280", "#1f2937"], q: "rock" },
  { n: "Hip hop", c: ["#0ea5e9", "#1e3a8a"], q: "hip hop" },
  { n: "Electrónica", c: ["#22d3ee", "#4338ca"], q: "electronica" },
  { n: "Baladas", c: ["#dc2626", "#7f1d1d"], q: "baladas romanticas" },
  { n: "Bachata", c: ["#16a34a", "#14532d"], q: "bachata" },
  { n: "Fiesta", c: ["#a855f7", "#6b21a8"], q: "fiesta latina" },
  { n: "Navidad", c: ["#15803d", "#7f1d1d"], q: "navidad" }
];
function construirExplorar() {
  const cont = $("categorias");
  CATEGORIAS.forEach((k) => {
    const b = el("button", "cat", k.n);
    b.style.background = "linear-gradient(135deg," + k.c[0] + "," + k.c[1] + ")";
    b.addEventListener("click", () => {
      fuente = "catalogo";
      segPintar();
      q.value = k.q;
      ir("buscar");
      buscar();
    });
    cont.append(b);
  });
}

/* ===== Listas de reproducción propias ===== */
let listas = soloLista(leer("listas", []));
function guardarListas() { guardar("listas", listas); }
function crearLista(nombre) {
  const n = String(nombre || "").trim().slice(0, 40);
  if (!n) return null;
  const ya = listas.find((l) => l.nombre.toLowerCase() === n.toLowerCase());
  if (ya) return ya;
  const l = { id: "l" + Date.now().toString(36), nombre: n, canciones: [] };
  listas.push(l);
  guardarListas();
  return l;
}
function agregarALista(c) {
  if (!c) return;
  const nombre = prompt("Nombre de la lista (nueva o existente):", listas.length ? listas[listas.length - 1].nombre : "Mi lista");
  const l = crearLista(nombre);
  if (!l) return;
  if (l.canciones.some((x) => x.trackId === c.trackId)) { aviso("Ya está en " + l.nombre + "."); return; }
  l.canciones.push({
    trackId: c.trackId, dzId: c.dzId, trackName: c.trackName, artistName: c.artistName,
    portadaPeq: c.portadaPeq, portada: c.portada, previewUrl: c.previewUrl, albumId: c.albumId, fuente: c.fuente
  });
  guardarListas();
  aviso("Añadida a " + l.nombre + ".");
  pintarListas();
}
function pintarListas() {
  const cont = $("listasBib");
  if (!cont) return;
  cont.innerHTML = "";
  const nueva = el("button", "mix");
  const cov = el("span", "mix-cov");
  cov.style.background = "linear-gradient(135deg,rgba(255,255,255,.25),rgba(255,255,255,.06))";
  cov.append(el("span", "mix-mas", "+"));
  nueva.append(cov, el("b", null, "Nueva lista"), el("small", null, "Crea la tuya"));
  nueva.addEventListener("click", () => {
    const l = crearLista(prompt("Nombre de la nueva lista:", "Mi lista"));
    if (l) { aviso("Lista creada: " + l.nombre); pintarListas(); }
  });
  cont.append(nueva);
  listas.forEach((l) => {
    const b = el("button", "mix");
    const c2 = el("span", "mix-cov");
    if (l.canciones[0]) {
      const im = el("img");
      im.src = l.canciones[0].portadaPeq;
      im.alt = "";
      c2.append(im);
    }
    const x = el("span", "mix-x", "✕");
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm("¿Borrar la lista " + l.nombre + "?")) return;
      listas = listas.filter((y) => y.id !== l.id);
      guardarListas();
      pintarListas();
    });
    c2.append(el("span", "mix-play", "▶"), x);
    b.append(c2, el("b", null, l.nombre), el("small", null, l.canciones.length + " canciones"));
    b.addEventListener("click", () => {
      if (!l.canciones.length) { aviso("Esta lista está vacía. Añade canciones desde Más opciones."); return; }
      reproducirDe(l.canciones.map(normalizar), 0);
    });
    cont.append(b);
  });
}

/* ===== Biblioteca y resumen ===== */
function pintarStats() {
  $("stMin").textContent = Math.round(stats.seg / 60);
  $("stNombre").textContent = (P.nombre.trim() || "Pon tu nombre en Ajustes").toUpperCase();
  $("stRep").textContent = stats.plays + " reproducciones · Todo el tiempo";
  const d = new Date(stats.desde);
  $("stDesde").textContent = String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getFullYear()).slice(2);
}
function pintarResumen() {
  $("rMin").textContent = Math.round(stats.seg / 60);
  $("rPlays").textContent = stats.plays;
  const d = new Date();
  $("anilloTxt").textContent = String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getFullYear()).slice(2);
  const p = Math.min(1, stats.seg / 3600) * 100;
  $("anilloArco").setAttribute("stroke-dasharray", p.toFixed(1) + " 100");
}
function sumarEscucha(a) {
  const t = a.currentTime;
  const d = t - ultimoT;
  if (d > 0 && d < 2) {
    stats.seg += d;
    sinGuardar += d;
    if (sinGuardar > 15) { guardar("stats", stats); sinGuardar = 0; }
  }
  ultimoT = t;
}

/* ===== Búsqueda ===== */
function buscarLocal(texto) {
  const t = texto.toLowerCase();
  return unicos(favoritos.concat(historial)).filter((c) => (c.trackName + " " + c.artistName).toLowerCase().indexOf(t) >= 0);
}
function recordarBusq(texto) {
  if (!P.guardarBusq) return;
  busqRec = [texto].concat(busqRec.filter((x) => x.toLowerCase() !== texto.toLowerCase())).slice(0, 8);
  guardar("busqRec", busqRec);
}
function pintarBusqRec() {
  const cont = $("busqRec");
  cont.innerHTML = "";
  if (q.value.trim() || !busqRec.length) {
    cont.style.display = "none";
    if (!q.value.trim()) {
      resultados.innerHTML = "";
      titulo.textContent = "Escribe y busca";
    }
    return;
  }
  cont.style.display = "block";
  titulo.textContent = "";
  resultados.innerHTML = "";
  const cab = el("div", "cab-rec");
  cab.append(el("h2", null, "Búsquedas recientes"));
  const borrar = el("button", null, "Borrar");
  borrar.addEventListener("click", () => { busqRec = []; guardar("busqRec", busqRec); pintarBusqRec(); });
  cab.append(borrar);
  cont.append(cab);
  busqRec.forEach((t) => {
    const f = el("div", "rec-fila");
    f.append(el("span", null, t));
    const x = el("button", null, "✕");
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      busqRec = busqRec.filter((y) => y !== t);
      guardar("busqRec", busqRec);
      pintarBusqRec();
    });
    f.addEventListener("click", () => { q.value = t; pintarBusqRec(); buscar(); });
    f.append(x);
    cont.append(f);
  });
}
async function buscar() {
  const texto = q.value.trim();
  if (!texto) {
    pintarBusqRec();
    return;
  }
  $("busqRec").style.display = "none";
  titulo.textContent = "Buscando...";
  const mio = ++pedidoBusqueda;
  try {
    const canciones = fuente === "biblioteca" ? buscarLocal(texto) : await buscarCatalogo(texto);
    if (mio !== pedidoBusqueda) return;
    mostrar(canciones);
    recordarBusq(texto);
  } catch (e) {
    if (mio !== pedidoBusqueda) return;
    titulo.textContent = "No se pudo buscar. Revisa tu internet (" + mensajeDe(e) + ")";
  }
}
function construirFuentes() {
  const cont = $("seg");
  const nota = $("notaFuente");
  const opciones = [["catalogo", "Catálogo"], ["biblioteca", "Mi biblioteca"]];
  const botones = [];
  segPintar = function () {
    botones.forEach((b, i) => b.classList.toggle("activo", opciones[i][0] === fuente));
    nota.textContent = fuente === "biblioteca"
      ? "Busca entre tus favoritas y recientes."
      : "Catálogo de Deezer y iTunes con portadas. Los adelantos duran 30 segundos.";
  };
  opciones.forEach((o) => {
    const b = el("button", null, o[1]);
    b.addEventListener("click", () => {
      fuente = o[0];
      segPintar();
      if (q.value.trim()) buscar();
    });
    botones.push(b);
    cont.append(b);
  });
  segPintar();
}
function aviso(texto) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.style.cssText = "position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 14px);transform:translateX(-50%);max-width:86vw;padding:11px 18px;border-radius:20px;background:rgba(20,20,30,.62);-webkit-backdrop-filter:blur(18px) saturate(180%);backdrop-filter:blur(18px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 10px 26px rgba(0,0,0,.4);color:#fff;font-size:.9rem;z-index:100;transition:opacity .3s;opacity:0;pointer-events:none;text-align:center";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = texto;
  toastEl.style.opacity = "1";
  clearTimeout(toastT);
  toastT = setTimeout(() => { toastEl.style.opacity = "0"; }, 3500);
}
function crearTarjeta(c, alTocar) {
  const t = el("div", "panel card");
  const img = el("img");
  img.src = c.portadaPeq;
  img.alt = "";
  t.append(img, el("b", null, c.trackName), el("small", null, c.artistName));
  t.addEventListener("click", alTocar);
  return t;
}
function mostrar(canciones, rotulo) {
  resultados.innerHTML = "";
  if (!canciones.length) {
    titulo.textContent = fuente === "biblioteca" ? "No hay nada así en tu biblioteca todavía." : "No encontré resultados";
    return;
  }
  titulo.textContent = rotulo || (fuente === "biblioteca" ? "Resultados · tu biblioteca" : "Resultados");
  canciones.forEach((c, i) => {
    resultados.appendChild(crearTarjeta(c, () => reproducirDe(canciones, i)));
  });
}

/* ===== Favoritas ===== */
function esFavorita(c) { return !!c && favoritos.some((f) => f.trackId === c.trackId); }
function marcarFav() { fav.classList.toggle("liked", esFavorita(lista[actual])); }
function alternarFav() {
  const c = lista[actual];
  if (!c) return;
  const i = favoritos.findIndex((f) => f.trackId === c.trackId);
  if (i >= 0) {
    favoritos.splice(i, 1);
  } else {
    favoritos.push({
      trackId: c.trackId, dzId: c.dzId, trackName: c.trackName, artistName: c.artistName,
      portadaPeq: c.portadaPeq, portada: c.portada, previewUrl: c.previewUrl, fuente: c.fuente
    });
  }
  guardar("favoritos", favoritos);
  marcarFav();
  if (!panelMas.hidden) pintarMas();
  if (vistaActual === "biblioteca") pintarFavoritas();
  if (vistaActual === "inicio") pintarInicio();
}
function pintarFavoritas() {
  favoritasDiv.innerHTML = "";
  if (!favoritos.length) {
    bibTitulo.textContent = "Aún no tienes favoritas. Toca la estrella en la pantalla de reproducción.";
    return;
  }
  bibTitulo.textContent = "Favoritas";
  favoritos.forEach((c, i) => favoritasDiv.appendChild(crearTarjeta(c, () => reproducirDe(favoritos, i))));
}
function pintarEscuchadas() {
  const cont = $("escuchadas");
  cont.innerHTML = "";
  if (!historial.length) {
    cont.append(el("p", "nota", "Aquí aparecen las canciones que escuchaste."));
    return;
  }
  historial.forEach((c, i) => cont.appendChild(crearTarjeta(c, () => reproducirDe(historial, i))));
}
fav.addEventListener("click", alternarFav);

/* ===== Efectos de sonido, audio espacial 3D y sala ===== */
const PRESETS = {
  "Plano": [0, 0, 0, 0, 0], "Graves": [6, 4, 0, 0, 0], "Voces": [-2, 0, 4, 3, 0],
  "Rock": [5, 3, -1, 3, 5], "Pop": [-1, 2, 4, 2, -1], "Electrónica": [6, 3, 0, 2, 5]
};
const BANDAS = [60, 230, 910, 3600, 14000];
const ANCHOS = [1, 1.4, 2];
const NOMBRES_ESP = ["Apagado", "Suave", "Amplio", "Inmersivo 3D"];
let fx = leer("fx", null) || {};
fx = {
  activo: !!fx.activo,
  bandas: Array.isArray(fx.bandas) && fx.bandas.length === 5 ? fx.bandas.map(Number) : [0, 0, 0, 0, 0],
  graves: Number(fx.graves) || 0,
  espacial: [0, 1, 2, 3].indexOf(fx.espacial) >= 0 ? fx.espacial : 0,
  sala: Math.min(100, Math.max(0, Number(fx.sala) || 0)),
  parejo: !!fx.parejo
};
let ctx = null, filtros = [], graves = null, compresor = null, salida = null;
let gLL, gLR, gRL, gRR, ramaAncha = null, ramaInm = null, salaWet = null, hayInmersivo = false;
let fxMsg = null;
const refs = { bandas: [], chipsEsp: [] };

function mostrarMsg(texto) { if (fxMsg) fxMsg.textContent = texto; }
function respuestaSala(c) {
  const dur = 1.6, n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
  }
  return buf;
}
function crearGrafo(a) {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) throw new Error("sin audio avanzado");
  ctx = new AC();
  const fuenteN = ctx.createMediaElementSource(a);
  graves = ctx.createBiquadFilter();
  graves.type = "lowshelf";
  graves.frequency.value = 100;
  filtros = BANDAS.map((hz, i) => {
    const f = ctx.createBiquadFilter();
    f.type = i === 0 ? "lowshelf" : (i === BANDAS.length - 1 ? "highshelf" : "peaking");
    f.frequency.value = hz;
    if (f.type === "peaking") f.Q.value = 1;
    return f;
  });
  const divisor = ctx.createChannelSplitter(2);
  const union = ctx.createChannelMerger(2);
  gLL = ctx.createGain(); gLR = ctx.createGain(); gRL = ctx.createGain(); gRR = ctx.createGain();
  ramaAncha = ctx.createGain();
  ramaInm = ctx.createGain();
  const mezcla = ctx.createGain();
  compresor = ctx.createDynamicsCompressor();
  salida = ctx.createGain();
  let nodo = fuenteN;
  [graves].concat(filtros).forEach((n) => { nodo.connect(n); nodo = n; });
  nodo.connect(divisor);
  divisor.connect(gLL, 0); divisor.connect(gLR, 0);
  divisor.connect(gRL, 1); divisor.connect(gRR, 1);
  gLL.connect(union, 0, 0); gRL.connect(union, 0, 0);
  gLR.connect(union, 0, 1); gRR.connect(union, 0, 1);
  union.connect(ramaAncha);
  ramaAncha.connect(mezcla);
  hayInmersivo = false;
  try {
    const pL = ctx.createPanner(), pR = ctx.createPanner();
    [pL, pR].forEach((p) => {
      p.panningModel = "HRTF";
      p.distanceModel = "inverse";
      p.refDistance = 1;
    });
    pL.positionX.value = -1.2; pL.positionY.value = 0; pL.positionZ.value = -1.4;
    pR.positionX.value = 1.2; pR.positionY.value = 0; pR.positionZ.value = -1.4;
    divisor.connect(pL, 0);
    divisor.connect(pR, 1);
    pL.connect(ramaInm);
    pR.connect(ramaInm);
    ramaInm.connect(mezcla);
    hayInmersivo = true;
  } catch (e) {
    hayInmersivo = false;
  }
  mezcla.connect(compresor);
  compresor.connect(salida);
  try {
    const conv = ctx.createConvolver();
    conv.buffer = respuestaSala(ctx);
    salaWet = ctx.createGain();
    salaWet.gain.value = 0;
    mezcla.connect(conv);
    conv.connect(salaWet);
    salaWet.connect(salida);
  } catch (e) {
    salaWet = null;
  }
  salida.connect(ctx.destination);
}
function obtenerFx() {
  if (!audioFx) {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.preload = "auto";
    crearGrafo(a);
    engancharAudio(a);
    a.addEventListener("error", () => {
      if (audio !== a) return;
      fx.activo = false;
      guardar("fx", fx);
      pintarFx();
      mostrarMsg("No se pudieron aplicar los efectos a esta canción. Volví al sonido normal.");
      cambiarModo(false, true);
    });
    audioFx = a;
    aplicarFx();
  }
  return audioFx;
}
function elegirModo(conFx) {
  let nuevo = audioNormal;
  if (conFx && !mezclaActiva()) {
    try {
      nuevo = obtenerFx();
    } catch (e) {
      fx.activo = false;
      guardar("fx", fx);
      pintarFx();
      mostrarMsg("Tu navegador no permite efectos de sonido avanzados.");
      nuevo = audioNormal;
    }
  }
  if (nuevo === audio) return;
  audio.pause();
  audio = nuevo;
  audio.volume = Number(vol.value);
  audio.playbackRate = P.velocidad;
}
function cambiarModo(conFx, forzarPlay) {
  if (enMezcla) return;
  const origen = audio;
  const t = origen.currentTime || 0;
  const src = origen.src;
  const sonaba = !!forzarPlay || !origen.paused;
  elegirModo(conFx);
  if (audio === origen) return;
  if (ctx && ctx.state === "suspended") ctx.resume();
  if (!src) return;
  audio.src = src;
  const volver = () => {
    audio.removeEventListener("loadedmetadata", volver);
    try { audio.currentTime = t; } catch (e) {}
    if (sonaba) audio.play().catch(() => {});
  };
  audio.addEventListener("loadedmetadata", volver);
}
function aplicarFx() {
  guardar("fx", fx);
  pintarFx();
  if (!ctx) return;
  const t = ctx.currentTime;
  filtros.forEach((f, i) => f.gain.setTargetAtTime(fx.bandas[i], t, 0.03));
  graves.gain.setTargetAtTime(fx.graves, t, 0.03);
  const inmersivo = fx.espacial === 3 && hayInmersivo;
  const w = ANCHOS[Math.min(fx.espacial, 2)];
  const a = (1 + w) / 2, b = (1 - w) / 2;
  gLL.gain.setTargetAtTime(a, t, 0.03);
  gRR.gain.setTargetAtTime(a, t, 0.03);
  gRL.gain.setTargetAtTime(b, t, 0.03);
  gLR.gain.setTargetAtTime(b, t, 0.03);
  ramaAncha.gain.setTargetAtTime(inmersivo ? 0 : 1, t, 0.05);
  ramaInm.gain.setTargetAtTime(inmersivo ? 1 : 0, t, 0.05);
  if (salaWet) salaWet.gain.setTargetAtTime((fx.sala / 100) * 0.6, t, 0.05);
  if (fx.parejo) {
    compresor.threshold.value = -24;
    compresor.knee.value = 30;
    compresor.ratio.value = 3;
    compresor.attack.value = 0.005;
    compresor.release.value = 0.25;
    salida.gain.setTargetAtTime(1.25, t, 0.03);
  } else {
    compresor.threshold.value = 0;
    compresor.knee.value = 0;
    compresor.ratio.value = 1;
    salida.gain.setTargetAtTime(1, t, 0.03);
  }
}
function pintarFx() {
  if (!refs.sw) return;
  refs.sw.classList.toggle("on", fx.activo);
  refs.panel.classList.toggle("apagado", !fx.activo);
  refs.bandas.forEach((b, i) => {
    b.r.value = fx.bandas[i];
    b.val.textContent = fx.bandas[i];
    b.r.style.setProperty("--p", ((fx.bandas[i] + 12) / 24) * 100 + "%");
  });
  refs.graves.r.value = fx.graves;
  refs.graves.val.textContent = fx.graves;
  refs.graves.r.style.setProperty("--p", (fx.graves / 12) * 100 + "%");
  refs.sala.r.value = fx.sala;
  refs.sala.val.textContent = fx.sala;
  refs.sala.r.style.setProperty("--p", fx.sala + "%");
  refs.chipsEsp.forEach((c, i) => c.classList.toggle("activo", i === fx.espacial));
  refs.parejo.classList.toggle("on", fx.parejo);
}
function filaRango(etq, min, max, alCambiar) {
  const f = el("div", "banda");
  const r = el("input", "rango fino");
  r.type = "range"; r.min = min; r.max = max; r.step = 1; r.value = 0;
  const val = el("span", "val", "0");
  r.addEventListener("input", () => alCambiar(Number(r.value)));
  f.append(el("span", null, etq), r, val);
  return { fila: f, r: r, val: val };
}
function construirAjustesSonido() {
  const wrap = $("fxContenedor");
  if (!wrap) return;
  const caja = el("div", "panel lista-aj");
  const fila = el("div", "fila-aj");
  fila.append(el("span", null, "Efectos de sonido"));
  refs.sw = el("button", "interruptor");
  refs.sw.addEventListener("click", () => {
    fx.activo = !fx.activo;
    guardar("fx", fx);
    pintarFx();
    mostrarMsg(fx.activo ? "Efectos activados." : "Efectos desactivados.");
    cambiarModo(fx.activo);
  });
  fila.append(refs.sw);
  caja.append(fila);
  fxMsg = el("p", "nota pad", "Actívalos para usar el ecualizador, el audio espacial y la sala. Con la mezcla automática activa no se aplican.");
  caja.append(fxMsg);
  wrap.append(caja);

  refs.panel = el("div", "fxpanel");
  refs.panel.append(el("h2", null, "Ecualizador"));
  const chipsPre = el("div", "chips");
  Object.keys(PRESETS).forEach((nombre) => {
    const b = el("button", "chip", nombre);
    b.addEventListener("click", () => { fx.bandas = PRESETS[nombre].slice(); aplicarFx(); });
    chipsPre.append(b);
  });
  refs.panel.append(chipsPre);
  const cajaEq = el("div", "panel lista-aj");
  BANDAS.forEach((hz, i) => {
    const o = filaRango(hz >= 1000 ? hz / 1000 + " kHz" : hz + " Hz", -12, 12, (v) => { fx.bandas[i] = v; aplicarFx(); });
    cajaEq.append(o.fila);
    refs.bandas.push({ r: o.r, val: o.val });
  });
  refs.panel.append(cajaEq);
  refs.panel.append(el("h2", null, "Graves y sala"));
  const cajaG = el("div", "panel lista-aj");
  const og = filaRango("Graves", 0, 12, (v) => { fx.graves = v; aplicarFx(); });
  const os = filaRango("Sala", 0, 100, (v) => { fx.sala = v; aplicarFx(); });
  cajaG.append(og.fila, os.fila);
  refs.graves = { r: og.r, val: og.val };
  refs.sala = { r: os.r, val: os.val };
  refs.panel.append(cajaG);
  refs.panel.append(el("h2", null, "Audio espacial"));
  const chipsEsp = el("div", "chips");
  NOMBRES_ESP.forEach((n, i) => {
    const b = el("button", "chip", n);
    b.addEventListener("click", () => { fx.espacial = i; aplicarFx(); });
    chipsEsp.append(b);
    refs.chipsEsp.push(b);
  });
  refs.panel.append(chipsEsp);
  refs.panel.append(el("p", "nota", "Simula un sonido envolvente (se nota más con audífonos). No es Dolby Atmos, que no está disponible en páginas web."));
  const cajaP = el("div", "panel lista-aj");
  const fp = el("div", "fila-aj");
  fp.append(el("span", null, "Volumen parejo"));
  refs.parejo = el("button", "interruptor");
  refs.parejo.addEventListener("click", () => { fx.parejo = !fx.parejo; aplicarFx(); });
  fp.append(refs.parejo);
  cajaP.append(fp);
  refs.panel.append(cajaP);
  wrap.append(refs.panel);
  pintarFx();
}

/* ===== Reproducción ===== */
let ultimaPortadaColor = "";
function extraerColores(url) {
  return new Promise((resolve) => {
    try {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => {
        try {
          const cv = document.createElement("canvas");
          cv.width = 12; cv.height = 12;
          const g = cv.getContext("2d");
          g.drawImage(im, 0, 0, 12, 12);
          const d = g.getImageData(0, 0, 12, 12).data;
          const zonas = [[0, 0], [6, 0], [0, 6], [6, 6]].map((z) => {
            let r = 0, gg = 0, b = 0, n = 0;
            for (let y = z[1]; y < z[1] + 6; y++) for (let x = z[0]; x < z[0] + 6; x++) {
              const i = (y * 12 + x) * 4;
              r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++;
            }
            return [Math.round(r / n), Math.round(gg / n), Math.round(b / n)];
          });
          resolve(zonas);
        } catch (e) { resolve(null); }
      };
      im.onerror = () => resolve(null);
      im.src = url;
    } catch (e) { resolve(null); }
  });
}
function realzar(c) {
  const m = Math.max(c[0], c[1], c[2]) || 1;
  const k = Math.min(2.2, 210 / m);
  return "rgb(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + ")";
}
async function pintarColoresCancion(c) {
  if (!P.fondoPortada) return;
  const url = c.portada;
  ultimaPortadaColor = url;
  const z = await extraerColores(url);
  if (!z || ultimaPortadaColor !== url) return;
  const orden = z.slice().sort((a, b) => (Math.max(b[0], b[1], b[2]) - Math.min(b[0], b[1], b[2])) - (Math.max(a[0], a[1], a[2]) - Math.min(a[0], a[1], a[2])));
  fondoVivo.style.setProperty("--k1", realzar(orden[0]));
  fondoVivo.style.setProperty("--k2", realzar(orden[1]));
  fondoVivo.style.setProperty("--k3", realzar(orden[2]));
}
function pintarFiesta() {
  const v = $("v-dj");
  v.classList.toggle("fiesta-on", !!P.fiestaDJ && djOn);
  v.classList.toggle("sonando-dj", djOn && !audio.paused);
}
function mostrarCancion(c) {
  pTitulo.textContent = sTitulo.textContent = c.trackName;
  pArtista.textContent = sArtista.textContent = c.artistName;
  pPortada.src = sPortada.src = sGlow.src = c.portada;
  const css = 'url("' + c.portada + '")';
  sheet.style.setProperty("--portada", css);
  fondoVivo.style.setProperty("--portada-bg", css);
  $("v-dj").style.setProperty("--portada-bg", css);
  auraPortada.classList.toggle("on", !!P.fondoPortada);
  pintarColoresCancion(c);
  sCalidad.textContent = "Adelanto de 30 s · " + (c.fuente === "deezer" ? "Deezer" : "iTunes");
  marcarFav();
  if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: c.trackName, artist: c.artistName,
      artwork: [{ src: c.portada, sizes: "600x600", type: "image/jpeg" }]
    });
  }
  if (P.letrasAuto) buscarLetra(c).catch(() => {});
  if (!panelCola.hidden) pintarCola();
  if (!panelMas.hidden) pintarMas();
  if (!panelLetra.hidden) cargarLetra();
  pintarDJ();
  pintarDecks();
}
function registrarReproduccion(c) {
  stats.plays += 1;
  guardar("stats", stats);
  if (P.guardarHist) {
    historial = [c].concat(historial.filter((h) => h.trackId !== c.trackId)).slice(0, 30);
    guardar("historial", historial);
  }
}
function detenerMezcla() {
  clearInterval(rampaT);
  rampaT = null;
  enMezcla = false;
}
function reproducirDe(arreglo, i) {
  if (djOn) djParar();
  lista = arreglo.slice();
  reproducir(i);
}
function reproducir(i) {
  const c = lista[i];
  if (!c) return;
  detenerMezcla();
  actual = i;
  const mio = ++pedidoPlay;
  audioB.pause();
  elegirModo(fx.activo);
  if (ctx && ctx.state === "suspended") ctx.resume();
  ultimoT = 0;
  c._reint = false;
  mostrarCancion(c);
  registrarReproduccion(c);
  urlDe(c).then((url) => {
    if (mio !== pedidoPlay) return;
    audio.src = url;
    audio.playbackRate = P.velocidad;
    audio.play().catch(() => {});
  }).catch(() => {
    if (mio === pedidoPlay) aviso("Esta canción no tiene adelanto disponible.");
  });
}
function alternar() {
  if (!audio.src || enMezcla) return;
  if (ctx && ctx.state === "suspended") ctx.resume();
  if (audio.paused) audio.play().catch(() => {}); else audio.pause();
}
async function proximoIdx() {
  if (actual + 1 < lista.length) return actual + 1;
  if (djOn) {
    await djRellenar();
    if (actual + 1 < lista.length) return actual + 1;
  }
  return 0;
}
function avanzar() {
  if (!lista.length || enMezcla) return;
  enMezcla = true;
  proximoIdx().then((idx) => {
    if (djOn) djCuenta += 1;
    const suena = !!audio.src && !audio.paused;
    const hablaAhora = djOn && P.djVoz && djCuenta % P.djCada === 0;
    if (hablaAhora || (suena && mezclaActiva())) cruzar(idx, hablaAhora);
    else { enMezcla = false; reproducir(idx); }
  }).catch(() => { enMezcla = false; });
}
function siguiente() { avanzar(); }
function anterior() {
  if (!lista.length || enMezcla) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  reproducir(actual - 1 < 0 ? lista.length - 1 : actual - 1);
}
function icono(sonando) {
  pBoton.innerHTML = sPlay.innerHTML = sonando ? ICO_PAUSA : ICO_PLAY;
  sheet.classList.toggle("sonando", !!sonando);
  $("djCard").classList.toggle("sonando", !!sonando && djOn);
  pintarFiesta();
}
function formato(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  return m + ":" + (seg < 10 ? "0" : "") + seg;
}
function pintarBarra() { barra.style.setProperty("--p", barra.value + "%"); }

/* ===== Mezcla automática (cruce entre canciones) ===== */
function rampa(seg, fn) {
  return new Promise((resolve) => {
    clearInterval(rampaT);
    const pasos = Math.max(1, Math.round(seg * 20));
    let k = 0;
    rampaT = setInterval(() => {
      k += 1;
      fn(Math.min(1, k / pasos));
      if (k >= pasos) {
        clearInterval(rampaT);
        rampaT = null;
        resolve();
      }
    }, 50);
  });
}
function comprobarMezcla(a) {
  if (repetirUna || enMezcla || !a.duration || !isFinite(a.duration)) return;
  const umbral = mezclaActiva() ? P.mezclaSeg + 0.25 : (djOn && P.djVoz ? 0.6 : 0);
  if (!umbral || a.duration - a.currentTime > umbral) return;
  if (lista.length < 2 && !djOn) return;
  avanzar();
}
function posXfader(v) { const x = $("xfader"); if (x) { x.value = v; x.style.setProperty("--p", v + "%"); } }
async function cruzar(idx, charla) {
  const c = lista[idx];
  if (!c) { enMezcla = false; return; }
  const sale = audio;
  const entra = sale === audioNormal ? audioB : audioNormal;
  const master = Number(vol.value) || 1;
  const mio = pedidoPlay;
  const seg = mezclaActiva() ? P.mezclaSeg : 0.4;
  let url;
  try {
    url = await urlDe(c);
  } catch (e) {
    enMezcla = false;
    aviso("No se pudo cargar la siguiente canción.");
    return;
  }
  if (mio !== pedidoPlay) { enMezcla = false; return; }
  entra.src = url;
  entra.volume = 0;
  entra.playbackRate = P.velocidad;
  if (charla) {
    await rampa(1.2, (t) => { sale.volume = clamp01((1 - t) * master); posXfader(Math.round(t * 40)); });
    sale.pause();
    djEstado("El DJ Vendezú te habla...");
    await hablarDJ("Lo que sigue: " + c.trackName + ", de " + c.artistName + ".", P.djHablaSeg * 1000);
    if (mio !== pedidoPlay) { enMezcla = false; return; }
    audio = entra;
    ultimoT = 0;
    entra.play().catch(() => {});
    icono(true);
    await rampa(1.2, (t) => { entra.volume = clamp01(t * master); posXfader(40 + Math.round(t * 60)); });
  } else {
    entra.play().catch(() => {});
    await rampa(seg, (t) => {
      entra.volume = clamp01(t * master);
      sale.volume = clamp01((1 - t) * master);
      posXfader(Math.round(t * 100));
    });
    if (mio !== pedidoPlay) { enMezcla = false; return; }
    audio = entra;
    ultimoT = entra.currentTime || 0;
    sale.pause();
  }
  sale.volume = master;
  entra.volume = master;
  actual = idx;
  enMezcla = false;
  posXfader(0);
  mostrarCancion(c);
  registrarReproduccion(c);
  icono(!audio.paused);
  if (djOn) djEstado("Sonando: " + c.trackName + " · " + c.artistName);
  pintarDJ();
}

/* ===== DJ Vendezú ===== */
function vozEspanola() {
  try {
    const vs = speechSynthesis.getVoices() || [];
    return vs.find((v) => /^es/i.test(v.lang)) || null;
  } catch (e) { return null; }
}
function hablarDJ(texto, maxMs) {
  return new Promise((resolve) => {
    if (!P.djVoz) { resolve(); return; }
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      aviso("Tu navegador no tiene voz: el DJ solo pone música.");
      resolve();
      return;
    }
    let listo = false;
    let corte = null;
    const cerrar = () => {
      if (listo) return;
      listo = true;
      if (corte) clearTimeout(corte);
      resolve();
    };
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES";
    u.rate = 1.05;
    const v = vozEspanola();
    if (v) u.voice = v;
    u.onend = cerrar;
    u.onerror = cerrar;
    corte = setTimeout(() => {
      try { speechSynthesis.cancel(); } catch (e) {}
      cerrar();
    }, maxMs);
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {
      cerrar();
    }
  });
}
const GENEROS_DJ = ["reggaeton", "trap latino", "salsa", "cumbia", "pop latino", "bachata", "hip hop", "baladas", "merengue", "rock en español"];
async function djBuscarExtra() {
  const elegidos = shuffle(GENEROS_DJ.slice()).slice(0, 2);
  let res = [];
  for (const g of elegidos) {
    try { res = res.concat(await buscarCatalogo(g)); } catch (e) {}
  }
  return res;
}
async function djRellenar() {
  if (djRellenando) return;
  djRellenando = true;
  try {
    const enCola = new Set(lista.map((c) => c.trackId));
    let pool = unicos(shuffle(favoritos.concat(historial))).filter((c) => !enCola.has(c.trackId));
    if (pool.length < 4) {
      const extra = unicos(await djBuscarExtra()).filter((c) => !enCola.has(c.trackId));
      pool = unicos(pool.concat(shuffle(extra)));
    }
    const tomar = pool.slice(0, 10);
    if (tomar.length) lista = lista.concat(tomar);
  } catch (e) {
    aviso("El DJ no pudo buscar más música.");
  } finally {
    djRellenando = false;
  }
}
function djEstado(texto) { $("djEstado").textContent = texto; }
function pintarDJ() {
  $("djEmpezar").disabled = djOn;
  $("djSig").disabled = !djOn;
  $("djParar").disabled = !djOn;
  const c = lista[actual];
  $("djCard").classList.toggle("sonando", djOn && !!c && !audio.paused);
  pintarFiesta();
  $("djPortada").hidden = !c;
  if (c) {
    $("djPortada").src = c.portada;
    $("djTitulo").textContent = c.trackName;
    $("djArtista").textContent = c.artistName;
  }
  if (!djOn) djEstado("Toca Empezar: el DJ te saluda, pone tu música y te habla cada " + P.djCada + " canciones.");
}
function pintarDecks() {
  const a = lista[actual];
  const b = lista[actual + 1];
  $("deckAImg").src = a ? a.portadaPeq : "";
  $("deckBImg").src = b ? b.portadaPeq : "";
  $("deckATxt").textContent = a ? a.trackName : "Plato A";
  $("deckBTxt").textContent = b ? b.trackName : "Plato B";
}
function pintarMixes() {
  const cont = $("mixes");
  cont.innerHTML = "";
  const tarjetas = [];
  if (favoritos.length) tarjetas.push({ t: "Mix 1 · Favoritas", s: favoritos.length + " canciones", lista: favoritos.slice(0, 15), img: favoritos[0].portadaPeq });
  if (historial.length) tarjetas.push({ t: "Mix 2 · Recientes", s: historial.length + " canciones", lista: historial.slice(0, 15), img: historial[0].portadaPeq });
  tarjetas.push({ t: "Mix del DJ", s: "El DJ arma la cola", lista: null, img: "" });
  tarjetas.forEach((m) => {
    const b = el("button", "mix");
    const cov = el("span", "mix-cov");
    if (m.img) {
      const im = el("img");
      im.src = m.img;
      im.alt = "";
      cov.append(im);
    }
    cov.append(el("span", "mix-play", "▶"));
    b.append(cov, el("b", null, m.t), el("small", null, m.s));
    b.addEventListener("click", () => { if (m.lista) reproducirDe(m.lista, 0); else djEmpezar(); });
    cont.append(b);
  });
}
async function djEmpezar() {
  if (djOn) return;
  djOn = true;
  djCuenta = 0;
  pintarDJ();
  djEstado("Preparando tu música...");
  detenerMezcla();
  audio.pause();
  audioB.pause();
  lista = [];
  await djRellenar();
  if (!lista.length) {
    djOn = false;
    pintarDJ();
    aviso("No encontré música para empezar. Busca algo primero.");
    return;
  }
  const nombre = P.nombre.trim().split(" ")[0];
  djEstado("Te saluda el DJ Vendezú...");
  await hablarDJ("Hola" + (nombre ? " " + nombre : "") + ", soy el DJ Vendezú. Aquí va tu música.", P.djHablaSeg * 1000);
  reproducir(0);
  djEstado("Sonando: " + lista[0].trackName + " · " + lista[0].artistName);
  pintarDJ();
}
function djParar() {
  djOn = false;
  pintarDJ();
  djEstado("DJ apagado. La música sigue sonando normal.");
}

/* ===== Pantalla de reproducción ===== */
function abrirSheet() {
  if (!audio.src) { aviso("Toca una canción primero."); return; }
  sheet.classList.add("abierta");
  panelLetra.hidden = !P.letraVisible;
  if (P.letraVisible) cargarLetra();
  marcarFav();
}
function cerrarSheet() {
  sheet.classList.remove("abierta");
  sheet.style.transform = "";
  cerrarHojas();
}
function cerrarHojas() {
  panelCola.hidden = true;
  panelMas.hidden = true;
}
player.addEventListener("click", abrirSheet);
let y0 = null;
grab.addEventListener("pointerdown", (e) => {
  y0 = e.clientY;
  sheet.style.transition = "none";
  grab.setPointerCapture(e.pointerId);
});
grab.addEventListener("pointermove", (e) => {
  if (y0 === null) return;
  const dy = Math.max(0, e.clientY - y0);
  sheet.style.transform = "translateY(" + dy + "px)";
});
grab.addEventListener("pointerup", (e) => {
  if (y0 === null) return;
  const dy = e.clientY - y0;
  y0 = null;
  sheet.style.transition = "";
  if (dy > 120 || dy < 5) cerrarSheet();
  else sheet.style.transform = "";
});
function bindTilt() {
  const mover = (e) => {
    if (!P.efecto3d) return;
    const r = portada3d.getBoundingClientRect();
    const w = r.width || 1, h = r.height || 1;
    const x = (e.clientX - r.left) / w - 0.5;
    const y = (e.clientY - r.top) / h - 0.5;
    portada3d.style.setProperty("--ry", (x * 26).toFixed(1) + "deg");
    portada3d.style.setProperty("--rx", (-y * 26).toFixed(1) + "deg");
    portada3d.style.setProperty("--esc", "1.04");
  };
  const soltar = () => {
    portada3d.style.setProperty("--rx", "0deg");
    portada3d.style.setProperty("--ry", "0deg");
    portada3d.style.setProperty("--esc", "1");
  };
  portada3d.addEventListener("pointerdown", (e) => {
    if (portada3d.setPointerCapture) portada3d.setPointerCapture(e.pointerId);
    mover(e);
  });
  portada3d.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "touch") mover(e); });
  portada3d.addEventListener("pointerup", soltar);
  portada3d.addEventListener("pointercancel", soltar);
  portada3d.addEventListener("pointerleave", soltar);

  const escenaDJ = document.querySelector("#djCard .escena3d");
  const dj = $("djCard");
  if (escenaDJ && dj) {
    let rafDJ = 0, ultimoDJ = null;
    const moverDJ = (e) => {
      if (!P.parallaxDJ || !P.efecto3d || P.calidad === "ahorro") return;
      ultimoDJ = e;
      if (rafDJ) return;
      rafDJ = requestAnimationFrame(() => {
        rafDJ = 0;
        if (!ultimoDJ) return;
        const r = escenaDJ.getBoundingClientRect();
        const px = (ultimoDJ.clientX - r.left) / (r.width || 1) - .5;
        const py = (ultimoDJ.clientY - r.top) / (r.height || 1) - .5;
        escenaDJ.style.setProperty("--dj-rx", (-py * 13).toFixed(1) + "deg");
        escenaDJ.style.setProperty("--dj-ry", (px * 16).toFixed(1) + "deg");
      });
    };
    const resetDJ = () => {
      escenaDJ.style.setProperty("--dj-rx", "0deg");
      escenaDJ.style.setProperty("--dj-ry", "0deg");
    };
    escenaDJ.addEventListener("pointerdown", moverDJ, { passive: true });
    escenaDJ.addEventListener("pointermove", (e) => {
      if (e.buttons || e.pointerType === "touch") moverDJ(e);
    }, { passive: true });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => escenaDJ.addEventListener(ev, resetDJ, { passive: true }));
  }

  // Reflejo especular localizado: solo actualiza variables transformables y una vez por frame.
  let brilloPendiente = null, brilloRAF = 0;
  document.addEventListener("pointermove", (e) => {
    if (!P.reflejoTactil || P.calidad === "ahorro" || P.sinRend) return;
    const target = e.target.closest(".panel, .album .cov, .mix-cov, .cat, .dj-btn, .card");
    if (!target) return;
    brilloPendiente = { target, x: e.clientX, y: e.clientY };
    if (brilloRAF) return;
    brilloRAF = requestAnimationFrame(() => {
      brilloRAF = 0;
      if (!brilloPendiente || !brilloPendiente.target.isConnected) return;
      const d = brilloPendiente, r = d.target.getBoundingClientRect();
      d.target.style.setProperty("--shine-x", ((d.x - r.left) / (r.width || 1) * 100).toFixed(1) + "%");
      d.target.style.setProperty("--shine-y", ((d.y - r.top) / (r.height || 1) * 100).toFixed(1) + "%");
    });
  }, { passive: true });
}

/* ===== Letra sincronizada (LRCLIB) ===== */
function parseLRC(txt) {
  const out = [];
  String(txt).split("\n").forEach((linea) => {
    const m = linea.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (m && m[3].trim()) out.push({ t: Number(m[1]) * 60 + Number(m[2]), x: m[3].trim() });
  });
  return out.sort((a, b) => a.t - b.t);
}
async function buscarLetra(c) {
  const clave = c.trackName + "|" + c.artistName;
  if (letrasMem.has(clave)) return letrasMem.get(clave);
  let res = null;
  try {
    const r = await fetch("https://lrclib.net/api/search?track_name=" + encodeURIComponent(c.trackName) + "&artist_name=" + encodeURIComponent(c.artistName));
    const arr2 = await r.json();
    const lista2 = Array.isArray(arr2) ? arr2 : [];
    const hit = lista2.find((x) => x.syncedLyrics) || lista2.find((x) => x.plainLyrics);
    if (hit && hit.syncedLyrics) res = { sync: parseLRC(hit.syncedLyrics) };
    else if (hit && hit.plainLyrics) res = { plain: hit.plainLyrics };
  } catch (e) {
    return null;
  }
  letrasMem.set(clave, res);
  return res;
}
async function cargarLetra() {
  const c = lista[actual];
  if (!c) return;
  const clave = c.trackName + "|" + c.artistName;
  if (clave !== letraClave) {
    letraClave = clave;
    letraActual = null;
    letraIdx = -1;
    letraAct.textContent = "Buscando letra...";
    letraPrev.textContent = "";
    letraNext.textContent = "";
    letraPlain.hidden = true;
    letraNota.textContent = "";
    const res = await buscarLetra(c);
    if (clave !== letraClave) return;
    letraActual = res;
  }
  pintarLetra();
}
function pintarLetra() {
  letraPrev.textContent = "";
  letraNext.textContent = "";
  letraPlain.hidden = true;
  if (!letraActual) {
    letraAct.textContent = "No encontré letra para esta canción.";
    letraNota.textContent = "Las letras vienen de LRCLIB. No todas las canciones tienen.";
    return;
  }
  if (letraActual.plain) {
    letraAct.textContent = "";
    letraPlain.textContent = letraActual.plain;
    letraPlain.hidden = false;
    letraNota.textContent = "Letra sin sincronizar.";
    return;
  }
  letraNota.textContent = "Letra sincronizada.";
  letraIdx = -1;
  actualizarLetra(audio.currentTime || 0);
}
function actualizarLetra(t) {
  if (!letraActual || !letraActual.sync || panelLetra.hidden) return;
  const L = letraActual.sync;
  let i = -1;
  for (let k = 0; k < L.length; k++) {
    if (L[k].t <= t + 0.2) i = k; else break;
  }
  if (i === letraIdx) return;
  letraIdx = i;
  letraPrev.textContent = i > 0 ? L[i - 1].x : "";
  letraAct.textContent = i >= 0 ? L[i].x : "♪";
  letraNext.textContent = i + 1 < L.length ? L[i + 1].x : "";
}

/* ===== Cola y más opciones ===== */
function pintarCola() {
  colaLista.innerHTML = "";
  if (!lista.length) { colaLista.textContent = "La cola está vacía."; return; }
  lista.forEach((c, i) => {
    const f = filaCancion(c, () => { cerrarHojas(); reproducir(i); });
    if (i === actual) f.classList.add("actual");
    colaLista.append(f);
  });
}
async function radioArtista(c) {
  try {
    const d = await jsonp("https://api.deezer.com/search/artist?q=" + encodeURIComponent(c.artistName) + "&limit=1");
    const a = d && d.data && d.data[0];
    if (!a) throw new Error("sin artista");
    const top = listaDeezer(await jsonp("https://api.deezer.com/artist/" + a.id + "/top?limit=30"));
    if (!top.length) throw new Error("vacío");
    panelMas.hidden = true;
    reproducirDe(shuffle(top), 0);
    aviso("Radio de " + c.artistName);
  } catch (e) {
    aviso("No se pudo crear la radio.");
  }
}
function reproducirDespues(c) {
  if (!c) return;
  lista.splice(actual + 1, 0, c);
  aviso("Sonará después de esta canción.");
  pintarCola();
  pintarDecks();
}
function agregarCola(c) {
  if (!c) return;
  lista.push(c);
  aviso("Añadida a la cola.");
  pintarCola();
}
function mezclarCola() {
  lista = lista.slice(0, actual + 1).concat(shuffle(lista.slice(actual + 1)));
  aviso("Cola mezclada.");
  pintarCola();
  pintarDecks();
}
function ciclarVelocidad() {
  const i = VELS.indexOf(P.velocidad);
  P.velocidad = VELS[(i + 1) % VELS.length];
  cambiarPref("velocidad");
}
function ciclarSleep() {
  sleepIdx = (sleepIdx + 1) % SLEEP_OPC.length;
  clearTimeout(sleepT);
  sleepT = null;
  const min = SLEEP_OPC[sleepIdx];
  if (min) {
    sleepT = setTimeout(() => {
      audio.pause();
      audioB.pause();
      aviso("La música se apagó con el temporizador.");
    }, min * 60000);
    aviso("Se apagará en " + min + " min.");
  } else {
    aviso("Temporizador apagado.");
  }
  pintarMas();
}
function pintarMas() {
  masLista.innerHTML = "";
  const c = lista[actual];
  if (!c) { masLista.textContent = "Toca una canción primero."; return; }
  const filas = [
    [esFavorita(c) ? "Quitar de favoritas" : "Añadir a favoritas", () => alternarFav()],
    ["Reproducir después", () => reproducirDespues(c)],
    ["Añadir a la cola", () => agregarCola(c)],
    ["Mezclar la cola", () => mezclarCola()],
    ["Ver letra", () => { panelMas.hidden = true; panelLetra.hidden = false; cargarLetra(); }],
    ["Añadir a una lista...", () => agregarALista(c)],
    ["Ir a " + c.artistName, () => irArtista(c.artistName)],
    ["Ver el álbum" + (c.albumName ? ": " + c.albumName : ""), () => { if (c.albumId) { panelMas.hidden = true; abrirAlbumDeezer({ id: c.albumId, cover_medium: c.portadaPeq, cover_xl: c.portada, cover_big: c.portada, title: c.albumName }); } else aviso("No tengo el álbum de esta canción."); }],
    ["Radio de " + c.artistName, () => radioArtista(c)],
    ["Velocidad: " + P.velocidad + "×", () => ciclarVelocidad()],
    ["Repetir esta canción: " + (repetirUna ? "sí" : "no"), () => { repetirUna = !repetirUna; pintarMas(); }],
    ["Apagar después de: " + (SLEEP_OPC[sleepIdx] ? SLEEP_OPC[sleepIdx] + " min" : "no"), () => ciclarSleep()],
    ["Compartir para escuchar juntos", () => compartir()]
  ];
  filas.forEach((f) => {
    const b = el("button", "fila-aj", f[0]);
    b.addEventListener("click", f[1]);
    masLista.append(b);
  });
}

/* ===== Escuchar juntos (enlace que abre la misma canción) ===== */
function enlaceCompartir(c) {
  const dato = { f: c.fuente, i: c.fuente === "deezer" ? c.dzId : c.trackId };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(dato))));
  return location.origin + location.pathname + "#juntos=" + b64;
}
async function compartir() {
  const c = lista[actual];
  if (!c) { aviso("Toca una canción primero."); return; }
  const url = enlaceCompartir(c);
  const texto = "Escucha " + c.trackName + " de " + c.artistName + " conmigo.";
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: c.trackName, text: texto, url: url });
      return;
    } catch (e) {}
  }
  try {
    await navigator.clipboard.writeText(url);
    aviso("Enlace copiado. Mándalo para escuchar juntos.");
  } catch (e) {
    aviso("Copia este enlace: " + url);
  }
}
async function leerEnlace() {
  const h = location.hash || "";
  if (h.indexOf("#juntos=") !== 0) return;
  try {
    const dato = JSON.parse(decodeURIComponent(escape(atob(h.slice(8)))));
    let t = null;
    if (dato.f === "deezer") {
      const d = await jsonp("https://api.deezer.com/track/" + dato.i);
      if (d && d.id) t = deezerATrack(d);
    } else {
      const r = await fetch("https://itunes.apple.com/lookup?id=" + encodeURIComponent(dato.i));
      const d = await r.json();
      const it = (d.results || []).find((x) => x.previewUrl);
      if (it) t = normalizar(it);
    }
    if (!t) { aviso("No encontré esa canción."); return; }
    reproducirDe([t], 0);
    aviso("Escuchando juntos: " + t.trackName);
  } catch (e) {
    aviso("El enlace no se pudo abrir.");
  }
}

/* ===== Eventos de audio y controles ===== */
function engancharAudio(a) {
  a.addEventListener("play", () => { if (a === audio) icono(true); });
  a.addEventListener("pause", () => { if (a === audio) icono(false); });
  a.addEventListener("ended", () => {
    if (a !== audio) return;
    if (repetirUna) { a.currentTime = 0; a.play().catch(() => {}); return; }
    avanzar();
  });
  a.addEventListener("loadedmetadata", () => {
    if (a === audio) tTot.textContent = "-" + formato(a.duration);
  });
  a.addEventListener("error", () => {
    if (a !== audio || a !== audioNormal || !a.getAttribute("src")) return;
    const c = lista[actual];
    if (c && !c._reint) {
      c._reint = true;
      renovarPreview(c).then((u) => {
        if (u && lista[actual] === c) { a.src = u; a.play().catch(() => {}); }
        else aviso("No se pudo reproducir esta canción.");
      });
      return;
    }
    aviso("No se pudo reproducir esta canción.");
  });
  a.addEventListener("timeupdate", () => {
    if (a !== audio) return;
    sumarEscucha(a);
    comprobarMezcla(a);
    actualizarLetra(a.currentTime);
    if (arrastrando || !a.duration) return;
    barra.value = (a.currentTime / a.duration) * 100;
    tAct.textContent = formato(a.currentTime);
    tTot.textContent = "-" + formato(a.duration - a.currentTime);
    pintarBarra();
  });
}
barra.addEventListener("input", () => {
  arrastrando = true;
  pintarBarra();
  if (audio.duration) {
    const t = (barra.value / 100) * audio.duration;
    tAct.textContent = formato(t);
    tTot.textContent = "-" + formato(audio.duration - t);
  }
});
barra.addEventListener("change", () => {
  if (audio.duration) audio.currentTime = (barra.value / 100) * audio.duration;
  arrastrando = false;
});
vol.addEventListener("input", () => {
  audio.volume = Number(vol.value);
  vol.style.setProperty("--p", vol.value * 100 + "%");
});
vol.style.setProperty("--p", "100%");
pBoton.addEventListener("click", (e) => { e.stopPropagation(); alternar(); });
sPlay.addEventListener("click", alternar);
pSig.innerHTML = ICO_SIG;
pSig.addEventListener("click", (e) => { e.stopPropagation(); siguiente(); });
next.addEventListener("click", siguiente);
prev.addEventListener("click", anterior);
$("djEmpezar").addEventListener("click", djEmpezar);
$("djSig").addEventListener("click", siguiente);
$("djParar").addEventListener("click", djParar);
$("btnLetra").addEventListener("click", () => {
  panelLetra.hidden = !panelLetra.hidden;
  if (!panelLetra.hidden) cargarLetra();
});
$("btnCola").addEventListener("click", () => { cerrarHojas(); panelCola.hidden = false; pintarCola(); });
$("btnMas").addEventListener("click", () => { cerrarHojas(); panelMas.hidden = false; pintarMas(); });
$("btnMasTop").addEventListener("click", () => { cerrarHojas(); panelMas.hidden = false; pintarMas(); });
$("btnJuntos").addEventListener("click", compartir);
$("cerrarCola").addEventListener("click", () => { panelCola.hidden = true; });
$("cerrarMas").addEventListener("click", () => { panelMas.hidden = true; });

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("nexttrack", siguiente);
  navigator.mediaSession.setActionHandler("previoustrack", anterior);
}

/* ===== La barra de abajo se esconde al bajar ===== */
let ultimo = 0, scrollPend = false;
window.addEventListener("scroll", () => {
  if (scrollPend) return;
  scrollPend = true;
  requestAnimationFrame(() => {
    scrollPend = false;
    const y = window.scrollY;
    if (Math.abs(y - ultimo) < 8) return;
    fondoBajo.classList.toggle("oculta", y > ultimo && y > 60);
    ultimo = y;
  });
}, { passive: true });

/* ===== Icono de la aplicación ===== */
const ICONOS = [
  { n: "Original", a: "#ff4d6d", b: "#7b2ff7", c: "#1b1b3a" },
  { n: "Océano", a: "#22d3ee", b: "#2563eb", c: "#0b1b4a" },
  { n: "Bosque", a: "#4ade80", b: "#15803d", c: "#06280f" },
  { n: "Fuego", a: "#fbbf24", b: "#ea580c", c: "#4a1204" },
  { n: "Medianoche", a: "#4b5563", b: "#1f2937", c: "#05060a" },
  { n: "Cristal", a: "#ffffff", b: "#a5b4fc", c: "#4338ca" }
];
function dibujarIcono(tam, ic) {
  try {
    const cv = document.createElement("canvas");
    cv.width = tam; cv.height = tam;
    const g = cv.getContext("2d");
    if (!g) return "";
    const f = tam / 512;
    const fondo = g.createLinearGradient(0, 0, tam, tam);
    fondo.addColorStop(0, ic.a); fondo.addColorStop(0.55, ic.b); fondo.addColorStop(1, ic.c);
    g.fillStyle = fondo;
    g.fillRect(0, 0, tam, tam);
    g.beginPath();
    g.arc(256 * f, 256 * f, 150 * f, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.2)";
    g.fill();
    g.lineWidth = 3 * f;
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.stroke();
    g.fillStyle = "#fff";
    g.beginPath(); g.ellipse(215 * f, 330 * f, 34 * f, 25 * f, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(300 * f, 318 * f, 34 * f, 25 * f, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(238 * f, 175 * f, 14 * f, 155 * f);
    g.fillRect(323 * f, 160 * f, 14 * f, 158 * f);
    g.beginPath();
    g.moveTo(238 * f, 175 * f); g.lineTo(337 * f, 160 * f); g.lineTo(337 * f, 198 * f); g.lineTo(238 * f, 213 * f);
    g.closePath(); g.fill();
    return cv.toDataURL("image/png");
  } catch (e) { return ""; }
}
function aplicarIcono(i) {
  const ic = ICONOS[i] || ICONOS[0];
  const u192 = dibujarIcono(192, ic);
  const u512 = dibujarIcono(512, ic);
  if (!u192 || !u512) return;
  ["icon", "apple-touch-icon"].forEach((rel) => {
    const l = document.querySelector('link[rel="' + rel + '"]');
    if (l) l.href = u192;
  });
  try {
    const base = location.href.split("#")[0];
    const m = {
      name: "VNDZ I Love Music", short_name: "I Love Music", display: "standalone",
      start_url: new URL("./index.html", base).href, scope: new URL("./", base).href,
      background_color: "#07070b", theme_color: "#07070b",
      icons: [{ src: u192, sizes: "192x192", type: "image/png" }, { src: u512, sizes: "512x512", type: "image/png" }]
    };
    const blob = new Blob([JSON.stringify(m)], { type: "application/manifest+json" });
    const l = document.querySelector('link[rel="manifest"]');
    if (l) l.href = URL.createObjectURL(blob);
  } catch (e) {}
}
function construirIconos() {
  const cont = $("iconosGrid");
  if (!cont) return;
  cont.innerHTML = "";
  ICONOS.forEach((ic, i) => {
    const b = el("button", "icono-op");
    const im = el("img");
    im.src = dibujarIcono(144, ic) || "icon-192.png";
    im.alt = ic.n;
    b.append(im, el("small", null, ic.n));
    b.classList.toggle("activo", P.icono === i);
    b.addEventListener("click", () => {
      P.icono = i;
      cambiarPref("icono");
      cont.querySelectorAll(".icono-op").forEach((x, k) => x.classList.toggle("activo", k === i));
      aplicarIcono(i);
      aviso("Icono: " + ic.n);
    });
    cont.append(b);
  });
  if (P.icono > 0) aplicarIcono(P.icono);
}

/* ===== Arranque ===== */
q.addEventListener("input", () => {
  clearTimeout(espera);
  pintarBusqRec();
  espera = setTimeout(buscar, 500);
});
q.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { clearTimeout(espera); buscar(); }
});
engancharAudio(audioNormal);
engancharAudio(audioB);
bindPrefs();
bindTilt();
aplicarPrefs();
aplicarVelocidad();
construirExplorar();
construirFuentes();
construirAjustesSonido();
pintarInicio();
pintarMixes();
pintarSugerencias("djSugs");
pintarDJ();
pintarDecks();
pintarResumen();
pintarEscuchadas();
pintarListas();
construirIconos();
icono(false);
moverPildora("inicio");
setTimeout(() => moverPildora(vistaActual), 150);
setTimeout(leerEnlace, 700);

/* ===== Instalación y modo sin conexión (PWA) ===== */
if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
