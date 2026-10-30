/* Pestaña Tareas: tiempo, semana, atrasadas y tareas del día. */
import { $, $$, esc, nombrePlanta, cientificoPrimero, hoy, iso, parse, sumar, difDias, DIAS, MESES, fechaLarga, datos, planta, sitio, especie, tareasDelDia, tareasEntre, tareasAtrasadas, completar, posponer, tiempo, iconoTiempo, store, buscarCiudad, guardarPlanta, vencimiento } from '../core.js';
import { TIPOS } from '../contenido.js';
import { rutas, ir, hoja, aviso, menu, cabDetalle, repintar, ico } from '../ui.js';
import { ILUSTRACION } from '../iconos.js';
import { nuevaPlanta, elegirPlanta } from './plantas.js';
import { exportarICS } from './ajustes.js';

let dia = hoy();
let mesAbierto = false;
let refDia = hoy(); // día que fija la semana o el mes visibles

function inicioSemana(s) { const d = parse(s); d.setDate(d.getDate() - d.getDay()); return iso(d); }

rutas.tareas = async () => {
  const h = hoy();
  if (dia < sumar(h, -60)) dia = h;
  const plantas = datos.plantas;
  const atrasadas = tareasAtrasadas(plantas);
  const tareas = tareasDelDia(dia, plantas);
  const conTarea = new Set();
  const ini = mesAbierto ? iso(new Date(parse(refDia).getFullYear(), parse(refDia).getMonth(), 1)) : inicioSemana(refDia);
  const finRango = mesAbierto ? sumar(inicioSemana(sumar(ini, 41)), 6) : sumar(ini, 6);
  for (const t of tareasEntre(h, finRango > h ? finRango : h, plantas)) conTarea.add(t.fecha);
  if (atrasadas.length) conTarea.add(h);

  const html = `
  <div class="tareas-top">
    <header class="tiempo-cab">
      <button class="tiempo" data-ciudad>
        <span class="tiempo-ico" id="tIco">⛅</span>
        <span class="tiempo-txt"><strong id="tTemp">--°C~--°C</strong><span id="tCiudad">Buscando ubicación… ${ico('chevron')}</span></span>
      </button>
      <div class="cab-acciones">
        <a class="btn-icono" href="#/ajustes" aria-label="Ajustes">${ico('ajustes')}</a>
        <button class="btn-icono" data-mas aria-label="Más opciones">${ico('masCirculo')}</button>
      </div>
    </header>
  </div>
  <section class="semana ${mesAbierto ? 'mes' : ''}">
    ${mesAbierto ? cabMes() : ''}
    <div class="semana-dias">${DIAS.map((d) => `<span>${d}</span>`).join('')}</div>
    ${mesAbierto ? rejillaMes(conTarea) : filaSemana(conTarea)}
    <button class="semana-tirador" data-mes aria-label="${mesAbierto ? 'Ver semana' : 'Ver mes'}">${ico('abajo', mesAbierto ? 'girado' : '')}</button>
  </section>
  ${dia === h && atrasadas.length ? `<a class="fila-atrasadas" href="#/atrasadas"><span>Tareas atrasadas</span><strong>${atrasadas.length}</strong>${ico('chevron')}</a>` : ''}
  <div id="avisoLluvia"></div>
  ${tareas.length ? listaTareas(tareas, dia) : vacio(plantas, dia)}
  <button class="fab" data-fab aria-label="Añadir">${ico('mas')}</button>`;

  return {
    html,
    despues(v) {
      pintarTiempo(v, tareas);
      v.addEventListener('click', (ev) => {
        const b = ev.target.closest('button,[data-dia]');
        if (!b) return;
        if (b.dataset.dia) { dia = b.dataset.dia; refDia = dia; repintar(); }
        else if (b.dataset.sem) { refDia = sumar(refDia, +b.dataset.sem * 7); repintar(); }
        else if (b.dataset.mesnav) { const d = parse(refDia); refDia = iso(new Date(d.getFullYear(), d.getMonth() + +b.dataset.mesnav, 1)); repintar(); }
        else if (b.hasAttribute('data-mes')) { mesAbierto = !mesAbierto; refDia = dia; repintar(); }
        else if (b.hasAttribute('data-ciudad')) elegirCiudad();
        else if (b.hasAttribute('data-mas')) menuMas();
        else if (b.hasAttribute('data-fab')) menuAnadir();
        else if (b.dataset.hecho) marcar(b);
        else if (b.dataset.todo) marcarTodo(b.dataset.todo, tareas);
        else if (b.dataset.opc) opcionesTarea(b.dataset.opc, b.dataset.tipo);
        else if (b.dataset.proximas !== undefined) ir('proximas');
      });
    },
  };
};

