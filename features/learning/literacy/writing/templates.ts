export type Point = { x: number; y: number };
export type Stroke = Point[];

const point = (x: number, y: number): Point => ({ x, y });

function line(x1: number, y1: number, x2: number, y2: number): Stroke {
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24;
    return point(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
  });
}

function join(...segments: Stroke[]): Stroke {
  return segments.flatMap((segment, index) =>
    index ? segment.slice(1) : segment,
  );
}

function poly(...coordinates: number[]): Stroke {
  const segments: Stroke[] = [];
  for (let index = 0; index < coordinates.length - 2; index += 2) {
    segments.push(
      line(
        coordinates[index],
        coordinates[index + 1],
        coordinates[index + 2],
        coordinates[index + 3],
      ),
    );
  }
  return join(...segments);
}

function curve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): Stroke {
  return Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    const s = 1 - t;
    return point(
      s ** 3 * x1 + 3 * s ** 2 * t * x2 + 3 * s * t ** 2 * x3 + t ** 3 * x4,
      s ** 3 * y1 + 3 * s ** 2 * t * y2 + 3 * s * t ** 2 * y3 + t ** 3 * y4,
    );
  });
}

function oval(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  start = -90,
  end = 270,
): Stroke {
  return Array.from({ length: 65 }, (_, index) => {
    const angle = ((start + ((end - start) * index) / 64) * Math.PI) / 180;
    return point(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle));
  });
}

