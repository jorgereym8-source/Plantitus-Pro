# 🌿 Plantitus Pro

Web app para iPhone de cuidado de plantas, inspirada en **Plant Parent**: recordatorios de riego y abono, diagnóstico por síntomas, herramientas de jardinería, temas personalizables y un catálogo de **530 especies** con 125 plantas canarias y 230 cactus y suculentas. Se aloja gratis en GitHub Pages.

**Abrir la app:** https://jorgereym8-source.github.io/Plantitus-Pro/

## Instalarla en el iPhone

1. Abre el enlace en **Safari**.
2. Pulsa **Compartir** → **Añadir a pantalla de inicio**.
3. Se abre a pantalla completa con su icono y funciona sin conexión (salvo el tiempo y las fotos nuevas de las especies).

## Pantallas

| Pestaña | Qué hace |
| --- | --- |
| **Tareas** | Tiempo de tu zona (Open-Meteo), semana con puntos en los días con tareas (se despliega a mes), tareas atrasadas y las del día agrupadas por tipo. Marcar, «Hecho todo», posponer o saltar. Si va a llover, ofrece dar por regadas las plantas de exterior. |
| **Diagnóstico** | **Buscador por síntomas**: escribes lo que ves o marcas síntomas por partes (hojas, tallo, raíces y tierra, flores, frutos, planta entera), eliges la planta y lo que ha pasado (riego, frío, sol…), y ordena los problemas de más a menos probable. Guía de 82 problemas con cómo reconocerlo, por qué pasa, qué hacer, cómo evitarlo, con qué se confunde y remedios caseros. |
| **Encontrar planta** | Buscador, buscador de plantas por luz, sitio, dificultad y tipo, colecciones («Mejoran el sueño», «Flora canaria», «Seguras con mascotas»…) y la selección del mes. Corazón para favoritas. |
| **Herramientas** | Calculador de riego, medidor de luz, comprobación de maceta, qué hacer este mes, cursos de cuidados de tus plantas y remedios caseros. |
| **Mis plantas** | Tus plantas y tus **Sitios**. Cada ficha tiene cuidados, historial, guía de la especie y acceso directo al buscador por síntomas. |

## Cómo se calculan los riegos

Cada especie tiene un intervalo de riego en temporada, otro en reposo y una marca por mes: normal, reposo o sin riego. Así, un *Aeonium* se riega en invierno y descansa en verano, y una *Lophophora* no se riega en invierno. El siguiente riego es el último anotado más el intervalo del mes; si cae en un mes sin riego, pasa al primer día del siguiente mes con riego. El abono funciona igual, en semanas y solo en los meses de abono. En cada planta puedes cambiar a una frecuencia fija.

## Personalización

En **Ajustes**, cada bloque se despliega al tocarlo:

- **Tema**: 10 temas (Menta, Bosque, Océano, Lavanda, Desierto, Atardecer, Girasol, Volcán, Grafito y Minimal) y modo automático, claro u oscuro.
- **Colores**: botones, fondo, texto, tarjetas y cabecera, con muestras o cualquier color; y el degradado de arriba.
- **Fondo y transparencia**: foto de fondo con velo, translucidez de tarjetas y barras, y desenfoque.
- **Formas y letra**: esquinas rectas, suaves o muy redondas, y cuatro tamaños de letra.
- **Nombres de las especies**: común primero o científico primero en tarjetas, listas, fichas y tareas.

## Fotos de las especies

Cada especie se busca por su **nombre científico exacto en Wikidata**, solo entre registros con ficha botánica (IPNI o POWO), y se usa su foto de Wikimedia Commons. Si el nombre es un sinónimo, se usa la foto del nombre aceptado. Si una foto no es correcta, en la ficha de la especie el botón de la foto permite poner una tuya o quitarla.

## Ampliar el catálogo

1. **Pídemelo.** Dime qué especies faltan y las añado al catálogo para todos tus dispositivos.
2. **Desde la app.** Ajustes → Mi catálogo → *Añadir una especie*. Se guarda en el iPhone y viaja en la copia de seguridad. *Exportar mis especies* las saca en un archivo para pasarlas al catálogo fijo.
3. **A mano.** Edita `tools/especies.py` (una línea por especie, con las instrucciones al principio del archivo) y ejecuta `python3 tools/especies.py`.

La guía de problemas se amplía en `tools/enfermedades.py` (cada problema lleva sus síntomas, situaciones y tipos de planta; el script avisa si algo no existe) y se regenera con `python3 tools/enfermedades.py`. Los remedios, colecciones y selección del mes están en `js/contenido.js`.

## Traer tus plantas de Plantitus

Las dos apps comparten dominio, así que en el mismo iPhone **Ajustes → Traer plantas de Plantitus** copia tu colección con fotos, zonas (como sitios), historial y tus pautas de riego y abono por meses. No duplica las plantas si lo repites. También acepta una copia de seguridad de Plantitus en *Importar*.

## Tus datos

Las plantas y los ajustes se guardan en el iPhone (`localStorage` y las fotos en IndexedDB). Haz de vez en cuando **Ajustes → Copia de seguridad → Exportar** y guarda el archivo en iCloud Drive. Una web no puede enviar notificaciones con la app cerrada, así que **Añadir tareas al Calendario** crea eventos con alarma para los próximos 60 días.

## Estructura

```
index.html, styles.css         La página y el diseño
js/main.js                     Arranque
js/core.js                     Datos, fechas, cálculo de tareas, fotos de especies y tiempo
js/tema.js                     Temas y personalización
js/ui.js, js/iconos.js         Navegación, hojas, tarjetas e iconos
js/contenido.js                Tipos de tarea, colecciones, selección del mes, remedios
js/importar.js                 Importación desde Plantitus
js/vistas/                     Una pantalla por archivo
data/especies.json             Catálogo (lo genera tools/especies.py)
data/enfermedades.json         Guía de problemas (lo genera tools/enfermedades.py)
sw.js, manifest.webmanifest    Instalación y uso sin conexión
```

**Después de cualquier cambio** sube el número de `CACHE` en `sw.js` (`plantitus-pro-v2`, `v3`…) para que el iPhone descargue la versión nueva.

Probarla en el ordenador: `python3 -m http.server 8000` y abrir http://localhost:8000.
