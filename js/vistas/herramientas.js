/* Pestaña Herramientas: calculador de riego, medidor de luz, comprobación de maceta, cursos y remedios. */
import { $, $$, esc, cat, especie, grupo, datos, planta, sitio, intervaloRiego, hoy, guardarPlanta, sumar, fechaLarga, vencimiento } from '../core.js';
import { REMEDIOS, NIVELES_LUZ } from '../contenido.js';
import { rutas, ir, aviso, cabRaiz, cabDetalle, segmentado, tarjetaEspecie, chatHTML, activarChat, repintar, ico, LUZ_ICONO } from '../ui.js';
import { guiaEspecie } from './guia.js';
import { tarjetaRemedio } from './diagnostico.js';

const HERRAMIENTAS = [
  { id: 'riego', nombre: 'Calculador de riego', ilus: '<svg viewBox="0 0 64 48"><path d="M10 14h30v22a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6Z" fill="#4fb6f5"/><path d="M40 20 56 10l2 4-16 12Z" fill="#7fcdfa"/><path d="M10 20c-6 0-9-6-6-11" stroke="#4fb6f5" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="18" y="8" width="14" height="6" rx="2" fill="#7fcdfa"/></svg>' },
  { id: 'luz', nombre: 'Medidor de luz', ilus: '<svg viewBox="0 0 64 48"><circle cx="32" cy="24" r="11" fill="#ffc531"/><g stroke="#ffc531" stroke-width="4" stroke-linecap="round"><path d="M32 4v4M32 40v4M12 24h4M48 24h4M18 10l3 3M43 35l3 3M18 38l3-3M43 13l3-3"/></g></svg>' },
  { id: 'maceta', nombre: 'Comprobación de maceta', ilus: '<svg viewBox="0 0 64 48"><path d="M14 10h36l-5 32a4 4 0 0 1-4 3H23a4 4 0 0 1-4-3Z" fill="#ff8e3c"/><rect x="11" y="6" width="42" height="9" rx="3" fill="#ffab5e"/></svg>' },
  { id: 'temporada', nombre: 'Qué hacer este mes', ilus: '<svg viewBox="0 0 64 48"><rect x="12" y="8" width="40" height="34" rx="6" fill="#37cf97"/><rect x="12" y="8" width="40" height="10" rx="5" fill="#1fb57e"/><g fill="#fff"><circle cx="22" cy="27" r="3"/><circle cx="32" cy="27" r="3"/><circle cx="42" cy="27" r="3"/><circle cx="22" cy="36" r="3"/></g></svg>' },
];

rutas.herramientas = () => {
  const mias = datos.plantas;
  const idsMias = [...new Set(mias.map((p) => p.especie).filter(Boolean))];
  const populares = ['Phalaenopsis x hybridus', 'Echeveria elegans', 'Aeonium arboreum', 'Epipremnum aureum', 'Monstera deliciosa', 'Dracaena trifasciata', 'Euphorbia canariensis', 'Crassula ovata']
    .map((c) => cat.especies.find((e) => e.cientifico === c)?.id).filter(Boolean);
  const cursos = [...idsMias, ...populares.filter((x) => !idsMias.includes(x))].slice(0, 10).map(especie).filter(Boolean);
  return {
    html: `${cabRaiz('Herramientas')}
    <div class="contenido">
      <h2 class="seccion-tit">Herramientas de Jardinería</h2>
      <div class="carrusel">${HERRAMIENTAS.map((h) => `<a class="tarjeta-herr" href="#/herramienta/${h.id}"><span class="herr-ilus">${h.ilus}</span><strong>${h.nombre}</strong></a>`).join('')}</div>
      <h2 class="seccion-tit con-enlace">Cursos de cuidados <a href="#/cursos">Ver todas ${ico('chevron')}</a></h2>
      <div class="carrusel">${cursos.map((e) => tarjetaCurso(e, idsMias.includes(e.id))).join('')}</div>
      <h2 class="seccion-tit">Remedios caseros</h2>
      <div class="carrusel">${REMEDIOS.map(tarjetaRemedio).join('')}</div>
    </div>`,
  };
};
function tarjetaCurso(e, tuya) {
  return `<a class="tarjeta-curso" href="#/curso/${encodeURIComponent(e.id)}"><span class="foto" data-wiki="${esc(e.cientifico)}"></span>${tuya ? '<span class="badge">Tu planta</span>' : ''}<strong>${esc(e.nombre)}</strong></a>`;
}

