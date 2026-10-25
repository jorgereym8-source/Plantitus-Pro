/* Contenido fijo de Plantitus Pro: colecciones, selección del mes, remedios
 * caseros, tipos de tarea y partes de la planta para el diagnóstico. */

/* Tipos de tarea. «cada» es el intervalo por defecto en días cuando no lo marca la especie. */
export const TIPOS = {
  riego: { nombre: 'Riego', verbo: 'Regar', icono: 'regadera', color: '#3aa8f5', cada: 7 },
  abono: { nombre: 'Abono', verbo: 'Abonar', icono: 'abono', color: '#9b6bff', cada: 21 },
  pulverizar: { nombre: 'Pulverizar', verbo: 'Pulverizar', icono: 'spray', color: '#1fc6c6', cada: 3 },
  rotar: { nombre: 'Girar maceta', verbo: 'Girar', icono: 'rotar', color: '#f2a93b', cada: 14 },
  limpiar: { nombre: 'Limpiar hojas', verbo: 'Limpiar', icono: 'hoja', color: '#5cc66a', cada: 30 },
  revisar: { nombre: 'Revisar plagas', verbo: 'Revisar', icono: 'lupa', color: '#e2604d', cada: 14 },
  poda: { nombre: 'Poda', verbo: 'Podar', icono: 'tijeras', color: '#d27bd8', cada: 180 },
  trasplante: { nombre: 'Trasplante', verbo: 'Trasplantar', icono: 'maceta', color: '#ef7d36', cada: 730 },
};

/* Problemas típicos de cada grupo, por nombre de la guía de Diagnóstico. */
export const PROBLEMAS_GRUPO = {
  cactus: ['Podredumbre radicular', 'Pudrición del cuello', 'Cochinilla algodonosa', 'Etiolación', 'Quemadura solar', 'No florece'],
  cactus_delicado: ['Pudrición del cuello', 'Podredumbre radicular', 'Cochinilla algodonosa', 'Rajaduras', 'Quemadura solar'],
  cactus_selva: ['Caída de capullos', 'Podredumbre radicular', 'Cochinilla algodonosa', 'Quemadura solar'],
  suculenta: ['Podredumbre radicular', 'Etiolación', 'Cochinilla algodonosa', 'Quemadura solar', 'Pulgón'],
  suculenta_invernal: ['Etiolación', 'Pudrición del cuello', 'Cochinilla algodonosa', 'Quemadura solar'],
  tabaiba: ['Cochinilla algodonosa', 'Podredumbre radicular', 'Quemadura solar'],
  mesemb: ['Podredumbre radicular', 'Rajaduras', 'Etiolación', 'Araña roja'],
  mesemb_invernal: ['Podredumbre radicular', 'Rajaduras', 'Etiolación'],
  caudex: ['Podredumbre radicular', 'Araña roja', 'Cochinilla algodonosa', 'Choque térmico'],
  interior: ['Hojas amarillas por exceso de riego', 'Puntas secas', 'Cochinilla algodonosa', 'Araña roja', 'Mosca del sustrato'],
  tropical: ['Puntas secas', 'Araña roja', 'Hojas amarillas por exceso de riego', 'Choque térmico', 'Trips'],
  helecho: ['Puntas secas', 'Cochinilla de escudo', 'Exceso de sales'],
  orquidea: ['Podredumbre radicular', 'Caída de capullos', 'No florece', 'Cochinilla algodonosa'],
  bromelia: ['Podredumbre radicular', 'Cochinilla de escudo', 'Quemadura solar'],
  tillandsia: ['Podredumbre radicular', 'Puntas secas'],
  palmera: ['Puntas secas', 'Araña roja', 'Cochinilla de escudo', 'Picudo y escarabajos'],
  aromatica: ['Oídio', 'Pulgón', 'Mosca blanca', 'Podredumbre radicular'],
  huerto: ['Pulgón', 'Mosca blanca', 'Oídio', 'Mildiu', 'Polilla del tomate', 'Podredumbre apical'],
  flor: ['Pulgón', 'Oídio', 'Botritis (moho gris)', 'Roya', 'Caracoles y babosas'],
  arbusto: ['Pulgón', 'Cochinilla algodonosa', 'Clorosis férrica', 'Oídio'],
  arbusto_canario: ['Pulgón', 'Cochinilla algodonosa', 'Asfixia radicular'],
  arbol: ['Cochinilla de escudo', 'Fumagina (negrilla)', 'Clorosis férrica'],
  carnivora: ['Exceso de sales', 'Pulgón', 'Botritis (moho gris)'],
  trepadora: ['Pulgón', 'Mosca blanca', 'Araña roja', 'Oídio'],
  bulbosa: ['Podredumbre radicular', 'No florece', 'Pulgón'],
};

