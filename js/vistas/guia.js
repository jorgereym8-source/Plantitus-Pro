/* Guía de cuidados de una especie (ficha, cursos y planta). */
import { esc, cat, grupo, MESES, origenTxt, intervaloRiego, hoy } from '../core.js';
import { PROBLEMAS_GRUPO } from '../contenido.js';
import { ico, LUZ_ICONO, DIF_TXT } from '../ui.js';

const LETRA = { N: 'Riego normal', R: 'Reposo: poco riego', S: 'Sin riego' };
export function calendarioRiego(e) {
  const m = e.meses || 'NNNNNNNNNNNN';
  const ab = e.abonoMeses || '000000000000';
  const actual = new Date().getMonth();
  return `<div class="cal-riego" role="table" aria-label="Riego y abono por meses">
    ${MESES.map((mes, i) => `<div class="cal-mes ${i === actual ? 'actual' : ''}" role="row">
      <span class="cal-nombre">${mes.slice(0, 3)}</span>
      <span class="cal-barra r-${m[i]}" title="${LETRA[m[i]]}"></span>
      <span class="cal-abono ${ab[i] === '1' ? 'on' : ''}" title="${ab[i] === '1' ? 'Se abona' : 'Sin abono'}"></span>
    </div>`).join('')}
  </div>
  <div class="cal-leyenda"><span><i class="r-N"></i>Riego normal (cada ${e.rv} días)</span>${m.includes('R') ? `<span><i class="r-R"></i>Reposo${e.ri ? ` (cada ${e.ri} días)` : ''}</span>` : ''}${m.includes('S') ? '<span><i class="r-S"></i>Sin riego</span>' : ''}${e.abono ? `<span><i class="ab"></i>Abono cada ${e.abono} semanas</span>` : ''}</div>`;
}

export function resumenEspecie(e) {
  const g = grupo(e);
  const n = intervaloRiego(e, hoy());
  return [
    { icono: 'regaderaLinea', titulo: 'Riego ahora', valor: n ? `Cada ${n} días` : 'Sin riego' },
    { icono: 'sol', titulo: 'Luz', valor: cat.luz[e.luz] },
    { icono: 'termo', titulo: 'Mínima', valor: `${e.tmin} °C` },
    { icono: 'humedad', titulo: 'Humedad', valor: `${e.hum} %` },
    { icono: 'mano', titulo: 'Cuidado', valor: DIF_TXT[e.dificultad] },
    { icono: 'maceta', titulo: 'Trasplante', valor: g.trasplante ? `Cada ${g.trasplante} ${g.trasplante === 1 ? 'año' : 'años'}` : 'No necesita' },
  ];
}

