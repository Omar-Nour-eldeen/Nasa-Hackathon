import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Observation, MapHotspot } from '../../../types/fire';
import { formatFrp, formatDate } from '../../../utils/formatters';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Compass,
  Flame,
  Sparkles,
  RotateCw,
  Eye,
} from 'lucide-react';

interface FireGlobe3DProps {
  hotspots: (MapHotspot | Observation)[];
  onSelectHotspot?: (hotspot: MapHotspot | Observation) => void;
  selectedHotspot?: (MapHotspot | Observation) | null;
  sensorFilter?: string;
}

export const FireGlobe3D: React.FC<FireGlobe3DProps> = ({
  hotspots,
  onSelectHotspot,
  selectedHotspot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [showRings, setShowRings] = useState<boolean>(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<(MapHotspot | Observation) | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const hotspotsGroupRef = useRef<THREE.Group | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const interactiveMeshesRef = useRef<{ mesh: THREE.Mesh; data: MapHotspot | Observation }[]>([]);

  const GLOBE_RADIUS = 100;

  // Convert (lat, lon) to 3D Cartesian coordinates on sphere
  const latLonToVector3 = (lat: number, lon: number, radius = GLOBE_RADIUS) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Helper to generate a high-tech Earth procedural texture with land contours and latitude grid
  const createProceduralEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep space ocean background
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#060d1f');
    oceanGrad.addColorStop(0.5, '#040814');
    oceanGrad.addColorStop(1, '#060d1f');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw high-tech coordinate grid (parallels & meridians)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;

    // Latitude lines (parallels)
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Longitude lines (meridians)
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator & Prime Meridian high-tech highlight
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Procedural representation of major continents (North America, South America, Eurasia, Africa, Australia)
    ctx.fillStyle = 'rgba(30, 58, 95, 0.55)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.2;

    const drawLand = (coords: [number, number][]) => {
      ctx.beginPath();
      coords.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * canvas.width;
        const y = ((90 - lat) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // North America approximate polygon
    drawLand([
      [-165, 65], [-140, 70], [-100, 75], [-60, 60], [-65, 45], [-75, 30],
      [-80, 25], [-90, 18], [-105, 20], [-120, 35], [-125, 48], [-140, 58],
    ]);

    // South America approximate polygon
    drawLand([
      [-80, 10], [-50, 0], [-35, -5], [-40, -22], [-55, -35], [-68, -55],
      [-75, -45], [-72, -18], [-80, -2],
    ]);

    // Eurasia approximate polygon
    drawLand([
      [-10, 36], [0, 50], [15, 55], [30, 70], [60, 75], [100, 78], [140, 70],
      [170, 65], [140, 40], [120, 25], [105, 10], [90, 22], [75, 10],
      [60, 25], [45, 15], [35, 30], [25, 40], [10, 36],
    ]);

    // Africa approximate polygon
    drawLand([
      [-15, 30], [10, 36], [32, 32], [50, 12], [42, -5], [35, -20],
      [20, -35], [15, -25], [10, 5], [-15, 15],
    ]);

    // Australia approximate polygon
    drawLand([
      [115, -22], [130, -12], [145, -15], [152, -28], [148, -38],
      [135, -35], [118, -35], [114, -26],
    ]);

    // Add starry city dots across continents
    ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
    for (let i = 0; i < 400; i++) {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      ctx.fillRect(cx, cy, 1.5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 40, 260);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 120;
    controls.maxDistance = 600;
    controls.rotateSpeed = 0.8;
    controlsRef.current = controls;

    // 3. Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Earth Sphere
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthTexture = createProceduralEarthTexture();
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 25,
      specular: new THREE.Color(0x1a2e4a),
      color: 0xffffff,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Outer Shell
    const atmoGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 64, 64);
    const atmoMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    globeGroup.add(atmoMesh);

    // Ambient & Directional Space Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    sunLight.position.set(250, 150, 200);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.7);
    rimLight.position.set(-200, -100, -150);
    scene.add(rimLight);

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1600;
      starPositions[i + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i + 2] = (Math.random() - 0.5) * 1600;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 1.5, transparent: true, opacity: 0.6 });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // Groups for dynamic items
    const hotspotsGroup = new THREE.Group();
    globeGroup.add(hotspotsGroup);
    hotspotsGroupRef.current = hotspotsGroup;

    const ringsGroup = new THREE.Group();
    globeGroup.add(ringsGroup);
    ringsGroupRef.current = ringsGroup;

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera fly-to lerp
      if (targetCamPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 2) {
          targetCamPosRef.current = null;
        }
      }

      // Auto rotation
      if (isRotating && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += delta * 0.12;
      }

      // Animate pulsing shockwave rings
      if (ringsGroupRef.current && ringsGroupRef.current.children.length > 0) {
        ringsGroupRef.current.children.forEach((child) => {
          const ringMesh = child as THREE.Mesh;
          const cycle = (elapsedTime * 0.8 + (ringMesh.userData.phase || 0)) % 1;
          const scale = 1.0 + cycle * 2.2;
          ringMesh.scale.set(scale, scale, scale);
          if (ringMesh.material instanceof THREE.Material) {
            ringMesh.material.opacity = Math.max(0, 0.85 * (1 - cycle));
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Mouse Move for Raycaster
    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = interactiveMeshesRef.current.map((item) => item.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const found = interactiveMeshesRef.current.find((item) => item.mesh === intersects[0].object);
        if (found) {
          setHoveredHotspot(found.data);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredHotspot(null);
      container.style.cursor = 'grab';
    };

    // Click for Hotspot Selection
    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const meshes = interactiveMeshesRef.current.map((item) => item.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const found = interactiveMeshesRef.current.find((item) => item.mesh === intersects[0].object);
        if (found && onSelectHotspot) {
          onSelectHotspot(found.data);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // Responsive resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
    };
  }, []);

  // Update Hotspot 3D Beams when dataset changes
  useEffect(() => {
    if (!hotspotsGroupRef.current || !ringsGroupRef.current) return;

    // Clear old meshes
    while (hotspotsGroupRef.current.children.length > 0) {
      hotspotsGroupRef.current.remove(hotspotsGroupRef.current.children[0]);
    }
    while (ringsGroupRef.current.children.length > 0) {
      ringsGroupRef.current.remove(ringsGroupRef.current.children[0]);
    }
    interactiveMeshesRef.current = [];

    const valid = (hotspots || []).filter((h) => h && h.latitude && h.longitude);

    valid.forEach((h, index) => {
      const frp = h.frp || 15;
      const isViirs = (h.sensor || '').toUpperCase() === 'VIIRS';
      const beamColor = isViirs ? 0x10b981 : 0x00e5ff;
      const beamHeight = Math.min(28, Math.max(4, (frp / 80) * 22));

      // 1. Surface Dot Marker
      const dotPos = latLonToVector3(h.latitude, h.longitude, GLOBE_RADIUS + 0.5);
      const dotGeo = new THREE.SphereGeometry(1.2, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: beamColor });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(dotPos);
      hotspotsGroupRef.current?.add(dotMesh);

      // 2. Vertical 3D Radiant Thermal Cylinder Beam
      const cylinderGeo = new THREE.CylinderGeometry(0.4, 0.8, beamHeight, 8);
      const cylinderMat = new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0.85,
      });
      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);

      // Position beam half-height outward and align along radial vector
      const centerPos = latLonToVector3(h.latitude, h.longitude, GLOBE_RADIUS + beamHeight / 2);
      cylinderMesh.position.copy(centerPos);
      cylinderMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dotPos.clone().normalize()
      );

      hotspotsGroupRef.current?.add(cylinderMesh);
      interactiveMeshesRef.current.push({ mesh: cylinderMesh, data: h });
      interactiveMeshesRef.current.push({ mesh: dotMesh, data: h });

      // 3. Shockwave concentric pulse ring for top 25 high-intensity emitters
      if (showRings && (frp > 35 || index < 25)) {
        const ringGeo = new THREE.RingGeometry(1.5, 2.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isViirs ? 0x34d399 : 0xf59e0b,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(latLonToVector3(h.latitude, h.longitude, GLOBE_RADIUS + 0.8));
        ringMesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          dotPos.clone().normalize()
        );
        ringMesh.userData = { phase: Math.random() };
        ringsGroupRef.current?.add(ringMesh);
      }
    });
  }, [hotspots, showRings]);

  // Fly to target region or hotspot
  const flyToCoords = (lat: number, lon: number, distance = 200) => {
    setIsRotating(false);
    const targetVec = latLonToVector3(lat, lon, distance);
    targetCamPosRef.current = targetVec;
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const currentDist = cameraRef.current.position.length();
    const newDist = Math.max(130, Math.min(480, currentDist + delta));
    cameraRef.current.position.setLength(newDist);
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-[#020617] shadow-2xl group select-none">
      {/* Three.js Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Mission HUD */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-slate-950/85 backdrop-blur-md px-3.5 py-2 border border-slate-800/80 shadow-2xl text-xs">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </div>
          <span className="font-bold tracking-wide text-white uppercase text-[11px]">
            Orbital 3D Earth
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-mono font-bold">
            {hotspots.length} Hotspots Active
          </span>
        </div>

        {/* Toolbar */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-slate-950/85 backdrop-blur-md p-1.5 border border-slate-800/80 shadow-2xl text-xs">
          {/* Shockwaves Toggle */}
          <button
            onClick={() => setShowRings(!showRings)}
            title="Toggle Radiating Combustion Waves"
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              showRings
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Auto Rotation */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            title={isRotating ? 'Pause Earth Rotation' : 'Resume Auto Rotation'}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            {isRotating ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={() => handleZoom(-35)}
            title="Zoom In"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(35)}
            title="Zoom Out"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Orbit Quick Targets */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-20">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-500" /> Orbit Target:
          </span>
          <button
            onClick={() => flyToCoords(36.77, -119.41, 190)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            California
          </button>
          <button
            onClick={() => flyToCoords(39.0, 15.0, 195)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            Mediterranean
          </button>
          <button
            onClick={() => flyToCoords(-8.0, -55.0, 195)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            Amazon Basin
          </button>
          <button
            onClick={() => flyToCoords(-33.0, 147.0, 195)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            Australia
          </button>
          <button
            onClick={() => flyToCoords(33.9, 67.7, 190)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            Central Asia
          </button>
          <button
            onClick={() => flyToCoords(20.0, 0.0, 260)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 transition-colors cursor-pointer"
          >
            Global Orbit
          </button>
        </div>

        {/* Legend */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]"></span>
            MODIS 1km
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
            VIIRS 375m
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Flame className="w-3.5 h-3.5" />
            3D Pillar = FRP (MW)
          </span>
        </div>
      </div>

      {/* Floating Hover Card */}
      {hoveredHotspot && (
        <div className="absolute top-20 right-6 z-30 pointer-events-none rounded-xl bg-slate-950/90 backdrop-blur-md p-3.5 border border-amber-500/40 shadow-2xl text-xs space-y-1.5 animate-in fade-in duration-150 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              {hoveredHotspot.sensor} Hotspot
            </span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              {hoveredHotspot.confidence || 'Nominal'}
            </span>
          </div>

          <div className="flex justify-between text-slate-300 pt-1">
            <span>Radiative Power (FRP):</span>
            <span className="font-mono font-bold text-amber-400">
              {formatFrp(hoveredHotspot.frp)}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Acquired Date:</span>
            <span>{formatDate(hoveredHotspot.acq_date)}</span>
          </div>

          <div className="flex justify-between text-slate-400 text-[11px] font-mono">
            <span>Coordinates:</span>
            <span>
              {hoveredHotspot.latitude.toFixed(2)}°, {hoveredHotspot.longitude.toFixed(2)}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
