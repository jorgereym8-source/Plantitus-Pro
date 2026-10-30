/* Arranque de Plantitus Pro. */
import { cargarCatalogo, $ } from './core.js';
import { pintar } from './ui.js';
import { aplicarTema } from './tema.js';
import './vistas/tareas.js';
import './vistas/diagnostico.js';
import './vistas/buscar.js';
import './vistas/herramientas.js';
import './vistas/plantas.js';
import './vistas/ajustes.js';

async function arrancar() {
  try { localStorage.removeItem('pp.ia'); } catch { /* claves del asistente, que ya no existe */ }
  aplicarTema();
  try {
    await cargarCatalogo();
  } catch (e) {
    $('#vista').innerHTML = '<div class="vacio"><p>No se pudo cargar el catálogo de plantas. Comprueba la conexión y vuelve a abrir la app.</p></div>';
    return;
  }
  window.addEventListener('hashchange', pintar);
  await pintar();
  document.body.classList.add('lista');
  setTimeout(() => $('#splash')?.remove(), 600);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
arrancar();
