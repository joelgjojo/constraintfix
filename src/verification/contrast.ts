function linearize(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map(linearize) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseRgb(value: string): [number, number, number] {
  const numbers = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!numbers || numbers.length !== 3) {
    throw new Error(`Unsupported computed color: ${value}`);
  }
  return [numbers[0], numbers[1], numbers[2]];
}

export function getContrastRatio(foreground: string, background: string) {
  const l1 = luminance(parseRgb(foreground));
  const l2 = luminance(parseRgb(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
