/* Pestaña Encontrar planta: buscador, identificación, colecciones, selección del mes y fichas. */
import { $, $$, esc, cat, norm, especie, grupo, buscarEspecies, MESES, datos, esFavorito, wiki, reducirImagen, elegirFoto, blobABase64, preguntarIAJSON, iaLista, activarImagenes, origenTxt } from '../core.js';
import { COLECCIONES, SELECCION } from '../contenido.js';
import { rutas, ir, hoja, aviso, cabRaiz, cabDetalle, tarjetaEspecie, filaEspecie, chatHTML, activarChat, repintar, ico } from '../ui.js';
import { guiaEspecie } from './guia.js';
import { nuevaPlanta, formularioPlanta } from './plantas.js';

const idDe = (cient) => cat.especies.find((e) => e.cientifico === cient)?.id;

rutas.buscar = () => {
  const mes = new Date().getMonth() + 1;
  const sel = (SELECCION[mes] || []).map((c) => especie(idDe(c))).filter(Boolean);
  const canarias = cat.especies.filter((e) => e.tags.includes('end') && ['suculenta_invernal', 'tabaiba', 'arbusto_canario'].includes(e.grupo));
  const destacadasCanarias = canarias.filter((_, i) => i % Math.max(1, Math.floor(canarias.length / 6)) === 0).slice(0, 6);
  return {
    html: `${cabRaiz('Encontrar planta', { fav: true })}
    <div class="contenido">
      <div class="fila-busqueda grande">
        <a class="buscador-falso" href="#/resultados">${ico('buscar')}<span>Buscar</span></a>
        <button class="btn identificar" data-identificar>${ico('camara')} Identificar</button>
      </div>
      <a class="tarjeta-buscador" href="#/buscador">
        <span class="sello">${ico('filtro')}</span>
        <span class="txt"><strong>Buscador de plantas</strong><span>¡Elige las plantas perfectas para ti!</span></span>${ico('chevron', 'tenue')}
      </a>
      <h2 class="seccion-tit">Un hogar verde</h2>
      <div class="carrusel circulos">${COLECCIONES.map((c) => `<a class="circulo" href="#/coleccion/${c.id}"><span class="foto" data-wiki="${esc(c.foto)}"></span><span class="nombre">${esc(c.nombre)}</span></a>`).join('')}</div>
      <h2 class="seccion-tit">Selección de plantas de ${MESES[mes - 1]}</h2>
      <div class="rejilla-esp">${sel.map(tarjetaEspecie).join('')}</div>
      <h2 class="seccion-tit con-enlace">Endemismos canarios <a href="#/coleccion/endemicas">Ver todas ${ico('chevron')}</a></h2>
      <div class="rejilla-esp">${destacadasCanarias.map(tarjetaEspecie).join('')}</div>
      <p class="sub centrado">${cat.especies.length} especies en el catálogo</p>
    </div>`,
    despues(v) {
      $('[data-identificar]', v).onclick = () => identificarConFoto();
    },
  };
};

/* ---------- búsqueda por texto ---------- */
let ultimaBusqueda = '';
rutas.resultados = () => ({
  html: `${cabDetalle('Buscar')}<div class="contenido">
    <div class="fila-busqueda"><input type="search" placeholder="Nombre común o científico" value="${esc(ultimaBusqueda)}" aria-label="Buscar" enterkeyhint="search"></div>
    <div class="resultados"></div></div>`,
  despues(v) {
    const input = $('input', v), res = $('.resultados', v);
    const pintarRes = () => {
      ultimaBusqueda = input.value;
      const q = input.value.trim();
      const l = q ? buscarEspecies(q).slice(0, 80) : [];
      res.innerHTML = q
        ? (l.length ? l.map((e) => filaEspecie(e)).join('') : `<div class="vacio"><p>No hay ninguna especie con «${esc(q)}».</p>${iaLista() ? `<button class="btn" data-ia>${ico('chispa')} Añadirla al catálogo con IA</button>` : '<p class="sub">Puedes añadirla en Ajustes → Mi catálogo.</p>'}</div>`)
        : `<p class="sub">Busca entre ${cat.especies.length} especies: cactus, suculentas, flora canaria, plantas de interior, aromáticas y huerto.</p>`;
      activarImagenes(res);
    };
    input.oninput = pintarRes;
    pintarRes();
    setTimeout(() => input.focus(), 100);
    res.addEventListener('click', async (e) => {
      if (e.target.closest('[data-ia]')) {
        const { anadirEspecieIA } = await import('./ajustes.js');
        const nueva = await anadirEspecieIA(input.value.trim());
        if (nueva) ir('especie/' + nueva.id);
      }
    });
  },
});

