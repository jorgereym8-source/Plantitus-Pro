/* Pestaña Diagnóstico: autodiagnóstico con foto y guía de enfermedades por partes. */
import { $, esc, cat, norm, reducirImagen, elegirFoto, blobABase64, preguntarIAJSON, iaLista, nombreIA, datos, planta, especie, guardarPlanta, uid, hoy, activarImagenes } from '../core.js';
import { PARTES, REMEDIOS } from '../contenido.js';
import { rutas, ir, hoja, aviso, cabRaiz, cabDetalle, chips, ico } from '../ui.js';
import { ILUSTRACION } from '../iconos.js';
import { elegirPlanta } from './plantas.js';

rutas.diagnostico = () => ({
  html: `${cabRaiz('Diagnóstico')}
  <div class="contenido">
    <section class="tarjeta heroe">
      <div class="heroe-ilus">${ILUSTRACION.diagnostico}</div>
      <h2>Diagnostica una planta enferma</h2>
      <p>Ayuda a tus plantas a recuperar la salud</p>
      <button class="btn grande ancho" data-autodiag>${ico('camara')} Autodiagnóstico</button>
      <button class="enlace" data-sintomas>Prefiero describir los síntomas ${ico('chevron')}</button>
    </section>
    <h2 class="seccion-tit">Enfermedades comunes plantas</h2>
    <div class="rejilla-partes">${PARTES.map((p) => `<a class="tarjeta-parte" href="#/parte/${p.id}">
      <span class="parte-ilus" style="--a:${p.fondo[0]};--b:${p.fondo[1]}">${ico(p.icono)}</span><span class="parte-nombre">${p.nombre}</span></a>`).join('')}</div>
    <a class="fila-atrasadas" href="#/enfermedades"><span>Ver la guía completa (${cat.enfermedades.length} problemas)</span>${ico('chevron')}</a>
  </div>`,
  despues(v) {
    $('[data-autodiag]', v).onclick = () => autodiagnostico();
    $('[data-sintomas]', v).onclick = () => autodiagnostico({ sinFoto: true });
  },
}));

rutas.parte = (id) => {
  const p = PARTES.find((x) => x.id === id);
  if (!p) return rutas.diagnostico();
  const lista = cat.enfermedades.filter((e) => e.partes.includes(id));
  return { html: `${cabDetalle(p.nombre)}<div class="contenido"><div class="lista-enf">${lista.map(filaEnf).join('')}</div></div>` };
};
rutas.enfermedades = () => {
  const tipos = [...new Set(cat.enfermedades.map((e) => e.tipo))];
  return {
    html: `${cabDetalle('Guía de problemas')}<div class="contenido">
      <div class="fila-busqueda"><input type="search" placeholder="Busca por nombre, síntoma o causa" aria-label="Buscar problema"></div>
      <div class="lista-enf" id="listaEnf">${tipos.map((t) => `<h3 class="sub-tit">${esc(t)}</h3>${cat.enfermedades.filter((e) => e.tipo === t).map(filaEnf).join('')}`).join('')}</div></div>`,
    despues(v) {
      const input = $('input', v), box = $('#listaEnf', v), ini = box.innerHTML;
      input.oninput = () => {
        const q = norm(input.value).trim();
        if (!q) { box.innerHTML = ini; return; }
        const l = cat.enfermedades.filter((e) => norm(`${e.nombre} ${e.sintomas} ${e.causas}`).includes(q));
        box.innerHTML = l.map(filaEnf).join('') || '<p class="sub">Sin resultados.</p>';
      };
    },
  };
};
const ICONO_TIPO = { Plaga: 'bicho', Hongo: 'hoja', Bacteria: 'hoja', Virus: 'alerta', Fisiopatía: 'sol', Rareza: 'estrella' };
function filaEnf(e) {
  return `<a class="fila-enf" href="#/enfermedad/${e.id}"><span class="enf-ico t-${norm(e.tipo)}">${ico(ICONO_TIPO[e.tipo] || 'info')}</span><span class="txt"><strong>${esc(e.nombre)}</strong><span>${esc(e.sintomas)}</span></span>${ico('chevron', 'tenue')}</a>`;
}

