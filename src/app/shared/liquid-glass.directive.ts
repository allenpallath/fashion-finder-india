import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

// Liquid-glass refraction ported from glisse (MIT, https://github.com/0kzh/glisse):
// a displacement map bends the backdrop through a squircle bezel by Snell's
// law, split into red/green/blue for dispersion, plus a painted rim highlight.
// Only Chromium applies SVG filters to the live backdrop; elsewhere the plain
// frosted CSS glass is left as is.

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Lens {
  filter: string;
  shine: string;
}

const lenses = new Map<string, Lens>();
let defs: SVGDefsElement | undefined;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function supportsRefraction(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    /Chrom(?:e|ium)\//.test(navigator.userAgent) &&
    !matchMedia('(prefers-reduced-transparency: reduce)').matches
  );
}

function svg(name: string, attributes: Record<string, string | number>): SVGElement {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

function container(): SVGDefsElement {
  if (defs?.isConnected) {
    return defs;
  }
  const root = svg('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
  (root as SVGSVGElement).style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  defs = svg('defs', {}) as SVGDefsElement;
  root.append(defs);
  document.body.append(root);
  return defs;
}

/** How far a ray is bent at each point across the bezel, from its outer edge inwards. */
function profile(bezel: number, thickness: number): { samples: Float32Array; maximum: number } {
  const samples = new Float32Array(128);
  let maximum = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = Math.max(0.001, i / (samples.length - 1));
    const surface = (1 - (1 - t) ** 4) ** 0.25;
    const incident = Math.atan((1 - t) ** 3 / surface ** 3);
    const refracted = Math.asin(Math.sin(incident) / 1.5);
    samples[i] = Math.tan(incident - refracted) * (thickness + surface * bezel);
    maximum = Math.max(maximum, samples[i]);
  }
  return { samples, maximum };
}

function buildMaps(width: number, height: number, radius: number) {
  // The maps are smooth, so a coarse canvas stretched over the element is enough.
  const density = clamp(512 / Math.max(width, height), 0.25, 1);
  const shorter = Math.min(width, height);
  const bezel = clamp(shorter * 0.12, 6, 28);
  const thickness = clamp(shorter * 0.2, 10, 40);
  const { samples, maximum } = profile(bezel, thickness);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * density));
  canvas.height = Math.max(1, Math.ceil(height * density));
  const context = canvas.getContext('2d')!;
  const field = context.createImageData(canvas.width, canvas.height);
  const shine = context.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = ((x + 0.5) * width) / canvas.width - width / 2;
      const py = ((y + 0.5) * height) / canvas.height - height / 2;
      const qx = Math.abs(px) - (width / 2 - radius);
      const qy = Math.abs(py) - (height / 2 - radius);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const length = Math.hypot(ox, oy);
      // Distance in from the rounded edge (positive inside).
      const distance = radius - (length + Math.min(Math.max(qx, qy), 0));
      const nx = length > 0 ? (ox / length) * Math.sign(px) : qx > qy ? Math.sign(px) : 0;
      const ny = length > 0 ? (oy / length) * Math.sign(py) : qx > qy ? 0 : Math.sign(py);

      let shift = 0;
      if (distance >= 0 && distance < bezel) {
        const sample = (distance / bezel) * (samples.length - 1);
        const lower = Math.floor(sample);
        const a = samples[lower];
        const b = samples[Math.min(lower + 1, samples.length - 1)];
        shift = a + (b - a) * (sample - lower);
      }

      const i = (y * canvas.width + x) * 4;
      field.data[i] = Math.round(127.5 + ((nx * shift) / maximum) * 127.5);
      field.data[i + 1] = Math.round(127.5 + ((ny * shift) / maximum) * 127.5);
      field.data[i + 2] = 128;
      field.data[i + 3] = 255;

      // Rim light from the top left, with its reflection bottom right.
      const light = -(nx + ny) * Math.SQRT1_2;
      const glint = Math.max(light, 0) ** 3;
      const reflected = Math.max(-light, 0) ** 3;
      shine.data[i] = shine.data[i + 1] = shine.data[i + 2] = 255;
      let alpha = 0;
      if (distance >= 0) {
        const bands = [0.18, 0.42, 0.66].map((centre) => Math.exp(-(((distance * density - centre) / 0.22) ** 2)));
        const peak = Math.max(...bands);
        alpha = peak * (0.06 + 0.8 * glint + 0.35 * reflected) * 0.85;
        for (let channel = 0; channel < 3; channel++) {
          shine.data[i + channel] = Math.round(255 * (0.65 + 0.35 * (peak ? bands[channel] / peak : 0)));
        }
      }
      shine.data[i + 3] = Math.round(clamp(alpha, 0, 1) * 255);
    }
  }

  context.putImageData(field, 0, 0);
  const displacement = canvas.toDataURL();
  context.putImageData(shine, 0, 0);
  const highlight = canvas.toDataURL();
  return { displacement, highlight, scale: maximum * 2 };
}

function lensFor(width: number, height: number, radius: number): Lens {
  const key = `${width}x${height}r${radius}`;
  const cached = lenses.get(key);
  if (cached) {
    return cached;
  }

  const { displacement, highlight, scale } = buildMaps(width, height, radius);
  const id = `liquid-glass-${lenses.size}`;
  const box = { x: 0, y: 0, width, height };
  const filter = svg('filter', {
    id,
    ...box,
    filterUnits: 'userSpaceOnUse',
    primitiveUnits: 'userSpaceOnUse',
    'color-interpolation-filters': 'sRGB',
  });
  filter.append(svg('feImage', { href: displacement, ...box, preserveAspectRatio: 'none', result: 'field' }));

  const channels = [
    ['r', 1.035, '1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'],
    ['g', 1, '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0'],
    ['b', 0.965, '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'],
  ] as const;
  for (const [name, factor, values] of channels) {
    filter.append(
      svg('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'field',
        scale: scale * factor,
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: `${name}-ray`,
      }),
      svg('feColorMatrix', { in: `${name}-ray`, type: 'matrix', values, result: name })
    );
  }
  filter.append(
    svg('feComposite', { in: 'r', in2: 'g', operator: 'arithmetic', k2: 1, k3: 1, result: 'rg' }),
    svg('feComposite', { in: 'rg', in2: 'b', operator: 'arithmetic', k2: 1, k3: 1 })
  );
  container().append(filter);

  const lens = { filter: `url("#${id}")`, shine: `url("${highlight}")` };
  lenses.set(key, lens);
  return lens;
}

/**
 * Adds glisse-style refraction and rim light to a glass element. The element's
 * CSS reads `--lg-refract` in its backdrop-filter and `--lg-shine` as a
 * background layer (see styles.css).
 */
@Directive({
  selector: '[liquidGlass]',
})
export class LiquidGlassDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: ResizeObserver;
  private frame = 0;

  ngAfterViewInit(): void {
    if (!supportsRefraction()) {
      return;
    }
    this.observer = new ResizeObserver(() => {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.fit());
    });
    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private fit(): void {
    const element = this.host.nativeElement;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (!width || !height) {
      return;
    }
    const corner = getComputedStyle(element).borderTopLeftRadius;
    const radius = Math.round(
      Math.min(
        width / 2,
        height / 2,
        corner.endsWith('%') ? (Math.min(width, height) * parseFloat(corner)) / 100 : parseFloat(corner) || 0
      )
    );
    const { filter, shine } = lensFor(width, height, radius);
    element.style.setProperty('--lg-refract', filter);
    element.style.setProperty('--lg-shine', shine);
  }
}
