/* Pestaña Diagnóstico: buscador por síntomas (sin IA) y guía de problemas por partes. */
import { $, $$, esc, cat, norm, datos, planta, especie, guardarPlanta, uid, hoy, tiposDeEspecie, nombrePlanta } from '../core.js';
import { PARTES, REMEDIOS, PROBLEMAS_GRUPO } from '../contenido.js';
import { rutas, ir, aviso, cabRaiz, cabDetalle, chips, ico } from '../ui.js';
import { ILUSTRACION } from '../iconos.js';
import { elegirPlanta } from './plantas.js';

const ICONO_TIPO = { Plaga: 'bicho', Hongo: 'hoja', Bacteria: 'hoja', Virus: 'alerta', Fisiopatía: 'sol', Rareza: 'estrella' };
const GRAV = { 1: 'Leve', 2: 'Moderado', 3: 'Grave' };
const problema = (id) => cat.enfermedades.find((x) => x.id === id || x.nombre === id);
const nombreSintoma = (s) => cat.sintomas[s]?.nombre || s;

rutas.diagnostico = () => {
  const mias = datos.plantas.map((p) => especie(p.especie)).filter(Boolean);
  const frecuentes = [...new Set(mias.flatMap((e) => PROBLEMAS_GRUPO[e.grupo] || []))].map(problema).filter(Boolean).slice(0, 6);
  return {
    html: `${cabRaiz('Diagnóstico')}
    <div class="contenido">
      <section class="tarjeta heroe">
        <div class="heroe-ilus">${ILUSTRACION.diagnostico}</div>
        <h2>Diagnostica una planta enferma</h2>
        <p>Marca lo que le notas y te diremos qué puede ser</p>
        <a class="btn grande ancho" href="#/sintomas">${ico('lupa')} Buscar por síntomas</a>
        <a class="enlace" href="#/enfermedades">Ver los ${cat.enfermedades.length} problemas de la guía ${ico('chevron')}</a>
      </section>
      <h2 class="seccion-tit">Enfermedades comunes plantas</h2>
      <div class="rejilla-partes">${PARTES.map((p) => `<a class="tarjeta-parte" href="#/parte/${p.id}">
        <span class="parte-ilus" style="--a:${p.fondo[0]};--b:${p.fondo[1]}">${ico(p.icono)}</span><span class="parte-nombre">${p.nombre}</span></a>`).join('')}</div>
      ${frecuentes.length ? `<h2 class="seccion-tit">Frecuentes en tus plantas</h2><div class="lista-enf">${frecuentes.map(filaEnf).join('')}</div>` : ''}
    </div>`,
  };
};

const partesDe = (id) => (id === 'planta' ? ['planta', 'raices'] : [id]);
rutas.parte = (id) => {
  const p = PARTES.find((x) => x.id === id);
  if (!p) return rutas.diagnostico();
  const lista = cat.enfermedades.filter((e) => e.partes.some((x) => partesDe(id).includes(x)));
  const parteSintoma = { planta: 'planta', hojas: 'hojas', tallos: 'tallos', flores: 'flores', frutos: 'frutos', plagas: 'hojas' }[id];
  return {
    html: `${cabDetalle(p.nombre)}<div class="contenido">
      <a class="fila-atrasadas" href="#/sintomas" data-parte="${parteSintoma}"><span>${ico('lupa')} Afinar marcando síntomas</span>${ico('chevron')}</a>
      <p class="sub">${lista.length} problemas</p>
      <div class="lista-enf">${lista.map(filaEnf).join('')}</div></div>`,
    despues(v) { $('[data-parte]', v).onclick = () => { busq.parte = parteSintoma; }; },
  };
};