rutas.enfermedad = (id) => {
  const e = cat.enfermedades.find((x) => String(x.id) === String(id));
  if (!e) return rutas.diagnostico();
  const rem = REMEDIOS.filter((r) => r.para.includes(e.nombre));
  return {
    html: `${cabDetalle(e.tipo)}<div class="contenido ficha">
      <h1 class="ficha-nombre">${esc(e.nombre)}</h1>
      ${chips(e.partes.map((p) => ({ texto: PARTES.find((x) => x.id === p)?.nombre })))}
      <section class="tarjeta"><h3>${ico('lupa', 'rojo')} Síntomas</h3><p>${esc(e.sintomas)}</p></section>
      <section class="tarjeta"><h3>${ico('info', 'naranja')} Causas</h3><p>${esc(e.causas)}</p></section>
      <section class="tarjeta"><h3>${ico('botiquin', 'verde')} Tratamiento</h3><p>${esc(e.tratamiento)}</p></section>
      ${rem.length ? `<h2 class="seccion-tit">Remedios caseros</h2><div class="carrusel">${rem.map(tarjetaRemedio).join('')}</div>` : ''}
      <a class="btn sec ancho" href="${esc(e.url)}" target="_blank" rel="noopener">Ver fotos e información en Wikipedia</a>
    </div>`,
  };
};
export function tarjetaRemedio(r) {
  return `<a class="tarjeta-remedio" href="#/remedio/${r.id}"><span class="foto" data-wiki="${esc(r.wiki)}"></span><span class="etiqueta">${esc(r.tipo)}</span><strong>${esc(r.nombre)}</strong></a>`;
}