/* ---------- colecciones ---------- */
rutas.coleccion = (id) => {
  const c = COLECCIONES.find((x) => x.id === id);
  if (!c) return rutas.buscar();
  const lista = cat.especies.filter(c.filtro).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return { html: `${cabDetalle(c.nombre)}<div class="contenido"><p class="sub centrado">${lista.length} especies</p><div class="rejilla-esp">${lista.map(tarjetaEspecie).join('')}</div></div>` };
};
rutas.favoritos = () => {
  const lista = datos.favoritos.map(especie).filter(Boolean);
  return { html: `${cabDetalle('Favoritas')}<div class="contenido">${lista.length ? `<div class="rejilla-esp">${lista.map(tarjetaEspecie).join('')}</div>` : `<div class="vacio">${ico('corazon', 'grande')}<p>Pulsa el corazón de cualquier planta del catálogo para guardarla aquí.</p></div>`}</div>` };
};

/* ---------- buscador con filtros ---------- */
const FILTROS = [
  { id: 'luz', titulo: '¿Cuánta luz tiene el sitio?', multi: true, op: [['sombra', 'Poca luz'], ['semi', 'Luz indirecta'], ['parcial', 'Sol parcial'], ['sol', 'Pleno sol']], f: (e, v) => v.includes(e.luz) },
  { id: 'donde', titulo: '¿Dónde va a estar?', op: [['int', 'Interior'], ['ext', 'Exterior']], f: (e, v) => e.tags.includes(v[0]) || (v[0] === 'ext' && !e.tags.includes('int') && !e.tags.includes('ext')) },
  { id: 'dif', titulo: '¿Cuánto tiempo le vas a dedicar?', multi: true, op: [['F', 'Poco: que sea fácil'], ['M', 'Algo'], ['D', 'Mucho: me gustan los retos']], f: (e, v) => v.includes(e.dificultad) },
  { id: 'tipo', titulo: 'Tipo de planta', multi: true, op: [['cactus', 'Cactus'], ['suculenta', 'Suculentas'], ['interior', 'De interior'], ['tropical', 'Tropicales'], ['helecho', 'Helechos'], ['orquidea', 'Orquídeas y bromelias'], ['aromatica', 'Aromáticas'], ['huerto', 'Huerto y frutales'], ['flor', 'Flores'], ['arbusto', 'Árboles, arbustos y palmeras'], ['carnivora', 'Carnívoras']],
    f: (e, v) => v.some((t) => ({
      cactus: e.grupo.startsWith('cactus'), suculenta: ['suculenta', 'suculenta_invernal', 'tabaiba', 'mesemb', 'mesemb_invernal', 'caudex'].includes(e.grupo),
      interior: e.grupo === 'interior', tropical: e.grupo === 'tropical', helecho: e.grupo === 'helecho', orquidea: ['orquidea', 'bromelia', 'tillandsia'].includes(e.grupo),
      aromatica: e.grupo === 'aromatica', huerto: e.grupo === 'huerto' || (e.tags.includes('com') && e.grupo === 'arbol'), flor: e.grupo === 'flor' || e.grupo === 'bulbosa' || e.tags.includes('flor'),
      arbusto: ['arbusto', 'arbusto_canario', 'arbol', 'palmera', 'trepadora'].includes(e.grupo), carnivora: e.grupo === 'carnivora',
    }[t])) },
  { id: 'extra', titulo: 'Otras preferencias', multi: true, op: [['mascotas', 'Segura con mascotas'], ['canaria', 'Flora canaria'], ['aire', 'Purifica el aire'], ['colg', 'Colgante'], ['flor', 'Con flor vistosa']],
    f: (e, v) => v.every((t) => ({ mascotas: !e.tags.includes('tox'), canaria: e.tags.some((x) => ['end', 'nat', 'mac'].includes(x)), aire: e.tags.includes('aire'), colg: e.tags.includes('colg'), flor: e.tags.includes('flor') }[t])) },
];
const filtros = {};
rutas.buscador = () => {
  const activos = Object.entries(filtros).filter(([, v]) => v.length);
  const lista = cat.especies.filter((e) => activos.every(([k, v]) => FILTROS.find((f) => f.id === k).f(e, v)) && !e.tags.includes('inv'));
  return {
    html: `${cabDetalle('Buscador de plantas', { derecha: activos.length ? '<button class="btn-texto" data-limpiar>Limpiar</button>' : '' })}
    <div class="contenido">${FILTROS.map((f) => `<section class="filtro"><h3>${f.titulo}</h3><div class="opciones">${f.op.map(([v, t]) => `<button class="opcion-btn ${(filtros[f.id] || []).includes(v) ? 'on' : ''}" data-f="${f.id}" data-v="${v}">${esc(t)}</button>`).join('')}</div></section>`).join('')}
      <h2 class="seccion-tit">${lista.length} ${lista.length === 1 ? 'planta encaja' : 'plantas encajan'}</h2>
      <div class="rejilla-esp">${lista.slice(0, 60).map(tarjetaEspecie).join('')}</div>
      ${lista.length > 60 ? `<p class="sub centrado">Se muestran 60. Añade filtros para afinar.</p>` : ''}
    </div>`,
    despues(v) {
      v.addEventListener('click', (e) => {
        const b = e.target.closest('[data-f]');
        if (b) {
          const f = FILTROS.find((x) => x.id === b.dataset.f);
          const cur = filtros[f.id] || [];
          filtros[f.id] = cur.includes(b.dataset.v) ? cur.filter((x) => x !== b.dataset.v) : f.multi ? [...cur, b.dataset.v] : [b.dataset.v];
          repintar();
        }
        if (e.target.closest('[data-limpiar]')) { for (const k of Object.keys(filtros)) delete filtros[k]; repintar(); }
      });
    },
  };
};

