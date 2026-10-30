/* Iconos en SVG (trazo de 1,8 px, se colorean con currentColor). */
const P = {
  // barra inferior
  tareas: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 2"/><path d="M5 4.5 3 6.5M19 4.5l2 2M8 20.5l-1.5 1.5M16 20.5l1.5 1.5"/>',
  tareasOn: '<circle cx="12" cy="13" r="7.5" fill="currentColor"/><path d="M12 9.5V13l2.5 2" style="stroke:var(--tarjeta-solida)"/><path d="M5 4.5 3 6.5M19 4.5l2 2M8 20.5l-1.5 1.5M16 20.5l1.5 1.5"/>',
  botiquin: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M12 10.5v6M9 13.5h6"/>',
  botiquinOn: '<rect x="3" y="7" width="18" height="13" rx="3" fill="currentColor"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M12 10.5v6M9 13.5h6" style="stroke:var(--tarjeta-solida)"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  herramientas: '<path d="M6 11h12l-1.4 8.2a1.5 1.5 0 0 1-1.5 1.3H8.9a1.5 1.5 0 0 1-1.5-1.3Z"/><path d="M9.5 11c-.8-2.5-2.5-4-4.5-4.5M14.5 11c.4-3 2-5.5 4.5-6.5M12 11V5.5"/><path d="m8.5 4 2 2.5M10.5 4l-2 2.5"/>',
  herramientasOn: '<path d="M6 11h12l-1.4 8.2a1.5 1.5 0 0 1-1.5 1.3H8.9a1.5 1.5 0 0 1-1.5-1.3Z" fill="currentColor"/><path d="M9.5 11c-.8-2.5-2.5-4-4.5-4.5M14.5 11c.4-3 2-5.5 4.5-6.5M12 11V5.5"/>',
  plantas: '<path d="M12 21v-7"/><path d="M12 14c-4.5 0-7.5-2.5-7.5-7 4.5 0 7.5 2.5 7.5 7Z"/><path d="M12 12c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  plantasOn: '<path d="M12 21v-7"/><path d="M12 14c-4.5 0-7.5-2.5-7.5-7 4.5 0 7.5 2.5 7.5 7Z" fill="currentColor"/><path d="M12 12c0-5 3-8 8-8 0 5-3 8-8 8Z" fill="currentColor"/>',
  // generales
  ajustes: '<path d="M4 6.5h8.5M17.5 6.5H20M4 12h2.5M11.5 12H20M4 17.5h10.5M19.5 17.5h.5"/><circle cx="15" cy="6.5" r="2.4"/><circle cx="9" cy="12" r="2.4"/><circle cx="17" cy="17.5" r="2.4"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  puntos: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
  masCirculo: '<circle cx="12" cy="12" r="9.5"/><circle cx="7.5" cy="12" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="16.5" cy="12" r="1.1" fill="currentColor"/>',
  atras: '<path d="m15 5-7 7 7 7"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  abajo: '<path d="m5 9 7 7 7-7"/>',
  izq: '<path d="M14 7 9 12l5 5" fill="currentColor"/>',
  der: '<path d="m10 7 5 5-5 5" fill="currentColor"/>',
  corazon: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z"/>',
  corazonOn: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" fill="currentColor"/>',
  corazonMas: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8c0 1-.2 1.9-.6 2.8"/><path d="M18 15v6M15 18h6"/>',
  camara: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4Z"/><circle cx="12" cy="13.3" r="3.6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  ubicacion: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="2.4" stroke="none" style="fill:var(--tarjeta-solida)"/>',
  regadera: '<path d="M5 9h9v8.5A1.5 1.5 0 0 1 12.5 19h-6A1.5 1.5 0 0 1 5 17.5Z" fill="currentColor" stroke="none"/><path d="M14 11.5 20 8M5 11c-1.5-.3-2.5-1.5-2-3M8 9V6.5h3V9"/>',
  regaderaLinea: '<path d="M5 9h9v8.5A1.5 1.5 0 0 1 12.5 19h-6A1.5 1.5 0 0 1 5 17.5Z"/><path d="M14 11.5 20 8M5 11c-1.5-.3-2.5-1.5-2-3M8 9V6.5h3V9"/>',
  gota: '<path d="M12 3.5s-6 6.7-6 11a6 6 0 0 0 12 0c0-4.3-6-11-6-11Z" fill="currentColor" stroke="none"/>',
  abono: '<path d="M7 4h10l-1 3v12a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19V7Z"/><path d="M10 12c0-2 1-3 2.5-3.5 0 2-1 3.5-2.5 3.5ZM12 16v-4"/>',
  spray: '<path d="M8 10h6v10H8Z"/><path d="M9 10V7h4v3M13 7h3l-1.5-2H9.5"/><path d="M18 5h.01M20 7h.01M18 9h.01" stroke-width="2.4"/>',
  rotar: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
  hoja: '<path d="M5 19c0-9 5-14 14-14 0 9-5 14-14 14Z"/><path d="M5 19 14 10"/>',
  lupa: '<circle cx="10.5" cy="10.5" r="6"/><path d="m19 19-4-4"/>',
  tijeras: '<circle cx="6.5" cy="17" r="2.6"/><circle cx="6.5" cy="7" r="2.6"/><path d="M8.6 8.6 20 18M8.6 15.4 20 6"/>',
  maceta: '<path d="M5 9h14l-1.7 9.6a1.5 1.5 0 0 1-1.5 1.4H8.2a1.5 1.5 0 0 1-1.5-1.4Z"/><path d="M4 9h16V6.5H4Z"/>',
  tallo: '<path d="M12 21V4"/><path d="M12 9c-3 0-5-1.5-5-4.5 3 0 5 1.5 5 4.5ZM12 14c3 0 5-1.5 5-4.5-3 0-5 1.5-5 4.5Z"/>',
  flor: '<circle cx="12" cy="9" r="2.2"/><path d="M12 6.8c0-2 1-3.3 2.3-3.3s2 1.6.9 3.3M14 9.8c1.9.6 2.9 1.9 2.5 3.1s-2.1 1.3-3.3 0M10 9.8c-1.9.6-2.9 1.9-2.5 3.1s2.1 1.3 3.3 0M12 6.8c0-2-1-3.3-2.3-3.3s-2 1.6-.9 3.3M12 11.2V21M12 17c2 0 3.5-1 4-2.5"/>',
  fruto: '<path d="M12 7c-4-2-8 0-8 5s3.5 8.5 6 8.5c.8 0 1.4-.4 2-.4s1.2.4 2 .4c2.5 0 6-3.5 6-8.5s-4-7-8-5Z"/><path d="M12 7c0-2 1-3.5 3-4"/>',
  bicho: '<ellipse cx="12" cy="13.5" rx="5" ry="6"/><path d="M12 7.5v12M9 5l1.5 2.5M15 5l-1.5 2.5M7 11H3.5M7 15H3.5M17 11h3.5M17 15h3.5"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  mano: '<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 14.5a1.5 1.5 0 0 1 2.5-1.7L8 15"/>',
  termo: '<path d="M14 14.8V4.5a2 2 0 1 0-4 0v10.3a4 4 0 1 0 4 0Z"/><path d="M12 9v7.5"/>',
  humedad: '<path d="M12 3.5s-6 6.7-6 11a6 6 0 0 0 12 0c0-4.3-6-11-6-11Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  estrella: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9Z"/>',
  alerta: '<path d="M12 3.5 2.5 20h19Z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  chat: '<path d="M4 5h16v11H9l-5 4Z"/>',
  enviar: '<path d="M4 12 20 4l-6 16-3-7Z"/>',
  basura: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  descargar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  subir: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  libro: '<path d="M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2Z"/><path d="M4 20V5.5M8 8h7"/>',
  chispa: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z"/><path d="M19 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z"/>',
  filtro: '<path d="M4 5h16l-6 7.5V19l-4-2v-4.5Z"/>',
  casa: '<path d="M4 11 12 4l8 7v9H4Z"/><path d="M10 20v-5h4v5"/>',
  exterior: '<circle cx="8" cy="8" r="3"/><path d="M3 20c2-4 5-6 9-6s7 2 9 6"/><path d="M16 6h5M18.5 3.5v5"/>',
  lluvia: '<path d="M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 7.5a3.8 3.8 0 0 1 0 7.5Z"/><path d="M8.5 18 7.5 20.5M12.5 18l-1 2.5M16.5 18l-1 2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.2"/>',
  regla: '<path d="M3 16 16 3l5 5L8 21Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  diamante: '<path d="M6 4h12l3.5 5L12 20.5 2.5 9Z"/><path d="M2.5 9h19M9 4l-2 5 5 11.5L17 9l-2-5"/>',
  copia: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  hecho: '<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none"/><path d="m7.5 12.3 3 3 6-6.3" stroke-width="2.2" style="stroke:var(--sobre-acento)"/>',
  pendiente: '<circle cx="12" cy="12" r="9"/>',
  paleta: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7h2.2a3.7 3.7 0 0 0 3.7-3.8C20.5 6.8 16.7 3.5 12 3.5Z"/><circle cx="7.6" cy="11" r="1.2" fill="currentColor"/><circle cx="10" cy="7.3" r="1.2" fill="currentColor"/><circle cx="14.6" cy="7.4" r="1.2" fill="currentColor"/>',
  texto: '<path d="M5 19 10.5 5h1L17 19M7.2 14h7.6"/><path d="M19 9v10"/>',
  capas: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  foto: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4.5 3.5 3 2.5-2 5 3.5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};