function filaSemana(conTarea) {
  const ini = inicioSemana(refDia), h = hoy();
  let out = `<div class="semana-fila"><button class="sem-flecha" data-sem="-1" aria-label="Semana anterior">${ico('izq')}</button>`;
  for (let i = 0; i < 7; i++) {
    const f = sumar(ini, i);
    out += `<button class="dia ${f === dia ? 'sel' : ''} ${f === h ? 'hoy' : ''} ${conTarea.has(f) && f !== dia ? 'punto' : ''}" data-dia="${f}" aria-label="${fechaLarga(f)}">${parse(f).getDate()}</button>`;
  }
  return out + `<button class="sem-flecha" data-sem="1" aria-label="Semana siguiente">${ico('der')}</button></div>`;
}
function cabMes() {
  const d = parse(refDia);
  return `<div class="mes-cab"><button class="sem-flecha" data-mesnav="-1" aria-label="Mes anterior">${ico('izq')}</button><strong>${MESES[d.getMonth()][0].toUpperCase() + MESES[d.getMonth()].slice(1)} ${d.getFullYear()}</strong><button class="sem-flecha" data-mesnav="1" aria-label="Mes siguiente">${ico('der')}</button></div>`;
}
function rejillaMes(conTarea) {
  const d = parse(refDia), h = hoy();
  const primero = iso(new Date(d.getFullYear(), d.getMonth(), 1));
  const ini = inicioSemana(primero);
  let out = '<div class="mes-rejilla">';
  for (let i = 0; i < 42; i++) {
    const f = sumar(ini, i);
    const fuera = parse(f).getMonth() !== d.getMonth();
    if (i >= 35 && fuera) break;
    out += `<button class="dia ${fuera ? 'fuera' : ''} ${f === dia ? 'sel' : ''} ${f === h ? 'hoy' : ''} ${conTarea.has(f) && f !== dia ? 'punto' : ''}" data-dia="${f}">${parse(f).getDate()}</button>`;
  }
  return out + '</div>';
}

function filaTarea(t) {
  const p = t.planta, s = sitio(p.sitio), tipo = TIPOS[t.tipo];
  const dd = difDias(t.fecha, hoy());
  const nota = t.hecha ? 'Hecho' : t.atrasada ? `Atrasada ${dd} ${dd === 1 ? 'día' : 'días'}` : (s?.nombre || '');
  return `<div class="fila-tarea ${t.hecha ? 'hecha' : ''}">
    <a class="mini-foto" href="#/planta/${esc(p.id)}" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(especie(p.especie)?.cientifico || '')}"></a>
    <a class="txt" href="#/planta/${esc(p.id)}"><strong class="${cientificoPrimero() && especie(p.especie) ? 'cient' : ''}">${esc(nombrePlanta(p))}</strong><span class="${t.atrasada ? 'rojo' : ''}">${esc(nota)}</span></a>
    ${t.hecha ? `<span class="check on">${ico('hecho')}</span>` : `<button class="btn-icono tenue" data-opc="${esc(p.id)}" data-tipo="${t.tipo}" aria-label="Opciones">${ico('puntos')}</button>
    <button class="check" data-hecho="${esc(p.id)}" data-tipo="${t.tipo}" aria-label="${tipo.verbo} ${esc(nombrePlanta(p))}">${ico('pendiente')}</button>`}
  </div>`;
}
function listaTareas(tareas, d) {
  const porTipo = {};
  for (const t of tareas) (porTipo[t.tipo] ||= []).push(t);
  const futuro = d > hoy();
  return `<div class="lista-tareas">${d !== hoy() ? `<p class="dia-titulo">${fechaLarga(d)}</p>` : ''}${Object.entries(porTipo).map(([tipo, ts]) => `
    <section class="grupo-tareas">
      <header><span class="tipo-ico" style="--c:${TIPOS[tipo].color}">${ico(TIPOS[tipo].icono)}</span><h3>${TIPOS[tipo].nombre}</h3><span class="cuenta">${ts.length}</span>
        ${!futuro && ts.some((t) => !t.hecha) && ts.length > 1 ? `<button class="btn-texto" data-todo="${tipo}">Hecho todo</button>` : ''}</header>
      ${ts.map(filaTarea).join('')}
    </section>`).join('')}</div>`;
}
function vacio(plantas, d) {
  if (!plantas.length) {
    return `<div class="vacio">${ILUSTRACION.sinTareas}<h3>Aún no tienes plantas</h3><p>Añade tu primera planta y te avisaremos de cuándo regarla, abonarla y trasplantarla.</p><button class="btn" data-fab>${ico('mas')} Añadir planta</button></div>`;
  }
  const prox = tareasEntre(sumar(hoy(), 1), sumar(hoy(), 120), plantas)[0];
  const en = prox ? difDias(hoy(), prox.fecha) : null;
  const titulo = d === hoy() ? 'Hoy no hay tareas' : d < hoy() ? 'No hiciste tareas este día' : 'No hay tareas este día';
  return `<div class="vacio">${ILUSTRACION.sinTareas}<h3>${titulo}</h3>
    ${prox ? `<p>Las próximas tareas son ${en === 1 ? 'mañana' : `en ${en} días`}</p><button class="enlace" data-proximas>Consulta las próximas tareas ${ico('chevron')}</button>` : '<p>No hay tareas programadas.</p>'}
  </div>`;
}

