/* Pestaña Mis plantas (Plantas / Sitios), ficha de cada planta y alta de plantas. */
import { $, $$, esc, uid, hoy, sumar, fechaLarga, haceTxt, datos, planta, sitio, especie, pauta, grupo, cat, buscarEspecies, guardarPlanta, borrarPlanta, recordatoriosIniciales, vencimiento, completar, intervaloRiego, intervaloTxt, fotos, reducirImagen, elegirFoto, store, activarImagenes } from '../core.js';
import { TIPOS } from '../contenido.js';
import { rutas, ir, hoja, aviso, menu, confirmar, cabRaiz, cabDetalle, segmentado, tarjetaPlanta, filaEspecie, chips, chatHTML, activarChat, repintar, ico, LUZ_ICONO, DIF_TXT } from '../ui.js';
import { guiaEspecie } from './guia.js';
import { identificarConFoto } from './buscar.js';
import { coleccionLocal } from '../importar.js';

let pestana = 'plantas';

rutas.plantas = () => {
  const plantas = datos.plantas, sitios = datos.sitios;
  const cuerpo = pestana === 'plantas'
    ? (plantas.length ? `<div class="lista-plantas">${plantas.map(tarjetaPlanta).join('')}</div>` : `<div class="vacio"><h3>Tu jardín está vacío</h3><p>Añade tus plantas para tener sus cuidados y recordatorios a mano.</p><button class="btn" data-nueva>${ico('mas')} Añadir planta</button>${coleccionLocal() ? `<a class="enlace" href="#/ajustes">Copiar mis ${coleccionLocal().plantas.length} plantas de Plantitus ${ico('chevron')}</a>` : ''}</div>`)
    : `<div class="lista-sitios">${sitios.map((s) => {
      const ps = plantas.filter((p) => p.sitio === s.id);
      return `<a class="tarjeta-sitio" href="#/sitio/${esc(s.id)}">
        <div class="sitio-cab"><span class="sitio-ico">${ico(s.exterior ? 'exterior' : 'casa')}</span><div><strong>${esc(s.nombre)}</strong><span>${ps.length} ${ps.length === 1 ? 'planta' : 'plantas'} · ${s.exterior ? 'Exterior' : 'Interior'}</span></div>${ico('chevron', 'tenue')}</div>
        ${ps.length ? `<div class="sitio-fotos">${ps.slice(0, 5).map((p) => `<span class="mini-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(especie(p.especie)?.cientifico || '')}"></span>`).join('')}${ps.length > 5 ? `<span class="mas-fotos">+${ps.length - 5}</span>` : ''}</div>` : ''}
      </a>`;
    }).join('')}<button class="btn sec ancho" data-nuevo-sitio>${ico('mas')} Añadir sitio</button></div>`;
  return {
    html: `${cabRaiz('Mis plantas', { fav: true })}<div class="contenido">${segmentado('pestana', [['plantas', 'Plantas'], ['sitios', 'Sitios']], pestana)}${cuerpo}</div><button class="fab" data-nueva aria-label="Añadir planta">${ico('mas')}</button>`,
    despues(v) {
      v.addEventListener('click', (e) => {
        const seg = e.target.closest('[data-seg] button');
        if (seg) { pestana = seg.dataset.v; repintar(); return; }
        if (e.target.closest('[data-nueva]')) nuevaPlanta();
        if (e.target.closest('[data-nuevo-sitio]')) editarSitio();
        const m = e.target.closest('[data-menu-planta]');
        if (m) menuPlanta(m.dataset.menuPlanta);
      });
    },
  };
};

