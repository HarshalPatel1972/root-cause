'use client';

import { useMemo, useRef, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, ContactShadows } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// ── Brand color map ────────────────────────────────────────────────
function getRepoColors(repo: string) {
  const brandColors: Record<string, { c1: string; c2: string }> = {
    'facebook/react': { c1: '#61dafb', c2: '#282c34' },
    'tailwindlabs/tailwindcss': { c1: '#38bdf8', c2: '#0ea5e9' },
    'microsoft/TypeScript': { c1: '#3178c6', c2: '#235a97' },
    'microsoft/vscode': { c1: '#0078d7', c2: '#005a9e' },
    GetLantern: { c1: '#00B7E5', c2: '#008ba8' },
    HashiCorp: { c1: '#555555', c2: '#000000' },
    StackExchange: { c1: '#F48024', c2: '#c96414' },
    stretchr: { c1: '#6B7280', c2: '#4b5563' },
    'gin-gonic': { c1: '#008ECF', c2: '#006594' },
    'go-gitea': { c1: '#609926', c2: '#436e18' },
    caddyserver: { c1: '#1F88C0', c2: '#135e85' },
    'dgraph-io': { c1: '#E50695', c2: '#a8026c' },
    'go-resty': { c1: '#7ACB8C', c2: '#57a168' },
    containerd: { c1: '#333333', c2: '#111111' },
    argoproj: { c1: '#EF7B2D', c2: '#c45a16' },
    magefile: { c1: '#4A90E2', c2: '#2c6cb5' },
    harness: { c1: '#00B6FF', c2: '#0084ba' },
    'fyne-io': { c1: '#1E88E5', c2: '#1362a8' },
    'etcd-io': { c1: '#4196E1', c2: '#2c73b3' },
    unjs: { c1: '#F4D03F', c2: '#cba726' },
    triggerdotdev: { c1: '#A3E635', c2: '#7bb021' },
    tscircuit: { c1: '#3B82F6', c2: '#2359b3' },
    'kysely-org': { c1: '#333333', c2: '#111111' },
    'bombshell-dev': { c1: '#FF00B8', c2: '#bd0088' },
    'LenovoLegionToolkit-Team': { c1: '#E2231A', c2: '#a8150d' },
  };

  const org = repo.split('/')[0];
  const colorData = brandColors[repo] || brandColors[org];

  if (colorData) {
    return {
      color1: new THREE.Color(colorData.c1),
      color2: new THREE.Color(colorData.c2),
      hex: colorData.c1,
    };
  }

  let hash = 0;
  for (let i = 0; i < repo.length; i++) {
    hash = repo.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  const color1 = new THREE.Color().setHSL(hue1 / 360, 0.8, 0.6);
  const color2 = new THREE.Color().setHSL(hue2 / 360, 0.8, 0.4);
  return { color1, color2, hex: `hsl(${hue1}, 80%, 60%)` };
}

// ── Luminance-based text color ─────────────────────────────────────
function getTextColor(hex: string): string {
  const c = new THREE.Color(hex);
  // Relative luminance formula
  const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return L > 0.45 ? '#0e0e10' : '#ffffff';
}

// ── Disk constants ─────────────────────────────────────────────────
const DISK_OUTER_RADIUS = 2.0;
const DISK_INNER_RADIUS = 0.0; // Solid disk, no hole — reads better as a "puck"
const DISK_HEIGHT = 0.5;
const GAP = 1.8;
const TOTAL_ITEMS = 30;
const TOTAL_SPAN = TOTAL_ITEMS * GAP;

// ── A single 3D disk (hockey puck / poker chip) ────────────────────
function ContributionDisk({
  work,
  position,
  index,
  scrollState,
}: {
  work: { _meta: { path: string }; repo: string };
  position: [number, number, number];
  index: number;
  scrollState: React.MutableRefObject<{ offset: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const router = useRouter();
  const enteredRef = useRef(false);
  const enterTimeRef = useRef(0);

  // Per-disk idle rotation offset for organic feel
  const rotationOffset = useMemo(() => (index * 137.5 * Math.PI) / 180, [index]);

  const { topMaterial, sideMaterial, bottomMaterial, textColor } = useMemo(() => {
    let color1 = new THREE.Color().setHSL(((index * 12) % 360) / 360, 0.8, 0.6);
    let hex = '#888888';

    if (work && work.repo) {
      const repoColors = getRepoColors(work.repo);
      color1 = repoColors.color1;
      hex = repoColors.hex;
    }

    // Top face — lighter, catches highlight
    const topColor = color1.clone();
    topColor.offsetHSL(0, -0.05, 0.12);

    // Side face — the main brand color
    const sideColor = color1.clone();

    // Bottom face — darker
    const bottomColor = color1.clone();
    bottomColor.offsetHSL(0, 0, -0.15);

    const topMat = new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.3,
      metalness: 0.15,
    });

    const sideMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.4,
      metalness: 0.1,
    });

    const bottomMat = new THREE.MeshStandardMaterial({
      color: bottomColor,
      roughness: 0.6,
      metalness: 0.05,
    });

    return {
      topMaterial: topMat,
      sideMaterial: sideMat,
      bottomMaterial: bottomMat,
      textColor: getTextColor(hex),
    };
  }, [index, work]);

  // Cylinder geometry for a proper puck shape
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      DISK_OUTER_RADIUS, // radiusTop
      DISK_OUTER_RADIUS, // radiusBottom
      DISK_HEIGHT,       // height
      64,                // radialSegments
      1,                 // heightSegments
      false              // openEnded
    );
    return geo;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const halfSpan = TOTAL_SPAN / 2;

    // Staggered entrance
    if (!enteredRef.current) {
      enterTimeRef.current += delta;
      const delay = index * 0.04; // 40ms stagger per disk
      if (enterTimeRef.current < delay) {
        groupRef.current.visible = false;
        return;
      }
      groupRef.current.visible = true;
      enteredRef.current = true;
    }

    if (!prefersReducedMotion) {
      const baseOffset = (index - (TOTAL_ITEMS - 1) / 2) * GAP;
      let y = baseOffset + scrollState.current.offset;
      y = (((y + halfSpan) % TOTAL_SPAN) + TOTAL_SPAN) % TOTAL_SPAN - halfSpan;

      groupRef.current.position.y = y;
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];

      // Subtle idle micro-rotation around the Y axis (vertical axis of the disk)
      groupRef.current.rotation.y = rotationOffset + state.clock.elapsedTime * 0.08;
    } else {
      const baseOffset = (index - (TOTAL_ITEMS - 1) / 2) * GAP;
      groupRef.current.position.y = baseOffset;
      groupRef.current.position.x = position[0];
      groupRef.current.position.z = position[2];
    }
  });

  const repoName = work.repo.split('/').pop() || '';

  return (
    <group
      ref={groupRef}
      position={position}
      visible={false}
      onClick={() => {
        if (work) router.push(`/work/${work._meta.path}`);
      }}
    >
      {/* The puck — cylinder with separate materials for top, side, bottom */}
      <mesh
        geometry={geometry}
        material={[sideMaterial, topMaterial, bottomMaterial]}
        scale={1.2}
        castShadow
        receiveShadow
      />

      {/* Bevel ring — temporarily removed, will be added back in the future
      <mesh scale={1.2}>
        <torusGeometry args={[DISK_OUTER_RADIUS, 0.04, 8, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.6}
          transparent
          opacity={0.3}
        />
      </mesh>
      */}

      {/* Repo name on the front face */}
      <group rotation={[0, -0.08, 0]}>
        <Text
          position={[0, DISK_HEIGHT * 0.62, DISK_OUTER_RADIUS * 1.21]}
          fontSize={0.35}
          fontWeight="bold"
          color={textColor}
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, 0]}
        >
          {repoName}
        </Text>
      </group>
    </group>
  );
}