/* ---------- autodiagnóstico ---------- */
export async function autodiagnostico({ sinFoto = false, plantaId = null } = {}) {
  if (!iaLista()) {
    const h = hoja(`<p>El autodiagnóstico usa el asistente con IA. Añade una clave gratuita de Gemini o una de Claude en Ajustes.</p><p class="sub">Mientras tanto, puedes consultar la guía de enfermedades por partes de la planta.</p><a class="btn ancho" href="#/ajustes">Ir a Ajustes</a>`, { titulo: 'Autodiagnóstico' });
    $('a', h.el).onclick = () => h.cerrar();
    return;
  }
  let blob = null;
  if (!sinFoto) {
    const f = await elegirFoto({ camara: true });
    if (!f) return;
    blob = await reducirImagen(f, 1024, 0.82);
  }
  const p = plantaId ? planta(plantaId) : null;
  const h = hoja(`<div class="ident">
    ${blob ? `<div class="ident-foto" style="background-image:url(${URL.createObjectURL(blob)})"></div>` : ''}
    <form class="form diag-form">
      <label>${blob ? 'Cuéntame algo más (opcional)' : 'Describe lo que le pasa'}<textarea name="txt" rows="3" placeholder="Hojas amarillas desde abajo, la riego cada semana, está en el salón…" ${blob ? '' : 'required'}></textarea></label>
      <button type="button" class="menu-op" data-de>${ico('plantas')}<span data-de-txt>${p ? esc(p.nombre) : 'Es una de mis plantas (opcional)'}</span></button>
      <button class="btn ancho">${ico('chispa')} Diagnosticar con ${nombreIA()}</button>
    </form>
    <div class="ident-res"></div></div>`, { titulo: 'Autodiagnóstico', clase: 'alta' });
  let elegida = plantaId;
  $('[data-de]', h.el).onclick = async () => {
    const id = await elegirPlanta('¿Qué planta es?');
    if (id) { elegida = id; $('[data-de-txt]', h.el).textContent = planta(id).nombre; }
  };
  $('form', h.el).onsubmit = async (ev) => {
    ev.preventDefault();
    const txt = new FormData(ev.target).get('txt').trim();
    const q = elegida ? planta(elegida) : null;
    const e = q ? especie(q.especie) : null;
    const res = $('.ident-res', h.el);
    $('form', h.el).hidden = true;
    res.innerHTML = `<p class="cargando">${ico('chispa')} Analizando…</p>`;
    const nombres = cat.enfermedades.map((x) => x.nombre).join('; ');
    let r;
    try {
      r = await preguntarIAJSON(`Diagnostica el estado de salud de esta planta${blob ? ' a partir de la foto' : ''}.${q ? ` Es «${q.nombre}»${e ? ` (${e.cientifico})` : ''}.` : ''}${txt ? ` El usuario dice: «${txt}».` : ''}
Devuelve {"planta":"especie probable o vacío","sana":true|false,"resumen":"1-2 frases","problemas":[{"nombre":"nombre del problema","guia":"nombre EXACTO de esta lista si coincide, o vacío: ${nombres}","probabilidad":0-100,"explicacion":"por qué lo crees, 1-2 frases","tratamiento":["paso 1","paso 2","paso 3"]}],"prevencion":"1 consejo para que no vuelva a pasar"}. Ordena los problemas de más a menos probable (máximo 3).`,
      blob ? [{ base64: await blobABase64(blob), tipo: 'image/jpeg' }] : []);
    } catch (err) {
      res.innerHTML = `<p class="error">${esc(err.message)}</p>`;
      $('form', h.el).hidden = false;
      return;
    }
    const probs = r.problemas || [];
    res.innerHTML = `
      <div class="diag-res ${r.sana && !probs.length ? 'sana' : ''}">
        <h3>${r.sana && !probs.length ? `${ico('check', 'verde')} Se ve sana` : `${ico('alerta', 'naranja')} Posibles problemas`}</h3>
        ${r.planta ? `<p class="sub">Planta: ${esc(r.planta)}</p>` : ''}
        <p>${esc(r.resumen || '')}</p>
      </div>
      ${probs.map((pb) => {
        const g = cat.enfermedades.find((x) => norm(x.nombre) === norm(pb.guia || '') || norm(x.nombre) === norm(pb.nombre || ''));
        return `<section class="tarjeta problema">
          <header><strong>${esc(pb.nombre)}</strong><span class="confianza" style="--p:${Math.max(0, Math.min(100, +pb.probabilidad || 0))}">${Math.round(+pb.probabilidad || 0)} %</span></header>
          <p>${esc(pb.explicacion || '')}</p>
          ${pb.tratamiento?.length ? `<ol>${pb.tratamiento.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
          ${g ? `<a class="enlace" href="#/enfermedad/${g.id}">Ver «${esc(g.nombre)}» en la guía ${ico('chevron')}</a>` : ''}
        </section>`;
      }).join('')}
      ${r.prevencion ? `<p class="ident-nota">${ico('chispa', 'verde')} ${esc(r.prevencion)}</p>` : ''}
      ${elegida ? '<button class="btn sec ancho" data-guardar>Guardar en el historial de la planta</button>' : ''}`;
    res.addEventListener('click', (e2) => {
      if (e2.target.closest('a[href]')) h.cerrar();
      if (e2.target.closest('[data-guardar]')) {
        const pl = planta(elegida);
        (pl.historial ||= []).unshift({ id: uid(), fecha: hoy(), tipo: 'nota', nota: `Diagnóstico: ${probs.length ? probs.map((x) => x.nombre).join(', ') : 'se ve sana'}. ${r.resumen || ''}`.trim() });
        guardarPlanta(pl);
        aviso('Guardado en el historial');
        e2.target.closest('[data-guardar]').remove();
      }
    });
    activarImagenes(res);
  };
}
