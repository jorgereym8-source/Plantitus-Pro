/* Núcleo de Plantitus Pro: datos, fechas, tareas, fotos, Wikipedia, tiempo e IA. */
import { TIPOS, SITIOS_INICIALES } from './contenido.js';

export const VERSION = '1.1.0';

/* ---------- utilidades ---------- */
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
export const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const store = {
  get(k, def) { try { const v = localStorage.getItem('pp.' + k); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('pp.' + k, JSON.stringify(v)); } catch (e) { console.warn('No se pudo guardar', k, e); } },
  del(k) { try { localStorage.removeItem('pp.' + k); } catch { /* nada */ } },
};

/* ---------- fechas (siempre «AAAA-MM-DD» en hora local) ---------- */
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export function iso(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
export const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const hoy = () => iso(new Date());
export const sumar = (s, dias) => { const d = parse(s); d.setDate(d.getDate() + dias); return iso(d); };
export const difDias = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
export function fechaLarga(s) {
  const d = parse(s), h = hoy();
  const dd = difDias(h, s);
  if (dd === 0) return 'Hoy';
  if (dd === 1) return 'Mañana';
  if (dd === -1) return 'Ayer';
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
export function haceTxt(s) {
  const n = difDias(s, hoy());
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  if (n < 30) return `hace ${n} días`;
  const m = Math.round(n / 30);
  return m < 12 ? `hace ${m} ${m === 1 ? 'mes' : 'meses'}` : `hace ${Math.round(m / 12)} ${m < 18 ? 'año' : 'años'}`;
}

/* ---------- catálogo ---------- */
export const cat = { grupos: {}, luz: {}, dificultad: {}, especies: [], porId: new Map() };
export async function cargarCatalogo() {
  const [esp, enf] = await Promise.all([
    fetch('data/especies.json').then((r) => r.json()),
    fetch('data/enfermedades.json').then((r) => r.json()),
  ]);
  Object.assign(cat, esp);
  cat.enfermedades = enf.problemas;
  cat.sintomas = enf.sintomas;
  cat.partesSintoma = enf.partes;
  cat.condiciones = enf.condiciones;
  cat.tiposPlanta = enf.plantas;
  refrescarCatalogo();
}
export function refrescarCatalogo() {
  const propias = store.get('especiesPropias', []);
  const base = cat.especies.filter((e) => !e.propia);
  cat.especies = [...base, ...propias.map((e) => ({ ...e, propia: true }))];
  cat.porId = new Map(cat.especies.map((e) => [e.id, e]));
}
export const especie = (id) => (id ? cat.porId.get(id) : null);
/* Preferencias de la app (nombre científico primero, etc.). */
export const prefs = () => store.get('prefs', {});
export const cientificoPrimero = () => prefs().nombres === 'cientifico';
/* [principal, secundario, principalEsCientifico] de una especie. */
export function nombres(e) {
  if (!e) return ['', '', false];
  return cientificoPrimero() ? [e.cientifico, e.nombre, true] : [e.nombre, e.cientifico, false];
}
export const nombreEsp = (e) => nombres(e)[0];
/* Lo mismo para una planta del usuario: su apodo y el nombre científico de su especie. */
export function nombresPlanta(p) {
  const c = especie(p?.especie)?.cientifico || p?.cientifico || '';
  if (cientificoPrimero() && c) return [c, p.nombre, true];
  return [p?.nombre || '', c, false];
}
export const nombrePlanta = (p) => nombresPlanta(p)[0];
/* Tipo de planta (para la guía de problemas) a partir de su grupo y etiquetas. */
const TIPO_DE_GRUPO = {
  cactus: 'cactus', cactus_delicado: 'cactus', cactus_selva: 'cactus', suculenta: 'suculenta', suculenta_invernal: 'suculenta',
  tabaiba: 'suculenta', mesemb: 'suculenta', mesemb_invernal: 'suculenta', caudex: 'suculenta', interior: 'interior', tropical: 'tropical',
  helecho: 'helecho', orquidea: 'orquidea', bromelia: 'orquidea', tillandsia: 'orquidea', palmera: 'palmera', aromatica: 'aromatica',
  huerto: 'huerto', flor: 'flor', bulbosa: 'flor', arbusto: 'arbusto', arbusto_canario: 'arbusto', trepadora: 'arbusto', carnivora: 'carnivora',
};
export function tiposDeEspecie(e) {
  if (!e) return [];
  const t = new Set([TIPO_DE_GRUPO[e.grupo] || (e.grupo === 'arbol' ? (e.tags.includes('com') ? 'frutal' : 'arbusto') : 'interior')]);
  if (e.tags.some((x) => x === 'end' || x === 'nat' || x === 'mac')) t.add('canaria');
  if (e.grupo === 'arbol' && e.tags.includes('com')) t.add('frutal');
  if (e.tags.includes('flor') && !t.has('cactus') && !t.has('suculenta')) t.add('flor');
  return [...t];
}
export const grupo = (e) => cat.grupos[e?.grupo] || cat.grupos.interior;
export const esCanaria = (e) => e.tags.some((t) => t === 'end' || t === 'nat' || t === 'mac');
export function origenTxt(e) {
  if (e.tags.includes('end')) return 'Endemismo canario';
  if (e.tags.includes('mac')) return 'Macaronésica';
  if (e.tags.includes('nat')) return 'Nativa de Canarias';
  return '';
}
export function buscarEspecies(q, lista = cat.especies) {
  const n = norm(q).trim();
  if (!n) return lista;
  const partes = n.split(/\s+/);
  return lista
    .map((e) => {
      const txt = norm(`${e.nombre} ${e.cientifico} ${(e.alias || []).join(' ')} ${grupo(e).nombre}`);
      if (!partes.every((p) => txt.includes(p))) return null;
      const score = norm(e.nombre).startsWith(n) ? 0 : norm(e.cientifico).startsWith(n) ? 1 : 2;
      return { e, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.e.nombre.localeCompare(b.e.nombre, 'es'))
    .map((x) => x.e);
}

/* ---------- datos del usuario ---------- */
export const datos = {
  get plantas() { return store.get('plantas', []); },
  set plantas(v) { store.set('plantas', v); },
  get sitios() { return store.get('sitios', SITIOS_INICIALES); },
  set sitios(v) { store.set('sitios', v); },
  get favoritos() { return store.get('favoritos', []); },
  set favoritos(v) { store.set('favoritos', v); },
};
export const planta = (id) => datos.plantas.find((p) => p.id === id);
export const sitio = (id) => datos.sitios.find((s) => s.id === id);
export function guardarPlanta(p) {
  const todas = datos.plantas;
  const i = todas.findIndex((x) => x.id === p.id);
  if (i >= 0) todas[i] = p; else todas.unshift(p);
  datos.plantas = todas;
}
export function borrarPlanta(id) {
  const p = planta(id);
  datos.plantas = datos.plantas.filter((x) => x.id !== id);
  if (p?.foto) fotos.borrar(p.foto);
}
export function esFavorito(id) { return datos.favoritos.includes(id); }
export function alternarFavorito(id) {
  const f = datos.favoritos;
  datos.favoritos = f.includes(id) ? f.filter((x) => x !== id) : [id, ...f];
  return !f.includes(id);
}

/* Recordatorios iniciales de una planta según su especie. */
export function recordatoriosIniciales(e, ultimoRiego = hoy()) {
  const g = grupo(e);
  const tropical = ['tropical', 'helecho', 'orquidea', 'tillandsia', 'cactus_selva'].includes(e?.grupo);
  return {
    riego: { on: true, cada: null, ultimo: ultimoRiego },
    abono: { on: !!(e?.abono ?? 4), cada: null, ultimo: hoy() },
    pulverizar: { on: tropical, cada: e?.grupo === 'tillandsia' ? 4 : 3, ultimo: hoy() },
    rotar: { on: false, cada: 14, ultimo: hoy() },
    limpiar: { on: false, cada: 30, ultimo: hoy() },
    revisar: { on: false, cada: 14, ultimo: hoy() },
    poda: { on: false, cada: 180, ultimo: hoy() },
    trasplante: { on: !!g.trasplante, cada: Math.max(1, g.trasplante || 2) * 365, ultimo: hoy() },
  };
}

/* ---------- cálculo de tareas ---------- */
const mesDe = (s) => Number(s.slice(5, 7)) - 1;
/* Intervalo de riego (días) para una fecha, o 0 si ese mes no se riega. */
export function intervaloRiego(e, fecha = hoy()) {
  if (!e) return TIPOS.riego.cada;
  const t = (e.meses || 'NNNNNNNNNNNN')[mesDe(fecha)];
  if (t === 'S') return 0;
  if (t === 'R') return e.ri || e.rv * 2;
  return e.rv;
}
/* Pauta de riego y abono de una planta: la de su especie, salvo que la planta
 * traiga una propia (p. ej. importada de Plantitus) en recordatorios.*.pauta. */
export function pauta(p) {
  const e = especie(p?.especie);
  const r = p?.recordatorios?.riego?.pauta, a = p?.recordatorios?.abono?.pauta;
  if (!r && !a) return e;
  return { rv: 7, ri: 14, meses: 'RRNNNNNNNNRR', abono: 4, abonoMeses: '001111111000', ...(e || {}), ...(r || {}), ...(a || {}) };
}
export function intervaloTxt(p) {
  const r = p.recordatorios?.riego;
  if (!r?.on) return 'Sin recordatorio de riego';
  if (r.cada) return `Cada ${r.cada} días`;
  const n = intervaloRiego(pauta(p));
  return n ? `Cada ${n} días` : 'Sin riego este mes';
}
function primerDiaMesSiguiente(s, ok) {
  let d = parse(s);
  for (let i = 0; i < 13; i++) {
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (ok(d.getMonth())) return iso(d);
  }
  return null;
}
/* Siguiente fecha de un recordatorio a partir de una fecha de última vez. */
export function siguiente(p, tipo, desde) {
  const r = p.recordatorios[tipo];
  const e = pauta(p);
  if (tipo === 'riego' && !r.cada && e) {
    const n = intervaloRiego(e, desde);
    const ok = (m) => (e.meses || 'N')[m] !== 'S';
    if (!n) return primerDiaMesSiguiente(desde, ok);
    const f = sumar(desde, n);
    return ok(mesDe(f)) ? f : primerDiaMesSiguiente(f, ok) || f;
  }
  if (tipo === 'abono' && !r.cada && e) {
    const sem = e.abono || 0;
    if (!sem) return null;
    const ok = (m) => (e.abonoMeses || '1'.repeat(12))[m] === '1';
    const f = sumar(desde, sem * 7);
    return ok(mesDe(f)) ? f : primerDiaMesSiguiente(f, ok);
  }
  return sumar(desde, r.cada || TIPOS[tipo]?.cada || 7);
}
/* Fecha en que toca cada recordatorio activo (puede ser pasada: atrasada). */
export function vencimiento(p, tipo) {
  const r = p.recordatorios?.[tipo];
  if (!r?.on) return null;
  let f = siguiente(p, tipo, r.ultimo || p.creada || hoy());
  if (f && r.pospuesto && r.pospuesto > f) f = r.pospuesto;
  return f;
}
/* Todas las tareas entre dos fechas (incluidas), con las repeticiones. */
export function tareasEntre(desde, hasta, plantas = datos.plantas) {
  const out = [];
  for (const p of plantas) {
    for (const tipo of Object.keys(TIPOS)) {
      let f = vencimiento(p, tipo);
      let n = 0;
      while (f && f <= hasta && n++ < 60) {
        if (f >= desde) out.push({ planta: p, tipo, fecha: f, atrasada: f < hoy() });
        const sig = siguiente(p, tipo, f);
        if (!sig || sig <= f) break;
        f = sig;
      }
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.planta.nombre.localeCompare(b.planta.nombre));
}
export function tareasAtrasadas(plantas = datos.plantas) {
  const h = hoy(), out = [];
  for (const p of plantas) for (const tipo of Object.keys(TIPOS)) {
    const f = vencimiento(p, tipo);
    if (f && f < h) out.push({ planta: p, tipo, fecha: f, atrasada: true });
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
export function tareasDelDia(dia, plantas = datos.plantas) {
  const h = hoy();
  if (dia === h) {
    const hechas = plantas.flatMap((p) => (p.historial || []).filter((x) => x.fecha === h && TIPOS[x.tipo]).map((x) => ({ planta: p, tipo: x.tipo, fecha: h, hecha: true })));
    const pend = tareasEntre(h, h, plantas).filter((t) => !hechas.some((x) => x.planta.id === t.planta.id && x.tipo === t.tipo));
    const vistas = new Set();
    return [...pend, ...hechas.filter((x) => { const k = x.planta.id + x.tipo; if (vistas.has(k)) return false; vistas.add(k); return true; })];
  }
  if (dia < h) {
    // días pasados: lo que se hizo ese día (historial)
    return plantas.flatMap((p) => (p.historial || []).filter((x) => x.fecha === dia && TIPOS[x.tipo]).map((x) => ({ planta: p, tipo: x.tipo, fecha: dia, hecha: true })));
  }
  return tareasEntre(dia, dia, plantas);
}
export function completar(p, tipo, fecha = hoy(), nota = '') {
  const r = p.recordatorios[tipo];
  r.ultimo = fecha;
  delete r.pospuesto;
  (p.historial ||= []).unshift({ id: uid(), fecha, tipo, nota });
  guardarPlanta(p);
}
export function posponer(p, tipo, dias = 1) {
  p.recordatorios[tipo].pospuesto = sumar(hoy(), dias);
  guardarPlanta(p);
}

/* ---------- fotos (IndexedDB) ---------- */
const DB = 'plantitus-pro';
function abrirDB() {
  return new Promise((ok, mal) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('fotos');
    req.onsuccess = () => ok(req.result);
    req.onerror = () => mal(req.error);
  });
}
const urlFotos = new Map();
export const fotos = {
  async guardar(blob, id = uid()) {
    const db = await abrirDB();
    await new Promise((ok, mal) => { const tx = db.transaction('fotos', 'readwrite'); tx.objectStore('fotos').put(blob, id); tx.oncomplete = ok; tx.onerror = () => mal(tx.error); });
    urlFotos.delete(id);
    return id;
  },
  async leer(id) {
    const db = await abrirDB();
    return new Promise((ok) => { const r = db.transaction('fotos').objectStore('fotos').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); });
  },
  async url(id) {
    if (!id) return null;
    if (urlFotos.has(id)) return urlFotos.get(id);
    const b = await fotos.leer(id);
    if (!b) return null;
    const u = URL.createObjectURL(b);
    urlFotos.set(id, u);
    return u;
  },
  async borrar(id) {
    const db = await abrirDB();
    db.transaction('fotos', 'readwrite').objectStore('fotos').delete(id);
    urlFotos.delete(id);
  },
  async todas() {
    const db = await abrirDB();
    return new Promise((ok) => {
      const out = {}; const st = db.transaction('fotos').objectStore('fotos');
      const c = st.openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else ok(out); };
      c.onerror = () => ok(out);
    });
  },
};
/* Reduce una imagen a «lado» px y la devuelve como JPEG. */
export async function reducirImagen(file, lado = 1200, calidad = 0.82) {
  const bmp = await (window.createImageBitmap ? createImageBitmap(file).catch(() => null) : null);
  let w, h, src;
  if (bmp) { w = bmp.width; h = bmp.height; src = bmp; } else {
    src = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = URL.createObjectURL(file); });
    w = src.naturalWidth; h = src.naturalHeight;
  }
  const k = Math.min(1, lado / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', calidad));
}
export const blobABase64 = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(b); });
/* Abre la cámara o la galería y devuelve el archivo elegido. */
export function elegirFoto({ camara = false } = {}) {
  return new Promise((ok) => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    if (camara) i.capture = 'environment';
    i.onchange = () => ok(i.files?.[0] || null);
    i.addEventListener('cancel', () => ok(null));
    i.click();
  });
}