/* ---------- ficha de especie ---------- */
rutas.especie = async (id) => {
  const e = especie(id);
  if (!e) return { html: `${cabDetalle('Especie')}<div class="vacio"><p>Esta especie ya no está en el catálogo.</p></div>` };
  const g = grupo(e);
  const fav = esFavorito(e.id);
  const mias = datos.plantas.filter((p) => p.especie === e.id);
  const o = origenTxt(e);
  return {
    html: `<div class="cabecera-foto" data-wiki="${esc(e.cientifico)}">
        ${cabDetalle('', { transparente: true, derecha: `<button class="btn-icono fav-cab ${fav ? 'on' : ''}" data-fav="${esc(e.id)}" aria-label="Favorita">${ico(fav ? 'corazonOn' : 'corazon')}</button>` })}
      </div>
      <div class="contenido ficha">
        <h1 class="ficha-nombre">${esc(e.nombre)}</h1>
        <p class="ficha-cient">${esc(e.cientifico)}</p>
        <p class="ficha-grupo">${esc(g.nombre)}${o ? ` · <span class="verde">${esc(o)}</span>` : ''}${e.propia ? ' · Añadida por ti' : ''}</p>
        ${mias.length ? `<a class="aviso-mia" href="#/planta/${esc(mias[0].id)}">${ico('plantasOn')} Tienes ${mias.length === 1 ? 'esta planta' : `${mias.length} plantas de esta especie`} ${ico('chevron')}</a>` : ''}
        <section class="tarjeta descripcion" id="wikiTxt"><p class="sub">Cargando descripción…</p></section>
        ${guiaEspecie(e)}
        ${chatHTML('esp-' + e.id, { titulo: `Pregunta sobre ${e.nombre}`, sugerencias: ['¿Cómo se reproduce?', '¿Puede vivir en la azotea?', '¿Qué sustrato le pongo?'] })}
        ${e.propia ? `<div class="fila-botones"><button class="btn sec" data-editar-esp>${ico('editar')} Editar especie</button></div>` : ''}
      </div>
      <div class="barra-accion"><button class="btn ancho" data-anadir>${ico('mas')} Añadir a mis plantas</button></div>`,
    async despues(v) {
      activarChat(v, 'esp-' + e.id, `Especie: ${e.nombre} (${e.cientifico}), ${g.nombre}. Pauta de la app: riego cada ${e.rv} días en temporada; luz ${cat.luz[e.luz]}; mínima ${e.tmin} °C.`);
      $('[data-anadir]', v).onclick = () => nuevaPlanta(e.id);
      const ed = $('[data-editar-esp]', v);
      if (ed) ed.onclick = async () => (await import('./ajustes.js')).editarEspeciePropia(e.id);
      const w = await wiki(e.cientifico);
      const box = $('#wikiTxt', v);
      if (!box) return;
      if (w?.texto) box.innerHTML = `<p>${esc(w.texto)}</p>${w.url ? `<a class="enlace" href="${esc(w.url)}" target="_blank" rel="noopener">Leer más en Wikipedia ${ico('chevron')}</a>` : ''}`;
      else box.remove();
    },
  };
};