/* Partes de la planta en «Enfermedades comunes». */
export const PARTES = [
  { id: 'planta', nombre: 'Planta', icono: 'maceta', fondo: ['#fff1c9', '#ffd56b'] },
  { id: 'hojas', nombre: 'Hojas', icono: 'hoja', fondo: ['#dff7c8', '#8fd96a'] },
  { id: 'tallos', nombre: 'Tallos', icono: 'tallo', fondo: ['#e6ecd9', '#9fb57d'] },
  { id: 'flores', nombre: 'Flores', icono: 'flor', fondo: ['#fbe0f1', '#f19ad0'] },
  { id: 'frutos', nombre: 'Frutos', icono: 'fruto', fondo: ['#ffe0d6', '#ff8e6e'] },
  { id: 'plagas', nombre: 'Plagas', icono: 'bicho', fondo: ['#e1f3ff', '#7fc3f2'] },
];

/* «Un hogar verde»: colecciones del buscador. foto = especie cuya imagen se usa. */
export const COLECCIONES = [
  { id: 'sueno', nombre: 'Mejoran el sueño', foto: 'Lavandula angustifolia', filtro: (e) => e.tags.includes('sueno') },
  { id: 'aire', nombre: 'Purifican el aire', foto: 'Dracaena trifasciata', filtro: (e) => e.tags.includes('aire') },
  { id: 'sombra', nombre: 'Aman la sombra', foto: 'Aspidistra elatior', filtro: (e) => e.tags.includes('sombra') || e.luz === 'sombra' },
  { id: 'canarias', nombre: 'Flora canaria', foto: 'Echium wildpretii', filtro: (e) => e.tags.some((t) => t === 'end' || t === 'nat' || t === 'mac') },
  { id: 'endemicas', nombre: 'Endemismos canarios', foto: 'Aeonium tabuliforme', filtro: (e) => e.tags.includes('end') },
  { id: 'suculentas', nombre: 'Suculentas', foto: 'Echeveria elegans', filtro: (e) => ['suculenta', 'suculenta_invernal', 'tabaiba', 'mesemb', 'mesemb_invernal', 'caudex'].includes(e.grupo) },
  { id: 'cactus', nombre: 'Cactus', foto: 'Astrophytum myriostigma', filtro: (e) => e.grupo.startsWith('cactus') },
  { id: 'mascotas', nombre: 'Seguras con mascotas', foto: 'Chlorophytum comosum', filtro: (e) => !e.tags.includes('tox') && e.tags.includes('int') },
  { id: 'colgantes', nombre: 'Colgantes', foto: 'Curio rowleyanus', filtro: (e) => e.tags.includes('colg') },
  { id: 'faciles', nombre: 'Para principiantes', foto: 'Epipremnum aureum', filtro: (e) => e.dificultad === 'F' && e.tags.includes('int') },
  { id: 'comestibles', nombre: 'Comestibles', foto: 'Solanum lycopersicum', filtro: (e) => e.tags.includes('com') },
  { id: 'aromaticas', nombre: 'Aromáticas', foto: 'Salvia rosmarinus', filtro: (e) => e.tags.includes('arom') },
];

