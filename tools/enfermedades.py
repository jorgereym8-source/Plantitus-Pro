#!/usr/bin/env python3
"""Guía de problemas de Plantitus Pro → data/enfermedades.json

Cada problema lleva:
- partes: dónde se ve (planta, hojas, tallos, raices, flores, frutos, plagas).
- s: síntomas del vocabulario SINTOMAS (los que el buscador deja marcar).
- c: situaciones que lo favorecen (vocabulario CONDICIONES).
- plantas: tipos de planta a los que suele afectar (vocabulario PLANTAS) o «todas».
- grav: 1 leve · 2 moderado · 3 grave. contagia: si pasa a las plantas de al lado.

Para añadir un problema copia un bloque P(...), cámbialo y ejecuta:
    python3 tools/enfermedades.py
El script avisa si usas un síntoma, situación o tipo de planta que no existe.
"""
import json
import pathlib
import re
import unicodedata

# ---------------------------------------------------------------------------
# Vocabulario de síntomas por parte de la planta
# ---------------------------------------------------------------------------
PARTES_SINTOMA = {
    "hojas": "Hojas",
    "tallos": "Tallo o cuerpo",
    "raices": "Raíces y tierra",
    "flores": "Flores",
    "frutos": "Frutos",
    "planta": "Planta entera",
}
SINTOMAS = {
    # hojas
    "h_amar": ("hojas", "Se ponen amarillas"),
    "h_amar_abajo": ("hojas", "Amarillean primero las de abajo"),
    "h_amar_jovenes": ("hojas", "Amarillean las nuevas"),
    "h_amar_nervios": ("hojas", "Amarillas con los nervios verdes"),
    "h_palidas": ("hojas", "Pálidas o descoloridas"),
    "h_rojizas": ("hojas", "Se vuelven rojizas o moradas"),
    "h_manchas_marron": ("hojas", "Manchas marrones o negras"),
    "h_manchas_halo": ("hojas", "Manchas con borde amarillo"),
    "h_manchas_aceite": ("hojas", "Manchas acuosas o aceitosas"),
    "h_manchas_anillo": ("hojas", "Manchas en anillos"),
    "h_pustulas": ("hojas", "Bultitos naranjas o marrones en el envés"),
    "h_polvo_blanco": ("hojas", "Polvo blanco como harina"),
    "h_pelusa_enves": ("hojas", "Pelusa gris o blanca en el envés"),
    "h_hollin": ("hojas", "Capa negra como hollín"),
    "h_punteado": ("hojas", "Punteado fino amarillento"),
    "h_plateadas": ("hojas", "Zonas plateadas brillantes"),
    "h_telaranas": ("hojas", "Telarañas muy finas"),
    "h_agujeros": ("hojas", "Agujeros o bordes comidos"),
    "h_galerias": ("hojas", "Caminos o galerías por dentro"),
    "h_pegajosas": ("hojas", "Pegajosas o brillantes"),
    "h_rizadas": ("hojas", "Rizadas, abarquilladas o deformes"),
    "h_mosaico": ("hojas", "Dibujos claros en mosaico"),
    "h_puntas_secas": ("hojas", "Puntas o bordes secos"),
    "h_blandas": ("hojas", "Blandas, translúcidas o encharcadas"),
    "h_arrugadas": ("hojas", "Arrugadas o chupadas"),
    "h_lacias": ("hojas", "Lacias, caídas hacia abajo"),
    "h_caen": ("hojas", "Se caen"),
    "h_caen_verdes": ("hojas", "Se caen estando verdes"),
    "h_quemadas": ("hojas", "Zonas secas o blanquecinas en la cara al sol"),
    "h_costras": ("hojas", "Costras o verrugas corchosas"),
    "h_gotas": ("hojas", "Gotas de agua en las puntas"),
    "h_variegado": ("hojas", "Pierden el variegado (salen verdes)"),
    "h_pequenas": ("hojas", "Las nuevas salen pequeñas"),
    "h_insectos": ("hojas", "Bichitos agrupados en brotes o envés"),
    "h_escamas": ("hojas", "Escamas o lapas pegadas"),
    "h_algodon": ("hojas", "Bolitas de algodón blanco"),
    # tallo o cuerpo
    "t_base_blanda": ("tallos", "Base blanda u oscura"),
    "t_negro_sube": ("tallos", "Mancha oscura que sube desde abajo"),
    "t_estirado": ("tallos", "Estirado, fino y pálido"),
    "t_inclinado": ("tallos", "Se tumba, se dobla o se inclina"),
    "t_algodon": ("tallos", "Algodón blanco entre espinas o axilas"),
    "t_rojo": ("tallos", "Bolitas blancas que sueltan líquido rojo"),
    "t_escamas": ("tallos", "Escamas o lapas pegadas"),
    "t_rajado": ("tallos", "Se ha rajado o abierto"),
    "t_bultos": ("tallos", "Bultos o tumores"),
    "t_cresta": ("tallos", "Crece aplanado, en cresta o abanico"),
    "t_corcho": ("tallos", "Zonas marrones duras como corcho"),
    "t_arrugado": ("tallos", "Arrugado o deshinchado"),
    "t_hundidas": ("tallos", "Manchas hundidas"),
    "t_blanquecino": ("tallos", "Se blanquea o amarillea por un lado"),
    "t_serrin": ("tallos", "Agujeros con serrín o galerías"),
    "t_moho": ("tallos", "Moho gris algodonoso"),
    "t_naranja": ("tallos", "Manchas naranjas o rojizas"),
    "t_vasos": ("tallos", "Marrón por dentro al cortarlo"),
    "t_gomoso": ("tallos", "Suelta goma o un líquido"),
    # raíces y tierra
    "r_podridas": ("raices", "Raíces negras, blandas o huecas"),
    "r_bultos": ("raices", "Bultos o nudos en las raíces"),
    "r_algodon": ("raices", "Polvo o algodón blanco en las raíces"),
    "r_salen": ("raices", "Raíces que salen por la maceta"),
    "r_comidas": ("raices", "Raíces comidas, larvas en la tierra"),
    "s_mosquitas": ("raices", "Mosquitas negras sobre la tierra"),
    "s_costra": ("raices", "Costra blanca en la tierra o la maceta"),
    "s_moho": ("raices", "Moho blanco sobre la tierra"),
    "s_mojado": ("raices", "La tierra sigue mojada días después"),
    "s_seca_rapido": ("raices", "La tierra se seca enseguida"),
    "s_no_absorbe": ("raices", "El agua resbala y no empapa"),
    "s_hormigas": ("raices", "Hormigas en la maceta"),
    # flores
    "f_capullos_caen": ("flores", "Se caen los capullos"),
    "f_no_florece": ("flores", "No florece"),
    "f_manchas": ("flores", "Pétalos manchados o comidos"),
    "f_moho": ("flores", "Moho gris en las flores"),
    "f_duran_poco": ("flores", "Las flores duran muy poco"),
    "f_deformes": ("flores", "Flores deformes o con rayas"),
    # frutos
    "fr_punta_negra": ("frutos", "Mancha negra en la punta"),
    "fr_podridos": ("frutos", "Se pudren o se cubren de moho"),
    "fr_caen": ("frutos", "Se caen antes de madurar"),
    "fr_larvas": ("frutos", "Agujeros o gusanos dentro"),
    "fr_rajados": ("frutos", "Se rajan"),
    "fr_manchas": ("frutos", "Manchas o costras en la piel"),
    "fr_no_cuajan": ("frutos", "Florece pero no da fruto"),
    # planta entera
    "p_mustia": ("planta", "Mustia o decaída"),
    "p_no_crece": ("planta", "No crece"),
    "p_muere_rapido": ("planta", "Se viene abajo en pocos días"),
    "p_un_lado": ("planta", "Se marchita solo por un lado"),
    "p_vuelan": ("planta", "Bichitos que salen volando al moverla"),
    "p_babas": ("planta", "Rastros de baba brillante"),
    "p_olor": ("planta", "Huele mal"),
    "p_hormigas": ("planta", "Hormigas subiendo por la planta"),
}
CONDICIONES = {
    "riego_mucho": "La riego a menudo",
    "riego_poco": "Se me pasa regarla",
    "sin_drenaje": "Maceta sin agujero o plato con agua",
    "poca_luz": "Está en un sitio con poca luz",
    "sol_nuevo": "La he puesto al sol hace poco",
    "calor": "Mucho calor o ambiente seco",
    "frio": "Ha pasado frío o corrientes",
    "humedo": "Ambiente húmedo o poco ventilado",
    "lluvia": "Ha llovido o la mojo al regar",
    "exterior": "Está en el exterior",
    "movida": "La he cambiado de sitio",
    "nueva": "Es nueva o recién comprada",
    "trasplante": "La he trasplantado hace poco",
    "abono": "La he abonado hace poco",
    "agua_dura": "Riego con agua del grifo (con cal)",
    "producto": "Le he echado algún producto",
    "costa": "Cerca del mar o con viento",
}
PLANTAS = {
    "cactus": "Cactus",
    "suculenta": "Suculentas",
    "canaria": "Flora canaria",
    "interior": "Plantas de interior",
    "tropical": "Tropicales",
    "orquidea": "Orquídeas y bromelias",
    "helecho": "Helechos",
    "palmera": "Palmeras",
    "huerto": "Huerto",
    "frutal": "Frutales",
    "flor": "Flores",
    "aromatica": "Aromáticas",
    "arbusto": "Árboles y arbustos",
    "carnivora": "Carnívoras",
    "todas": "Todas",
}