rutas.cursos = () => {
  const ids = new Set(datos.plantas.map((p) => p.especie));
  const mias = cat.especies.filter((e) => ids.has(e.id));
  return {
    html: `${cabDetalle('Cursos de cuidados')}<div class="contenido">
      ${mias.length ? `<h2 class="seccion-tit">Tus plantas</h2><div class="rejilla-cursos">${mias.map((e) => tarjetaCurso(e, true)).join('')}</div>` : ''}
      <h2 class="seccion-tit">Todas las especies</h2>
      <p class="sub">Busca cualquier especie del catálogo para ver su curso de cuidados.</p>
      <a class="buscador-falso" href="#/resultados">${ico('buscar')}<span>Buscar especie</span></a>
    </div>`,
  };
};
rutas.curso = (id) => {
  const e = especie(id);
  if (!e) return rutas.cursos();
  return {
    html: `<div class="cabecera-foto" data-wiki="${esc(e.cientifico)}">${cabDetalle('', { transparente: true })}</div>
      <div class="contenido ficha"><p class="sub">Curso de cuidados</p><h1 class="ficha-nombre">${esc(e.nombre)}</h1><p class="ficha-cient">${esc(e.cientifico)}</p>
      ${guiaEspecie(e)}
      ${chatHTML('curso-' + id, { titulo: 'Dudas sobre sus cuidados', sugerencias: ['Hazme un plan para todo el año', '¿Cómo la reproduzco por esqueje?'] })}
      <a class="btn sec ancho" href="#/especie/${encodeURIComponent(e.id)}">Ver la ficha completa</a></div>`,
    despues(v) { activarChat(v, 'curso-' + id, `Curso de cuidados de ${e.nombre} (${e.cientifico}).`); },
  };
};
rutas.remedio = (id) => {
  const r = REMEDIOS.find((x) => x.id === id);
  if (!r) return rutas.herramientas();
  const enf = r.para.map((n) => cat.enfermedades.find((x) => x.nombre === n)).filter(Boolean);
  return {
    html: `<div class="cabecera-foto" data-wiki="${esc(r.wiki)}">${cabDetalle('', { transparente: true })}</div>
    <div class="contenido ficha"><span class="badge-tipo">${esc(r.tipo)}</span><h1 class="ficha-nombre">${esc(r.nombre)}</h1>
      <section class="tarjeta"><h3>${ico('copia', 'verde')} Qué necesitas</h3><ul>${r.receta.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="tarjeta"><h3>${ico('spray', 'azul')} Cómo se usa</h3><p>${esc(r.uso)}</p></section>
      ${enf.length ? `<section class="tarjeta"><h3>${ico('botiquin', 'rojo')} Sirve contra</h3><div class="lista-enlaces">${enf.map((x) => `<a href="#/enfermedad/${x.id}"><span>${esc(x.nombre)}</span>${ico('chevron', 'tenue')}</a>`).join('')}</div></section>` : ''}
      <p class="sub">Los remedios caseros funcionan mejor como prevención o en ataques leves. Si la plaga avanza, usa un producto específico.</p>
    </div>`,
  };
};

/* ---------- herramientas ---------- */
rutas.herramienta = (id) => ({ riego: calcRiego, luz: medidorLuz, maceta: compMaceta, temporada }[id] || rutas.herramientas)();

