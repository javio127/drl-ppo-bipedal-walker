import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { predictAction, generateRandomState } from '../utils/modelUtils';

interface WalkerRendererProps {
  model: any;
  isRunning: boolean;
  onStateUpdate: (updates: any) => void;
}

interface WalkerState {
  position: { x: number; y: number };
  hullAngle: number;
  joints: number[];
  velocity: { x: number; y: number };
  isGrounded: boolean[];
}

const WalkerRenderer: React.FC<WalkerRendererProps> = ({ model, isRunning, onStateUpdate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationIdRef = useRef<number>();
  
  const [walkerState, setWalkerState] = useState<WalkerState>({
    position: { x: 0, y: 2 },
    hullAngle: 0,
    joints: [0, 0, 0, 0],
    velocity: { x: 0, y: 0 },
    isGrounded: [false, false]
  });

  const [currentState, setCurrentState] = useState<number[]>(generateRandomState());
  const [stepCount, setStepCount] = useState(0);
  const [totalReward, setTotalReward] = useState(0);

  // Three.js objects
  const walkerGroupRef = useRef<THREE.Group>();
  const hullRef = useRef<THREE.Mesh>();
  const legRefs = useRef<THREE.Mesh[]>([]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 1);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create walker
    createWalker(scene);

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const createWalker = (scene: THREE.Scene) => {
    const walkerGroup = new THREE.Group();
    walkerGroupRef.current = walkerGroup;

    // Hull (main body)
    const hullGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.3);
    const hullMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hullRef.current = hull;
    walkerGroup.add(hull);

    // Legs (simplified as cylinders)
    legRefs.current = [];
    for (let i = 0; i < 4; i++) {
      const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5);
      const legMaterial = new THREE.MeshLambertMaterial({ 
        color: i < 2 ? 0x2196F3 : 0xFF9800 
      });
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.castShadow = true;
      legRefs.current.push(leg);
      walkerGroup.add(leg);
    }

    scene.add(walkerGroup);
  };

  const updateWalkerVisuals = () => {
    if (!walkerGroupRef.current || !hullRef.current) return;

    // Update walker position
    walkerGroupRef.current.position.set(
      walkerState.position.x,
      walkerState.position.y,
      0
    );

    // Update hull rotation
    hullRef.current.rotation.z = walkerState.hullAngle;

    // Update leg positions and rotations (simplified)
    legRefs.current.forEach((leg, index) => {
      if (leg) {
        const offsetX = (index % 2 === 0) ? -0.5 : 0.5;
        const offsetY = (index < 2) ? 0.3 : -0.3;
        
        leg.position.set(offsetX, offsetY - 0.75, 0);
        leg.rotation.z = walkerState.joints[index] * 0.5; // Scale joint angles
        
        // Color feedback based on ground contact
        if (index < 2) {
          const material = leg.material as THREE.MeshLambertMaterial;
          material.color.setHex(walkerState.isGrounded[index] ? 0x4CAF50 : 0x2196F3);
        }
      }
    });
  };

  const simulationStep = async () => {
    if (!model || !isRunning) return;

    try {
      // Get action from model
      const actions = await predictAction(currentState);
      
      // Simulate simple physics (this is a simplified simulation)
      const newState = [...currentState];
      
      // Apply actions to joints (simplified)
      for (let i = 0; i < 4; i++) {
        newState[4 + i] += actions[i] * 0.1; // Update joint angles
      }
      
      // Update position based on velocity
      newState[2] = Math.max(0, newState[2] + actions[0] * 0.05); // Forward velocity
      
      // Calculate reward (simplified - forward movement)
      const forwardReward = Math.max(0, newState[2] * 10);
      const stabilityReward = Math.max(0, 10 - Math.abs(newState[0]) * 50); // Hull angle stability
      const stepReward = forwardReward + stabilityReward - 1; // Small step penalty
      
      // Update walker state for visualization
      setWalkerState({
        position: { 
          x: walkerState.position.x + newState[2] * 0.1, 
          y: 2 + newState[3] * 0.1 
        },
        hullAngle: newState[0],
        joints: actions,
        velocity: { x: newState[2], y: newState[3] },
        isGrounded: [newState[12] > 0.5, newState[13] > 0.5]
      });

      setCurrentState(newState);
      setStepCount(prev => prev + 1);
      setTotalReward(prev => prev + stepReward);

      // Update parent component
      onStateUpdate({
        reward: Math.round(totalReward),
        steps: stepCount + 1,
        timeElapsed: (stepCount + 1) / 10 // Assume 10 FPS
      });

    } catch (error) {
      console.error('Simulation step error:', error);
    }
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (isRunning) {
        simulationStep();
      }
      
      updateWalkerVisuals();
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isRunning, model, walkerState, currentState, stepCount, totalReward]);

  return (
    <div className="walker-renderer">
      <div className="renderer-container" ref={mountRef} />
      <div className="renderer-info">
        <p>Hull Angle: {walkerState.hullAngle.toFixed(3)}</p>
        <p>Velocity: {walkerState.velocity.x.toFixed(3)}</p>
        <p>Ground Contact: L:{walkerState.isGrounded[0] ? '✓' : '✗'} R:{walkerState.isGrounded[1] ? '✓' : '✗'}</p>
      </div>
    </div>
  );
};

export default WalkerRenderer; 