PROBLEMAS = []


def P(nombre, tipo, partes, s, c, plantas, sintomas, causas, tratamiento, prevencion,
      grav=2, contagia=False, alias=(), wiki=None):
    PROBLEMAS.append(dict(nombre=nombre, tipo=tipo, partes=partes, s=s, c=c, plantas=plantas,
                          sintomas=sintomas, causas=causas, tratamiento=tratamiento,
                          prevencion=prevencion, grav=grav, contagia=contagia,
                          alias=list(alias), wiki=wiki or nombre))


# ===========================================================================
# Plagas
# ===========================================================================
P("Cochinilla algodonosa", "Plaga", ["plagas", "hojas", "tallos"],
  ["h_algodon", "t_algodon", "h_pegajosas", "h_amar", "p_hormigas", "p_no_crece", "h_hollin"],
  ["calor", "nueva", "riego_poco"], ["todas"],
  "Bolitas blancas como algodón en las axilas de las hojas, entre las espinas, en la base o bajo las hojas. A veces la planta queda pegajosa y con hormigas.",
  "Ambiente seco y cálido, y contagio desde plantas nuevas que no pasaron cuarentena. En cactus se esconde en las areolas y en la base.",
  "Aísla la planta. Toca cada foco con un bastoncillo con alcohol de 70º. Después pulveriza jabón potásico o aceite de neem cada 7 días durante 3 semanas. En cactus, mejor alcohol que aceites. Saca la planta de la maceta y revisa también las raíces.",
  "Revisa y deja en cuarentena 2-3 semanas cada planta nueva. Mira las axilas y la base una vez al mes.",
  grav=2, contagia=True, alias=["cochinilla blanca", "cochinilla harinosa", "pulgón blanco"], wiki="Pseudococcidae")
P("Cochinilla de raíz", "Plaga", ["plagas", "raices"],
  ["r_algodon", "p_no_crece", "p_mustia", "t_arrugado", "h_arrugadas", "h_amar"],
  ["nueva", "riego_poco"], ["cactus", "suculenta", "interior", "canaria"],
  "La planta deja de crecer o se arruga aunque la riegues. Al sacarla de la maceta hay un polvillo blanco o motas de algodón en las raíces y el cepellón.",
  "Cochinillas que viven bajo tierra (Rhizoecus). Llegan con plantas o sustratos contaminados y prosperan en tierra seca.",
  "Saca la planta, quita toda la tierra, lava las raíces con agua tibia (unos 45 °C, 15 minutos) o con jabón potásico, corta las raíces dañadas y replanta en sustrato y maceta nuevos. Revisa al mes.",
  "Usa sustrato nuevo y revisa las raíces al trasplantar o al comprar.",
  grav=3, contagia=True, alias=["cochinilla radicular", "pulgón de raíz"], wiki="Rhizoecus")
P("Cochinilla de escudo", "Plaga", ["plagas", "hojas", "tallos"],
  ["h_escamas", "t_escamas", "h_pegajosas", "h_hollin", "h_amar", "h_caen"],
  ["calor", "humedo", "nueva"], ["interior", "frutal", "palmera", "arbusto", "helecho", "orquidea"],
  "Pequeñas lapas o escamas marrones o grises pegadas a tallos, nervios y envés. Hojas pegajosas y, a veces, con negrilla.",
  "Plantas debilitadas y poca ventilación. Muy común en helechos, palmeras, ficus, laureles y cítricos.",
  "Despréndelas con la uña, un cepillo de dientes o un bastoncillo con alcohol. Después aplica aceite de parafina o de neem para asfixiar las larvas. Repite a los 10-15 días.",
  "Ventila y revisa el envés de vez en cuando, sobre todo en primavera.",
  grav=2, contagia=True, alias=["caparreta", "piojo de San José", "cochinilla parda"], wiki="Coccidae")
P("Cochinilla acanalada", "Plaga", ["plagas", "tallos", "hojas"],
  ["t_algodon", "h_pegajosas", "h_hollin", "h_caen"],
  ["calor", "exterior"], ["frutal", "arbusto", "canaria"],
  "Insectos rojizos con una bolsa blanca acanalada de huevos, en ramas y nervios. Mucha melaza y negrilla.",
  "Icerya purchasi, frecuente en cítricos, pitosporos, retamas y otras leguminosas.",
  "Retira las colonias con un cepillo y jabón potásico. En exterior, la mariquita Rodolia la controla de forma natural. Aceite de parafina en ataques fuertes.",
  "Revisa cítricos y leguminosas en primavera y verano.",
  grav=2, contagia=True, alias=["Icerya", "cochinilla australiana"], wiki="Icerya purchasi")
P("Cochinilla del carmín", "Plaga", ["plagas", "tallos"],
  ["t_algodon", "t_rojo", "t_blanquecino"],
  ["exterior", "calor"], ["cactus"],
  "Bolitas blancas cerosas sobre las palas de tuneras y otros cactus. Al aplastarlas sueltan un líquido rojo intenso. Las palas amarillean y se debilitan.",
  "Dactylopius, muy extendida en las tuneras de Canarias. Las crías se mueven con el viento y las aves.",
  "Cepilla las colonias con agua a presión y jabón potásico. En plantas pequeñas, alcohol. Corta y destruye las palas muy afectadas.",
  "No acerques palas de tuneras silvestres a tu colección y revisa los cactus de la azotea.",
  grav=2, contagia=True, alias=["cochinilla de la tunera", "Dactylopius"], wiki="Dactylopius coccus")
P("Araña roja", "Plaga", ["plagas", "hojas", "tallos"],
  ["h_punteado", "h_telaranas", "h_palidas", "h_caen", "t_corcho", "t_blanquecino", "h_amar"],
  ["calor", "riego_poco"], ["todas"],
  "Punteado fino amarillento que deja la hoja como polvorienta y descolorida. Con lupa se ven ácaros diminutos y telarañas finas en puntas y envés. En cactus, manchas marrón-anaranjadas que empiezan en la parte nueva.",
  "Calor y ambiente muy seco: interiores con calefacción y azoteas en verano.",
  "Ducha la planta y sube la humedad. Jabón potásico o azufre mojable cada 4-5 días, mojando bien el envés. Si no remite, acaricida específico.",
  "Pulveriza o ducha las plantas de vez en cuando en verano y evita rincones muy secos.",
  grav=2, contagia=True, alias=["ácaros", "arañita roja", "tetraníquido"], wiki="Tetranychus urticae")
P("Trips", "Plaga", ["plagas", "hojas", "flores"],
  ["h_plateadas", "h_punteado", "f_deformes", "f_manchas", "h_rizadas", "h_manchas_marron"],
  ["calor", "nueva"], ["todas"],
  "Manchas plateadas o grisáceas en hojas y pétalos, con puntitos negros (sus excrementos). Flores deformadas y brotes que no se abren bien.",
  "Insectos alargados muy pequeños que llegan con flores cortadas o plantas nuevas. Les gusta el calor seco.",
  "Trampas adhesivas azules, ducha y jabón potásico más aceite de neem cada 5-7 días, insistiendo en el envés y dentro de las flores.",
  "Cuarentena para las plantas nuevas y no dejes ramos de flores junto a tus plantas.",
  grav=2, contagia=True, alias=["tisanópteros"], wiki="Thysanoptera")
P("Mosca blanca", "Plaga", ["plagas", "hojas"],
  ["p_vuelan", "h_pegajosas", "h_amar", "h_hollin", "h_insectos"],
  ["calor", "humedo"], ["huerto", "flor", "interior", "aromatica", "frutal"],
  "Mosquitas blancas diminutas que salen volando al mover la planta. Larvas planas en el envés, hojas pegajosas y amarillentas.",
  "Rincones cálidos y poco ventilados, invernaderos e interiores.",
  "Trampas amarillas, jabón potásico y neem en el envés cada 5 días durante 3-4 semanas.",
  "Ventila y revisa el envés de tomateras, hibiscos y aromáticas.",
  grav=2, contagia=True, alias=["aleuródidos"], wiki="Aleyrodidae")
