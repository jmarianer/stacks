export type Vec2 = { x: number; y: number };

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function norm(v: Vec2): Vec2 {
  const l = len(v);
  return l === 0 ? { x: 1, y: 0 } : { x: v.x / l, y: v.y / l };
}

/** Mutates v: v += u * s */
export function addScaled(v: Vec2, u: Vec2, s: number): void {
  v.x += u.x * s;
  v.y += u.y * s;
}