/* Calculador de riego: agua por riego y frecuencia según maceta, tipo y época. */
const calc = { plantaId: '', grupo: 'interior', diam: 14, material: 'plastico', lugar: 'int' };
const FRACCION = { cactus: 0.2, cactus_delicado: 0.15, cactus_selva: 0.2, suculenta: 0.2, suculenta_invernal: 0.2, tabaiba: 0.2, mesemb: 0.12, mesemb_invernal: 0.12, caudex: 0.2, interior: 0.25, tropical: 0.28, helecho: 0.3, orquidea: 0.2, bromelia: 0.15, tillandsia: 0, palmera: 0.25, aromatica: 0.25, huerto: 0.3, flor: 0.28, arbusto: 0.25, arbusto_canario: 0.22, arbol: 0.25, carnivora: 0.3, trepadora: 0.25, bulbosa: 0.2 };
function calcRiego() {
  const plantas = datos.plantas;
  const p = calc.plantaId ? planta(calc.plantaId) : null;
  const e = p ? especie(p.especie) : null;
  const g = e?.grupo || calc.grupo;
  if (p && sitio(p.sitio)) calc.lugar = sitio(p.sitio).exterior ? 'ext' : 'int';
  const r = calc.diam / 2;
  const volumen = Math.PI * r * r * calc.diam * 0.85 / 1000; // litros, maceta con altura ≈ diámetro
  let ml = Math.round(volumen * (FRACCION[g] ?? 0.25) * 1000 / 10) * 10;
  const base = e ? intervaloRiego(e) : ({ cactus: 14, suculenta: 10, interior: 7, tropical: 5, helecho: 4, aromatica: 3, huerto: 2 }[g] || 7);
  let dias = base;
  if (dias) {
    if (calc.material === 'barro') dias *= 0.85;
    if (calc.lugar === 'ext') dias *= [5, 6, 7, 8].includes(new Date().getMonth()) ? 0.75 : 0.9;
    if (calc.diam <= 9) dias *= 0.8; else if (calc.diam >= 30) dias *= 1.25;
    dias = Math.max(1, Math.round(dias));
  }
  const grupos = Object.entries(cat.grupos);
  return {
    html: `${cabDetalle('Calculador de riego')}<div class="contenido form herramienta">
      <label>Planta<select data-k="plantaId"><option value="">Otra planta (elige el tipo)</option>${plantas.map((x) => `<option value="${esc(x.id)}" ${x.id === calc.plantaId ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></label>
      ${!p ? `<label>Tipo de planta<select data-k="grupo">${grupos.map(([k, x]) => `<option value="${k}" ${k === calc.grupo ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></label>` : ''}
      <label>Diámetro de la maceta: <strong>${calc.diam} cm</strong><input type="range" min="5" max="50" step="1" value="${calc.diam}" data-k="diam"></label>
      <div class="campo"><span>Material</span>${segmentado('material', [['plastico', 'Plástico o cerámica'], ['barro', 'Barro']], calc.material)}</div>
      ${!p || !sitio(p.sitio) ? `<div class="campo"><span>Lugar</span>${segmentado('lugar', [['int', 'Interior'], ['ext', 'Exterior']], calc.lugar)}</div>` : ''}
      <section class="resultado-calc">
        <div><span>${ico('gota', 'azul')}</span><strong>${g === 'tillandsia' ? 'Remojo' : ml >= 1000 ? (ml / 1000).toFixed(1).replace('.', ',') + ' l' : ml + ' ml'}</strong><em>por riego</em></div>
        <div><span>${ico('calendario', 'verde')}</span><strong>${dias ? `Cada ${dias} días` : 'Sin riego'}</strong><em>en ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][new Date().getMonth()]}</em></div>
      </section>
      <p class="sub">${esc(cat.grupos[g]?.riegoTxt || '')} Es una estimación: comprueba siempre con el dedo o un palillo que el sustrato está seco antes de volver a regar.</p>
      ${p && dias && p.recordatorios.riego.on && !p.recordatorios.riego.cada && e && dias !== intervaloRiego(e) ? `<button class="btn sec ancho" data-aplicar="${dias}">Usar cada ${dias} días en ${esc(p.nombre)}</button>` : ''}
    </div>`,
    despues(v) {
      v.addEventListener('input', (ev) => {
        const k = ev.target.dataset.k;
        if (!k) return;
        calc[k] = k === 'diam' ? +ev.target.value : ev.target.value;
        if (k === 'diam') { ev.target.previousElementSibling.textContent = `${calc.diam} cm`; clearTimeout(calc.t); calc.t = setTimeout(repintar, 250); } else repintar();
      });
      v.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-seg] button');
        if (b) { calc[b.closest('[data-seg]').dataset.seg] = b.dataset.v; repintar(); }
        const a = ev.target.closest('[data-aplicar]');
        if (a) { const q = planta(calc.plantaId); q.recordatorios.riego.cada = +a.dataset.aplicar; guardarPlanta(q); aviso('Frecuencia de riego guardada'); repintar(); }
      });
    },
  };
}