/* Selección del mes (por nombre científico). Enero = 1. */
export const SELECCION = {
  1: ['Aeonium arboreum', 'Pericallis x hybrida', 'Kalanchoe blossfeldiana', 'Euphorbia atropurpurea', 'Jasminum polyanthum', 'Clivia miniata'],
  2: ['Camellia japonica', 'Echium decaisnei', 'Retama rhodorhizoides', 'Hyacinthus orientalis', 'Aeonium holochrysum', 'Parodia haselbergii'],
  3: ['Echium virescens', 'Lotus berthelotii', 'Argyranthemum frutescens', 'Hatiora gaertneri', 'Pericallis cruenta', 'Mammillaria hahniana'],
  4: ['Echium simplex', 'Rebutia minuscula', 'Lavandula stoechas', 'Gerbera jamesonii', 'Strelitzia reginae', 'Echinopsis chamaecereus'],
  5: ['Echium wildpretii', 'Spartocytisus supranubius', 'Jacaranda mimosifolia', 'Ocimum basilicum', 'Solanum lycopersicum', 'Astrophytum myriostigma'],
  6: ['Epiphyllum oxypetalum', 'Hoya carnosa', 'Lavandula angustifolia', 'Isoplexis canariensis', 'Portulaca grandiflora', 'Echinocactus grusonii'],
  7: ['Delonix regia', 'Hydrangea macrophylla', 'Stapelia gigantea', 'Bougainvillea glabra', 'Copiapoa cinerea', 'Selenicereus undatus'],
  8: ['Coryphantha elephantidens', 'Huernia zebrina', 'Hibiscus rosa-sinensis', 'Agave victoriae-reginae', 'Dracaena draco', 'Plumbago auriculata'],
  9: ['Lithops lesliei', 'Caralluma burchardii', 'Ariocarpus fissuratus', 'Faucaria tigrina', 'Conophytum calculus', 'Chrysanthemum x morifolium'],
  10: ['Chamaedorea elegans', 'Disocactus anguliger', 'Cyclamen persicum', 'Ferocactus latispinus', 'Aeonium canariense', 'Mammillaria schiedeana'],
  11: ['Schlumbergera truncata', 'Euphorbia pulcherrima', 'Crassula ovata', 'Canarina canariensis', 'Viola x wittrockiana', 'Kleinia neriifolia'],
  12: ['Euphorbia pulcherrima', 'Schlumbergera truncata', 'Kalanchoe uniflora', 'Hippeastrum x hybridum', 'Aloe arborescens', 'Cymbidium hybridum'],
};