/* ---------- identificar con foto ---------- */
export async function identificarConFoto() {
  if (!iaLista()) {
    const h = hoja(`<p>Para identificar plantas con una foto hace falta el asistente con IA. Añade una clave gratuita de Gemini o una de Claude en Ajustes.</p><a class="btn ancho" href="#/ajustes">Ir a Ajustes</a>`, { titulo: 'Identificar planta' });
    $('a', h.el).onclick = () => h.cerrar();
    return;
  }
  const f = await elegirFoto({ camara: true });
  if (!f) return;
  const blob = await reducirImagen(f, 1024, 0.8);
  const url = URL.createObjectURL(blob);
  const h = hoja(`<div class="ident"><div class="ident-foto" style="background-image:url(${url})"><span class="escaneo"></span></div><div class="ident-res"><p class="cargando">${ico('chispa')} Identificando…</p></div></div>`, { titulo: 'Identificar planta', clase: 'alta' });
  let res;
  try {
    res = await preguntarIAJSON(`Identifica la planta de la foto. Devuelve {"candidatos":[{"nombre":"nombre común en español","cientifico":"nombre científico aceptado","confianza":0-100,"motivo":"rasgos visibles que lo indican, 1 frase"}],"salud":"1 frase sobre si se ve sana o con algún problema","consejo":"1 consejo de cuidado"} con 1 a 3 candidatos de más a menos probable. Si no es una planta, candidatos vacío.`, [{ base64: await blobABase64(blob), tipo: 'image/jpeg' }]);
  } catch (e) {
    $('.ident-res', h.el).innerHTML = `<p class="error">${esc(e.message)}</p>`;
    return;
  }
  const cands = (res.candidatos || []).map((c) => ({ ...c, e: emparejar(c) }));
  $('.escaneo', h.el)?.remove();
  $('.ident-res', h.el).innerHTML = cands.length ? `
    ${cands.map((c, i) => `<div class="cand ${i === 0 ? 'primero' : ''}">
      ${c.e ? `<span class="mini-foto" data-wiki="${esc(c.e.cientifico)}"></span>` : `<span class="mini-foto sin-foto"></span>`}
      <div class="txt"><strong>${esc(c.e?.nombre || c.nombre)}</strong><em>${esc(c.e?.cientifico || c.cientifico)}</em><span class="meta">${esc(c.motivo || '')}</span></div>
      <span class="confianza" style="--p:${Math.max(0, Math.min(100, +c.confianza || 0))}">${Math.round(+c.confianza || 0)} %</span>
      <div class="cand-acc">${c.e ? `<a class="btn mini sec" href="#/especie/${encodeURIComponent(c.e.id)}">Ver ficha</a><button class="btn mini" data-add="${i}">Añadir</button>` : `<button class="btn mini sec" data-cat="${i}">${ico('chispa')} Añadir al catálogo</button>`}</div>
    </div>`).join('')}
    ${res.salud ? `<p class="ident-nota">${ico('botiquin', 'verde')} ${esc(res.salud)}</p>` : ''}
    ${res.consejo ? `<p class="ident-nota">${ico('chispa', 'verde')} ${esc(res.consejo)}</p>` : ''}`
    : '<p>No se ha reconocido ninguna planta. Prueba con una foto más cercana y con buena luz.</p>';
  activarImagenes(h.el);
  h.el.addEventListener('click', async (ev) => {
    const a = ev.target.closest('[data-add]');
    if (a) { h.cerrar(); formularioPlanta({ especie: cands[+a.dataset.add].e.id, fotoBlob: blob }); }
    const c = ev.target.closest('[data-cat]');
    if (c) {
      const { anadirEspecieIA } = await import('./ajustes.js');
      h.cerrar();
      const nueva = await anadirEspecieIA(cands[+c.dataset.cat].cientifico || cands[+c.dataset.cat].nombre);
      if (nueva) formularioPlanta({ especie: nueva.id, fotoBlob: blob });
    }
    if (ev.target.closest('a[href]')) h.cerrar();
  });
}
function emparejar(c) {
  const n = norm(c.cientifico || '').replace(/['‘’"]/g, '').trim();
  if (!n) return null;
  const binomio = n.split(/\s+/).slice(0, 2).join(' ');
  return cat.especies.find((e) => norm(e.cientifico) === n)
    || cat.especies.find((e) => norm(e.cientifico).replace(/['‘’"]/g, '').startsWith(binomio))
    || cat.especies.find((e) => (e.alias || []).some((a) => norm(a) === n))
    || null;
}
