#!/usr/bin/env python3
"""Catálogo de especies de Plantitus Pro.

Genera data/especies.json a partir de la lista ESPECIES de abajo.

Cada especie es una línea con campos separados por «|»:

    Nombre común | Nombre científico | grupo | luz | dificultad | etiquetas | ajustes

- grupo: una clave de GRUPOS (fija las pautas de riego, abono, sustrato…).
- luz: sombra · semi (luz indirecta / semisombra) · parcial (sol parcial) · sol (pleno sol).
- dificultad: F (fácil) · M (moderada) · D (difícil).
- etiquetas (separadas por comas, opcionales):
    end = endemismo canario · nat = nativa de Canarias · mac = macaronésica
    tox = tóxica para mascotas · aire = purifica el aire · sueno = ayuda a dormir
    sombra = aguanta poca luz · colg = colgante · flor = flor vistosa
    int = de interior · ext = de exterior · arom = aromática · com = comestible
    inv = invasora en Canarias (no plantar en el campo)
- ajustes (opcionales, separados por «;»): rv=7 (días entre riegos en temporada),
  ri=14 (días en reposo), meses=NNNRRRSSSNNN (enero→diciembre: N normal,
  R reposo, S sin riego), tmin=5 (ºC), fl=3-6 (meses de floración), hum=50.

Para añadir especies: escribe una línea nueva en ESPECIES y ejecuta
    python3 tools/especies.py
"""
import json
import pathlib
import re
import unicodedata

# ----------------------------------------------------------------------------
# Pautas por grupo
# meses: enero→diciembre. N = riego normal (cada rv días), R = reposo (cada ri
# días), S = sin riego. abono: semanas entre abonos y meses en que se abona.
# ----------------------------------------------------------------------------
GRUPOS = {
    "cactus": dict(
        nombre="Cactus", rv=14, ri=30, meses="RRNNNNNNNNRR", abono=4, abonoMeses="000111111000",
        tmin=5, hum=30, trasplante=3,
        sustrato="Mineral y muy drenante: 60-70 % pómice, picón fino o akadama y 30-40 % de turba o fibra de coco.",
        riegoTxt="Riego por inmersión o abundante hasta que drene, y no volver a regar hasta que el sustrato esté seco del todo.",
        poda="No necesita poda. Retira solo partes secas o podridas con un cuchillo limpio y deja cicatrizar.",
    ),
    "cactus_delicado": dict(
        nombre="Cactus de colección", rv=18, ri=0, meses="SSRNNNNNNRSS", abono=6, abonoMeses="000111100000",
        tmin=6, hum=25, trasplante=4,
        sustrato="Casi totalmente mineral (80-90 % pómice, picón y zeolita) con cuello de la planta en grava. Maceta honda si tiene raíz napiforme.",
        riegoTxt="Riegos espaciados y solo con calor. Muy sensible al exceso de agua: ante la duda, no regar. Sin riego en invierno.",
        poda="No se poda. Vigila el cuello: cualquier zona blanda indica pudrición.",
    ),
    "cactus_selva": dict(
        nombre="Cactus epífito", rv=7, ri=12, meses="NNNNNNNNNRRN", abono=3, abonoMeses="001111111000",
        tmin=10, hum=55, trasplante=2,
        sustrato="Ligero y ácido: corteza de pino, turba y perlita a partes iguales.",
        riegoTxt="Mantén el sustrato apenas húmedo; deja secar la capa superior entre riegos. Agradece pulverizaciones.",
        poda="Pinza o corta segmentos tras la floración para ramificar; los esquejes enraízan fácil.",
    ),
    "suculenta": dict(
        nombre="Suculenta", rv=10, ri=21, meses="RRNNNNNNNNNR", abono=4, abonoMeses="001111111000",
        tmin=4, hum=40, trasplante=2,
        sustrato="Sustrato para cactus con un 50 % de pómice o picón; maceta con agujero.",
        riegoTxt="Riega a fondo y espera a que se seque por completo. Mejor quedarse corto que pasarse.",
        poda="Retira hojas secas de la base. Si se estira, corta la roseta y replántala como esqueje.",
    ),
    "suculenta_invernal": dict(
        nombre="Suculenta de crecimiento invernal", rv=10, ri=25, meses="NNNNNRRRNNNN", abono=4, abonoMeses="110000000111",
        tmin=3, hum=45, trasplante=2,
        sustrato="Sustrato drenante con algo de materia orgánica: 50 % picón o pómice, 50 % sustrato universal.",
        riegoTxt="Crece de otoño a primavera: riégala entonces cuando se seque. En verano entra en reposo, cierra las rosetas y casi no bebe.",
        poda="Corta rosetas estiradas o que han florecido (la roseta que florece muere) y replanta los esquejes.",
    ),
    "tabaiba": dict(
        nombre="Tabaiba / euforbia canaria", rv=14, ri=30, meses="NNNNNRRRRNNN", abono=8, abonoMeses="110000000011",
        tmin=3, hum=40, trasplante=3,
        sustrato="Muy drenante, mineral: picón, tierra volcánica y algo de arena.",
        riegoTxt="Adaptada al clima canario: crece con las lluvias de otoño-invierno y en verano pierde las hojas y reposa. Riego escaso.",
        poda="Látex irritante: usa guantes y gafas. Poda ligera de formación a finales de verano.",
    ),
    "mesemb": dict(
        nombre="Piedra viva (aizoácea)", rv=14, ri=30, meses="SSSNNRRRNNNS", abono=0, abonoMeses="000000000000",
        tmin=5, hum=30, trasplante=4,
        sustrato="Mineral casi al 100 %: pómice, arena gruesa y un poco de turba.",
        riegoTxt="Ciclo muy marcado: sin riego mientras cambia de hojas (invierno-primavera) y riego ligero solo cuando las hojas viejas están secas del todo.",
        poda="No se poda. No retires las hojas viejas hasta que estén secas como papel.",
    ),
    "mesemb_invernal": dict(
        nombre="Aizoácea de invierno", rv=12, ri=0, meses="NNNNRSSSNNNN", abono=0, abonoMeses="000000000000",
        tmin=5, hum=35, trasplante=3,
        sustrato="Mineral y fino: pómice, arena y un poco de turba.",
        riegoTxt="Crece en otoño e invierno; en verano se seca y se protege dentro de una vaina: entonces, sin riego.",
        poda="No se poda.",
    ),
    "caudex": dict(
        nombre="Caudiciforme", rv=10, ri=0, meses="SSRNNNNNNNRS", abono=3, abonoMeses="000111111000",
        tmin=10, hum=35, trasplante=3,
        sustrato="Drenante con algo de orgánico: 60 % pómice, 40 % sustrato de cactus.",
        riegoTxt="Riego regular con calor y crecimiento. Cuando pierde las hojas en invierno, deja de regar.",
        poda="Poda de formación en primavera; el látex o savia puede ser tóxico.",
    ),
    "interior": dict(
        nombre="Planta de interior", rv=7, ri=12, meses="RRNNNNNNNNRR", abono=2, abonoMeses="001111111100",
        tmin=12, hum=50, trasplante=2,
        sustrato="Universal de calidad con un 20-30 % de perlita.",
        riegoTxt="Riega cuando los 2-3 cm de arriba estén secos y vacía el plato a los 15 minutos.",
        poda="Retira hojas amarillas y pinza puntas para que ramifique. Limpia el polvo de las hojas.",
    ),
    "tropical": dict(
        nombre="Tropical de humedad", rv=5, ri=8, meses="RRNNNNNNNNRR", abono=2, abonoMeses="001111111100",
        tmin=15, hum=65, trasplante=2,
        sustrato="Aireado y que retenga humedad: universal, fibra de coco, corteza y perlita.",
        riegoTxt="Mantén el sustrato ligeramente húmedo, nunca encharcado. Usa agua sin cal o reposada. Necesita ambiente húmedo.",
        poda="Corta hojas dañadas desde la base. Evita corrientes de aire y cambios bruscos.",
    ),
    "helecho": dict(
        nombre="Helecho", rv=4, ri=7, meses="RRNNNNNNNNRR", abono=4, abonoMeses="001111110000",
        tmin=10, hum=65, trasplante=2,
        sustrato="Rico y esponjoso: turba o coco, corteza fina y perlita.",
        riegoTxt="Sustrato siempre algo húmedo y humedad ambiental alta. No soporta secarse.",
        poda="Corta frondes secas a ras. Divide la mata al trasplantar.",
    ),
    "orquidea": dict(
        nombre="Orquídea", rv=7, ri=10, meses="NNNNNNNNNNNN", abono=2, abonoMeses="111111111111",
        tmin=15, hum=60, trasplante=2,
        sustrato="Corteza de pino de orquídeas (no tierra). Maceta transparente para ver las raíces.",
        riegoTxt="Riega por inmersión 10 minutos cuando las raíces estén plateadas; si están verdes, aún tiene agua. Escurre bien.",
        poda="Tras la floración corta la vara por encima del segundo nudo o en la base si se seca.",
    ),
    "bromelia": dict(
        nombre="Bromelia", rv=7, ri=12, meses="NNNNNNNNNNNN", abono=4, abonoMeses="001111110000",
        tmin=12, hum=55, trasplante=3,
        sustrato="Ligero y ácido: corteza, turba y perlita. Las Tillandsia no llevan sustrato.",
        riegoTxt="Mantén agua limpia en la roseta central y riega el sustrato con moderación. Cambia el agua del vaso cada 2 semanas.",
        poda="La roseta madre muere tras florecer; separa los hijuelos cuando midan un tercio de la madre.",
    ),
    "tillandsia": dict(
        nombre="Clavel del aire", rv=4, ri=7, meses="NNNNNNNNNNNN", abono=4, abonoMeses="001111110000",
        tmin=8, hum=60, trasplante=0,
        sustrato="Sin sustrato: sobre corteza, alambre o soporte.",
        riegoTxt="Sumérgela 20 minutos (o pulveriza mucho) y déjala boca abajo hasta que seque en menos de 4 horas.",
        poda="Retira hojas secas de la base.",
    ),
    "palmera": dict(
        nombre="Palmera", rv=7, ri=14, meses="RRNNNNNNNNRR", abono=4, abonoMeses="001111110000",
        tmin=8, hum=50, trasplante=3,
        sustrato="Universal con arena gruesa o picón para que drene.",
        riegoTxt="Riego regular en verano dejando secar la capa superior; menos en invierno.",
        poda="Corta solo hojas totalmente secas. No despuntes las hojas verdes.",
    ),
    "aromatica": dict(
        nombre="Aromática", rv=3, ri=7, meses="RRNNNNNNNNRR", abono=4, abonoMeses="001111110000",
        tmin=2, hum=45, trasplante=1,
        sustrato="Universal con un 30 % de arena o perlita.",
        riegoTxt="Las mediterráneas (romero, tomillo, lavanda) prefieren secarse entre riegos; albahaca, menta y perejil, sustrato siempre algo húmedo.",
        poda="Pinza o corta a menudo para que ramifique y retrasar la floración.",
    ),
    "huerto": dict(
        nombre="Huerto", rv=2, ri=4, meses="NNNNNNNNNNNN", abono=2, abonoMeses="011111111100",
        tmin=8, hum=55, trasplante=0,
        sustrato="Rico en materia orgánica: sustrato de huerto o universal con humus de lombriz.",
        riegoTxt="Riego frecuente y regular, sin mojar las hojas, a primera hora o al atardecer.",
        poda="Retira hojas bajas enfermas y los chupones (en tomatera).",
    ),
    "flor": dict(
        nombre="Flor de temporada", rv=3, ri=7, meses="RRNNNNNNNNRR", abono=2, abonoMeses="001111111000",
        tmin=5, hum=50, trasplante=1,
        sustrato="Universal o para flor, con algo de perlita.",
        riegoTxt="Riega cuando la superficie esté seca; en maceta y con calor puede necesitar agua a diario.",
        poda="Quita flores marchitas para que siga floreciendo.",
    ),
    "arbusto": dict(
        nombre="Arbusto", rv=7, ri=18, meses="RRNNNNNNNNRR", abono=6, abonoMeses="001111100000",
        tmin=2, hum=45, trasplante=3,
        sustrato="Universal con picón o arena. En suelo, bien drenado.",
        riegoTxt="En maceta riega cuando se seque la capa superior; plantado y ya asentado, riegos de apoyo solo en verano.",
        poda="Poda de limpieza y forma después de la floración.",
    ),
    "arbusto_canario": dict(
        nombre="Arbusto canario", rv=10, ri=21, meses="NNNNNRRRRNNN", abono=8, abonoMeses="110000000011",
        tmin=2, hum=45, trasplante=3,
        sustrato="Tierra de monte o universal con un 40 % de picón; nada de encharcamiento.",
        riegoTxt="Adaptado a lluvias de invierno y veranos secos: riego moderado en otoño-primavera y de apoyo en verano.",
        poda="Poda ligera tras la floración para mantenerlo compacto.",
    ),
    "arbol": dict(
        nombre="Árbol", rv=10, ri=25, meses="RRNNNNNNNNRR", abono=8, abonoMeses="001111000000",
        tmin=0, hum=45, trasplante=3,
        sustrato="Universal con arena gruesa; en maceta grande y honda.",
        riegoTxt="En maceta, riego profundo cuando se seque la parte superior. En suelo, solo los primeros años y en verano.",
        poda="Poda de formación en reposo; elimina ramas secas o cruzadas.",
    ),
    "carnivora": dict(
        nombre="Carnívora", rv=2, ri=4, meses="NNNNNNNNNNNN", abono=0, abonoMeses="000000000000",
        tmin=3, hum=70, trasplante=2,
        sustrato="Turba rubia sin abono con perlita o arena de sílice. Nunca sustrato universal.",
        riegoTxt="Solo agua destilada, de lluvia o de ósmosis. Mantén un plato con 1-2 cm de agua (excepto Nepenthes).",
        poda="No la abones ni le des carne. Corta trampas negras.",
    ),
    "trepadora": dict(
        nombre="Trepadora", rv=4, ri=10, meses="RRNNNNNNNNRR", abono=3, abonoMeses="001111110000",
        tmin=3, hum=50, trasplante=2,
        sustrato="Universal con algo de perlita o picón.",
        riegoTxt="Riego regular en crecimiento sin encharcar; menos en invierno.",
        poda="Guía los tallos y poda tras la floración para controlar el tamaño.",
    ),
    "bulbosa": dict(
        nombre="Bulbosa", rv=6, ri=0, meses="NNNNRSSSNNNN", abono=3, abonoMeses="011100000000",
        tmin=3, hum=50, trasplante=2,
        sustrato="Universal con arena; el bulbo nunca encharcado.",
        riegoTxt="Riega mientras tiene hojas. Cuando amarillean tras florecer, reduce y deja el bulbo en reposo seco.",
        poda="Corta la vara floral seca; deja que las hojas se sequen solas para alimentar el bulbo.",
    ),
}