/* Medidor de luz: cámara donde el navegador da la exposición; si no, prueba de la sombra. */
let nivelLuz = null;
let camara = null;
function pararCamara() { if (camara) { clearInterval(camara.t); camara.stream.getTracks().forEach((t) => t.stop()); camara = null; } }
window.addEventListener('hashchange', pararCamara);
function medidorLuz() {
  const n = NIVELES_LUZ.find((x) => x.id === nivelLuz);
  const aptas = n ? cat.especies.filter((e) => e.luz === n.id && !e.tags.includes('inv')).slice(0, 12) : [];
  return {
    html: `${cabDetalle('Medidor de luz')}<div class="contenido herramienta">
      <section class="tarjeta medidor">
        <video id="camLuz" playsinline muted hidden></video>
        <div class="lux-lectura" id="luxLectura" hidden><strong id="luxNum">—</strong><span>lux aprox.</span></div>
        <button class="btn ancho" data-camara>${ico('camara')} Medir con la cámara</button>
        <p class="sub" id="camNota">Apunta la cámara trasera hacia la ventana desde donde estará la planta.</p>
      </section>
      <h2 class="seccion-tit">Prueba de la sombra</h2>
      <p class="sub">Pon la mano a 30 cm del sitio de la planta, a mediodía, y mira su sombra. Es el método más fiable sin luxómetro.</p>
      <div class="niveles-luz">${NIVELES_LUZ.map((x) => `<button class="nivel ${x.id === nivelLuz ? 'on' : ''}" data-nivel="${x.id}"><span class="nivel-ico">${LUZ_ICONO[x.id]}</span><span class="txt"><strong>${esc(x.sombraMano)}</strong><span>${esc(x.nombre)} · ${esc(x.lux)}</span></span></button>`).join('')}</div>
      ${n ? `<section class="tarjeta"><h3>${LUZ_ICONO[n.id]} ${esc(n.nombre)}</h3><p>${esc(n.texto)}</p></section>
      <h2 class="seccion-tit">Plantas para este sitio</h2><div class="rejilla-esp">${aptas.map(tarjetaEspecie).join('')}</div>
      <a class="btn sec ancho" href="#/buscador">Afinar en el buscador de plantas</a>` : ''}
    </div>`,
    despues(v) {
      v.addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-nivel]');
        if (b) { nivelLuz = b.dataset.nivel; pararCamara(); repintar(); }
        if (ev.target.closest('[data-camara]')) iniciarCamara(v);
      });
    },
  };
}
async function iniciarCamara(v) {
  pararCamara();
  const nota = $('#camNota', v);
  if (!navigator.mediaDevices?.getUserMedia) { nota.textContent = 'Este navegador no permite usar la cámara. Usa la prueba de la sombra.'; return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); } catch { nota.textContent = 'No hay permiso para usar la cámara.'; return; }
  const track = stream.getVideoTracks()[0];
  const caps = track.getCapabilities ? track.getCapabilities() : {};
  const video = $('#camLuz', v);
  video.srcObject = stream; video.hidden = false; video.play().catch(() => {});
  if (!caps.exposureTime || !caps.iso) {
    nota.innerHTML = 'Safari en iPhone no deja a las webs leer la exposición de la cámara, así que no puede dar los lux. Usa la <strong>prueba de la sombra</strong> de abajo: es igual de útil para elegir sitio.';
    setTimeout(() => { stream.getTracks().forEach((t) => t.stop()); video.hidden = true; }, 2500);
    return;
  }
  $('#luxLectura', v).hidden = false;
  const tick = () => {
    const s = track.getSettings();
    const t = s.exposureTime / 10000, iso = s.iso, N = 1.8;
    if (!t || !iso) return;
    const lux = 2.5 * 2 ** (Math.log2((N * N) / t) - Math.log2(iso / 100));
    $('#luxNum', v).textContent = Math.round(lux).toLocaleString('es-ES');
    const nv = lux < 1000 ? 'sombra' : lux < 10000 ? 'semi' : lux < 30000 ? 'parcial' : 'sol';
    nota.textContent = `Equivale a: ${NIVELES_LUZ.find((x) => x.id === nv).nombre}. Pulsa ese nivel abajo para ver qué plantas encajan.`;
  };
  camara = { stream, t: setInterval(tick, 500) };
  tick();
}

