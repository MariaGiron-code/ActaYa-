// Genera las animaciones Lottie de marca de ActaYa (bodymovin 5.7).
// Uso: node scripts/generar-lottie.js assets/lottie
const fs = require('fs');
const path = require('path');

const destino = process.argv[2];
if (!destino) throw new Error('Falta la carpeta destino');

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1].map((v) => +v.toFixed(4));
};
const C = {
  azul: hex('#024873'),
  amarillo: hex('#F2CB05'),
  rojo: hex('#D90B1C'),
  blanco: hex('#FFFFFF'),
  verde: hex('#1E8E3E'),
};

const estatico = (k) => ({ a: 0, k });
// Keyframes: [[frame, valor, easing?], ...]; easing por defecto = ease in-out.
const EASE = { o: [0.33, 0], i: [0.67, 1] };
const OUT_BACK = { o: [0.34, 0], i: [0.64, 1] };
const animado = (kfs) => ({
  a: 1,
  k: kfs.map(([t, s, e = EASE], idx) => {
    const val = Array.isArray(s) ? s : [s];
    if (idx === kfs.length - 1) return { t, s: val };
    const n = val.length;
    return {
      t,
      s: val,
      o: { x: Array(n).fill(e.o[0]), y: Array(n).fill(e.o[1]) },
      i: { x: Array(n).fill(e.i[0]), y: Array(n).fill(e.i[1]) },
    };
  }),
});

const tr = (extra = {}) => ({
  ty: 'tr',
  p: estatico([0, 0]),
  a: estatico([0, 0]),
  s: estatico([100, 100]),
  r: estatico(0),
  o: estatico(100),
  sk: estatico(0),
  sa: estatico(0),
  nm: 'Transform',
  ...extra,
});
const grupo = (nm, items, transform) => ({ ty: 'gr', nm, it: [...items, tr(transform)] });
const rect = (w, h, r, p = [0, 0]) => ({ ty: 'rc', d: 1, s: estatico([w, h]), p: estatico(p), r: estatico(r), nm: 'Rect' });
const elipse = (d) => ({ ty: 'el', d: 1, s: estatico([d, d]), p: estatico([0, 0]), nm: 'Elipse' });
const trazo = (puntos, cerrado = false) => ({
  ty: 'sh',
  d: 1,
  nm: 'Trazo',
  ks: estatico({ i: puntos.map(() => [0, 0]), o: puntos.map(() => [0, 0]), v: puntos, c: cerrado }),
});
// Trazo con curvas: i/o son las tangentes de entrada/salida de cada vértice (relativas).
const trazoCurvo = (v, i, o, cerrado = false) => ({ ty: 'sh', d: 1, nm: 'Curva', ks: estatico({ i, o, v, c: cerrado }) });
const relleno = (c, o = 100) => ({ ty: 'fl', c: estatico(c), o: estatico(o), r: 1, nm: 'Relleno' });
const borde = (c, w, o = 100) => ({
  ty: 'st',
  c: estatico(c),
  o: typeof o === 'number' ? estatico(o) : o,
  w: estatico(w),
  lc: 2,
  lj: 2,
  ml: 4,
  nm: 'Borde',
});
const recorte = (fin) => ({ ty: 'tm', s: estatico(0), e: fin, o: estatico(0), m: 1, nm: 'Recorte' });

let indice = 1;
const capa = (nm, shapes, ks, op) => ({
  ddd: 0,
  ind: indice++,
  ty: 4,
  nm,
  sr: 1,
  ks: {
    o: estatico(100),
    r: estatico(0),
    p: estatico([100, 100, 0]),
    a: estatico([0, 0, 0]),
    s: estatico([100, 100, 100]),
    ...ks,
  },
  ao: 0,
  shapes,
  ip: 0,
  op,
  st: 0,
  bm: 0,
});
const animacion = (nm, op, capas) => ({ v: '5.7.4', fr: 30, ip: 0, op, w: 200, h: 200, nm, ddd: 0, assets: [], layers: capas });

