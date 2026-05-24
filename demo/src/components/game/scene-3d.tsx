"use client";

import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { TOLL_Z_LOCAL, LANE_WIDTH, type GameFrameData } from "@/hooks/use-game-sim";

type FrameRef = MutableRefObject<GameFrameData>;
type TickFn = (ms: number) => GameFrameData;

const ROAD_END_Z = TOLL_Z_LOCAL + 2600;
const ROAD_START_Z = -60;
const ROAD_LEN = ROAD_END_Z - ROAD_START_Z;
const ROAD_CENTER = (ROAD_START_Z + ROAD_END_Z) / 2;
const ROAD_WIDTH = 18;
const LANE_CENTERS = [-LANE_WIDTH, 0, LANE_WIDTH];

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Scene3D
export function Scene3D({ tick, frameRef }: { tick: TickFn; frameRef: FrameRef }) {
  return (
    <>
      <color attach="background" args={["#9bb8d2"]} />
      <fog attach="fog" args={["#c8d8e8", 60, 380]} />
      <ambientLight intensity={0.52} color="#fff8f0" />
      <hemisphereLight args={["#a8d4f0", "#4a7a50", 0.6]} />
      <SunLight />
      <Sky
        distance={4500}
        sunPosition={[120, 28, 80]}
        turbidity={3.4}
        rayleigh={1.1}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
      />

      <SimDriver tick={tick} />
      <CameraRig frameRef={frameRef} />
      <Mountains />
      <Road />
      <Ground />
      <Shoulders />
      <SideTrees />
      <Billboards />
      <Barriers />
      <TollPlaza frameRef={frameRef} />
      <TrafficCones frameRef={frameRef} />
      <TrafficCars frameRef={frameRef} />
      <PlayerCar frameRef={frameRef} />
    </>
  );
}

// SimDriver
function SimDriver({ tick }: { tick: TickFn }) {
  useFrame(() => tick(performance.now()));
  return null;
}

// SunLight
function SunLight() {
  return (
    <directionalLight
      position={[80, 100, 40]}
      intensity={1.4}
      color="#fff4e0"
      castShadow={false}
    />
  );
}

// CameraRig
function CameraRig({ frameRef }: { frameRef: FrameRef }) {
  const camPos = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const smoothLook = useMemo(() => new THREE.Vector3(), []);
  const waitPull = useRef(0);
  const init = useRef(false);

  useFrame(({ camera }) => {
    const { playerZ, playerSpeed, phase } = frameRef.current;
    const sf = THREE.MathUtils.clamp(playerSpeed / 120, 0, 1);

    let back = 6.5 + sf * 2;
    let height = 2.6 + sf * 0.8;
    let lookAhead = 18 + sf * 10;

    if (phase === "waiting") {
      waitPull.current = THREE.MathUtils.lerp(waitPull.current, 10, 0.015);
      back += waitPull.current;
      height += waitPull.current * 0.2;
      lookAhead -= waitPull.current * 0.3;
    } else {
      waitPull.current = THREE.MathUtils.lerp(waitPull.current, 0, 0.03);
    }

    camPos.set(0, height, playerZ - back);
    lookAt.set(0, 1.1, playerZ + lookAhead);

    if (!init.current) {
      camera.position.copy(camPos);
      smoothLook.copy(lookAt);
      init.current = true;
    } else {
      camera.position.lerp(camPos, 0.12);
      smoothLook.lerp(lookAt, 0.12);
    }
    camera.lookAt(smoothLook);
  });

  return null;
}

// Road
function Road() {
  const texture = useMemo(() => {
    const W = 512;
    const H = 512;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#3a3e44";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, 68, H);
    ctx.fillRect(444, 0, 68, H);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(68, 0, 4, H);
    ctx.fillRect(440, 0, 4, H);

    ctx.fillStyle = "#f0d040";
    ctx.fillRect(198, 0, 4, Math.floor(H * 0.45));
    ctx.fillRect(310, 0, 4, Math.floor(H * 0.45));

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, ROAD_LEN / 10);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, ROAD_CENTER]}>
      <planeGeometry args={[ROAD_WIDTH, ROAD_LEN]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  );
}

