"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Sky } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import type { DeckConfig, PriceBook } from "../lib/types";

const BOARD_W = 0.09;
const BOARD_T = 0.022;
const BOARD_GAP = 0.005;
const JOIST_W = 0.045;
const JOIST_H = 0.09;
const JOIST_CENTRE = 0.45;
const POST_S = 0.09;
const POST_SPACING = 1.8;
const RAIL_HEIGHT = 1.0;
const BALUSTER_S = 0.025;
const BALUSTER_SPACING = 0.11;
const TREAD_RISE = 0.18;
const TREAD_DEPTH = 0.28;
const STAIR_WIDTH = 1.0;

function darken(hex: string, amount = 0.18) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, -amount);
  return `#${c.getHexString()}`;
}

function Deck({ cfg, deckColor }: { cfg: DeckConfig; deckColor: string }) {
  const { length: L, width: W, height: H, stairs, stairsSide, railing, railingSides } = cfg;
  const surfaceY = H;
  const boardCount = Math.max(1, Math.floor((W + BOARD_GAP) / (BOARD_W + BOARD_GAP)));
  const actualBoardW = (W - (boardCount - 1) * BOARD_GAP) / boardCount;

  const joistCount = Math.max(2, Math.ceil(L / JOIST_CENTRE) + 1);
  const joistGap = (L - JOIST_W) / (joistCount - 1);

  const postCols = Math.max(2, Math.ceil(L / POST_SPACING) + 1);
  const postRows = Math.max(2, Math.ceil(W / POST_SPACING) + 1);
  const postPositions = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < postCols; i++) {
      for (let j = 0; j < postRows; j++) {
        const x = (i / (postCols - 1)) * L - L / 2;
        const z = (j / (postRows - 1)) * W - W / 2;
        out.push([x, z]);
      }
    }
    return out;
  }, [L, W, postCols, postRows]);

  const joistColor = "#3e2a1f";
  const postColor = "#2b1d14";
  const boardEnd = darken(deckColor, 0.1);

  const stepCount = stairs ? Math.max(1, Math.ceil(H / TREAD_RISE)) : 0;

  return (
    <group>
      {/* decking boards */}
      {Array.from({ length: boardCount }).map((_, i) => {
        const z = -W / 2 + i * (actualBoardW + BOARD_GAP) + actualBoardW / 2;
        return (
          <mesh key={`b-${i}`} position={[0, surfaceY - BOARD_T / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[L, BOARD_T, actualBoardW]} />
            <meshStandardMaterial color={deckColor} roughness={0.72} metalness={0.02} />
          </mesh>
        );
      })}

      {/* joists */}
      {Array.from({ length: joistCount }).map((_, i) => {
        const x = -L / 2 + JOIST_W / 2 + i * joistGap;
        return (
          <mesh key={`j-${i}`} position={[x, surfaceY - BOARD_T - JOIST_H / 2, 0]} castShadow>
            <boxGeometry args={[JOIST_W, JOIST_H, W]} />
            <meshStandardMaterial color={joistColor} roughness={0.9} />
          </mesh>
        );
      })}

      {/* bearers (under joists, running along W direction at each post row) */}
      {Array.from({ length: postCols }).map((_, i) => {
        const x = (i / (postCols - 1)) * L - L / 2;
        return (
          <mesh key={`br-${i}`} position={[x, surfaceY - BOARD_T - JOIST_H - 0.045, 0]} castShadow>
            <boxGeometry args={[0.14, 0.045, W]} />
            <meshStandardMaterial color={joistColor} roughness={0.9} />
          </mesh>
        );
      })}

      {/* posts */}
      {postPositions.map(([x, z], i) => {
        const top = railing && isRailingPost(x, z, L, W, railingSides) ? surfaceY + RAIL_HEIGHT : surfaceY;
        const postH = top;
        return (
          <mesh key={`p-${i}`} position={[x, postH / 2, z]} castShadow>
            <boxGeometry args={[POST_S, postH, POST_S]} />
            <meshStandardMaterial color={postColor} roughness={0.85} />
          </mesh>
        );
      })}

      {/* railing */}
      {railing &&
        railingSides.map((side) => <RailingSide key={side} side={side} L={L} W={W} surfaceY={surfaceY} color={postColor} />)}

      {/* stairs */}
      {stairs && stepCount > 0 && (
        <Stairs
          stepCount={stepCount}
          stairsSide={stairsSide}
          L={L}
          W={W}
          deckColor={deckColor}
          frameColor={postColor}
        />
      )}

      {/* fascia (end board to hide joist ends) */}
      {[-L / 2, L / 2].map((x, i) => (
        <mesh key={`f-${i}`} position={[x, surfaceY - BOARD_T - JOIST_H / 2, 0]}>
          <boxGeometry args={[0.018, JOIST_H, W]} />
          <meshStandardMaterial color={boardEnd} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function isRailingPost(x: number, z: number, L: number, W: number, sides: ("front" | "back" | "left" | "right")[]) {
  const onFront = Math.abs(z + W / 2) < 0.01 && sides.includes("front");
  const onBack = Math.abs(z - W / 2) < 0.01 && sides.includes("back");
  const onLeft = Math.abs(x + L / 2) < 0.01 && sides.includes("left");
  const onRight = Math.abs(x - L / 2) < 0.01 && sides.includes("right");
  return onFront || onBack || onLeft || onRight;
}

function RailingSide({
  side,
  L,
  W,
  surfaceY,
  color,
}: {
  side: "front" | "back" | "left" | "right";
  L: number;
  W: number;
  surfaceY: number;
  color: string;
}) {
  const horizontal = side === "front" || side === "back";
  const span = horizontal ? L : W;
  const balusterCount = Math.max(2, Math.floor(span / BALUSTER_SPACING));
  const spacing = (span - balusterCount * BALUSTER_S) / (balusterCount + 1);

  const x0 = side === "left" ? -L / 2 : side === "right" ? L / 2 : 0;
  const z0 = side === "front" ? -W / 2 : side === "back" ? W / 2 : 0;

  return (
    <group>
      {/* top rail */}
      <mesh
        position={[x0, surfaceY + RAIL_HEIGHT - 0.02, z0]}
        rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}
        castShadow
      >
        <boxGeometry args={[span, 0.04, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* mid rail */}
      <mesh
        position={[x0, surfaceY + RAIL_HEIGHT - 0.5, z0]}
        rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}
        castShadow
      >
        <boxGeometry args={[span, 0.025, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* balusters */}
      {Array.from({ length: balusterCount }).map((_, i) => {
        const along = -span / 2 + spacing + i * (BALUSTER_S + spacing) + BALUSTER_S / 2;
        const pos: [number, number, number] = horizontal ? [along + x0, surfaceY + RAIL_HEIGHT / 2, z0] : [x0, surfaceY + RAIL_HEIGHT / 2, along + z0];
        return (
          <mesh key={`bal-${side}-${i}`} position={pos} castShadow>
            <boxGeometry args={[BALUSTER_S, RAIL_HEIGHT - 0.04, BALUSTER_S]} />
            <meshStandardMaterial color={color} roughness={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}

function Stairs({
  stepCount,
  stairsSide,
  L,
  W,
  deckColor,
  frameColor,
}: {
  stepCount: number;
  stairsSide: "front" | "left" | "right";
  L: number;
  W: number;
  deckColor: string;
  frameColor: string;
}) {
  const totalDepth = stepCount * TREAD_DEPTH;
  return (
    <group
      position={
        stairsSide === "front"
          ? [0, 0, -W / 2 - totalDepth / 2]
          : stairsSide === "left"
            ? [-L / 2 - totalDepth / 2, 0, 0]
            : [L / 2 + totalDepth / 2, 0, 0]
      }
      rotation={[0, stairsSide === "left" ? Math.PI / 2 : stairsSide === "right" ? -Math.PI / 2 : 0, 0]}
    >
      {Array.from({ length: stepCount }).map((_, i) => {
        const y = (i + 1) * TREAD_RISE - TREAD_RISE / 2;
        const z = totalDepth / 2 - (i + 0.5) * TREAD_DEPTH;
        return (
          <group key={`s-${i}`}>
            <mesh position={[0, y, z]} castShadow receiveShadow>
              <boxGeometry args={[STAIR_WIDTH, 0.04, TREAD_DEPTH - 0.005]} />
              <meshStandardMaterial color={deckColor} roughness={0.72} />
            </mesh>
            <mesh position={[0, y - TREAD_RISE / 2 + 0.02, z + TREAD_DEPTH / 2 - 0.01]} castShadow>
              <boxGeometry args={[STAIR_WIDTH, TREAD_RISE - 0.04, 0.018]} />
              <meshStandardMaterial color={frameColor} roughness={0.85} />
            </mesh>
          </group>
        );
      })}
      {/* stringers */}
      {[-1, 1].map((sign, i) => (
        <mesh key={`str-${i}`} position={[(STAIR_WIDTH / 2) * sign, (stepCount * TREAD_RISE) / 2, 0]} castShadow>
          <boxGeometry args={[0.045, stepCount * TREAD_RISE + 0.1, totalDepth + 0.05]} />
          <meshStandardMaterial color={frameColor} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#5b7a3a" roughness={0.95} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={20} blur={2.2} far={6} />
    </>
  );
}

export default function DeckScene({
  cfg,
  pricebook,
  cameraKey,
}: {
  cfg: DeckConfig;
  pricebook: PriceBook;
  cameraKey?: number;
}) {
  const deckColor = pricebook.materials[cfg.materialKey]?.color ?? "#8a5a3c";
  const camDist = Math.max(8, Math.max(cfg.length, cfg.width) * 1.4 + 4);
  const camY = Math.max(3, cfg.height + 3);
  return (
    <Canvas
      key={cameraKey}
      shadows
      camera={{ position: [camDist * 0.7, camY, camDist], fov: 38 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      className="rounded-xl"
    >
      <color attach="background" args={["#cfe6f3"]} />
      <Sky sunPosition={[40, 25, 12]} turbidity={6} rayleigh={1.2} mieCoefficient={0.005} />
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[18, 22, 12]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Suspense fallback={null}>
        <Environment preset="park" />
        <Ground />
        <Deck cfg={cfg} deckColor={deckColor} />
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.04}
        target={[0, cfg.height / 2 + 0.5, 0]}
      />
    </Canvas>
  );
}
