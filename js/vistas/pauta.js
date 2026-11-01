/* Editor de la pauta de riego y abono por meses.
 * - Desde una especie: corrige la guía, y con ella la automatización de todas
 *   las plantas de esa especie que la siguen.
 * - Desde una planta: además permite guardarla solo para esa planta. */
import { $, $$, esc, especie, planta, pauta, guardarPlanta, guardarPautaEspecie, intervaloRiego, modoRiego, nombreEsp, nombrePlanta, MESES, hoy } from '../core.js';
import { hoja, aviso, confirmar, repintar, ico } from '../ui.js';

const LETRAS = 'EFMAMJJASOND';
const CICLO_RIEGO = { N: 'R', R: 'S', S: 'N' };

/* Fila de 12 meses que se cambian tocando. */
export function mesesSel(nombre, valor) {
  return `<div class="meses-sel" data-meses="${nombre}">${LETRAS.split('').map((l, i) => `<button type="button" data-i="${i}" class="m-${valor[i]}" aria-label="${MESES[i]}">${l}</button>`).join('')}</div>`;
}

export function editarPauta({ especieId = null, plantaId = null } = {}) {
  const p = plantaId ? planta(plantaId) : null;
  const e = especie(especieId || p?.especie);
  if (!p && !e) return;
  const base = p ? pauta(p) || {} : e;
  const modo = p ? modoRiego(p.recordatorios?.riego?.modo) : null;
  const propia = !!(p?.recordatorios?.riego?.pauta || p?.recordatorios?.abono?.pauta);
  const val = {
    rv: base.rv ?? 7, ri: base.ri ?? 0,
    meses: base.meses || 'NNNNNNNNNNNN',
    abono: base.abono ?? 0,
    abonoMeses: (base.abonoMeses || '000000000000').replace(/1/g, 'N').replace(/0/g, 'S'),
  };
  const titulo = p ? nombrePlanta(p) : nombreEsp(e);
  const h = hoja(`<form class="form pauta">
    <p class="sub">${p ? `Ahora mismo: <strong>${esc(origenTexto(p, e))}</strong>.` : `Guía de <strong>${esc(nombreEsp(e))}</strong>${e.pautaEditada ? ' (ya corregida por ti)' : ''}.`} Toca cada mes para cambiarlo.</p>
    ${modo ? `<p class="aviso-modo">${ico('info')} Esta planta usa el modo «${esc(modo.nombre)}». Si guardas una pauta solo para ella, dejará de usar el modo.</p>` : ''}
    <h3 class="pauta-tit">${ico('regaderaLinea', 'azul')} Riego</h3>
    ${mesesSel('meses', val.meses)}
    <div class="leyenda-meses"><span><i class="m-N"></i>Normal</span><span><i class="m-R"></i>Reposo</span><span><i class="m-S"></i>Sin riego</span></div>
    <div class="dos"><label>Normal: cada (días)<input type="number" name="rv" min="1" max="120" value="${val.rv}" inputmode="numeric"></label>
      <label>Reposo: cada (días)<input type="number" name="ri" min="0" max="180" value="${val.ri}" inputmode="numeric"></label></div>
    <p class="sub">En reposo, 0 días significa el doble que en temporada.</p>
    <h3 class="pauta-tit">${ico('abono', 'morado')} Abono</h3>
    ${mesesSel('abonoMeses', val.abonoMeses)}
    <div class="leyenda-meses abono"><span><i class="m-N"></i>Se abona</span><span><i class="m-S"></i>No se abona</span></div>
    <label>Abonar cada (semanas, 0 = nunca)<input type="number" name="abono" min="0" max="52" value="${val.abono}" inputmode="numeric"></label>
    <p class="resumen-pauta" data-resumen></p>
    ${p ? `<button class="btn ancho" data-guardar="planta">${ico('check')} Guardar solo para esta planta</button>` : ''}
    ${e ? `<button class="btn ${p ? 'sec' : ''} ancho" data-guardar="especie">${ico('libro')} Guardar para toda la especie</button>` : ''}
    ${(p && propia) || e?.pautaEditada ? `<button type="button" class="btn-texto centrado" data-restablecer>${ico('rotar')} ${p && propia ? 'Quitar la pauta propia de esta planta' : 'Volver a la guía original'}</button>` : ''}
  </form>`, { titulo: `Riego y abono · ${titulo}`, clase: 'alta' });

  const form = $('form', h.el);
  const leer = () => {
    const fd = new FormData(form);
    return {
      rv: Math.max(1, Math.round(+fd.get('rv') || 7)),
      ri: Math.max(0, Math.round(+fd.get('ri') || 0)),
      meses: val.meses,
      abono: Math.max(0, Math.round(+fd.get('abono') || 0)),
      abonoMeses: val.abonoMeses.replace(/N/g, '1').replace(/[RS]/g, '0'),
    };
  };
  const resumen = () => {
    const x = leer();
    const m = new Date().getMonth();
    const n = intervaloRiego(x, hoy());
    $('[data-resumen]', h.el).innerHTML = `En ${MESES[m]}: <strong>${n ? `riego cada ${n} días` : 'sin riego'}</strong>${x.abono && x.abonoMeses[m] === '1' ? ` y abono cada ${x.abono} semanas` : ', sin abono'}.`;
  };
  form.addEventListener('input', resumen);
  h.el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-meses] button');
    if (b) {
      const k = b.parentElement.dataset.meses, i = +b.dataset.i;
      const arr = [...val[k]];
      arr[i] = k === 'meses' ? CICLO_RIEGO[arr[i]] || 'N' : (arr[i] === 'N' ? 'S' : 'N');
      val[k] = arr.join('');
      b.className = 'm-' + arr[i];
      resumen();
      return;
    }
    if (ev.target.closest('[data-restablecer]')) {
      if (p && propia) {
        const q = planta(p.id);
        delete q.recordatorios.riego.pauta;
        if (q.recordatorios.abono) delete q.recordatorios.abono.pauta;
        guardarPlanta(q);
        aviso('Ahora sigue la guía de su especie');
      } else if (await confirmar(`¿Volver a la pauta original de ${nombreEsp(e)}? Afecta a todas tus plantas de esta especie que siguen la guía.`, { si: 'Restablecer' })) {
        guardarPautaEspecie(e.id, null);
        aviso('Guía original restablecida');
      } else return;
      h.cerrar(); repintar();
    }
  });
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const destino = ev.submitter?.dataset.guardar || (p ? 'planta' : 'especie');
    const x = leer();
    if (destino === 'planta') {
      const q = planta(p.id);
      q.recordatorios.riego = { ...q.recordatorios.riego, cada: null, modo: undefined, pauta: { rv: x.rv, ri: x.ri, meses: x.meses } };
      q.recordatorios.abono = { ...(q.recordatorios.abono || { on: x.abono > 0, ultimo: hoy() }), cada: null, pauta: { abono: x.abono, abonoMeses: x.abonoMeses } };
      guardarPlanta(q);
      aviso('Pauta guardada para esta planta');
    } else {
      guardarPautaEspecie(e.id, x);
      if (p) {
        // la planta pasa a seguir la guía corregida
        const q = planta(p.id);
        delete q.recordatorios.riego.pauta; delete q.recordatorios.riego.modo; q.recordatorios.riego.cada = null;
        if (q.recordatorios.abono) { delete q.recordatorios.abono.pauta; q.recordatorios.abono.cada = null; }
        guardarPlanta(q);
      }
      aviso(`Guía de ${nombreEsp(e)} corregida`);
    }
    h.cerrar(); repintar();
  };
  resumen();
}

function origenTexto(p, e) {
  const rr = p.recordatorios?.riego || {};
  if (rr.cada) return `riego fijo cada ${rr.cada} días`;
  const m = modoRiego(rr.modo);
  if (m) return `modo «${m.nombre}»`;
  if (rr.pauta) return 'pauta propia de esta planta';
  if (e?.pautaEditada) return 'guía de la especie corregida por ti';
  return 'guía de la especie';
}

/* Botón «Editar» del calendario de la guía (ficha de especie, curso y planta). */
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-editar-pauta]');
  if (!b) return;
  ev.preventDefault();
  const pl = b.dataset.planta;
  editarPauta(pl ? { plantaId: pl } : { especieId: b.dataset.editarPauta });
});