const TIPOS_PROBLEMA = ['Plaga', 'Hongo', 'Bacteria', 'Virus', 'Fisiopatía', 'Rareza'];
let filtroTipo = '';
let textoGuia = '';
rutas.enfermedades = () => ({
  html: `${cabDetalle('Guía de problemas')}<div class="contenido">
    <div class="fila-busqueda"><input type="search" placeholder="Nombre, síntoma o causa" aria-label="Buscar problema" value="${esc(textoGuia)}" enterkeyhint="search"></div>
    <div class="opciones desliza">${['', ...TIPOS_PROBLEMA].map((t) => `<button class="opcion-btn ${t === filtroTipo ? 'on' : ''}" data-tipo="${t}">${t ? esc(t === 'Fisiopatía' ? 'Errores de cultivo' : t === 'Rareza' ? 'Rarezas' : t + (t === 'Virus' ? '' : 's')) : 'Todos'}</button>`).join('')}</div>
    <div class="lista-enf" id="listaEnf"></div></div>`,
  despues(v) {
    const input = $('input', v), box = $('#listaEnf', v);
    const pintar = () => {
      textoGuia = input.value;
      const q = consulta({ texto: input.value });
      let l = cat.enfermedades.filter((e) => !filtroTipo || e.tipo === filtroTipo);
      if (q.tokens.length) l = l.map((e) => ({ e, r: puntuar(e, q) })).filter((x) => x.r.tokens).sort((a, b) => b.r.pts - a.r.pts).map((x) => x.e);
      else l = l.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      box.innerHTML = l.map(filaEnf).join('') || '<p class="sub">Sin resultados. Prueba con otras palabras o con el buscador por síntomas.</p>';
    };
    input.oninput = pintar;
    v.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tipo]');
      if (b) { filtroTipo = b.dataset.tipo; $$('[data-tipo]', v).forEach((x) => x.classList.toggle('on', x === b)); pintar(); }
    });
    pintar();
  },
});

function filaEnf(e) {
  return `<a class="fila-enf" href="#/enfermedad/${e.id}"><span class="enf-ico t-${norm(e.tipo)}">${ico(ICONO_TIPO[e.tipo] || 'info')}</span><span class="txt"><strong>${esc(e.nombre)}</strong><span>${esc(e.sintomas)}</span></span>${ico('chevron', 'tenue')}</a>`;
}

rutas.enfermedad = (id) => {
  const e = problema(decodeURIComponent(id)) || cat.enfermedades[+id - 1];
  if (!e) return rutas.diagnostico();
  const rem = REMEDIOS.filter((r) => r.para.includes(e.nombre));
  const parecidos = cat.enfermedades
    .filter((x) => x !== e)
    .map((x) => ({ x, n: x.s.filter((s) => e.s.includes(s)).length }))
    .filter((y) => y.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4).map((y) => y.x);
  const tipos = e.plantas.includes('todas') ? 'Cualquier planta' : e.plantas.map((t) => cat.tiposPlanta[t]).join(', ');
  return {
    html: `${cabDetalle(e.tipo === 'Fisiopatía' ? 'Error de cultivo' : e.tipo)}<div class="contenido ficha">
      <h1 class="ficha-nombre">${esc(e.nombre)}</h1>
      ${e.alias?.length ? `<p class="ficha-cient comun">También: ${esc(e.alias.join(', '))}</p>` : ''}
      ${chips([
        { texto: GRAV[e.grav], cls: 'grav-' + e.grav },
        e.contagia && { texto: 'Se contagia', icono: 'alerta', cls: 'grav-3' },
        ...e.partes.map((p) => ({ texto: PARTES.find((x) => x.id === p)?.nombre || cat.partesSintoma[p] })),
      ])}
      <section class="tarjeta"><h3>${ico('lupa', 'rojo')} Cómo reconocerlo</h3><p>${esc(e.sintomas)}</p>
        <div class="chips">${e.s.map((s) => `<span class="chip">${esc(nombreSintoma(s))}</span>`).join('')}</div></section>
      <section class="tarjeta"><h3>${ico('info', 'naranja')} Por qué pasa</h3><p>${esc(e.causas)}</p>
        ${e.c.length ? `<p class="sub">Lo favorece: ${esc(e.c.map((c) => cat.condiciones[c].toLowerCase()).join(' · '))}</p>` : ''}</section>
      <section class="tarjeta"><h3>${ico('botiquin', 'verde')} Qué hacer</h3><p>${esc(e.tratamiento)}</p></section>
      <section class="tarjeta"><h3>${ico('check', 'azul')} Cómo evitarlo</h3><p>${esc(e.prevencion)}</p><p class="sub">Afecta sobre todo a: ${esc(tipos)}</p></section>
      ${rem.length ? `<h2 class="seccion-tit">Remedios caseros</h2><div class="carrusel">${rem.map(tarjetaRemedio).join('')}</div>` : ''}
      ${parecidos.length ? `<section class="tarjeta"><h3>${ico('copia', 'morado')} Se puede confundir con</h3><div class="lista-enlaces">${parecidos.map((x) => `<a href="#/enfermedad/${x.id}"><span>${esc(x.nombre)}<em class="sub comun"> · ${esc(x.sintomas.split('.')[0])}</em></span>${ico('chevron', 'tenue')}</a>`).join('')}</div></section>` : ''}
      ${datos.plantas.length ? `<button class="btn ancho" data-anotar>${ico('editar')} Anotar en una de mis plantas</button>` : ''}
      <a class="btn sec ancho" href="${esc(e.url)}" target="_blank" rel="noopener">Más información en Wikipedia</a>
    </div>`,
    despues(v) {
      const b = $('[data-anotar]', v);
      if (b) b.onclick = async () => {
        const pid = await elegirPlanta('¿Qué planta lo tiene?');
        if (!pid) return;
        const p = planta(pid);
        (p.historial ||= []).unshift({ id: uid(), fecha: hoy(), tipo: 'nota', nota: `Problema: ${e.nombre}` });
        p.recordatorios.revisar = { ...(p.recordatorios.revisar || {}), on: true, cada: 7, ultimo: hoy() };
        guardarPlanta(p);
        aviso(`Anotado en ${nombrePlanta(p)}. Te recordaré revisarla en 7 días`);
      };
    },
  };
};
export function tarjetaRemedio(r) {
  return `<a class="tarjeta-remedio" href="#/remedio/${r.id}"><span class="foto" data-wikititulo="${esc(r.wiki)}"></span><span class="etiqueta">${esc(r.tipo)}</span><strong>${esc(r.nombre)}</strong></a>`;
}