P("Pulgón", "Plaga", ["plagas", "hojas", "flores"],
  ["h_insectos", "h_rizadas", "h_pegajosas", "p_hormigas", "f_deformes", "h_hollin"],
  ["abono", "exterior"], ["todas"],
  "Colonias de insectos verdes, negros o amarillos en brotes tiernos y capullos. Hojas rizadas, melaza pegajosa y hormigas que suben.",
  "Brotes tiernos de primavera y exceso de abono nitrogenado. Las hormigas los protegen.",
  "Chorro de agua, jabón potásico o infusión de ajo. Las mariquitas y crisopas los controlan en exterior.",
  "No te pases con el abono y vigila los brotes nuevos en primavera.",
  grav=1, contagia=True, alias=["áfidos", "piojo de las plantas"], wiki="Aphididae")
P("Mosca del sustrato", "Plaga", ["plagas", "raices", "planta"],
  ["s_mosquitas", "p_vuelan", "p_no_crece", "r_podridas"],
  ["riego_mucho", "humedo"], ["todas"],
  "Mosquitas negras que revolotean sobre la tierra. Sus larvas, como gusanitos transparentes, comen raíces finas y esquejes.",
  "Sustrato húmedo de forma constante y rico en materia orgánica (turba, fibra de coco).",
  "Deja secar más la tierra entre riegos, cubre la superficie con arena o picón, pon trampas amarillas y riega con Bacillus thuringiensis israelensis.",
  "Riega solo cuando la capa de arriba esté seca y usa sustratos más minerales.",
  grav=1, contagia=True, alias=["sciáridos", "mosquitas negras", "mosquito del sustrato"], wiki="Sciaridae")
P("Nematodos", "Plaga", ["plagas", "raices"],
  ["r_bultos", "p_no_crece", "h_amar", "p_mustia"],
  ["exterior"], ["huerto", "cactus", "interior", "frutal"],
  "La planta decae y amarillea sin motivo claro. Las raíces tienen bultos o nudos.",
  "Gusanos microscópicos del suelo (Meloidogyne), sobre todo en tierra de huerto reutilizada.",
  "Desecha el sustrato, corta las raíces con nudos y replanta en sustrato nuevo. Esteriliza la maceta. En huerto, rota cultivos y planta tagetes.",
  "No reutilices tierra de plantas enfermas.",
  grav=3, contagia=True, alias=["nematodo del nudo", "Meloidogyne"], wiki="Meloidogyne")
P("Caracoles y babosas", "Plaga", ["plagas", "hojas"],
  ["h_agujeros", "p_babas", "f_manchas"],
  ["lluvia", "humedo", "exterior"], ["huerto", "flor", "suculenta", "aromatica", "canaria"],
  "Agujeros irregulares en hojas tiernas, plántulas comidas de un día para otro y rastros brillantes de baba.",
  "Noches húmedas, riegos al atardecer y rincones sombríos. Salen de noche.",
  "Recógelos de noche con una linterna, pon barreras de ceniza o cáscara de huevo y trampas de cerveza. Fosfato férrico (apto en ecológico) si hay muchos.",
  "Riega por la mañana y no dejes macetas apiladas donde se escondan.",
  grav=1, alias=["babosas", "caracoles"], wiki="Gastropoda")
P("Orugas", "Plaga", ["plagas", "hojas", "frutos"],
  ["h_agujeros", "h_insectos", "fr_larvas"],
  ["exterior"], ["huerto", "flor", "arbusto", "aromatica", "frutal"],
  "Hojas comidas desde el borde, bolitas negras de excrementos y orugas verdes o pardas entre las hojas.",
  "Mariposas y polillas que ponen huevos en primavera y verano.",
  "Retíralas a mano y aplica Bacillus thuringiensis al atardecer (ecológico).",
  "Revisa el envés en primavera y quita las puestas de huevos.",
  grav=1, alias=["gusanos", "larvas de mariposa"], wiki="Oruga")
P("Minador de hojas", "Plaga", ["plagas", "hojas"],
  ["h_galerias", "h_manchas_marron"],
  ["exterior", "calor"], ["huerto", "frutal", "flor"],
  "Caminos blanquecinos que serpentean por dentro de la hoja.",
  "Larvas de pequeñas moscas o polillas que viven dentro de la hoja (en cítricos, el minador de los cítricos).",
  "Corta las hojas afectadas y aplica aceite de neem. Trampas amarillas para los adultos.",
  "Evita abonar en exceso en verano, cuando salen los brotes que prefiere.",
  grav=1, alias=["minador de los cítricos"], wiki="Minador")
P("Picudo rojo de las palmeras", "Plaga", ["plagas", "tallos"],
  ["t_serrin", "p_mustia", "h_caen", "p_olor", "p_muere_rapido"],
  ["exterior"], ["palmera"],
  "Hojas centrales que se caen o se tuercen, cogollo ladeado, galerías y serrín húmedo con mal olor en la base de las hojas.",
  "Escarabajo Rhynchophorus ferrugineus. Ataca sobre todo a la palmera canaria y a la datilera.",
  "Es una plaga de declaración obligatoria: avisa al servicio de Sanidad Vegetal del Cabildo. Los tratamientos los hacen empresas autorizadas.",
  "Poda solo en invierno, sella los cortes y revisa la copa de las palmeras.",
  grav=3, contagia=True, alias=["picudo", "Rhynchophorus"], wiki="Rhynchophorus ferrugineus")
P("Picudo del agave", "Plaga", ["plagas", "tallos"],
  ["t_base_blanda", "t_serrin", "p_muere_rapido", "p_olor", "h_lacias"],
  ["exterior", "calor"], ["suculenta"],
  "Agaves, yucas o pitas cuyas hojas se tumban de repente. La base está podrida, huele mal y tiene larvas blancas grandes.",
  "Escarabajo Scyphophorus acupunctatus, cada vez más presente en Canarias.",
  "Arranca y destruye la planta afectada con sus larvas. Revisa las de alrededor.",
  "No compres agaves con heridas en la base y vigila los ejemplares grandes en verano.",
  grav=3, contagia=True, alias=["Scyphophorus", "picudo negro"], wiki="Scyphophorus acupunctatus")
P("Taladro de los geranios", "Plaga", ["plagas", "tallos", "flores"],
  ["t_serrin", "f_capullos_caen", "f_manchas", "p_mustia"],
  ["exterior", "calor"], ["flor"],
  "Capullos agujereados que no abren, tallos huecos con excrementos y una mariposa pequeña gris-marrón revoloteando.",
  "Larvas de la mariposa Cacyreus marshalli, muy común en geranios y gitanillas.",
  "Corta los tallos y capullos afectados. Bacillus thuringiensis cada 10 días de primavera a otoño.",
  "Revisa los capullos de geranios en verano.",
  grav=2, alias=["mariposa del geranio", "Cacyreus"], wiki="Cacyreus marshalli")
P("Otiorrinco", "Plaga", ["plagas", "hojas", "raices"],
  ["h_agujeros", "r_comidas", "p_mustia", "p_muere_rapido"],
  ["exterior"], ["suculenta", "flor", "arbusto", "canaria"],
  "Mordiscos en forma de media luna en el borde de las hojas (adultos, de noche) y plantas que se vienen abajo porque las larvas blancas en forma de C se comen las raíces.",
  "Escarabajo picudo Otiorhynchus. Ataca mucho a crasas en maceta.",
  "Busca y retira las larvas de la tierra. Nematodos beneficiosos (Heterorhabditis) en el riego en primavera y otoño.",
  "Revisa el cepellón al trasplantar.",
  grav=2, alias=["gorgojo", "Otiorhynchus"], wiki="Otiorhynchus sulcatus")
P("Gusano blanco", "Plaga", ["plagas", "raices"],
  ["r_comidas", "p_mustia", "p_no_crece"],
  ["exterior"], ["todas"],
  "La planta se marchita aunque la tierra esté húmeda. Al sacarla hay larvas gruesas blancas curvadas y raíces comidas.",
  "Larvas de escarabajos que ponen huevos en macetas grandes y jardineras de exterior.",
  "Retira las larvas a mano y cambia el sustrato. Nematodos beneficiosos en el riego.",
  "Cubre la tierra de macetas grandes con picón o grava.",
  grav=2, alias=["larvas de escarabajo"], wiki="Melolontha melolontha")
P("Tijeretas", "Plaga", ["plagas", "hojas", "flores"],
  ["h_agujeros", "f_manchas"],
  ["exterior", "humedo"], ["flor", "huerto"],
  "Pétalos y hojas tiernas mordisqueados de noche. De día se esconden en huecos.",
  "Forfícula, insecto nocturno con pinzas al final del cuerpo.",
  "Trampas de macetas con paja boca abajo: vacíalas por la mañana. Suelen ser un problema leve.",
  "Quita escondites cerca de las flores.",
  grav=1, alias=["forfícula", "cortapicos"], wiki="Forficula auricularia")