async function pintarTiempo(v, tareas) {
  const t = await tiempo();
  const ciudad = $('#tCiudad', v), temp = $('#tTemp', v), icon = $('#tIco', v);
  if (!t) { if (ciudad) ciudad.innerHTML = `Elegir ubicación ${ico('chevron')}`; if (temp) temp.textContent = 'Tiempo'; return; }
  if (!temp) return;
  temp.textContent = `${t.min}°C~${t.max}°C`;
  ciudad.innerHTML = `${esc(t.ciudad)} ${ico('chevron')}`;
  icon.textContent = iconoTiempo(t.codigo);
  const exterior = tareas.filter((x) => x.tipo === 'riego' && !x.hecha && sitio(x.planta.sitio)?.exterior);
  if (t.lluvia >= 2 && exterior.length && dia === hoy()) {
    const box = $('#avisoLluvia', v);
    box.innerHTML = `<div class="aviso-lluvia">${ico('lluvia')}<div><strong>Hoy se esperan ${t.lluvia.toFixed(1).replace('.', ',')} mm de lluvia</strong><span>${exterior.length} ${exterior.length === 1 ? 'planta de exterior puede' : 'plantas de exterior pueden'} saltarse el riego.</span></div><button class="btn mini" data-lluvia>Marcar como regadas</button></div>`;
    $('[data-lluvia]', box).onclick = () => {
      for (const x of exterior) completar(planta(x.planta.id), 'riego', hoy(), 'Lluvia');
      aviso('Riegos marcados por la lluvia');
      repintar();
    };
  }
}

