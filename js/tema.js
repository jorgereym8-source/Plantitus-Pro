/* Temas y personalización de Plantitus Pro.
 * Cada tema parte de un color de acento y deriva el resto de la paleta (claro y oscuro).
 * Encima se aplican los ajustes del usuario: colores propios, translucidez, esquinas,
 * tamaño de letra, degradado y foto de fondo. El resultado se guarda en «pp.temaCSS»
 * para que index.html lo aplique antes de pintar y no haya parpadeo. */
import { store, fotos } from './core.js';

export const TEMAS = [
  { id: 'menta', nombre: 'Menta', acento: '#22c993' },
  { id: 'bosque', nombre: 'Bosque', acento: '#2e8b57' },
  { id: 'oceano', nombre: 'Océano', acento: '#2f8fe0' },
  { id: 'lavanda', nombre: 'Lavanda', acento: '#8b6cf0' },
  { id: 'desierto', nombre: 'Desierto', acento: '#cf7a36', fondo: '#fffaf3' },
  { id: 'atardecer', nombre: 'Atardecer', acento: '#ec6a73' },
  { id: 'girasol', nombre: 'Girasol', acento: '#e0a10b' },
  { id: 'volcan', nombre: 'Volcán', acento: '#e85a2a', modo: 'oscuro' },
  { id: 'grafito', nombre: 'Grafito', acento: '#6f8195' },
  { id: 'blanco', nombre: 'Minimal', acento: '#1f2a27', neutro: true },
];
export const ESQUINAS = { rectas: [0.35, '10px'], suaves: [1, '999px'], redondas: [1.4, '999px'] };
export const LETRAS = { pequena: 0.92, normal: 1, grande: 1.08, enorme: 1.16 };
export const POR_DEFECTO = {
  tema: 'menta', modo: 'auto', acento: '', fondo: '', texto: '', tarjeta: '', cabecera: '',
  degradado: true, transp: 0, desenfoque: true, esquinas: 'suaves', letra: 'normal', fotoFondo: null, velo: 0.35,
};
export const ajustesTema = () => ({ ...POR_DEFECTO, ...store.get('tema', {}) });