export function guiaEspecie(e, { compacta = false } = {}) {
  const g = grupo(e);
  const fl = e.fl?.length ? e.fl.map((m) => MESES[m - 1]) : null;
  const problemas = (PROBLEMAS_GRUPO[e.grupo] || []).map((n) => cat.enfermedades.find((x) => x.nombre === n)).filter(Boolean);
  const tox = e.tags.includes('tox');
  const o = origenTxt(e);
  return `
  <div class="rejilla-datos">${resumenEspecie(e).map((d) => `<div class="dato">${ico(d.icono)}<span>${esc(d.titulo)}</span><strong>${esc(d.valor)}</strong></div>`).join('')}</div>
  ${o || tox || e.tags.includes('inv') ? `<div class="avisos-esp">
    ${o ? `<p class="etiqueta-canaria">🇮🇨 ${esc(o)}</p>` : ''}
    ${tox ? `<p class="etiqueta-tox">${ico('alerta')} Tóxica para perros y gatos si la mordisquean.</p>` : `<p class="etiqueta-ok">${ico('check')} No se considera tóxica para mascotas.</p>`}
    ${e.tags.includes('inv') ? `<p class="etiqueta-tox">${ico('alerta')} Invasora en Canarias: no la plantes en el campo ni tires restos.</p>` : ''}
  </div>` : ''}
  <section class="tarjeta"><h3>${ico('calendario', 'verde')} Calendario de riego y abono</h3>${calendarioRiego(e)}</section>
  <section class="tarjeta guia">
    <h3>${ico('regaderaLinea', 'azul')} Riego</h3><p>${esc(g.riegoTxt)}</p>
    <h3>${LUZ_ICONO[e.luz]} Luz</h3><p>${esc(textoLuz(e))}</p>
    <h3>${ico('maceta', 'naranja')} Sustrato y maceta</h3><p>${esc(g.sustrato)}</p>
    <h3>${ico('abono', 'morado')} Abono</h3><p>${e.abono ? `Cada ${e.abono} semanas en ${mesesTxt(e.abonoMeses)}, con abono ${['cactus', 'cactus_delicado', 'suculenta', 'suculenta_invernal', 'tabaiba', 'caudex', 'mesemb'].includes(e.grupo) ? 'para cactus (bajo en nitrógeno) a la mitad de dosis' : e.grupo === 'orquidea' ? 'de orquídeas a un cuarto de dosis' : 'líquido universal a la dosis del envase'}.` : 'No necesita abono: con renovar el sustrato al trasplantar es suficiente.'}</p>
    <h3>${ico('termo', 'rojo')} Temperatura</h3><p>Aguanta hasta unos ${e.tmin} °C. ${e.tmin >= 12 ? 'Protégela de corrientes frías y no la saques en invierno.' : e.tmin <= 3 ? 'Resiste bien el exterior en Canarias todo el año.' : 'En Canarias puede vivir fuera, salvo en zonas altas en invierno.'}</p>
    <h3>${ico('tijeras', 'rosa')} Poda y mantenimiento</h3><p>${esc(g.poda)}</p>
    ${g.trasplante ? `<h3>${ico('maceta', 'naranja')} Trasplante</h3><p>Cada ${g.trasplante} ${g.trasplante === 1 ? 'año' : 'años'} aproximadamente, ${e.grupo === 'suculenta_invernal' || e.grupo === 'tabaiba' || e.grupo === 'mesemb_invernal' ? 'a finales de verano o en otoño, al empezar a crecer' : 'en primavera'}, a una maceta 2-4 cm más ancha.</p>` : ''}
    ${fl ? `<h3>${ico('flor', 'rosa')} Floración</h3><p>Florece en ${fl.length > 3 ? `${fl[0]}-${fl[fl.length - 1]}` : fl.join(', ')}.</p>` : ''}
  </section>
  ${problemas.length && !compacta ? `<section class="tarjeta"><h3>${ico('botiquin', 'verde')} Problemas frecuentes</h3><div class="lista-enlaces">${problemas.map((p) => `<a href="#/enfermedad/${p.id}"><span>${esc(p.nombre)}</span>${ico('chevron', 'tenue')}</a>`).join('')}</div></section>` : ''}`;
}

function textoLuz(e) {
  return {
    sombra: 'Vive con poca luz, lejos de la ventana. Evita el sol directo, que le quema las hojas.',
    semi: 'Mucha claridad pero sin sol directo: cerca de una ventana o bajo una malla. El sol de mediodía le quema.',
    parcial: 'Unas horas de sol directo, mejor de mañana, y claridad el resto del día. En verano, protégela del sol de la tarde.',
    sol: 'Todo el sol posible. Si viene de vivero o de interior, acostúmbrala poco a poco para que no se queme.',
  }[e.luz];
}
function mesesTxt(m) {
  const on = [...m].map((x, i) => (x === '1' ? i : -1)).filter((i) => i >= 0);
  if (!on.length) return 'ningún mes';
  if (on.length === 12) return 'todo el año';
  // agrupa meses consecutivos (con vuelta de diciembre a enero)
  const grupos = [];
  for (const i of on) {
    const ult = grupos[grupos.length - 1];
    if (ult && ult[ult.length - 1] === i - 1) ult.push(i); else grupos.push([i]);
  }
  if (grupos.length > 1 && grupos[0][0] === 0 && grupos[grupos.length - 1].slice(-1)[0] === 11) grupos[0] = [...grupos.pop(), ...grupos[0]];
  return grupos.map((g) => (g.length === 1 ? MESES[g[0]] : `${MESES[g[0]]} a ${MESES[g[g.length - 1]]}`)).join(' y ');
}