/* =====================================================================
 * Buscador por síntomas
 * ===================================================================== */
const busq = { texto: '', parte: 'hojas', s: new Set(), c: new Set(), tipo: '', plantaId: '' };

const STOP = new Set('de la el los las en y o u a que con se mi mis un una unos unas por para tiene tienen tengo esta estan está están muy mucho hay le les lo del al su sus me como pero sin sobre todo toda todas todos cuando ya es son ha han he planta plantas mía mia poco algo parece parecen salen sale le está'.split(' '));
/* Sinónimos: si una palabra empieza por la clave, también se buscan estas raíces. */
const SINON = {
  pudr: ['podr', 'bland'], podr: ['pudr', 'bland'], bland: ['podr', 'pudr', 'acuos'], negr: ['oscur', 'negr'], oscur: ['negr'],
  bich: ['insect', 'plaga', 'pulg', 'cochin'], insect: ['bich', 'plaga'], plag: ['insect', 'bich'], mosc: ['mosquit', 'mosc'], mosquit: ['mosc'],
  blanc: ['blanc', 'algod', 'harin', 'polv'], algod: ['cochin', 'algod'], telar: ['aran', 'acar'], aran: ['telar', 'acar'], acar: ['aran'],
  sec: ['sec', 'quem', 'marron'], arrug: ['chupad', 'deshinch', 'arrug'], chup: ['arrug'], deshinch: ['arrug'], cae: ['cae', 'caid'], caid: ['cae'],
  manch: ['manch', 'punt'], punt: ['punt', 'manch'], bab: ['babos', 'caracol'], caracol: ['babos'], gusan: ['orug', 'larv'], orug: ['gusan', 'larv'], larv: ['gusan', 'orug'],
  hormig: ['hormig', 'melaz', 'pulg'], pegaj: ['melaz', 'pegaj'], polv: ['harin', 'polv'], harin: ['polv', 'oidio'], moho: ['hong', 'moho'], hong: ['moho', 'fung'],
  amarill: ['amarill', 'clorosis'], marron: ['marron', 'parda', 'pardo'], estir: ['estir', 'etiol', 'alarg'], alarg: ['estir'], quem: ['quem', 'sol'],
  roj: ['roj', 'morad'], morad: ['roj'], agujer: ['agujer', 'comid', 'mordisc'], comid: ['comid', 'agujer'], mordi: ['mordisc', 'agujer'],
  riz: ['riz', 'enroll', 'deform'], enroll: ['enroll', 'riz'], deform: ['deform', 'riz'], capull: ['capull'], tierr: ['tierr', 'sustrat'], sustrat: ['tierr', 'sustrat'],
  olor: ['olor', 'huel'], huel: ['olor', 'huel'], gota: ['gota'], escam: ['escam', 'lapa'], lapa: ['escam'], cochin: ['cochin', 'algod'], pulg: ['pulg'],
  tall: ['tall', 'tronc'], tronc: ['tall', 'tronc'], cuell: ['base', 'cuell'], base: ['base', 'cuell'], plate: ['plate', 'brill'], brill: ['brill', 'pegaj'],
  musti: ['musti', 'decaid', 'marchit'], marchit: ['marchit', 'musti'], decaid: ['decaid', 'musti'], triste: ['musti', 'decaid'], laci: ['laci', 'caid'],
  raiz: ['raic', 'raiz'], raic: ['raic', 'raiz'], fruto: ['frut'], tomat: ['tomat'], florec: ['flor'], encharc: ['encharc', 'mojad', 'riego'], mojad: ['mojad', 'encharc'],
  rieg: ['rieg', 'agua'], agua: ['agua', 'rieg'], frio: ['frio', 'hel'], hel: ['hel', 'frio'], calor: ['calor', 'sol'], luz: ['luz', 'sombr'], grieta: ['raj'], raj: ['raj', 'griet'],
  tumor: ['bult'], bult: ['bult', 'nud'], nud: ['nud', 'bult'], verrug: ['costr', 'verrug'], costr: ['costr', 'verrug'], cal: ['cal'], cristal: ['cristal'],
};
function raiz(w) {
  let x = norm(w);
  if (x.length > 4) x = x.replace(/(es|s)$/, '');
  if (x.length > 4) x = x.replace(/[aoe]$/, '');
  return x;
}
/* Prepara una consulta a partir del estado del buscador. */
function consulta({ texto = '', s = new Set(), c = new Set(), tipo = '', plantaId = '' } = {}) {
  const palabras = norm(texto).split(/[^a-zñ0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const tokens = palabras.map((w) => {
    const r = raiz(w);
    const extra = Object.entries(SINON).filter(([k]) => r.startsWith(k) || (k.startsWith(r) && r.length >= 4)).flatMap(([, v]) => v);
    return [...new Set([r, ...extra])].filter((x) => x.length >= 3);
  });
  const p = plantaId ? planta(plantaId) : null;
  const e = p ? especie(p.especie) : null;
  const tipos = tipo ? [tipo] : e ? tiposDeEspecie(e) : [];
  const tipicos = new Set(e ? PROBLEMAS_GRUPO[e.grupo] || [] : []);
  return { tokens, s, c, tipos, tipicos };
}
const pajar = new WeakMap();
function textoDe(p) {
  if (!pajar.has(p)) {
    pajar.set(p, {
      nombre: norm(`${p.nombre} ${(p.alias || []).join(' ')}`),
      sint: norm(p.s.map(nombreSintoma).join(' ')),
      resto: norm(`${p.sintomas} ${p.causas} ${p.tipo}`),
    });
  }
  return pajar.get(p);
}
function puntuar(p, q) {
  const sMatch = p.s.filter((x) => q.s.has(x));
  const cMatch = p.c.filter((x) => q.c.has(x));
  let pts = sMatch.length * 10 + cMatch.length * 4;
  let tokens = 0;
  if (q.tokens.length) {
    const t = textoDe(p);
    let peso = 0;
    for (const raices of q.tokens) {
      const w = raices.some((r) => t.nombre.includes(r)) ? 3 : raices.some((r) => t.sint.includes(r)) ? 2 : raices.some((r) => t.resto.includes(r)) ? 1 : 0;
      if (w) { tokens++; peso += w; }
    }
    pts += tokens * 8 + peso * 2;
  }
  if (q.tipos.length) pts += p.plantas.includes('todas') || p.plantas.some((t) => q.tipos.includes(t)) ? 3 : -8;
  if (q.tipicos.has(p.nombre)) pts += 4;
  return { pts, sMatch, cMatch, tokens };
}
export function buscarProblemas(estado) {
  const q = consulta(estado);
  const conSintomas = q.s.size > 0, conTexto = q.tokens.length > 0;
  if (!conSintomas && !conTexto && !q.c.size) return { q, lista: [] };
  const lista = cat.enfermedades
    .map((p) => ({ p, r: puntuar(p, q) }))
    .filter(({ r }) => (conSintomas || conTexto ? r.sMatch.length || r.tokens : r.cMatch.length) && r.pts > 0)
    .sort((a, b) => b.r.pts - a.r.pts || b.p.grav - a.p.grav);
  return { q, lista };
}
/* Síntomas cuyo nombre encaja con lo escrito (sugerencias). */
function sugerencias(texto) {
  const q = consulta({ texto });
  if (!q.tokens.length) return [];
  return Object.entries(cat.sintomas)
    .map(([id, s]) => ({ id, n: q.tokens.filter((raices) => raices.some((r) => norm(s.nombre).includes(r))).length }))
    .filter((x) => x.n && !busq.s.has(x.id))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5).map((x) => x.id);
}

rutas.sintomas = (plantaId) => {
  if (plantaId && planta(plantaId)) busq.plantaId = plantaId;
  const mias = datos.plantas;
  const partes = Object.entries(cat.partesSintoma);
  return {
    html: `${cabDetalle('Buscar por síntomas', { derecha: '<button class="btn-texto" data-limpiar>Limpiar</button>' })}
    <div class="contenido buscador-sintomas">
      <div class="fila-busqueda"><input type="search" id="txtSintoma" placeholder="Describe lo que ves: bolitas blancas, hojas amarillas…" value="${esc(busq.texto)}" aria-label="Describe el problema" enterkeyhint="search" autocomplete="off"></div>
      <div id="sugs"></div>
      <section class="paso">
        <h3>¿Qué planta es? <span class="sub">opcional</span></h3>
        ${mias.length ? `<label class="selector-planta"><select id="selPlanta"><option value="">Ninguna de las mías</option>${mias.map((p) => `<option value="${esc(p.id)}" ${p.id === busq.plantaId ? 'selected' : ''}>${esc(nombrePlanta(p))}</option>`).join('')}</select></label>` : ''}
        <div class="opciones desliza" id="tiposPlanta"></div>
      </section>
      <section class="paso">
        <h3>¿Qué le notas?</h3>
        <div class="pestanas desliza">${partes.map(([k, n]) => `<button class="pestana" data-parte="${k}">${esc(n)}<i data-cuenta="${k}"></i></button>`).join('')}</div>
        <div class="opciones" id="chipsSintomas"></div>
      </section>
      <details class="paso plegable" ${busq.c.size ? 'open' : ''}>
        <summary><h3>¿Ha pasado algo de esto? <span class="sub">opcional</span></h3>${ico('abajo', 'tenue')}</summary>
        <div class="opciones">${Object.entries(cat.condiciones).map(([k, n]) => `<button class="opcion-btn" data-cond="${k}">${esc(n)}</button>`).join('')}</div>
      </details>
      <div id="marcados"></div>
      <h2 class="seccion-tit" id="numRes"></h2>
      <div class="lista-enf" id="resSintomas"></div>
    </div>`,
    despues(v) {
      const input = $('#txtSintoma', v);
      const pintar = () => {
        // pestañas y chips de síntomas
        $$('[data-parte]', v).forEach((b) => b.classList.toggle('on', b.dataset.parte === busq.parte));
        for (const [k] of partes) {
          const n = [...busq.s].filter((s) => cat.sintomas[s]?.parte === k).length;
          const i = $(`[data-cuenta="${k}"]`, v); i.textContent = n || ''; i.hidden = !n;
        }
        $('#chipsSintomas', v).innerHTML = Object.entries(cat.sintomas).filter(([, s]) => s.parte === busq.parte)
          .map(([id, s]) => `<button class="opcion-btn ${busq.s.has(id) ? 'on' : ''}" data-sint="${id}">${esc(s.nombre)}</button>`).join('');
        $$('[data-cond]', v).forEach((b) => b.classList.toggle('on', busq.c.has(b.dataset.cond)));
        // tipos de planta (si no se ha elegido una planta propia)
        const p = busq.plantaId ? planta(busq.plantaId) : null;
        const tiposPropios = p ? tiposDeEspecie(especie(p.especie)) : [];
        $('#tiposPlanta', v).innerHTML = p
          ? `<p class="sub">Se tienen en cuenta los problemas típicos de ${esc(tiposPropios.map((t) => cat.tiposPlanta[t]?.toLowerCase()).filter(Boolean).join(' y ') || 'su tipo')}.</p>`
          : Object.entries(cat.tiposPlanta).filter(([k]) => k !== 'todas').map(([k, n]) => `<button class="opcion-btn ${busq.tipo === k ? 'on' : ''}" data-tipo="${k}">${esc(n)}</button>`).join('');
        // sugerencias por lo escrito
        const sg = sugerencias(busq.texto);
        $('#sugs', v).innerHTML = sg.length ? `<p class="sub">¿Lo que ves es…?</p><div class="opciones">${sg.map((id) => `<button class="opcion-btn sug" data-sint="${id}">${ico('mas')} ${esc(nombreSintoma(id))}</button>`).join('')}</div>` : '';
        // lo marcado
        const marcados = [...busq.s].map((s) => ({ k: 's', id: s, t: nombreSintoma(s) })).concat([...busq.c].map((c) => ({ k: 'c', id: c, t: cat.condiciones[c] })));
        $('#marcados', v).innerHTML = marcados.length ? `<div class="chips">${marcados.map((m) => `<button class="chip quitar" data-quitar-${m.k}="${m.id}">${esc(m.t)} ${ico('cerrar')}</button>`).join('')}</div>` : '';
        // resultados
        const { q, lista } = buscarProblemas(busq);
        const total = q.s.size || q.tokens.length;
        $('#numRes', v).textContent = lista.length ? `${lista.length} ${lista.length === 1 ? 'posible problema' : 'posibles problemas'}` : '';
        $('#resSintomas', v).innerHTML = lista.length ? lista.slice(0, 25).map(({ p: e, r }) => {
          const enc = q.s.size ? r.sMatch.length / q.s.size : q.tokens.length ? r.tokens / q.tokens.length : 0.5;
          const nivel = enc >= 0.75 ? ['alto', 'Encaja muy bien'] : enc >= 0.4 ? ['medio', 'Encaja en parte'] : ['bajo', 'Encaja poco'];
          const coinc = [...r.sMatch.map(nombreSintoma), ...r.cMatch.map((c) => cat.condiciones[c])];
          return `<a class="res-sintoma" href="#/enfermedad/${e.id}">
            <span class="enf-ico t-${norm(e.tipo)}">${ico(ICONO_TIPO[e.tipo] || 'info')}</span>
            <span class="txt"><strong>${esc(e.nombre)}</strong>
              <span class="encaje e-${nivel[0]}"><i style="--p:${Math.round(enc * 100)}%"></i>${nivel[1]}${q.s.size ? ` · ${r.sMatch.length} de ${total} síntomas` : ''}</span>
              ${coinc.length ? `<span class="coinc">${esc(coinc.join(' · '))}</span>` : `<span class="coinc">${esc(e.sintomas)}</span>`}
            </span>${ico('chevron', 'tenue')}</a>`;
        }).join('') : `<div class="vacio pequeno"><p>${busq.s.size || busq.texto.trim() ? 'No encuentro nada con eso. Prueba a quitar algún síntoma o a escribirlo de otra forma.' : 'Escribe lo que ves o marca los síntomas y aquí aparecerán los problemas que encajan, de más a menos probable.'}</p></div>`;
      };
      let t;
      input.oninput = () => { busq.texto = input.value; clearTimeout(t); t = setTimeout(pintar, 150); };
      const sel = $('#selPlanta', v);
      if (sel) sel.onchange = () => { busq.plantaId = sel.value; busq.tipo = ''; pintar(); };
      v.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        if (b.dataset.parte) busq.parte = b.dataset.parte;
        else if (b.dataset.sint) {
          const id = b.dataset.sint;
          if (busq.s.has(id)) busq.s.delete(id); else busq.s.add(id);
          if (b.classList.contains('sug')) busq.parte = cat.sintomas[id].parte;
        } else if (b.dataset.cond) { if (busq.c.has(b.dataset.cond)) busq.c.delete(b.dataset.cond); else busq.c.add(b.dataset.cond); }
        else if (b.dataset.tipo) busq.tipo = busq.tipo === b.dataset.tipo ? '' : b.dataset.tipo;
        else if (b.dataset.quitarS) busq.s.delete(b.dataset.quitarS);
        else if (b.dataset.quitarC) busq.c.delete(b.dataset.quitarC);
        else if (b.hasAttribute('data-limpiar')) { busq.texto = ''; input.value = ''; busq.s.clear(); busq.c.clear(); busq.tipo = ''; busq.plantaId = ''; if (sel) sel.value = ''; }
        else return;
        pintar();
      });
      pintar();
    },
  };
};


