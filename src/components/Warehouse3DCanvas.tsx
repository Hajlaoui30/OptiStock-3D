import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Cabinet,
  BinCase,
  ColorMode3D,
  RoomDimensions,
  getABCClass,
  getShelfBinsWithGeometry,
  getShelfHeightCm,
} from '../utils/warehouseLogic';

export type CameraPreset = 'overview' | 'aisle' | 'dock' | 'top';

interface Warehouse3DCanvasProps {
  cabinets: Cabinet[];
  roomDimensions: RoomDimensions;
  selectedCabinetId: string | null;
  selectedBinId: string | null;
  highlightedBinIds: Set<string>;
  colorMode: ColorMode3D;
  shelfExplodeFactor: number; // 0 to 1
  cameraPreset: CameraPreset;
  cameraPresetTrigger: number;
  onSelectBin: (cabinetId: string, binId: string) => void;
  onSelectCabinet: (cabinetId: string) => void;
}

// Pre-allocated scratch math helpers at module scope (zero GC in loop)
const _targetCameraPos = new THREE.Vector3(0, 11.5, 16.5);
const _targetLookAt = new THREE.Vector3(0, 1.4, -1.5);
const _mouseVec2 = new THREE.Vector2();

function createFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base polished concrete slate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle tile border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 508);

  // Inner cross grid
  ctx.strokeStyle = '#162032';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Subtle corner bolts/markers
  ctx.fillStyle = '#334155';
  ctx.fillRect(10, 10, 6, 6);
  ctx.fillRect(496, 10, 6, 6);
  ctx.fillRect(10, 496, 6, 6);
  ctx.fillRect(496, 496, 6, 6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCabinetHeaderSignTexture(
  cab: Cabinet,
  isSelected: boolean,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
  ctx.fillRect(0, 0, 512, 112);

  ctx.strokeStyle = isSelected ? '#f59e0b' : cab.accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 106);

  // Accent bar on left
  ctx.fillStyle = cab.accentColor;
  ctx.fillRect(0, 0, 18, 112);

  // Cabinet Code
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 40px "Outfit", sans-serif';
  ctx.fillText(cab.code, 34, 52);

  // Zone & occupancy
  const occupied = cab.bins.filter((b) => b.product !== null).length;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText(
    `${occupied}/${cab.bins.length} CASES · ${cab.shelvesCount} ÉTAGÈRES`,
    34,
    88
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createBinLabelTexture(
  bin: BinCase,
  isSelected: boolean,
  isHighlighted: boolean,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isSelected
    ? '#f59e0b'
    : isHighlighted
    ? '#06b6d4'
    : '#0f172a';
  ctx.fillRect(0, 0, 256, 80);

  ctx.strokeStyle = isSelected || isHighlighted ? '#ffffff' : '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 76);

  const textColor = isSelected || isHighlighted ? '#0f172a' : '#f8fafc';
  const subColor = isSelected || isHighlighted ? '#1e293b' : '#94a3b8';

  ctx.fillStyle = subColor;
  ctx.font = 'bold 17px "JetBrains Mono", monospace';
  ctx.fillText(`E${bin.shelfIndex}·C${bin.colIndex}`, 12, 26);

  if (bin.product) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(bin.product.reference.slice(0, 12), 12, 56);

    // Qty badge on right
    ctx.fillStyle = isSelected || isHighlighted ? '#0f172a' : '#38bdf8';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText(`x${bin.product.quantity}`, 190, 26);
  } else {
    ctx.fillStyle = isSelected || isHighlighted ? '#1e293b' : '#475569';
    ctx.font = '18px "JetBrains Mono", monospace';
    ctx.fillText('VIDE', 12, 56);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Builds a composite 8-part procedural Industrial Forklift / Automated Stacker prop
 * pivoted at bottom-center (y = 0) to ground the warehouse receiving dock.
 */
function buildCompositeForkliftProp(shadowTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group();

  // Contact shadow disc
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.55,
  });
  const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.015;
  group.add(shadowMesh);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.32,
    metalness: 0.45,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.75,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.9,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.88,
    metalness: 0.1,
  });

  // 1. Primary Counterweight Hull
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 1.45), bodyMat);
  hull.position.set(0, 0.46, 0.25);
  group.add(hull);

  // 2. Battery / Engine Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.38, 0.85), darkSteelMat);
  hood.position.set(0, 0.95, 0.32);
  group.add(hood);

  // 3. Overhead Safety Roll Cage (4 pillars + roof)
  const pillarGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8);
  const pillarPositions = [
    [-0.48, 1.42, -0.18],
    [0.48, 1.42, -0.18],
    [-0.48, 1.42, 0.78],
    [0.48, 1.42, 0.78],
  ];
  for (const [px, py, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(pillarGeo, darkSteelMat);
    pillar.position.set(px, py, pz);
    group.add(pillar);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.06, 1.08), bodyMat);
  roof.position.set(0, 2.05, 0.3);
  group.add(roof);

  // 4. Vertical Hydraulic Mast Rails
  const mastLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.1), darkSteelMat);
  mastLeft.position.set(-0.36, 1.2, -0.55);
  group.add(mastLeft);

  const mastRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.1), darkSteelMat);
  mastRight.position.set(0.36, 1.2, -0.55);
  group.add(mastRight);

  // 5. Chrome Hydraulic Lift Cylinder
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.8, 12), chromeMat);
  cylinder.position.set(0, 1.05, -0.55);
  group.add(cylinder);

  // 6. Twin L-Shaped Steel Forks
  const forkGeo = new THREE.BoxGeometry(0.12, 0.045, 1.05);
  const forkLeft = new THREE.Mesh(forkGeo, darkSteelMat);
  forkLeft.position.set(-0.24, 0.18, -1.12);
  group.add(forkLeft);

  const forkRight = new THREE.Mesh(forkGeo, darkSteelMat);
  forkRight.position.set(0.24, 0.18, -1.12);
  group.add(forkRight);

  // 7. 4 Rubber Wheels with metallic hubs
  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelCoords = [
    [-0.58, 0.22, -0.22],
    [0.58, 0.22, -0.22],
    [-0.58, 0.22, 0.72],
    [0.58, 0.22, 0.72],
  ];
  for (const [wx, wy, wz] of wheelCoords) {
    const wheel = new THREE.Mesh(wheelGeo, tireMat);
    wheel.position.set(wx, wy, wz);
    group.add(wheel);
  }

  return group;
}