P("Hormigas", "Plaga", ["plagas", "planta", "raices"],
  ["p_hormigas", "s_hormigas", "h_pegajosas"],
  ["exterior"], ["todas"],
  "Hormigas que suben por la planta o anidan en la maceta. Casi siempre indican pulgón o cochinilla, cuya melaza les gusta.",
  "Las hormigas cuidan a pulgones y cochinillas a cambio de melaza, y anidan en macetas secas.",
  "Trata primero el pulgón o la cochinilla. Si anidan en la maceta, sumérgela 20 minutos en agua y pon cinta adhesiva o canela en el borde.",
  "Controla pulgones y cochinillas y no dejes restos de comida cerca.",
  grav=1, alias=["hormigueros"], wiki="Formicidae")
P("Polilla del tomate", "Plaga", ["plagas", "hojas", "frutos"],
  ["h_galerias", "fr_larvas", "h_manchas_marron"],
  ["exterior", "calor"], ["huerto"],
  "Galerías y manchas transparentes en hojas de tomatera y agujeros en los tomates con excrementos dentro.",
  "Tuta absoluta, muy extendida en los huertos canarios.",
  "Trampas de feromonas, retira las hojas minadas y aplica Bacillus thuringiensis.",
  "Revisa las tomateras desde la plantación.",
  grav=2, contagia=True, alias=["Tuta absoluta"], wiki="Tuta absoluta")
P("Mosca de la fruta", "Plaga", ["plagas", "frutos"],
  ["fr_larvas", "fr_podridos", "fr_caen"],
  ["exterior", "calor"], ["frutal", "huerto"],
  "Frutos con picaduras, zonas blandas y larvas dentro.",
  "Ceratitis capitata, sobre todo en verano y otoño (mangos, guayabos, cítricos, nísperos).",
  "Trampas con atrayente, recoge y destruye la fruta caída o picada.",
  "Recoge la fruta en cuanto madure y no la dejes en el suelo.",
  grav=2, alias=["Ceratitis"], wiki="Ceratitis capitata")
# ===========================================================================
# Hongos y bacterias
# ===========================================================================
P("Oídio", "Hongo", ["hojas", "flores", "planta"],
  ["h_polvo_blanco", "h_rizadas", "h_amar", "f_manchas"],
  ["humedo", "calor"], ["todas"],
  "Polvo blanco o ceniciento sobre hojas y brotes, como si tuvieran harina. Las hojas acaban amarilleando y secándose.",
  "Días cálidos con noches frescas y húmedas, poca ventilación y plantas muy juntas.",
  "Retira las hojas afectadas. Pulveriza bicarbonato (5 g por litro), leche diluida al 10 % o azufre. Ventila.",
  "Separa las macetas y riega sin mojar las hojas.",
  grav=1, contagia=True, alias=["ceniza", "blanquilla", "mal blanco"], wiki="Oídio")
P("Roya", "Hongo", ["hojas", "tallos"],
  ["h_pustulas", "h_manchas_halo", "h_amar", "h_caen", "t_naranja"],
  ["humedo", "lluvia"], ["flor", "arbusto", "huerto", "aromatica", "suculenta"],
  "Bultitos naranjas, rojizos o marrones en el envés que sueltan un polvo al tocarlos. Manchas amarillas por el haz.",
  "Agua sobre las hojas durante horas y tiempo templado y húmedo.",
  "Elimina las hojas afectadas, riega sin mojar la planta y aplica un fungicida de cobre o azufre.",
  "Riega al pie y por la mañana.",
  grav=2, contagia=True, alias=["herrumbre"], wiki="Pucciniales")
P("Podredumbre radicular", "Hongo", ["planta", "raices", "tallos"],
  ["r_podridas", "p_mustia", "s_mojado", "t_base_blanda", "h_amar_abajo", "p_olor", "h_lacias"],
  ["riego_mucho", "sin_drenaje", "frio", "humedo"], ["todas"],
  "Planta mustia aunque la tierra esté mojada. Raíces negras y blandas que se deshacen, base oscura y a veces mal olor.",
  "Exceso de riego, sustrato que no drena o maceta sin agujero. Los hongos Pythium y Phytophthora aprovechan el encharcamiento.",
  "Saca la planta, corta todo lo blando hasta tejido sano, espolvorea canela o un fungicida, deja secar 1-3 días (en cactus 1-2 semanas) y replanta en sustrato seco y mineral. No riegues hasta una semana después.",
  "Maceta con agujero, sustrato que drene y riego solo con la tierra seca.",
  grav=3, alias=["pudrición de raíces", "raíz podrida", "Pythium", "Phytophthora"], wiki="Pudrición de la raíz")
P("Pudrición del cuello", "Hongo", ["tallos", "planta"],
  ["t_base_blanda", "t_negro_sube", "p_muere_rapido", "t_hundidas"],
  ["riego_mucho", "frio", "sin_drenaje"], ["cactus", "suculenta", "canaria"],
  "Mancha oscura, blanda o acuosa en la base del cactus o la suculenta que sube hacia arriba. La planta puede caerse de golpe.",
  "Agua acumulada en el cuello, frío con el sustrato húmedo y cuello enterrado demasiado.",
  "Corta por encima de la zona podrida hasta ver tejido limpio, sin vetas marrones. Deja cicatrizar 1-2 semanas en un sitio seco y enraízalo de nuevo como esqueje.",
  "Cubre el cuello con grava y no riegues con frío.",
  grav=3, alias=["podredumbre del cuello", "pudrición basal"], wiki="Phytophthora")
P("Podredumbre blanda bacteriana", "Bacteria", ["tallos", "hojas", "planta"],
  ["t_base_blanda", "h_blandas", "p_olor", "t_gomoso", "p_muere_rapido"],
  ["humedo", "calor", "riego_mucho"], ["cactus", "suculenta", "orquidea", "huerto"],
  "Zonas que se vuelven blandas, acuosas y marrones en muy poco tiempo, con mal olor y a veces un líquido que rezuma.",
  "Bacterias (Erwinia, Pectobacterium) que entran por heridas con calor y humedad.",
  "Corta con margen todo el tejido afectado con un cuchillo desinfectado, deja secar y aplica cobre. Si afecta a la base, salva la parte sana como esqueje.",
  "Evita heridas, desinfecta las herramientas y no riegues sobre las plantas con calor.",
  grav=3, contagia=True, alias=["Erwinia", "pudrición blanda"], wiki="Pectobacterium carotovorum")
P("Pudrición del corazón", "Hongo", ["hojas", "planta"],
  ["h_blandas", "h_caen", "p_olor", "h_manchas_marron"],
  ["riego_mucho", "frio", "lluvia"], ["orquidea", "suculenta", "canaria"],
  "El centro de la roseta (o el punto donde nacen las hojas en las orquídeas) se pone marrón y blando y las hojas se sueltan.",
  "Agua que se queda en el centro de la roseta o la corona con frío o poca ventilación.",
  "Corta lo podrido, espolvorea canela y deja secar. En Aeonium y echeverias, corta por debajo y enraíza lo sano.",
  "Riega al sustrato, no a la roseta, y seca con papel el agua que quede en la corona.",
  grav=3, alias=["pudrición de la corona", "podredumbre de la roseta"], wiki="Phytophthora")
P("Botritis (moho gris)", "Hongo", ["flores", "hojas", "frutos", "tallos"],
  ["f_moho", "t_moho", "fr_podridos", "h_manchas_marron", "f_manchas"],
  ["humedo", "frio", "lluvia"], ["flor", "huerto", "suculenta", "frutal"],
  "Moho gris y algodonoso sobre flores, hojas, tallos o frutos que se pudren.",
  "Humedad alta, frío y restos de flores u hojas marchitas.",
  "Quita las flores y partes dañadas, ventila y aplica un fungicida específico.",
  "Retira flores marchitas y hojas secas y no amontones las macetas.",
  grav=2, contagia=True, alias=["moho gris", "Botrytis"], wiki="Botrytis cinerea")
P("Mancha foliar bacteriana", "Bacteria", ["hojas"],
  ["h_manchas_aceite", "h_manchas_halo", "h_manchas_marron", "h_caen"],
  ["humedo", "lluvia", "calor"], ["interior", "tropical", "huerto", "flor"],
  "Manchas que empiezan acuosas o aceitosas y se vuelven negras con un halo amarillo.",
  "Agua sobre las hojas con calor y heridas.",
  "Corta las hojas afectadas, no mojes las hojas al regar y aplica cobre.",
  "Riega al pie y separa las plantas.",
  grav=2, contagia=True, alias=["bacteriosis", "Xanthomonas", "Pseudomonas"], wiki="Xanthomonas")