LUZ = {
    "sombra": "Sombra",
    "semi": "Luz indirecta",
    "parcial": "Sol parcial",
    "sol": "Pleno sol",
}
DIF = {"F": "Fácil", "M": "Moderada", "D": "Difícil"}

# ----------------------------------------------------------------------------
# Especies
# ----------------------------------------------------------------------------
ESPECIES = """
# ===== Flora canaria: suculentas =====
Cardón|Euphorbia canariensis|tabaiba|sol|F|end,tox,ext
Tabaiba dulce|Euphorbia balsamifera|tabaiba|sol|F|nat,tox,ext
Tabaiba amarga|Euphorbia lamarckii|tabaiba|sol|F|end,tox,ext
Tabaiba majorera|Euphorbia regis-jubae|tabaiba|sol|F|mac,tox,ext
Tabaiba roja|Euphorbia atropurpurea|tabaiba|sol|M|end,tox,ext,flor|fl=1-4
Tabaiba de Bravo|Euphorbia bravoana|tabaiba|sol|M|end,tox,ext
Cardón de Jandía|Euphorbia handiensis|tabaiba|sol|M|end,tox,ext
Tolda|Euphorbia aphylla|tabaiba|sol|F|end,tox,ext
Tabaiba de monte|Euphorbia mellifera|arbusto_canario|parcial|M|mac,tox,ext,flor|fl=3-5
Tabaiba de Berthelot|Euphorbia berthelotii|tabaiba|sol|M|end,tox,ext
Bejeque arbóreo|Aeonium arboreum|suculenta_invernal|sol|F|ext,flor|fl=1-3
Bejeque canario|Aeonium canariense|suculenta_invernal|parcial|F|end,ext,flor|fl=3-6
Bejeque de tejado|Aeonium urbicum|suculenta_invernal|sol|F|end,ext
Bejeque sanjorge|Aeonium tabuliforme|suculenta_invernal|parcial|M|end,ext
Bejeque de Haworth|Aeonium haworthii|suculenta_invernal|sol|F|end,ext,flor|fl=3-5
Bejeque ciliado|Aeonium ciliatum|suculenta_invernal|parcial|F|end,ext
Bejeque de Lindley|Aeonium lindleyi|suculenta_invernal|parcial|F|end,ext
Bejeque dorado|Aeonium holochrysum|suculenta_invernal|sol|F|end,ext,flor|fl=2-4
Bejeque rosado|Aeonium percarneum|suculenta_invernal|sol|F|end,ext
Bejeque ondulado|Aeonium undulatum|suculenta_invernal|parcial|F|end,ext
Bejeque rojo|Aeonium nobile|suculenta_invernal|sol|M|end,ext,flor|fl=5-7
Bejeque espatulado|Aeonium spathulatum|suculenta_invernal|sol|F|end,ext
Bejeque de Smith|Aeonium smithii|suculenta_invernal|parcial|M|end,ext
Bejeque de hoja fina|Aeonium sedifolium|suculenta_invernal|sol|F|end,ext
Bejeque de Gooch|Aeonium goochiae|suculenta_invernal|parcial|F|end,ext
Bejeque de Sims|Aeonium simsii|suculenta_invernal|parcial|F|end,ext
Bejeque balsámico|Aeonium balsamiferum|suculenta_invernal|sol|F|end,ext
Bejeque decorado|Aeonium decorum|suculenta_invernal|sol|F|end,ext
Bejeque gomero|Aeonium gomerense|suculenta_invernal|parcial|M|end,ext
Bejeque de Castello Paiva|Aeonium castello-paivae|suculenta_invernal|parcial|F|end,ext
Bejeque herreño|Aeonium valverdense|suculenta_invernal|sol|M|end,ext
Bejeque de El Hierro|Aeonium hierrense|suculenta_invernal|parcial|M|end,ext
Bejeque de Bramwell|Aeonium davidbramwellii|suculenta_invernal|parcial|M|end,ext
Bejeque rosa dorada|Aeonium aureum|suculenta_invernal|parcial|M|end,ext
Bejeque rosa de monte|Aeonium dodrantale|suculenta_invernal|semi|M|end,ext
Aeonium negro|Aeonium arboreum 'Zwartkop'|suculenta_invernal|sol|F|ext
Gongarillo|Aichryson laxum|suculenta_invernal|semi|F|end,ext
Pastel de risco|Monanthes polyphylla|suculenta_invernal|semi|M|end,ext
Pastel de risco laxo|Monanthes laxiflora|suculenta_invernal|semi|M|end,ext
Pastel de risco de tallo corto|Monanthes brachycaulos|suculenta_invernal|semi|M|end,ext
Verode|Kleinia neriifolia|tabaiba|sol|F|end,ext
Cardoncillo gris|Ceropegia fusca|tabaiba|sol|M|end,ext
Cardoncillo|Ceropegia dichotoma|tabaiba|sol|M|end,ext
Cardoncillo de Tenerife|Ceropegia hians|tabaiba|sol|M|end,ext
Mataperros|Caralluma burchardii|suculenta|sol|M|mac,ext,flor|fl=9-12
Lechuga de mar|Astydamia latifolia|suculenta_invernal|sol|M|end,ext
Uva de mar|Tetraena fontanesii|suculenta|sol|M|nat,ext
Barrilla|Mesembryanthemum crystallinum|mesemb_invernal|sol|F|nat,ext,com
Cosco|Mesembryanthemum nodiflorum|mesemb_invernal|sol|F|nat,ext
Patilla|Aizoon canariense|suculenta|sol|F|nat,ext
Siempreviva de mar|Limonium pectinatum|arbusto_canario|sol|F|end,ext,flor|fl=3-7
Siempreviva|Limonium perezii|arbusto_canario|sol|F|end,ext,flor|fl=3-8
Siempreviva gigante|Limonium macrophyllum|arbusto_canario|sol|M|end,ext,flor|fl=3-7
Siempreviva arbórea|Limonium arborescens|arbusto_canario|sol|M|end,ext,flor|fl=3-7
Tunera india|Opuntia ficus-indica|cactus|sol|F|ext,com,inv
Tunera de Dillen|Opuntia dillenii|cactus|sol|F|ext,inv
Pita|Agave americana|suculenta|sol|F|ext,tox,inv
Sábila|Aloe vera|suculenta|sol|F|tox,aire,sueno,ext,int
# ===== Flora canaria: árboles, arbustos y herbáceas =====
Drago|Dracaena draco|arbol|sol|F|mac,ext
Drago de Gran Canaria|Dracaena tamaranae|arbol|sol|M|end,ext
Palmera canaria|Phoenix canariensis|palmera|sol|F|end,ext
Pino canario|Pinus canariensis|arbol|sol|F|end,ext
Sabina canaria|Juniperus turbinata subsp. canariensis|arbol|sol|M|mac,ext
Laurel canario|Laurus novocanariensis|arbol|parcial|F|mac,ext,arom
Acebiño|Ilex canariensis|arbol|parcial|M|mac,ext
Viñátigo|Persea indica|arbol|semi|M|mac,ext
Barbusano|Apollonias barbujana|arbol|parcial|M|mac,ext
Mocán|Visnea mocanera|arbol|parcial|M|mac,ext
Madroño canario|Arbutus canariensis|arbol|parcial|M|end,ext,flor|fl=3-6
Faya|Morella faya|arbol|parcial|F|mac,ext
Brezo|Erica arborea|arbusto|parcial|F|nat,ext
Saúco canario|Sambucus palmensis|arbusto_canario|semi|D|end,ext
Almácigo|Pistacia atlantica|arbol|sol|M|nat,ext
Acebuche|Olea cerasiformis|arbol|sol|F|mac,ext
Palo blanco|Picconia excelsa|arbol|parcial|M|mac,ext
Tajinaste rojo|Echium wildpretii|arbusto_canario|sol|D|end,tox,ext,flor|fl=5-6
Tajinaste blanco|Echium simplex|arbusto_canario|parcial|M|end,tox,ext,flor|fl=4-6
Tajinaste de Gran Canaria|Echium decaisnei|arbusto_canario|sol|F|end,tox,ext,flor|fl=2-5
Tajinaste azul|Echium virescens|arbusto_canario|sol|F|end,tox,ext,flor|fl=3-6
Tajinaste picante|Echium aculeatum|arbusto_canario|sol|F|end,tox,ext,flor|fl=3-6
Tajinaste gigante|Echium pininana|arbusto_canario|parcial|M|end,tox,ext,flor|fl=4-7
Tajinaste de Webb|Echium webbii|arbusto_canario|sol|M|end,tox,ext,flor|fl=3-6
Tajinaste de Madeira|Echium candicans|arbusto_canario|sol|F|mac,tox,ext,flor|fl=3-6
Retama del Teide|Spartocytisus supranubius|arbusto_canario|sol|D|end,ext,flor|fl=5-6
Retama blanca|Retama rhodorhizoides|arbusto_canario|sol|F|end,ext,flor|fl=1-4
Gacia|Teline canariensis|arbusto_canario|parcial|F|end,ext,flor|fl=2-5
Codeso de monte|Adenocarpus foliolosus|arbusto_canario|sol|F|end,ext,flor|fl=3-6
Pico de paloma|Lotus berthelotii|arbusto_canario|sol|M|end,ext,colg,flor|fl=3-6
Pico de paloma amarillo|Lotus maculatus|arbusto_canario|sol|D|end,ext,colg,flor|fl=3-6
Magarza|Argyranthemum frutescens|arbusto_canario|sol|F|end,ext,flor|fl=1-12
Magarza de Anaga|Argyranthemum broussonetii|arbusto_canario|parcial|F|end,ext,flor|fl=2-6
Magarza amarilla|Argyranthemum adauctum|arbusto_canario|sol|F|end,ext,flor|fl=2-6
Bicácaro|Canarina canariensis|trepadora|semi|M|end,ext,flor,com|fl=11-3;meses=NNNNRSSSRNNN;ri=0
Cresta de gallo|Isoplexis canariensis|arbusto_canario|semi|M|end,tox,ext,flor|fl=5-8
Cresta de gallo de Gran Canaria|Isoplexis isabelliana|arbusto_canario|semi|D|end,tox,ext,flor|fl=5-8
Jara canaria|Cistus symphytifolius|arbusto_canario|sol|F|end,ext,flor|fl=3-6
Jaguarzo|Cistus monspeliensis|arbusto_canario|sol|F|nat,ext,flor|fl=3-5
Corregüela de risco|Convolvulus floridus|arbusto_canario|sol|F|end,ext,flor|fl=3-7
Guaydil|Convolvulus scoparius|arbusto_canario|sol|M|end,ext,flor|fl=3-6
Vinagrera|Rumex lunaria|arbusto_canario|sol|F|end,ext,com
Salvia canaria|Salvia canariensis|arbusto_canario|sol|F|end,ext,arom,flor|fl=3-7
Lavanda canaria|Lavandula canariensis|aromatica|sol|F|end,ext,arom,flor|fl=1-12
Lavanda de hoja partida|Lavandula buchii|aromatica|sol|M|end,ext,arom,flor|fl=1-6
Tomillo de burro|Micromeria varia|aromatica|sol|F|end,ext,arom
Poleo de monte|Bystropogon origanifolius|aromatica|parcial|F|end,ext,arom
Chajorra|Sideritis macrostachys|arbusto_canario|parcial|M|end,ext,arom
Ruda canaria|Ruta pinnata|arbusto_canario|sol|M|end,tox,ext
Orobal|Withania aristata|arbusto_canario|sol|F|end,tox,ext
Malfurada|Hypericum grandifolium|arbusto_canario|semi|F|mac,ext,flor|fl=4-8
Granadillo|Hypericum canariense|arbusto_canario|sol|F|end,ext,flor|fl=3-7
Cineraria canaria|Pericallis cruenta|flor|semi|F|end,ext,flor|fl=1-5
Flor de mayo|Pericallis tussilaginis|flor|semi|F|end,ext,flor|fl=3-6
Cineraria de florista|Pericallis x hybrida|flor|semi|F|ext,int,flor|fl=12-4
Cerraja de risco|Sonchus acaulis|arbusto_canario|sol|M|end,ext,flor|fl=3-6
Balo|Plocama pendula|arbusto_canario|sol|F|end,ext,colg
Aulaga|Launaea arborescens|arbusto_canario|sol|F|nat,ext
Salado|Schizogyne sericea|arbusto_canario|sol|F|mac,ext
Romero marino|Campylanthus salsoloides|arbusto_canario|sol|M|end,ext,flor|fl=1-5
Leña buena|Neochamaelea pulverulenta|arbusto_canario|sol|M|end,ext
Esparraguera canaria|Asparagus umbellatus|trepadora|parcial|M|mac,ext
Malva de risco|Lavatera acerifolia|arbusto_canario|sol|F|end,ext,flor|fl=1-6
Rosalito de cumbre|Bencomia caudata|arbusto_canario|parcial|D|mac,ext
Siempreviva amarilla|Helichrysum gossypinum|arbusto_canario|sol|M|end,ext
Turmero|Helianthemum canariense|arbusto_canario|sol|M|mac,ext,flor|fl=2-5
Tasaigo|Rubia fruticosa|arbusto_canario|sol|F|mac,ext
Cabezón|Cheirolophus canariensis|arbusto_canario|sol|M|end,ext,flor|fl=4-7
Cardo de plata|Carlina salicifolia|arbusto_canario|sol|F|mac,ext,flor|fl=5-8
Col de risco|Crambe strigosa|arbusto_canario|semi|M|end,ext
Pegamosca|Aichryson pachycaulon|suculenta_invernal|semi|M|end,ext
Helecho de cinco dedos|Adiantum reniforme|helecho|semi|D|mac,ext
Helecho real|Woodwardia radicans|helecho|sombra|M|nat,ext
Culantrillo de pozo|Adiantum capillus-veneris|helecho|sombra|M|nat,int,ext
Batatilla|Ipomoea batatas|trepadora|sol|F|ext,int,com
# ===== Cactus =====
Biznaga de Hahn|Mammillaria hahniana|cactus|sol|F|flor|fl=3-5
Biznaga de espinas blancas|Mammillaria geminispina|cactus|sol|F|flor|fl=3-5
Biznaga pluma|Mammillaria plumosa|cactus|sol|M|flor|fl=12-2
Biznaga elongada|Mammillaria elongata|cactus|sol|F|flor|fl=3-5
Biznaga de Bocas|Mammillaria bocasana|cactus|sol|F|flor|fl=3-5
Biznaga espinosa|Mammillaria spinosissima|cactus|sol|F|flor|fl=3-5
Biznaga de Gaumer|Mammillaria gracilis|cactus|sol|F|flor|fl=3-5
Biznaga de Schiede|Mammillaria schiedeana|cactus|sol|M|flor|fl=9-11
Biznaga de Theresa|Mammillaria theresae|cactus_delicado|sol|D|flor|fl=4-6
Biznaga partida diente de elefante|Coryphantha elephantidens|cactus|sol|M|flor|fl=8-10
Biznaga partida|Coryphantha cornifera|cactus|sol|M|flor|fl=7-9
Asiento de suegra|Echinocactus grusonii|cactus|sol|F|ext,int,flor|fl=5-7
Asiento de suegra sin espinas|Echinocactus grusonii var. brevispinus|cactus|sol|F|ext,int
Ferocactus latispinus|Ferocactus latispinus|cactus|sol|F|flor|fl=10-12
Biznaga barril de Wislizenus|Ferocactus wislizeni|cactus|sol|F|ext,flor|fl=7-9
Biznaga barril roja|Ferocactus pilosus|cactus|sol|F|ext,flor|fl=3-5
Estrella de mar|Astrophytum asterias|cactus_delicado|parcial|D|flor|fl=5-8
Bonete de obispo|Astrophytum myriostigma|cactus_delicado|sol|M|flor|fl=5-9
Astrofito ornado|Astrophytum ornatum|cactus|sol|M|flor|fl=6-8
Astrofito cuerno de cabra|Astrophytum capricorne|cactus_delicado|sol|D|flor|fl=6-8
Copiapoa cinerea|Copiapoa cinerea|cactus_delicado|sol|D|flor|fl=6-8
Copiapoa echinoides|Copiapoa echinoides|cactus_delicado|sol|D|flor|fl=6-8
Copiapoa haseltoniana|Copiapoa cinerea subsp. haseltoniana|cactus_delicado|sol|M|flor|fl=6-8
Copiapoa hypogaea|Copiapoa hypogaea|cactus_delicado|parcial|D|flor|fl=5-7
Copiapoa tenuissima|Copiapoa tenuissima|cactus_delicado|parcial|M|flor|fl=5-7
Peyote|Lophophora williamsii|cactus_delicado|parcial|D|flor|fl=4-9
Peyote de Fric|Lophophora fricii|cactus_delicado|parcial|D|flor|fl=4-9
Peyote cimarrón|Ariocarpus fissuratus|cactus_delicado|sol|D|flor|fl=9-11
Ariocarpus retusus|Ariocarpus retusus|cactus_delicado|sol|D|flor|fl=9-11
Cactus luna|Gymnocalycium mihanovichii|cactus|semi|F|flor|fl=5-7
Gymnocalycium friedrichii|Gymnocalycium friedrichii|cactus|parcial|M|flor|fl=5-7
Gymnocalycium baldianum|Gymnocalycium baldianum|cactus|parcial|F|flor|fl=5-7
Gymnocalycium saglionis|Gymnocalycium saglionis|cactus|sol|F|flor|fl=5-7
Tephrocactus geométrico|Tephrocactus geometricus|cactus_delicado|sol|D|
Piña de pino|Tephrocactus articulatus|cactus|sol|F|ext
Matucana madisoniorum|Matucana madisoniorum|cactus_delicado|sol|D|flor|fl=6-8
Balón dorado|Parodia lenninghausii|cactus|sol|F|flor|fl=6-8
Parodia werneri|Parodia werneri|cactus|parcial|M|flor|fl=4-6
Parodia magnifica|Parodia magnifica|cactus|sol|F|flor|fl=5-7
Bola de nieve|Parodia haselbergii|cactus|sol|M|flor|fl=2-4
Cactus erizo|Echinopsis oxygona|cactus|sol|F|flor|fl=5-7
Cactus cacahuete|Echinopsis chamaecereus|cactus|sol|F|flor|fl=4-6
Rebutia|Rebutia minuscula|cactus|sol|F|flor|fl=3-5
Sulcorebutia|Sulcorebutia rauschii|cactus|sol|M|flor|fl=4-6
Antorcha plateada|Cleistocactus strausii|cactus|sol|F|ext,flor|fl=6-8
Cactus de Perú|Cereus peruvianus|cactus|sol|F|ext,int
Cactus monstruoso|Cereus peruvianus 'Monstrose'|cactus|sol|F|ext,int
Cactus viejo del Perú|Espostoa lanata|cactus|sol|M|ext
Cabeza de viejo|Cephalocereus senilis|cactus|sol|M|ext
Cactus azul|Pilosocereus azureus|cactus|sol|M|ext
Garambullo|Myrtillocactus geometrizans|cactus|sol|F|ext
Órgano|Pachycereus marginatus|cactus|sol|F|ext
Cardón gigante|Pachycereus pringlei|cactus|sol|F|ext
Saguaro|Carnegiea gigantea|cactus_delicado|sol|D|ext
Pitaya|Selenicereus undatus|cactus_selva|parcial|F|ext,com,flor|fl=6-9;tmin=8
Melocactus|Melocactus matanzanus|cactus_delicado|sol|M|flor;tmin=12
Discocactus|Discocactus horstii|cactus_delicado|sol|D|flor;tmin=12
Frailea|Frailea castanea|cactus_delicado|parcial|M|flor
Strombocactus|Strombocactus disciformis|cactus_delicado|sol|D|flor
Turbinicarpus|Turbinicarpus pseudomacrochele|cactus_delicado|sol|D|flor|fl=2-4
Echinocereus pectinatus|Echinocereus pectinatus|cactus|sol|M|flor|fl=4-6
Echinocereus rigidissimus|Echinocereus rigidissimus|cactus|sol|M|flor|fl=4-6
Thelocactus|Thelocactus bicolor|cactus|sol|M|flor|fl=4-7
Stenocactus|Stenocactus multicostatus|cactus|sol|M|flor|fl=2-4
Leuchtenbergia|Leuchtenbergia principis|cactus|sol|M|flor|fl=6-8
Nopal cegador|Opuntia microdasys|cactus|sol|F|int,ext
Opuntia monacantha|Opuntia monacantha|cactus|sol|F|ext,inv
Orejas de ratón|Opuntia microdasys var. albispina|cactus|sol|F|int
Cylindropuntia|Cylindropuntia imbricata|cactus|sol|F|ext,inv
Cola de rata|Disocactus flagelliformis|cactus_selva|parcial|F|colg,flor|fl=3-5
Cactus de Navidad|Schlumbergera truncata|cactus_selva|semi|F|int,flor,colg|fl=11-1;meses=NNNNNNNNRRNN
Cactus de Pascua|Hatiora gaertneri|cactus_selva|semi|M|int,flor|fl=3-5
Rhipsalis|Rhipsalis baccifera|cactus_selva|semi|F|int,colg
Rhipsalis cereuscula|Rhipsalis cereuscula|cactus_selva|semi|F|int,colg
Dama de noche|Epiphyllum oxypetalum|cactus_selva|semi|F|int,flor|fl=6-9
Cactus orquídea|Epiphyllum x hybridum|cactus_selva|semi|F|int,flor|fl=4-6
Cactus zig-zag|Disocactus anguliger|cactus_selva|semi|F|int,colg
# ===== Suculentas =====
Pseudolithos migiurtinus|Pseudolithos migiurtinus|cactus_delicado|parcial|D|;tmin=15
Fenestraria|Fenestraria rhopalophylla|mesemb|sol|M|
Piedras vivas|Lithops lesliei|mesemb|sol|M|flor|fl=9-11
Lithops karasmontana|Lithops karasmontana|mesemb|sol|M|flor|fl=9-11
Conophytum|Conophytum calculus|mesemb_invernal|parcial|M|flor|fl=9-11
Conophytum burgeri|Conophytum burgeri|mesemb_invernal|parcial|D|flor|fl=9-11
Piedra partida|Pleiospilos nelii|mesemb|sol|M|flor|fl=9-11
Mandíbula de tigre|Faucaria tigrina|suculenta|sol|F|flor|fl=9-11
Titanopsis|Titanopsis calcarea|mesemb|sol|M|flor
Argyroderma|Argyroderma delaetii|mesemb_invernal|sol|D|flor
Uña de gato|Carpobrotus edulis|suculenta|sol|F|ext,inv,flor|fl=3-6
Rocío|Aptenia cordifolia|suculenta|sol|F|ext,colg,flor|fl=3-10
Delosperma|Delosperma cooperi|suculenta|sol|F|ext,flor|fl=4-9
Lampranthus|Lampranthus spectabilis|suculenta|sol|F|ext,flor|fl=3-6
Euphorbia obesa|Euphorbia obesa|cactus_delicado|sol|M|tox
Euphorbia tubiglans|Euphorbia tubiglans|suculenta|sol|M|tox
Euphorbia horrida|Euphorbia horrida|suculenta|sol|F|tox
Euphorbia meloformis|Euphorbia meloformis|suculenta|sol|M|tox
Euphorbia enopla|Euphorbia enopla|suculenta|sol|F|tox
Corona de espinas|Euphorbia milii|suculenta|sol|F|tox,int,ext,flor|fl=1-12;tmin=10
Cactus catedral|Euphorbia trigona|suculenta|parcial|F|tox,int
Lápiz de fuego|Euphorbia tirucalli|suculenta|sol|F|tox,ext,int
Candelabro africano|Euphorbia ingens|suculenta|sol|F|tox,ext
Euphorbia lactea|Euphorbia lactea 'Cristata'|suculenta|parcial|M|tox,int;tmin=10
Flor de Pascua|Euphorbia pulcherrima|interior|semi|M|tox,int,flor|fl=11-1;tmin=13
Rosa del desierto|Adenium obesum|caudex|sol|M|tox,flor|fl=4-9;tmin=12
Palma de Madagascar|Pachypodium lamerei|caudex|sol|F|tox;tmin=12
Pachypodium rosulatum|Pachypodium rosulatum|caudex|sol|M|tox,flor;tmin=12
Cyphostemma|Cyphostemma juttae|caudex|sol|M|
Pata de elefante|Beaucarnea recurvata|suculenta|sol|F|int,ext
Pie de elefante|Dioscorea elephantipes|mesemb_invernal|parcial|D|
Bowiea|Bowiea volubilis|mesemb_invernal|semi|M|tox,colg
Fockea|Fockea edulis|caudex|sol|M|
Othonna|Othonna capensis|suculenta_invernal|sol|F|colg
Tylecodon|Tylecodon paniculatus|mesemb_invernal|sol|M|tox
Árbol de jade|Crassula ovata|suculenta|sol|F|tox,int,ext,flor|fl=11-1
Gollum|Crassula ovata 'Gollum'|suculenta|sol|F|tox,int
Collar de botones|Crassula perforata|suculenta|sol|F|int,colg
Crassula muscosa|Crassula muscosa|suculenta|parcial|F|int
Crassula capitella|Crassula capitella|suculenta|sol|F|int,ext
Crassula arborescens|Crassula arborescens|suculenta|sol|F|ext
Echeveria elegans|Echeveria elegans|suculenta|sol|F|ext,int,flor|fl=3-6
Echeveria Perle von Nürnberg|Echeveria 'Perle von Nürnberg'|suculenta|sol|F|ext,int
Echeveria agavoides|Echeveria agavoides|suculenta|sol|F|ext
Echeveria pulvinata|Echeveria pulvinata|suculenta|sol|F|ext,flor
Echeveria lilacina|Echeveria lilacina|suculenta|sol|F|ext
Echeveria setosa|Echeveria setosa|suculenta|sol|M|ext,flor
Echeveria laui|Echeveria laui|suculenta|sol|D|ext
Planta fantasma|Graptopetalum paraguayense|suculenta|sol|F|ext,colg
Graptoveria|x Graptoveria 'Opalina'|suculenta|sol|F|ext
Pachyphytum|Pachyphytum oviferum|suculenta|sol|F|
Cola de burro|Sedum morganianum|suculenta|parcial|F|colg,int
Sedum rubrotinctum|Sedum rubrotinctum|suculenta|sol|F|ext
Sedum palmeri|Sedum palmeri|suculenta|sol|F|ext,flor
Uva de gato|Sedum album|suculenta|sol|F|ext
Siempreviva mayor|Sempervivum tectorum|suculenta|sol|F|ext
Siempreviva telaraña|Sempervivum arachnoideum|suculenta|sol|F|ext
Dudleya|Dudleya brittonii|suculenta_invernal|sol|M|ext
Calanchoe|Kalanchoe blossfeldiana|suculenta|parcial|F|tox,int,flor|fl=12-4
Orejas de gato|Kalanchoe tomentosa|suculenta|sol|F|tox,int
Aranto|Kalanchoe daigremontiana|suculenta|sol|F|tox,inv
Kalanchoe luciae|Kalanchoe luciae|suculenta|sol|F|tox,ext
Kalanchoe thyrsiflora|Kalanchoe thyrsiflora|suculenta|sol|F|tox,ext
Campanilla de Navidad|Kalanchoe uniflora|suculenta|semi|F|tox,colg,flor|fl=12-3
Ombligo de Venus de Sudáfrica|Cotyledon orbiculata|suculenta|sol|F|tox,ext
Pata de oso|Cotyledon tomentosa|suculenta|sol|M|tox
Rosario|Curio rowleyanus|suculenta|semi|M|tox,int,colg
Senecio azul|Curio repens|suculenta|sol|F|tox,ext
Collar de delfines|Curio peregrinus|suculenta|semi|M|tox,int,colg
Senecio candicans|Senecio candicans 'Angel Wings'|suculenta|sol|M|ext
Árbol de la abundancia|Portulacaria afra|suculenta|sol|F|ext,int
Corazones enredados|Ceropegia woodii|suculenta|semi|F|int,colg
Stapelia|Stapelia gigantea|suculenta|parcial|F|flor|fl=8-10
Huernia|Huernia zebrina|suculenta|parcial|M|flor|fl=7-9
Orbea|Orbea variegata|suculenta|parcial|F|flor|fl=7-10
Haworthia cebra|Haworthiopsis attenuata|suculenta|semi|F|int
Haworthia cooperi|Haworthia cooperi|suculenta|semi|F|int
Haworthia truncata|Haworthia truncata|suculenta|semi|M|int
Haworthia retusa|Haworthia retusa|suculenta|semi|F|int
Haworthia limifolia|Haworthiopsis limifolia|suculenta|semi|F|int
Gasteria|Gasteria carinata|suculenta|semi|F|int
Gasteria lengua de buey|Gasteria bicolor|suculenta|semi|F|int
Aloe aristata|Aristaloe aristata|suculenta|sol|F|ext,int
Aloe polyphylla|Aloe polyphylla|suculenta|parcial|D|ext
Aloe juvenna|Aloe juvenna|suculenta|sol|F|ext,int
Aloe arborescens|Aloe arborescens|suculenta|sol|F|tox,ext,flor|fl=12-2
Aloe ferox|Aloe ferox|suculenta|sol|F|ext,flor|fl=6-9
Aloe variegata|Gonialoe variegata|suculenta|sol|F|int,ext
Agave de la reina Victoria|Agave victoriae-reginae|suculenta|sol|F|ext
Agave atenuada|Agave attenuata|suculenta|parcial|F|ext
Agave de Parry|Agave parryi|suculenta|sol|F|ext
Agave potatorum|Agave potatorum|suculenta|sol|F|ext
Agave filifera|Agave filifera|suculenta|sol|F|ext
Yuca pie de elefante|Yucca gigantea|arbusto|sol|F|int,ext
Lengua de suegra|Dracaena trifasciata|suculenta|semi|F|tox,aire,sueno,sombra,int
Sansevieria cilíndrica|Dracaena angolensis|suculenta|semi|F|tox,aire,int
Sansevieria Hahnii|Dracaena trifasciata 'Hahnii'|suculenta|semi|F|tox,aire,sombra,int
Planta ZZ|Zamioculcas zamiifolia|suculenta|semi|F|tox,aire,sombra,int
Dorstenia|Dorstenia foetida|caudex|parcial|M|
Ocotillo|Fouquieria splendens|caudex|sol|D|ext
Trichodiadema|Trichodiadema densum|suculenta|sol|M|flor
Portulaca|Portulaca grandiflora|flor|sol|F|ext,flor|fl=5-10
Verdolaga|Portulaca oleracea|huerto|sol|F|ext,com
# ===== Interior =====
Costilla de Adán|Monstera deliciosa|interior|semi|F|tox,aire,int
Monstera adansonii|Monstera adansonii|interior|semi|F|tox,int,colg
Poto|Epipremnum aureum|interior|semi|F|tox,aire,sombra,int,colg
Poto satinado|Scindapsus pictus|interior|semi|F|tox,int,colg
Filodendro trepador|Philodendron hederaceum|interior|semi|F|tox,aire,sombra,int,colg
Filodendro Birkin|Philodendron 'Birkin'|interior|semi|M|tox,int
Filodendro selloum|Thaumatophyllum bipinnatifidum|interior|semi|F|tox,int,ext
Filodendro Xanadu|Thaumatophyllum xanadu|interior|semi|F|tox,int
Espatifilo|Spathiphyllum wallisii|interior|sombra|F|tox,aire,sueno,sombra,int,flor|fl=3-9
Cinta|Chlorophytum comosum|interior|semi|F|aire,sueno,int,colg
Ficus lira|Ficus lyrata|interior|semi|M|tox,int
Ficus elástica|Ficus elastica|interior|semi|F|tox,aire,int
Ficus benjamina|Ficus benjamina|interior|semi|M|tox,aire,int
Ficus Ginseng|Ficus microcarpa|interior|semi|M|tox,int
Ficus trepador|Ficus pumila|trepadora|semi|F|tox,int,colg
Calathea orbifolia|Goeppertia orbifolia|tropical|semi|D|int,sombra
Calathea pavo real|Goeppertia makoyana|tropical|semi|M|int,sombra
Calathea zebrina|Goeppertia zebrina|tropical|semi|M|int,sombra
Calathea lancifolia|Goeppertia insignis|tropical|semi|M|int,sombra
Calathea ornata|Goeppertia ornata|tropical|semi|D|int,sombra
Planta de la oración|Maranta leuconeura|tropical|semi|M|int,sombra
Ctenanthe|Ctenanthe burle-marxii|tropical|semi|M|int,sombra
Stromanthe|Stromanthe sanguinea 'Triostar'|tropical|semi|D|int
Aglaonema|Aglaonema commutatum|interior|sombra|F|tox,aire,sombra,int
Aglaonema rojo|Aglaonema 'Red Valentine'|interior|semi|F|tox,int
Difenbaquia|Dieffenbachia seguine|interior|semi|F|tox,aire,int
Dracena marginata|Dracaena marginata|interior|semi|F|tox,aire,int
Palo de Brasil|Dracaena fragrans|interior|semi|F|tox,aire,int
Bambú de la suerte|Dracaena sanderiana|interior|semi|F|tox,int
Cordyline|Cordyline fruticosa|interior|semi|M|tox,int
Pacaya|Chamaedorea elegans|palmera|semi|M|aire,sombra,int
Areca|Dypsis lutescens|palmera|semi|M|aire,int
Kentia|Howea forsteriana|palmera|semi|F|aire,sombra,int
Palmera bambú|Rhapis excelsa|palmera|semi|F|aire,sombra,int
Palmera de abanico|Livistona chinensis|palmera|sol|F|int,ext
Palmito|Chamaerops humilis|palmera|sol|F|ext
Cica|Cycas revoluta|palmera|sol|F|tox,ext,int
Ave del paraíso|Strelitzia reginae|interior|sol|F|tox,ext,int,flor|fl=1-12
Strelitzia gigante|Strelitzia nicolai|interior|sol|F|tox,ext,int
Oreja de elefante|Alocasia macrorrhizos|tropical|semi|M|tox,int,ext
Alocasia Polly|Alocasia x amazonica|tropical|semi|D|tox,int
Alocasia zebrina|Alocasia zebrina|tropical|semi|D|tox,int
Colocasia|Colocasia esculenta|tropical|parcial|F|tox,ext,int
Anturio|Anthurium andraeanum|tropical|semi|M|tox,aire,int,flor|fl=1-12
Anthurium clarinervium|Anthurium clarinervium|tropical|semi|D|tox,int
Peperomia obtusifolia|Peperomia obtusifolia|interior|semi|F|int
Peperomia sandía|Peperomia argyreia|interior|semi|M|int
Peperomia tortuga|Peperomia prostrata|interior|semi|M|int,colg
Peperomia caperata|Peperomia caperata|interior|semi|F|int
Planta china del dinero|Pilea peperomioides|interior|semi|F|int
Fitonia|Fittonia albivenis|tropical|semi|M|int,sombra
Flor de cera|Hoya carnosa|interior|semi|F|int,colg,flor|fl=5-9
Hoya corazón|Hoya kerrii|interior|semi|F|int
Hoya linearis|Hoya linearis|interior|semi|M|int,colg
Amor de hombre|Tradescantia zebrina|interior|semi|F|int,colg
Tradescantia fluminensis|Tradescantia fluminensis|interior|semi|F|int,colg,inv
Tradescantia pallida|Tradescantia pallida|interior|sol|F|ext,int,colg
Singonio|Syngonium podophyllum|interior|semi|F|tox,aire,int
Cheflera|Schefflera arboricola|interior|semi|F|tox,aire,int
Aspidistra|Aspidistra elatior|interior|sombra|F|aire,sombra,int,ext
Croton|Codiaeum variegatum|tropical|sol|D|tox,int
Hiedra|Hedera helix|trepadora|semi|F|tox,aire,sombra,int,ext,colg
Lágrimas de ángel|Soleirolia soleirolii|tropical|semi|F|int,sombra
Begonia maculata|Begonia maculata|tropical|semi|M|tox,int,flor
Begonia rex|Begonia rex|tropical|semi|M|tox,int
Begonia de flor|Begonia x semperflorens|flor|semi|F|tox,ext,int,flor|fl=4-11
Violeta africana|Streptocarpus ionanthus|interior|semi|M|int,flor|fl=1-12
Estreptocarpo|Streptocarpus x hybridus|interior|semi|M|int,flor|fl=3-10
Episcia|Episcia cupreata|tropical|semi|M|int,colg
Planta de la cebra|Aphelandra squarrosa|tropical|semi|D|int,flor
Planta lunares|Hypoestes phyllostachya|tropical|semi|F|int
Cuna de Moisés|Spathiphyllum 'Sensation'|interior|sombra|F|tox,aire,sombra,int
Calla|Zantedeschia aethiopica|bulbosa|parcial|F|tox,ext,flor|fl=1-5;meses=NNNNNRRRNNNN;ri=14
Clivia|Clivia miniata|interior|sombra|F|tox,sombra,int,ext,flor|fl=2-4
Amarilis|Hippeastrum x hybridum|bulbosa|sol|F|tox,int,flor|fl=12-4
Ciclamen|Cyclamen persicum|bulbosa|semi|M|tox,int,flor|fl=10-3;meses=NNNRSSSSNNNN
Planta de café|Coffea arabica|tropical|semi|M|int
Planta del dinero|Plectranthus verticillatus|interior|semi|F|int,colg
Plectranthus|Plectranthus scutellarioides|interior|semi|F|int,ext
Platanera|Musa acuminata|tropical|sol|F|ext,int,com
Platanera enana|Musa 'Dwarf Cavendish'|tropical|sol|F|ext,com
Calathea crocata|Goeppertia crocata|tropical|semi|D|int,flor
Planta de goma|Peperomia clusiifolia|interior|semi|F|int
Philodendron Pink Princess|Philodendron erubescens 'Pink Princess'|interior|semi|D|tox,int
Philodendron Brasil|Philodendron hederaceum 'Brasil'|interior|semi|F|tox,int,colg
Rhaphidophora|Rhaphidophora tetrasperma|interior|semi|M|tox,int
# ===== Helechos =====
Helecho de Boston|Nephrolepis exaltata|helecho|semi|M|aire,sombra,int,colg
Nido de ave|Asplenium nidus|helecho|semi|M|aire,sombra,int
Culantrillo|Adiantum raddianum|helecho|semi|D|int,sombra
Cuerno de alce|Platycerium bifurcatum|helecho|semi|M|int,colg
Helecho pie de conejo|Davallia fejeensis|helecho|semi|M|int,colg
Helecho cola de pez|Microsorum musifolium|helecho|semi|M|int
Helecho azul|Phlebodium aureum|helecho|semi|F|int
Pteris|Pteris cretica|helecho|semi|F|int,sombra
Helecho espada|Nephrolepis cordifolia|helecho|parcial|F|ext,int,inv
Esparraguera plumosa|Asparagus setaceus|helecho|semi|F|tox,int
Esparraguera de Sprenger|Asparagus densiflorus|helecho|parcial|F|tox,ext,int,colg
# ===== Orquídeas =====
Orquídea mariposa|Phalaenopsis x hybridus|orquidea|semi|M|int,flor|fl=1-5
Orquídea mariposa (Psychopsis)|Psychopsis papilio|orquidea|semi|D|int,flor
Dendrobium|Dendrobium nobile|orquidea|parcial|M|int,flor|fl=2-4;meses=NNNNNNNNNRRR;ri=21
Cattleya|Cattleya labiata|orquidea|parcial|D|int,flor|fl=9-11
Oncidium|Oncidium 'Sharry Baby'|orquidea|semi|M|int,flor
Cymbidium|Cymbidium hybridum|orquidea|parcial|M|ext,int,flor|fl=12-4;tmin=5
Vanda|Vanda coerulea|orquidea|parcial|D|int,flor
Zapatito de Venus|Paphiopedilum insigne|orquidea|semi|M|int,flor|fl=11-3
Cambria|x Vuylstekeara Cambria|orquidea|semi|M|int,flor
Orquídea joya|Ludisia discolor|orquidea|sombra|F|int,flor
Miltonia|Miltoniopsis hybrida|orquidea|semi|D|int,flor
# ===== Bromelias =====
Guzmania|Guzmania lingulata|bromelia|semi|F|int,flor
Vriesea|Vriesea splendens|bromelia|semi|F|int,flor
Aechmea|Aechmea fasciata|bromelia|semi|F|int,flor
Neoregelia|Neoregelia carolinae|bromelia|parcial|F|int,ext
Estrella de tierra|Cryptanthus bivittatus|bromelia|semi|F|int
Piña ornamental|Ananas comosus|bromelia|sol|F|int,com
Clavel del aire|Tillandsia ionantha|tillandsia|semi|F|int,flor
Barba de viejo|Tillandsia usneoides|tillandsia|semi|F|int,colg
Tillandsia xerographica|Tillandsia xerographica|tillandsia|parcial|F|int
Tillandsia aeranthos|Tillandsia aeranthos|tillandsia|parcial|F|int,ext,flor
# ===== Aromáticas =====
Albahaca|Ocimum basilicum|aromatica|sol|F|ext,arom,com;meses=SSRNNNNNNNRS;tmin=10
Romero|Salvia rosmarinus|aromatica|sol|F|ext,arom,com,flor
Tomillo|Thymus vulgaris|aromatica|sol|F|ext,arom,com
Hierbabuena|Mentha spicata|aromatica|parcial|F|ext,arom,com
Menta piperita|Mentha x piperita|aromatica|parcial|F|ext,arom,com
Poleo|Mentha pulegium|aromatica|parcial|F|ext,arom,tox
Perejil|Petroselinum crispum|aromatica|parcial|F|ext,arom,com
Cilantro|Coriandrum sativum|aromatica|parcial|F|ext,arom,com
Orégano|Origanum vulgare|aromatica|sol|F|ext,arom,com
Lavanda|Lavandula angustifolia|aromatica|sol|F|ext,arom,sueno,flor|fl=5-8
Cantueso|Lavandula stoechas|aromatica|sol|F|ext,arom,flor|fl=3-6
Lavanda dentada|Lavandula dentata|aromatica|sol|F|ext,arom,flor|fl=1-12
Salvia|Salvia officinalis|aromatica|sol|F|ext,arom,com
Cebollino|Allium schoenoprasum|aromatica|sol|F|ext,arom,com,tox
Laurel|Laurus nobilis|arbusto|sol|F|ext,arom,com
Hierbaluisa|Aloysia citrodora|arbusto|sol|F|ext,arom,com
Melisa|Melissa officinalis|aromatica|parcial|F|ext,arom,sueno
Manzanilla|Matricaria chamomilla|aromatica|sol|F|ext,arom,sueno,flor
Estevia|Stevia rebaudiana|aromatica|sol|M|ext,com
Citronela|Cymbopogon citratus|aromatica|sol|F|ext,arom,com
Valeriana|Valeriana officinalis|aromatica|parcial|F|ext,sueno,flor
Jazmín|Jasminum officinale|trepadora|sol|F|ext,arom,sueno,flor|fl=5-9
Jazmín de invierno|Jasminum polyanthum|trepadora|sol|F|ext,int,arom,sueno,flor|fl=1-4
Galán de noche|Cestrum nocturnum|arbusto|parcial|F|tox,ext,arom,flor|fl=6-10
# ===== Huerto =====
Tomatera|Solanum lycopersicum|huerto|sol|F|ext,com,tox;meses=RRNNNNNNNNRR
Tomate cherry|Solanum lycopersicum var. cerasiforme|huerto|sol|F|ext,com,tox
Pimiento|Capsicum annuum|huerto|sol|F|ext,com
Guindilla|Capsicum frutescens|huerto|sol|F|ext,com
Pimienta palmera|Capsicum chinense|huerto|sol|M|ext,com
Fresa|Fragaria x ananassa|huerto|sol|F|ext,com,colg
Lechuga|Lactuca sativa|huerto|parcial|F|ext,com
Espinaca|Spinacia oleracea|huerto|parcial|F|ext,com
Acelga|Beta vulgaris var. cicla|huerto|parcial|F|ext,com
Rúcula|Eruca vesicaria|huerto|parcial|F|ext,com
Calabacín|Cucurbita pepo|huerto|sol|F|ext,com
Pepino|Cucumis sativus|huerto|sol|F|ext,com
Judía|Phaseolus vulgaris|huerto|sol|F|ext,com
Papa|Solanum tuberosum|huerto|sol|F|ext,com,tox
Cebolla|Allium cepa|huerto|sol|F|ext,com,tox
Ajo|Allium sativum|huerto|sol|F|ext,com,tox
Zanahoria|Daucus carota|huerto|sol|F|ext,com
Rábano|Raphanus sativus|huerto|sol|F|ext,com
Berenjena|Solanum melongena|huerto|sol|F|ext,com
Millo|Zea mays|huerto|sol|F|ext,com
Limonero|Citrus x limon|arbol|sol|F|ext,int,com,arom,flor
Naranjo enano|Citrus x microcarpa|arbol|sol|F|ext,int,com
Aguacate|Persea americana|arbol|sol|M|tox,ext,com
Mango|Mangifera indica|arbol|sol|M|ext,com;tmin=8
Papaya|Carica papaya|arbol|sol|M|ext,com;tmin=10
Higuera|Ficus carica|arbol|sol|F|ext,com,tox
Guayabero|Psidium guajava|arbol|sol|F|ext,com
Níspero|Eriobotrya japonica|arbol|sol|F|ext,com
Parra|Vitis vinifera|trepadora|sol|F|ext,com,tox
Maracuyá|Passiflora edulis|trepadora|sol|F|ext,com,flor
Arándano|Vaccinium corymbosum|arbusto|sol|M|ext,com
# ===== Flores y exterior =====
Geranio|Pelargonium x hortorum|flor|sol|F|ext,tox,flor|fl=3-11
Gitanilla|Pelargonium peltatum|flor|sol|F|ext,tox,colg,flor|fl=3-11
Geranio de olor|Pelargonium graveolens|flor|sol|F|ext,tox,arom
Petunia|Petunia x atkinsiana|flor|sol|F|ext,colg,flor|fl=4-10
Clavel|Dianthus caryophyllus|flor|sol|F|ext,tox,flor|fl=4-8
Margarita|Leucanthemum vulgare|flor|sol|F|ext,flor|fl=4-8
Crisantemo|Chrysanthemum x morifolium|flor|sol|F|tox,ext,int,flor|fl=9-11
Hortensia|Hydrangea macrophylla|arbusto|parcial|M|tox,ext,flor|fl=5-8
Azalea|Rhododendron simsii|arbusto|semi|M|tox,ext,int,flor|fl=1-4
Camelia|Camellia japonica|arbusto|parcial|M|ext,flor|fl=1-4
Gardenia|Gardenia jasminoides|arbusto|semi|D|tox,int,ext,sueno,arom,flor|fl=5-8
Hibisco|Hibiscus rosa-sinensis|arbusto|sol|F|ext,int,flor|fl=4-11
Buganvilla|Bougainvillea glabra|trepadora|sol|F|ext,tox,flor|fl=3-11
Celestina|Plumbago auriculata|arbusto|sol|F|ext,flor|fl=4-11
Dipladenia|Mandevilla sanderi|trepadora|sol|F|ext,tox,flor|fl=4-10
Rosal|Rosa x hybrida|arbusto|sol|M|ext,flor|fl=4-11
Rosal miniatura|Rosa chinensis 'Minima'|arbusto|sol|M|ext,int,flor
Adelfa|Nerium oleander|arbusto|sol|F|ext,tox,flor|fl=4-10
Lantana|Lantana camara|arbusto|sol|F|ext,tox,flor,inv
Pensamiento|Viola x wittrockiana|flor|parcial|F|ext,flor|fl=11-5
Alegría|Impatiens walleriana|flor|semi|F|ext,flor,sombra|fl=4-10
Gazania|Gazania rigens|flor|sol|F|ext,flor|fl=3-10
Tagete|Tagetes erecta|flor|sol|F|ext,flor|fl=5-11
Cosmos|Cosmos bipinnatus|flor|sol|F|ext,flor|fl=6-10
Girasol|Helianthus annuus|flor|sol|F|ext,com,flor|fl=6-9
Dalia|Dahlia pinnata|bulbosa|sol|M|ext,flor|fl=6-10;meses=SSNNNNNNNNRS
Tulipán|Tulipa gesneriana|bulbosa|sol|F|tox,ext,flor|fl=2-4
Jacinto|Hyacinthus orientalis|bulbosa|sol|F|tox,ext,int,arom,flor|fl=1-3
Narciso|Narcissus pseudonarcissus|bulbosa|sol|F|tox,ext,flor|fl=1-3
Agapanto|Agapanthus africanus|arbusto|sol|F|tox,ext,flor|fl=6-8
Lirio|Iris germanica|bulbosa|sol|F|tox,ext,flor|fl=3-5
Gerbera|Gerbera jamesonii|flor|sol|M|ext,int,flor|fl=3-10
Coleo|Coleus scutellarioides|flor|semi|F|ext,int
Pata de vaca|Bauhinia variegata|arbol|sol|F|ext,flor|fl=1-4
Jacarandá|Jacaranda mimosifolia|arbol|sol|F|ext,flor|fl=4-6
Flamboyán|Delonix regia|arbol|sol|M|ext,flor|fl=5-8;tmin=8
Tulipero del Gabón|Spathodea campanulata|arbol|sol|F|ext,flor
Tabaco moro|Nicotiana glauca|arbusto|sol|F|ext,tox,inv
Rabo de gato|Cenchrus setaceus|arbusto|sol|F|ext,inv
# ===== Carnívoras =====
Venus atrapamoscas|Dionaea muscipula|carnivora|sol|M|int,ext;meses=RNNNNNNNNNRR;ri=4
Sarracenia|Sarracenia purpurea|carnivora|sol|M|ext
Planta jarro|Nepenthes x ventrata|carnivora|semi|M|int,colg;rv=4;ri=6
Drosera|Drosera capensis|carnivora|sol|F|int,ext
Grasilla|Pinguicula moranensis|carnivora|semi|F|int
"""