function marcar(b) {
  const p = planta(b.dataset.hecho), tipo = b.dataset.tipo;
  if (!p) return;
  const antes = JSON.parse(JSON.stringify(p.recordatorios[tipo]));
  const hist = (p.historial || []).length;
  b.classList.add('on'); b.innerHTML = ico('hecho');
  completar(p, tipo, hoy());
  setTimeout(() => {
    repintar();
    aviso(`${TIPOS[tipo].nombre}: ${nombrePlanta(p)}`, {
      deshacer: () => {
        const q = planta(p.id);
        q.recordatorios[tipo] = antes;
        q.historial = (q.historial || []).slice((q.historial || []).length - hist);
        guardarPlanta(q); repintar();
      },
    });
  }, 350);
}
function marcarTodo(tipo, tareas) {
  const ts = tareas.filter((t) => t.tipo === tipo && !t.hecha);
  for (const t of ts) completar(planta(t.planta.id), tipo, hoy());
  aviso(`${ts.length} tareas de ${TIPOS[tipo].nombre.toLowerCase()} hechas`);
  repintar();
}
function opcionesTarea(id, tipo) {
  const p = planta(id);
  menu([
    { texto: 'Posponer 1 día', icono: 'reloj', accion: () => { posponer(p, tipo, 1); aviso('Pospuesta a mañana'); repintar(); } },
    { texto: 'Posponer 3 días', icono: 'reloj', accion: () => { posponer(p, tipo, 3); aviso('Pospuesta 3 días'); repintar(); } },
    { texto: 'Saltar esta vez', icono: 'chevron', accion: () => { completar(p, tipo, hoy(), 'Saltada'); repintar(); } },
    { texto: 'Ver la planta', icono: 'plantas', accion: () => ir('planta/' + id) },
  ], `${TIPOS[tipo].nombre} · ${nombrePlanta(p)}`);
}
function menuMas() {
  menu([
    { texto: 'Próximas tareas', icono: 'calendario', accion: () => ir('proximas') },
    { texto: 'Tareas atrasadas', icono: 'alerta', accion: () => ir('atrasadas') },
    { texto: 'Añadir avisos al Calendario', icono: 'descargar', accion: exportarICS },
    { texto: 'Volver a hoy', icono: 'reloj', accion: () => { dia = hoy(); refDia = dia; repintar(); } },
  ]);
}
function menuAnadir() {
  menu([
    { texto: 'Añadir planta', icono: 'plantas', accion: () => nuevaPlanta() },
    { texto: 'Añadir tarea a una planta', icono: 'calendario', accion: anadirTarea },
  ]);
}
async function anadirTarea() {
  const id = await elegirPlanta('¿A qué planta?');
  if (!id) return;
  const p = planta(id);
  const h = hoja(`<div class="menu-lista">${Object.entries(TIPOS).map(([k, t]) => `<button class="menu-op" data-t="${k}"><span class="tipo-ico" style="--c:${t.color}">${ico(t.icono)}</span><span>${t.nombre}</span>${p.recordatorios[k]?.on ? '<em class="sub">activa</em>' : ''}</button>`).join('')}</div>`, { titulo: 'Tipo de tarea' });
  h.el.onclick = (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    h.cerrar();
    ir(`planta/${id}/cuidados/${b.dataset.t}`);
  };
}
async function elegirCiudad() {
  const actual = store.get('ciudad', null);
  const h = hoja(`<form class="buscador-ciudad"><input type="search" placeholder="Busca tu ciudad" aria-label="Ciudad" autofocus></form>
    <button class="menu-op" data-gps>${ico('ubicacion')}<span>Usar mi ubicación actual</span></button>
    <div class="resultados-ciudad"></div>`, { titulo: actual ? `Ubicación: ${actual.nombre}` : 'Ubicación' });
  const input = $('input', h.el), res = $('.resultados-ciudad', h.el);
  let lista = [];
  let tm;
  input.oninput = () => {
    clearTimeout(tm);
    tm = setTimeout(async () => {
      if (input.value.trim().length < 2) { res.innerHTML = ''; return; }
      try { lista = await buscarCiudad(input.value); } catch { lista = []; }
      res.innerHTML = lista.map((c, i) => `<button class="menu-op" data-i="${i}">${ico('ubicacion')}<span>${esc(c.nombre)}<em class="sub"> ${esc(c.region)}</em></span></button>`).join('') || '<p class="sub">Sin resultados</p>';
    }, 300);
  };
  $('form', h.el).onsubmit = (e) => e.preventDefault();
  h.el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (b) { store.set('ciudad', lista[+b.dataset.i]); h.cerrar(); repintar(); }
    if (e.target.closest('[data-gps]')) { store.del('ciudad'); h.cerrar(); repintar(); }
  });
}

/* ---------- listas: próximas y atrasadas ---------- */
rutas.proximas = () => {
  const ts = tareasEntre(sumar(hoy(), 1), sumar(hoy(), 60));
  const porDia = {};
  for (const t of ts) (porDia[t.fecha] ||= []).push(t);
  return {
    html: `${cabDetalle('Próximas tareas')}<div class="contenido">${Object.keys(porDia).length ? Object.entries(porDia).map(([f, l]) => `<section class="grupo-tareas"><header><h3>${fechaLarga(f)}</h3><span class="cuenta">${l.length}</span></header>${l.map((t) => filaProxima(t)).join('')}</section>`).join('') : '<div class="vacio"><p>No hay tareas en los próximos 60 días.</p></div>'}</div>`,
  };
};
function filaProxima(t) {
  const p = t.planta, tipo = TIPOS[t.tipo];
  return `<a class="fila-tarea" href="#/planta/${esc(p.id)}"><span class="mini-foto" ${p.foto ? `data-foto="${esc(p.foto)}"` : ''} data-wiki="${esc(especie(p.especie)?.cientifico || '')}"></span><span class="txt"><strong class="${cientificoPrimero() && especie(p.especie) ? 'cient' : ''}">${esc(nombrePlanta(p))}</strong><span>${esc(sitio(p.sitio)?.nombre || '')}</span></span><span class="tipo-ico" style="--c:${tipo.color}" title="${tipo.nombre}">${ico(tipo.icono)}</span></a>`;
}
rutas.atrasadas = () => {
  const ts = tareasAtrasadas();
  return {
    html: `${cabDetalle('Tareas atrasadas')}<div class="contenido">${ts.length ? listaTareas(ts, hoy()) : '<div class="vacio"><p>¡Todo al día! No hay tareas atrasadas.</p></div>'}</div>`,
    despues(v) {
      v.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        if (b.dataset.hecho) marcar(b);
        else if (b.dataset.todo) marcarTodo(b.dataset.todo, ts);
        else if (b.dataset.opc) opcionesTarea(b.dataset.opc, b.dataset.tipo);
      });
    },
  };
};

export { vencimiento };
