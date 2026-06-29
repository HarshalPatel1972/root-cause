'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Helper to generate consistent colors based on a string (repo name)
function getRepoColors(repo: string) {
  const brandColors: Record<string, { c1: string; c2: string }> = {
    'facebook/react': { c1: '#61dafb', c2: '#282c34' },
    'tailwindlabs/tailwindcss': { c1: '#38bdf8', c2: '#0ea5e9' },
    'microsoft/TypeScript': { c1: '#3178c6', c2: '#235a97' },
    'microsoft/vscode': { c1: '#0078d7', c2: '#005a9e' },
    // Org-level colors
    GetLantern: { c1: '#00B7E5', c2: '#008ba8' },
    HashiCorp: { c1: '#555555', c2: '#000000' }, // Off-black gradient for black
    StackExchange: { c1: '#F48024', c2: '#c96414' },
    stretchr: { c1: '#6B7280', c2: '#4b5563' },
    'gin-gonic': { c1: '#008ECF', c2: '#006594' },
    'go-gitea': { c1: '#609926', c2: '#436e18' },
    caddyserver: { c1: '#1F88C0', c2: '#135e85' },
    'dgraph-io': { c1: '#E50695', c2: '#a8026c' },
    'go-resty': { c1: '#7ACB8C', c2: '#57a168' },
    containerd: { c1: '#333333', c2: '#111111' }, // Off-black gradient
    argoproj: { c1: '#EF7B2D', c2: '#c45a16' },
    magefile: { c1: '#4A90E2', c2: '#2c6cb5' },
    harness: { c1: '#00B6FF', c2: '#0084ba' },
    'fyne-io': { c1: '#1E88E5', c2: '#1362a8' },
    'etcd-io': { c1: '#4196E1', c2: '#2c73b3' },
    unjs: { c1: '#F4D03F', c2: '#cba726' },
    triggerdotdev: { c1: '#A3E635', c2: '#7bb021' },
    tscircuit: { c1: '#3B82F6', c2: '#2359b3' },
    'kysely-org': { c1: '#333333', c2: '#111111' }, // Off-black gradient
    'bombshell-dev': { c1: '#FF00B8', c2: '#bd0088' },
    'LenovoLegionToolkit-Team': { c1: '#E2231A', c2: '#a8150d' },
  };

  const org = repo.split('/')[0];
  const colorData = brandColors[repo] || brandColors[org];

  if (colorData) {
    return {
      color1: new THREE.Color(colorData.c1),
      color2: new THREE.Color(colorData.c2),
    };
  }

  let hash = 0;
  for (let i = 0; i < repo.length; i++) {
    hash = repo.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360; // Adjacent hue for gradient

  const color1 = new THREE.Color().setHSL(hue1 / 360, 0.8, 0.6);
  const color2 = new THREE.Color().setHSL(hue2 / 360, 0.8, 0.4);

  return { color1, color2 };
}

// A single torus representing a contribution
function ContributionRing({
  work,
  position,
  index,
  isHovered,
  setHovered,
  totalItems,
}: {
  work: { _meta: { path: string }; repo: string } | null;
  position: [number, number, number];
  index: number;
  isHovered: boolean;
  setHovered: (idx: number | null) => void;
  totalItems: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const router = useRouter();
  const localY = useRef(position[1]);

  useEffect(() => {
    localY.current = position[1];
  }, [position[1]]);

  // Custom geometry with vertex colors based on repo name
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 1.9, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, 1.1, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    const extrudeSettings = {
      depth: 0.8,
      bevelEnabled: false,
      curveSegments: 64,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Center it on the Z axis (depth is 0.8, so offset by -0.4)
    geo.translate(0, 0, -0.4);

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);

    let color1 = new THREE.Color().setHSL(((index * 12) % 360) / 360, 0.8, 0.6);
    let color2 = new THREE.Color().setHSL(((index * 12 + 40) % 360) / 360, 0.8, 0.4);

    if (work && work.repo) {
      const repoColors = getRepoColors(work.repo);
      color1 = repoColors.color1;
      color2 = repoColors.color2;
    }

    for (let i = 0; i < count; i++) {
      const y = geo.attributes.position.getY(i);

      // Map y from [-1.9, 1.9] to [0, 1] for gradient
      const t = Math.max(0, Math.min(1, (y + 1.9) / 3.8));

      const mixedColor = color1.clone().lerp(color2, t);

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [index, work?.repo]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
    });
  }, []);

  // Target position and rotation for animation
  const targetX = isHovered ? position[0] - 1.5 : position[0];
  const targetZ = isHovered ? position[2] + 2 : position[2];

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Continuous upward motion
      localY.current += 1.0 * delta;

      // Wrap around logic
      const gap = 1.1;
      const totalSpan = totalItems * gap;
      const maxBound = totalSpan / 2;

      if (localY.current > maxBound) {
        localY.current -= totalSpan;
      }

      groupRef.current.position.y = localY.current;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 10 * delta;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 10 * delta;
    } else {
      groupRef.current.position.y = localY.current;
      groupRef.current.position.x = targetX;
      groupRef.current.position.z = targetZ;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={() => {
        if (work) router.push(`/work/${work._meta.path}`);
      }}
      onPointerOver={(e) => {
        if (!work) return;
        e.stopPropagation();
        setHovered(index);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!work) return;
        setHovered(null);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh
        geometry={geometry}
        material={material}
        scale={1.2}
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to lie flat like a stack of coins
      />
      {work && (
        <Text
          position={[0, 0, 2.3]}
          curveRadius={2.3}
          fontSize={0.4}
          fontWeight="bold"
          color="white"
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, 0]}
        >
          {work.repo}
        </Text>
      )}
    </group>
  );
}

