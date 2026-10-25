# 🌿 Plantitus Pro

Web app para iPhone de cuidado de plantas, inspirada en **Plant Parent**: recordatorios de riego y abono, diagnóstico de enfermedades, identificación por foto, herramientas de jardinería y un catálogo de **530 especies** con 125 plantas canarias y 230 cactus y suculentas. Se aloja gratis en GitHub Pages.

**Abrir la app:** https://jorgereym8-source.github.io/Plantitus-Pro/

## Instalarla en el iPhone

1. Abre el enlace en **Safari**.
2. Pulsa **Compartir** → **Añadir a pantalla de inicio**.
3. Se abre a pantalla completa con su icono y funciona sin conexión (salvo el tiempo, las fotos nuevas de Wikipedia y el asistente).

## Pantallas

| Pestaña | Qué hace |
| --- | --- |
| **Tareas** | Tiempo de tu zona (Open-Meteo), semana con puntos en los días con tareas (se despliega a mes), tareas atrasadas y las del día agrupadas por tipo. Marcar, «Hecho todo», posponer o saltar. Si va a llover, ofrece dar por regadas las plantas de exterior. |
| **Diagnóstico** | Autodiagnóstico con foto (o describiendo síntomas) y guía de 45 problemas por partes: planta, hojas, tallos, flores, frutos y plagas, con remedios caseros enlazados. |
| **Encontrar planta** | Buscador, **Identificar** con foto, buscador de plantas por luz, sitio, dificultad y tipo, colecciones («Mejoran el sueño», «Flora canaria», «Seguras con mascotas»…) y la selección del mes. Corazón para favoritas. |
| **Herramientas** | Calculador de riego (ml y frecuencia según maceta, material y época), medidor de luz (cámara donde el navegador lo permite y prueba de la sombra), comprobación de cambio de maceta, qué hacer este mes, cursos de cuidados de tus plantas y remedios caseros. |
| **Mis plantas** | Tus plantas (foto, nombre, especie, sitio y riego) y tus **Sitios**. Cada ficha tiene cuidados, historial, guía de la especie y chat con el asistente. |

## Cómo se calculan los riegos

Cada especie tiene un intervalo de riego en temporada, otro en reposo y una marca por mes: normal, reposo o sin riego. Así, un *Aeonium* se riega en invierno y descansa en verano, y una *Lophophora* no se riega en invierno. El siguiente riego es el último anotado más el intervalo del mes; si cae en un mes sin riego, pasa al primer día del siguiente mes con riego. El abono funciona igual, en semanas y solo en los meses de abono. En cada planta puedes cambiar a una frecuencia fija.

## Asistente con IA: Gemini o Claude

En **Ajustes → Asistente con IA** eliges el proveedor y pegas la clave:

- **Gemini**: clave gratuita en [Google AI Studio](https://aistudio.google.com/apikey).
- **Claude**: clave de pago por uso en [console.anthropic.com](https://console.anthropic.com/settings/keys).

La clave se guarda **solo en el iPhone**, nunca en el repositorio (es público). Sirve para identificar plantas, diagnosticar, el chat de cada planta y crear fichas de especies nuevas. El botón **Probar** comprueba que la clave funciona.

## Ampliar el catálogo

Hay tres formas:

1. **Pídemelo.** Dime qué especies faltan y las añado al catálogo para todos tus dispositivos.
2. **Con IA, desde la app.** Ajustes → Mi catálogo → *Añadir con IA*: escribes el nombre y el asistente rellena la ficha (grupo, luz, riego por meses, abono, temperatura mínima, si es canaria o tóxica). También aparece al identificar una planta que no está en el catálogo.
3. **A mano.** Edita `tools/especies.py` (una línea por especie, con las instrucciones al principio del archivo) y ejecuta:
   ```
   python3 tools/especies.py
   ```

Las especies que añades desde la app se guardan en el iPhone y viajan en la copia de seguridad. *Exportar mis especies* las saca en un archivo para que yo las pase al catálogo fijo.

La guía de enfermedades se amplía igual en `tools/enfermedades.py` y los remedios, colecciones y selección del mes en `js/contenido.js`.

## Traer tus plantas de Plantitus

Las dos apps comparten dominio, así que en el mismo iPhone **Ajustes → Traer plantas de Plantitus** copia tu colección con fotos, zonas (como sitios), historial y tus pautas de riego y abono por meses. No duplica las plantas si lo repites. También acepta una copia de seguridad de Plantitus en *Importar*.

## Tus datos

Las plantas se guardan en el iPhone (`localStorage` y las fotos en IndexedDB). Haz de vez en cuando **Ajustes → Copia de seguridad → Exportar** y guarda el archivo en iCloud Drive. Una web no puede enviar notificaciones con la app cerrada, así que **Añadir tareas al Calendario** crea eventos con alarma para los próximos 60 días.

## Estructura

```
index.html, styles.css         La página y el diseño
js/main.js                     Arranque
js/core.js                     Datos, fechas, cálculo de tareas, fotos, Wikipedia, tiempo e IA
js/ui.js, js/iconos.js         Navegación, hojas, tarjetas e iconos
js/contenido.js                Tipos de tarea, colecciones, selección del mes, remedios
js/importar.js                 Importación desde Plantitus
js/vistas/                     Una pantalla por archivo
data/especies.json             Catálogo (lo genera tools/especies.py)
data/enfermedades.json         Guía de problemas (lo genera tools/enfermedades.py)
sw.js, manifest.webmanifest    Instalación y uso sin conexión
```

**Después de cualquier cambio** sube el número de `CACHE` en `sw.js` (`plantitus-pro-v2`, `v3`…) para que el iPhone descargue la versión nueva.

Las fotos de las especies vienen de Wikipedia. Probarla en el ordenador: `python3 -m http.server 8000` y abrir http://localhost:8000.