/* Remedios caseros. wiki = artículo de Wikipedia del que sale la foto. */
export const REMEDIOS = [
  {
    id: 'bicarbonato', nombre: 'Bicarbonato', tipo: 'Fungicida', wiki: 'Bicarbonato de sodio',
    para: ['Oídio', 'Mildiu', 'Botritis (moho gris)'],
    receta: ['5 g (una cucharadita) de bicarbonato sódico', '1 litro de agua', 'Unas gotas de jabón potásico para que se adhiera'],
    uso: 'Pulveriza hojas por las dos caras al atardecer, cada 7 días. Prueba antes en una hoja: en plantas sensibles puede quemar.',
  },
  {
    id: 'ajo', nombre: 'Infusión de ajo', tipo: 'Fungicida', wiki: 'Allium sativum',
    para: ['Pulgón', 'Oídio', 'Araña roja'],
    receta: ['1 cabeza de ajo machacada', '1 litro de agua', 'Reposar 24 horas y colar'],
    uso: 'Diluye 1 parte en 4 de agua y pulveriza cada 5-7 días. Sirve como repelente y fungicida suave.',
  },
  {
    id: 'jabon', nombre: 'Jabón potásico', tipo: 'Insecticida', wiki: 'Jabón',
    para: ['Cochinilla algodonosa', 'Pulgón', 'Mosca blanca', 'Araña roja', 'Fumagina (negrilla)'],
    receta: ['10-20 ml de jabón potásico (no lavavajillas)', '1 litro de agua tibia'],
    uso: 'Pulveriza mojando bien a los insectos, sin sol directo. Repite cada 5-7 días durante 3 semanas y aclara las hojas a los 2 días.',
  },
  {
    id: 'neem', nombre: 'Aceite de neem', tipo: 'Insecticida', wiki: 'Azadirachta indica',
    para: ['Cochinilla algodonosa', 'Trips', 'Mosca blanca', 'Minador de hojas', 'Pulgón'],
    receta: ['5 ml de aceite de neem', '1 litro de agua tibia', '2 ml de jabón potásico para emulsionar'],
    uso: 'Agita bien y pulveriza al atardecer cada 7 días. No lo uses en plena floración para proteger a las abejas.',
  },
  {
    id: 'alcohol', nombre: 'Alcohol con bastoncillo', tipo: 'Insecticida', wiki: 'Alcohol isopropílico',
    para: ['Cochinilla algodonosa', 'Cochinilla de escudo'],
    receta: ['Alcohol isopropílico o de 70º', 'Bastoncillos de algodón'],
    uso: 'Toca directamente cada cochinilla. Ideal en cactus y suculentas, donde los aceites pueden dejar marcas.',
  },
  {
    id: 'canela', nombre: 'Canela en polvo', tipo: 'Cicatrizante', wiki: 'Canela',
    para: ['Podredumbre radicular', 'Pudrición del cuello', 'Rajaduras'],
    receta: ['Canela molida pura'],
    uso: 'Espolvorea sobre cortes de esquejes, raíces podadas y heridas de cactus. Ayuda a secar y protege de hongos.',
  },
  {
    id: 'cola-caballo', nombre: 'Cola de caballo', tipo: 'Fungicida', wiki: 'Equisetum arvense',
    para: ['Oídio', 'Roya', 'Mildiu'],
    receta: ['100 g de cola de caballo seca', '1 litro de agua', 'Hervir 20 minutos y colar'],
    uso: 'Diluye 1 parte en 5 y pulveriza cada 10 días como preventivo en épocas húmedas.',
  },
  {
    id: 'leche', nombre: 'Leche diluida', tipo: 'Fungicida', wiki: 'Leche',
    para: ['Oídio'],
    receta: ['1 parte de leche desnatada', '9 partes de agua'],
    uso: 'Pulveriza al sol de la mañana una vez por semana. Funciona sobre todo en calabacín, rosales y aromáticas.',
  },
  {
    id: 'ortiga', nombre: 'Purín de ortiga', tipo: 'Abono', wiki: 'Urtica dioica',
    para: ['Pulgón', 'Clorosis férrica'],
    receta: ['1 kg de ortiga fresca', '10 litros de agua de lluvia', 'Fermentar 1-2 semanas removiendo a diario'],
    uso: 'Diluido al 10 % en el riego como abono; al 5 % pulverizado, como repelente de pulgón.',
  },
  {
    id: 'sauce', nombre: 'Agua de sauce', tipo: 'Enraizante', wiki: 'Salix',
    para: [],
    receta: ['Ramitas tiernas de sauce troceadas', 'Agua para cubrirlas', 'Reposar 24-48 horas'],
    uso: 'Usa el agua para regar esquejes recién plantados: contiene hormonas que ayudan a enraizar.',
  },
  {
    id: 'cafe', nombre: 'Posos de café', tipo: 'Abono', wiki: 'Café',
    para: [],
    receta: ['Posos de café secos'],
    uso: 'Mezcla una cucharada en el sustrato de plantas acidófilas (azaleas, camelias, helechos) una vez al mes. No en cactus.',
  },
  {
    id: 'trampas', nombre: 'Trampas amarillas', tipo: 'Insecticida', wiki: 'Trampa cromática',
    para: ['Mosca blanca', 'Mosca del sustrato', 'Minador de hojas'],
    receta: ['Cartulina amarilla', 'Vaselina o pegamento sin secado'],
    uso: 'Pincha la cartulina untada cerca de la planta, a la altura de las hojas. Cámbiala cuando esté llena.',
  },
];

/* Niveles de luz para el medidor y el buscador. */
export const NIVELES_LUZ = [
  { id: 'sombra', nombre: 'Poca luz', lux: '< 1.000 lux', sombraMano: 'Casi no se ve sombra', texto: 'Rincones lejos de la ventana o pasillos. Pocas plantas viven bien aquí.' },
  { id: 'semi', nombre: 'Luz indirecta', lux: '1.000-10.000 lux', sombraMano: 'Sombra suave, de bordes difuminados', texto: 'Cerca de una ventana sin que llegue el sol. Ideal para casi todas las plantas de interior.' },
  { id: 'parcial', nombre: 'Sol parcial', lux: '10.000-30.000 lux', sombraMano: 'Sombra bastante definida', texto: 'Sol directo unas horas, sobre todo de mañana, o sol filtrado por una malla.' },
  { id: 'sol', nombre: 'Pleno sol', lux: '> 30.000 lux', sombraMano: 'Sombra nítida y oscura', texto: 'Sol directo la mayor parte del día: azoteas, terrazas al sur. Cactus y suculentas.' },
];

export const SITIOS_INICIALES = [
  { id: 's-salon', nombre: 'Salón', exterior: false },
  { id: 's-cocina', nombre: 'Cocina', exterior: false },
  { id: 's-dormitorio', nombre: 'Dormitorio', exterior: false },
  { id: 's-terraza', nombre: 'Terraza', exterior: true },
];
