/* Pestaña Mis plantas (Plantas / Sitios), ficha de cada planta y alta de plantas. */
import { $, $$, esc, uid, hoy, sumar, fechaLarga, haceTxt, datos, planta, sitio, especie, pauta, grupo, nombres, nombresPlanta, nombrePlanta, cat, buscarEspecies, guardarPlanta, borrarPlanta, recordatoriosIniciales, vencimiento, completar, intervaloRiego, intervaloTxt, fotos, reducirImagen, elegirFoto, elegirFotos, fotosDe, ponerFotos, cantidad, modosRiego, modoRiego, origenRiego, store, activarImagenes } from '../core.js';
import { TIPOS } from '../contenido.js';
import { rutas, ir, hoja, aviso, menu, confirmar, cabRaiz, cabDetalle, segmentado, tarjetaPlanta, filaEspecie, chips, nomHTML, repintar, ico, LUZ_ICONO, DIF_TXT } from '../ui.js';
import { guiaEspecie, calendarioRiego } from './guia.js';
import { editarPauta } from './pauta.js';
import { coleccionLocal } from '../importar.js';

let pestana = 'plantas';

rutas.plantas = () => {
  const plantas = datos.plantas, sitios = datos.sitios;
  const cuerpo = pestana === 'plantas'
    ? (plantas.length ? `<div class="lista-plantas">${plantas.map(tarjetaPlanta).join('')}</div>` : `<div class="vacio"><h3>Tu jardín está vacío</h3><p>Añade tus plantas para tener sus cuidados y recordatorios a mano.</p><button class="btn" data-nueva>${ico('mas')} Añadir planta</button>${coleccionLocal() ? `<a class="enlace" href="#/ajustes">Copiar mis ${coleccionLocal().plantas.length} plantas de Plantitus ${ico('chevron')}</a>` : ''}</div>`)
    : `<div class="lista-sitios">${sitios.map((s) => {
      const ps = plantas.filter((p) => p.sitio === s.id);
      return `<a class="tarjeta-sitio" href="#/sitio/${esc(s.id)}">
        <div class="sitio-cab"><span class="sitio-ico">${ico(s.exterior ? 'exterior' : 'casa')}</span><div><strong>${esc(s.nombre)}</strong><span>${cuentaPlantas(ps)} · ${s.exterior ? 'Exterior' : 'Interior'}</span></div>${ico('chevron', 'tenue')}</div>
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

/* «3 plantas» o «3 plantas · 7 ejemplares» */
function cuentaPlantas(ps) {
  const n = ps.length, ej = ps.reduce((t, p) => t + cantidad(p), 0);
  return `${n} ${n === 1 ? 'planta' : 'plantas'}${ej > n ? ` · ${ej} ejemplares` : ''}`;
}

export function menuPlanta(id) {
  const p = planta(id);
  if (!p) return;
  menu([
    { texto: 'Regar ahora', icono: 'regadera', accion: () => { completar(p, 'riego'); aviso(`Regada: ${nombrePlanta(p)}`); repintar(); } },
    { texto: 'Editar', icono: 'editar', accion: () => editarPlanta(id) },
    { texto: 'Cambiar de sitio', icono: 'ubicacion', accion: () => cambiarSitio(id) },
    { texto: 'Eliminar', icono: 'basura', peligro: true, accion: async () => { if (await confirmar(`¿Eliminar «${nombrePlanta(p)}» y su historial?`, { si: 'Eliminar', peligro: true })) { borrarPlanta(id); aviso('Planta eliminada'); ir('plantas', { reemplazar: true }); } } },
  ], nombrePlanta(p));
}

/* ---------- sitios ---------- */
rutas.sitio = (id) => {
  const s = sitio(id);
  if (!s) { ir('plantas', { reemplazar: true }); return null; }
  const ps = datos.plantas.filter((p) => p.sitio === id);
  return {
    html: `${cabDetalle(s.nombre, { derecha: `<button class="btn-icono" data-editar aria-label="Editar sitio">${ico('editar')}</button>` })}<div class="contenido">
      <p class="sub centrado">${s.exterior ? 'Exterior' : 'Interior'} · ${cuentaPlantas(ps)}</p>
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
      <div class="fila-busqueda"><input type="search" placeholder="Busca entre ${cat.especies.length} especies" aria-label="Buscar especie"></div>
      <div class="resultados"></div>
      <button class="menu-op" data-propia>${ico('editar')}<span>No la encuentro: añadirla a mano</span></button>
    </div>`, { titulo: 'Añadir planta', clase: 'alta' });
  const input = $('input', h.el), res = $('.resultados', h.el);
  const pintarRes = () => {
    const l = buscarEspecies(input.value).slice(0, 40);
    res.innerHTML = input.value.trim() ? (l.map((e) => filaEspecie(e, { accion: `<span class="btn mini sec">Añadir</span>` })).join('') || '<p class="sub">Sin resultados. Prueba con el nombre científico o con otro nombre común.</p>') : `<p class="sub">Escribe el nombre común o el científico.</p>`;
    activarImagenes(res);
  };
  input.oninput = pintarRes;
  pintarRes();
  setTimeout(() => input.focus(), 300);
  h.el.addEventListener('click', async (e) => {
    const f = e.target.closest('.fila-esp');
    if (f) { e.preventDefault(); h.cerrar(); formularioPlanta({ especie: f.dataset.id }); }
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
    cantidad: cantidad(p),
    modo: p ? (p.recordatorios?.riego?.cada ? 'fija' : p.recordatorios?.riego?.modo || 'auto') : store.get('ultimoModo', 'auto'),
  };
  // fotos: las que ya tiene (id) y las nuevas (blob)
  let lista = fotosDe(p).map((f) => ({ ...f }));
  if (fotoBlob) lista.push({ blob: fotoBlob, fecha: hoy() });
  const quitadas = [];
  const modos = modosRiego();
  const h = hoja(`<form class="form form-planta">
    <div class="campo"><span>Fotos <em class="sub comun">· la primera es la portada</em></span><div class="tira-fotos" data-tira></div></div>
    ${e ? `<div class="esp-elegida">${nomHTML(nombres(e))}</div>` : ''}
    <label>Nombre o apodo<input name="nombre" value="${esc(ini.nombre)}" required placeholder="Mi cactus favorito"></label>
    ${!e ? `<label>Nombre científico (si lo sabes)<input name="cientifico" value="${esc(ini.cientifico)}" placeholder="Aeonium arboreum"></label>
      <label>Tipo de planta<select name="grupo">${Object.entries(cat.grupos).map(([k, g]) => `<option value="${k}">${esc(g.nombre)}</option>`).join('')}</select></label>` : ''}
    <div class="dos">
      <label>Sitio<select name="sitio">${opcionesSitio(ini.sitio)}</select></label>
      <div class="campo"><span>Ejemplares</span><div class="contador"><button type="button" data-cant="-1" aria-label="Uno menos">−</button><input type="number" name="cantidad" min="1" max="999" value="${ini.cantidad}" inputmode="numeric" aria-label="Número de ejemplares"><button type="button" data-cant="1" aria-label="Uno más">+</button></div></div>
    </div>
    <div class="campo"><span>Riego</span><div class="opciones" data-mriegos>
      ${[['auto', e ? 'Según la especie' : 'Según su tipo'], ...modos.map((m) => [m.id, m.nombre])].map(([v, t]) => `<button type="button" class="opcion-btn ${v === ini.modo ? 'on' : ''}" data-mriego="${v}">${esc(t)}</button>`).join('')}
      ${ini.modo === 'fija' ? '<button type="button" class="opcion-btn on" data-mriego="fija">Fija</button>' : ''}
    </div><p class="sub" data-mriego-txt></p></div>
    ${!p ? `<div class="campo"><span>¿Cuándo la regaste por última vez?</span>
      <div class="opciones-riego">${[['0', 'Hoy'], ['3', 'Hace 3 días'], ['7', 'Hace 1 semana'], ['14', 'Hace 2 semanas'], ['30', 'Hace un mes']].map(([v, t], i) => `<label class="opcion"><input type="radio" name="ultimo" value="${v}" ${i === 0 ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div></div>` : ''}
    <label>Notas<textarea name="notas" rows="2" placeholder="De dónde viene, sustrato, maceta…">${esc(ini.notas)}</textarea></label>
    <button class="btn ancho">${p ? 'Guardar cambios' : 'Añadir a mis plantas'}</button>
  </form>`, { titulo: p ? 'Editar planta' : 'Nueva planta', clase: 'alta' });

  const tira = $('[data-tira]', h.el);
  const urls = new Map();
  const urlDe = async (f) => f.blob ? (urls.get(f.blob) || (urls.set(f.blob, URL.createObjectURL(f.blob)), urls.get(f.blob))) : fotos.url(f.id);
  const pintarTira = async () => {
    tira.innerHTML = lista.map((f, i) => `<span class="mini-foto grande ${i === 0 ? 'portada' : ''}" data-i="${i}">${i === 0 ? '<b>Portada</b>' : ''}<button type="button" class="quitar-foto" data-quitar="${i}" aria-label="Quitar foto">${ico('cerrar')}</button></span>`).join('')
      + `<button type="button" class="mini-foto grande anadir-foto" data-anadir>${ico('camara')}<span>${lista.length ? 'Añadir' : 'Añadir fotos'}</span></button>`;
    for (const [i, f] of lista.entries()) {
      const u = await urlDe(f);
      const el = $(`[data-i="${i}"]`, tira);
      if (u && el) { el.style.backgroundImage = `url("${u}")`; el.classList.add('cargada'); }
    }
  };
  const textoModo = (v) => {
    const m = modoRiego(v);
    if (m) return `Cada ${m.rv} días en temporada${m.ri ? `, cada ${m.ri} en reposo` : ''}. Los modos se configuran en Ajustes.`;
    if (v === 'fija') return `Cada ${p?.recordatorios?.riego?.cada} días todo el año.`;
    return e ? `Ahora, cada ${intervaloRiego(e) || '—'} días según la época.` : 'Según el tipo de planta que elijas.';
  };
  let modoSel = ini.modo;
  $('[data-mriego-txt]', h.el).textContent = textoModo(modoSel);
  pintarTira();
  h.el.addEventListener('click', async (ev) => {
    const q = ev.target.closest('[data-quitar]');
    if (q) { ev.stopPropagation(); const [f] = lista.splice(+q.dataset.quitar, 1); if (f.id) quitadas.push(f.id); pintarTira(); return; }
    const fo = ev.target.closest('[data-i]');
    if (fo && +fo.dataset.i > 0) { const [f] = lista.splice(+fo.dataset.i, 1); lista.unshift(f); pintarTira(); aviso('Nueva portada'); return; }
    if (ev.target.closest('[data-anadir]')) {
      const fs = await elegirFotos();
      for (const f of fs) lista.push({ blob: await reducirImagen(f), fecha: hoy() });
      pintarTira(); return;
    }
    const c = ev.target.closest('[data-cant]');
    if (c) { const inp = $('[name=cantidad]', h.el); inp.value = Math.max(1, (+inp.value || 1) + +c.dataset.cant); return; }
    const m = ev.target.closest('[data-mriego]');
    if (m) { modoSel = m.dataset.mriego; $$('[data-mriego]', h.el).forEach((x) => x.classList.toggle('on', x === m)); $('[data-mriego-txt]', h.el).textContent = textoModo(modoSel); }
  });
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
    const finales = [];
    for (const f of lista) finales.push(f.blob ? { id: await fotos.guardar(f.blob), fecha: f.fecha } : { id: f.id, fecha: f.fecha });
    for (const idf of quitadas) fotos.borrar(idf);
    const nueva = p ? { ...p } : {
      id: uid(), creada: hoy(), historial: [],
      recordatorios: recordatoriosIniciales(espFinal, sumar(hoy(), -Number(fd.get('ultimo') || 0))),
    };
    Object.assign(nueva, {
      nombre: fd.get('nombre').trim() || espFinal?.nombre || 'Mi planta',
      especie: espFinal?.id || null,
      cientifico: espFinal?.cientifico || '',
      sitio: sitioId, notas: fd.get('notas').trim(),
      cantidad: Math.max(1, Math.round(+fd.get('cantidad') || 1)),
    });
    ponerFotos(nueva, finales);
    if (modoSel !== 'fija') {
      const r = nueva.recordatorios.riego;
      r.cada = null;
      if (modoRiego(modoSel)) r.modo = modoSel; else delete r.modo;
    }
    if (!p) store.set('ultimoModo', modoSel === 'fija' ? 'auto' : modoSel);
    guardarPlanta(nueva);
    urls.forEach((u) => URL.revokeObjectURL(u));
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
    const h = hoja(`<div class="menu-lista">${ps.map((p) => `<button class="menu-op planta-op" data-id="${esc(p.id)}"><span class="mini-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(especie(p.especie)?.cientifico || '')}"></span><span>${esc(nombrePlanta(p))}<em class="sub comun"> ${esc(sitio(p.sitio)?.nombre || '')}</em></span></button>`).join('')}</div>`, { titulo, alCerrar: () => ok(elegida) });
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
      ${pa ? `<section class="tarjeta"><h3>${ico('calendario', 'verde')} Riego y abono por meses<button class="btn-texto editar-pauta" data-pauta-planta>${ico('editar')} Editar</button></h3>
        ${calendarioRiego(pa)}<p class="sub">${esc(origenRiego(p))}.</p></section>` : ''}
      ${p.notas ? `<section class="tarjeta"><h3>Notas</h3><p>${esc(p.notas)}</p></section>` : ''}`,
    historial: hist.length ? `<section class="tarjeta historial">${hist.map((x) => `<div class="hist">
        <span class="tipo-ico" style="--c:${TIPOS[x.tipo]?.color || '#8a9a94'}">${ico(TIPOS[x.tipo]?.icono || 'editar')}</span>
        <div class="txt"><strong>${esc(TIPOS[x.tipo]?.nombre || 'Nota')}${x.nota && TIPOS[x.tipo] ? ` · ${esc(x.nota)}` : ''}</strong>${!TIPOS[x.tipo] && x.nota ? `<p>${esc(x.nota)}</p>` : ''}<span>${esc(fechaLarga(x.fecha))} · ${haceTxt(x.fecha)}</span></div>
        <button class="btn-icono tenue" data-borrar-hist="${esc(x.id)}" aria-label="Borrar">${ico('basura')}</button></div>`).join('')}</section>` : '<div class="vacio"><p>Aún no hay nada anotado. Al marcar tareas como hechas aparecerán aquí.</p></div>',
    info: e ? `${guiaEspecie(e).replace(`data-editar-pauta="${esc(e.id)}"`, `data-editar-pauta="${esc(e.id)}" data-planta="${esc(id)}"`)}<a class="btn sec ancho" href="#/especie/${encodeURIComponent(e.id)}">Ver ficha de la especie</a>` : '<div class="vacio"><p>Esta planta no está enlazada a ninguna especie del catálogo.</p></div>',
  }[sec];
  const [n1, n2, cient] = nombresPlanta(p);
  return {
    html: `<div class="cabecera-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(e?.cientifico || p.cientifico || '')}">
        ${cabDetalle('', { transparente: true, derecha: `<button class="btn-icono" data-menu aria-label="Opciones">${ico('puntos')}</button>` })}
        <button class="foto-cambiar" data-anadir-fotos aria-label="Añadir fotos">${ico('camara')}</button>
      </div>
      <div class="contenido ficha">
        <h1 class="ficha-nombre ${cient ? 'cient' : ''}">${esc(n1)}</h1>
        ${n2 ? `<p class="ficha-cient ${cient ? 'comun' : ''}">${esc(n2)}</p>` : ''}
        ${chips([{ icono: 'ubicacion', texto: s?.nombre || 'Sin sitio' }, cantidad(p) > 1 && { icono: 'plantas', texto: `${cantidad(p)} ejemplares` }, e && { texto: `${LUZ_ICONO[e.luz]} ${cat.luz[e.luz]}` }, e && { icono: 'mano', texto: DIF_TXT[e.dificultad] }, { icono: 'calendario', texto: `Desde ${fechaLarga(p.creada).toLowerCase()}` }])}
        <div class="galeria" data-galeria>${fotosDe(p).map((f, i) => `<button class="mini-foto grande ${i === 0 ? 'portada' : ''}" data-foto="${esc(f.id)}" data-ver="${i}" aria-label="Ver foto ${i + 1}"></button>`).join('')}<button class="mini-foto grande anadir-foto" data-anadir-fotos>${ico('camara')}<span>${fotosDe(p).length ? 'Añadir' : 'Añadir fotos'}</span></button></div>
        ${segmentado('sec', [['cuidados', 'Cuidados'], ['historial', 'Historial'], ['info', 'Guía']], sec)}
        ${cuerpo}
        <a class="fila-atrasadas le-pasa" href="#/sintomas/${esc(id)}"><span>${ico('botiquin')} ¿Le pasa algo? Busca por síntomas</span>${ico('chevron')}</a>
      </div>`,
    despues(v) {
      if (tipoAbrir && TIPOS[tipoAbrir]) setTimeout(() => editarRecordatorio(id, tipoAbrir), 50);
      v.addEventListener('click', async (ev) => {
        const seg = ev.target.closest('[data-seg] button');
        if (seg) { seccionPlanta[id] = seg.dataset.v; history.replaceState(null, '', `#/planta/${id}`); repintar(); return; }
        const rec = ev.target.closest('[data-rec]');
        if (rec) editarRecordatorio(id, rec.dataset.rec);
        if (ev.target.closest('[data-menu]')) menuPlanta(id);
        if (ev.target.closest('[data-regar]')) { completar(planta(id), 'riego'); aviso('Riego anotado'); repintar(); }
        if (ev.target.closest('[data-nota]')) anotar(id);
        if (ev.target.closest('[data-anadir-fotos]')) {
          const fs = await elegirFotos(); if (!fs.length) return;
          const q = planta(id); const l = fotosDe(q);
          for (const f of fs) l.push({ id: await fotos.guardar(await reducirImagen(f)), fecha: hoy() });
          guardarPlanta(ponerFotos(q, l));
          aviso(fs.length === 1 ? 'Foto añadida' : `${fs.length} fotos añadidas`);
          repintar();
        }
        const vf = ev.target.closest('[data-ver]');
        if (vf) verFotos(id, +vf.dataset.ver);
        if (ev.target.closest('[data-pauta-planta]')) editarPauta({ plantaId: id });
        const bh = ev.target.closest('[data-borrar-hist]');
        if (bh) { const q = planta(id); q.historial = q.historial.filter((x) => x.id !== bh.dataset.borrarHist); guardarPlanta(q); repintar(); }
      });
    },
  };
};

/* Visor de las fotos de una planta. */
function verFotos(id, inicio = 0) {
  let i = inicio, cambiado = false;
  const h = hoja(`<div class="visor"><div class="visor-foto" data-visor></div>
    <div class="visor-nav"><button class="btn-icono" data-mov="-1" aria-label="Anterior">${ico('izq')}</button><span data-pos></span><button class="btn-icono" data-mov="1" aria-label="Siguiente">${ico('der')}</button></div>
    <div class="fila-botones"><button class="btn sec" data-portada>${ico('estrella')} Portada</button><button class="btn sec peligro" data-borrar-foto>${ico('basura')} Borrar</button></div></div>`, { titulo: 'Fotos', alCerrar: () => { if (cambiado) repintar(); } });
  const pintar = async () => {
    const l = fotosDe(planta(id));
    if (!l.length) { h.cerrar(); return; }
    i = (i + l.length) % l.length;
    const u = await fotos.url(l[i].id);
    $('[data-visor]', h.el).style.backgroundImage = u ? `url("${u}")` : '';
    $('[data-pos]', h.el).textContent = `${i + 1} de ${l.length} · ${fechaLarga(l[i].fecha)}`;
    $('[data-portada]', h.el).disabled = i === 0;
    $$('[data-mov]', h.el).forEach((b) => { b.hidden = l.length < 2; });
  };
  h.el.addEventListener('click', async (ev) => {
    const m = ev.target.closest('[data-mov]');
    if (m) { i += +m.dataset.mov; pintar(); }
    if (ev.target.closest('[data-portada]')) {
      const q = planta(id); const l = fotosDe(q); const [f] = l.splice(i, 1); l.unshift(f);
      guardarPlanta(ponerFotos(q, l)); i = 0; cambiado = true; aviso('Nueva portada'); pintar();
    }
    if (ev.target.closest('[data-borrar-foto]') && await confirmar('¿Borrar esta foto?', { si: 'Borrar', peligro: true })) {
      const q = planta(id); const l = fotosDe(q); const [f] = l.splice(i, 1);
      fotos.borrar(f.id); guardarPlanta(ponerFotos(q, l)); cambiado = true; pintar();
    }
  });
  pintar();
}

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
  const p = planta(id), t = TIPOS[tipo];
  const r = p.recordatorios[tipo] ||= { on: false, cada: null, ultimo: hoy() };
  const esp = especie(p.especie);
  const auto = (tipo === 'riego' || tipo === 'abono') && (esp || r.pauta);
  const modos = tipo === 'riego' ? modosRiego() : [];
  const opciones = auto ? [['auto', tipo === 'riego' ? (r.pauta ? 'Su pauta propia' : 'Según la especie') : 'Automática'], ...modos.map((m) => [m.id, m.nombre]), ['fija', 'Fija']] : [];
  let modo = r.cada ? 'fija' : (r.modo && modoRiego(r.modo) ? r.modo : 'auto');
  const prueba = (cada) => {
    const q = JSON.parse(JSON.stringify(p));
    const n = { on: true, ultimo: $('[name=ultimo]', h.el).value || hoy(), cada: null };
    if (r.pauta) n.pauta = r.pauta;
    if (modo === 'fija' || !auto) n.cada = Math.max(1, cada || t.cada);
    else if (modoRiego(modo)) n.modo = modo;
    q.recordatorios[tipo] = n;
    return q;
  };
  const textoAuto = () => {
    if (modo === 'fija') return '';
    const q = prueba();
    const pa = pauta(q);
    if (tipo === 'abono') return pa?.abono ? `Cada ${pa.abono} semanas en su temporada.` : 'Esta especie no se abona.';
    const m = modoRiego(modo);
    const n = intervaloRiego(pa);
    return `${m ? `Modo «${m.nombre}»: cada ${m.rv} días en temporada${m.ri ? `, ${m.ri} en reposo` : ''}.` : 'Cambia según la época del año.'} Ahora, ${n ? `cada ${n} días` : 'sin riego'}.`;
  };
  const pa0 = pauta(p);
  const h = hoja(`<form class="form">
    <label class="interruptor"><span>Recordatorio activado</span><input type="checkbox" name="on" ${r.on ? 'checked' : ''}><i></i></label>
    ${auto ? `<div class="campo"><span>Frecuencia</span><div class="opciones" data-frec>${opciones.map(([v, x]) => `<button type="button" class="opcion-btn ${v === modo ? 'on' : ''}" data-v="${v}">${esc(x)}</button>`).join('')}</div><p class="sub" data-auto-txt></p></div>` : ''}
    <label data-cada ${auto && modo !== 'fija' ? 'hidden' : ''}>Cada cuántos días<input type="number" name="cada" min="1" max="1500" value="${r.cada || (tipo === 'abono' && pa0?.abono ? pa0.abono * 7 : tipo === 'riego' && pa0 ? intervaloRiego(pa0) || pa0.rv : t.cada)}" inputmode="numeric"></label>
    <label>Última vez<input type="date" name="ultimo" value="${r.ultimo || hoy()}" max="${hoy()}"></label>
    <p class="sub">Siguiente: <strong data-sig></strong></p>
    ${auto ? `<button type="button" class="btn-texto" data-pauta>${ico('calendario')} Cambiar la pauta por meses</button>` : ''}
    <button class="btn ancho">Guardar</button>
    <button type="button" class="btn sec ancho" data-hecho-hoy>${ico('check')} ${t.verbo} hoy</button>
  </form>`, { titulo: t.nombre });
  const form = $('form', h.el);
  const calcular = () => {
    const fd = new FormData(form);
    const q = prueba(+fd.get('cada'));
    const f = vencimiento(q, tipo);
    $('[data-sig]', h.el).textContent = fd.get('on') ? (f ? fechaLarga(f) : 'sin fecha (fuera de temporada)') : 'desactivado';
    const at = $('[data-auto-txt]', h.el);
    if (at) at.textContent = textoAuto();
    return q.recordatorios[tipo];
  };
  form.oninput = calcular;
  calcular();
  h.el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-frec] button');
    if (b) {
      modo = b.dataset.v;
      $$('[data-frec] button', h.el).forEach((x) => x.classList.toggle('on', x === b));
      $('[data-cada]', h.el).hidden = modo !== 'fija';
      calcular();
    }
    if (ev.target.closest('[data-pauta]')) { h.cerrar(); editarPauta({ plantaId: id }); }
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
