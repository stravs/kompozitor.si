// Five drawings per carton: a folded blank, walls rising, open, lids up, shut.
// Only the corners move. SVG in-betweens keep the ink on the cardboard.
type Point = [number, number];
const add = ([x, y]: Point, [dx, dy]: Point): Point => [x + dx, y + dy];
const line = (...p: Point[]) => 'M' + p.map(([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`).join('L');
const cut = (...p: Point[]) => line(...p) + 'Z';
const corner: Point = [-40, 0], width: Point = [80, 1], depth: Point = [25, -16];
const right = add(corner, width), back = add(corner, depth), far = add(right, depth);

function drawing(frontRise: Point, sideRise: Point, backRise: Point, lip: Point, backLip: Point) {
  const a = add(corner, frontRise), b = add(right, frontRise);
  const c = add(back, backRise), d = add(far, backRise);
  const onFront = (x: number, up: number): Point => add(corner, [x * width[0] + up * frontRise[0], x + up * frontRise[1]]);
  const onSide = (x: number, up: number): Point => add(right, [x * depth[0] + up * sideRise[0], x * depth[1] + up * sideRise[1]]);
  const stamp = (x: number, up: number, w: number, h: number) => cut(onFront(x, up), onFront(x+w, up), onFront(x+w, up+h), onFront(x, up+h));
  return {
    base: cut(corner, right, far, back), rearWall: cut(back, far, d, c),
    innerWall: cut(corner, back, add(back, [-sideRise[0], sideRise[1]]), add(corner, [-sideRise[0], sideRise[1]])),
    backLid: cut(c, d, add(d, backLip), add(c, backLip)),
    side: cut(right, far, add(far, sideRise), add(right, sideRise)), front: cut(corner, right, b, a),
    hatch: [.24, .45, .66].map(x => line(onSide(x, .12), onSide(x+.12, .25))).join(''),
    tape: cut(onFront(.34,1), onFront(.52,1), onFront(.52,.72), onFront(.46,.76), onFront(.40,.72), onFront(.34,.75)),
    mark: stamp(.13,.14,.05,.21) + stamp(.195,.215,.05,.06) + stamp(.26,.14,.05,.06) + stamp(.26,.29,.05,.06),
    frontLid: cut(a, b, add(b, lip), add(a, lip)),
  };
}
const up: Point = [0, -64];
export const drawings = [
  drawing([-22,13], [33,.5], [20,-13], [-8,5], [9,-5]),
  drawing([-9,-33], [13,-45], [6,-54], [-13,8], [12,-16]),
  drawing(up, up, up, [-14,8], [12,-18]),
  drawing(up, up, up, [-2,-20], [-5,-15]),
  drawing(up, up, up, [12.5,-8], [-12.5,8]),
];

// Blue and yellow make the base. The smaller red one hops up last.
export const cartons = [
  { start: 0, from: [-61,1], to: [-42,0], size: 1, hop: 13, lean: -6, colors: ['#91b4d3','#7096b7','#bdd4e3'], detail: 'tape' },
  { start: .76, from: [81,-3], to: [38,1], size: 1, hop: 25, lean: 7, colors: ['#f1c568','#d9a550','#f9da8d'], detail: 'mark' },
  { start: 2.04, from: [-124,10], to: [-5,-64], size: .88, hop: 70, lean: -11, colors: ['#ed896d','#d46a53','#f5ac8a'], detail: 'tape' },
] as const;

export const LANDED = 4.5;
const hold = 1.25, rewind = .72;
export const PERIOD = LANDED + hold + LANDED * rewind + .18;

// Run the same cels backwards after the hold: the top carton leaves first,
// and both ends of the loop are the very same drawing.
export function track(start: number, offsets: number[], values: string[]) {
  const beats = offsets.map(t => start + t);
  const times = [...beats, ...beats.slice().reverse().map(t => LANDED + hold + (LANDED - t) * rewind), PERIOD];
  const poses = [...values, ...values.slice().reverse(), values[0]];
  if (start > 0) { times.unshift(0); poses.unshift(values[0]); }
  return { values: poses.join(';'), keyTimes: times.map(t => +(t / PERIOD).toFixed(5)).join(';'), dur: `${PERIOD}s`, repeatCount: 'indefinite', begin: 'indefinite' };
}

export function jump(box: typeof cartons[number]) {
  const [x, y] = box.from, [tx, ty] = box.to;
  const at = (p: number, lift = 0) => `${x + (tx-x)*p} ${y + (ty-y)*p - lift}`;
  const times = [0, .16, .31, .50, .68, .82, .91, 1.08];
  const action = (keys: string[]) => track(box.start + 1.17, times, keys);
  return {
    move: action([at(0), at(0), at(.12,box.hop*.72), at(.42,box.hop), at(.78,box.hop*.67), at(1), at(1,3), at(1)]),
    turn: action(['0', `${box.lean}`, `${-box.lean}`, `${-box.lean}`, '0', `${box.lean*.3}`, '0', '0']),
    squash: action(['1 1','1.07 .89','.95 1.07','1 1','1 1','1.08 .88','.97 1.04','1 1']),
  };
}