// ── Frame number label (the #0, #1, #2 gutter) ────────────────────
function FrameNumber({
  index,
  scrollState,
}: {
  index: number;
  scrollState: React.MutableRefObject<{ offset: number }>;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const halfSpan = TOTAL_SPAN / 2;
    const baseOffset = (index - (TOTAL_ITEMS - 1) / 2) * GAP;
    let y = baseOffset + scrollState.current.offset;
    y = (((y + halfSpan) % TOTAL_SPAN) + TOTAL_SPAN) % TOTAL_SPAN - halfSpan;
    ref.current.position.y = y;
  });

  return (
    <group ref={ref} position={[5.2, 0, 0]}>
      <Text
        fontSize={0.22}
        color="#6b6b72"
        anchorX="right"
        anchorY="middle"
      >
        {`#${index % 21}`}
      </Text>
    </group>
  );
}

// ── Spine line (vertical bar through the disk column) ──────────────
function SpineLine() {
  return (
    <mesh position={[8.0, 0, -0.5]}>
      <boxGeometry args={[0.02, TOTAL_SPAN * 1.2, 0.02]} />
      <meshBasicMaterial color="#ececef" transparent opacity={0.5} />
    </mesh>
  );
}

// ── Scroll friction controller ─────────────────────────────────────
function ScrollController({
  scrollState,
}: {
  scrollState: React.MutableRefObject<{
    offset: number;
    targetOffset: number;
    isDragging: boolean;
  }>;
}) {
  useFrame((state, delta) => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      scrollState.current.offset += 1.0 * delta;
      return;
    }

    // Auto-scroll constant upward drift (always applies)
    scrollState.current.targetOffset += 1.0 * delta;

    // Smoothly interpolate current offset towards targetOffset
    scrollState.current.offset = THREE.MathUtils.lerp(
      scrollState.current.offset,
      scrollState.current.targetOffset,
      4.0 * delta
    );
  });
  return null;
}