/* Comprobación de maceta: ¿toca trasplantar? */
const resp = {};
const PREGUNTAS = [
  { id: 'raices', txt: '¿Salen raíces por los agujeros de abajo o asoman por arriba?', peso: 3 },
  { id: 'seca', txt: '¿El sustrato se seca en 1-2 días después de regar?', peso: 2 },
  { id: 'grande', txt: '¿La planta es más de 3 veces más alta (o ancha) que la maceta, o vuelca?', peso: 2 },
  { id: 'anos', txt: '¿Lleva más de 2 años en el mismo sustrato?', peso: 2 },
  { id: 'agua', txt: '¿El agua tarda en filtrar o se queda encharcada arriba?', peso: 2 },
  { id: 'agujero', txt: '¿La maceta NO tiene agujero de drenaje?', peso: 4 },
];
function compMaceta() {
  const total = PREGUNTAS.reduce((s, q) => s + (resp[q.id] ? q.peso : 0), 0);
  const contestadas = PREGUNTAS.filter((q) => resp[q.id] !== undefined).length;
  const veredicto = resp.agujero ? ['urgente', 'Cámbiala ya a una maceta con agujero', 'Sin drenaje el agua se acumula en el fondo y pudre las raíces, sobre todo en cactus y suculentas.']
    : total >= 5 ? ['si', 'Toca trasplantar', 'Pásala a una maceta 2-4 cm más ancha con sustrato nuevo. En cactus, trasplanta en seco y no riegues en una semana.']
    : total >= 3 ? ['quizas', 'Pronto necesitará maceta nueva', 'Puedes esperar a su época de crecimiento. Mientras, renueva los 2-3 cm de sustrato de arriba.']
    : ['no', 'Su maceta está bien', 'No hace falta trasplantar ahora. Vuelve a comprobarlo dentro de unos meses.'];
  return {
    html: `${cabDetalle('Comprobación de maceta')}<div class="contenido herramienta">
      ${PREGUNTAS.map((q) => `<section class="tarjeta pregunta"><p>${esc(q.txt)}</p><div class="fila-botones">${[['si', 'Sí'], ['no', 'No']].map(([v, t]) => `<button class="opcion-btn ${resp[q.id] === (v === 'si') ? 'on' : ''}" data-q="${q.id}" data-v="${v}">${t}</button>`).join('')}</div></section>`).join('')}
      ${contestadas >= 3 ? `<section class="tarjeta veredicto v-${veredicto[0]}"><h3>${ico('maceta')} ${veredicto[1]}</h3><p>${veredicto[2]}</p>
        ${veredicto[0] !== 'no' && datos.plantas.length ? '<button class="btn ancho" data-recordar>Crear tarea de trasplante</button>' : ''}</section>` : '<p class="sub centrado">Contesta al menos 3 preguntas para ver el resultado.</p>'}
    </div>`,
    despues(v) {
      v.addEventListener('click', async (ev) => {
        const b = ev.target.closest('[data-q]');
        if (b) { resp[b.dataset.q] = b.dataset.v === 'si'; repintar(); }
        if (ev.target.closest('[data-recordar]')) {
          const { elegirPlanta } = await import('./plantas.js');
          const id = await elegirPlanta('¿Qué planta?');
          if (!id) return;
          const p = planta(id);
          const cada = p.recordatorios.trasplante?.cada || 730;
          // que el trasplante toque esta semana
          p.recordatorios.trasplante = { on: true, cada, ultimo: sumar(hoy(), -cada + (veredicto[0] === 'quizas' ? 30 : 0)) };
          guardarPlanta(p);
          aviso(`Trasplante el ${fechaLarga(vencimiento(p, 'trasplante')).toLowerCase()}`);
        }
      });
    },
  };
}