// ---------- Cargando: un acta que se va llenando y se sella (bucle de 3 s) ----------
function cargando() {
  indice = 1;
  const OP = 90;
  const lineas = [
    { y: -22, w: 52, inicio: 6 },
    { y: -6, w: 52, inicio: 18 },
    { y: 10, w: 34, inicio: 30 },
  ].map(({ y, w, inicio }, i) =>
    capa(
      `linea-${i + 1}`,
      [grupo('linea', [rect(w, 7, 3.5, [w / 2, 0]), relleno(C.azul, 40)])],
      {
        // Ancla en el borde izquierdo: la línea "se escribe" de izquierda a derecha.
        p: estatico([69, 100 + y, 0]),
        s: animado([
          [0, [0, 100, 100]],
          [inicio, [0, 100, 100]],
          [inicio + 12, [100, 100, 100]],
          [80, [100, 100, 100]],
          [88, [0, 100, 100]],
        ]),
      },
      OP
    )
  );

  const sello = capa(
    'sello',
    [
      grupo('check', [trazo([[-8, 0], [-2, 6], [9, -6]]), borde(C.azul, 4.5)]),
      grupo('circulo', [elipse(36), borde(C.rojo, 4), relleno(C.amarillo)]),
    ],
    {
      p: estatico([126, 136, 0]),
      s: animado([
        [0, [0, 0, 100]],
        [44, [0, 0, 100], OUT_BACK],
        [54, [118, 118, 100]],
        [60, [100, 100, 100]],
        [80, [100, 100, 100]],
        [88, [0, 0, 100]],
      ]),
    },
    OP
  );

  const esquina = capa('esquina', [grupo('esquina', [trazo([[18, -58], [42, -34], [18, -34]], true), relleno(C.amarillo)])], {}, OP);

  const hoja = capa(
    'hoja',
    [
      grupo('hoja', [
        trazo([[-42, -48], [-42, 48], [42, 48], [42, -34], [18, -58], [-32, -58], [-42, -48]], true),
        borde(C.azul, 5),
        relleno(C.blanco),
      ]),
    ],
    {
      // Leve flotación para que nunca parezca congelado.
      p: animado([
        [0, [100, 100, 0]],
        [45, [100, 96, 0]],
        [90, [100, 100, 0]],
      ]),
    },
    OP
  );

  // Las capas de contenido siguen a la hoja en su flotación.
  for (const c of [...lineas, sello, esquina]) c.parent = hoja.ind;
  // Con padre, la posición es relativa al ancla de la hoja (0,0 = centro de la hoja).
  for (const c of [...lineas, sello, esquina]) {
    const p = c.ks.p.k;
    c.ks.p = estatico([p[0] - 100, p[1] - 100, 0]);
  }

  return animacion('cargando', OP, [sello, ...lineas, esquina, hoja]);
}

// ---------- Éxito: círculo verde con rebote, check que se dibuja y onda ----------
function exito() {
  indice = 1;
  const OP = 45;
  const insignia = capa(
    'insignia',
    [
      grupo('check', [
        trazo([[-24, 2], [-7, 19], [25, -15]]),
        recorte(animado([[0, 0], [10, 0], [26, 100]])),
        borde(C.blanco, 10),
      ]),
      grupo('circulo', [elipse(116), relleno(C.verde)]),
    ],
    {
      s: animado([
        [0, [0, 0, 100], OUT_BACK],
        [10, [112, 112, 100]],
        [16, [100, 100, 100]],
      ]),
    },
    OP
  );
  const onda = capa(
    'onda',
    [grupo('onda', [elipse(116), borde(C.verde, 5, animado([[6, 70], [28, 0]]))])],
    { s: animado([[6, [90, 90, 100]], [28, [150, 150, 100]]]) },
    OP
  );
  return animacion('exito', OP, [insignia, onda]);
}

// ---------- Error: círculo rojo con rebote, X que se dibuja y sacudida ----------
function error() {
  indice = 1;
  const OP = 50;
  const insignia = capa(
    'insignia',
    [
      grupo('x-1', [trazo([[-20, -20], [20, 20]]), recorte(animado([[0, 0], [10, 0], [20, 100]])), borde(C.blanco, 10)]),
      grupo('x-2', [trazo([[20, -20], [-20, 20]]), recorte(animado([[0, 0], [16, 0], [26, 100]])), borde(C.blanco, 10)]),
      grupo('circulo', [elipse(116), relleno(C.rojo)]),
    ],
    {
      s: animado([
        [0, [0, 0, 100], OUT_BACK],
        [10, [112, 112, 100]],
        [16, [100, 100, 100]],
      ]),
      p: animado([
        [26, [100, 100, 0]],
        [30, [90, 100, 0]],
        [34, [110, 100, 0]],
        [38, [94, 100, 0]],
        [42, [104, 100, 0]],
        [46, [100, 100, 0]],
      ]),
    },
    OP
  );
  return animacion('error', OP, [insignia]);
}

// ---------- Piezas compartidas de las ilustraciones de clave y personas ----------
const K = 0.5523; // constante para aproximar un arco circular con bézier
const fondoCircular = (op) =>
  capa('fondo', [grupo('fondo', [elipse(150), relleno(C.azul, 8)])], {}, op);

// Arco del candado: patas de 16 px y semicírculo de radio 22.
const arcoCandado = () =>
  trazoCurvo(
    [[-22, 0], [-22, -16], [0, -38], [22, -16], [22, 0]],
    [[0, 0], [0, 0], [-22 * K, 0], [0, -22 * K], [0, 0]],
    [[0, 0], [0, -22 * K], [22 * K, 0], [0, 0], [0, 0]]
  );

const cuerpoCandado = (op) =>
  capa(
    'cuerpo',
    [
      grupo('cerradura', [elipse(18), relleno(C.amarillo)], { p: estatico([0, -6]) }),
      grupo('ranura', [rect(7, 18, 3.5, [0, 8]), relleno(C.amarillo)]),
      grupo('cuerpo', [rect(76, 60, 12), relleno(C.azul)]),
    ],
    { p: estatico([100, 112, 0]) },
    op
  );