/* ---------- fotos de especies (Wikidata y Wikimedia Commons) ----------
 * Cada especie se busca por su nombre científico EXACTO en Wikidata (propiedad P225),
 * solo entre registros con ficha botánica (IPNI o POWO), y se usa su imagen (P18).
 * Antes se buscaba en Wikipedia y, si no había artículo, se probaba con el género:
 * «Parodia» en español es la parodia literaria, y por eso salía la foto de una persona. */
try { localStorage.removeItem('pp.wiki'); } catch { /* caché antigua con fotos equivocadas */ }
const CLAVE_FOTOS = 'fotosEsp1';
const fotoCache = store.get(CLAVE_FOTOS, {});
let guardarFotosT;
const guardarFotos = () => { clearTimeout(guardarFotosT); guardarFotosT = setTimeout(() => store.set(CLAVE_FOTOS, fotoCache), 800); };
const commons = (u, ancho = 500) => u.replace(/^http:/, 'https:') + (u.includes('?') ? '&' : '?') + 'width=' + ancho;
const ES_PLANTA = /(especie|species|g[ée]nero|genus|planta|plant|cact|suculent|variedad|cultivar|h[íi]brid|hybrid|subesp|subspecies|[áa]rbol|tree|arbust|shrub|helecho|fern|orqu[íi]d|orchid|palm|hierba|herb|bromel|trepadora|climber|flor|flower)/i;

