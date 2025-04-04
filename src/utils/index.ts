export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}; 