def slug(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def rango(txt):
    a, b = (int(x) for x in txt.split("-"))
    meses = []
    m = a
    while True:
        meses.append(m)
        if m == b:
            break
        m = m % 12 + 1
    return meses


def parse():
    out, ids = [], set()
    for n, raw in enumerate(ESPECIES.strip().splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        partes = [p.strip() for p in line.split("|")]
        partes += [""] * (7 - len(partes))
        nombre, cient, grupo, luz, dif, etiquetas, ajustes = partes[:7]
        # Las etiquetas pueden llevar ajustes pegados tras «;» (p. ej. «flor;tmin=12»)
        if ";" in etiquetas:
            etiquetas, extra = etiquetas.split(";", 1)
            ajustes = ";".join(x for x in (extra, ajustes) if x)
        if grupo not in GRUPOS:
            raise SystemExit(f"Línea {n}: grupo desconocido «{grupo}» ({nombre})")
        if luz not in LUZ:
            raise SystemExit(f"Línea {n}: luz desconocida «{luz}» ({nombre})")
        if dif not in DIF:
            raise SystemExit(f"Línea {n}: dificultad desconocida «{dif}» ({nombre})")
        g = GRUPOS[grupo]
        tags = [t for t in (x.strip() for x in etiquetas.split(",")) if t]
        e = {
            "id": slug(cient),
            "nombre": nombre,
            "cientifico": cient,
            "grupo": grupo,
            "luz": luz,
            "dificultad": dif,
            "tags": tags,
            "rv": g["rv"],
            "ri": g["ri"],
            "meses": g["meses"],
            "abono": g["abono"],
            "abonoMeses": g["abonoMeses"],
            "tmin": g["tmin"],
            "hum": g["hum"],
        }
        for aj in (a for a in ajustes.split(";") if a.strip()):
            k, v = (x.strip() for x in aj.split("=", 1))
            if k in ("rv", "ri", "tmin", "hum", "abono"):
                e[k] = int(v)
            elif k == "meses":
                if len(v) != 12 or set(v) - set("NRS"):
                    raise SystemExit(f"Línea {n}: meses debe tener 12 letras N/R/S ({nombre})")
                e["meses"] = v
            elif k == "fl":
                e["fl"] = rango(v)
            else:
                raise SystemExit(f"Línea {n}: ajuste desconocido «{k}» ({nombre})")
        if e["id"] in ids:
            raise SystemExit(f"Línea {n}: especie repetida «{cient}»")
        ids.add(e["id"])
        out.append(e)
    return out


def main():
    raiz = pathlib.Path(__file__).resolve().parent.parent
    especies = parse()
    grupos = {
        k: {kk: vv for kk, vv in v.items() if kk in ("nombre", "sustrato", "riegoTxt", "poda", "trasplante")}
        for k, v in GRUPOS.items()
    }
    datos = {"grupos": grupos, "luz": LUZ, "dificultad": DIF, "especies": especies}
    destino = raiz / "data" / "especies.json"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    canarias = sum(1 for e in especies if {"end", "nat", "mac"} & set(e["tags"]))
    sucu = sum(1 for e in especies if e["grupo"] in ("cactus", "cactus_delicado", "cactus_selva", "suculenta",
                                                   "suculenta_invernal", "tabaiba", "mesemb", "mesemb_invernal", "caudex"))
    print(f"{len(especies)} especies ({canarias} canarias, {sucu} cactus y suculentas) → {destino}")


if __name__ == "__main__":
    main()