// Ground
// Procedural noise texture so the ground reads as grass / earth instead of a
// flat green slab.
function Ground() {
  const tex = useMemo(() => {
    const W = 256;
    const H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#5a8a55";
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 2400; i++) {
      const x = seededUnit(i + 1) * W;
      const y = seededUnit(i + 9011) * H;
      const r = seededUnit(i + 17033) * 2 + 0.4;
      const v = seededUnit(i + 23801);
      const a = 0.4 + seededUnit(i + 31119) * 0.35;
      ctx.fillStyle = `rgba(${v > 0.5 ? 110 : 70},${v > 0.5 ? 150 : 120},${v > 0.5 ? 80 : 60},${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 200);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, ROAD_CENTER]}>
      <planeGeometry args={[400, ROAD_LEN]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

// Shoulders
// Lighter gravel strip between road and grass — softens the road edge.
function Shoulders() {
  return (
    <>
      {[-10.5, 10.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.005, ROAD_CENTER]}>
          <planeGeometry args={[2.2, ROAD_LEN]} />
          <meshStandardMaterial color="#8a8674" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

// Mountains
// Procedural distant ridges painted onto background planes. Static so they
// cost nothing per frame.
function Mountains() {
  const tex = useMemo(() => {
    const W = 1024;
    const H = 220;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, W, H);

    function ridge(seedOffset: number, baseY: number, amplitude: number, color: string) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      const points = 80;
      for (let i = 0; i <= points; i++) {
        const x = (i / points) * W;
        const n =
          Math.sin(i * 0.45 + seedOffset) * 0.55 +
          Math.sin(i * 1.13 + seedOffset * 1.7) * 0.3 +
          Math.sin(i * 2.37 + seedOffset * 0.9) * 0.18;
        const y = baseY - n * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    ridge(1.2, 160, 50, "rgba(120,142,170,0.65)");
    ridge(2.7, 130, 70, "rgba(96,118,148,0.78)");
    ridge(5.1, 100, 80, "rgba(78,98,124,0.92)");

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <>
      <mesh position={[0, 60, ROAD_END_Z + 380]}>
        <planeGeometry args={[1400, 240]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 60, ROAD_START_Z - 380]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1400, 240]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
      </mesh>
    </>
  );
}

// Billboards
// Roadside FASTag adverts. Static — purely set dressing for realism.
function Billboards() {
  const items = useMemo(() => {
    const list: { z: number; side: number; label: string; sub: string; bg: string }[] = [];
    const slots = [
      { z: -20, label: "TollFlow", sub: "Recharge before the toll", bg: "#6B2FA0" },
      { z: 90, label: "FASTag", sub: "Keep balance over ₹200", bg: "#0F62FE" },
      { z: TOLL_Z_LOCAL + 220, label: "Drive safe", sub: "Maintain lane discipline", bg: "#0E7C3A" },
    ];
    slots.forEach((s, i) => list.push({ ...s, side: i % 2 === 0 ? -1 : 1 }));
    return list;
  }, []);

  return (
    <>
      {items.map((b, i) => (
        <group key={i} position={[b.side * 22, 0, b.z]} rotation={[0, b.side > 0 ? -0.35 : 0.35, 0]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 6, 8]} />
            <meshStandardMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[0, 6.5, 0]}>
            <boxGeometry args={[6.4, 3.2, 0.18]} />
            <meshStandardMaterial color={b.bg} roughness={0.55} />
          </mesh>
          <mesh position={[0, 7.3, 0.11]}>
            <planeGeometry args={[5.6, 0.85]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 5.95, 0.11]}>
            <planeGeometry args={[5.6, 0.45]} />
            <meshStandardMaterial color="#ffeb88" emissive="#ffeb88" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 8.4, -0.02]}>
            <boxGeometry args={[6.7, 0.18, 0.22]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// SideTrees
// Mix of pine cones, broadleaf blobs, and skinny saplings to break up the
// repetition along the highway shoulder.
function SideTrees() {
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number; kind: number; side: number }[] = [];
    for (let z = ROAD_START_Z; z < ROAD_END_Z; z += 14) {
      const kindL = Math.floor(seededUnit(z + 11) * 3);
      const kindR = Math.floor(seededUnit(z + 13) * 3);
      out.push({ x: -13 - seededUnit(z) * 6, z: z + seededUnit(z + 5) * 4, s: 0.7 + seededUnit(z + 1) * 0.8, kind: kindL, side: -1 });
      out.push({ x: 13 + seededUnit(z + 2) * 6, z: z + seededUnit(z + 7) * 4, s: 0.7 + seededUnit(z + 3) * 0.8, kind: kindR, side: 1 });
    }
    return out;
  }, []);

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          {t.kind === 0 ? (
            <>
              <mesh position={[0, t.s * 2.2, 0]}>
                <coneGeometry args={[t.s * 1.7, t.s * 4.4, 6]} />
                <meshStandardMaterial color="#2d6a3a" flatShading />
              </mesh>
              <mesh position={[0, t.s * 0.55, 0]}>
                <cylinderGeometry args={[0.16, 0.22, t.s * 1.1, 5]} />
                <meshStandardMaterial color="#4a3020" />
              </mesh>
            </>
          ) : t.kind === 1 ? (
            <>
              <mesh position={[0, t.s * 2.1, 0]}>
                <sphereGeometry args={[t.s * 1.5, 8, 6]} />
                <meshStandardMaterial color="#3a8045" flatShading />
              </mesh>
              <mesh position={[0, t.s * 0.6, 0]}>
                <cylinderGeometry args={[0.18, 0.26, t.s * 1.2, 5]} />
                <meshStandardMaterial color="#5a3a26" />
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[0, t.s * 3, 0]}>
                <sphereGeometry args={[t.s * 0.95, 6, 5]} />
                <meshStandardMaterial color="#5fa356" flatShading />
              </mesh>
              <mesh position={[0, t.s * 1.5, 0]}>
                <cylinderGeometry args={[0.1, 0.14, t.s * 3, 5]} />
                <meshStandardMaterial color="#5a4028" />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
}

// TrafficCones
// Orange-and-white cones placed ahead of the stalled lane during a chain
// reaction so the obstruction reads instantly.
function TrafficCones({ frameRef }: { frameRef: FrameRef }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const { phase, stallLane } = frameRef.current;
    const show = phase === "waiting" || phase === "declined";
    g.visible = show && stallLane !== null;
  });

  const positions = useMemo(() => {
    const out: [number, number][] = [];
    const baseX = 0;
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      out.push([baseX - 1.4 + t * 2.8, -3 + i * 1.2]);
    }
    return out;
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, TOLL_Z_LOCAL]} visible={false}>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.36, 0.08, 0.36]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <coneGeometry args={[0.22, 0.55, 12]} />
            <meshStandardMaterial color="#ff6a1a" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Barriers
function Barriers() {
  return (
    <>
      <mesh position={[-9.2, 0.35, ROAD_CENTER]}>
        <boxGeometry args={[0.1, 0.7, ROAD_LEN]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[9.2, 0.35, ROAD_CENTER]}>
        <boxGeometry args={[0.1, 0.7, ROAD_LEN]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.4} />
      </mesh>
    </>
  );
}

// TollPlaza
function TollPlaza({ frameRef }: { frameRef: FrameRef }) {
  const boomRefs = useRef<(THREE.Group | null)[]>([]);
  const lightRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const { blocked, stallLane, phase } = frameRef.current;
    const paid = phase === "approved" || phase === "cleared";
    for (let i = 0; i < 3; i++) {
      const isPlayerLane = i === 1;
      const down = isPlayerLane ? !paid : blocked && i === (stallLane ?? 1);
      const boom = boomRefs.current[i];
      if (boom) {
        boom.rotation.z = THREE.MathUtils.lerp(boom.rotation.z, down ? 0.02 : 1.18, 0.08);
      }
      const light = lightRefs.current[i];
      if (light) {
        const mat = light.material as THREE.MeshStandardMaterial;
        mat.color.set(down ? "#ff3333" : "#33ee55");
        mat.emissive.set(down ? "#ff3333" : "#33ee55");
        mat.emissiveIntensity = down ? 4 : 3;
      }
    }
  });

  const green = "#00703c";
  const greenDark = "#004d2a";
  const islands = [-5.7, -1.9, 1.9, 5.7];

  return (
    <group position={[0, 0, TOLL_Z_LOCAL]}>
      <mesh position={[0, 0.035, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[17.5, 36]} />
        <meshStandardMaterial color="#3f4246" roughness={0.9} />
      </mesh>

      {[-28, -21, -14].map((z) => (
        <mesh key={z} position={[0, 0.055, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15.5, 0.32]} />
          <meshStandardMaterial color="#f6d35b" roughness={0.8} />
        </mesh>
      ))}

      {LANE_CENTERS.map((x) => (
        <mesh key={`lane-stop-${x}`} position={[x, 0.065, 5.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 0.18]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
      ))}

      <mesh position={[0, 10.6, -1.5]}>
        <boxGeometry args={[24, 0.55, 17]} />
        <meshStandardMaterial color={green} metalness={0.25} roughness={0.48} />
      </mesh>
      <mesh position={[0, 10.22, -1.5]}>
        <boxGeometry args={[23.4, 0.12, 16.2]} />
        <meshStandardMaterial color={greenDark} />
      </mesh>

      {[-8.4, 8.4].map((x) => (
        <mesh key={x} position={[x, 5.1, -1.5]}>
          <boxGeometry args={[0.75, 10.2, 0.75]} />
          <meshStandardMaterial color="#f7f2df" roughness={0.58} />
        </mesh>
      ))}

      <mesh position={[0, 8.85, 7.1]}>
        <boxGeometry args={[21, 2.6, 0.22]} />
        <meshStandardMaterial color={green} />
      </mesh>
      <mesh position={[0, 9.45, 7.24]}>
        <planeGeometry args={[18.5, 0.75]} />
        <meshStandardMaterial color="#f8fff8" emissive="#f8fff8" emissiveIntensity={1.25} />
      </mesh>
      <mesh position={[0, 8.45, 7.24]}>
        <planeGeometry args={[15, 0.5]} />
        <meshStandardMaterial color="#ffd84d" emissive="#ffd84d" emissiveIntensity={0.9} />
      </mesh>

      <mesh position={[0, 7.25, 7.2]}>
        <boxGeometry args={[22, 0.15, 0.05]} />
        <meshStandardMaterial color="#ff9933" />
      </mesh>
      <mesh position={[0, 7.05, 7.2]}>
        <boxGeometry args={[22, 0.15, 0.05]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 6.85, 7.2]}>
        <boxGeometry args={[22, 0.15, 0.05]} />
        <meshStandardMaterial color="#138808" />
      </mesh>

      {islands.map((x, i) => (
        <group key={`island-${x}`} position={[x, 0, -2]}>
          {/* island base */}
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.86, 0.28, 18]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#f2c64b" : "#f7f2df"} roughness={0.75} />
          </mesh>
          {/* rear cap (rear approach guard) */}
          <mesh position={[0, 0.38, -7]}>
            <boxGeometry args={[0.92, 0.3, 2.4]} />
            <meshStandardMaterial color="#1d1d1d" roughness={0.62} />
          </mesh>
          {/* booth body */}
          <mesh position={[0, 2.05, 1.4]}>
            <boxGeometry args={[0.95, 3.25, 3.6]} />
            <meshStandardMaterial color="#efe7d2" roughness={0.56} />
          </mesh>
          {/* booth window (cashier side) */}
          <mesh position={[0, 2.4, -0.42]}>
            <planeGeometry args={[0.78, 0.95]} />
            <meshPhysicalMaterial color="#aedbf2" transparent opacity={0.55} roughness={0.1} transmission={0.45} metalness={0.2} />
          </mesh>
          {/* window frame */}
          <mesh position={[0, 2.4, -0.41]}>
            <boxGeometry args={[0.82, 0.99, 0.04]} />
            <meshStandardMaterial color="#3a3a3a" />
          </mesh>
          {/* attendant silhouette */}
          <group position={[0, 1.95, 0.4]}>
            <mesh position={[0, 0.55, 0]}>
              <capsuleGeometry args={[0.16, 0.6, 4, 8]} />
              <meshStandardMaterial color="#243044" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshStandardMaterial color="#a8826a" roughness={0.7} />
            </mesh>
          </group>
          {/* booth roof */}
          <mesh position={[0, 3.9, 1.4]}>
            <boxGeometry args={[1.08, 0.25, 3.95]} />
            <meshStandardMaterial color="#454545" metalness={0.35} roughness={0.42} />
          </mesh>
          {/* roof beacon — small amber on every booth */}
          <mesh position={[0, 4.15, 1.4]}>
            <cylinderGeometry args={[0.07, 0.07, 0.18, 8]} />
            <meshStandardMaterial color="#f4a82a" emissive="#f4a82a" emissiveIntensity={1.2} />
          </mesh>
          {/* door on rear of booth */}
          <mesh position={[0, 1.5, 3.18]}>
            <planeGeometry args={[0.6, 1.5]} />
            <meshStandardMaterial color="#8a5a30" />
          </mesh>
        </group>
      ))}

      {/* surveillance cameras under canopy */}
      {[-7, -2.3, 2.3, 7].map((x) => (
        <group key={`cam-${x}`} position={[x, 9.55, 5.4]}>
          <mesh>
            <boxGeometry args={[0.1, 0.18, 0.36]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.1, 0.18]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.7} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {LANE_CENTERS.map((x, i) => {
        const tex = laneSignTexture(i + 1, "FASTag");
        return (
          <group key={`lane-${i}`}>
            {/* lane sign panel mounted on canopy front */}
            <mesh position={[x, 6.45, -5.42]}>
              <planeGeometry args={[3.1, 1.4]} />
              <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.55} toneMapped={false} />
            </mesh>
            {/* panel frame */}
            <mesh position={[x, 6.45, -5.5]}>
              <boxGeometry args={[3.2, 1.5, 0.08]} />
              <meshStandardMaterial color="#1f2730" metalness={0.5} roughness={0.4} />
            </mesh>
            {/* signal light below sign */}
            <mesh
              ref={(el) => { lightRefs.current[i] = el; }}
              position={[x, 5.45, -5.4]}
            >
              <boxGeometry args={[0.55, 0.32, 0.08]} />
              <meshStandardMaterial emissive="#ff3333" emissiveIntensity={4} color="#ff3333" toneMapped={false} />
            </mesh>
            {/* RFID antenna above lane */}
            <mesh position={[x, 4.8, -3.6]}>
              <boxGeometry args={[1.1, 0.16, 0.5]} />
              <meshStandardMaterial color="#1d2330" metalness={0.55} roughness={0.45} />
            </mesh>
            {/* antenna LED */}
            <mesh position={[x, 4.72, -3.34]}>
              <boxGeometry args={[0.18, 0.05, 0.02]} />
              <meshStandardMaterial emissive="#43e0a6" emissiveIntensity={2.2} color="#43e0a6" toneMapped={false} />
            </mesh>
            {/* boom barrier */}
            <group position={[x - 1.35, 0, 6.2]}>
              {/* mount post */}
              <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.1, 0.12, 2.2, 10]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.5} />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[0.34, 0.12, 0.34]} />
                <meshStandardMaterial color="#1e1e1e" />
              </mesh>
              <group ref={(el) => { boomRefs.current[i] = el; }} position={[0, 2.08, 0]}>
                <mesh position={[1.35, 0, 0]}>
                  <boxGeometry args={[2.7, 0.13, 0.12]} />
                  <meshStandardMaterial color="#f5f1e8" roughness={0.42} />
                </mesh>
                {[0.4, 0.95, 1.5, 2.05, 2.6].map((bx) => (
                  <mesh key={bx} position={[bx, 0, 0.07]}>
                    <boxGeometry args={[0.28, 0.12, 0.025]} />
                    <meshStandardMaterial color="#d71920" />
                  </mesh>
                ))}
                {/* boom tip warning light */}
                <mesh position={[2.7, 0.08, 0]}>
                  <sphereGeometry args={[0.07, 8, 6]} />
                  <meshStandardMaterial emissive="#ff3838" emissiveIntensity={2.5} color="#ff3838" toneMapped={false} />
                </mesh>
              </group>
            </group>
          </group>
        );
      })}

      {/* concrete kerbs */}
      {[-7.35, 7.35].map((x) => (
        <mesh key={`kerb-${x}`} position={[x, 0.16, -2]}>
          <boxGeometry args={[0.28, 0.32, 20]} />
          <meshStandardMaterial color="#d6b12f" roughness={0.78} />
        </mesh>
      ))}

      <ApproachGantry />
    </group>
  );
}

// laneSignTexture
// Builds a NHAI-style lane plate ("FASTag" wordmark + lane number) as a
// CanvasTexture so we don't need a font loader.
function laneSignTexture(lane: number, label: string): THREE.Texture {
  const W = 256;
  const H = 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  // panel background
  ctx.fillStyle = "#0F2A4A";
  ctx.fillRect(0, 0, W, H);
  // inner border
  ctx.strokeStyle = "#7c98c4";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  // FASTag chip (purple)
  ctx.fillStyle = "#6B2FA0";
  ctx.fillRect(14, 16, 78, 36);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("FASTag", 53, 34);
  // lane number block
  ctx.fillStyle = "#F4D35E";
  ctx.fillRect(108, 16, 132, 36);
  ctx.fillStyle = "#0F2A4A";
  ctx.font = "bold 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`LANE ${lane}`, 174, 36);
  // bottom label
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(label.toUpperCase(), W / 2, 88);
  ctx.font = "bold 14px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "#cdd6e0";
  ctx.fillText("ELECTRONIC TOLL", W / 2, 110);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ApproachGantry
// Overhead steel-frame sign placed before the booths announcing the toll.
function ApproachGantry() {
  const tex = useMemo(() => {
    const W = 1024;
    const H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#006838";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 78px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Lakhanpur Toll Plaza", W / 2, 80);
    ctx.font = "bold 44px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#ffd84d";
    ctx.fillText("FASTag Mandatory · 200 m ahead", W / 2, 160);
    ctx.font = "bold 32px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "#cce8d6";
    ctx.fillText("Maintain lane discipline · Speed limit 25", W / 2, 210);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);

  return (
    <group position={[0, 0, -50]}>
      {/* vertical posts */}
      {[-9.5, 9.5].map((x) => (
        <mesh key={x} position={[x, 4, 0]}>
          <boxGeometry args={[0.55, 8, 0.55]} />
          <meshStandardMaterial color="#d8d4c4" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {/* truss beam */}
      <mesh position={[0, 7.8, 0]}>
        <boxGeometry args={[20, 0.6, 0.7]} />
        <meshStandardMaterial color="#d8d4c4" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* main sign panel */}
      <mesh position={[0, 6.6, 0]}>
        <planeGeometry args={[17, 4]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[0, 6.6, -0.05]}>
        <boxGeometry args={[17.4, 4.4, 0.12]} />
        <meshStandardMaterial color="#1f2730" />
      </mesh>
    </group>
  );
}

// TrafficCars
// Renders many cars via instanced meshes (body + cabin + 4 wheels + brake
// lights). Lane changes are animated smoothly by lerping each car's X toward
// the simulated lane center.
function TrafficCars({ frameRef }: { frameRef: FrameRef }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const cabinRef = useRef<THREE.InstancedMesh>(null);
  const wheelRef = useRef<THREE.InstancedMesh>(null);
  const brakeRef = useRef<THREE.InstancedMesh>(null);
  const MAX = 260;
  const WHEEL_MAX = MAX * 4;
  const BRAKE_MAX = MAX * 2;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const wheelDummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const dark = useMemo(() => new THREE.Color("#191919"), []);
  const brakeOn = useMemo(() => new THREE.Color("#ff2014"), []);
  const brakeOff = useMemo(() => new THREE.Color("#5a0000"), []);
  const spinRef = useRef(0);
  const xMap = useRef<Map<number, number>>(new Map());

  const wheelOffsets = useMemo<[number, number][]>(
    () => [
      [-0.78, 1.4],
      [0.78, 1.4],
      [-0.78, -1.4],
      [0.78, -1.4],
    ],
    [],
  );
  const brakeOffsets = useMemo<[number, number][]>(() => [
    [-0.62, -2.18],
    [0.62, -2.18],
  ], []);

  useFrame((_, delta) => {
    const body = bodyRef.current;
    const cabin = cabinRef.current;
    const wheel = wheelRef.current;
    const brake = brakeRef.current;
    if (!body || !cabin || !wheel || !brake) return;

    const { cars, playerZ } = frameRef.current;
    spinRef.current += delta;

    let idx = 0;
    let wIdx = 0;
    let bIdx = 0;

    // Lane-change easing speed (per second). Higher = snappier.
    const laneLerpRate = Math.min(1, delta * 3.5);
    const seen = new Set<number>();

    for (const car of cars) {
      if (car.isPlayer) continue;
      const dz = car.z - playerZ;
      // Asymmetric cull: keep more behind so the queue pile-up is visible,
      // plenty ahead so cars don't pop out as they pass the toll.
      if (dz > 260 || dz < -280) continue;
      if (idx >= MAX) break;

      // Smooth lane change: lerp visual X toward simulated lane center.
      const cur = xMap.current.get(car.id) ?? car.x;
      const xv = cur + (car.x - cur) * laneLerpRate;
      xMap.current.set(car.id, xv);
      seen.add(car.id);

      // Compute heading from lane drift (sideways motion / forward motion).
      const sideways = car.x - cur;
      const heading = Math.atan2(sideways * 6, 1);

      const carHeight = 0.42;
      dummy.position.set(xv, carHeight, car.z);
      dummy.rotation.set(0, heading, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      body.setMatrixAt(idx, dummy.matrix);
      col.set(car.color);
      body.setColorAt(idx, col);

      dummy.position.set(xv, carHeight + 0.42, car.z - 0.15);
      dummy.scale.set(0.86, 0.78, 0.55);
      dummy.updateMatrix();
      cabin.setMatrixAt(idx, dummy.matrix);
      cabin.setColorAt(idx, col);

      // Wheels: rotate around X axis based on velocity (m/s).
      const speedMs = car.speed * 7.5;
      const wheelAngle = spinRef.current * (speedMs / 0.32);
      for (let w = 0; w < 4; w++) {
        const [ox, oz] = wheelOffsets[w]!;
        // Rotate wheel offset by heading so wheels stay with the body.
        const cs = Math.cos(heading);
        const sn = Math.sin(heading);
        const wox = ox * cs - oz * sn;
        const woz = ox * sn + oz * cs;
        wheelDummy.position.set(xv + wox, 0.32, car.z + woz);
        wheelDummy.rotation.set(wheelAngle, heading, Math.PI / 2);
        wheelDummy.scale.setScalar(1);
        wheelDummy.updateMatrix();
        wheel.setMatrixAt(wIdx, wheelDummy.matrix);
        wIdx++;
      }

      // Brake lights illuminate when nearly stopped.
      const braking = car.speed <= 1;
      for (let b = 0; b < 2; b++) {
        const [bx, bz] = brakeOffsets[b]!;
        const cs = Math.cos(heading);
        const sn = Math.sin(heading);
        dummy.position.set(xv + bx * cs - bz * sn, carHeight + 0.04, car.z + bx * sn + bz * cs);
        dummy.rotation.set(0, heading, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        brake.setMatrixAt(bIdx, dummy.matrix);
        brake.setColorAt(bIdx, braking ? brakeOn : brakeOff);
        bIdx++;
      }

      idx++;
    }

    // GC: drop x-tracking for cars we didn't see this frame.
    if (xMap.current.size > 600) {
      for (const k of xMap.current.keys()) if (!seen.has(k)) xMap.current.delete(k);
    }

    const off = new THREE.Matrix4().makeTranslation(0, -500, 0);
    for (let i = idx; i < MAX; i++) body.setMatrixAt(i, off);
    for (let i = idx; i < MAX; i++) cabin.setMatrixAt(i, off);
    for (let i = wIdx; i < WHEEL_MAX; i++) wheel.setMatrixAt(i, off);
    for (let i = bIdx; i < BRAKE_MAX; i++) brake.setMatrixAt(i, off);

    body.instanceMatrix.needsUpdate = true;
    cabin.instanceMatrix.needsUpdate = true;
    wheel.instanceMatrix.needsUpdate = true;
    brake.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    if (cabin.instanceColor) cabin.instanceColor.needsUpdate = true;
    if (brake.instanceColor) brake.instanceColor.needsUpdate = true;
    body.count = idx;
    cabin.count = idx;
    wheel.count = wIdx;
    brake.count = bIdx;
  });

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]} castShadow={false}>
        <boxGeometry args={[1.85, 0.62, 4.3]} />
        <meshStandardMaterial metalness={0.62} roughness={0.32} />
      </instancedMesh>
      <instancedMesh ref={cabinRef} args={[undefined, undefined, MAX]}>
        <boxGeometry args={[1.85, 0.62, 4.3]} />
        <meshStandardMaterial metalness={0.85} roughness={0.18} envMapIntensity={1.2} />
      </instancedMesh>
      <instancedMesh ref={wheelRef} args={[undefined, undefined, WHEEL_MAX]}>
        <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={brakeRef} args={[undefined, undefined, BRAKE_MAX]}>
        <boxGeometry args={[0.36, 0.12, 0.06]} />
        <meshStandardMaterial emissive="#ff2014" emissiveIntensity={2.1} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

// PlayerCar
// Detailed sedan with hood, cabin, windshield, mirrors, wheels (rotating with
// speed), headlight beams, brake lights that brighten when decelerating, and
// a faint engine idle wobble while waiting at the toll.
function PlayerCar({ frameRef }: { frameRef: FrameRef }) {
  const ref = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);
  const brakeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const fastagMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const prevSpeed = useRef(80);
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const { playerZ, playerSpeed, phase } = frameRef.current;
    if (!initialized.current) {
      ref.current.position.set(0, 0, playerZ);
      initialized.current = true;
    } else {
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, playerZ, 0.22);
    }

    // Idle wobble when stopped.
    if (phase === "waiting" || phase === "declined") {
      ref.current.position.y = Math.sin(performance.now() / 90) * 0.012;
      ref.current.rotation.z = Math.sin(performance.now() / 170) * 0.004;
    } else {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0, 0.1);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 0.1);
    }

    // Wheel rotation proportional to ground speed.
    const ms = playerSpeed / 3.6;
    const spinDelta = (ms / 0.34) * delta;
    for (const w of wheelRefs.current) {
      if (w) w.rotation.x += spinDelta;
    }

    // Brake lights brighten when decelerating, or fully when stopped.
    const decel = prevSpeed.current - playerSpeed;
    const brakingIntensity = playerSpeed < 1 ? 5 : decel > 0.5 ? Math.min(4, decel * 1.5) : 0.6;
    if (brakeMatRef.current) {
      brakeMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        brakeMatRef.current.emissiveIntensity,
        brakingIntensity,
        0.25,
      );
    }
    prevSpeed.current = playerSpeed;

    // Pulse the FASTag indicator on the windshield.
    if (fastagMatRef.current) {
      const pulse = (Math.sin(performance.now() / 320) + 1) * 0.5;
      fastagMatRef.current.emissiveIntensity = 1.2 + pulse * 1.6;
    }
  });

  const body = "#e7eef7";
  const bodyDark = "#cdd6e0";
  const glass = "#1a2638";

  return (
    <group ref={ref}>
      {/* main chassis */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[1.92, 0.4, 4.5]} />
        <meshStandardMaterial color={body} metalness={0.72} roughness={0.22} envMapIntensity={1.4} />
      </mesh>
      {/* hood */}
      <mesh position={[0, 0.55, 1.45]}>
        <boxGeometry args={[1.78, 0.18, 1.45]} />
        <meshStandardMaterial color={bodyDark} metalness={0.7} roughness={0.24} />
      </mesh>
      {/* trunk */}
      <mesh position={[0, 0.55, -1.65]}>
        <boxGeometry args={[1.78, 0.18, 1.05]} />
        <meshStandardMaterial color={bodyDark} metalness={0.7} roughness={0.24} />
      </mesh>
      {/* cabin (greenhouse) */}
      <mesh position={[0, 0.86, -0.18]}>
        <boxGeometry args={[1.62, 0.5, 2.05]} />
        <meshStandardMaterial color={body} metalness={0.55} roughness={0.28} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 0.96, 0.88]} rotation={[-0.55, 0, 0]}>
        <planeGeometry args={[1.52, 0.78]} />
        <meshPhysicalMaterial
          color={glass}
          transparent
          opacity={0.78}
          roughness={0.05}
          transmission={0.4}
          metalness={0.2}
        />
      </mesh>
      {/* rear glass */}
      <mesh position={[0, 0.96, -1.22]} rotation={[0.55, 0, 0]}>
        <planeGeometry args={[1.5, 0.72]} />
        <meshPhysicalMaterial
          color={glass}
          transparent
          opacity={0.72}
          roughness={0.05}
          transmission={0.35}
          metalness={0.2}
        />
      </mesh>
      {/* side windows */}
      {[-0.82, 0.82].map((x) => (
        <mesh key={`sw${x}`} position={[x, 0.94, -0.2]}>
          <boxGeometry args={[0.012, 0.32, 1.9]} />
          <meshStandardMaterial color={glass} transparent opacity={0.55} metalness={0.4} roughness={0.1} />
        </mesh>
      ))}
      {/* mirrors */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={`mr${x}`} position={[x, 0.94, 0.75]}>
          <boxGeometry args={[0.18, 0.12, 0.18]} />
          <meshStandardMaterial color={bodyDark} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* grille */}
      <mesh position={[0, 0.4, 2.27]}>
        <boxGeometry args={[1.4, 0.22, 0.04]} />
        <meshStandardMaterial color="#15181c" roughness={0.55} metalness={0.4} />
      </mesh>
      {/* headlights */}
      {[-0.68, 0.68].map((x) => (
        <mesh key={`hl${x}`} position={[x, 0.5, 2.28]}>
          <boxGeometry args={[0.38, 0.14, 0.04]} />
          <meshStandardMaterial emissive="#fffce0" emissiveIntensity={3.5} color="#fffce0" toneMapped={false} />
        </mesh>
      ))}
      {/* headlight beam ground projection */}
      {[-0.68, 0.68].map((x) => (
        <mesh
          key={`beam${x}`}
          position={[x, 0.02, 6]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.9, 7]} />
          <meshBasicMaterial
            color="#fffce0"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* brake light bar */}
      <mesh position={[0, 0.62, -2.27]}>
        <boxGeometry args={[1.55, 0.1, 0.03]} />
        <meshStandardMaterial
          ref={brakeMatRef}
          color="#5a0000"
          emissive="#ff2014"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* tail lights */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={`tl${x}`} position={[x, 0.5, -2.27]}>
          <boxGeometry args={[0.34, 0.16, 0.04]} />
          <meshStandardMaterial emissive="#ff5544" emissiveIntensity={1.5} color="#cc1f1f" />
        </mesh>
      ))}
      {/* license plate */}
      <mesh position={[0, 0.32, -2.28]}>
        <boxGeometry args={[0.62, 0.14, 0.02]} />
        <meshStandardMaterial color="#f4d35e" emissive="#f4d35e" emissiveIntensity={0.4} />
      </mesh>
      {/* FASTag sticker on windshield */}
      <mesh position={[0.45, 1.02, 0.62]} rotation={[-0.55, 0, 0]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshStandardMaterial
          ref={fastagMatRef}
          color="#6B2FA0"
          emissive="#9a4ad8"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* wheels */}
      {[
        [-0.86, 1.4],
        [0.86, 1.4],
        [-0.86, -1.4],
        [0.86, -1.4],
      ].map(([wx, wz], i) => (
        <group
          key={`w${i}`}
          ref={(el) => { wheelRefs.current[i] = el; }}
          position={[wx, 0.32, wz]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 18]} />
            <meshStandardMaterial color="#0e0e0e" roughness={0.85} />
          </mesh>
          {/* hub cap */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[wx > 0 ? 0.11 : -0.11, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.025, 12]} />
            <meshStandardMaterial color="#c8ccd2" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
