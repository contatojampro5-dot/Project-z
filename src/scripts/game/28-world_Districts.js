// -- src/world/Districts.js --
// Regiões adicionais de PROJECT Z. Layout fixo e colisões compartilhadas.
// As avenidas formam um circuito contínuo, conectando o antigo Centro às demais zonas.
const DISTRICTS = Object.freeze([
  {id:'center',name:'CENTRO / SÃO PAULO',short:'CENTRO',x:0,y:0,w:1152,h:1152,color:'#e04b4d'},
  {id:'suburb',name:'ZONA LESTE / QUARENTENA',short:'ZONA LESTE',x:1152,y:0,w:1648,h:1152,color:'#c8a8a4'},
  {id:'industry',name:'CINTURÃO INDUSTRIAL',short:'INDÚSTRIA',x:0,y:1152,w:1152,h:1648,color:'#c78b70'},
  {id:'highway',name:'RODOVIA INTERDITADA',short:'RODOVIA',x:1152,y:1152,w:1648,h:1648,color:'#b7b7b3'},
]);
const DISTRICT_BUILDINGS=Object.freeze([
  {x:1290,y:65,w:345,h:230,name:'DROGARIA SÉ',zone:'suburb',roof:'#527669'},
  {x:2180,y:100,w:380,h:230,name:'PARADA 24H',zone:'suburb',roof:'#486a66'},
  {x:1320,y:843,w:317,h:219,name:"HABIB'S",zone:'suburb',roof:'#5b7563'},
  {x:2200,y:835,w:362,h:222,name:'CANTINA BIXIGA',zone:'suburb',roof:'#58746f'},
  {x:50,y:1330,w:300,h:265,name:'CASAS DO BRÁS',zone:'industry',roof:'#6a6760'},
  {x:780,y:1320,w:310,h:270,name:'FRIGORÍFICO VILA',zone:'industry',roof:'#586771'},
  {x:50,y:2290,w:314,h:287,name:'HIPER LESTE',zone:'industry',roof:'#756354'},
  {x:770,y:2290,w:320,h:294,name:'MERCADÃO 24H',zone:'industry',roof:'#68656d'},
  {x:1280,y:1310,w:322,h:304,name:'BANCO TIETÊ',zone:'highway',roof:'#526470'},
  {x:2180,y:1325,w:360,h:272,name:'BANCO PAULISTA',zone:'highway',roof:'#6a6076'},
  {x:1310,y:2280,w:330,h:278,name:'POSTO ESTADO',zone:'highway',roof:'#766552'},
  {x:2170,y:2255,w:375,h:302,name:'MOOCA AUTO',zone:'highway',roof:'#536d68'},
]);
const DISTRICT_PROPS=Object.freeze([
  {x:1710,y:145,w:66,h:42,type:'garden'}, {x:2045,y:1020,w:90,h:29,type:'barrier'},
  {x:1635,y:900,w:46,h:54,type:'vehicle'}, {x:2142,y:750,w:44,h:72,type:'vehicle'},
  {x:275,y:1700,w:83,h:28,type:'container'}, {x:812,y:2200,w:75,h:32,type:'container'},
  {x:101,y:2175,w:61,h:31,type:'barrier'}, {x:982,y:1645,w:48,h:57,type:'vehicle'},
  {x:1460,y:1690,w:80,h:28,type:'container'}, {x:2185,y:2105,w:53,h:74,type:'vehicle'},
  {x:2640,y:1440,w:80,h:28,type:'barrier'}, {x:1550,y:2690,w:100,h:33,type:'barrier'},
]);
// G.3.0.7: parked and crashed traffic. Fixed, seeded-looking arrangement; each visible body has a matching collision box.
const ABANDONED_VEHICLES=Object.freeze([
  {x:170,y:482,kind:'hatch',angle:0.22,paint:'slate',zone:'center',w:54.23,h:72.41},
  {x:339,y:475,kind:'sedan',angle:1.18,paint:'bronze',zone:'center',w:84.82,h:66.88},
  {x:142,y:676,kind:'pickup',angle:-0.52,paint:'olive',zone:'center',w:84.06,h:98.53},
  {x:811,y:475,kind:'pickup',angle:1.22,paint:'teal',zone:'center',w:97.78,h:74.56},
  {x:1007,y:497,kind:'hatch',angle:1.53,paint:'rust',zone:'center',w:67.42,h:44.42},
  {x:976,y:707,kind:'pickup',angle:-1.02,paint:'white',zone:'center',w:98.38,h:85.56},
  {x:498,y:120,kind:'pickup',angle:0.71,paint:'olive',zone:'center',w:92.06,h:96.21},
  {x:670,y:172,kind:'sedan',angle:-0.43,paint:'burgundy',zone:'center',w:68.81,h:85.05},
  {x:667,y:1051,kind:'hatch',angle:1.12,paint:'yellow',zone:'center',w:75.69,h:64.54},
  {x:482,y:999,kind:'sedan',angle:-1.36,paint:'slate',zone:'center',w:82.19,h:56.83},
  {x:1080,y:640,kind:'sedan',angle:-0.84,paint:'bronze',zone:'center',w:82.82,h:80.27},
  {x:757,y:673,kind:'hatch',angle:-1.12,paint:'teal',zone:'center',w:75.69,h:64.54},
  {x:1250,y:478,kind:'sedan',angle:-1.40,paint:'gray',zone:'suburb',w:81.27,h:54.36},
  {x:1450,y:684,kind:'pickup',angle:1.18,paint:'burgundy',zone:'suburb',w:98.2,h:76.99},
  {x:1675,y:490,kind:'van',angle:-0.72,paint:'white',zone:'suburb',w:100.02,h:103.9},
  {x:1876,y:699,kind:'sedan',angle:1.46,paint:'navy',zone:'suburb',w:79.66,h:50.51},
  {x:2090,y:532,kind:'hatch',angle:0.83,paint:'olive',zone:'suburb',w:74.57,h:73.06},
  {x:2310,y:677,kind:'pickup',angle:-1.41,paint:'bronze',zone:'suburb',w:93.83,h:61.57},
  {x:2610,y:489,kind:'sedan',angle:0.57,paint:'rust',zone:'suburb',w:74.92,h:84.9},
  {x:2715,y:696,kind:'van',angle:-0.48,paint:'teal',zone:'suburb',w:88.79,h:106.65},
  {x:1900,y:231,kind:'hatch',angle:0.48,paint:'yellow',zone:'suburb',w:65.64,h:75.84},
  {x:1836,y:386,kind:'sedan',angle:0.24,paint:'gray',zone:'suburb',w:58.58,h:82.79},
  {x:2405,y:782,kind:'hatch',angle:1.52,paint:'navy',zone:'suburb',w:67.75,h:45.0},
  {x:480,y:1251,kind:'sedan',angle:0.12,paint:'bronze',zone:'industry',w:51.11,h:79.93},
  {x:675,y:1452,kind:'pickup',angle:-0.63,paint:'olive',zone:'industry',w:89.06,h:97.59},
  {x:505,y:1632,kind:'van',angle:0.62,paint:'white',zone:'industry',w:95.96,h:105.74},
  {x:665,y:1736,kind:'hatch',angle:1.54,paint:'rust',zone:'industry',w:67.08,h:43.83},
  {x:467,y:2112,kind:'pickup',angle:0.24,paint:'navy',zone:'industry',w:67.26,h:95.87},
  {x:690,y:2234,kind:'sedan',angle:-0.84,paint:'burgundy',zone:'industry',w:82.82,h:80.27},
  {x:517,y:2462,kind:'hatch',angle:0.94,paint:'yellow',zone:'industry',w:75.69,h:70.46},
  {x:681,y:2705,kind:'van',angle:0.13,paint:'teal',zone:'industry',w:64.14,h:100.34},
  {x:161,y:1848,kind:'sedan',angle:1.12,paint:'slate',zone:'industry',w:85.13,h:69.8},
  {x:324,y:1971,kind:'pickup',angle:-1.30,paint:'white',zone:'industry',w:96.51,h:69.37},
  {x:850,y:1844,kind:'hatch',angle:1.28,paint:'rust',zone:'industry',w:73.8,h:57.69},
  {x:1006,y:1968,kind:'van',angle:-0.52,paint:'olive',zone:'industry',w:91.01,h:106.59},
  {x:1252,y:1860,kind:'sedan',angle:1.50,paint:'gray',zone:'highway',w:78.44,h:47.86},
  {x:1482,y:1957,kind:'pickup',angle:-1.03,paint:'burgundy',zone:'highway',w:98.44,h:85.08},
  {x:1730,y:1853,kind:'van',angle:0.61,paint:'white',zone:'highway',w:95.51,h:105.87},
  {x:2071,y:1981,kind:'hatch',angle:-1.41,paint:'teal',zone:'highway',w:70.99,h:51.14},
  {x:2350,y:1854,kind:'sedan',angle:1.21,paint:'slate',zone:'highway',w:84.55,h:65.33},
  {x:2592,y:1974,kind:'pickup',angle:-0.40,paint:'olive',zone:'highway',w:77.54,h:98.27},
  {x:1900,y:1257,kind:'hatch',angle:0.25,paint:'rust',zone:'highway',w:55.73,h:73.04},
  {x:2000,y:1451,kind:'van',angle:-0.60,paint:'white',zone:'highway',w:95.04,h:105.99},
  {x:1904,y:1640,kind:'sedan',angle:0.14,paint:'bronze',zone:'highway',w:52.41,h:80.48},
  {x:1991,y:2247,kind:'pickup',angle:1.22,paint:'navy',zone:'highway',w:97.78,h:74.56},
  {x:1891,y:2433,kind:'sedan',angle:0.73,paint:'gray',zone:'highway',w:80.25,h:82.84},
  {x:2009,y:2630,kind:'van',angle:-0.35,paint:'burgundy',zone:'highway',w:80.67,h:105.72},
  {x:2052,y:2120,kind:'sedan',angle:-0.61,paint:'rust',zone:'highway',w:76.43,h:84.57},
  {x:364,y:865,kind:'hatch',angle:-0.70,paint:'white',zone:'center',w:72.19,h:75.08},
  {x:783,y:864,kind:'sedan',angle:0.24,paint:'yellow',zone:'center',w:58.58,h:82.79},
  {x:1790,y:815,kind:'hatch',angle:0.34,paint:'olive',zone:'suburb',w:59.95,h:74.57},
  {x:2090,y:360,kind:'pickup',angle:0.62,paint:'teal',zone:'suburb',w:88.64,h:97.72},
  {x:750,y:1750,kind:'hatch',angle:0.14,paint:'slate',zone:'industry',w:50.02,h:70.44},
  {x:2060,y:2460,kind:'pickup',angle:-0.45,paint:'olive',zone:'highway',w:80.39,h:98.54},
]);
function visibleCarFootprint(cx,cy,angle,halfW,halfH){
  return {cx,cy,angle,halfW,halfH};
}
function civilianCarFootprint(v){
  // A hitbox acompanha a carroceria e as rodas do desenho de civilianCar().
  const widths={sedan:37,hatch:36,pickup:43,van:47};
  const heights={sedan:70,hatch:60,pickup:82,van:89};
  return visibleCarFootprint(v.x,v.y,v.angle,(widths[v.kind]+6)/2,(heights[v.kind]+2)/2);
}
const ABANDONED_CAR_OBSTACLES=Object.freeze(ABANDONED_VEHICLES.map(v=>({
  x:v.x-v.w/2,y:v.y-v.h/2,w:v.w,h:v.h,carShape:civilianCarFootprint(v)
})));
const DISTRICT_OBSTACLES=Object.freeze([
  ...DISTRICT_BUILDINGS.map(({x,y,w,h})=>({x,y,w,h})),
  ...DISTRICT_PROPS.filter(p=>p.type!=='garden').map(({x,y,w,h})=>({x,y,w,h})),
]);
function districtAt(x,y){
  return DISTRICTS.find(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)||DISTRICTS[0];
}

