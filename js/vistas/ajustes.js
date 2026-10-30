/* Ajustes: apariencia, nombres, ubicación, catálogo propio, calendario y copia de seguridad.
 * Cada bloque es un desplegable para que la página no se haga larga. */
import { $, $$, esc, store, cat, slug, uid, hoy, sumar, datos, especie, refrescarCatalogo, tareasEntre, sitio, fotos, blobABase64, reducirImagen, elegirFoto, vaciarCacheFotos, nombrePlanta, prefs, VERSION } from '../core.js';
import { TIPOS } from '../contenido.js';
import { coleccionLocal, importarColeccion } from '../importar.js';
import { TEMAS, ajustesTema, guardarTema, restablecerTema, muestra } from '../tema.js';
import { rutas, ir, hoja, aviso, confirmar, cabDetalle, segmentado, filaEspecie, repintar, ico } from '../ui.js';

const abiertos = new Set(['apariencia']);
const COLORES = {
  acento: { nombre: 'Botones y destacados', ops: ['#22c993', '#2e8b57', '#2f8fe0', '#8b6cf0', '#cf7a36', '#ec6a73', '#e0a10b', '#e85a2a', '#1f2a27'] },
  fondo: { nombre: 'Fondo', ops: ['#ffffff', '#f5f7f6', '#fffaf3', '#f3f6ff', '#fdf3f5', '#101614', '#141414', '#171428'] },
  texto: { nombre: 'Texto', ops: ['#1c2522', '#2b2b2b', '#0d3b2c', '#1f2a44', '#4a2c1a', '#f2f5f4', '#ffffff'] },
  tarjeta: { nombre: 'Tarjetas', ops: ['#ffffff', '#fbfaf7', '#f0f6f3', '#f4f1ff', '#1b2420', '#1f1f1f', '#252036'] },
  cabecera: { nombre: 'Cabecera', ops: ['#dcfaee', '#e4f0ff', '#efe8ff', '#ffefdf', '#ffe6e8', '#eceff1', '#0f2a21', '#1d1d1d'] },
};
const NOMBRE_ESQ = { rectas: 'Rectas', suaves: 'Suaves', redondas: 'Muy redondas' };
const NOMBRE_LETRA = { pequena: 'Pequeña', normal: 'Normal', grande: 'Grande', enorme: 'Muy grande' };
const MODO = { auto: 'automático', claro: 'claro', oscuro: 'oscuro' };

function seccion(id, icono, titulo, resumen, cuerpo) {
  return `<details class="ajuste" data-sec="${id}" ${abiertos.has(id) ? 'open' : ''}>
    <summary><span class="aj-ico">${ico(icono)}</span><span class="aj-txt"><strong>${esc(titulo)}</strong><span data-resumen="${id}">${resumen}</span></span>${ico('abajo', 'tenue aj-flecha')}</summary>
    <div class="aj-cuerpo">${cuerpo}</div></details>`;
}
function filaColor(k, a) {
  const c = COLORES[k], actual = a[k];
  return `<div class="fila-color" data-color="${k}">
    <div class="fila-color-cab"><span>${c.nombre}</span><button class="btn-texto" data-color-auto="${k}" ${actual ? '' : 'hidden'}>Del tema</button></div>
    <div class="muestras">${c.ops.map((v) => `<button class="muestra ${actual === v ? 'on' : ''}" style="--m:${v}" data-color-k="${k}" data-color-v="${v}" aria-label="${v}"></button>`).join('')}
      <label class="muestra propia ${actual && !c.ops.includes(actual) ? 'on' : ''}" style="--m:${actual || 'transparent'}" aria-label="Otro color">${ico('paleta')}<input type="color" data-color-input="${k}" value="${actual || c.ops[0]}"></label></div>
  </div>`;
}
const resumenApariencia = (a) => `${esc(TEMAS.find((t) => t.id === a.tema)?.nombre || 'Menta')} · modo ${MODO[a.modo]}`;
const resumenColores = (a) => { const n = Object.keys(COLORES).filter((k) => a[k]).length; return n ? `${n} ${n === 1 ? 'color propio' : 'colores propios'}` : 'Los del tema'; };
const resumenFondo = (a) => [a.fotoFondo ? 'Con foto' : 'Sin foto', a.transp ? `translucidez ${Math.round(a.transp * 100)} %` : 'opaco'].join(' · ');
const resumenFormas = (a) => `Esquinas ${NOMBRE_ESQ[a.esquinas].toLowerCase()} · letra ${NOMBRE_LETRA[a.letra].toLowerCase()}`;

