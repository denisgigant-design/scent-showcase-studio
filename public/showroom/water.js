import {Color, PlaneGeometry, Reflector, Vector3} from './three-showroom.js?v=2';

const source = Reflector.ReflectorShader;
const waterShader = {
  name: 'Midnight water',
  uniforms: {
    ...source.uniforms,
    clock: {value: 0},
    pools: {value: Array.from({length: 5}, () => new Vector3())},
    poolColors: {value: Array.from({length: 5}, () => new Color())}
  },
  vertexShader: source.vertexShader
    .replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec3 vSurface;')
    .replace('vUv = textureMatrix', 'vSurface = (modelMatrix * vec4(position, 1.0)).xyz;\n vUv = textureMatrix'),
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float clock;
    uniform vec3 pools[5];
    uniform vec3 poolColors[5];
    varying vec4 vUv;
    varying vec3 vSurface;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec2 p = vSurface.xz;
      float a = sin(dot(p, vec2(2.4, 7.8)) + clock * .48);
      float b = sin(dot(p, vec2(-5.1, 6.7)) - clock * .37 + a * 0.72);
      float c = sin(dot(p, vec2(8.9, 13.2)) + clock * .53);
      float fine = sin(dot(p, vec2(24.7, -18.3)) + clock * .81);
      vec2 ripple = vec2(a * 0.6 + c * 0.28 + fine * .16, b + c * 0.37 + fine * .18);
      vec3 normal = normalize(vec3(-.045 * cos(dot(p,vec2(2.4,7.8))+clock*.48)
        -.012 * fine, 1.0, -.055 * cos(dot(p,vec2(-5.1,6.7))-clock*.37)));
      vec3 eye = normalize(cameraPosition - vSurface);
      float grazing = pow(1.0 - clamp(eye.y, 0.0, 1.0), 3.0);
      vec2 uv = vUv.xy / vUv.w + ripple * (0.0022 + grazing * 0.0016);
      vec2 edge = min(uv, 1.0 - uv);
      float valid = smoothstep(0.0, 0.076, min(edge.x, edge.y));
      vec3 mirrored = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb * valid;
      mirrored = max(vec3(0.0), (mirrored - .009) * .82);
      vec3 glints = vec3(0.0);
      float slope = smoothstep(0.66, 1.12, a * b * 0.66 + c * 0.24);
      for (int i = 0; i < 5; ++i) {
        vec2 q = p - pools[i].xy;
        vec2 streak = vec2(q.x * 0.62, q.y * 0.92);
        float drop = exp(-dot(streak, streak) * 0.24);
        float shine = pow(max(0.0, 0.5 + 0.5 * sin(14.0 * length(q) - clock * 1.6 + b)), 4.0);
        vec3 light = normalize(vec3(pools[i].x-p.x, 5.5, pools[i].y-p.y));
        vec3 halfway = normalize(light + eye);
        float specular = pow(max(dot(normal,halfway),0.0),96.0);
        glints += mix(poolColors[i],vec3(1.0),.18) * drop * pools[i].z
          * (0.014 + 0.035 * shine * slope + specular * .24);
      }
      float fade = 1.0 - .65*smoothstep(18.0, 72.0, length(p));
      float skyRipple=.5+.5*dot(normal,normalize(vec3(-.4,.25,.7)));
      vec3 surface = vec3(.0019,.0028,.0038)*(.68+skyRipple*.8) + glints*.46;
      surface += mirrored * (0.56 + 0.12 * grazing);
      gl_FragColor = vec4(surface * fade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
};

export function makeWater(renderer, compact) {
  const size = compact ? 512 : 1024;
  const surface = new Reflector(new PlaneGeometry(170, 180), {
    textureWidth: size, textureHeight: size, multisample: 0, clipBias: 0.002, shader: waterShader
  });
  // UnsignedByteType keeps the reflection framebuffer available on mobile GPUs without float colour targets.
  if (compact || !renderer.extensions.has('EXT_color_buffer_float')) {
    surface.getRenderTarget().texture.type = 1009;
  }
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -2.93;
  const renderReflection = surface.onBeforeRender.bind(surface);
  let last = -Infinity;
  surface.onBeforeRender = (activeRenderer, scene, camera, ...rest) => {
    if (activeRenderer.getRenderTarget()) return;
    const now = performance.now();
    if (now - last < (compact ? 60 : 40)) return;
    last = now;
    renderReflection(activeRenderer, scene, camera, ...rest);
  };
  return surface;
}
