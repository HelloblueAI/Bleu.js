import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, QuadraticBezierLine, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useEffect, useState, useMemo, useRef } from 'react';

interface NeuralConnectionProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  opacity: number;
}

function NeuralConnection({ start, end, opacity }: NeuralConnectionProps) {
  const ref = useRef();
  const [pulsePosition, setPulsePosition] = useState(0);
  
  // Calculate control point for the curved line
  const mid = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    // Add some curve by offsetting on X axis
    midPoint.x += (end.x - start.x) * 0.1;
    return midPoint;
  }, [start, end]);

  useFrame((state, delta) => {
    setPulsePosition((prev) => (prev + delta * 0.5) % 1);
  });

  return (
    <group>
      <QuadraticBezierLine
        start={start}
        end={end}
        mid={mid}
        color="#00e0ff"
        lineWidth={2}
        transparent
        opacity={opacity * 0.8}
        dashed={false}
      />
      {/* Animated pulse along the connection */}
      <mesh
        position={new THREE.Vector3().lerpVectors(start, end, pulsePosition)}
        scale={0.03}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color="#00e0ff"
          transparent
          opacity={0.8 * (1 - pulsePosition)}
        />
      </mesh>
    </group>
  );
}

interface NeuronProps {
  position: [number, number, number];
}

function Neuron({ position }: NeuronProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [scale] = useState(() => THREE.MathUtils.randFloat(0.8, 1.2));

  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(
        scale * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.1) * (hovered ? 1.2 : 1)
      );
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshStandardMaterial
          color="#00e0ff"
          emissive="#00e0ff"
          emissiveIntensity={hovered ? 1 : 0.5}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Glow effect */}
      <mesh scale={1.2}>
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshBasicMaterial
          color="#00e0ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

interface Node {
  position: [number, number, number];
  layer: number;
  connections: number[];
}

function NeuralNetwork() {
  const nodes = useMemo<Node[]>(() => {
    const layers = [4, 6, 8, 6, 4];
    const layerSpacing = 2;
    const verticalSpacing = 1;
    const nodes: Node[] = [];
    const depthVariation = 0.3;

    layers.forEach((layerSize, layerIndex) => {
      const layerOffset = (layerIndex - (layers.length - 1) / 2) * layerSpacing;
      
      for (let i = 0; i < layerSize; i++) {
        const verticalOffset = (i - (layerSize - 1) / 2) * verticalSpacing;
        const randomOffset = {
          x: THREE.MathUtils.randFloatSpread(0.1),
          y: THREE.MathUtils.randFloatSpread(0.1),
          z: THREE.MathUtils.randFloatSpread(depthVariation)
        };
        
        nodes.push({
          position: [
            layerOffset + randomOffset.x,
            verticalOffset + randomOffset.y,
            randomOffset.z
          ],
          layer: layerIndex,
          connections: []
        });
      }
    });

    // Create connections with smart distribution
    let nodeIndex = 0;
    for (let l = 0; l < layers.length - 1; l++) {
      for (let i = 0; i < layers[l]; i++) {
        const currentNode = nodeIndex + i;
        const nextLayerStart = nodeIndex + layers[l];
        const nextLayerEnd = nextLayerStart + layers[l + 1];
        
        // Create connections with varying probabilities
        for (let j = nextLayerStart; j < nextLayerEnd; j++) {
          const probability = Math.sin((j - nextLayerStart) / layers[l + 1] * Math.PI);
          if (Math.random() < probability * 0.8) {
            nodes[currentNode].connections.push(j);
          }
        }
      }
      nodeIndex += layers[l];
    }

    return nodes;
  }, []);

  return (
    <group>
      {/* Neurons */}
      {nodes.map((node, i) => (
        <Neuron
          key={`neuron-${node.layer}-${i}`}
          position={node.position}
        />
      ))}

      {/* Connections */}
      {nodes.map((node, i) => 
        node.connections.map((connectionIndex, j) => {
          const start = new THREE.Vector3(...node.position);
          const end = new THREE.Vector3(...nodes[connectionIndex].position);
          const distance = start.distanceTo(end);
          const opacity = Math.max(0.2, 0.5 - (distance * 0.05));

          return (
            <NeuralConnection
              key={`connection-${node.layer}-${i}-${j}`}
              start={start}
              end={end}
              opacity={opacity}
            />
          );
        })
      )}
    </group>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#00e0ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-[#00e0ff]">
      <p>Failed to load 3D scene</p>
    </div>
  );
}

export default function Scene() {
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setError(true);
      }
    } catch (e) {
      setError(true);
    }
  }, []);

  if (error) {
    return <ErrorFallback />;
  }

  return (
    <div className="fixed inset-0 w-full h-full z-0">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 45 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.15} />
          <pointLight position={[10, 10, 10]} intensity={0.2} color="#00e0ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.1} color="#00e0ff" />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.15}
            maxPolarAngle={Math.PI / 1.8}
            minPolarAngle={Math.PI / 2.2}
          />
          
          <NeuralNetwork />
        </Canvas>
      </Suspense>
    </div>
  );
} 