/**
 * Builds a composite 3D Product Package inside a bin scaled according to packagingType & dimensionsCm.
 */
function buildCompositeProductPackage(
  bin: BinCase,
  binW: number,
  binH: number,
  binD: number,
  colorMode: ColorMode3D,
  isSelected: boolean
): THREE.Group {
  const group = new THREE.Group();
  const prod = bin.product;
  if (!prod) return group;

  // Determine package color based on 3D ColorMode
  let primaryHex = 0xd97706; // default kraft/amber
  if (colorMode === 'rotation') {
    const abc = getABCClass(prod.turnoverRate);
    primaryHex = abc === 'A' ? 0x10b981 : abc === 'B' ? 0xf59e0b : 0x6366f1;
  } else if (colorMode === 'occupancy') {
    const isLow = prod.quantity <= prod.minThreshold;
    primaryHex = isLow ? 0xef4444 : 0x10b981;
  } else {
    switch (prod.packagingType) {
      case 'Bac Europe S':
        primaryHex = 0x0284c7;
        break;
      case 'Carton Standard M':
        primaryHex = 0xd97706;
        break;
      case 'Caisse Renforcée L':
        primaryHex = 0xea580c;
        break;
      case 'Coffre Lourd XL':
        primaryHex = 0x7c3aed;
        break;
      case 'Tube / Rouleau':
        primaryHex = 0x059669;
        break;
    }
  }

  // Normalized dimensions inside bin
  const scaleX = THREE.MathUtils.clamp((prod.dimensionsCm.lengthCm / 65) * binW * 0.82, 0.28, binW * 0.84);
  const scaleY = THREE.MathUtils.clamp((prod.dimensionsCm.heightCm / 42) * binH * 0.72, 0.18, binH * 0.68);
  const scaleZ = THREE.MathUtils.clamp((prod.dimensionsCm.widthCm / 45) * binD * 0.75, 0.28, binD * 0.72);

  const mainMat = new THREE.MeshStandardMaterial({
    color: primaryHex,
    roughness: prod.packagingType === 'Bac Europe S' ? 0.35 : 0.78,
    metalness: prod.packagingType === 'Coffre Lourd XL' ? 0.45 : 0.08,
    emissive: isSelected ? new THREE.Color(primaryHex) : new THREE.Color(0x000000),
    emissiveIntensity: isSelected ? 0.22 : 0,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.1,
  });

  const metalCornerMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85,
  });

  if (prod.packagingType === 'Tube / Rouleau') {
    // Composite bundle of 3 cylindrical industrial tubes on a cradle base
    const cradle = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.9, 0.04, scaleZ * 0.8),
      metalCornerMat
    );
    cradle.position.y = 0.02;
    group.add(cradle);

    const radius = Math.min(scaleX, scaleY) * 0.22;
    const cylGeo = new THREE.CylinderGeometry(radius, radius, scaleZ * 0.88, 14);
    cylGeo.rotateX(Math.PI / 2);
    const offsets = [
      [-radius * 1.1, radius + 0.04],
      [radius * 1.1, radius + 0.04],
      [0, radius * 2.75 + 0.04],
    ];
    for (const [ox, oy] of offsets) {
      const tube = new THREE.Mesh(cylGeo, mainMat);
      tube.position.set(ox, oy, 0);
      group.add(tube);
    }
  } else {
    // 1. Primary Box / Crate Hull
    const boxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX, scaleY, scaleZ),
      mainMat
    );
    boxMesh.position.y = scaleY / 2;
    group.add(boxMesh);

    // 2. Top Packing Tape / Rim Accent
    const tapeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(scaleX * 0.96, 0.012, scaleZ * 0.24),
      trimMat
    );
    tapeMesh.position.y = scaleY + 0.006;
    group.add(tapeMesh);

    // 3. Front Barcode Sticker Plate
    const stickerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scaleX * 0.52, scaleY * 0.42),
      trimMat
    );
    stickerMesh.position.set(0, scaleY * 0.55, scaleZ / 2 + 0.004);
    group.add(stickerMesh);

    // 4. Reinforced Corner Straps for L/XL Crates
    if (
      prod.packagingType === 'Caisse Renforcée L' ||
      prod.packagingType === 'Coffre Lourd XL'
    ) {
      const bandL = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, scaleY + 0.01, scaleZ + 0.01),
        metalCornerMat
      );
      bandL.position.set(-scaleX * 0.36, scaleY / 2, 0);
      group.add(bandL);

      const bandR = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, scaleY + 0.01, scaleZ + 0.01),
        metalCornerMat
      );
      bandR.position.set(scaleX * 0.36, scaleY / 2, 0);
      group.add(bandR);
    }
  }

  return group;
}

