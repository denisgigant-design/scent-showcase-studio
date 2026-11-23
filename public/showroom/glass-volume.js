import {Color, Vector3} from './three-showroom.js?v=2';

const declarations = `
varying vec3 glassPoint;
uniform vec3 bottleEye;
uniform vec3 fluidMin;
uniform vec3 fluidMax;
uniform vec3 fluidColor;
uniform vec3 fluidMotion;
uniform float fluidLight;
uniform float fillHeight;

void refractThroughLiquid(inout vec3 diffuseLight) {
  vec3 ray = normalize(glassPoint - bottleEye);
  vec3 safeRay = sign(ray + 0.000001) * max(abs(ray), vec3(0.0001));
  float height = max(fluidMax.y - fluidMin.y, 0.0001);
  vec3 nearPlane = (fluidMin - glassPoint) / safeRay;
  vec3 farPlane = (fluidMax - glassPoint) / safeRay;
  vec3 a = min(nearPlane, farPlane);
  vec3 b = max(nearPlane, farPlane);
  float start = max(0.0, max(max(a.x, a.y), a.z));
  float end = min(min(b.x, b.y), b.z);
  if (end <= start) return;

  vec3 center = (fluidMin + fluidMax) * 0.5;
  vec3 entry = glassPoint + ray * start;
  vec2 slope = fluidMotion.xy;
  float surfaceRipple = sin((entry.x - center.x) / height * 10.0 + fluidMotion.z * 2.9);
  float level = mix(fluidMin.y,fluidMax.y,fillHeight) + height * min(length(slope),0.22) * 0.012 * surfaceRipple;
  float vertical = ray.y - dot(slope, ray.xz);
  float crossPlane = level - glassPoint.y + dot(slope, glassPoint.xz - center.xz);
  float planeHit = crossPlane / (abs(vertical) < 0.0001 ? 0.0001 : vertical);
  float wetStart = vertical < -0.0001 ? max(start, planeHit) : start;
  float wetEnd = vertical > 0.0001 ? min(end, planeHit) : end;
  if (abs(vertical) < 0.0001 && crossPlane < 0.0) wetEnd = wetStart;
  float distanceThroughLiquid = max(0.0, wetEnd - wetStart) / height;

  vec3 absorption = exp(-max(vec3(0.10), vec3(1.0) - fluidColor)
    * (distanceThroughLiquid * 2.05));
  float wet = 1.0 - exp(-distanceThroughLiquid * 2.2);
  float deviation = abs(entry.y - level - dot(slope, entry.xz - center.xz));
  float meniscus = 1.0 - smoothstep(height * 0.005, height * 0.012, deviation);
  diffuseLight = diffuseLight * absorption
    + fluidColor * wet * fluidLight * 0.083
    + mix(vec3(0.92), fluidColor, 0.22) * meniscus * fluidLight * 0.012;
}
`;

export function addLiquidRefraction(mesh, bounds, product, fillHeight) {
  const uniforms = {
    bottleEye: {value: new Vector3()},
    fillHeight: {value:fillHeight},
    fluidMin: {value: bounds.min},
    fluidMax: {value: bounds.max},
    fluidColor: {value: new Color(product.liquid)},
    fluidMotion: {value: product.fluidMotion},
    fluidLight: product.fluidLight,
    bottleSpace: {value: mesh.matrixWorld.clone()}
  };
  mesh.userData.hasLiquidRefraction = true;
  mesh.material.userData.liquidView = uniforms.bottleEye.value;
  mesh.material.customProgramCacheKey = () => 'atelier-glass-volume-v2';
  mesh.material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 glassPoint; uniform mat4 bottleSpace;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n glassPoint = (bottleSpace * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + declarations)
      .replace('#include <transmission_fragment>', '#include <transmission_fragment>\n refractThroughLiquid(totalDiffuse);');
  };
}

export function bindLiquidCamera(bottle) {
  const eye = new Vector3();
  bottle.traverse(mesh => {
    if (!mesh.userData.hasLiquidRefraction) return;
    mesh.onBeforeRender = (_renderer, _scene, camera) => {
      camera.getWorldPosition(eye);
      mesh.material.userData.liquidView.copy(bottle.worldToLocal(eye));
    };
  });
}