/* Variantes del nombre: con «×» de híbrido, sin él, sin variedad o subespecie, y el género. */
export function variantesTaxon(c) {
  const base = String(c || '').replace(/\s*['‘’"][^'‘’"]*['‘’"]/g, '').replace(/\s+/g, ' ').trim();
  const conX = base.replace(/(^|\s)[x×]\s+/g, '$1× ').trim();
  const sinX = base.replace(/(^|\s)[x×]\s+/g, '$1').trim();
  const sinInfra = sinX.replace(/\s(var|subsp|ssp|f|nothosubsp)\.\s.*$/, '');
  const genero = sinX.split(' ')[0];
  return { exactos: [...new Set([conX, sinX, sinInfra])].filter((x) => x.includes(' ')), genero: genero && genero !== sinX ? genero : (sinX.includes(' ') ? '' : sinX) };
}

/* Consulta a Wikidata agrupando muchos nombres en una sola petición. */
const colaTaxon = new Map(); // nombre → [resolver]
let colaTaxonT;
function fotoTaxon(nombre) {
  return new Promise((ok) => {
    if (!colaTaxon.has(nombre)) colaTaxon.set(nombre, []);
    colaTaxon.get(nombre).push(ok);
    clearTimeout(colaTaxonT);
    colaTaxonT = setTimeout(vaciarColaTaxon, 60);
  });
}
async function vaciarColaTaxon() {
  const todos = [...colaTaxon.entries()];
  colaTaxon.clear();
  for (let i = 0; i < todos.length; i += 30) {
    const lote = todos.slice(i, i + 30);
    const res = await consultarWikidata(lote.map(([n]) => n));
    for (const [n, oks] of lote) oks.forEach((ok) => ok(res?.get(n) ?? (res ? null : undefined)));
  }
}
async function consultarWikidata(nombres) {
  const lit = (n) => '"' + n.replace(/["\\]/g, '') + '"';
  const q = `SELECT ?n (SAMPLE(?img) AS ?foto) (SAMPLE(?img2) AS ?foto2) WHERE {
    VALUES ?n { ${nombres.map(lit).join(' ')} }
    ?t wdt:P225 ?n .
    FILTER EXISTS { ?t wdt:P961|wdt:P5037|wdt:P1070 [] }
    OPTIONAL { ?t wdt:P18 ?img }
    OPTIONAL { ?acc wdt:P1420 ?t . ?acc wdt:P18 ?img2 }
  } GROUP BY ?n`;
  try {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const m = new Map();
    for (const b of j.results.bindings) {
      const u = b.foto?.value || b.foto2?.value;
      if (u) m.set(b.n.value, commons(u));
    }
    return m;
  } catch { return null; } // sin red: no se guarda nada y se reintenta luego
}
async function resumenWikipedia(lang, titulo) {
  try {
    const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo.replace(/ /g, '_'))}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.type === 'standard' ? j : null;
  } catch { return null; }
}
/* Resumen de Wikipedia de una especie, solo si el artículo es de una planta. */
async function wikipediaPlanta(lang, nombre) {
  const j = await resumenWikipedia(lang, nombre);
  if (!j) return null;
  const desc = `${j.description || ''} ${(j.extract || '').slice(0, 220)}`;
  const mismoNombre = (j.title || '').toLowerCase().split(' ')[0] === nombre.toLowerCase().split(' ')[0];
  return mismoNombre && ES_PLANTA.test(desc) ? j : null;
}
const resolviendo = new Map();
/* URL de la foto de una especie por su nombre científico (o null). */
export function fotoEspecie(cient) {
  if (!cient) return Promise.resolve(null);
  const c = fotoCache[cient];
  if (c && Date.now() - c.t < (c.img ? 60 : 7) * 86400000) return Promise.resolve(c.img);
  if (resolviendo.has(cient)) return resolviendo.get(cient);
  const p = (async () => {
    const { exactos, genero } = variantesTaxon(cient);
    let img = null, sinRed = false;
    for (const n of exactos) {
      const r = await fotoTaxon(n);
      if (r === undefined) sinRed = true;
      if (r) { img = r; break; }
    }
    if (!img && !sinRed) {
      for (const n of exactos) {
        const w = (await wikipediaPlanta('en', n)) || (await wikipediaPlanta('es', n));
        if (w?.thumbnail?.source) { img = w.thumbnail.source; break; }
      }
    }
    if (!img && !sinRed && genero) img = await fotoTaxon(genero) || null;
    if (!sinRed) { fotoCache[cient] = { img, t: Date.now() }; guardarFotos(); }
    return img;
  })();
  resolviendo.set(cient, p);
  p.finally(() => resolviendo.delete(cient));
  return p;
}
/* Foto del artículo de Wikipedia en español con ese título exacto (remedios). */
const fotoTituloCache = new Map();
export function fotoTitulo(titulo) {
  if (!fotoTituloCache.has(titulo)) fotoTituloCache.set(titulo, resumenWikipedia('es', titulo).then((j) => j?.thumbnail?.source || null));
  return fotoTituloCache.get(titulo);
}
/* Texto de Wikipedia en español de una especie (solo si el artículo es de esa planta). */
export async function descripcionEspecie(cient) {
  for (const n of variantesTaxon(cient).exactos) {
    const j = await wikipediaPlanta('es', n);
    if (j?.extract) return { texto: j.extract, url: j.content_urls?.desktop?.page };
  }
  return null;
}
/* Foto propia elegida para una especie (o «ninguna»). */
export const fotosPropiasEsp = {
  get: (cient) => store.get('fotoEsp', {})[cient] || null,
  set(cient, v) { const m = store.get('fotoEsp', {}); if (v) m[cient] = v; else delete m[cient]; store.set('fotoEsp', m); },
};
export function olvidarFotoEspecie(cient) { delete fotoCache[cient]; guardarFotos(); }
export function vaciarCacheFotos() { for (const k of Object.keys(fotoCache)) delete fotoCache[k]; store.del(CLAVE_FOTOS); }

