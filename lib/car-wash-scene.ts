import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

export type CarWashScene = { setMotion: (enabled: boolean, clean?: boolean) => void; dispose: () => void };
const smooth = (start: number, end: number, value: number) => THREE.MathUtils.smoothstep(value, start, end);

export async function createCarWashScene(host: HTMLDivElement, signal: AbortSignal, onFailure: () => void): Promise<CarWashScene> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL2 unavailable");
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  let shaderFailed = false;
  renderer.debug.onShaderError = () => { shaderFailed = true; };
  renderer.setClearColor(0xf7f7f4, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const rig = new THREE.Group();
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment, .04, .1, 100);
  scene.environment = environmentMap.texture;
  environment.dispose();
  pmrem.dispose();
  const resources = new Set<THREE.Material | THREE.BufferGeometry>();
  let disposed = false;
  let frame = 0;
  let enabled = false;
  let cleanView = true;
  let visible = true;
  let clock = 0;
  let previous = 0;
  let count = 0;
  let resizeObserver: ResizeObserver | undefined;
  let visibilityObserver: IntersectionObserver | undefined;
  let removeListeners = () => {};
  const pointer = new THREE.Vector2();
  const mobile = () => host.clientWidth < 560;
  const uniforms = { foam: { value: 0 }, rinse: { value: 3 }, shine: { value: -5 }, shineStrength: { value: 0 } };

  const own = <T extends THREE.Material | THREE.BufferGeometry>(value: T): T => { resources.add(value); return value; };
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver?.disconnect(); visibilityObserver?.disconnect();
    removeListeners();
    resources.forEach((resource) => resource.dispose());
    environmentMap.dispose(); renderer.dispose(); renderer.forceContextLoss();
    canvas.remove();
  }

  try {
    const response = await fetch("/models/detailing-car.glb", { signal });
    if (!response.ok) throw new Error("Car model unavailable");
    const bytes = await response.arrayBuffer();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, "");
    const car = gltf.scene;
    car.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        own(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(own);
      }
    });
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const bounds = new THREE.Box3().setFromObject(car);
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 4.4 / bounds.getSize(new THREE.Vector3()).z;
    car.scale.setScalar(scale);
    car.position.set(-center.x * scale, -bounds.min.y * scale + .02, -center.z * scale);
    rig.add(car);
    car.updateMatrixWorld(true);

    const paintMeshes: THREE.Mesh[] = [];
    const replacements = new Map<THREE.Material, THREE.Material>();
    car.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const original = object.material as THREE.MeshStandardMaterial;
      if (/Paint/.test(original.name)) {
        paintMeshes.push(object);
        let material = replacements.get(original);
        if (!material) {
          const paint = own(new THREE.MeshPhysicalMaterial({ color: "#414b4f", metalness: .82, roughness: .24, clearcoat: 1, clearcoatRoughness: .12, side: original.side }));
          // Foam follows the actual body surfaces; the rinse plane follows the moving jet.
          paint.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, { uFoam: uniforms.foam, uRinse: uniforms.rinse, uShine: uniforms.shine, uShineStrength: uniforms.shineStrength });
            shader.vertexShader = "varying vec3 vWashPosition;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvWashPosition = (modelMatrix * vec4(position, 1.0)).xyz;");
            shader.fragmentShader = "varying vec3 vWashPosition; uniform float uFoam; uniform float uRinse; uniform float uShine; uniform float uShineStrength;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
              float grain = fract(sin(dot(floor(vWashPosition * 95.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
              float foamPatch = .5 + .25 * sin(vWashPosition.z * 9.0) + .25 * sin(vWashPosition.x * 14.0 + vWashPosition.y * 18.0);
              float coat = smoothstep(foamPatch * .7, foamPatch * .7 + .22, uFoam) * (1.0 - smoothstep(uRinse - .14, uRinse + .14, vWashPosition.z));
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.91, .94, .92) * (.86 + .14 * grain), coat);
            `);
            shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .87, coat);");
            shader.fragmentShader = shader.fragmentShader.replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, .02, coat);");
            shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\nfloat glint = (1.0 - smoothstep(.0, .14, abs(vWashPosition.z - uShine))) * uShineStrength; totalEmissiveRadiance += vec3(.48, .46, .39) * glint;");
          };
          material = paint;
          replacements.set(original, material);
        }
        object.material = material;
      }
    });

    const stage = new THREE.Mesh(own(new THREE.CylinderGeometry(2.9, 2.94, .12, 96)), own(new THREE.MeshStandardMaterial({ color: "#deded8", roughness: .5, metalness: .25 })));
    stage.position.y = -.07; stage.receiveShadow = true; rig.add(stage);
    const rim = new THREE.Mesh(own(new THREE.TorusGeometry(2.9, .012, 8, 96)), own(new THREE.MeshStandardMaterial({ color: "#b3945b", metalness: .7, roughness: .28 })));
    rim.rotation.x = Math.PI / 2; rim.position.y = -.025; rig.add(rim);
    const ground = new THREE.Mesh(own(new THREE.PlaneGeometry(200, 200)), own(new THREE.ShadowMaterial({ opacity: .12 })));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.15; rig.add(ground);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8b897d, 2));
    const key = new THREE.DirectionalLight(0xfff8ec, 4);
    key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
    key.shadow.normalBias = .025; key.shadow.bias = -.0002; key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe3edf2, 2.5); fill.position.set(4, 3, -3); scene.add(fill);

    let seed = 81;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const foamCount = mobile() ? 420 : 1100;
    const foam = new THREE.InstancedMesh(own(new THREE.SphereGeometry(1, 7, 5)), own(new THREE.MeshStandardMaterial({ color: "#f2f5ef", roughness: .96 })), foamCount);
    foam.instanceMatrix.setUsage(THREE.DynamicDrawUsage); foam.frustumCulled = false; rig.add(foam);
    const samplers = paintMeshes.map((mesh) => ({ mesh, sampler: new MeshSurfaceSampler(mesh).build() }));
    const foamPoints: { position: THREE.Vector3; normal: THREE.Vector3; radius: number; threshold: number }[] = [];
    const p = new THREE.Vector3(); const normal = new THREE.Vector3();
    for (let i = 0; i < foamCount; i++) {
      const item = samplers[Math.floor(random() * samplers.length)];
      item.sampler.sample(p, normal);
      p.applyMatrix4(item.mesh.matrixWorld);
      normal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(item.mesh.matrixWorld));
      foamPoints.push({ position: p.clone().addScaledVector(normal, .012), normal: normal.clone(), radius: .015 + random() * .035, threshold: random() * .7 });
    }
    const dummy = new THREE.Object3D();
    const bubbleGeometry = own(new THREE.SphereGeometry(1, 20, 12));
    const bubbleMaterial = own(new THREE.MeshPhysicalMaterial({ color: "#edf4ee", metalness: .1, roughness: .08, transparent: true, opacity: .2, clearcoat: 1, iridescence: .25, depthWrite: false }));
    const bubbles = Array.from({ length: mobile() ? 4 : 8 }, (_, i) => {
      const mesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      const x = (i % 2 ? -1 : 1) * (1.35 + random() * .5);
      const y = .5 + random() * 1.3; const z = random() * 3 - 1.5;
      const radius = .06 + random() * .08;
      mesh.position.set(x, y, z); mesh.scale.setScalar(radius); rig.add(mesh);
      return { mesh, x, y, z, radius };
    });

    const metal = own(new THREE.MeshStandardMaterial({ color: "#adb3b4", metalness: .9, roughness: .24 }));
    const rubber = own(new THREE.MeshStandardMaterial({ color: "#202321", roughness: .65 }));
    const brass = own(new THREE.MeshStandardMaterial({ color: "#b3945b", metalness: .7, roughness: .27 }));
    const lance = new THREE.Group(); rig.add(lance);
    const shaft = new THREE.Mesh(own(new THREE.CylinderGeometry(.025, .025, .85, 12)), metal);
    shaft.rotation.x = Math.PI / 2; shaft.position.z = -.425; lance.add(shaft);
    const handle = new THREE.Mesh(own(new THREE.CapsuleGeometry(.08, .29, 4, 12)), rubber);
    handle.rotation.x = -.5; handle.position.set(0, -.11, -.96); lance.add(handle);
    const grip = new THREE.Mesh(own(new THREE.CylinderGeometry(.065, .065, .27, 12)), rubber);
    grip.rotation.x = Math.PI / 2; grip.position.z = -.83; lance.add(grip);
    const nozzle = new THREE.Mesh(own(new THREE.CylinderGeometry(.038, .056, .12, 12)), brass);
    nozzle.rotation.x = Math.PI / 2; nozzle.position.z = .025; lance.add(nozzle);
    const trigger = new THREE.Mesh(own(new THREE.TorusGeometry(.12, .018, 6, 16, Math.PI)), brass);
    trigger.rotation.y = Math.PI / 2; trigger.position.set(0, -.1, -.83); lance.add(trigger);

    const waterGeometry = own(new THREE.BufferGeometry());
    const waterCount = mobile() ? 100 : 220;
    const waterPositions = new Float32Array(waterCount * 3);
    const waterAttribute = new THREE.BufferAttribute(waterPositions, 3).setUsage(THREE.DynamicDrawUsage);
    waterGeometry.setAttribute("position", waterAttribute);
    const waterMaterial = own(new THREE.PointsMaterial({ color: "#b9d6df", size: .038, transparent: true, opacity: .65, depthWrite: false }));
    const water = new THREE.Points(waterGeometry, waterMaterial); water.frustumCulled = false; rig.add(water);
    const sprayMaterial = own(new THREE.MeshBasicMaterial({ color: "#d5e8e9", transparent: true, opacity: .13, depthWrite: false, side: THREE.DoubleSide }));
    const spray = new THREE.Mesh(own(new THREE.CylinderGeometry(.02, .26, 1, 14, 1, true)), sprayMaterial); rig.add(spray);
    const waterStart = new THREE.Vector3(); const waterEnd = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    function draw(time: number) {
      if (disposed) return;
      const dt = previous ? Math.min((time - previous) / 1000, .05) : 0;
      previous = time;
      if (enabled) clock += dt;
      const t = cleanView ? 17 : clock % 22;
      const wash = smooth(2, 6, t);
      const rinse = smooth(7, 12, t);
      const spraying = smooth(6.8, 7.4, t) * (1 - smooth(11.6, 12.3, t));
      uniforms.foam.value = wash;
      uniforms.rinse.value = 3 - rinse * 6;
      uniforms.shine.value = 3 - smooth(12.5, 15.5, t) * 6;
      uniforms.shineStrength.value = smooth(12.3, 12.8, t) * (1 - smooth(15.1, 15.7, t));
      const phase = t < 2 || t >= 16 ? "clean" : t < 7 ? "foam" : t < 12.5 ? "rinse" : "shine";
      host.dataset.phase = phase;
      rig.rotation.y = THREE.MathUtils.damp(rig.rotation.y, enabled ? pointer.x * .065 : 0, 3, dt || .016);
      rig.rotation.x = THREE.MathUtils.damp(rig.rotation.x, enabled ? pointer.y * .018 : 0, 3, dt || .016);
      foamPoints.forEach((point, i) => {
        const amount = smooth(point.threshold, point.threshold + .25, wash) * (1 - smooth(uniforms.rinse.value - .18, uniforms.rinse.value + .18, point.position.z));
        dummy.position.copy(point.position); dummy.scale.setScalar(Math.max(.00001, point.radius * amount));
        dummy.updateMatrix(); foam.setMatrixAt(i, dummy.matrix);
      });
      foam.instanceMatrix.needsUpdate = true;
      foam.visible = wash > .01 && rinse < 1;
      bubbles.forEach(({ mesh, x, y, z, radius }, i) => {
        mesh.visible = t > 2 && t < 13;
        mesh.position.set(x + Math.sin(clock * .3 + i) * .06, y + Math.sin(clock * .45 + i) * .14, z);
        mesh.scale.setScalar(radius * smooth(2, 4, t) * (1 - smooth(11, 13, t)));
      });
      const sweepZ = 2.4 - rinse * 4.8 + smooth(16, 21, t) * 4.8;
      waterStart.set(2.3, 2.4, sweepZ + .2);
      waterEnd.set(.1, .95, sweepZ);
      lance.position.copy(waterStart);
      lance.lookAt(waterEnd);
      // A translucent fan and coherent droplets share the same impact point as the foam wipe.
      water.visible = spray.visible = spraying > .001;
      waterMaterial.opacity = spraying * .7; sprayMaterial.opacity = spraying * .13;
      const direction = waterStart.clone().sub(waterEnd);
      spray.position.copy(waterStart).add(waterEnd).multiplyScalar(.5);
      spray.quaternion.setFromUnitVectors(up, direction.clone().normalize());
      spray.scale.y = direction.length();
      for (let i = 0; i < waterCount; i++) {
        const along = (i / waterCount + clock * 1.3) % 1;
        const spread = along * .2; const angle = i * 2.39996;
        waterPositions[i * 3] = THREE.MathUtils.lerp(waterStart.x, waterEnd.x, along) + Math.cos(angle) * spread;
        waterPositions[i * 3 + 1] = THREE.MathUtils.lerp(waterStart.y, waterEnd.y, along) + Math.sin(angle) * spread;
        waterPositions[i * 3 + 2] = THREE.MathUtils.lerp(waterStart.z, waterEnd.z, along) + Math.cos(angle * 3) * spread;
      }
      waterAttribute.needsUpdate = true;
      try {
        renderer.render(scene, camera);
        if (shaderFailed) throw new Error("Shader unavailable");
      } catch { dispose(); onFailure(); return; }
      canvas.dataset.frame = String(++count);
      canvas.dataset.rotation = String(rig.rotation.y);
      if (enabled && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function resize() {
      const width = host.clientWidth; const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile() ? 1.25 : 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const distance = mobile() ? .98 : 1;
      camera.position.set(6.5 * distance, 3.7 * distance, 7 * distance);
      camera.lookAt(0, .55, 0);
      camera.updateProjectionMatrix();
      if (!enabled || !visible) draw(performance.now());
    }
    function synchronize() {
      cancelAnimationFrame(frame); previous = 0;
      host.dataset.motionState = enabled && visible && !document.hidden ? "running" : "paused";
      if (visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function visibilityChanged() { synchronize(); }
    function pointerMoved(event: PointerEvent) {
      if (!enabled || event.pointerType !== "mouse") return;
      const rect = host.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    }
    function pointerLeft() { pointer.set(0, 0); }
    function contextLost(event: Event) { event.preventDefault(); dispose(); onFailure(); }

    // These closures are registered with their exact cleanup references below.
    host.appendChild(canvas);
    canvas.setAttribute("aria-hidden", "true");
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
    visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; synchronize(); }, { threshold: .05 });
    visibilityObserver.observe(host);
    document.addEventListener("visibilitychange", visibilityChanged);
    host.addEventListener("pointermove", pointerMoved); host.addEventListener("pointerleave", pointerLeft);
    canvas.addEventListener("webglcontextlost", contextLost);
    removeListeners = () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      host.removeEventListener("pointermove", pointerMoved); host.removeEventListener("pointerleave", pointerLeft);
      canvas.removeEventListener("webglcontextlost", contextLost);
      key.shadow.dispose();
    };
    resize(); draw(performance.now());
    return { setMotion(value, clean = !value) { if (disposed) return; enabled = value; cleanView = clean; pointer.set(0, 0); synchronize(); }, dispose };
  } catch (error) { dispose(); throw error; }

}
