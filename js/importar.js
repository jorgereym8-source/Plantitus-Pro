/* Importa la colección de Plantitus (la app anterior).
 * Las dos apps viven en jorgereym8-source.github.io, así que comparten
 * almacenamiento: se puede leer la colección directamente o desde una copia
 * de seguridad de Plantitus (.json). */
import { cat, norm, uid, hoy, datos, store, fotos, recordatoriosIniciales, refrescarCatalogo } from './core.js';

const EXTERIOR = /terraza|jard[ií]n|azotea|balc[oó]n|patio|huerto|exterior|invernadero|tejado/i;
const TIPO_GRUPO = { suculenta: 'cactus', canaria: 'suculenta_invernal', interior: 'interior', tropical: 'tropical', otra: 'interior' };
const HIST = { riego: 'riego', abono: 'abono', trasplante: 'trasplante', poda: 'poda' };

/* Colección guardada por Plantitus en este mismo navegador. */
export function coleccionLocal() {
  try {
    const c = JSON.parse(localStorage.getItem('plantitus.coleccion') || 'null');
    return c && Array.isArray(c.plantas) && c.plantas.length ? c : null;
  } catch { return null; }
}

/* Fotos de Plantitus (IndexedDB «plantitus», clave = id de la planta). */
function fotoLocal(id) {
  return new Promise((ok) => {
    let req;
    try { req = indexedDB.open('plantitus', 1); } catch { ok(null); return; }
    req.onupgradeneeded = () => req.result.createObjectStore('fotos');
    req.onerror = () => ok(null);
    req.onsuccess = () => {
      try {
        const g = req.result.transaction('fotos').objectStore('fotos').get(id);
        g.onsuccess = () => ok(g.result || null);
        g.onerror = () => ok(null);
      } catch { ok(null); }
    };
  });
}

function buscarEspecie(p) {
  const candidatos = [p.catalogo, p.nombre, p.apodo].filter(Boolean).map(norm);
  for (const c of candidatos) {
    const e = cat.especies.find((x) => norm(x.cientifico) === c) || cat.especies.find((x) => norm(x.nombre) === c);
    if (e) return e;
  }
  // nombre científico con autor o variedad: «Copiapoa cinerea var. columna-alba» → «Copiapoa cinerea»
  for (const c of candidatos) {
    const dos = c.split(/\s+/).slice(0, 2).join(' ');
    const e = dos.includes(' ') && cat.especies.find((x) => norm(x.cientifico).startsWith(dos));
    if (e) return e;
  }
  return null;
}

/* Convierte la pauta de Plantitus (meses n/r/s y booleanos) a la de Plantitus Pro. */
function pautaRiego(r) {
  if (!r || !Array.isArray(r.meses)) return null;
  return { rv: Math.max(1, +r.cada || 7), ri: Math.max(0, +r.cadaReposo || 0), meses: r.meses.map((m) => ({ n: 'N', r: 'R', s: 'S' }[m] || 'N')).join('') };
}
function pautaAbono(a) {
  if (!a || !Array.isArray(a.meses)) return null;
  return { abono: a.activo ? Math.max(1, +a.cadaSemanas || 4) : 0, abonoMeses: a.meses.map((m) => (m ? '1' : '0')).join('') };
}

function ultima(hist, tipo) {
  return hist.filter((h) => h.tipo === tipo && h.fecha).map((h) => h.fecha).sort().pop() || null;
}

/* Importa una colección. fotosExternas: { idPlanta: dataURL } (copias de seguridad). */
export async function importarColeccion(col, fotosExternas = null) {
  const existentes = datos.plantas;
  const yaImportadas = new Set(existentes.map((p) => p.origenPlantitus).filter(Boolean));
  const sitios = datos.sitios;
  const sitioPorNombre = (nombre) => {
    if (!nombre) return null;
    let s = sitios.find((x) => norm(x.nombre) === norm(nombre));
    if (!s) { s = { id: 's-' + uid(), nombre, exterior: EXTERIOR.test(nombre) }; sitios.push(s); }
    return s.id;
  };
  let n = 0, conEspecie = 0, conFoto = 0;
  const nuevas = [];
  for (const p of col.plantas) {
    if (yaImportadas.has(p.id)) continue;
    const e = buscarEspecie(p);
    if (e) conEspecie++;
    const hist = Array.isArray(p.historial) ? p.historial : [];
    const recs = recordatoriosIniciales(e || { grupo: TIPO_GRUPO[p.tipo] || 'interior' });
    const ur = ultima(hist, 'riego'), ua = ultima(hist, 'abono'), ut = ultima(hist, 'trasplante'), up = ultima(hist, 'poda');
    recs.riego = { on: true, cada: null, ultimo: ur || hoy(), pauta: pautaRiego(p.riego) };
    recs.abono = { on: !!p.abono?.activo, cada: null, ultimo: ua || hoy(), pauta: pautaAbono(p.abono) };
    if (ut) recs.trasplante.ultimo = ut;
    if (up) { recs.poda.ultimo = up; }
    // sin fecha anotada se cuenta desde hoy, para no llenar Tareas de atrasadas
    if (!recs.riego.pauta) delete recs.riego.pauta;
    if (!recs.abono.pauta) delete recs.abono.pauta;

    let fotoId = null;
    try {
      let blob = null;
      if (fotosExternas?.[p.id]) blob = await (await fetch(fotosExternas[p.id])).blob();
      else if (p.foto && !fotosExternas) blob = await fotoLocal(p.id);
      if (blob) { fotoId = await fotos.guardar(blob); conFoto++; }
    } catch { /* sin foto */ }

    const notas = [p.notas, p.origen ? `Origen: ${p.origen}` : ''].filter(Boolean).join('\n');
    nuevas.push({
      id: uid(), origenPlantitus: p.id,
      nombre: p.apodo || p.nombre || e?.nombre || 'Mi planta',
      especie: e?.id || null, cientifico: e?.cientifico || p.catalogo || '',
      sitio: sitioPorNombre(p.zona), notas, foto: fotoId,
      creada: p.desde || p.creada || hoy(),
      recordatorios: recs,
      historial: hist
        .filter((h) => h.fecha)
        .map((h) => (HIST[h.tipo]
          ? { id: uid(), fecha: h.fecha, tipo: HIST[h.tipo], nota: h.texto || '' }
          : { id: uid(), fecha: h.fecha, tipo: 'nota', nota: [h.tipo && h.tipo !== 'nota' ? h.tipo[0].toUpperCase() + h.tipo.slice(1) : '', h.texto].filter(Boolean).join(': ') }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    });
    n++;
  }
  datos.sitios = sitios;
  datos.plantas = [...nuevas, ...existentes];
  refrescarCatalogo();
  store.set('importadoPlantitus', hoy());
  return { n, conEspecie, conFoto, saltadas: col.plantas.length - n };
}