export function ico(nombre, cls = '', extra = '') {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[nombre] || ''}</svg>`;
}

/* Ilustraciones grandes en color. */
export const ILUSTRACION = {
  sinTareas: `<svg viewBox="0 0 200 170" class="ilus" aria-hidden="true">
    <ellipse cx="100" cy="160" rx="70" ry="6" fill="#e8f6ef"/>
    <path d="M96 118c-6-28-26-42-40-46 10 12 18 30 22 46Z" fill="#35d39c"/>
    <path d="M104 118c2-34 16-56 34-64-8 16-14 40-16 64Z" fill="#1fbf86"/>
    <path d="M100 118c-2-30 0-50 6-62 4 14 4 40 2 62Z" fill="#7be3b9"/>
    <path d="M88 118c-12-20-28-28-38-28 10 8 20 18 26 28Z" fill="#1fbf86"/>
    <circle cx="70" cy="58" r="9" fill="#ffc94d"/><circle cx="70" cy="58" r="4" fill="#ff9f2e"/>
    <path d="M70 67c2 14 6 26 14 36" stroke="#1fbf86" stroke-width="3" fill="none"/>
    <circle cx="146" cy="70" r="8" fill="#ffc94d"/><circle cx="146" cy="70" r="3.5" fill="#ff9f2e"/>
    <path d="M146 78c-4 12-10 22-20 30" stroke="#1fbf86" stroke-width="3" fill="none"/>
    <path d="M78 116h50l-6 40a6 6 0 0 1-6 5h-26a6 6 0 0 1-6-5Z" fill="#c9f2e2"/>
    <path d="M20 112h34v36a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8Z" fill="#6cc8ff"/>
    <path d="M54 120c10 0 14 8 10 16" stroke="#6cc8ff" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M20 118 6 100" stroke="#6cc8ff" stroke-width="7" stroke-linecap="round"/>
    <rect x="132" y="126" width="34" height="32" rx="5" fill="#35d39c"/>
    <path d="M149 150v-10M149 140c-4 0-7-3-7-6 4 0 7 3 7 6ZM149 140c4 0 7-3 7-6-4 0-7 3-7 6Z" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>`,
  diagnostico: `<svg viewBox="0 0 220 200" class="ilus" aria-hidden="true">
    <path d="M70 130h80l-8 52a10 10 0 0 1-10 8H88a10 10 0 0 1-10-8Z" fill="#eef1ef"/>
    <path d="M70 130h80" stroke="#d8ddd9" stroke-width="3"/>
    <g fill="#1d9e5c">
      <path d="M110 132c-4-30-24-58-56-66 14 16 30 42 40 66Z"/>
      <path d="M110 132c4-34 26-62 60-70-16 18-32 44-44 70Z"/>
      <path d="M110 132c-1-36 6-72 18-96 6 26 2 64-8 96Z" fill="#26b36a"/>
      <path d="M108 132c-14-24-40-34-66-30 18 6 40 18 54 34Z" fill="#26b36a"/>
      <path d="M112 132c16-20 44-26 68-18-20 2-42 10-58 22Z" fill="#26b36a"/>
      <path d="M108 132c-10-34-4-70 6-92-12 22-16 60-14 92Z" fill="#178a4f"/>
    </g>
    <path d="M56 84c12 2 24 10 32 22-14-2-26-10-32-22Z" fill="#e8c34a"/>
    <path d="M60 86c8 4 16 10 22 18" stroke="#b5792b" stroke-width="2" fill="none"/>
    <path d="M44 72v-10a6 6 0 0 1 6-6h10M100 56h10a6 6 0 0 1 6 6v10M44 104v10a6 6 0 0 0 6 6h10M116 104v10a6 6 0 0 1-6 6h-10" stroke="#ffd12e" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`,
};