/* ---------- color ---------- */
const hexRgb = (h) => {
  let x = String(h || '').replace('#', '');
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  const n = parseInt(x, 16);
  return Number.isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mezcla = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
const luminancia = (h) => {
  const [r, g, b] = hexRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const sobre = (fondo) => (contraste(fondo, '#ffffff') >= contraste(fondo, '#111111') ? '#ffffff' : '#111111');
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r}, ${g}, ${b}, ${a})`; };
/* Oscurece o aclara el acento hasta que se lea sobre el fondo (para textos y enlaces). */
function legible(acento, fondo, minimo = 3.2) {
  let c = acento;
  const hacia = luminancia(fondo) > 0.4 ? '#000000' : '#ffffff';
  for (let i = 0; i < 12 && contraste(c, fondo) < minimo; i++) c = mezcla(c, hacia, 0.12);
  return c;
}

/* ---------- paleta ---------- */
function paleta(tema, oscuro, a) {
  const ac = tema.acento;
  const neutro = tema.neutro ? '#808080' : ac; // tinte de fondos y bordes
  let v;
  if (!oscuro) {
    const fondo = a.fondo || tema.fondo || '#ffffff';
    v = {
      fondo, tarjeta: a.tarjeta || mezcla(fondo, '#ffffff', 0.6),
      menta: a.cabecera || mezcla(neutro, '#ffffff', tema.neutro ? 0.93 : 0.84),
      gris: mezcla(neutro, fondo, 0.94), borde: mezcla(neutro, mezcla(fondo, '#c8d0cd', 0.5), 0.9),
      texto: a.texto || mezcla(neutro, '#161a19', 0.93),
    };
    v.tinta = a.texto || mezcla(ac, '#0b1512', tema.neutro ? 0.6 : 0.78);
    v['verde-claro'] = mezcla(ac, fondo, 0.87);
    v.sombra = '0 2px 14px ' + rgba(mezcla(neutro, '#000000', 0.7), 0.08);
  } else {
    const fondo = a.fondo || mezcla(neutro, '#090b0b', 0.9);
    v = {
      fondo, tarjeta: a.tarjeta || mezcla(neutro, mezcla(fondo, '#ffffff', 0.06), 0.9),
      menta: a.cabecera || mezcla(neutro, fondo, 0.78),
      gris: mezcla(neutro, mezcla(fondo, '#ffffff', 0.09), 0.9), borde: mezcla(neutro, mezcla(fondo, '#ffffff', 0.16), 0.9),
      texto: a.texto || mezcla(neutro, '#eef2f0', 0.9),
    };
    v.tinta = a.texto || mezcla(ac, '#f2f7f5', 0.82);
    v['verde-claro'] = mezcla(ac, fondo, 0.8);
    v.sombra = '0 2px 14px rgba(0, 0, 0, .35)';
  }
  const boton = a.acento || ac;
  v.verde = boton;
  v['verde-osc'] = legible(oscuro ? mezcla(boton, '#ffffff', 0.25) : mezcla(boton, '#000000', 0.2), v.fondo, 3.6);
  if (a.acento) v['verde-claro'] = mezcla(boton, v.fondo, oscuro ? 0.8 : 0.87);
  v['sobre-acento'] = sobre(boton);
  v.sub = mezcla(v.texto, v.fondo, 0.42);
  v.tenue = mezcla(v.texto, v.fondo, 0.62);
  // translucidez: tarjetas, barra inferior y cabeceras dejan ver el fondo
  const t = Math.max(0, Math.min(0.85, +a.transp || 0));
  v['tarjeta-solida'] = v.tarjeta;
  v.tarjeta = t ? rgba(v.tarjeta, 1 - t) : v.tarjeta;
  v['barra'] = rgba(v['tarjeta-solida'], t ? Math.max(0.35, 1 - t) : 0.94);
  v['cab'] = rgba(v.menta, t ? Math.max(0.3, 0.88 - t) : 0.88);
  v.desenfoque = t && a.desenfoque ? '14px' : '0px';
  v.degradado = a.degradado ? `linear-gradient(180deg, ${v.menta} 0, ${v.menta} calc(var(--sat) + 60px), ${v.fondo} 420px)` : 'none';
  v['cabecera-capa'] = a.fotoFondo || !a.degradado ? 'transparent' : v.menta;
  v['fondo-capa'] = a.fotoFondo ? 'transparent' : v.fondo;
  v.velo = rgba(v.fondo, a.fotoFondo ? Math.max(0, Math.min(0.9, +a.velo || 0)) : 0);
  const [rf, rb] = ESQUINAS[a.esquinas] || ESQUINAS.suaves;
  v.rf = String(rf); v.radio = Math.round(18 * rf) + 'px'; v.rb = rb;
  v.zoom = String(LETRAS[a.letra] || 1);
  return v;
}

/* Calcula los dos juegos de variables (claro y oscuro) y el modo. */
export function calcularTema(a = ajustesTema()) {
  const tema = TEMAS.find((x) => x.id === a.tema) || TEMAS[0];
  const modo = tema.modo === 'oscuro' && a.modo === 'auto' ? 'oscuro' : a.modo;
  return { modo, claro: paleta(tema, false, a), oscuro: paleta(tema, true, a) };
}
const oscuroAhora = (modo) => modo === 'oscuro' || (modo === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);

/* Aplica el tema a la página y lo guarda para el próximo arranque. */
export function aplicarTema(a = ajustesTema()) {
  const t = calcularTema(a);
  try { localStorage.setItem('pp.temaCSS', JSON.stringify(t)); } catch { /* sin espacio */ }
  pintarVariables(t);
  pintarFotoFondo(a.fotoFondo);
  return t;
}
function pintarVariables(t) {
  const osc = oscuroAhora(t.modo);
  const v = osc ? t.oscuro : t.claro;
  const r = document.documentElement;
  for (const [k, x] of Object.entries(v)) r.style.setProperty('--' + k, x);
  r.dataset.modo = osc ? 'oscuro' : 'claro';
  r.classList.toggle('translucido', v.desenfoque !== '0px');
  r.style.colorScheme = osc ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', v.menta);
}
let fotoActual = null;
async function pintarFotoFondo(id) {
  const r = document.documentElement;
  if (!id) { r.classList.remove('con-foto'); r.style.removeProperty('--foto-fondo'); fotoActual = null; return; }
  if (id === fotoActual) { r.classList.add('con-foto'); return; }
  const u = await fotos.url(id);
  if (!u) { r.classList.remove('con-foto'); return; }
  fotoActual = id;
  r.style.setProperty('--foto-fondo', `url("${u}")`);
  r.classList.add('con-foto');
}
export function guardarTema(cambios) {
  const a = { ...ajustesTema(), ...cambios };
  store.set('tema', a);
  return aplicarTema(a);
}
export function restablecerTema() {
  const a = ajustesTema();
  if (a.fotoFondo) fotos.borrar(a.fotoFondo);
  store.del('tema');
  return aplicarTema(ajustesTema());
}
/* Muestra de colores de un tema (para las tarjetas de elegir tema). */
export function muestra(tema, modo) {
  const p = paleta(tema, modo === 'oscuro' || tema.modo === 'oscuro', { ...POR_DEFECTO });
  return { fondo: p.fondo, cab: p.menta, acento: p.verde, tarjeta: p['tarjeta-solida'], texto: p.tinta };
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => pintarVariables(calcularTema()));
