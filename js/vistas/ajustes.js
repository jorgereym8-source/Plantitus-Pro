/* Ajustes: asistente con IA, ubicación, catálogo propio, calendario y copia de seguridad. */
import { $, $$, esc, store, cat, slug, uid, hoy, sumar, datos, especie, refrescarCatalogo, tareasEntre, sitio, fotos, blobABase64, preguntarIA, preguntarIAJSON, ajustesIA, IA_POR_DEFECTO, MODELOS, iaLista, nombreIA, VERSION, activarImagenes } from '../core.js';
import { TIPOS } from '../contenido.js';
import { coleccionLocal, importarColeccion } from '../importar.js';
import { rutas, ir, hoja, aviso, confirmar, cabDetalle, segmentado, filaEspecie, repintar, ico } from '../ui.js';

rutas.ajustes = () => {
  const ia = ajustesIA();
  const a = ia.todo;
  const ciudad = store.get('ciudad', null);
  const propias = store.get('especiesPropias', []);
  const prov = ia.proveedor;
  const vieja = coleccionLocal();
  return {
    html: `${cabDetalle('Ajustes')}<div class="contenido ajustes">
      <h2 class="seccion-tit">Asistente con IA</h2>
      <section class="tarjeta form">
        <div class="campo"><span>Proveedor</span>${segmentado('prov', [['gemini', 'Gemini'], ['claude', 'Claude']], prov)}</div>
        <label>Clave de ${prov === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'}<input type="password" name="clave" value="${esc(a[prov + 'Clave'] || '')}" placeholder="${prov === 'claude' ? 'sk-ant-…' : 'AIza…'}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
        <label>Modelo<input name="modelo" list="modelos" value="${esc(a[prov + 'Modelo'] || IA_POR_DEFECTO[prov])}" autocapitalize="off" spellcheck="false"><datalist id="modelos">${MODELOS[prov].map((m) => `<option value="${m}">`).join('')}</datalist></label>
        <p class="sub">${prov === 'claude' ? 'Consigue la clave en <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Se paga por uso (céntimos por consulta).' : 'Consigue una clave gratuita en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>.'} La clave se guarda solo en este dispositivo.</p>
        <div class="fila-botones"><button class="btn" data-guardar-ia>Guardar</button><button class="btn sec" data-probar>Probar</button></div>
        <p class="sub" id="iaEstado">${iaLista() ? `Activo: ${nombreIA()} (${esc(ia.modelo)})` : 'Sin clave: el diagnóstico, la identificación y el chat no funcionarán.'}</p>
      </section>

      <h2 class="seccion-tit">Ubicación para el tiempo</h2>
      <section class="tarjeta lista-enlaces">
        <a href="#/tareas" data-ciudad><span>${ciudad ? esc(ciudad.nombre) + (ciudad.auto ? ' (ubicación actual)' : '') : 'Sin elegir'}</span><em class="sub">Se cambia tocando el tiempo en Tareas</em></a>
      </section>

      <h2 class="seccion-tit">Mi catálogo</h2>
      <section class="tarjeta">
        <p>El catálogo tiene <strong>${cat.especies.length}</strong> especies${propias.length ? `, ${propias.length} añadidas por ti` : ''}. Si falta alguna, añádela aquí.</p>
        <div class="fila-botones"><button class="btn" data-esp-ia>${ico('chispa')} Añadir con IA</button><button class="btn sec" data-esp-mano>${ico('editar')} A mano</button></div>
        ${propias.length ? `<div class="lista-propias">${propias.map((e) => filaEspecie(especie(e.id) || e)).join('')}</div>
        <button class="btn-texto" data-exp-propias>${ico('descargar')} Exportar mis especies</button>` : ''}
      </section>

      <h2 class="seccion-tit">Avisos</h2>
      <section class="tarjeta">
        <p>Una web no puede enviar avisos con la app cerrada. Para que el iPhone te recuerde las tareas, añádelas a tu Calendario: se crean eventos de los próximos 60 días con alarma a las 9:00.</p>
        <button class="btn ancho" data-ics>${ico('calendario')} Añadir tareas al Calendario</button>
      </section>

      <h2 class="seccion-tit">Traer plantas de Plantitus</h2>
      <section class="tarjeta">
        <p>${vieja ? `Plantitus tiene <strong>${vieja.plantas.length}</strong> ${vieja.plantas.length === 1 ? 'planta' : 'plantas'} en este iPhone. Puedes copiarlas aquí con sus fotos, zonas, historial y pautas de riego.` : 'No hay plantas de Plantitus en este navegador. Si las tienes en otro dispositivo, exporta allí una copia de Plantitus e impórtala aquí con «Importar».'}</p>
        ${vieja ? `<button class="btn ancho" data-plantitus>${ico('subir')} Copiar mis plantas de Plantitus</button>` : ''}
        ${store.get('importadoPlantitus', null) ? `<p class="sub">Última importación: ${esc(store.get('importadoPlantitus'))}. Las plantas ya copiadas no se duplican.</p>` : ''}
      </section>

      <h2 class="seccion-tit">Copia de seguridad</h2>
      <section class="tarjeta">
        <p>Tus plantas, fotos y especies se guardan solo en este dispositivo. Haz una copia de vez en cuando y guárdala en iCloud Drive o Archivos.</p>
        <div class="fila-botones"><button class="btn" data-exportar>${ico('descargar')} Exportar</button><button class="btn sec" data-importar>${ico('subir')} Importar</button></div>
      </section>

      <h2 class="seccion-tit">Datos</h2>
      <section class="tarjeta lista-enlaces">
        <button data-borrar-cache><span>Vaciar la caché de fotos de Wikipedia</span>${ico('chevron', 'tenue')}</button>
        <button class="peligro" data-borrar-todo><span>Borrar todos mis datos</span>${ico('basura')}</button>
      </section>
      <p class="sub centrado">Plantitus Pro ${VERSION} · Fotos de especies: Wikipedia · Tiempo: Open-Meteo</p>
    </div>`,
    despues(v) {
      let p = prov;
      v.addEventListener('click', async (e) => {
        const seg = e.target.closest('[data-seg="prov"] button');
        if (seg) { const x = store.get('ia', {}); x.proveedor = seg.dataset.v; store.set('ia', x); repintar(); return; }
        if (e.target.closest('[data-guardar-ia]')) { guardarIA(v, p); aviso('Asistente guardado'); repintar(); }
        if (e.target.closest('[data-probar]')) {
          guardarIA(v, p);
          const est = $('#iaEstado', v);
          est.textContent = 'Probando…';
          try { const r = await preguntarIA([{ rol: 'user', texto: 'Responde solo: «Listo para cuidar tus plantas 🌿»' }], { max: 50 }); est.textContent = `✅ ${nombreIA()} responde: ${r}`; } catch (err) { est.textContent = `❌ ${err.message}`; }
        }
        if (e.target.closest('[data-esp-ia]')) { const n = await anadirEspecieIA(); if (n) ir('especie/' + n.id); }
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
        if (e.target.closest('[data-borrar-cache]')) { store.del('wiki'); aviso('Caché vaciada'); }
        if (e.target.closest('[data-borrar-todo]') && await confirmar('Se borrarán tus plantas, sitios, fotos, favoritas y especies propias. ¿Seguro?', { si: 'Borrarlo todo', peligro: true })) {
          for (const k of Object.keys(localStorage)) if (k.startsWith('pp.')) localStorage.removeItem(k);
          indexedDB.deleteDatabase('plantitus-pro');
          aviso('Datos borrados');
          setTimeout(() => location.reload(), 600);
        }
      });
    },
  };
};
function guardarIA(v, prov) {
  const x = store.get('ia', {});
  x.proveedor = prov;
  x[prov + 'Clave'] = $('[name=clave]', v).value.trim();
  x[prov + 'Modelo'] = $('[name=modelo]', v).value.trim() || IA_POR_DEFECTO[prov];
  store.set('ia', x);
}

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
export function editarEspeciePropia(id) {
  const e = id ? especie(id) : { nombre: '', cientifico: '', grupo: 'suculenta', luz: 'sol', dificultad: 'F', tags: [], ...GRUPO_DEF('suculenta') };
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
/* Pide a la IA la ficha de una especie y la añade al catálogo propio. */
export async function anadirEspecieIA(nombreInicial = '') {
  if (!iaLista()) { aviso('Añade antes una clave de IA en Ajustes'); return null; }
  return new Promise((ok) => {
    let res = null;
    const h = hoja(`<form class="form"><label>Nombre común o científico<input name="q" value="${esc(nombreInicial)}" required placeholder="Aeonium mascaense"></label>
      <button class="btn ancho">${ico('chispa')} Crear ficha con ${nombreIA()}</button><p class="sub" data-estado></p></form>`, { titulo: 'Añadir especie con IA', alCerrar: () => ok(res) });
    $('form', h.el).onsubmit = async (ev) => {
      ev.preventDefault();
      const q = new FormData(ev.target).get('q').trim();
      const est = $('[data-estado]', h.el);
      est.textContent = 'Preparando la ficha…';
      try {
        const grupos = Object.entries(cat.grupos).map(([k, g]) => `${k} (${g.nombre})`).join(', ');
        const j = await preguntarIAJSON(`Crea la ficha de cultivo de la planta «${q}» para un aficionado en Canarias. Devuelve {"nombre":"nombre común en español (de Canarias si lo tiene)","cientifico":"nombre científico aceptado","grupo":"una de: ${grupos}","luz":"sombra|semi|parcial|sol","dificultad":"F|M|D","rv":días entre riegos en temporada de crecimiento,"ri":días entre riegos en reposo (0 si no se riega),"meses":"12 letras enero→diciembre: N normal, R reposo, S sin riego","abono":semanas entre abonos (0 si no),"abonoMeses":"12 dígitos 1/0 enero→diciembre","tmin":temperatura mínima en ºC,"hum":humedad ideal %,"tags":["end" si es endemismo canario,"nat" si es nativa de Canarias,"mac" si es macaronésica,"tox" si es tóxica para mascotas,"int","ext","flor","colg","com","arom","inv" si es invasora en Canarias]}.`);
        const g = cat.grupos[j.grupo] ? j.grupo : 'interior';
        const limpio = {
          nombre: String(j.nombre || q).slice(0, 80), cientifico: String(j.cientifico || q).slice(0, 80), grupo: g,
          luz: cat.luz[j.luz] ? j.luz : 'semi', dificultad: ['F', 'M', 'D'].includes(j.dificultad) ? j.dificultad : 'M',
          tags: Array.isArray(j.tags) ? j.tags.filter((t) => ['end', 'nat', 'mac', 'tox', 'int', 'ext', 'flor', 'colg', 'com', 'arom', 'inv', 'aire', 'sombra', 'sueno'].includes(t)) : [],
        };
        const extra = {};
        if (+j.rv > 0) extra.rv = Math.round(+j.rv);
        if (+j.ri >= 0) extra.ri = Math.round(+j.ri);
        if (/^[NRS]{12}$/.test(j.meses || '')) extra.meses = j.meses;
        if (+j.abono >= 0) extra.abono = Math.round(+j.abono);
        if (/^[01]{12}$/.test(j.abonoMeses || '')) extra.abonoMeses = j.abonoMeses;
        if (Number.isFinite(+j.tmin)) extra.tmin = Math.round(+j.tmin);
        if (Number.isFinite(+j.hum)) extra.hum = Math.round(+j.hum);
        const ya = cat.especies.find((x) => x.cientifico.toLowerCase() === limpio.cientifico.toLowerCase());
        if (ya) { res = ya; aviso(`${ya.nombre} ya estaba en el catálogo`); h.cerrar(); return; }
        res = crearEspeciePropia({ ...limpio, ...extra });
        aviso(`${res.nombre} añadida al catálogo`);
        h.cerrar();
      } catch (err) { est.textContent = err.message; }
    };
  });
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
      `SUMMARY:${escICS(`🌿 Plantas: ${tipos}`)}`, `DESCRIPTION:${escICS(l.map((t) => `${TIPOS[t.tipo].verbo}: ${t.planta.nombre}${sitio(t.planta.sitio) ? ` (${sitio(t.planta.sitio).nombre})` : ''}`).join('\n'))}`,
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