export function menuPlanta(id) {
  const p = planta(id);
  if (!p) return;
  menu([
    { texto: 'Regar ahora', icono: 'regadera', accion: () => { completar(p, 'riego'); aviso(`Regada: ${p.nombre}`); repintar(); } },
    { texto: 'Editar', icono: 'editar', accion: () => editarPlanta(id) },
    { texto: 'Cambiar de sitio', icono: 'ubicacion', accion: () => cambiarSitio(id) },
    { texto: 'Eliminar', icono: 'basura', peligro: true, accion: async () => { if (await confirmar(`¿Eliminar «${p.nombre}» y su historial?`, { si: 'Eliminar', peligro: true })) { borrarPlanta(id); aviso('Planta eliminada'); ir('plantas', { reemplazar: true }); } } },
  ], p.nombre);
}

/* ---------- sitios ---------- */
rutas.sitio = (id) => {
  const s = sitio(id);
  if (!s) { ir('plantas', { reemplazar: true }); return null; }
  const ps = datos.plantas.filter((p) => p.sitio === id);
  return {
    html: `${cabDetalle(s.nombre, { derecha: `<button class="btn-icono" data-editar aria-label="Editar sitio">${ico('editar')}</button>` })}<div class="contenido">
      <p class="sub centrado">${s.exterior ? 'Exterior' : 'Interior'} · ${ps.length} ${ps.length === 1 ? 'planta' : 'plantas'}</p>
      ${ps.length ? `<div class="lista-plantas">${ps.map(tarjetaPlanta).join('')}</div>` : '<div class="vacio"><p>No hay plantas en este sitio.</p></div>'}</div>`,
    despues(v) {
      v.addEventListener('click', (e) => {
        if (e.target.closest('[data-editar]')) editarSitio(id);
        const m = e.target.closest('[data-menu-planta]');
        if (m) menuPlanta(m.dataset.menuPlanta);
      });
    },
  };
};
export function editarSitio(id, alGuardar) {
  const s = id ? sitio(id) : { id: 's-' + uid(), nombre: '', exterior: false };
  const h = hoja(`<form class="form">
    <label>Nombre<input name="nombre" value="${esc(s.nombre)}" placeholder="Azotea, Balcón, Estante de la cocina…" required></label>
    <div class="campo"><span>Tipo</span>${segmentado('tipo', [['int', 'Interior'], ['ext', 'Exterior']], s.exterior ? 'ext' : 'int')}</div>
    <button class="btn ancho">Guardar</button>
    ${id ? '<button type="button" class="btn sec peligro ancho" data-borrar>Eliminar sitio</button>' : ''}
  </form>`, { titulo: id ? 'Editar sitio' : 'Nuevo sitio' });
  let ext = s.exterior;
  h.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-seg] button');
    if (b) { ext = b.dataset.v === 'ext'; $$('[data-seg] button', h.el).forEach((x) => x.classList.toggle('on', x === b)); }
    if (e.target.closest('[data-borrar]')) {
      const n = datos.plantas.filter((p) => p.sitio === id).length;
      if (await confirmar(n ? `Las ${n} plantas de este sitio se quedarán sin sitio. ¿Eliminarlo?` : '¿Eliminar este sitio?', { si: 'Eliminar', peligro: true })) {
        datos.sitios = datos.sitios.filter((x) => x.id !== id);
        datos.plantas = datos.plantas.map((p) => (p.sitio === id ? { ...p, sitio: null } : p));
        h.cerrar(); ir('plantas', { reemplazar: true });
      }
    }
  });
  $('form', h.el).onsubmit = (e) => {
    e.preventDefault();
    const nombre = new FormData(e.target).get('nombre').trim();
    if (!nombre) return;
    const nuevo = { ...s, nombre, exterior: ext };
    const lista = datos.sitios;
    const i = lista.findIndex((x) => x.id === s.id);
    if (i >= 0) lista[i] = nuevo; else lista.push(nuevo);
    datos.sitios = lista;
    h.cerrar();
    if (alGuardar) alGuardar(nuevo); else repintar();
  };
}
function opcionesSitio(sel) {
  return datos.sitios.map((s) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('') + '<option value="__nuevo">+ Nuevo sitio…</option>';
}
function cambiarSitio(id) {
  const p = planta(id);
  menu([...datos.sitios.map((s) => ({ texto: s.nombre + (s.id === p.sitio ? ' ✓' : ''), icono: s.exterior ? 'exterior' : 'casa', accion: () => { p.sitio = s.id; guardarPlanta(p); repintar(); } })),
    { texto: 'Nuevo sitio…', icono: 'mas', accion: () => editarSitio(null, (s) => { p.sitio = s.id; guardarPlanta(p); repintar(); }) }], 'Mover a…');
}

/* ---------- alta de planta ---------- */
export function nuevaPlanta(especieId = null) {
  if (especieId) return formularioPlanta({ especie: especieId });
  const h = hoja(`<div class="buscador-alta">
      <div class="fila-busqueda"><input type="search" placeholder="Busca entre ${cat.especies.length} especies" aria-label="Buscar especie"><button class="btn mini" data-identificar>${ico('camara')} Identificar</button></div>
      <div class="resultados"></div>
      <button class="menu-op" data-propia>${ico('editar')}<span>No la encuentro: añadirla a mano</span></button>
    </div>`, { titulo: 'Añadir planta', clase: 'alta' });
  const input = $('input', h.el), res = $('.resultados', h.el);
  const pintarRes = () => {
    const l = buscarEspecies(input.value).slice(0, 40);
    res.innerHTML = input.value.trim() ? (l.map((e) => filaEspecie(e, { accion: `<span class="btn mini sec">Añadir</span>` })).join('') || '<p class="sub">Sin resultados. Prueba con el nombre científico o identifícala con una foto.</p>') : `<p class="sub">Escribe el nombre común o el científico. También puedes identificarla con una foto.</p>`;
    activarImagenes(res);
  };
  input.oninput = pintarRes;
  pintarRes();
  setTimeout(() => input.focus(), 300);
  h.el.addEventListener('click', async (e) => {
    const f = e.target.closest('.fila-esp');
    if (f) { e.preventDefault(); h.cerrar(); formularioPlanta({ especie: f.dataset.id }); }
    if (e.target.closest('[data-identificar]')) { h.cerrar(); identificarConFoto(); }
    if (e.target.closest('[data-propia]')) { h.cerrar(); formularioPlanta({ especie: null, nombre: input.value.trim() }); }
  });
}

export function formularioPlanta({ id = null, especie: espId = null, nombre = '', fotoBlob = null } = {}) {
  const p = id ? JSON.parse(JSON.stringify(planta(id))) : null;
  const e = especie(p?.especie ?? espId);
  const sitios = datos.sitios;
  const ini = {
    nombre: p?.nombre || e?.nombre || nombre,
    cientifico: p?.cientifico || e?.cientifico || '',
    sitio: p?.sitio || store.get('ultimoSitio', sitios[0]?.id),
    notas: p?.notas || '',
  };
  let foto = fotoBlob;
  const h = hoja(`<form class="form form-planta">
    <button type="button" class="foto-grande" data-foto-btn ${p?.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(e?.cientifico || '')}">
      <span class="foto-btn">${ico('camara')} ${p?.foto || fotoBlob ? 'Cambiar foto' : 'Añadir foto'}</span></button>
    ${e ? `<div class="esp-elegida"><strong>${esc(e.nombre)}</strong><em>${esc(e.cientifico)}</em></div>` : ''}
    <label>Nombre o apodo<input name="nombre" value="${esc(ini.nombre)}" required placeholder="Mi cactus favorito"></label>
    ${!e ? `<label>Nombre científico (si lo sabes)<input name="cientifico" value="${esc(ini.cientifico)}" placeholder="Aeonium arboreum"></label>
      <label>Tipo de planta<select name="grupo">${Object.entries(cat.grupos).map(([k, g]) => `<option value="${k}">${esc(g.nombre)}</option>`).join('')}</select></label>` : ''}
    <label>Sitio<select name="sitio">${opcionesSitio(ini.sitio)}</select></label>
    ${!p ? `<div class="campo"><span>¿Cuándo la regaste por última vez?</span>
      <div class="opciones-riego">${[['0', 'Hoy'], ['3', 'Hace 3 días'], ['7', 'Hace 1 semana'], ['14', 'Hace 2 semanas'], ['30', 'Hace un mes']].map(([v, t], i) => `<label class="opcion"><input type="radio" name="ultimo" value="${v}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>` : ''}
    <label>Notas<textarea name="notas" rows="2" placeholder="De dónde viene, sustrato, maceta…">${esc(ini.notas)}</textarea></label>
    <button class="btn ancho">${p ? 'Guardar cambios' : 'Añadir a mis plantas'}</button>
  </form>`, { titulo: p ? 'Editar planta' : 'Nueva planta', clase: 'alta' });
  const fb = $('[data-foto-btn]', h.el);
  if (fotoBlob) { fb.style.backgroundImage = `url(${URL.createObjectURL(fotoBlob)})`; fb.classList.add('cargada'); }
  fb.onclick = async () => {
    const f = await elegirFoto();
    if (!f) return;
    foto = await reducirImagen(f);
    fb.style.backgroundImage = `url(${URL.createObjectURL(foto)})`;
    fb.classList.add('cargada');
    $('.foto-btn', fb).innerHTML = `${ico('camara')} Cambiar foto`;
  };
  const selSitio = $('[name=sitio]', h.el);
  selSitio.onchange = () => {
    if (selSitio.value !== '__nuevo') return;
    editarSitio(null, (s) => { selSitio.innerHTML = opcionesSitio(s.id); });
  };
  $('form', h.el).onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    let espFinal = e;
    if (!e) {
      // especie propia mínima para que funcionen los recordatorios
      const g = cat.grupos[fd.get('grupo')] ? fd.get('grupo') : 'interior';
      const cient = (fd.get('cientifico') || '').trim();
      const ya = cient && cat.especies.find((x) => x.cientifico.toLowerCase() === cient.toLowerCase());
      espFinal = ya || (await import('./ajustes.js')).crearEspeciePropia({ nombre: fd.get('nombre').trim(), cientifico: cient || fd.get('nombre').trim(), grupo: g });
    }
    const sitioId = fd.get('sitio') === '__nuevo' ? null : fd.get('sitio');
    store.set('ultimoSitio', sitioId);
    const fotoId = foto ? await fotos.guardar(foto) : p?.foto || null;
    if (foto && p?.foto) fotos.borrar(p.foto);
    const nueva = p ? { ...p } : {
      id: uid(), creada: hoy(), historial: [],
      recordatorios: recordatoriosIniciales(espFinal, sumar(hoy(), -Number(fd.get('ultimo') || 0))),
    };
    Object.assign(nueva, {
      nombre: fd.get('nombre').trim() || espFinal?.nombre || 'Mi planta',
      especie: espFinal?.id || null,
      cientifico: espFinal?.cientifico || '',
      sitio: sitioId, notas: fd.get('notas').trim(), foto: fotoId,
    });
    guardarPlanta(nueva);
    h.cerrar();
    aviso(p ? 'Cambios guardados' : `${nueva.nombre} añadida`);
    if (p) repintar(); else ir('planta/' + nueva.id);
  };
}
export const editarPlanta = (id) => formularioPlanta({ id });

/* Selector de planta del usuario. */
export function elegirPlanta(titulo = 'Elige una planta') {
  return new Promise((ok) => {
    const ps = datos.plantas;
    if (!ps.length) { aviso('Primero añade alguna planta'); ok(null); return; }
    let elegida = null;
    const h = hoja(`<div class="menu-lista">${ps.map((p) => `<button class="menu-op planta-op" data-id="${esc(p.id)}"><span class="mini-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(especie(p.especie)?.cientifico || '')}"></span><span>${esc(p.nombre)}<em class="sub"> ${esc(sitio(p.sitio)?.nombre || '')}</em></span></button>`).join('')}</div>`, { titulo, alCerrar: () => ok(elegida) });
    h.el.onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { elegida = b.dataset.id; h.cerrar(); } };
  });
}

/* ---------- ficha de una planta ---------- */
const seccionPlanta = {};
rutas.planta = (id, seccion, tipoAbrir) => {
  const p = planta(id);
  if (!p) { ir('plantas', { reemplazar: true }); return null; }
  const e = especie(p.especie);
  const s = sitio(p.sitio);
  const sec = seccion || seccionPlanta[id] || 'cuidados';
  seccionPlanta[id] = sec;
  const pa = pauta(p);
  const recs = Object.entries(TIPOS).map(([k, t]) => {
    const r = p.recordatorios[k] || { on: false };
    const f = r.on ? vencimiento(p, k) : null;
    const cada = k === 'riego' && !r.cada ? intervaloTxt(p) : k === 'abono' && !r.cada && pa ? (pa.abono ? `Cada ${pa.abono} semanas en temporada` : 'Sin abono') : `Cada ${r.cada || t.cada} días`;
    return `<button class="fila-rec ${r.on ? 'on' : ''}" data-rec="${k}">
      <span class="tipo-ico" style="--c:${t.color}">${ico(t.icono)}</span>
      <span class="txt"><strong>${t.nombre}</strong><span>${r.on ? esc(cada) : 'Desactivado'}</span></span>
      ${r.on && f ? `<span class="prox ${f < hoy() ? 'rojo' : f === hoy() ? 'verde' : ''}">${f < hoy() ? 'Atrasado' : esc(fechaLarga(f))}</span>` : ''}
      ${ico('chevron', 'tenue')}
    </button>`;
  }).join('');
  const hist = (p.historial || []);
  const cuerpo = {
    cuidados: `<section class="tarjeta lista-recs">${recs}</section>
      <div class="fila-botones"><button class="btn" data-regar>${ico('regadera')} Regar ahora</button><button class="btn sec" data-nota>${ico('editar')} Anotar</button></div>
      ${p.notas ? `<section class="tarjeta"><h3>Notas</h3><p>${esc(p.notas)}</p></section>` : ''}`,
    historial: hist.length ? `<section class="tarjeta historial">${hist.map((x) => `<div class="hist">
        <span class="tipo-ico" style="--c:${TIPOS[x.tipo]?.color || '#8a9a94'}">${ico(TIPOS[x.tipo]?.icono || 'editar')}</span>
        <div class="txt"><strong>${esc(TIPOS[x.tipo]?.nombre || 'Nota')}${x.nota && TIPOS[x.tipo] ? ` · ${esc(x.nota)}` : ''}</strong>${!TIPOS[x.tipo] && x.nota ? `<p>${esc(x.nota)}</p>` : ''}<span>${esc(fechaLarga(x.fecha))} · ${haceTxt(x.fecha)}</span></div>
        <button class="btn-icono tenue" data-borrar-hist="${esc(x.id)}" aria-label="Borrar">${ico('basura')}</button></div>`).join('')}</section>` : '<div class="vacio"><p>Aún no hay nada anotado. Al marcar tareas como hechas aparecerán aquí.</p></div>',
    info: e ? `${guiaEspecie(e)}<a class="btn sec ancho" href="#/especie/${encodeURIComponent(e.id)}">Ver ficha de ${esc(e.nombre)}</a>` : '<div class="vacio"><p>Esta planta no está enlazada a ninguna especie del catálogo.</p></div>',
  }[sec];
  const contexto = `Planta del usuario: «${p.nombre}»${e ? ` (${e.cientifico}, ${grupo(e).nombre})` : ''}. Sitio: ${s ? `${s.nombre} (${s.exterior ? 'exterior' : 'interior'})` : 'desconocido'}. Último riego: ${p.recordatorios.riego?.ultimo || 'desconocido'}. Notas: ${p.notas || 'ninguna'}. Hoy es ${hoy()}.`;
  return {
    html: `<div class="cabecera-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(e?.cientifico || p.cientifico || '')}">
        ${cabDetalle('', { transparente: true, derecha: `<button class="btn-icono" data-menu aria-label="Opciones">${ico('puntos')}</button>` })}
        <button class="foto-cambiar" data-foto-cambiar aria-label="Cambiar foto">${ico('camara')}</button>
      </div>
      <div class="contenido ficha">
        <h1 class="ficha-nombre">${esc(p.nombre)}</h1>
        ${e || p.cientifico ? `<p class="ficha-cient">${esc(e?.cientifico || p.cientifico)}</p>` : ''}
        ${chips([{ icono: 'ubicacion', texto: s?.nombre || 'Sin sitio' }, e && { texto: `${LUZ_ICONO[e.luz]} ${cat.luz[e.luz]}` }, e && { icono: 'mano', texto: DIF_TXT[e.dificultad] }, { icono: 'calendario', texto: `Desde ${fechaLarga(p.creada).toLowerCase()}` }])}
        ${segmentado('sec', [['cuidados', 'Cuidados'], ['historial', 'Historial'], ['info', 'Guía']], sec)}
        ${cuerpo}
        ${chatHTML('planta-' + id, { titulo: 'Pregunta sobre esta planta', sugerencias: ['¿Cuándo la riego?', '¿Por qué amarillean las hojas?', '¿Cómo la reproduzco?'] })}
      </div>`,
    despues(v) {
      activarChat(v, 'planta-' + id, contexto);
      if (tipoAbrir && TIPOS[tipoAbrir]) setTimeout(() => editarRecordatorio(id, tipoAbrir), 50);
      v.addEventListener('click', async (ev) => {
        const seg = ev.target.closest('[data-seg] button');
        if (seg) { seccionPlanta[id] = seg.dataset.v; history.replaceState(null, '', `#/planta/${id}`); repintar(); return; }
        const rec = ev.target.closest('[data-rec]');
        if (rec) editarRecordatorio(id, rec.dataset.rec);
        if (ev.target.closest('[data-menu]')) menuPlanta(id);
        if (ev.target.closest('[data-regar]')) { completar(planta(id), 'riego'); aviso('Riego anotado'); repintar(); }
        if (ev.target.closest('[data-nota]')) anotar(id);
        if (ev.target.closest('[data-foto-cambiar]')) {
          const f = await elegirFoto(); if (!f) return;
          const b = await reducirImagen(f);
          const q = planta(id); const vieja = q.foto;
          q.foto = await fotos.guardar(b); guardarPlanta(q);
          if (vieja) fotos.borrar(vieja);
          repintar();
        }
        const bh = ev.target.closest('[data-borrar-hist]');
        if (bh) { const q = planta(id); q.historial = q.historial.filter((x) => x.id !== bh.dataset.borrarHist); guardarPlanta(q); repintar(); }
      });
    },
  };
};

