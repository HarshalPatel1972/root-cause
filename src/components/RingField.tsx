'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Helper to generate consistent colors based on a string (repo name)
function getRepoColors(repo: string) {
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
  const meshRef = useRef<THREE.Mesh>(null);
  const router = useRouter();
  const localY = useRef(position[1]);

  useEffect(() => {
    localY.current = position[1];
  }, [position]);

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

    const hue1 = (index * 12) % 360;
    const hue2 = (hue1 + 40) % 360;
    const color1 = new THREE.Color().setHSL(hue1 / 360, 0.8, 0.6);
    const color2 = new THREE.Color().setHSL(hue2 / 360, 0.8, 0.4);

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
  }, [index]);

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
    if (!meshRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      // Continuous upward motion
      localY.current += 1.0 * delta;

      // Wrap around logic
      const gap = 0.65;
      const totalSpan = totalItems * gap;
      const maxBound = totalSpan / 2;

      if (localY.current > maxBound) {
        localY.current -= totalSpan;
      }

      meshRef.current.position.y = localY.current;
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 10 * delta;
      meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 10 * delta;
    } else {
      meshRef.current.position.y = localY.current;
      meshRef.current.position.x = targetX;
      meshRef.current.position.z = targetZ;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={0.7}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to lie flat like a stack of coins
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
    />
  );
}

export default function RingField({
  works,
}: {
  works: { _meta: { path: string }; repo: string }[];
}) {
  // Pad the works array to 30 items with nulls for decorative rings
  const paddedWorks = Array.from({ length: 30 }).map((_, i) => works[i] || null);
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
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {currentWorks.map((work, idx) => {
          // Vertical column stacking on the right side
          const xOffset = 8.0;
          // Normal yOffset so idx=0 is at the bottom and they build upwards (gap 0.65)
          const yOffset = (idx - (currentWorks.length - 1) / 2) * 0.65;
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
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute right-12 bottom-12 flex flex-col items-end pointer-events-none">
        {/* Hover Label */}
        <div
          className={`h-8 mb-8 transition-opacity duration-300 font-mono text-sm text-[var(--color-violet)] ${hoveredIndex !== null ? 'opacity-100' : 'opacity-0'}`}
        >
          {hoveredIndex !== null && currentWorks[hoveredIndex]
            ? currentWorks[hoveredIndex].repo
            : ''}
        </div>

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