P("Manchas foliares por hongos", "Hongo", ["hojas"],
  ["h_manchas_marron", "h_manchas_anillo", "h_manchas_halo", "h_amar", "h_caen"],
  ["humedo", "lluvia"], ["todas"],
  "Manchas redondas marrones o negras, a menudo con anillos o un borde más oscuro, que se van juntando. Las hojas acaban cayendo.",
  "Hongos como Alternaria, Cercospora o Septoria favorecidos por hojas mojadas.",
  "Retira las hojas manchadas y aplica cobre o un fungicida de amplio espectro. Riega sin mojar las hojas.",
  "Ventila y no pulverices plantas que no lo necesitan.",
  grav=2, contagia=True, alias=["Alternaria", "Cercospora", "Septoria", "manchas negras"], wiki="Alternaria")
P("Mancha negra del rosal", "Hongo", ["hojas"],
  ["h_manchas_marron", "h_amar", "h_caen"],
  ["lluvia", "humedo"], ["arbusto", "flor"],
  "Manchas negras redondas de borde deshilachado en las hojas del rosal, que amarillean y caen.",
  "Hongo Diplocarpon rosae, con hojas mojadas durante horas.",
  "Retira y tira las hojas afectadas (también las caídas) y aplica un fungicida para rosales.",
  "Riega al pie y elige variedades resistentes.",
  grav=2, contagia=True, alias=["Diplocarpon"], wiki="Diplocarpon rosae")
P("Manchas fúngicas en cactus", "Hongo", ["tallos"],
  ["t_hundidas", "t_corcho", "t_naranja", "t_blanquecino"],
  ["humedo", "lluvia", "frio"], ["cactus", "suculenta"],
  "Manchas redondas hundidas, marrones o negras, a veces con puntitos oscuros, en el cuerpo de cactus y suculentas.",
  "Hongos como Phyllosticta o Bipolaris tras lluvias, rocío o riegos sobre la planta con frío.",
  "Corta las zonas afectadas si son pocas y aplica cobre. Mantén la planta seca y ventilada.",
  "Riega al sustrato y protege la colección de la lluvia prolongada en invierno.",
  grav=2, contagia=True, alias=["Phyllosticta", "manchas en cactus"], wiki="Phyllosticta")
P("Fumagina (negrilla)", "Hongo", ["hojas", "frutos"],
  ["h_hollin", "h_pegajosas", "fr_manchas"],
  ["humedo", "calor"], ["todas"],
  "Polvo negro como hollín sobre las hojas que se quita al frotar.",
  "Crece sobre la melaza que dejan pulgones, cochinillas o mosca blanca.",
  "Acaba primero con la plaga. Después limpia las hojas con agua y jabón potásico.",
  "Controla las plagas que producen melaza.",
  grav=1, alias=["negrilla", "hollín"], wiki="Fumagina")
P("Antracnosis", "Hongo", ["hojas", "frutos", "tallos"],
  ["h_manchas_marron", "fr_manchas", "t_hundidas", "fr_podridos"],
  ["lluvia", "humedo", "calor"], ["huerto", "frutal", "interior", "palmera", "tropical"],
  "Manchas hundidas de borde oscuro en hojas, tallos y frutos (aguacate, mango, judía, anturio).",
  "Lluvia o riego por aspersión con calor.",
  "Retira las partes afectadas y aplica un fungicida de cobre.",
  "Riega al pie y recoge los restos caídos.",
  grav=2, contagia=True, alias=["Colletotrichum"], wiki="Antracnosis")
P("Fusariosis", "Hongo", ["planta", "tallos"],
  ["p_un_lado", "t_vasos", "h_amar", "p_mustia", "t_negro_sube"],
  ["calor", "riego_mucho"], ["huerto", "cactus", "palmera", "flor"],
  "Amarilleo y marchitez de un solo lado de la planta. Al cortar el tallo se ven los vasos marrones.",
  "Hongo del suelo (Fusarium) que entra por las raíces y tapona los vasos.",
  "No tiene cura: aísla la planta, intenta salvar esquejes de la parte sana y desecha el sustrato.",
  "Usa sustrato nuevo y no reutilices tierra de plantas enfermas.",
  grav=3, contagia=True, alias=["Fusarium", "marchitez vascular"], wiki="Fusarium")
P("Mildiu", "Hongo", ["hojas", "frutos"],
  ["h_manchas_aceite", "h_pelusa_enves", "h_manchas_marron", "fr_manchas"],
  ["humedo", "lluvia"], ["huerto", "flor", "frutal"],
  "Manchas amarillentas y aceitosas en el haz y pelusa grisácea o blanca en el envés. En tomate, manchas pardas que avanzan rápido.",
  "Humedad alta y temperaturas suaves. Muy común en tomate, papa, vid y albahaca.",
  "Elimina las hojas afectadas y aplica cobre. Riega sin mojar las hojas.",
  "Deja espacio entre plantas y riega por la mañana al pie.",
  grav=2, contagia=True, alias=["mildeu"], wiki="Mildiu")
P("Agalla de la corona", "Bacteria", ["tallos", "raices"],
  ["t_bultos", "r_bultos", "p_no_crece"],
  ["exterior"], ["arbusto", "frutal", "flor"],
  "Bultos o tumores leñosos en la base del tallo o en las raíces.",
  "Bacteria del suelo (Agrobacterium) que entra por heridas.",
  "No tiene cura: retira la planta y no reutilices el sustrato.",
  "Evita heridas en la base al trasplantar.",
  grav=3, contagia=True, alias=["Agrobacterium", "tumor de la corona"], wiki="Agrobacterium tumefaciens")
P("Caída de plántulas", "Hongo", ["tallos", "planta"],
  ["t_inclinado", "t_base_blanda", "p_muere_rapido"],
  ["riego_mucho", "humedo", "frio"], ["huerto", "cactus", "flor", "todas"],
  "Las plántulas recién nacidas se doblan por la base, que está fina y oscura, y mueren en días.",
  "Hongos del suelo (damping-off) con semilleros encharcados, sin ventilación y con frío.",
  "Retira las plántulas afectadas, deja secar la superficie y ventila. Espolvorea canela sobre el semillero.",
  "Usa sustrato de semillero nuevo, riega por abajo y ventila cada día.",
  grav=2, contagia=True, alias=["damping-off", "mal del semillero"], wiki="Damping off")
P("Moho blanco sobre la tierra", "Hongo", ["raices"],
  ["s_moho", "s_mojado"],
  ["riego_mucho", "humedo", "poca_luz"], ["todas"],
  "Una pelusa blanca o grisácea sobre la superficie del sustrato. La planta suele estar bien.",
  "Hongos que descomponen la materia orgánica cuando la tierra está siempre húmeda y sin ventilación.",
  "Rasca la capa de arriba y tírala, deja secar más entre riegos y espolvorea canela. Es inofensivo si la planta está sana.",
  "Riega menos, ventila y cubre la tierra con arena o picón.",
  grav=1, alias=["moho en la tierra", "hongos en el sustrato"], wiki="Moho")
P("Gomosis", "Hongo", ["tallos"],
  ["t_gomoso", "t_hundidas", "h_amar", "h_caen"],
  ["riego_mucho", "sin_drenaje"], ["frutal"],
  "El tronco de cítricos o frutales de hueso suelta goma por grietas o manchas hundidas en la corteza.",
  "Phytophthora en el cuello por encharcamiento o tierra pegada al tronco.",
  "Raspa la corteza afectada hasta tejido sano, aplica pasta de cobre y despeja la tierra del cuello.",
  "Riega lejos del tronco y no entierres el injerto.",
  grav=3, alias=["exudación de goma"], wiki="Gomosis")
P("Sarna o moteado", "Hongo", ["frutos", "hojas"],
  ["fr_manchas", "h_manchas_marron", "fr_rajados"],
  ["lluvia", "humedo"], ["frutal"],
  "Costras o manchas oscuras y ásperas en la piel de los frutos y manchas en las hojas.",
  "Hongos (Venturia y otros) en primaveras húmedas.",
  "Recoge las hojas caídas y aplica cobre al brotar.",
  "Poda para airear la copa.",
  grav=1, alias=["moteado", "Venturia"], wiki="Venturia inaequalis")
P("Monilia", "Hongo", ["frutos", "flores"],
  ["fr_podridos", "fr_caen", "f_moho"],
  ["humedo", "lluvia"], ["frutal"],
  "Frutos que se pudren con círculos de moho gris o crema y se quedan secos y arrugados en la rama.",
  "Hongo Monilinia que entra por heridas y picaduras.",
  "Retira y destruye los frutos afectados y momificados. Fungicida de cobre en floración si se repite.",
  "No dejes fruta podrida en el árbol ni en el suelo.",
  grav=2, contagia=True, alias=["podredumbre parda", "Monilinia"], wiki="Monilinia")
# ===========================================================================
# Virus
# ===========================================================================
P("Virus del mosaico", "Virus", ["hojas", "flores"],
  ["h_mosaico", "h_rizadas", "h_manchas_anillo", "f_deformes", "p_no_crece"],
  ["exterior"], ["huerto", "flor", "interior"],
  "Manchas claras en mosaico, anillos, rayas y hojas deformes. La planta crece poco.",
  "Virus transmitidos por pulgones, trips, herramientas o manos.",
  "No tiene cura: aísla o elimina la planta y desinfecta tijeras y manos.",
  "Controla pulgón y trips y desinfecta las herramientas entre plantas.",
  grav=3, contagia=True, alias=["mosaico", "virosis"], wiki="Virus del mosaico del tabaco")