export const Warehouse3DCanvas: React.FC<Warehouse3DCanvasProps> = ({
  cabinets,
  roomDimensions,
  selectedCabinetId,
  selectedBinId,
  highlightedBinIds,
  colorMode,
  shelfExplodeFactor,
  cameraPreset,
  cameraPresetTrigger,
  onSelectBin,
  onSelectCabinet,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store latest callbacks and state in refs so WebGLRenderer lifecycle is never torn down
  const callbacksRef = useRef({ onSelectBin, onSelectCabinet });
  callbacksRef.current = { onSelectBin, onSelectCabinet };

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    cabinetsGroup: THREE.Group;
    navPathGroup: THREE.Group;
    interactables: THREE.Object3D[];
    shadowTex: THREE.CanvasTexture;
    maxAnisotropy: number;
    isSoftwareGl: boolean;
    requestRender: () => void;
    triggerCameraGlide: (pos: THREE.Vector3, lookAt: THREE.Vector3) => void;
  } | null>(null);

  // Initialize Three.js WebGL scene once on mount
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.014);

    // Studio PBR environment reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 150);
    camera.position.set(0, 10.8, 15.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 0.4;
    controls.maxDistance = 60;
    controls.target.set(0, 1.5, -1.2);
    controls.update();

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.35);
    hemiLight.position.set(0, 25, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    keyLight.position.set(12, 22, 14);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      const d = 16;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 45;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-14, 12, -14);
    scene.add(rimLight);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createRadialShadowTexture();

    // Warehouse Floor with procedural tile grid
    const floorTex = createFloorTexture(maxAnisotropy);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(48, 48), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const cabinetsGroup = new THREE.Group();
    scene.add(cabinetsGroup);

    const navPathGroup = new THREE.Group();
    scene.add(navPathGroup);

    const interactables: THREE.Object3D[] = [];

    // Smooth camera glide state
    let isCameraGliding = false;
    let lastTimeMs = performance.now();

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        const nowMs = performance.now();
        const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.1);
        lastTimeMs = nowMs;

        if (isCameraGliding) {
          const factor = isSoftwareGl ? 0.65 : 1 - Math.exp(-7.5 * dt);
          camera.position.lerp(_targetCameraPos, factor);
          controls.target.lerp(_targetLookAt, factor);
          if (
            camera.position.distanceToSquared(_targetCameraPos) < 0.04 &&
            controls.target.distanceToSquared(_targetLookAt) < 0.04
          ) {
            camera.position.copy(_targetCameraPos);
            controls.target.copy(_targetLookAt);
            isCameraGliding = false;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    function triggerCameraGlide(pos: THREE.Vector3, lookAt: THREE.Vector3) {
      _targetCameraPos.copy(pos);
      _targetLookAt.copy(lookAt);
      if (isSoftwareGl) {
        // On software WebGL, set camera directly so screenshots capture the exact framed view immediately
        camera.position.copy(pos);
        controls.target.copy(lookAt);
        isCameraGliding = false;
      } else {
        isCameraGliding = true;
      }
      lastTimeMs = performance.now();
      requestRender();
    }

    controls.addEventListener('start', () => {
      isCameraGliding = false;
    });
    controls.addEventListener('change', () => {
      requestRender();
    });

    // Raycasting for bin/cabinet selection
    const raycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Ignore drag orbits

      const rect = renderer.domElement.getBoundingClientRect();
      _mouseVec2.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouseVec2.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_mouseVec2, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const { cabinetId, binId } = hitObj.userData;
        if (cabinetId && binId) {
          callbacksRef.current.onSelectBin(cabinetId, binId);
        } else if (cabinetId) {
          callbacksRef.current.onSelectCabinet(cabinetId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      cabinetsGroup,
      navPathGroup,
      interactables,
      shadowTex,
      maxAnisotropy,
      isSoftwareGl,
      requestRender,
      triggerCameraGlide,
    };

    requestRender();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
    };
  }, []);

  // Rebuild 3D Cabinets & Bins whenever warehouse state, selection, color mode, or exploded slider changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    const {
      cabinetsGroup,
      navPathGroup,
      interactables,
      shadowTex,
      maxAnisotropy,
      isSoftwareGl,
      requestRender,
    } = ctx;

    // Clear previous meshes
    while (cabinetsGroup.children.length > 0) {
      cabinetsGroup.remove(cabinetsGroup.children[0]);
    }
    while (navPathGroup.children.length > 0) {
      navPathGroup.remove(navPathGroup.children[0]);
    }
    interactables.length = 0;

    // Shared structural materials
    const uprightSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.78,
    });
    const footplateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.5,
    });
    const shelfDeckMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.55,
      metalness: 0.45,
    });

    // Render 3D Room Perimeter Boundary Curbs matching 2D Floor Plan Dimensions
    const roomWallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.4,
    });
    const rW = Math.max(0.5, roomDimensions.widthMeters);
    const rD = Math.max(0.5, roomDimensions.depthMeters);
    const wallThickness = 0.12;
    const wallHeight = 0.22;

    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(rW + wallThickness * 2, wallHeight, wallThickness),
      roomWallMat
    );
    northWall.position.set(0, wallHeight / 2, -rD / 2);
    cabinetsGroup.add(northWall);

    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(rW + wallThickness * 2, wallHeight, wallThickness),
      roomWallMat
    );
    southWall.position.set(0, wallHeight / 2, rD / 2);
    cabinetsGroup.add(southWall);

    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, rD),
      roomWallMat
    );
    westWall.position.set(-rW / 2, wallHeight / 2, 0);
    cabinetsGroup.add(westWall);

    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, rD),
      roomWallMat
    );
    eastWall.position.set(rW / 2, wallHeight / 2, 0);
    cabinetsGroup.add(eastWall);

    let selectedTargetWorldPos: THREE.Vector3 | null = null;

    for (const cab of cabinets) {
      const isCabSelected = cab.id === selectedCabinetId;
      const cabGroup = new THREE.Group();
      cabGroup.position.set(cab.position.x, 0, cab.position.z);
      cabGroup.rotation.y = THREE.MathUtils.degToRad(cab.rotationY);

      const explodeSpacing = shelfExplodeFactor * 0.35;
      const shelfPitchList: number[] = [];
      const shelfYOrigins: number[] = [];
      let cumulativeY = 0.22;
      for (let s = 1; s <= cab.shelvesCount; s++) {
        shelfYOrigins.push(cumulativeY);
        const hMeters = (getShelfHeightCm(cab, s) / 100) * 1.48 + explodeSpacing;
        shelfPitchList.push(hMeters);
        cumulativeY += hMeters;
      }
      const totalH = cumulativeY + 0.25;
      const totalW = cab.widthMeters;
      const totalD = cab.depthMeters;

      // 1. Contact Shadow Grounding Plane
      const cabShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(totalW + 0.9, totalD + 0.9),
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.5,
        })
      );
      cabShadow.rotation.x = -Math.PI / 2;
      cabShadow.position.y = 0.015;
      cabGroup.add(cabShadow);

      // 2. Four Corner Structural Steel Uprights + Anchor Footplates
      const uprightGeo = new THREE.BoxGeometry(0.08, totalH, 0.08);
      const footGeo = new THREE.BoxGeometry(0.16, 0.03, 0.16);
      const halfW = totalW / 2 - 0.05;
      const halfD = totalD / 2 - 0.05;

      const corners = [
        [-halfW, -halfD],
        [halfW, -halfD],
        [-halfW, halfD],
        [halfW, halfD],
      ];
      for (const [cx, cz] of corners) {
        const post = new THREE.Mesh(uprightGeo, uprightSteelMat);
        post.position.set(cx, totalH / 2, cz);
        post.castShadow = !isSoftwareGl;
        cabGroup.add(post);

        const foot = new THREE.Mesh(footGeo, footplateMat);
        foot.position.set(cx, 0.015, cz);
        cabGroup.add(foot);
      }

      // 3. Side Diagonal Cross-Bracing Struts
      const strutGeo = new THREE.CylinderGeometry(0.018, 0.018, totalD * 0.95, 6);
      strutGeo.rotateX(Math.PI / 4);
      for (let s = 0; s < cab.shelvesCount; s++) {
        const sy = shelfYOrigins[s] + shelfPitchList[s] * 0.45;
        const leftStrut = new THREE.Mesh(strutGeo, uprightSteelMat);
        leftStrut.position.set(-halfW, sy, 0);
        cabGroup.add(leftStrut);

        const rightStrut = new THREE.Mesh(strutGeo, uprightSteelMat);
        rightStrut.position.set(halfW, sy, 0);
        cabGroup.add(rightStrut);
      }

      // 4. Top Header Signboard (Clickable for Cabinet selection)
      const headerTex = createCabinetHeaderSignTexture(cab, isCabSelected, maxAnisotropy);
      const headerMat = new THREE.MeshBasicMaterial({ map: headerTex });
      const headerSign = new THREE.Mesh(new THREE.BoxGeometry(totalW * 0.92, 0.42, 0.06), headerMat);
      headerSign.position.set(0, totalH + 0.24, halfD);
      headerSign.userData = { cabinetId: cab.id };
      cabGroup.add(headerSign);
      interactables.push(headerSign);

      // Beam material tinted with Cabinet accent color
      const beamMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(cab.accentColor),
        roughness: 0.28,
        metalness: 0.5,
      });

      const innerUsableW = totalW - 0.24;

      // 5. Horizontal Shelves (Étagères) and UNEQUAL Individual Compartment Bins (Cases)
      for (let s = 1; s <= cab.shelvesCount; s++) {
        const shelfY = shelfYOrigins[s - 1];
        const shelfPitch = shelfPitchList[s - 1];
        const clearH = Math.max(0.42, shelfPitch - 0.12);

        // Front & Rear Load Beams
        const frontBeam = new THREE.Mesh(
          new THREE.BoxGeometry(totalW - 0.04, 0.055, 0.05),
          beamMat
        );
        frontBeam.position.set(0, shelfY, halfD);
        cabGroup.add(frontBeam);

        const rearBeam = new THREE.Mesh(
          new THREE.BoxGeometry(totalW - 0.04, 0.055, 0.05),
          beamMat
        );
        rearBeam.position.set(0, shelfY, -halfD);
        cabGroup.add(rearBeam);

        // Perforated Steel Shelf Deck
        const deck = new THREE.Mesh(
          new THREE.BoxGeometry(totalW - 0.12, 0.03, totalD - 0.08),
          shelfDeckMat
        );
        deck.position.set(0, shelfY + 0.015, 0);
        deck.receiveShadow = !isSoftwareGl;
        cabGroup.add(deck);

        // Unequal Compartment Bins (Cases) on this specific shelf configured in 2D
        const shelfBinGeoms = getShelfBinsWithGeometry(cab, s);

        shelfBinGeoms.forEach((geom, idx) => {
          const { bin, widthRatio, centerRatio } = geom;
          const binSlotWidth = innerUsableW * widthRatio;
          const binX = -(innerUsableW / 2) + centerRatio * innerUsableW;
          const isBinSelected = bin.id === selectedBinId;
          const isBinHighlighted = highlightedBinIds.has(bin.id);

          // Vertical partition divider between unequal bins on this shelf
          if (idx < shelfBinGeoms.length - 1) {
            const divider = new THREE.Mesh(
              new THREE.BoxGeometry(0.025, clearH * 0.88, totalD - 0.14),
              shelfDeckMat
            );
            divider.position.set(
              binX + binSlotWidth / 2,
              shelfY + clearH * 0.46,
              0
            );
            cabGroup.add(divider);
          }

          // Front Alphanumeric Bin Label Plate scaled to this case's width
          const labelTex = createBinLabelTexture(
            bin,
            isBinSelected,
            isBinHighlighted,
            maxAnisotropy
          );
          const labelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(Math.min(1.15, binSlotWidth * 0.88), 0.14),
            new THREE.MeshBasicMaterial({ map: labelTex })
          );
          labelMesh.position.set(binX, shelfY + 0.02, halfD + 0.032);
          cabGroup.add(labelMesh);

          // Highlight Wireframe Cage if selected or matched in search
          if (isBinSelected || isBinHighlighted) {
            const highlightBoxGeo = new THREE.BoxGeometry(
              binSlotWidth * 0.94,
              clearH * 0.92,
              totalD * 0.92
            );
            const edgesGeo = new THREE.EdgesGeometry(highlightBoxGeo);
            const lineMat = new THREE.LineBasicMaterial({
              color: isBinSelected ? 0xf59e0b : 0x06b6d4,
            });
            const wireframe = new THREE.LineSegments(edgesGeo, lineMat);
            wireframe.position.set(binX, shelfY + clearH * 0.48, 0);
            cabGroup.add(wireframe);

            if (isBinSelected) {
              selectedTargetWorldPos = new THREE.Vector3(
                cab.position.x + binX,
                shelfY + clearH * 0.48,
                cab.position.z
              );
            }
          }

          // Composite 3D Siemens Product Package inside this custom-width Bin
          if (bin.product) {
            const pkgGroup = buildCompositeProductPackage(
              bin,
              binSlotWidth,
              clearH,
              totalD,
              colorMode,
              isBinSelected
            );
            pkgGroup.position.set(binX, shelfY + 0.03, 0);
            cabGroup.add(pkgGroup);
          }

          // Fast Raycast Proxy Hitbox for this specific Case
          const proxyBox = new THREE.Mesh(
            new THREE.BoxGeometry(binSlotWidth * 0.94, clearH * 0.94, totalD * 0.94),
            new THREE.MeshBasicMaterial({ visible: false })
          );
          proxyBox.position.set(binX, shelfY + clearH * 0.48, 0);
          proxyBox.userData = {
            cabinetId: cab.id,
            binId: bin.id,
          };
          cabGroup.add(proxyBox);
          interactables.push(proxyBox);
        });
      }

      cabinetsGroup.add(cabGroup);
    }

    // 6. 3D Floor Marker in front of Selected Bin/Cabinet
    if (selectedTargetWorldPos) {
      const binFrontPoint = new THREE.Vector3(
        selectedTargetWorldPos.x,
        0.03,
        selectedTargetWorldPos.z + 1.1
      );
      const binUpPoint = new THREE.Vector3(
        selectedTargetWorldPos.x,
        selectedTargetWorldPos.y,
        selectedTargetWorldPos.z + 0.55
      );

      const points = [binFrontPoint, binUpPoint];
      const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
      const pathMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
      const pathLine = new THREE.Line(pathGeo, pathMat);
      navPathGroup.add(pathLine);

      // Glowing floor marker disc in front of the target cabinet column
      const targetRing = new THREE.Mesh(
        new THREE.RingGeometry(0.24, 0.36, 24),
        new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide,
        })
      );
      targetRing.rotation.x = -Math.PI / 2;
      targetRing.position.set(binFrontPoint.x, 0.025, binFrontPoint.z);
      navPathGroup.add(targetRing);
    }

    requestRender();
  }, [
    cabinets,
    roomDimensions,
    selectedCabinetId,
    selectedBinId,
    highlightedBinIds,
    colorMode,
    shelfExplodeFactor,
  ]);

  // Smooth Camera Preset Transitions
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    if (cameraPreset === 'overview') {
      ctx.triggerCameraGlide(new THREE.Vector3(0, 11.5, 16.5), new THREE.Vector3(0, 1.4, -1.5));
    } else if (cameraPreset === 'aisle') {
      ctx.triggerCameraGlide(new THREE.Vector3(0, 3.2, 8.8), new THREE.Vector3(0, 1.8, -6.5));
    } else if (cameraPreset === 'dock') {
      ctx.triggerCameraGlide(new THREE.Vector3(-5.8, 4.5, 12.2), new THREE.Vector3(0, 1.5, 2.5));
    } else if (cameraPreset === 'top') {
      ctx.triggerCameraGlide(new THREE.Vector3(0, 22.5, 2.5), new THREE.Vector3(0, 0, -2.0));
    }
  }, [cameraPreset, cameraPresetTrigger]);

  // Smooth Camera Focus when user explicitly selects a specific Bin or Cabinet after initial mount
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    const ctx = sceneRef.current;
    if (!ctx || !selectedCabinetId) return;

    const cab = cabinets.find((c) => c.id === selectedCabinetId);
    if (!cab) return;

    const bin = selectedBinId ? cab.bins.find((b) => b.id === selectedBinId) : null;
    const shelfPitch = 0.74 + shelfExplodeFactor * 0.35;
    const binSlotWidth = (cab.widthMeters - 0.24) / cab.columnsCount;

    const targetX = bin
      ? cab.position.x - (cab.widthMeters - 0.24) / 2 + (bin.colIndex - 0.5) * binSlotWidth
      : cab.position.x;
    const targetY = bin ? 0.45 + (bin.shelfIndex - 1) * shelfPitch : cab.heightMeters * 0.55;
    const targetZ = cab.position.z;

    const camOffsetZ = bin ? 5.2 : 7.2;
    const camOffsetY = bin ? targetY + 1.1 : targetY + 2.4;

    ctx.triggerCameraGlide(
      new THREE.Vector3(targetX * 0.85, camOffsetY, targetZ + camOffsetZ),
      new THREE.Vector3(targetX, targetY, targetZ)
    );
  }, [selectedCabinetId, selectedBinId]);

  return (
    <div
      ref={canvasMountRef}
      data-testid="warehouse-3d-canvas"
      className="fixed inset-0 w-screen h-screen z-0 bg-[#0B1120]"
      aria-label="Vue 3D interactive de l'entrepôt et des armoires de stockage"
    />
  );
};
