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
      <color attach="background" args={["#87a8c4"]} />
      <fog attach="fog" args={["#c8d8e8", 35, 160]} />
      <ambientLight intensity={0.55} color="#fff8f0" />
      <hemisphereLight args={["#a8d4f0", "#4a7a50", 0.65]} />
      <SunLight />
      <Sky
        distance={4500}
        sunPosition={[120, 28, 80]}
        turbidity={4}
        rayleigh={1.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.85}
      />

      <SimDriver tick={tick} />
      <CameraRig frameRef={frameRef} />
      <Road />
      <Ground />
      <SideTrees />
      <Barriers />
      <TollPlaza frameRef={frameRef} />
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
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, ROAD_CENTER]}>
      <planeGeometry args={[300, ROAD_LEN]} />
      <meshStandardMaterial color="#5a8a55" roughness={1} />
    </mesh>
  );
}

// SideTrees
function SideTrees() {
  const trees = useMemo(() => {
    const out: { x: number; z: number; s: number }[] = [];
    for (let z = ROAD_START_Z; z < ROAD_END_Z; z += 18) {
      out.push({ x: -12 - seededUnit(z) * 4, z, s: 0.8 + seededUnit(z + 1) * 0.6 });
      out.push({ x: 12 + seededUnit(z + 2) * 4, z, s: 0.8 + seededUnit(z + 3) * 0.6 });
    }
    return out;
  }, []);

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.s * 2, 0]}>
            <coneGeometry args={[t.s * 1.8, t.s * 4, 6]} />
            <meshStandardMaterial color="#2d6a3a" flatShading />
          </mesh>
          <mesh position={[0, t.s * 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, t.s, 5]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
        </group>
      ))}
    </>
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
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.86, 0.28, 18]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#f2c64b" : "#f7f2df"} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.38, -7]}>
            <boxGeometry args={[0.92, 0.3, 2.4]} />
            <meshStandardMaterial color="#1d1d1d" roughness={0.62} />
          </mesh>
          <mesh position={[0, 2.05, 1.4]}>
            <boxGeometry args={[0.95, 3.25, 3.6]} />
            <meshStandardMaterial color="#efe7d2" roughness={0.56} />
          </mesh>
          <mesh position={[0, 2.25, -0.42]}>
            <planeGeometry args={[0.75, 1.25]} />
            <meshStandardMaterial color="#8fc3dd" opacity={0.58} transparent roughness={0.2} />
          </mesh>
          <mesh position={[0, 3.9, 1.4]}>
            <boxGeometry args={[1.08, 0.25, 3.95]} />
            <meshStandardMaterial color="#454545" metalness={0.35} roughness={0.42} />
          </mesh>
        </group>
      ))}

      {LANE_CENTERS.map((x, i) => (
        <group key={`lane-${i}`}>
          <mesh position={[x, 6.45, -5.5]}>
            <boxGeometry args={[2.75, 0.72, 0.16]} />
            <meshStandardMaterial color={i === 1 ? "#6B2FA0" : "#123c78"} emissive={i === 1 ? "#6B2FA0" : "#123c78"} emissiveIntensity={0.65} />
          </mesh>
          <mesh
            ref={(el) => { lightRefs.current[i] = el; }}
            position={[x, 5.6, -5.42]}
          >
            <boxGeometry args={[0.55, 0.32, 0.08]} />
            <meshStandardMaterial emissive="#ff3333" emissiveIntensity={4} color="#ff3333" />
          </mesh>
          <mesh position={[x + 1.15, 3.25, -6.2]}>
            <boxGeometry args={[0.42, 1.35, 0.18]} />
            <meshStandardMaterial color="#222" roughness={0.45} />
          </mesh>
          <group position={[x - 1.35, 0, 6.2]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 8]} />
              <meshStandardMaterial color="#2a2a2a" />
            </mesh>
            <group ref={(el) => { boomRefs.current[i] = el; }} position={[0, 2.08, 0]}>
              <mesh position={[1.35, 0, 0]}>
                <boxGeometry args={[2.7, 0.13, 0.12]} />
                <meshStandardMaterial color="#f5f1e8" roughness={0.42} />
              </mesh>
              {[0.45, 1.1, 1.75, 2.4].map((bx) => (
                <mesh key={bx} position={[bx, 0, 0.07]}>
                  <boxGeometry args={[0.26, 0.11, 0.025]} />
                  <meshStandardMaterial color="#d71920" />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      ))}

      {[-7.35, 7.35].map((x) => (
        <mesh key={`kerb-${x}`} position={[x, 0.16, -2]}>
          <boxGeometry args={[0.28, 0.32, 20]} />
          <meshStandardMaterial color="#d6b12f" roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

// TrafficCars
function TrafficCars({ frameRef }: { frameRef: FrameRef }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const MAX = 80;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    const { cars, playerZ } = frameRef.current;
    let idx = 0;

    for (const car of cars) {
      if (car.isPlayer) continue;
      if (Math.abs(car.z - playerZ) > 90) continue;
      if (idx >= MAX) break;

      dummy.position.set(car.x, 0.38, car.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      body.setMatrixAt(idx, dummy.matrix);
      col.set(car.color);
      body.setColorAt(idx, col);
      idx++;
    }

    for (let i = idx; i < MAX; i++) {
      dummy.position.set(0, -200, 0);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
    }

    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    body.count = idx;
  });

  return (
    <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]}>
      <boxGeometry args={[1.8, 0.55, 4.2]} />
      <meshStandardMaterial metalness={0.55} roughness={0.35} />
    </instancedMesh>
  );
}

// PlayerCar
function PlayerCar({ frameRef }: { frameRef: FrameRef }) {
  const ref = useRef<THREE.Group>(null);
  const initialized = useRef(false);

  useFrame(() => {
    if (!ref.current) return;
    const z = frameRef.current.playerZ;
    if (!initialized.current) {
      ref.current.position.set(0, 0, z);
      initialized.current = true;
      return;
    }
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, z, 0.22);
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[1.95, 0.5, 4.6]} />
        <meshStandardMaterial color="#f0f0f0" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.78, -0.2]}>
        <boxGeometry args={[1.65, 0.42, 2.2]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.6} roughness={0.28} />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={`hl${x}`} position={[x, 0.42, 2.32]}>
          <boxGeometry args={[0.32, 0.12, 0.03]} />
          <meshStandardMaterial emissive="#ffffee" emissiveIntensity={3} color="#ffffee" />
        </mesh>
      ))}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`tl${x}`} position={[x, 0.42, -2.32]}>
          <boxGeometry args={[0.28, 0.1, 0.03]} />
          <meshStandardMaterial emissive="#ff2222" emissiveIntensity={2.5} color="#ff2222" />
        </mesh>
      ))}
      <mesh position={[0.4, 0.92, 0.5]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <meshStandardMaterial emissive="#6B2FA0" emissiveIntensity={2} color="#6B2FA0" />
      </mesh>
    </group>
  );
}