P("Virus del bronceado del tomate", "Virus", ["hojas", "frutos"],
  ["h_manchas_anillo", "h_manchas_marron", "fr_manchas", "p_no_crece"],
  ["exterior", "calor"], ["huerto", "flor"],
  "Hojas con anillos y manchas bronceadas y frutos con anillos amarillos o deformes.",
  "Virus TSWV transmitido por los trips.",
  "Arranca las plantas afectadas y controla los trips.",
  "Trampas azules y control de trips desde el principio.",
  grav=3, contagia=True, alias=["TSWV", "bronceado"], wiki="Tomato spotted wilt virus")
# ===========================================================================
# Fisiopatías y errores de cultivo
# ===========================================================================
P("Exceso de riego", "Fisiopatía", ["hojas", "planta", "raices"],
  ["h_amar_abajo", "h_blandas", "s_mojado", "p_mustia", "h_amar", "h_caen", "h_lacias"],
  ["riego_mucho", "sin_drenaje", "poca_luz", "frio"], ["todas"],
  "Hojas de abajo amarillas y blandas, en suculentas translúcidas e hinchadas, tierra siempre húmeda y planta decaída.",
  "Riegos demasiado frecuentes, sobre todo con frío, poca luz o maceta sin drenaje.",
  "Deja de regar hasta que se seque bien la tierra, vacía el plato y retira las hojas dañadas. Si no mejora, revisa las raíces.",
  "Riega según la época y comprueba con un palillo que el sustrato está seco.",
  grav=2, alias=["hojas amarillas por riego", "encharcamiento", "riego excesivo"], wiki="Encharcamiento")
P("Falta de riego", "Fisiopatía", ["hojas", "planta", "tallos"],
  ["h_arrugadas", "h_lacias", "h_puntas_secas", "t_arrugado", "s_seca_rapido", "p_mustia", "h_caen", "h_amar_abajo"],
  ["riego_poco", "calor"], ["todas"],
  "Hojas arrugadas, lacias o con puntas secas, cactus deshinchados y tierra seca como polvo que se separa de la maceta.",
  "Riegos escasos, calor, maceta pequeña o de barro al sol.",
  "Riega a fondo, mejor por inmersión 15-20 minutos si el sustrato no empapa. En cactus muy arrugados, comprueba que las raíces siguen vivas.",
  "Ajusta el riego a la época y agrupa las macetas en verano.",
  grav=2, alias=["sed", "sequía", "deshidratación"], wiki="Estrés hídrico")
P("Sustrato que no empapa", "Fisiopatía", ["raices", "planta"],
  ["s_no_absorbe", "s_seca_rapido", "p_mustia", "h_arrugadas"],
  ["riego_poco", "calor"], ["todas"],
  "El agua resbala por los lados y sale enseguida por abajo; el cepellón sigue seco por dentro.",
  "La turba y la fibra de coco se vuelven repelentes al agua cuando se secan del todo.",
  "Sumerge la maceta en un barreño 20-30 minutos hasta que dejen de salir burbujas. Si se repite, trasplanta a un sustrato más mineral.",
  "No dejes que el sustrato orgánico se seque del todo durante semanas.",
  grav=1, alias=["sustrato hidrófobo", "el agua no entra"], wiki="Sustrato")
P("Edema", "Fisiopatía", ["hojas"],
  ["h_costras", "h_blandas"],
  ["riego_mucho", "frio", "humedo"], ["suculenta", "interior", "flor"],
  "Costras, bultitos o verrugas corchosas en el envés o en la piel de suculentas.",
  "La planta absorbe más agua de la que transpira: riego abundante con frío o poca ventilación.",
  "Reduce el riego y mejora la ventilación. Las marcas no desaparecen, pero no salen más.",
  "Riega menos en invierno.",
  grav=1, alias=["oedema", "corcho en hojas"], wiki="Edema (botánica)")
P("Etiolación", "Fisiopatía", ["planta", "tallos", "hojas"],
  ["t_estirado", "h_palidas", "h_pequenas", "t_inclinado"],
  ["poca_luz", "abono"], ["cactus", "suculenta", "interior", "canaria"],
  "Tallos pálidos y estirados, rosetas abiertas, hojas separadas y la planta inclinada hacia la ventana. Los cactus se afinan por arriba.",
  "Falta de luz, a veces con exceso de riego y abono.",
  "Llévala a un sitio más luminoso poco a poco. Lo estirado no vuelve atrás: puedes descabezar y replantar la parte alta.",
  "Dale la luz que pide su especie y gira la maceta cada semana.",
  grav=1, alias=["ahilamiento", "estiramiento", "falta de luz"], wiki="Etiolación")
P("Quemadura solar", "Fisiopatía", ["hojas", "tallos"],
  ["h_quemadas", "t_blanquecino", "t_corcho", "h_manchas_marron"],
  ["sol_nuevo", "calor", "exterior"], ["todas"],
  "Zonas blancas, amarillas o marrones con textura de papel en la cara que mira al sol. En cactus, manchas blanquecinas que luego se vuelven corcho.",
  "Paso brusco de sombra a pleno sol o golpes de calor en la azotea.",
  "Pon malla de sombreo o llévala a semisombra y aclimata poco a poco (1-2 horas más de sol por semana). Las cicatrices se quedan.",
  "Aclimata siempre al sol las plantas que vienen de vivero o de interior.",
  grav=1, alias=["golpe de sol", "insolación"], wiki="Quemadura solar")
P("Daño por frío", "Fisiopatía", ["hojas", "tallos", "planta"],
  ["h_blandas", "h_manchas_marron", "h_caen", "t_base_blanda", "p_muere_rapido"],
  ["frio", "exterior", "riego_mucho"], ["tropical", "suculenta", "cactus", "interior"],
  "Hojas que se vuelven translúcidas, oscuras o blandas de un día para otro tras una noche fría.",
  "Temperaturas por debajo de la mínima de la especie, peor con el sustrato mojado.",
  "No cortes enseguida: espera unos días a ver qué parte se recupera, sin regar. Luego retira lo muerto.",
  "Mete o protege las plantas sensibles en las noches frías y riega menos en invierno.",
  grav=2, alias=["helada", "congelación"], wiki="Helada")
P("Choque por cambio de sitio", "Fisiopatía", ["hojas", "planta", "flores"],
  ["h_caen_verdes", "h_caen", "f_capullos_caen", "h_amar"],
  ["movida", "nueva", "frio"], ["interior", "tropical", "flor"],
  "Pierde muchas hojas en pocos días sin plaga visible, a menudo verdes. Típico de ficus y plantas recién compradas.",
  "Cambio brusco de luz, temperatura o corrientes.",
  "Déjala en un sitio estable y luminoso, sin moverla ni abonarla hasta que brote de nuevo. Riega con moderación.",
  "Elige el sitio definitivo y no la cambies a menudo.",
  grav=1, alias=["choque térmico", "estrés por traslado", "aclimatación"], wiki="Estrés vegetal")
P("Estrés por trasplante", "Fisiopatía", ["planta", "hojas"],
  ["p_mustia", "h_lacias", "h_caen", "h_amar"],
  ["trasplante"], ["todas"],
  "Planta decaída o con algunas hojas amarillas en los días siguientes al trasplante.",
  "Raíces dañadas al cambiar de maceta.",
  "Ponla en semisombra, sin abonar, y riega con moderación. En cactus, no riegues hasta una semana después.",
  "Trasplanta en su época de crecimiento y con cuidado del cepellón.",
  grav=1, alias=["trasplante"], wiki="Trasplante (botánica)")
P("Clorosis férrica", "Fisiopatía", ["hojas"],
  ["h_amar_nervios", "h_amar_jovenes", "h_palidas"],
  ["agua_dura"], ["frutal", "arbusto", "flor", "interior", "orquidea"],
  "Hojas jóvenes amarillas con los nervios verdes muy marcados.",
  "Agua o suelo calizos que impiden absorber el hierro. Muy típico en cítricos, hortensias, azaleas y gardenias.",
  "Aplica quelato de hierro y riega con agua de lluvia, reposada o con unas gotas de vinagre.",
  "Usa sustrato ácido en plantas acidófilas.",
  grav=1, alias=["falta de hierro", "carencia de hierro"], wiki="Clorosis")
P("Falta de nitrógeno", "Fisiopatía", ["hojas", "planta"],
  ["h_amar_abajo", "h_palidas", "p_no_crece", "h_pequenas"],
  ["riego_mucho"], ["todas"],
  "Planta pálida, verde claro, que amarillea de abajo arriba y crece poco.",
  "Sustrato agotado tras años sin trasplante ni abono.",
  "Abona en temporada de crecimiento o renueva el sustrato.",
  "Abona en su temporada según la guía de la especie.",
  grav=1, alias=["carencia de nitrógeno", "falta de abono", "hambre"], wiki="Nitrógeno")