const sello = (nombre, x, y, inicio, colorFondo, items) =>
  capa(
    nombre,
    [...items, grupo('circulo', [elipse(40), borde(C.blanco, 5), relleno(colorFondo)])],
    {
      p: estatico([x, y, 0]),
      s: animado([
        [0, [0, 0, 100]],
        [inicio, [0, 0, 100], OUT_BACK],
        [inicio + 10, [115, 115, 100]],
        [inicio + 16, [100, 100, 100]],
      ]),
    },
    inicio + 30
  );
const checkBlanco = () => grupo('check', [trazo([[-9, 0], [-3, 6], [9, -6]]), borde(C.blanco, 5)]);

// ---------- Recuperar acceso: la llave entra, gira y abre el candado ----------
function llave() {
  indice = 1;
  const OP = 70;
  const llaveCapa = capa(
    'llave',
    [
      grupo('llave', [
        trazo([[13, 0], [-18, 0]]),
        trazo([[-10, 0], [-10, 9]]),
        borde(C.amarillo, 7),
      ]),
      grupo('ojo', [elipse(24), borde(C.amarillo, 7)], { p: estatico([25, 0]) }),
    ],
    {
      p: animado([[0, [196, 112, 0]], [18, [156, 112, 0]]]),
      o: animado([[0, 0], [10, 100]]),
      r: animado([[22, 0], [34, 90]]),
    },
    OP
  );
  const arco = capa(
    'arco',
    [grupo('arco', [arcoCandado(), borde(C.azul, 10)])],
    { p: animado([[34, [100, 88, 0]], [44, [100, 74, 0], OUT_BACK], [50, [100, 76, 0]]]) },
    OP
  );
  return animacion('llave', OP, [llaveCapa, cuerpoCandado(OP), arco, fondoCircular(OP)]);
}

// ---------- Crear clave: el candado se cierra y aparece el check ----------
function candado() {
  indice = 1;
  const OP = 50;
  const arco = capa(
    'arco',
    [grupo('arco', [arcoCandado(), borde(C.azul, 10)])],
    { p: animado([[0, [100, 72, 0]], [6, [100, 72, 0]], [18, [100, 88, 0]]]) },
    OP
  );
  const check = sello('check', 136, 140, 20, C.verde, [checkBlanco()]);
  check.op = OP;
  return animacion('candado', OP, [check, cuerpoCandado(OP), arco, fondoCircular(OP)]);
}

// ---------- Registrar persona: avatar que aparece y "+" amarillo con rebote ----------
function persona() {
  indice = 1;
  const OP = 45;
  const avatar = capa(
    'avatar',
    [
      grupo('cabeza', [elipse(36), borde(C.azul, 7)], { p: estatico([0, -22]) }),
      grupo('hombros', [
        trazoCurvo(
          [[-32, 26], [0, 6], [32, 26]],
          [[0, 0], [-16, 0], [-4, -16]],
          [[4, -16], [16, 0], [0, 0]]
        ),
        borde(C.azul, 7),
      ]),
    ],
    {
      p: estatico([94, 100, 0]),
      o: animado([[0, 0], [10, 100]]),
      s: animado([[0, [85, 85, 100]], [12, [100, 100, 100]]]),
    },
    OP
  );
  const mas = sello('mas', 134, 134, 12, C.amarillo, [
    grupo('mas', [trazo([[0, -8], [0, 8]]), trazo([[-8, 0], [8, 0]]), borde(C.azul, 5)]),
  ]);
  mas.op = OP;
  return animacion('persona', OP, [mas, avatar, fondoCircular(OP)]);
}

// ---------- Revisa tu correo: el sobre sube y se sella con un check ----------
function correo() {
  indice = 1;
  const OP = 50;
  const sobre = capa(
    'sobre',
    [
      grupo('solapa', [trazo([[-46, -30], [0, 6], [46, -30]]), borde(C.azul, 6)]),
      grupo('sobre', [rect(96, 66, 8), borde(C.azul, 6), relleno(C.blanco)]),
    ],
    {
      p: animado([[0, [100, 130, 0], OUT_BACK], [14, [100, 100, 0]]]),
      o: animado([[0, 0], [8, 100]]),
    },
    OP
  );
  const check = sello('check', 140, 128, 16, C.verde, [checkBlanco()]);
  check.op = OP;
  return animacion('correo', OP, [check, sobre, fondoCircular(OP)]);
}

for (const [nombre, datos] of [
  ['cargando', cargando()],
  ['exito', exito()],
  ['error', error()],
  ['llave', llave()],
  ['candado', candado()],
  ['persona', persona()],
  ['correo', correo()],
]) {
  fs.writeFileSync(path.join(destino, `${nombre}.json`), JSON.stringify(datos));
  console.log(`${nombre}.json: ${datos.layers.length} capas, ${datos.op} frames`);
}