export default function RingField({
  works,
}: {
  works: { _meta: { path: string }; repo: string }[];
}) {
  // Pad the works array to 30 items with mock repositories for decorative rings
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

  const paddedWorks = Array.from({ length: 30 }).map((_, i) => {
    return {
      _meta: { path: `mock-${i}` },
      repo: mockRepos[i % mockRepos.length],
    };
  });
  const [page, setPage] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const itemsPerPage = 30;
  const totalPages = Math.ceil(paddedWorks.length / itemsPerPage);

  const currentWorks = paddedWorks.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Entrance animation
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 50,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 100], fov: 10 }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          maskImage:
            'linear-gradient(to bottom, transparent 15%, black 30%, black 70%, transparent 85%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 15%, black 30%, black 70%, transparent 85%)',
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        <Suspense fallback={null}>
          {currentWorks.map((work, idx) => {
            // Vertical column stacking on the right side
            const xOffset = 8.0;
            // Normal yOffset so idx=0 is at the bottom and they build upwards (gap 1.1)
            const yOffset = (idx - (currentWorks.length - 1) / 2) * 1.1;
            const zOffset = 0;

            return (
              <ContributionRing
                key={work ? work._meta.path : `empty-${idx}`}
                work={work}
                index={idx}
                position={[xOffset, yOffset, zOffset]}
                isHovered={hoveredIndex === idx}
                setHovered={setHoveredIndex}
                totalItems={currentWorks.length}
              />
            );
          })}
        </Suspense>
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute right-12 bottom-12 flex flex-col items-end pointer-events-none">
        {/* Pagination Controls */}
        <div className="flex items-center gap-4 pointer-events-auto bg-[var(--color-paper)]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-hairline)]">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-mist)] disabled:opacity-30 hover:text-[var(--color-ink)] transition-colors"
            aria-label="Previous page"
          >
            ←
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-hairline)]'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-8 h-8 flex items-center justify-center text-[var(--color-mist)] disabled:opacity-30 hover:text-[var(--color-ink)] transition-colors"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
