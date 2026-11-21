import { AfterViewInit, Component, ElementRef, OnDestroy, viewChild } from '@angular/core';
import { WAVES_FRAGMENT_SHADER, WAVES_VERTEX_SHADER } from './waves.shader';

// Shader settings (from the 21st.dev Shader Builder recipe, cursor effect off).
// Dark colours only so white text stays readable: #000000 → #031C26 → #0A2E57 → #1B6CA8.
const COLORS = new Float32Array([0, 0, 0, 0.012, 0.11, 0.149, 0.039, 0.18, 0.341, 0.106, 0.424, 0.659, ...Array(12).fill(0)]);
const UNIFORMS: Record<string, readonly [number, number, number, number]> = {
  u_shape: [2.0, 0.54, 0.47, 0.04], // scale, intensity, paramA, warp
  u_surface: [1.54, 1.16, 0.0, 1.0], // detail, contrast, brightness, saturation
  u_finish: [0.0, 0.21, 0.002, 0.1], // hue, vignette, blur, grain
  u_transform: [4012.0, 5.65, 0.12, 0.0], // seed, rotation, drift, OKLab
  u_space: [0.11, -0.19, 0, 0], // offset.xy, pointer.xy
  u_cursor: [0, 2.0, 0.65, 0.46], // presence, effect, strength, radius
};
/** Point in the animation used for the still frame (seconds × time scale). */
const STILL_TIME = 6 * -0.73;
const COLOR_COUNT = 4;

/** Static WebGL "waves" background. Drawn once, and again only when the window resizes. */
@Component({
  selector: 'app-waves-background',
  host: { class: 'fixed inset-0 -z-10 block pointer-events-none bg-ink', 'aria-hidden': 'true' },
  template: `<canvas #canvas class="block w-full h-full"></canvas>`,
})
export class WavesBackgroundComponent implements AfterViewInit, OnDestroy {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    const canvas = this.canvas().nativeElement;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    const program = gl && createProgram(gl);
    if (!gl || !program) return; // No WebGL: the host's solid colour shows instead.

    setUniforms(gl, program);
    const scene = gl.getUniformLocation(program, 'u_scene');
    // Resizing clears the canvas, so every resize redraws.
    this.observer = new ResizeObserver(() => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform4f(scene, canvas.width, canvas.height, STILL_TIME, COLOR_COUNT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    this.observer.observe(canvas);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** Compiles the shaders and binds one oversized triangle that covers the viewport. */
function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, WAVES_VERTEX_SHADER],
    [gl.FRAGMENT_SHADER, WAVES_FRAGMENT_SHADER],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Waves shader error:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  return program;
}

function setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
  gl.uniform3fv(gl.getUniformLocation(program, 'u_colors'), COLORS);
  for (const [name, value] of Object.entries(UNIFORMS)) {
    gl.uniform4f(gl.getUniformLocation(program, name), ...value);
  }
}
