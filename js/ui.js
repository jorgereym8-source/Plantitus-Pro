/* Navegación, cabeceras, hojas (sheets), avisos y componentes comunes. */
import { $, $$, esc, activarImagenes, especie, grupo, cat, intervaloTxt, sitio, esFavorito, alternarFavorito, origenTxt, nombres, nombresPlanta } from './core.js';
import { ico } from './iconos.js';

export const rutas = {};
export const TABS = [
  { id: 'tareas', icono: 'tareas', nombre: 'Tareas' },
  { id: 'diagnostico', icono: 'botiquin', nombre: 'Diagnóstico' },
  { id: 'buscar', icono: 'buscar', nombre: 'Buscar' },
  { id: 'herramientas', icono: 'herramientas', nombre: 'Herramientas' },
  { id: 'plantas', icono: 'plantas', nombre: 'Mis plantas' },
];

/* ---------- router por hash: #/vista/param ---------- */
export function ir(ruta, { reemplazar = false } = {}) {
  const h = '#/' + ruta.replace(/^#?\/?/, '');
  if (reemplazar) history.replaceState(null, '', h); else location.hash = h;
  if (reemplazar) pintar();
}
export const atras = () => (history.length > 1 ? history.back() : ir('tareas'));
let ultimaTab = 'tareas';
const scrolls = {};
export function rutaActual() {
  const [vista = 'tareas', ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  return { vista: vista || 'tareas', params };
}
let rutaPintada = '';
export async function pintar() {
  const { vista, params } = rutaActual();
  const fn = rutas[vista] || rutas.tareas;
  // Cada pantalla empieza con un contenedor nuevo: así no se acumulan los
  // escuchadores de toques de las pantallas anteriores.
  const viejo = $('#vista');
  const main = viejo.cloneNode(false);
  viejo.replaceWith(main);
  if (rutaPintada) scrolls[rutaPintada] = window.scrollY;
  const clave = location.hash;
  const esTab = TABS.some((t) => t.id === vista);
  if (esTab) ultimaTab = vista;
  document.body.classList.toggle('con-tabs', esTab);
  pintarTabs(esTab ? vista : null);
  cerrarHojas(true);
  try {
    const res = await fn(...params);
    if (!res) return;
    main.innerHTML = res.html;
    main.className = 'vista vista-' + vista + (esTab ? ' raiz' : ' detalle');
    activarImagenes(main);
    res.despues?.(main);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="vacio"><p>Algo ha fallado al abrir esta pantalla.</p><p class="sub">${esc(e.message)}</p></div>`;
  }
  const volviendo = rutaPintada !== clave && scrolls[clave] != null && sessionStorage.getItem('pp.vuelta') === clave;
  window.scrollTo(0, volviendo ? scrolls[clave] : 0);
  rutaPintada = clave;
}
/* Vuelve a pintar la vista actual conservando el scroll. */
export async function repintar() {
  const y = window.scrollY;
  rutaPintada = '';
  await pintar();
  window.scrollTo(0, y);
}
function pintarTabs(activa) {
  const nav = $('#tabbar');
  nav.hidden = !activa;
  if (!activa) return;
  nav.innerHTML = TABS.map((t) => `<a href="#/${t.id}" class="tab ${t.id === activa ? 'on' : ''}" aria-label="${t.nombre}" ${t.id === activa ? 'aria-current="page"' : ''}>${ico(t.id === activa && ['tareas', 'botiquin', 'herramientas', 'plantas'].includes(t.icono) ? t.icono + 'On' : t.icono)}</a>`).join('');
}
export const tabActual = () => ultimaTab;

/* ---------- cabeceras ---------- */
export function cabRaiz(titulo, { fav = false, ajustes = true, extra = '' } = {}) {
  return `<header class="cab-raiz"><h1>${esc(titulo)}</h1><div class="cab-acciones">${extra}${fav ? `<a class="btn-redondo fav" href="#/favoritos" aria-label="Favoritas">${ico('corazonOn')}</a>` : ''}${ajustes ? `<a class="btn-icono" href="#/ajustes" aria-label="Ajustes">${ico('ajustes')}</a>` : ''}</div></header>`;
}
export function cabDetalle(titulo = '', { derecha = '', transparente = false } = {}) {
  return `<header class="cab-detalle ${transparente ? 'transparente' : ''}"><button class="btn-icono atras" data-atras aria-label="Atrás">${ico('atras')}</button><h2>${esc(titulo)}</h2><div class="cab-acciones">${derecha}</div></header>`;
}
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('[data-atras]');
  if (a) { ev.preventDefault(); atras(); }
});

/* ---------- avisos ---------- */
export function aviso(texto, { deshacer } = {}) {
  const t = document.createElement('div');
  t.className = 'aviso';
  t.innerHTML = `<span>${esc(texto)}</span>${deshacer ? '<button>Deshacer</button>' : ''}`;
  if (deshacer) t.querySelector('button').onclick = () => { deshacer(); t.remove(); };
  $('#capas').append(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, deshacer ? 4500 : 2600);
}

/* ---------- hojas modales (bottom sheets) ---------- */
export function hoja(html, { clase = '', alCerrar, titulo = '' } = {}) {
  const fondo = document.createElement('div');
  fondo.className = 'hoja-fondo';
  fondo.innerHTML = `<section class="hoja ${clase}" role="dialog" aria-modal="true">${titulo ? `<header class="hoja-cab"><h3>${esc(titulo)}</h3><button class="btn-icono" data-cerrar aria-label="Cerrar">${ico('cerrar')}</button></header>` : '<div class="asa"></div>'}<div class="hoja-cuerpo">${html}</div></section>`;
  const cerrar = () => {
    fondo.classList.remove('on');
    setTimeout(() => fondo.remove(), 250);
    document.body.classList.toggle('sin-scroll', $$('.hoja-fondo.on').length > 0);
    alCerrar?.();
  };
  fondo._cerrar = cerrar;
  fondo.addEventListener('click', (e) => { if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrar(); });
  $('#capas').append(fondo);
  document.body.classList.add('sin-scroll');
  requestAnimationFrame(() => fondo.classList.add('on'));
  activarImagenes(fondo);
  return { el: fondo.querySelector('.hoja'), cerrar };
}
export function cerrarHojas(silencio = false) {
  for (const f of $$('.hoja-fondo')) { if (silencio) { f.remove(); } else f._cerrar(); }
  if (silencio) document.body.classList.remove('sin-scroll');
}
export function confirmar(texto, { si = 'Aceptar', peligro = false } = {}) {
  return new Promise((ok) => {
    let res = false;
    const h = hoja(`<p class="confirmar-txt">${esc(texto)}</p><div class="fila-botones"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn ${peligro ? 'peligro' : ''}" data-si>${esc(si)}</button></div>`, { alCerrar: () => ok(res) });
    h.el.querySelector('[data-si]').onclick = () => { res = true; h.cerrar(); };
  });
}
/* Menú de acciones: [{texto, icono, peligro, accion}] */
export function menu(opciones, titulo = '') {
  const h = hoja(`${titulo ? `<p class="menu-tit">${esc(titulo)}</p>` : ''}<div class="menu-lista">${opciones.map((o, i) => `<button class="menu-op ${o.peligro ? 'peligro' : ''}" data-i="${i}">${o.icono ? ico(o.icono) : ''}<span>${esc(o.texto)}</span></button>`).join('')}</div><button class="btn sec ancho" data-cerrar>Cancelar</button>`);
  h.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) { h.cerrar(); opciones[+b.dataset.i].accion(); }
  });
}