P("Falta de magnesio", "Fisiopatía", ["hojas"],
  ["h_amar_nervios", "h_amar_abajo", "h_rojizas"],
  [], ["palmera", "frutal", "huerto"],
  "Amarilleo entre los nervios de las hojas viejas, a veces con tonos rojizos. En palmeras, puntas de las hojas viejas amarillas.",
  "Sustrato pobre o exceso de potasio.",
  "Aplica sulfato de magnesio (sales de Epsom): una cucharadita por litro, una vez al mes en temporada.",
  "Usa un abono completo con micronutrientes.",
  grav=1, alias=["carencia de magnesio"], wiki="Magnesio")
P("Falta de potasio", "Fisiopatía", ["hojas", "frutos"],
  ["h_puntas_secas", "h_manchas_marron", "fr_caen"],
  [], ["palmera", "frutal", "huerto"],
  "Bordes de las hojas viejas que se secan como quemados y manchitas marrones. Frutos pequeños.",
  "Sustrato pobre o abono solo nitrogenado.",
  "Abono rico en potasio o ceniza de madera en pequeña cantidad.",
  "Alterna abonos de crecimiento y de floración.",
  grav=1, alias=["carencia de potasio"], wiki="Potasio")
P("Exceso de sales o abono", "Fisiopatía", ["hojas", "raices"],
  ["h_puntas_secas", "s_costra", "h_manchas_marron", "h_lacias"],
  ["abono", "agua_dura"], ["todas"],
  "Puntas y bordes de las hojas marrones y una costra blanca sobre la tierra o el borde de la maceta.",
  "Exceso de abono o agua muy dura que acumula sales.",
  "Lava el sustrato con mucha agua sin cal (que salga abundante por abajo) y deja de abonar un mes.",
  "Abona a la mitad de dosis y lava el sustrato de vez en cuando.",
  grav=1, alias=["salinidad", "quemadura por abono", "intoxicación por sales"], wiki="Salinidad del suelo")
P("Asfixia radicular", "Fisiopatía", ["planta", "hojas", "raices"],
  ["h_caen_verdes", "p_mustia", "s_mojado", "h_amar"],
  ["sin_drenaje", "riego_mucho"], ["todas"],
  "Caída de hojas verdes y planta mustia con el sustrato húmedo. Las raíces aún no están podridas.",
  "Encharcamiento, plato siempre con agua o sustrato compactado.",
  "Vacía el plato, deja secar y trasplanta a un sustrato más aireado si es compacto.",
  "Nunca dejes agua en el plato más de 15 minutos.",
  grav=2, alias=["falta de oxígeno", "encharcamiento"], wiki="Anoxia")
P("Rajaduras", "Fisiopatía", ["tallos", "frutos"],
  ["t_rajado", "fr_rajados", "t_corcho"],
  ["riego_mucho", "riego_poco", "lluvia"], ["cactus", "suculenta", "huerto", "frutal"],
  "El cuerpo del cactus, el tallo o el fruto se abre a lo largo.",
  "Un riego o lluvia abundante después de una sequía larga: la planta se hincha más rápido de lo que crece la piel.",
  "Deja cicatrizar en seco y espolvorea canela. Luego riega de forma regular.",
  "Evita alternar sequías largas con riegos muy abundantes.",
  grav=1, alias=["grietas", "rajado", "splitting"], wiki="Fisiopatía vegetal")
P("Puntas secas por ambiente seco", "Fisiopatía", ["hojas"],
  ["h_puntas_secas", "h_manchas_marron"],
  ["calor", "riego_poco", "agua_dura"], ["interior", "tropical", "palmera", "helecho"],
  "Las puntas de las hojas se secan y se vuelven marrones, poco a poco.",
  "Ambiente seco, calefacción o aire acondicionado, agua con cloro o sales.",
  "Sube la humedad (plato con piedras y agua), usa agua reposada y corta las puntas siguiendo la forma de la hoja.",
  "Aleja la planta de radiadores y aire acondicionado.",
  grav=1, alias=["puntas marrones", "puntas secas"], wiki="Necrosis")
P("Viento y salitre", "Fisiopatía", ["hojas"],
  ["h_puntas_secas", "h_manchas_marron", "h_quemadas", "h_rizadas"],
  ["costa", "exterior"], ["todas"],
  "Bordes y puntas quemados en la cara expuesta al viento, a veces con hojas rotas o rizadas.",
  "Viento fuerte y sal marina en terrazas y azoteas cerca de la costa.",
  "Lava las hojas con agua dulce después de días de viento y pon una protección cortavientos.",
  "Elige especies costeras (tabaibas, siemprevivas, verodes) para los sitios expuestos.",
  grav=1, alias=["maresía", "viento", "sal"], wiki="Aerosol marino")
P("Fitotoxicidad", "Fisiopatía", ["hojas"],
  ["h_manchas_marron", "h_quemadas", "h_rizadas", "h_amar"],
  ["producto", "calor"], ["todas"],
  "Manchas o quemaduras que aparecen justo después de pulverizar un producto (también aceites o jabón al sol).",
  "Producto demasiado concentrado, aplicado al sol o con calor, o no apto para esa planta.",
  "Lava las hojas con agua y deja que la planta se recupere. Las hojas dañadas no se recuperan.",
  "Pulveriza siempre al atardecer, respeta la dosis y prueba antes en una hoja.",
  grav=1, alias=["quemadura por producto", "daño por tratamiento"], wiki="Fitotoxicidad")
P("Raíces apretadas", "Fisiopatía", ["raices", "planta"],
  ["r_salen", "s_seca_rapido", "p_no_crece", "h_amar_abajo"],
  [], ["todas"],
  "Salen raíces por los agujeros, el agua se seca enseguida y la planta deja de crecer.",
  "La maceta se ha quedado pequeña.",
  "Trasplanta en su época de crecimiento a una maceta 2-4 cm más ancha. Usa la herramienta Comprobación de maceta.",
  "Revisa la maceta cada 1-2 años.",
  grav=1, alias=["maceta pequeña", "enraizada"], wiki="Trasplante (botánica)")
P("Renovación natural de hojas", "Fisiopatía", ["hojas"],
  ["h_amar_abajo", "h_caen", "h_arrugadas"],
  [], ["suculenta", "cactus", "interior", "palmera", "canaria"],
  "Solo las hojas más viejas, las de abajo, se secan una a una mientras la planta saca hojas nuevas sanas.",
  "Es normal: la planta recicla sus hojas viejas. En Aeonium y tabaibas es muy marcado al llegar el verano.",
  "No hay que hacer nada. Retira las hojas secas para que no acumulen humedad.",
  "Ninguna: es parte de su ciclo.",
  grav=1, alias=["hojas viejas", "es normal"], wiki="Senescencia")
P("Coloración por estrés", "Rareza", ["hojas", "tallos"],
  ["h_rojizas", "t_naranja"],
  ["sol_nuevo", "frio", "riego_poco"], ["suculenta", "cactus", "canaria"],
  "Las suculentas o cactus se ponen rojizos, naranjas o morados, sin manchas ni zonas blandas.",
  "Respuesta de la planta a mucho sol, frío o poca agua: produce pigmentos protectores.",
  "No es un problema; muchos aficionados lo buscan. Solo vigila que no aparezcan zonas secas de quemadura.",
  "Ninguna.",
  grav=1, alias=["enrojecimiento", "hojas rojas"], wiki="Antocianina")
P("Caída de capullos", "Fisiopatía", ["flores"],
  ["f_capullos_caen"],
  ["movida", "riego_poco", "poca_luz", "frio"], ["flor", "interior", "cactus", "orquidea"],
  "Los capullos se caen antes de abrirse.",
  "Cambios de sitio, falta de luz, sequía o corrientes durante la floración. Muy típico del cactus de Navidad.",
  "No muevas la planta mientras tiene capullos y mantén el riego regular.",
  "Elige el sitio antes de que forme capullos.",
  grav=1, alias=["capullos que caen", "botones que caen"], wiki="Abscisión")
P("No florece", "Fisiopatía", ["flores", "planta"],
  ["f_no_florece", "p_no_crece"],
  ["poca_luz", "abono"], ["todas"],
  "La planta crece sana pero no echa flores.",
  "Poca luz, exceso de nitrógeno, planta joven o falta de un reposo invernal fresco y seco (cactus).",
  "Más luz, abono rico en potasio y, en cactus, invierno fresco y casi sin riego.",
  "Respeta el reposo de cada especie.",
  grav=1, alias=["no da flores", "sin flores"], wiki="Floración")
