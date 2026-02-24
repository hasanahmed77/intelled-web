"use client";

import { useEffect, useRef } from "react";

type RaysOrigin =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type LightRaysProps = {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
};

const DEFAULT_COLOR = "#ffffff";

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) {
    return [1, 1, 1];
  }
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

function getAnchorAndDir(origin: RaysOrigin, w: number, h: number) {
  const outside = 0.2;
  switch (origin) {
    case "top-left":
      return { anchor: [0, -outside * h] as [number, number], dir: [0, 1] as [number, number] };
    case "top-right":
      return { anchor: [w, -outside * h] as [number, number], dir: [0, 1] as [number, number] };
    case "left":
      return { anchor: [-outside * w, 0.5 * h] as [number, number], dir: [1, 0] as [number, number] };
    case "right":
      return {
        anchor: [(1 + outside) * w, 0.5 * h] as [number, number],
        dir: [-1, 0] as [number, number]
      };
    case "bottom-left":
      return { anchor: [0, (1 + outside) * h] as [number, number], dir: [0, -1] as [number, number] };
    case "bottom-center":
      return {
        anchor: [0.5 * w, (1 + outside) * h] as [number, number],
        dir: [0, -1] as [number, number]
      };
    case "bottom-right":
      return { anchor: [w, (1 + outside) * h] as [number, number], dir: [0, -1] as [number, number] };
    default:
      return {
        anchor: [0.5 * w, -outside * h] as [number, number],
        dir: [0, 1] as [number, number]
      };
  }
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function LightRays({
  raysOrigin = "top-center",
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = ""
}: LightRaysProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.innerHTML = "";
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true });
    if (!gl) {
      return;
    }
    glRef.current = gl;

    const vertex = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `
      precision highp float;

      uniform float iTime;
      uniform vec2  iResolution;

      uniform vec2  rayPos;
      uniform vec2  rayDir;
      uniform vec3  raysColor;
      uniform float raysSpeed;
      uniform float lightSpread;
      uniform float rayLength;
      uniform float pulsating;
      uniform float fadeDistance;
      uniform float saturation;
      uniform vec2  mousePos;
      uniform float mouseInfluence;
      uniform float noiseAmount;
      uniform float distortion;

      varying vec2 vUv;

      float noise(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                        float seedA, float seedB, float speed) {
        vec2 sourceToCoord = coord - raySource;
        vec2 dirNorm = normalize(sourceToCoord);
        float cosAngle = dot(dirNorm, rayRefDirection);

        float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
        float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

        float distance = length(sourceToCoord);
        float maxDistance = iResolution.x * rayLength;
        float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
        float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
        float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

        float baseStrength = clamp(
          (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
          (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
          0.0, 1.0
        );

        return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);

        vec2 finalRayDir = rayDir;
        if (mouseInfluence > 0.0) {
          vec2 mouseScreenPos = mousePos * iResolution.xy;
          vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
          finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
        }

        vec4 rays1 = vec4(1.0) *
                     rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
        vec4 rays2 = vec4(1.0) *
                     rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);

        fragColor = rays1 * 0.5 + rays2 * 0.4;

        if (noiseAmount > 0.0) {
          float n = noise(coord * 0.01 + iTime * 0.1);
          fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
        }

        float brightness = 1.0 - (coord.y / iResolution.y);
        fragColor.x *= 0.1 + brightness * 0.8;
        fragColor.y *= 0.3 + brightness * 0.6;
        fragColor.z *= 0.5 + brightness * 0.5;

        if (saturation != 1.0) {
          float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
          fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
        }

        fragColor.rgb *= raysColor;
        fragColor.a = max(max(fragColor.r, fragColor.g), fragColor.b);
      }

      void main() {
        vec4 color;
        mainImage(color, gl_FragCoord.xy);
        gl_FragColor = color;
      }
    `;

    const program = createProgram(gl, vertex, fragment);
    if (!program) {
      return;
    }
    programRef.current = program;

    const positionLocation = gl.getAttribLocation(program, "position");
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
      ]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const loc = {
      iTime: gl.getUniformLocation(program, "iTime"),
      iResolution: gl.getUniformLocation(program, "iResolution"),
      rayPos: gl.getUniformLocation(program, "rayPos"),
      rayDir: gl.getUniformLocation(program, "rayDir"),
      raysColor: gl.getUniformLocation(program, "raysColor"),
      raysSpeed: gl.getUniformLocation(program, "raysSpeed"),
      lightSpread: gl.getUniformLocation(program, "lightSpread"),
      rayLength: gl.getUniformLocation(program, "rayLength"),
      pulsating: gl.getUniformLocation(program, "pulsating"),
      fadeDistance: gl.getUniformLocation(program, "fadeDistance"),
      saturation: gl.getUniformLocation(program, "saturation"),
      mousePos: gl.getUniformLocation(program, "mousePos"),
      mouseInfluence: gl.getUniformLocation(program, "mouseInfluence"),
      noiseAmount: gl.getUniformLocation(program, "noiseAmount"),
      distortion: gl.getUniformLocation(program, "distortion")
    };

    const updateSize = () => {
      if (!containerRef.current || !canvasRef.current || !glRef.current) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wCSS = containerRef.current.clientWidth;
      const hCSS = containerRef.current.clientHeight;
      canvasRef.current.width = Math.max(1, Math.floor(wCSS * dpr));
      canvasRef.current.height = Math.max(1, Math.floor(hCSS * dpr));
      gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);

      const { anchor, dir } = getAnchorAndDir(raysOrigin, canvasRef.current.width, canvasRef.current.height);
      gl.uniform2f(loc.iResolution, canvasRef.current.width, canvasRef.current.height);
      gl.uniform2f(loc.rayPos, anchor[0], anchor[1]);
      gl.uniform2f(loc.rayDir, dir[0], dir[1]);
    };

    const applyStaticUniforms = () => {
      const [r, g, b] = hexToRgb(raysColor);
      gl.uniform3f(loc.raysColor, r, g, b);
      gl.uniform1f(loc.raysSpeed, raysSpeed);
      gl.uniform1f(loc.lightSpread, lightSpread);
      gl.uniform1f(loc.rayLength, rayLength);
      gl.uniform1f(loc.pulsating, pulsating ? 1 : 0);
      gl.uniform1f(loc.fadeDistance, fadeDistance);
      gl.uniform1f(loc.saturation, saturation);
      gl.uniform1f(loc.mouseInfluence, mouseInfluence);
      gl.uniform1f(loc.noiseAmount, noiseAmount);
      gl.uniform1f(loc.distortion, distortion);
    };

    applyStaticUniforms();
    updateSize();

    const render = (t: number) => {
      if (!glRef.current || !programRef.current) {
        return;
      }

      if (startRef.current === 0) {
        startRef.current = t;
      }
      const elapsed = (t - startRef.current) * 0.001;
      gl.uniform1f(loc.iTime, elapsed);

      if (followMouse && mouseInfluence > 0) {
        const smoothing = 0.92;
        smoothMouseRef.current.x = smoothMouseRef.current.x * smoothing + mouseRef.current.x * (1 - smoothing);
        smoothMouseRef.current.y = smoothMouseRef.current.y * smoothing + mouseRef.current.y * (1 - smoothing);
        gl.uniform2f(loc.mousePos, smoothMouseRef.current.x, smoothMouseRef.current.y);
      } else {
        gl.uniform2f(loc.mousePos, 0.5, 0.5);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameRef.current = requestAnimationFrame(render);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      mouseRef.current = { x, y };
    };

    window.addEventListener("resize", updateSize);
    if (followMouse) {
      window.addEventListener("mousemove", onMouseMove);
    }

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("mousemove", onMouseMove);

      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }

      if (buffer && glRef.current) {
        glRef.current.deleteBuffer(buffer);
      }

      programRef.current = null;
      glRef.current = null;
      canvasRef.current = null;
      startRef.current = 0;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    saturation,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion
  ]);

  return <div ref={containerRef} className={`light-rays-container ${className}`.trim()} />;
}