// Semua jalur memakai koordinat 0–300 yang sama dengan kanvas. Urutan array
// menentukan nomor titik awal dan arah panah tiap goresan.
export const writingTemplates: Record<string, Stroke[]> = {
  A: [line(58, 245, 150, 55), line(150, 55, 242, 245), line(95, 168, 205, 168)],
  B: [
    line(82, 55, 82, 245),
    curve(82, 55, 232, 42, 230, 146, 82, 145),
    curve(82, 145, 238, 132, 242, 252, 82, 245),
  ],
  C: [oval(150, 150, 91, 99, -45, -315)],
  D: [line(82, 55, 82, 245), curve(82, 55, 244, 45, 244, 252, 82, 245)],
  E: [
    line(82, 55, 82, 245),
    line(82, 55, 225, 55),
    line(82, 149, 195, 149),
    line(82, 245, 225, 245),
  ],
  F: [line(82, 55, 82, 245), line(82, 55, 225, 55), line(82, 149, 195, 149)],
  G: [oval(150, 150, 91, 99, -45, -315), poly(227, 205, 227, 165, 170, 165)],
  H: [line(72, 55, 72, 245), line(228, 55, 228, 245), line(72, 150, 228, 150)],
  I: [line(88, 55, 212, 55), line(150, 55, 150, 245), line(88, 245, 212, 245)],
  J: [
    line(88, 55, 220, 55),
    join(line(205, 55, 205, 184), curve(205, 184, 205, 263, 85, 270, 76, 203)),
  ],
  K: [line(80, 55, 80, 245), line(226, 55, 80, 172), line(141, 145, 231, 245)],
  L: [line(80, 55, 80, 245), line(80, 245, 224, 245)],
  M: [poly(58, 245, 58, 55, 150, 164, 242, 55, 242, 245)],
  N: [poly(66, 245, 66, 55, 234, 245, 234, 55)],
  O: [oval(150, 150, 93, 99)],
  P: [line(82, 245, 82, 55), curve(82, 55, 232, 43, 235, 156, 82, 154)],
  Q: [oval(148, 150, 90, 99), line(185, 208, 242, 264)],
  R: [
    line(82, 245, 82, 55),
    curve(82, 55, 232, 43, 235, 156, 82, 154),
    line(145, 154, 232, 245),
  ],
  S: [
    join(
      curve(225, 78, 136, 15, 54, 93, 150, 147),
      curve(150, 147, 256, 168, 218, 280, 75, 221),
    ),
  ],
  T: [line(60, 55, 240, 55), line(150, 55, 150, 245)],
  U: [curve(67, 55, 67, 240, 233, 278, 233, 55)],
  V: [poly(62, 55, 150, 245, 238, 55)],
  W: [poly(49, 55, 89, 245, 150, 116, 211, 245, 251, 55)],
  X: [line(68, 55, 232, 245), line(232, 55, 68, 245)],
  Y: [poly(62, 55, 150, 155, 238, 55), line(150, 155, 150, 245)],
  Z: [poly(68, 55, 232, 55, 68, 245, 232, 245)],

  a: [oval(140, 182, 65, 62), line(205, 121, 205, 245)],
  b: [line(88, 55, 88, 245), oval(150, 182, 62, 63)],
  c: [oval(150, 182, 68, 63, -45, -315)],
  d: [oval(146, 182, 62, 63), line(208, 55, 208, 245)],
  e: [oval(150, 182, 66, 63, -22, -324), line(84, 179, 209, 179)],
  f: [
    join(
      curve(112, 245, 112, 175, 113, 102, 126, 72),
      curve(126, 72, 141, 38, 185, 48, 208, 66),
    ),
    line(78, 126, 192, 126),
  ],
  g: [
    oval(140, 177, 62, 57),
    join(
      line(202, 121, 202, 247),
      curve(202, 247, 197, 296, 117, 297, 91, 264),
    ),
  ],
  h: [
    line(86, 55, 86, 245),
    join(curve(86, 180, 92, 115, 210, 112, 210, 182), line(210, 182, 210, 245)),
  ],
  i: [oval(150, 78, 11, 11), line(150, 123, 150, 245)],
  j: [
    oval(181, 78, 11, 11),
    join(
      line(181, 122, 181, 250),
      curve(181, 250, 177, 291, 110, 291, 96, 263),
    ),
  ],
  k: [line(89, 55, 89, 245), line(210, 123, 89, 190), line(145, 161, 213, 245)],
  l: [line(150, 55, 150, 245)],
  m: [
    line(57, 125, 57, 245),
    join(curve(57, 182, 61, 113, 143, 113, 143, 182), line(143, 182, 143, 245)),
    join(
      curve(143, 182, 149, 113, 236, 112, 236, 183),
      line(236, 183, 236, 245),
    ),
  ],
  n: [
    line(88, 124, 88, 245),
    join(curve(88, 183, 93, 113, 210, 113, 210, 183), line(210, 183, 210, 245)),
  ],
  o: [oval(150, 182, 68, 63)],
  p: [line(88, 124, 88, 284), oval(150, 182, 62, 63)],
  q: [oval(145, 182, 62, 63), line(207, 122, 207, 284)],
  r: [line(94, 124, 94, 245), curve(94, 180, 100, 133, 158, 115, 213, 134)],
  s: [
    join(
      curve(213, 139, 143, 100, 75, 142, 149, 179),
      curve(149, 179, 230, 208, 203, 265, 81, 225),
    ),
  ],
  t: [line(145, 65, 145, 245), line(89, 128, 205, 128)],
  u: [
    join(line(86, 124, 86, 193), curve(86, 193, 87, 263, 205, 263, 205, 189)),
    line(205, 123, 205, 245),
  ],
  v: [poly(76, 124, 150, 245, 224, 124)],
  w: [poly(54, 124, 91, 245, 150, 164, 209, 245, 246, 124)],
  x: [line(83, 124, 217, 245), line(217, 124, 83, 245)],
  y: [poly(75, 124, 150, 233, 221, 124), line(221, 124, 164, 284)],
  z: [poly(82, 124, 218, 124, 82, 245, 218, 245)],

  "0": [oval(150, 150, 82, 99)],
  "1": [
    line(103, 99, 154, 55),
    line(154, 55, 154, 245),
    line(98, 245, 211, 245),
  ],
  "2": [
    join(
      curve(77, 105, 89, 35, 222, 36, 219, 119),
      curve(219, 119, 214, 160, 143, 200, 77, 243),
    ),
    line(77, 243, 226, 243),
  ],
  "3": [
    join(
      curve(78, 78, 214, 22, 247, 118, 151, 145),
      curve(151, 145, 249, 147, 238, 269, 77, 223),
    ),
  ],
  "4": [poly(204, 55, 81, 188, 230, 188), line(204, 55, 204, 245)],
  "5": [
    poly(221, 56, 92, 56, 86, 145),
    join(
      curve(86, 145, 198, 105, 249, 162, 219, 217),
      curve(219, 217, 190, 262, 115, 254, 75, 222),
    ),
  ],
  "6": [
    join(
      curve(214, 61, 110, 35, 62, 151, 99, 204),
      oval(150, 197, 63, 49, 145, 505),
    ),
  ],
  "7": [poly(76, 55, 227, 55, 112, 245)],
  "8": [oval(150, 103, 56, 49), oval(150, 199, 66, 48)],
  "9": [oval(145, 110, 63, 55), curve(206, 102, 235, 211, 199, 270, 88, 236)],
};

export const writingCharacters = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
];