/* Rellena las imágenes con [data-foto], [data-wiki] (nombre científico) o [data-wikititulo] al aparecer en pantalla. */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entradas) => {
  for (const en of entradas) if (en.isIntersecting) { io.unobserve(en.target); pintarImagen(en.target); }
}, { rootMargin: '200px' }) : null;
async function pintarImagen(el) {
  let url = null;
  if (el.dataset.foto) url = await fotos.url(el.dataset.foto);
  if (!url && el.dataset.wiki) {
    const propia = fotosPropiasEsp.get(el.dataset.wiki);
    if (propia === 'ninguna') url = null;
    else if (propia) url = await fotos.url(propia);
    else url = await fotoEspecie(el.dataset.wiki);
  }
  if (!url && el.dataset.wikititulo) url = await fotoTitulo(el.dataset.wikititulo);
  if (url) { el.style.backgroundImage = `url("${url}")`; el.classList.add('cargada'); }
  else el.classList.add('sin-foto');
}
export function activarImagenes(raiz = document) {
  for (const el of $$('[data-wiki],[data-foto],[data-wikititulo]', raiz)) {
    if (el.dataset.pintada) continue;
    el.dataset.pintada = '1';
    if (io) io.observe(el); else pintarImagen(el);
  }
}
/* Vuelve a pintar las imágenes (tras cambiar una foto). */
export function repintarImagenes(raiz = document) {
  for (const el of $$('[data-pintada]', raiz)) { delete el.dataset.pintada; el.classList.remove('cargada', 'sin-foto'); el.style.backgroundImage = ''; }
  activarImagenes(raiz);
}