P("Flores que duran poco", "Fisiopatía", ["flores"],
  ["f_duran_poco", "f_manchas"],
  ["calor", "riego_poco"], ["flor", "cactus", "orquidea"],
  "Las flores se arrugan o se secan en pocos días.",
  "Calor, sol directo fuerte o falta de agua en floración.",
  "Protégela del sol de mediodía y mantén el sustrato húmedo mientras florece.",
  "Ponla en un sitio algo más fresco cuando esté en flor.",
  grav=1, alias=["flores marchitas"], wiki="Flor")
P("Frutos que caen", "Fisiopatía", ["frutos"],
  ["fr_caen", "fr_no_cuajan"],
  ["riego_poco", "calor", "abono"], ["huerto", "frutal"],
  "Los frutos se caen pequeños o sin madurar.",
  "Falta de polinización, sequía, calor o demasiados frutos para la planta.",
  "Riego regular, abono con potasio y aclareo de frutos si hay demasiados.",
  "Riega de forma constante en floración y cuajado.",
  grav=1, alias=["caída de frutos"], wiki="Fruto")
P("Falta de polinización", "Fisiopatía", ["frutos", "flores"],
  ["fr_no_cuajan", "fr_caen"],
  ["poca_luz", "calor"], ["huerto", "frutal"],
  "Florece mucho pero las flores femeninas se caen o el fruto se queda pequeño y se pudre por la punta (calabacín, pepino).",
  "Pocos insectos polinizadores, sobre todo en balcones y azoteas, o calor extremo.",
  "Poliniza a mano: pasa un pincel de la flor macho a la hembra por la mañana.",
  "Planta flores que atraigan abejas cerca del huerto.",
  grav=1, alias=["no cuaja", "no da fruto"], wiki="Polinización")
P("Podredumbre apical", "Fisiopatía", ["frutos"],
  ["fr_punta_negra", "fr_podridos"],
  ["riego_poco", "calor"], ["huerto"],
  "Mancha negra y hundida en la punta de tomates y pimientos.",
  "Falta de calcio en el fruto por riegos irregulares.",
  "Riega de forma regular y acolcha el sustrato para que no se seque.",
  "Riego constante en verano.",
  grav=1, alias=["culo negro", "peseta"], wiki="Podredumbre apical")
P("Manchas de cal", "Fisiopatía", ["hojas"],
  ["h_polvo_blanco", "h_manchas_marron"],
  ["agua_dura", "lluvia"], ["todas"],
  "Manchas o puntos blancos secos en las hojas que aparecen después de pulverizar o regar por encima. A diferencia del oídio, no es polvo que crezca: son restos de cal que se quitan con un paño con vinagre.",
  "Agua del grifo con mucha cal que se seca sobre las hojas.",
  "Limpia las hojas con un paño humedecido en agua con unas gotas de vinagre. No es dañino.",
  "Pulveriza con agua de lluvia, destilada o reposada.",
  grav=1, alias=["manchas blancas", "cal en las hojas"], wiki="Agua dura")
P("Enrollado de hojas", "Fisiopatía", ["hojas"],
  ["h_rizadas", "h_lacias"],
  ["calor", "riego_poco", "sol_nuevo"], ["huerto", "tropical", "interior"],
  "Las hojas se enrollan hacia arriba o hacia dentro sin manchas ni bichos (tomateras, calatheas, marantas).",
  "Calor, sol fuerte o falta de agua: la planta reduce la superficie para no perder agua.",
  "Riega, da sombra en las horas de más calor y sube la humedad en las tropicales.",
  "Riego regular en verano y semisombra para las tropicales.",
  grav=1, alias=["hojas enrolladas", "hojas que se cierran"], wiki="Estrés hídrico")
P("Mosquito verde", "Plaga", ["plagas", "hojas"],
  ["h_punteado", "h_amar", "h_rizadas", "p_vuelan"],
  ["exterior", "calor"], ["huerto", "flor", "arbusto", "frutal"],
  "Punteado blanquecino en las hojas, bordes que amarillean y se rizan, e insectos verdes pequeños que saltan de lado.",
  "Cicadélidos (Empoasca) en verano.",
  "Jabón potásico y aceite de neem en el envés. Trampas amarillas.",
  "Revisa el envés en verano.",
  grav=1, contagia=True, alias=["cicadélidos", "Empoasca", "chicharrita"], wiki="Cicadellidae")
P("Verticilosis", "Hongo", ["planta", "tallos", "hojas"],
  ["p_un_lado", "t_vasos", "h_amar", "h_lacias", "p_mustia"],
  ["calor", "exterior"], ["huerto", "frutal", "arbusto"],
  "Ramas o partes de la planta que se marchitan de golpe, hojas amarillas en un lado y vasos marrones al cortar el tallo. Muy típica en olivos y tomateras.",
  "Hongo del suelo (Verticillium) que entra por las raíces.",
  "Poda las ramas afectadas hasta madera sana, desinfecta las tijeras y no reutilices la tierra. En huerto, arranca la planta.",
  "Rota cultivos y no plantes tomate, berenjena o pimiento en la misma tierra años seguidos.",
  grav=3, contagia=True, alias=["Verticillium"], wiki="Verticillium")
P("Chancro", "Hongo", ["tallos"],
  ["t_hundidas", "t_gomoso", "t_corcho", "p_mustia"],
  ["humedo", "lluvia"], ["arbusto", "frutal", "canaria"],
  "Heridas hundidas en ramas y troncos, con la corteza agrietada y a veces goma. Lo que queda por encima se seca.",
  "Hongos o bacterias que entran por cortes de poda y heridas.",
  "Corta la rama por debajo de la herida, hasta madera sana, y sella el corte. Desinfecta las tijeras.",
  "Poda con tijeras limpias y en tiempo seco.",
  grav=2, contagia=True, alias=["cancro"], wiki="Cancro (botánica)")
# ===========================================================================
# Rarezas
# ===========================================================================
P("Cristación (fasciación)", "Rareza", ["tallos"],
  ["t_cresta"],
  [], ["cactus", "suculenta"],
  "El punto de crecimiento se alarga y forma una cresta en abanico o en forma de cerebro.",
  "Mutación o daño en la yema; muy buscada en cactus de colección.",
  "No es un problema. Si salen tallos normales, córtalos para mantener la cresta.",
  "Ninguna.",
  grav=1, alias=["cristata", "fasciación"], wiki="Fasciación")
P("Gutación", "Rareza", ["hojas"],
  ["h_gotas"],
  ["riego_mucho", "humedo"], ["interior", "tropical"],
  "Gotas de agua en las puntas de las hojas por la mañana.",
  "La planta expulsa el agua sobrante durante la noche.",
  "Es normal. Si es muy frecuente, riega un poco menos.",
  "Ninguna.",
  grav=1, alias=["gotas en las hojas", "lloran"], wiki="Gutación")
P("Reversión de variegado", "Rareza", ["hojas"],
  ["h_variegado"],
  ["poca_luz"], ["interior", "tropical", "suculenta"],
  "En una planta variegada salen hojas o tallos totalmente verdes.",
  "Poca luz o inestabilidad genética de la variedad.",
  "Corta los tallos verdes y dale más luz indirecta.",
  "Dale buena luz indirecta.",
  grav=1, alias=["pierde las manchas", "variegada"], wiki="Variegación")


# ---------------------------------------------------------------------------
def slug(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    raiz = pathlib.Path(__file__).resolve().parent.parent
    errores, ids, out = [], set(), []
    for p in PROBLEMAS:
        for s in p["s"]:
            if s not in SINTOMAS:
                errores.append(f"{p['nombre']}: síntoma desconocido «{s}»")
        for c in p["c"]:
            if c not in CONDICIONES:
                errores.append(f"{p['nombre']}: situación desconocida «{c}»")
        for t in p["plantas"]:
            if t not in PLANTAS:
                errores.append(f"{p['nombre']}: tipo de planta desconocido «{t}»")
        d = dict(p)
        d["id"] = slug(p["nombre"])
        if d["id"] in ids:
            errores.append(f"Problema repetido: {p['nombre']}")
        ids.add(d["id"])
        d["url"] = "https://es.wikipedia.org/wiki/" + d.pop("wiki").replace(" ", "_")
        out.append(d)
    usados = {s for p in PROBLEMAS for s in p["s"]}
    for s in SINTOMAS:
        if s not in usados:
            errores.append(f"Síntoma sin ningún problema: {s}")
    if errores:
        raise SystemExit("\n".join(errores))
    datos = {
        "partes": PARTES_SINTOMA,
        "sintomas": {k: {"parte": v[0], "nombre": v[1]} for k, v in SINTOMAS.items()},
        "condiciones": CONDICIONES,
        "plantas": PLANTAS,
        "problemas": out,
    }
    (raiz / "data" / "enfermedades.json").write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(out)} problemas, {len(SINTOMAS)} síntomas, {len(CONDICIONES)} situaciones → data/enfermedades.json")


if __name__ == "__main__":
    main()