// ── Main component ─────────────────────────────────────────────────
export default function RingField() {
  const mockRepos = [
    'GetLantern/lantern',
    'HashiCorp/terraform',
    'StackExchange/dns',
    'stretchr/testify',
    'gin-gonic/gin',
    'go-gitea/gitea',
    'caddyserver/caddy',
    'dgraph-io/dgraph',
    'go-resty/resty',
    'containerd/containerd',
    'argoproj/argo-cd',
    'magefile/mage',
    'harness/harness',
    'fyne-io/fyne',
    'etcd-io/etcd',
    'unjs/nitro',
    'triggerdotdev/trigger.dev',
    'tscircuit/tscircuit',
    'kysely-org/kysely',
    'bombshell-dev/bombshell',
    'LenovoLegionToolkit-Team/LenovoLegionToolkit',
  ];

  const paddedWorks = useMemo(
    () =>
      Array.from({ length: TOTAL_ITEMS }).map((_, i) => ({
        _meta: { path: `mock-${i}` },
        repo: mockRepos[i % mockRepos.length],
      })),
    []
  );

  const scrollState = useRef({
    offset: 0,
    targetOffset: 0,
    isDragging: false,
    lastY: 0,
    dragVelocity: 0,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    scrollState.current.isDragging = true;
    scrollState.current.lastY = e.clientY;
    scrollState.current.dragVelocity = 0;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!scrollState.current.isDragging) return;
    const deltaY = scrollState.current.lastY - e.clientY;
    scrollState.current.lastY = e.clientY;
    const moveAmount = deltaY * 0.06;
    scrollState.current.targetOffset += moveAmount;
    scrollState.current.dragVelocity = moveAmount;
  }, []);

  const handlePointerUp = useCallback(() => {
    scrollState.current.isDragging = false;
    scrollState.current.targetOffset +=
      scrollState.current.dragVelocity * 30.0;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    scrollState.current.targetOffset += e.deltaY * 0.01;
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(containerRef.current, {
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.2,
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      className="w-full h-full relative touch-none"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <Canvas
        camera={{ position: [0, 0, 100], fov: 10 }}
        shadows
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          maskImage:
            'linear-gradient(to bottom, transparent 8%, black 22%, black 78%, transparent 92%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 8%, black 22%, black 78%, transparent 92%)',
        }}
      >
        {/* Lighting — consistent top-left source */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[-5, 8, 10]}
          intensity={2.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[8, -4, -5]} intensity={0.4} />
        {/* Subtle rim light from behind */}
        <directionalLight position={[0, 0, -10]} intensity={0.3} />

        <ScrollController scrollState={scrollState} />

        {/* Spine line through the column */}
        <SpineLine />

        <Suspense fallback={null}>
          {paddedWorks.map((work, idx) => {
            const xOffset = 8.0;
            const yOffset = (idx - (TOTAL_ITEMS - 1) / 2) * GAP;

            return (
              <ContributionDisk
                key={work._meta.path}
                work={work}
                index={idx}
                position={[xOffset, yOffset, 0]}
                scrollState={scrollState}
              />
            );
          })}

          {/* Frame numbers in the gutter */}
          {paddedWorks.map((_, idx) => (
            <FrameNumber
              key={`frame-${idx}`}
              index={idx}
              scrollState={scrollState}
            />
          ))}
        </Suspense>

        {/* Contact shadows beneath the column */}
        <ContactShadows
          position={[8.0, -TOTAL_SPAN / 2 - 1, 0]}
          opacity={0.3}
          scale={20}
          blur={2}
          far={10}
        />
      </Canvas>
    </div>
  );
}