/* ---------- ubicación y tiempo (Open-Meteo) ---------- */
export async function ubicacion() {
  const g = store.get('ciudad', null);
  if (g) return g;
  if (!navigator.geolocation) return null;
  const pos = await new Promise((ok) => navigator.geolocation.getCurrentPosition(ok, () => ok(null), { timeout: 10000, maximumAge: 3600000 }));
  if (!pos) return null;
  const lat = pos.coords.latitude, lon = pos.coords.longitude;
  let nombre = 'Mi ubicación';
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
    const j = await r.json();
    nombre = j.city || j.locality || j.principalSubdivision || nombre;
  } catch { /* sin nombre */ }
  const c = { nombre, lat, lon, auto: true };
  store.set('ciudad', c);
  return c;
}
export async function buscarCiudad(q) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=es&format=json`);
  const j = await r.json();
  return (j.results || []).map((x) => ({ nombre: x.name, region: [x.admin1, x.country].filter(Boolean).join(', '), lat: x.latitude, lon: x.longitude }));
}
let tiempoCache = null;
export async function tiempo(forzar = false) {
  const c = await ubicacion();
  if (!c) return null;
  if (!forzar && tiempoCache && tiempoCache.clave === `${c.lat},${c.lon}` && Date.now() - tiempoCache.t < 20 * 60000) return tiempoCache;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat.toFixed(3)}&longitude=${c.lon.toFixed(3)}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto&forecast_days=7`;
    const j = await (await fetch(url)).json();
    tiempoCache = {
      clave: `${c.lat},${c.lon}`, t: Date.now(), ciudad: c.nombre,
      min: Math.round(j.daily.temperature_2m_min[0]), max: Math.round(j.daily.temperature_2m_max[0]),
      codigo: j.current?.weather_code ?? j.daily.weather_code[0], lluvia: j.daily.precipitation_sum[0] || 0,
      temp: j.current?.temperature_2m, hum: j.current?.relative_humidity_2m,
      dias: j.daily.time.map((d, i) => ({ fecha: d, min: j.daily.temperature_2m_min[i], max: j.daily.temperature_2m_max[i], lluvia: j.daily.precipitation_sum[i], codigo: j.daily.weather_code[i] })),
    };
    return tiempoCache;
  } catch { return null; }
}
export function iconoTiempo(codigo) {
  if (codigo == null) return '⛅';
  if (codigo === 0) return '☀️';
  if (codigo <= 2) return '🌤️';
  if (codigo === 3) return '☁️';
  if (codigo <= 48) return '🌫️';
  if (codigo <= 67 || (codigo >= 80 && codigo <= 82)) return '🌧️';
  if (codigo <= 77 || codigo === 85 || codigo === 86) return '❄️';
  return '⛈️';
}