/* ---------- componentes ---------- */
export const LUZ_ICONO = { sombra: '☁️', semi: '⛅', parcial: '🌤️', sol: '☀️' };
export const DIF_TXT = { F: 'Fácil', M: 'Moderada', D: 'Difícil' };
/* Nombre principal y secundario (común o científico primero, según Ajustes). */
export function nomHTML([a, b, cient], tagA = 'strong', tagB = 'em') {
  return `<${tagA} class="${cient ? 'cient' : ''}">${esc(a)}</${tagA}>${b ? `<${tagB} class="${cient ? 'comun' : ''}">${esc(b)}</${tagB}>` : ''}`;
}
export const nomPrincipal = ([a, , cient]) => `<span class="${cient ? 'cient' : ''}">${esc(a)}</span>`;
export function tarjetaEspecie(e) {
  const fav = esFavorito(e.id);
  return `<a class="tarjeta-esp" href="#/especie/${encodeURIComponent(e.id)}">
    <div class="foto" data-wiki="${esc(e.cientifico)}"><span class="foto-nombre">${nomPrincipal(nombres(e))}</span>
      <button class="fav-mini ${fav ? 'on' : ''}" data-fav="${esc(e.id)}" aria-label="Favorita">${ico(fav ? 'corazonOn' : 'corazonMas')}</button></div>
    <div class="datos"><span>${ico('mano')} ${DIF_TXT[e.dificultad]}</span><span>${ico('sol')} ${esc(cat.luz[e.luz])}</span></div>
  </a>`;
}
export function filaEspecie(e, { accion = '' } = {}) {
  const o = origenTxt(e);
  return `<a class="fila-esp" href="#/especie/${encodeURIComponent(e.id)}" data-id="${esc(e.id)}">
    <div class="mini-foto" data-wiki="${esc(e.cientifico)}"></div>
    <div class="txt">${nomHTML(nombres(e))}<span class="meta">${esc(grupo(e).nombre)}${o ? ' · ' + o : ''}${e.propia ? ' · Añadida por ti' : ''}</span></div>
    ${accion || ico('chevron', 'tenue')}
  </a>`;
}
export function tarjetaPlanta(p) {
  const e = especie(p.especie);
  const s = sitio(p.sitio);
  return `<article class="tarjeta-planta" data-planta="${esc(p.id)}">
    <a class="foto" href="#/planta/${esc(p.id)}" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(e?.cientifico || p.cientifico || '')}"></a>
    <a class="txt" href="#/planta/${esc(p.id)}">
      ${nomHTML(nombresPlanta(p))}
      <span class="meta">${ico('ubicacion')} ${esc(s?.nombre || 'Sin sitio')}</span>
      <span class="meta">${ico('regaderaLinea')} ${esc(intervaloTxt(p))}</span>
    </a>
    <button class="btn-icono mas" data-menu-planta="${esc(p.id)}" aria-label="Opciones">${ico('puntos')}</button>
  </article>`;
}
/* Corazón de favoritos en tarjetas (delegado). */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-fav]');
  if (!b) return;
  ev.preventDefault(); ev.stopPropagation();
  const on = alternarFavorito(b.dataset.fav);
  for (const x of $$(`[data-fav="${CSS.escape(b.dataset.fav)}"]`)) {
    x.classList.toggle('on', on);
    if (x.classList.contains('fav-mini')) x.innerHTML = ico(on ? 'corazonOn' : 'corazonMas');
    else x.innerHTML = ico(on ? 'corazonOn' : 'corazon');
  }
  aviso(on ? 'Añadida a favoritas' : 'Quitada de favoritas');
});

export function segmentado(nombre, opciones, actual) {
  return `<div class="segmentado" role="tablist" data-seg="${nombre}">${opciones.map(([v, t]) => `<button role="tab" data-v="${esc(v)}" class="${v === actual ? 'on' : ''}" aria-selected="${v === actual}">${esc(t)}</button>`).join('')}</div>`;
}
export function chips(lista) {
  return `<div class="chips">${lista.filter(Boolean).map((c) => `<span class="chip ${c.cls || ''}">${c.icono ? ico(c.icono) : ''}${esc(c.texto)}</span>`).join('')}</div>`;
}

export { ico };
