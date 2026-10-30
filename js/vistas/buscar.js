/* Pestaña Encontrar planta: buscador, colecciones, selección del mes y fichas. */
import { $, esc, cat, especie, grupo, buscarEspecies, MESES, datos, esFavorito, descripcionEspecie, reducirImagen, elegirFoto, fotos, fotosPropiasEsp, olvidarFotoEspecie, repintarImagenes, activarImagenes, origenTxt, nombres, nombreEsp } from '../core.js';
import { COLECCIONES, SELECCION } from '../contenido.js';
import { rutas, ir, aviso, menu, cabRaiz, cabDetalle, tarjetaEspecie, filaEspecie, repintar, ico } from '../ui.js';
import { guiaEspecie } from './guia.js';
import { nuevaPlanta } from './plantas.js';

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
        <a class="buscador-falso" href="#/resultados">${ico('buscar')}<span>Buscar entre ${cat.especies.length} especies</span></a>
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
        ? (l.length ? l.map((e) => filaEspecie(e)).join('') : `<div class="vacio"><p>No hay ninguna especie con «${esc(q)}».</p><button class="btn" data-mano>${ico('editar')} Añadirla a mi catálogo</button><p class="sub">También puedes pedir que la añadan al catálogo fijo.</p></div>`)
        : `<p class="sub">Busca entre ${cat.especies.length} especies: cactus, suculentas, flora canaria, plantas de interior, aromáticas y huerto.</p>`;
      activarImagenes(res);
    };
    input.oninput = pintarRes;
    pintarRes();
    setTimeout(() => input.focus(), 100);
    res.addEventListener('click', async (e) => {
      if (e.target.closest('[data-mano]')) (await import('./ajustes.js')).editarEspeciePropia(null, input.value.trim());
    });
  },
});

/* ---------- colecciones ---------- */
rutas.coleccion = (id) => {
  const c = COLECCIONES.find((x) => x.id === id);
  if (!c) return rutas.buscar();
  const lista = cat.especies.filter(c.filtro).sort((a, b) => nombreEsp(a).localeCompare(nombreEsp(b), 'es'));
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
  const [n1, n2, cient] = nombres(e);
  return {
    html: `<div class="cabecera-foto" data-wiki="${esc(e.cientifico)}">
        ${cabDetalle('', { transparente: true, derecha: `<button class="btn-icono fav-cab ${fav ? 'on' : ''}" data-fav="${esc(e.id)}" aria-label="Favorita">${ico(fav ? 'corazonOn' : 'corazon')}</button>` })}
        <button class="foto-cambiar" data-foto-esp aria-label="Cambiar la foto de la especie">${ico('foto')}</button>
      </div>
      <div class="contenido ficha">
        <h1 class="ficha-nombre ${cient ? 'cient' : ''}">${esc(n1)}</h1>
        <p class="ficha-cient ${cient ? 'comun' : ''}">${esc(n2)}</p>
        <p class="ficha-grupo">${esc(g.nombre)}${o ? ` · <span class="verde">${esc(o)}</span>` : ''}${e.propia ? ' · Añadida por ti' : ''}</p>
        ${mias.length ? `<a class="aviso-mia" href="#/planta/${esc(mias[0].id)}">${ico('plantasOn')} Tienes ${mias.length === 1 ? 'esta planta' : `${mias.length} plantas de esta especie`} ${ico('chevron')}</a>` : ''}
        <section class="tarjeta descripcion" id="wikiTxt"><p class="sub">Cargando descripción…</p></section>
        ${guiaEspecie(e)}
        ${e.propia ? `<div class="fila-botones"><button class="btn sec" data-editar-esp>${ico('editar')} Editar especie</button></div>` : ''}
      </div>
      <div class="barra-accion"><button class="btn ancho" data-anadir>${ico('mas')} Añadir a mis plantas</button></div>`,
    async despues(v) {
      $('[data-anadir]', v).onclick = () => nuevaPlanta(e.id);
      const ed = $('[data-editar-esp]', v);
      if (ed) ed.onclick = async () => (await import('./ajustes.js')).editarEspeciePropia(e.id);
      $('[data-foto-esp]', v).onclick = () => cambiarFotoEspecie(e, v);
      const w = await descripcionEspecie(e.cientifico);
      const box = $('#wikiTxt', v);
      if (!box) return;
      if (w?.texto) box.innerHTML = `<p>${esc(w.texto)}</p>${w.url ? `<a class="enlace" href="${esc(w.url)}" target="_blank" rel="noopener">Leer más en Wikipedia ${ico('chevron')}</a>` : ''}`;
      else box.remove();
    },
  };
};

/* ---------- corregir la foto de una especie ---------- */
function cambiarFotoEspecie(e, v) {
  const propia = fotosPropiasEsp.get(e.cientifico);
  const ops = [
    { texto: 'Usar una foto mía', icono: 'camara', accion: async () => {
      const f = await elegirFoto();
      if (!f) return;
      const id = await fotos.guardar(await reducirImagen(f, 1000));
      if (propia && propia !== 'ninguna') fotos.borrar(propia);
      fotosPropiasEsp.set(e.cientifico, id);
      aviso('Foto cambiada'); repintarImagenes(v);
    } },
    { texto: 'Quitar la foto (está mal)', icono: 'cerrar', accion: () => {
      if (propia && propia !== 'ninguna') fotos.borrar(propia);
      fotosPropiasEsp.set(e.cientifico, 'ninguna');
      aviso('Foto quitada'); repintarImagenes(v);
    } },
  ];
  if (propia) ops.push({ texto: 'Volver a la foto de Wikimedia', icono: 'rotar', accion: () => {
    if (propia !== 'ninguna') fotos.borrar(propia);
    fotosPropiasEsp.set(e.cientifico, null); olvidarFotoEspecie(e.cientifico);
    repintarImagenes(v);
  } });
  menu(ops, `Foto de ${nombreEsp(e)}`);
}