/* Qué hacer este mes con tus plantas. */
function temporada() {
  const m = new Date().getMonth();
  const consejos = [
    ['Enero', 'Riega poco los cactus y suculentas de verano: están en reposo. Los bejeques, tabaibas y verodes están en plena actividad: riégalos cuando se sequen. Aprovecha para limpiar hojas de las plantas de interior.'],
    ['Febrero', 'Empieza a preparar sustratos y macetas. Siembra en semillero tomates y pimientos. Los Aeonium siguen creciendo: es buen mes para esquejes.'],
    ['Marzo', 'Retoma el riego normal en cactus y el abono en interior. Trasplanta cactus y plantas de interior que lo necesiten. Revisa si hay pulgón en los brotes.'],
    ['Abril', 'Mes ideal para trasplantar y reproducir por esqueje casi todo. Aclimata al sol poco a poco las plantas que saques fuera.'],
    ['Mayo', 'Sube la frecuencia de riego en exterior. Los Aeonium empiezan a cerrar rosetas: reduce su riego. Vigila cochinilla y araña roja.'],
    ['Junio', 'Protege con malla las suculentas recién trasplantadas del sol de la tarde. Riega temprano o al atardecer. Tabaibas y bejeques, casi sin agua.'],
    ['Julio', 'Calor: más riego en macetas pequeñas y de barro. Pulveriza las tropicales. No trasplantes con calor fuerte. Vigila quemaduras en la azotea.'],
    ['Agosto', 'Agrupa las macetas para que conserven humedad. Al final del mes, despiertan los Aeonium y las piedras vivas: vuelve a regarlos poco a poco.'],
    ['Septiembre', 'Buen momento para trasplantar y esquejar suculentas de invierno (Aeonium, tabaibas). Empieza a reducir el abono de las plantas de interior.'],
    ['Octubre', 'Reduce el riego de cactus y suculentas de verano. Retira el abono en interior. Entra las tropicales que estén fuera si bajan de 12 °C por la noche.'],
    ['Noviembre', 'Cactus casi sin agua hasta marzo. Más luz para las plantas de interior: acércalas a la ventana. Época de plantar flora canaria en el jardín con las lluvias.'],
    ['Diciembre', 'Flor de Pascua lejos de radiadores y corrientes, riego moderado. Cactus de Navidad en flor: no lo muevas de sitio. Revisa plagas en interior.'],
  ][m];
  const mias = datos.plantas.map((p) => ({ p, e: especie(p.especie) })).filter((x) => x.e);
  const paradas = mias.filter((x) => ['S', 'R'].includes(x.e.meses[m]));
  const activas = mias.filter((x) => x.e.meses[m] === 'N');
  return {
    html: `${cabDetalle('Qué hacer este mes')}<div class="contenido herramienta">
      <section class="tarjeta"><h3>${ico('calendario', 'verde')} ${consejos[0]}</h3><p>${esc(consejos[1])}</p></section>
      ${activas.length ? `<section class="tarjeta"><h3>${ico('regadera', 'azul')} En crecimiento</h3><p>${activas.map((x) => esc(x.p.nombre)).join(', ')}</p></section>` : ''}
      ${paradas.length ? `<section class="tarjeta"><h3>${ico('reloj', 'naranja')} En reposo: poco o ningún riego</h3><p>${paradas.map((x) => esc(x.p.nombre)).join(', ')}</p></section>` : ''}
      ${chatHTML('temporada', { titulo: 'Plan personalizado', sugerencias: ['¿Qué hago este mes con mis plantas?'] })}
    </div>`,
    despues(v) {
      activarChat(v, 'temporada', `Mes actual: ${consejos[0]}. Plantas del usuario: ${mias.map((x) => `${x.p.nombre} (${x.e.cientifico}, ${sitio(x.p.sitio)?.nombre || 'sin sitio'})`).join('; ') || 'ninguna aún'}.`);
    },
  };
}