function anotar(id) {
  const h = hoja(`<form class="form"><label>Tipo<select name="tipo"><option value="nota">Nota</option>${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}">${t.nombre}</option>`).join('')}</select></label>
    <label>Fecha<input type="date" name="fecha" value="${hoy()}" max="${hoy()}"></label>
    <label>Comentario<textarea name="nota" rows="3" placeholder="Ha sacado un hijuelo, le he cambiado el sustrato…"></textarea></label>
    <button class="btn ancho">Guardar</button></form>`, { titulo: 'Anotar' });
  $('form', h.el).onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = planta(id);
    const tipo = fd.get('tipo'), fecha = fd.get('fecha') || hoy(), nota = fd.get('nota').trim();
    if (TIPOS[tipo]) {
      if (!p.recordatorios[tipo]?.ultimo || fecha >= p.recordatorios[tipo].ultimo) completar(p, tipo, fecha, nota);
      else { p.historial.unshift({ id: uid(), fecha, tipo, nota }); guardarPlanta(p); }
    } else { (p.historial ||= []).unshift({ id: uid(), fecha, tipo: 'nota', nota }); guardarPlanta(p); }
    h.cerrar(); repintar();
  };
}

function editarRecordatorio(id, tipo) {
  const p = planta(id), e = pauta(p), t = TIPOS[tipo];
  const r = p.recordatorios[tipo] ||= { on: false, cada: null, ultimo: hoy() };
  const auto = (tipo === 'riego' || tipo === 'abono') && e;
  const autoTxt = tipo === 'riego' && e ? `Automático según la época (ahora cada ${intervaloRiego(e) || '—'} días)` : tipo === 'abono' && e ? (e.abono ? `Automático: cada ${e.abono} semanas en temporada` : 'Automático: esta especie no se abona') : '';
  const h = hoja(`<form class="form">
    <label class="interruptor"><span>Recordatorio activado</span><input type="checkbox" name="on" ${r.on ? 'checked' : ''}><i></i></label>
    ${auto ? `<div class="campo"><span>Frecuencia</span>${segmentado('modo', [['auto', 'Automática'], ['fija', 'Fija']], r.cada ? 'fija' : 'auto')}<p class="sub" data-auto-txt ${r.cada ? 'hidden' : ''}>${esc(autoTxt)}</p></div>` : ''}
    <label data-cada ${auto && !r.cada ? 'hidden' : ''}>Cada cuántos días<input type="number" name="cada" min="1" max="1500" value="${r.cada || (tipo === 'abono' && e?.abono ? e.abono * 7 : tipo === 'riego' && e ? intervaloRiego(e) || e.rv : t.cada)}"></label>
    <label>Última vez<input type="date" name="ultimo" value="${r.ultimo || hoy()}" max="${hoy()}"></label>
    <p class="sub">Siguiente: <strong data-sig></strong></p>
    <button class="btn ancho">Guardar</button>
    <button type="button" class="btn sec ancho" data-hecho-hoy>${ico('check')} ${t.verbo} hoy</button>
  </form>`, { titulo: t.nombre });
  let modo = r.cada ? 'fija' : 'auto';
  const form = $('form', h.el);
  const calcular = () => {
    const fd = new FormData(form);
    const prueba = JSON.parse(JSON.stringify(p));
    prueba.recordatorios[tipo] = { ...(r.pauta ? { pauta: r.pauta } : {}), on: true, cada: !auto || modo === 'fija' ? Math.max(1, +fd.get('cada') || t.cada) : null, ultimo: fd.get('ultimo') || hoy() };
    const f = vencimiento(prueba, tipo);
    $('[data-sig]', h.el).textContent = fd.get('on') ? (f ? fechaLarga(f) : 'sin fecha (fuera de temporada)') : 'desactivado';
    return prueba.recordatorios[tipo];
  };
  form.oninput = calcular;
  calcular();
  h.el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-seg] button');
    if (b) {
      modo = b.dataset.v;
      $$('[data-seg] button', h.el).forEach((x) => x.classList.toggle('on', x === b));
      $('[data-cada]', h.el).hidden = modo === 'auto';
      $('[data-auto-txt]', h.el).hidden = modo === 'fija';
      calcular();
    }
    if (ev.target.closest('[data-hecho-hoy]')) { const q = planta(id); q.recordatorios[tipo] = { ...calcular(), on: true }; guardarPlanta(q); completar(planta(id), tipo); h.cerrar(); aviso(`${t.nombre} anotado`); repintar(); }
  });
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const n = calcular();
    n.on = !!new FormData(form).get('on');
    const q = planta(id); q.recordatorios[tipo] = n; guardarPlanta(q);
    h.cerrar(); repintar();
  };
}
