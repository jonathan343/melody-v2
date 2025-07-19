import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

interface AuroraProps {
  colorStops?: string[];
  rotationSpeed?: number;
  gradientIntensity?: number;
  gradientSize?: number;
  turbulence?: number;
  pulsing?: number;
  time?: number;
  speed?: number;
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uRotationSpeed;
uniform float uGradientIntensity;
uniform float uGradientSize;
uniform float uTurbulence;
uniform float uPulsing;

out vec4 fragColor;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise with interpolation
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise with multiple octaves
float fractalNoise(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 4; i++) {
    value += amplitude * smoothNoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  
  // Apply turbulence distortion
  if(uTurbulence > 0.0) {
    vec2 noiseOffset = vec2(
      fractalNoise(uv * 3.0 + uTime * 0.1) - 0.5,
      fractalNoise(uv * 3.0 + uTime * 0.1 + 100.0) - 0.5
    ) * uTurbulence;
    uv += noiseOffset;
  }
  
  // Create rotating angle
  float angle = uTime * uRotationSpeed;
  
  // Create three rotating gradients with offset angles
  float angle1 = angle;
  float angle2 = angle + 2.094; // 120 degrees in radians
  float angle3 = angle + 4.188; // 240 degrees in radians
  
  // Create directional gradients
  vec2 dir1 = vec2(cos(angle1), sin(angle1));
  vec2 dir2 = vec2(cos(angle2), sin(angle2));
  vec2 dir3 = vec2(cos(angle3), sin(angle3));
  
  // Calculate gradient values
  float grad1 = dot(uv, dir1) * 0.5 + 0.5;
  float grad2 = dot(uv, dir2) * 0.5 + 0.5;
  float grad3 = dot(uv, dir3) * 0.5 + 0.5;
  
  // Apply smooth falloff from center with pulsing
  float dist = length(uv);
  float pulse = 1.0 + sin(uTime * 4.0) * uPulsing;
  float dynamicSize = uGradientSize * pulse;
  float dynamicIntensity = uGradientIntensity * pulse;
  float falloff = 1.0 - smoothstep(0.0, dynamicSize, dist);
  
  // Blend the three colors with pulsing
  vec3 color1 = uColorStops[0] * grad1 * falloff * dynamicIntensity;
  vec3 color2 = uColorStops[1] * grad2 * falloff * dynamicIntensity;
  vec3 color3 = uColorStops[2] * grad3 * falloff * dynamicIntensity;
  
  vec3 finalColor = color1 + color2 + color3;
  
  // Add some blur effect by sampling neighboring pixels
  vec2 texelSize = 1.0 / uResolution;
  vec3 blur = finalColor * 0.4;
  
  // Simple box blur
  for(int x = -1; x <= 1; x++) {
    for(int y = -1; y <= 1; y++) {
      if(x == 0 && y == 0) continue;
      vec2 offset = vec2(float(x), float(y)) * texelSize * 3.0;
      vec2 sampleUv = (gl_FragCoord.xy + offset - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
      
      float sampleDist = length(sampleUv);
      float sampleFalloff = 1.0 - smoothstep(0.0, dynamicSize, sampleDist);
      
      vec2 sampleDir1 = vec2(cos(angle1), sin(angle1));
      vec2 sampleDir2 = vec2(cos(angle2), sin(angle2));
      vec2 sampleDir3 = vec2(cos(angle3), sin(angle3));
      
      float sampleGrad1 = dot(sampleUv, sampleDir1) * 0.5 + 0.5;
      float sampleGrad2 = dot(sampleUv, sampleDir2) * 0.5 + 0.5;
      float sampleGrad3 = dot(sampleUv, sampleDir3) * 0.5 + 0.5;
      
      vec3 sampleColor = (uColorStops[0] * sampleGrad1 + uColorStops[1] * sampleGrad2 + uColorStops[2] * sampleGrad3) * sampleFalloff * dynamicIntensity;
      blur += sampleColor * 0.075;
    }
  }
  
  finalColor = mix(finalColor, blur, 0.6);
  
  fragColor = vec4(finalColor, 1.0);
}
`;

export default function Aurora(props: AuroraProps) {
  const {
    colorStops = ["#5227FF", "#7cff67", "#5227FF"],
    rotationSpeed = 0.8,
    gradientIntensity = 0.6,
    gradientSize = 0.8,
    turbulence = 0.0,
    pulsing = 0.0,
  } = props;
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: false, // Reduce GPU load
    });
    
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";
    gl.canvas.style.position = "absolute";
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none"; // Prevent interference with UI

    // eslint-disable-next-line prefer-const
    let program: Program | undefined;
    let resizeTimeout: NodeJS.Timeout;

    const resize = () => {
      // Debounce resize to prevent excessive calls
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!ctn) return;
        const width = ctn.offsetWidth;
        const height = ctn.offsetHeight;
        renderer.setSize(width, height);
        if (program) {
          program.uniforms.uResolution.value = [width, height];
        }
      }, 16); // ~60fps
    };
    
    window.addEventListener("resize", resize, { passive: true });

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uRotationSpeed: { value: rotationSpeed },
        uGradientIntensity: { value: gradientIntensity },
        uGradientSize: { value: gradientSize },
        uTurbulence: { value: turbulence },
        uPulsing: { value: pulsing },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);
    resize();

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      
      if (program) {
        const currentProps = propsRef.current;
        program.uniforms.uTime.value = time * speed * 0.2;
        program.uniforms.uRotationSpeed.value = currentProps.rotationSpeed ?? rotationSpeed;
        program.uniforms.uGradientIntensity.value = currentProps.gradientIntensity ?? gradientIntensity;
        program.uniforms.uGradientSize.value = currentProps.gradientSize ?? gradientSize;
        program.uniforms.uTurbulence.value = currentProps.turbulence ?? turbulence;
        program.uniforms.uPulsing.value = currentProps.pulsing ?? pulsing;
        
        const stops = currentProps.colorStops ?? colorStops;
        program.uniforms.uColorStops.value = stops.map((hex: string) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
        
        renderer.render({ scene: mesh });
      }
    };
    
    animateId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animateId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", resize);
      
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove dependencies to prevent re-mounting WebGL context

  return <div ref={ctnDom} className="w-full h-full" />;
}