rutas.ajustes = () => {
  const a = ajustesTema();
  const pr = prefs();
  const ciudad = store.get('ciudad', null);
  const propias = store.get('especiesPropias', []);
  const vieja = coleccionLocal();
  const ejemplo = especie('aeonium-canariense') || cat.especies[0];
  return {
    html: `${cabDetalle('Ajustes')}<div class="contenido ajustes">
      <h2 class="seccion-tit">Personalización</h2>
      ${seccion('apariencia', 'paleta', 'Tema', resumenApariencia(a), `
        <div class="rejilla-temas">${TEMAS.map((t) => { const m = muestra(t, a.modo === 'oscuro' ? 'oscuro' : 'claro'); return `<button class="tema ${t.id === a.tema ? 'on' : ''}" data-tema="${t.id}">
          <span class="tema-muestra" style="background:${m.fondo}"><i style="background:${m.cab}"></i><b style="background:${m.tarjeta}"><u style="background:${m.acento}"></u></b></span><span>${esc(t.nombre)}</span></button>`; }).join('')}</div>
        <div class="campo"><span>Modo</span>${segmentado('modo', [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']], a.modo)}</div>
        <p class="sub">En automático sigue el modo claro u oscuro del iPhone.</p>`)}
      ${seccion('colores', 'capas', 'Colores', resumenColores(a), `
        ${Object.keys(COLORES).map((k) => filaColor(k, a)).join('')}
        <label class="interruptor"><span>Degradado en la parte de arriba</span><input type="checkbox" data-t="degradado" ${a.degradado ? 'checked' : ''}><i></i></label>`)}
      ${seccion('fondo', 'foto', 'Fondo y transparencia', resumenFondo(a), `
        <div class="fila-botones"><button class="btn sec" data-foto-fondo>${ico('foto')} ${a.fotoFondo ? 'Cambiar foto' : 'Poner una foto de fondo'}</button>${a.fotoFondo ? `<button class="btn sec peligro" data-quitar-fondo>${ico('basura')} Quitar</button>` : ''}</div>
        ${a.fotoFondo ? `<label class="deslizador">Velo sobre la foto <strong data-val="velo">${Math.round(a.velo * 100)} %</strong><input type="range" min="0" max="0.85" step="0.05" value="${a.velo}" data-r="velo"></label>` : ''}
        <label class="deslizador">Translucidez de tarjetas y barras <strong data-val="transp">${Math.round(a.transp * 100)} %</strong><input type="range" min="0" max="0.8" step="0.05" value="${a.transp}" data-r="transp"></label>
        <label class="interruptor"><span>Desenfocar lo que hay detrás</span><input type="checkbox" data-t="desenfoque" ${a.desenfoque ? 'checked' : ''}><i></i></label>`)}
      ${seccion('formas', 'texto', 'Formas y letra', resumenFormas(a), `
        <div class="campo"><span>Esquinas</span>${segmentado('esquinas', Object.entries(NOMBRE_ESQ), a.esquinas)}</div>
        <div class="campo"><span>Tamaño de la letra</span>${segmentado('letra', Object.entries(NOMBRE_LETRA), a.letra)}</div>`)}
      <button class="btn sec ancho" data-restablecer>${ico('rotar')} Restablecer la apariencia</button>

      <h2 class="seccion-tit">Plantas</h2>
      ${seccion('nombres', 'libro', 'Nombres de las especies', pr.nombres === 'cientifico' ? 'Científico primero' : 'Común primero', `
        ${segmentado('nombres', [['comun', 'Común primero'], ['cientifico', 'Científico primero']], pr.nombres === 'cientifico' ? 'cientifico' : 'comun')}
        <div class="ejemplo-nombre">${pr.nombres === 'cientifico' ? `<strong class="cient">${esc(ejemplo.cientifico)}</strong><em class="comun">${esc(ejemplo.nombre)}</em>` : `<strong>${esc(ejemplo.nombre)}</strong><em>${esc(ejemplo.cientifico)}</em>`}</div>
        <p class="sub">Se aplica a las tarjetas, listas, fichas y tareas. En tus plantas, el apodo pasa a segundo plano.</p>`)}
      ${seccion('catalogo', 'plantas', 'Mi catálogo', `${cat.especies.length} especies${propias.length ? ` · ${propias.length} tuyas` : ''}`, `
        <p>Si falta alguna especie, añádela aquí o pide que la sumen al catálogo fijo.</p>
        <button class="btn ancho" data-esp-mano>${ico('mas')} Añadir una especie</button>
        ${propias.length ? `<div class="lista-propias">${propias.map((e) => filaEspecie(especie(e.id) || e)).join('')}</div>
        <button class="btn-texto" data-exp-propias>${ico('descargar')} Exportar mis especies</button>` : ''}`)}
      ${seccion('tiempo', 'ubicacion', 'Ubicación para el tiempo', ciudad ? esc(ciudad.nombre) : 'Sin elegir', `
        <p>${ciudad ? `Ahora: <strong>${esc(ciudad.nombre)}</strong>${ciudad.auto ? ' (tu ubicación)' : ''}.` : 'Aún no has elegido ubicación.'} Se cambia tocando el tiempo en la pestaña Tareas.</p>
        <a class="btn sec ancho" href="#/tareas">Ir a Tareas</a>`)}
      ${seccion('avisos', 'calendario', 'Avisos en el Calendario', 'Próximos 60 días', `
        <p>Una web no puede enviar avisos con la app cerrada. Para que el iPhone te recuerde las tareas, añádelas a tu Calendario: se crean eventos con alarma a las 9:00.</p>
        <button class="btn ancho" data-ics>${ico('calendario')} Añadir tareas al Calendario</button>`)}

      <h2 class="seccion-tit">Datos</h2>
      ${seccion('plantitus', 'subir', 'Traer plantas de Plantitus', vieja ? `${vieja.plantas.length} plantas disponibles` : 'Nada que traer', `
        <p>${vieja ? `Plantitus tiene <strong>${vieja.plantas.length}</strong> ${vieja.plantas.length === 1 ? 'planta' : 'plantas'} en este iPhone. Puedes copiarlas aquí con sus fotos, zonas, historial y pautas de riego.` : 'No hay plantas de Plantitus en este navegador. Si las tienes en otro dispositivo, exporta allí una copia de Plantitus e impórtala con «Importar».'}</p>
        ${vieja ? `<button class="btn ancho" data-plantitus>${ico('subir')} Copiar mis plantas de Plantitus</button>` : ''}
        ${store.get('importadoPlantitus', null) ? `<p class="sub">Última importación: ${esc(store.get('importadoPlantitus'))}. Las plantas ya copiadas no se duplican.</p>` : ''}`)}
      ${seccion('copia', 'descargar', 'Copia de seguridad', 'Exportar o importar', `
        <p>Tus plantas, fotos, especies y ajustes se guardan solo en este dispositivo. Haz una copia de vez en cuando y guárdala en iCloud Drive o Archivos.</p>
        <div class="fila-botones"><button class="btn" data-exportar>${ico('descargar')} Exportar</button><button class="btn sec" data-importar>${ico('subir')} Importar</button></div>`)}
      ${seccion('borrar', 'basura', 'Borrar datos', 'Caché de fotos y datos', `
        <div class="lista-enlaces">
          <button data-borrar-cache><span>Volver a buscar las fotos de las especies</span>${ico('chevron', 'tenue')}</button>
          <button class="peligro" data-borrar-todo><span>Borrar todos mis datos</span>${ico('basura')}</button>
        </div>`)}
      <p class="sub centrado">Plantitus Pro ${VERSION} · Fotos de especies: Wikimedia Commons · Tiempo: Open-Meteo</p>
    </div>`,
    despues(v) {
      const actualizarResumenes = () => {
        const x = ajustesTema();
        const set = (k, t) => { const el = $(`[data-resumen="${k}"]`, v); if (el) el.innerHTML = t; };
        set('apariencia', resumenApariencia(x)); set('colores', resumenColores(x)); set('fondo', resumenFondo(x)); set('formas', resumenFormas(x));
      };
      v.addEventListener('toggle', (e) => {
        const d = e.target.closest?.('details[data-sec]');
        if (d) { if (d.open) abiertos.add(d.dataset.sec); else abiertos.delete(d.dataset.sec); }
      }, true);
      v.addEventListener('input', (e) => {
        const r = e.target.dataset.r;
        if (r) {
          guardarTema({ [r]: +e.target.value });
          const val = $(`[data-val="${r}"]`, v); if (val) val.textContent = Math.round(e.target.value * 100) + ' %';
          actualizarResumenes();
        }
        const ci = e.target.dataset.colorInput;
        if (ci) {
          guardarTema({ [ci]: e.target.value });
          const fila = e.target.closest('.fila-color');
          $$('.muestra', fila).forEach((m) => m.classList.remove('on'));
          const lab = e.target.closest('.muestra'); lab.classList.add('on'); lab.style.setProperty('--m', e.target.value);
          $('[data-color-auto]', fila).hidden = false;
          actualizarResumenes();
        }
      });
      v.addEventListener('change', (e) => {
        const t = e.target.dataset.t;
        if (t) { guardarTema({ [t]: e.target.checked }); actualizarResumenes(); }
      });
      v.addEventListener('click', async (e) => {
        const seg = e.target.closest('[data-seg] button');
        if (seg) {
          const k = seg.closest('[data-seg]').dataset.seg;
          if (k === 'nombres') { store.set('prefs', { ...prefs(), nombres: seg.dataset.v }); repintar(); return; }
          guardarTema({ [k]: seg.dataset.v }); repintar(); return;
        }
        const tm = e.target.closest('[data-tema]');
        if (tm) { guardarTema({ tema: tm.dataset.tema, acento: '', fondo: '', texto: '', tarjeta: '', cabecera: '' }); repintar(); return; }
        const cm = e.target.closest('[data-color-k]');
        if (cm) { guardarTema({ [cm.dataset.colorK]: cm.dataset.colorV }); repintar(); return; }
        const ca = e.target.closest('[data-color-auto]');
        if (ca) { guardarTema({ [ca.dataset.colorAuto]: '' }); repintar(); return; }
        if (e.target.closest('[data-foto-fondo]')) {
          const f = await elegirFoto();
          if (!f) return;
          const ant = ajustesTema().fotoFondo;
          const id = await fotos.guardar(await reducirImagen(f, 1600, 0.82), 'fondo-' + uid());
          if (ant) fotos.borrar(ant);
          const x = ajustesTema();
          guardarTema({ fotoFondo: id, transp: x.transp || 0.25, degradado: x.degradado });
          abiertos.add('fondo'); repintar(); return;
        }
        if (e.target.closest('[data-quitar-fondo]')) { const ant = ajustesTema().fotoFondo; if (ant) fotos.borrar(ant); guardarTema({ fotoFondo: null }); repintar(); return; }
        if (e.target.closest('[data-restablecer]')) {
          if (await confirmar('¿Volver al tema Menta con los colores y formas de siempre?', { si: 'Restablecer' })) { restablecerTema(); repintar(); }
          return;
        }
        if (e.target.closest('[data-esp-mano]')) editarEspeciePropia(null);
        if (e.target.closest('[data-exp-propias]')) exportarPropias();
        if (e.target.closest('[data-ics]')) exportarICS();
        if (e.target.closest('[data-exportar]')) exportarCopia();
        if (e.target.closest('[data-importar]')) importarCopia();
        if (e.target.closest('[data-plantitus]')) {
          const b = e.target.closest('[data-plantitus]');
          b.disabled = true; b.textContent = 'Copiando…';
          const r = await importarColeccion(coleccionLocal());
          avisoImportacion(r);
          ir('plantas');
        }
        if (e.target.closest('[data-borrar-cache]')) { vaciarCacheFotos(); aviso('Las fotos se volverán a buscar'); }
        if (e.target.closest('[data-borrar-todo]') && await confirmar('Se borrarán tus plantas, sitios, fotos, favoritas, especies propias y ajustes. ¿Seguro?', { si: 'Borrarlo todo', peligro: true })) {
          for (const k of Object.keys(localStorage)) if (k.startsWith('pp.')) localStorage.removeItem(k);
          indexedDB.deleteDatabase('plantitus-pro');
          aviso('Datos borrados');
          setTimeout(() => location.reload(), 600);
        }
      });
    },
  };
};

/* ---------- especies propias ---------- */
const GRUPO_DEF = (g) => {
  // valores por defecto del grupo (copiados del generador)
  const d = {
    cactus: [14, 30, 'RRNNNNNNNNRR', 4, '000111111000', 5, 30], cactus_delicado: [18, 0, 'SSRNNNNNNRSS', 6, '000111100000', 6, 25],
    cactus_selva: [7, 12, 'NNNNNNNNNRRN', 3, '001111111000', 10, 55], suculenta: [10, 21, 'RRNNNNNNNNNR', 4, '001111111000', 4, 40],
    suculenta_invernal: [10, 25, 'NNNNNRRRNNNN', 4, '110000000111', 3, 45], tabaiba: [14, 30, 'NNNNNRRRRNNN', 8, '110000000011', 3, 40],
    mesemb: [14, 30, 'SSSNNRRRNNNS', 0, '000000000000', 5, 30], mesemb_invernal: [12, 0, 'NNNNRSSSNNNN', 0, '000000000000', 5, 35],
    caudex: [10, 0, 'SSRNNNNNNNRS', 3, '000111111000', 10, 35], interior: [7, 12, 'RRNNNNNNNNRR', 2, '001111111100', 12, 50],
    tropical: [5, 8, 'RRNNNNNNNNRR', 2, '001111111100', 15, 65], helecho: [4, 7, 'RRNNNNNNNNRR', 4, '001111110000', 10, 65],
    orquidea: [7, 10, 'NNNNNNNNNNNN', 2, '111111111111', 15, 60], bromelia: [7, 12, 'NNNNNNNNNNNN', 4, '001111110000', 12, 55],
    tillandsia: [4, 7, 'NNNNNNNNNNNN', 4, '001111110000', 8, 60], palmera: [7, 14, 'RRNNNNNNNNRR', 4, '001111110000', 8, 50],
    aromatica: [3, 7, 'RRNNNNNNNNRR', 4, '001111110000', 2, 45], huerto: [2, 4, 'NNNNNNNNNNNN', 2, '011111111100', 8, 55],
    flor: [3, 7, 'RRNNNNNNNNRR', 2, '001111111000', 5, 50], arbusto: [7, 18, 'RRNNNNNNNNRR', 6, '001111100000', 2, 45],
    arbusto_canario: [10, 21, 'NNNNNRRRRNNN', 8, '110000000011', 2, 45], arbol: [10, 25, 'RRNNNNNNNNRR', 8, '001111000000', 0, 45],
    carnivora: [2, 4, 'NNNNNNNNNNNN', 0, '000000000000', 3, 70], trepadora: [4, 10, 'RRNNNNNNNNRR', 3, '001111110000', 3, 50],
    bulbosa: [6, 0, 'NNNNRSSSNNNN', 3, '011100000000', 3, 50],
  }[g] || [7, 12, 'RRNNNNNNNNRR', 2, '001111111100', 12, 50];
  return { rv: d[0], ri: d[1], meses: d[2], abono: d[3], abonoMeses: d[4], tmin: d[5], hum: d[6] };
};
function guardarPropia(e) {
  const l = store.get('especiesPropias', []);
  const i = l.findIndex((x) => x.id === e.id);
  if (i >= 0) l[i] = e; else l.push(e);
  store.set('especiesPropias', l);
  refrescarCatalogo();
  return especie(e.id);
}
export function crearEspeciePropia({ nombre, cientifico, grupo = 'interior', luz = 'semi', dificultad = 'M', tags = [], ...resto }) {
  let id = slug(cientifico || nombre) || 'especie-' + uid();
  if (especie(id) && !especie(id).propia) id += '-propia';
  return guardarPropia({ id, nombre, cientifico: cientifico || nombre, grupo, luz, dificultad, tags, ...GRUPO_DEF(grupo), ...resto });
}
export function editarEspeciePropia(id, nombreInicial = '') {
  const e = id ? especie(id) : { nombre: nombreInicial, cientifico: '', grupo: 'suculenta', luz: 'sol', dificultad: 'F', tags: [], ...GRUPO_DEF('suculenta') };
  const TAGS = [['end', 'Endemismo canario'], ['nat', 'Nativa de Canarias'], ['tox', 'Tóxica para mascotas'], ['int', 'Interior'], ['ext', 'Exterior'], ['flor', 'Flor vistosa'], ['colg', 'Colgante'], ['com', 'Comestible'], ['aire', 'Purifica el aire']];
  const mesesSel = (nom, val, ops) => `<div class="meses-sel" data-meses="${nom}">${'EFMAMJJASOND'.split('').map((l, i) => `<button type="button" data-i="${i}" class="m-${val[i]}">${l}</button>`).join('')}</div><p class="sub">${ops}</p>`;
  const h = hoja(`<form class="form">
    <label>Nombre común<input name="nombre" value="${esc(e.nombre)}" required></label>
    <label>Nombre científico<input name="cientifico" value="${esc(e.cientifico)}" required autocapitalize="off"></label>
    <label>Tipo<select name="grupo">${Object.entries(cat.grupos).map(([k, g]) => `<option value="${k}" ${k === e.grupo ? 'selected' : ''}>${esc(g.nombre)}</option>`).join('')}</select></label>
    <label>Luz<select name="luz">${Object.entries(cat.luz).map(([k, t]) => `<option value="${k}" ${k === e.luz ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
    <label>Dificultad<select name="dificultad">${Object.entries(cat.dificultad).map(([k, t]) => `<option value="${k}" ${k === e.dificultad ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
    <div class="dos"><label>Riego en temporada (días)<input type="number" name="rv" min="1" value="${e.rv}"></label><label>Riego en reposo (días, 0 = no)<input type="number" name="ri" min="0" value="${e.ri}"></label></div>
    <div class="campo"><span>Riego por meses (toca para cambiar)</span>${mesesSel('meses', e.meses, 'Verde: normal · Amarillo: reposo · Gris: sin riego')}</div>
    <div class="dos"><label>Abono cada (semanas, 0 = no)<input type="number" name="abono" min="0" value="${e.abono}"></label><label>Mínima (°C)<input type="number" name="tmin" value="${e.tmin}"></label></div>
    <div class="campo"><span>Meses de abono</span>${mesesSel('abonoMeses', e.abonoMeses.replace(/1/g, 'N').replace(/0/g, 'S'), 'Verde: se abona')}</div>
    <div class="campo"><span>Etiquetas</span><div class="opciones">${TAGS.map(([k, t]) => `<label class="opcion"><input type="checkbox" name="tag" value="${k}" ${e.tags.includes(k) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>
    <button class="btn ancho">Guardar especie</button>
    ${id ? '<button type="button" class="btn sec peligro ancho" data-borrar>Eliminar especie</button>' : ''}
  </form>`, { titulo: id ? 'Editar especie' : 'Nueva especie', clase: 'alta' });
  const vals = { meses: e.meses, abonoMeses: e.abonoMeses.replace(/1/g, 'N').replace(/0/g, 'S') };
  h.el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-meses] button');
    if (b) {
      const k = b.parentElement.dataset.meses, i = +b.dataset.i;
      const ciclo = k === 'meses' ? { N: 'R', R: 'S', S: 'N' } : { N: 'S', S: 'N' };
      const arr = [...vals[k]]; arr[i] = ciclo[arr[i]] || 'N'; vals[k] = arr.join('');
      b.className = 'm-' + arr[i];
    }
    if (ev.target.closest('[data-borrar]') && await confirmar('¿Eliminar esta especie de tu catálogo? Las plantas que la usen se quedarán sin pauta.', { si: 'Eliminar', peligro: true })) {
      store.set('especiesPropias', store.get('especiesPropias', []).filter((x) => x.id !== id));
      refrescarCatalogo(); h.cerrar(); ir('ajustes', { reemplazar: true });
    }
  });
  $('[name=grupo]', h.el).onchange = (ev) => {
    const d = GRUPO_DEF(ev.target.value);
    for (const k of ['rv', 'ri', 'abono', 'tmin']) $(`[name=${k}]`, h.el).value = d[k];
    vals.meses = d.meses; vals.abonoMeses = d.abonoMeses.replace(/1/g, 'N').replace(/0/g, 'S');
    $$('[data-meses]', h.el).forEach((box) => $$('button', box).forEach((bt, i) => { bt.className = 'm-' + vals[box.dataset.meses][i]; }));
  };
  $('form', h.el).onsubmit = (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const datosE = {
      nombre: fd.get('nombre').trim(), cientifico: fd.get('cientifico').trim(), grupo: fd.get('grupo'), luz: fd.get('luz'), dificultad: fd.get('dificultad'),
      rv: Math.max(1, +fd.get('rv') || 7), ri: Math.max(0, +fd.get('ri') || 0), abono: Math.max(0, +fd.get('abono') || 0), tmin: +fd.get('tmin') || 5,
      meses: vals.meses, abonoMeses: vals.abonoMeses.replace(/N/g, '1').replace(/[RS]/g, '0'), tags: fd.getAll('tag'),
      hum: e.hum ?? 50,
    };
    const n = id ? guardarPropia({ ...e, ...datosE, propia: undefined }) : crearEspeciePropia(datosE);
    h.cerrar(); aviso('Especie guardada');
    ir('especie/' + n.id);
  };
}
function exportarPropias() {
  const l = store.get('especiesPropias', []);
  const g = (e) => `${e.nombre}|${e.cientifico}|${e.grupo}|${e.luz}|${e.dificultad}|${e.tags.join(',')}|rv=${e.rv};ri=${e.ri};meses=${e.meses};tmin=${e.tmin}`;
  descargar(new Blob([l.map(g).join('\n') + '\n'], { type: 'text/plain' }), 'mis-especies.txt');
  aviso('Líneas listas para añadir a tools/especies.py');
}

/* ---------- calendario (.ics) ---------- */
export function exportarICS() {
  const ts = tareasEntre(hoy(), sumar(hoy(), 60));
  if (!ts.length) { aviso('No hay tareas en los próximos 60 días'); return; }
  const porDia = {};
  for (const t of ts) (porDia[t.fecha] ||= []).push(t);
  const ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const escICS = (s) => String(s).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ev = Object.entries(porDia).map(([f, l]) => {
    const d = f.replace(/-/g, '');
    const tipos = [...new Set(l.map((t) => TIPOS[t.tipo].nombre))].join(', ');
    return ['BEGIN:VEVENT', `UID:plantitus-pro-${d}@plantitus`, `DTSTAMP:${ahora}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${sumar(f, 1).replace(/-/g, '')}`,
      `SUMMARY:${escICS(`🌿 Plantas: ${tipos}`)}`, `DESCRIPTION:${escICS(l.map((t) => `${TIPOS[t.tipo].verbo}: ${nombrePlanta(t.planta)}${sitio(t.planta.sitio) ? ` (${sitio(t.planta.sitio).nombre})` : ''}`).join('\n'))}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Tareas de plantas', 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  });
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Plantitus Pro//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Plantitus Pro', ...ev, 'END:VCALENDAR'].join('\r\n');
  descargar(new Blob([ics], { type: 'text/calendar' }), 'plantitus-tareas.ics');
  aviso('Abre el archivo para añadir las tareas al Calendario');
}

/* ---------- copia de seguridad ---------- */
function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function exportarCopia() {
  const todas = await fotos.todas();
  const f = {};
  for (const [k, b] of Object.entries(todas)) f[k] = await blobABase64(b);
  const copia = {
    app: 'plantitus-pro', version: 1, fecha: new Date().toISOString(),
    plantas: datos.plantas, sitios: datos.sitios, favoritos: datos.favoritos,
    especiesPropias: store.get('especiesPropias', []), ciudad: store.get('ciudad', null), fotos: f,
    prefs: store.get('prefs', {}), tema: { ...store.get('tema', {}), fotoFondo: null }, fotoEsp: store.get('fotoEsp', {}),
  };
  descargar(new Blob([JSON.stringify(copia)], { type: 'application/json' }), `plantitus-pro-${hoy()}.json`);
  aviso('Copia exportada');
}
async function importarCopia() {
  const i = document.createElement('input');
  i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = async () => {
    const file = i.files?.[0];
    if (!file) return;
    let c;
    try { c = JSON.parse(await file.text()); } catch { aviso('El archivo no es una copia válida'); return; }
    if (c.app === 'plantitus' && c.coleccion?.plantas) {
      if (!await confirmar(`Es una copia de Plantitus con ${c.coleccion.plantas.length} plantas. Se añadirán a las que ya tienes. ¿Continuar?`, { si: 'Añadir' })) return;
      avisoImportacion(await importarColeccion(c.coleccion, c.fotos || {}));
      ir('plantas');
      return;
    }
    if (c.app !== 'plantitus-pro') { aviso('El archivo no es una copia de Plantitus ni de Plantitus Pro'); return; }
    if (!await confirmar(`Se sustituirán tus datos por los de la copia del ${new Date(c.fecha).toLocaleDateString('es-ES')} (${c.plantas?.length || 0} plantas). ¿Continuar?`, { si: 'Importar' })) return;
    datos.plantas = c.plantas || []; datos.sitios = c.sitios || datos.sitios; datos.favoritos = c.favoritos || [];
    store.set('especiesPropias', c.especiesPropias || []);
    if (c.ciudad) store.set('ciudad', c.ciudad);
    if (c.prefs) store.set('prefs', c.prefs);
    if (c.fotoEsp) store.set('fotoEsp', c.fotoEsp);
    if (c.tema) guardarTema(c.tema);
    for (const [k, b64] of Object.entries(c.fotos || {})) {
      const bin = atob(b64); const u = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
      await fotos.guardar(new Blob([u], { type: 'image/jpeg' }), k);
    }
    refrescarCatalogo();
    aviso('Copia importada');
    ir('plantas');
  };
  i.click();
}

function avisoImportacion(r) {
  if (!r.n) { aviso(r.saltadas ? 'Esas plantas ya estaban copiadas' : 'No había plantas que copiar'); return; }
  const sin = r.n - r.conEspecie;
  aviso(`${r.n} ${r.n === 1 ? 'planta copiada' : 'plantas copiadas'}${sin ? ` (${sin} sin especie del catálogo: revisa su ficha)` : ''}`);
}
