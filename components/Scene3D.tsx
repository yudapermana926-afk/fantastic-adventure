import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, ContactShadows, useCursor, Float } from '@react-three/drei';
import * as THREE from 'three';
import { SlotStatus, FarmSlot, CropConfig, CropData } from '../types';
import { PLAN_CONFIG, CROPS, RARITY_COLORS } from '../constants';
import { Clock, Lock, ShoppingCart } from 'lucide-react';

// --- Harvest Particle Effect ---
const HarvestParticle = ({ startPos, onComplete }: { startPos: [number, number, number], onComplete: () => void }) => {
  const meshRef = useRef<any>(null);
  const targetPos = new THREE.Vector3(0, 1.5, -2.5); // Barn position updated to -2.5
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (progress >= 1) {
      onComplete();
      return;
    }

    const newProgress = progress + delta * 2; // Speed
    setProgress(newProgress);

    if (meshRef.current) {
      const p = Math.min(newProgress, 1);
      const currentPos = new THREE.Vector3().lerpVectors(new THREE.Vector3(...startPos), targetPos, p);
      currentPos.y += Math.sin(p * Math.PI) * 2; 
      
      meshRef.current.position.copy(currentPos);
      meshRef.current.rotation.x += delta * 5;
      meshRef.current.rotation.y += delta * 5;
      
      const scale = 1 - p * 0.5;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef} position={startPos}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#FFD700" emissive="#FFA000" emissiveIntensity={0.5} />
    </mesh>
  );
};

// --- 3D Barn ---
const Barn = ({ onClick, storageUsed, storageMax }: { onClick: () => void, storageUsed: number, storageMax: number }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);
  
  const isInfinite = storageMax === Infinity;
  const percentage = isInfinite ? 0 : (storageUsed / storageMax) * 100;
  
  // Color scheme: Green → Yellow (75%) → Red (90%)
  const barColor = percentage >= 90 ? '#EF4444' : (percentage >= 75 ? '#FACC15' : '#4ADE80');
  const isNearFull = percentage >= 90 && !isInfinite;
  const isFull = percentage >= 100 && !isInfinite;

  return (
    <group 
      position={[0, 1.5, -2.5]}
      scale={1.2}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 2, 2]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0, 2.2, 1.5, 4]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      {/* Door */}
      <mesh position={[0, -0.2, 1.01]}>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      
      {/* Critical Warning Label */}
      {isNearFull && (
        <Html position={[0, 3.2, 0]} center>
          <div className="bg-red-500 text-white px-3 py-1 rounded-full font-black text-xs animate-pulse border-2 border-white shadow-lg">
            ⚠️ STORAGE CRITICAL
          </div>
        </Html>
      )}
      
      {/* Storage Bar (Floating above barn) */}
      <Html position={[0, 2.5, 0]} center transform sprite zIndexRange={[50, 0]}>
          <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
              <div className={`font-black text-white text-[12px] drop-shadow-md whitespace-nowrap ${isNearFull ? 'text-red-300 animate-pulse' : ''}`}>
                 Storage: {isInfinite ? '∞' : `${storageUsed}/${storageMax}`}
              </div>
              {!isInfinite && (
                  <div className={`p-0.5 rounded-full border border-black/20 w-32 ${isNearFull ? 'bg-red-900/50' : 'bg-black/50'}`}>
                     <div className={`h-3 rounded-full overflow-hidden relative ${isNearFull ? 'bg-red-900' : 'bg-gray-800'}`}>
                         <div 
                             className={`h-full transition-all duration-500 ease-out rounded-full ${isNearFull ? 'animate-pulse' : ''}`}
                             style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }} 
                         />
                     </div>
                  </div>
              )}
          </div>
      </Html>
    </group>
  );
};

// --- Crop 3D ---
const Crop3D = ({ crop, status, progress }: { crop: CropData; status: SlotStatus; progress: number }) => {
  const stage = progress >= 1 ? 3 : (progress >= 0.3 ? 2 : 1);
  const cropConfig = CROPS.find(c => c.name === crop.name);
  const cropColor = cropConfig?.color || '#4CAF50';

  return (
    <group position={[0, 0, 0]}>
        {stage === 1 && (
            <group position={[0, 0.2, 0]}>
                {/* Sprout 1 */}
                <mesh position={[0.2, 0, 0.2]} rotation={[0,1,0]}><cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color="#81C784" /></mesh>
                <mesh position={[0.2, 0.1, 0.2]} rotation={[0.5,0,0]}><planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#4CAF50" side={THREE.DoubleSide} /></mesh>
                
                {/* Sprout 2 */}
                <mesh position={[-0.2, 0, -0.2]} rotation={[0,2,0]}><cylinderGeometry args={[0.02, 0.02, 0.2]} /><meshStandardMaterial color="#81C784" /></mesh>
                <mesh position={[-0.2, 0.1, -0.2]} rotation={[0.5,0,0]}><planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#4CAF50" side={THREE.DoubleSide} /></mesh>
            </group>
        )}
        {stage === 2 && (
            <group position={[0, 0.2, 0]}>
                <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.1, 0.08, 0.6]} /><meshStandardMaterial color="#66BB6A" /></mesh>
                <mesh position={[0.1, 0.2, 0]} rotation={[0,0,-0.5]}><sphereGeometry args={[0.15, 8, 8]} scale={[1, 0.5, 1]} /><meshStandardMaterial color="#2E7D32" /></mesh>
            </group>
        )}
        {stage === 3 && (
            <group position={[0, 0.3, 0]}>
                 {/* Main stalk cluster */}
                 <mesh position={[0.1, 0, 0.1]}><cylinderGeometry args={[0.05, 0.05, 1]} /><meshStandardMaterial color="#4CAF50" /></mesh>
                 <mesh position={[-0.1, 0, -0.1]}><cylinderGeometry args={[0.05, 0.05, 0.9]} /><meshStandardMaterial color="#4CAF50" /></mesh>
                 <mesh position={[-0.1, 0, 0.1]}><cylinderGeometry args={[0.05, 0.05, 0.8]} /><meshStandardMaterial color="#4CAF50" /></mesh>
                 
                 {/* Product */}
                 <Float speed={2} rotationIntensity={0.2} floatIntensity={0.1}>
                    <mesh position={[0, 0.5, 0]} castShadow><sphereGeometry args={[0.3, 16, 16]} scale={[1, 1.5, 1]} /><meshStandardMaterial color={cropColor} roughness={0.3} /></mesh>
                 </Float>
            </group>
        )}
    </group>
  );
};

// --- 3D Plot ---
const Plot3D = ({ slot, onInteract, isStorageFull }: { slot: FarmSlot; onInteract: (id: number) => void, isStorageFull: boolean }) => {
  const [hovered, setHover] = useState(false);
  useCursor(hovered);
  
  let progress = 0;
  let timeLeft = 0;
  if (slot.status === SlotStatus.GROWING && slot.plantedAt && slot.crop) {
    const elapsed = (Date.now() - slot.plantedAt) / 1000;
    progress = Math.min(elapsed / slot.crop.growthTime, 1);
    timeLeft = Math.max(0, Math.ceil(slot.crop.growthTime - elapsed));
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine Slot Status Visuals
  const isDisabled = slot.status === SlotStatus.DISABLED;
  const isLockedShop = slot.status === SlotStatus.LOCKED_SHOP;
  const isGrowing = slot.status === SlotStatus.GROWING;
  const isReady = slot.status === SlotStatus.READY;
  
  // Plot number for display
  const plotNumber = slot.id;

  return (
    <group 
        onClick={(e) => { e.stopPropagation(); onInteract(slot.id); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
    >
      {/* Hex Base */}
      <mesh receiveShadow castShadow rotation={[0, Math.PI/6, 0]}>
        <cylinderGeometry args={[1, 1, 0.2, 6]} />
        <meshStandardMaterial 
            color={isDisabled ? "#1a1a1a" : isLockedShop ? "#3E2723" : "#8D6E63"} 
            emissive={hovered ? "#5D4037" : "#000000"} 
            roughness={1} 
        />
      </mesh>
      
      {/* Hex Rim */}
      <mesh position={[0, 0.11, 0]} rotation={[0, Math.PI/6, 0]}>
         <cylinderGeometry args={[1.05, 1.05, 0.05, 6]} />
         <meshStandardMaterial color={isDisabled ? "#333333" : isLockedShop ? "#5D4037" : "#A1887F"} />
      </mesh>

      {/* Soil (Inner) */}
      {!isDisabled && !isLockedShop && (
         <mesh position={[0, 0.11, 0]} rotation={[0, Math.PI/6, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.06, 6]} />
            <meshStandardMaterial color="#5D4037" />
         </mesh>
      )}

      {/* Disabled Visuals (Plan Lock) */}
      {isDisabled && (
          <Float speed={1} floatIntensity={0.3}>
              <Html position={[0, 0.5, 0]} center pointerEvents="none">
                 <div className="flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-2 rounded-lg border-2 border-gray-600 shadow-lg opacity-75">
                     <Lock size={20} />
                     <span className="text-[10px] font-bold mt-1">PLAN</span>
                 </div>
              </Html>
          </Float>
      )}

      {/* Locked Shop Visuals (Purchasable) */}
      {isLockedShop && (
          <Float speed={2} floatIntensity={0.5}>
              <Html position={[0, 0.5, 0]} center pointerEvents="none">
                 <div className="flex flex-col items-center justify-center bg-amber-600 text-white p-2 rounded-lg border-2 border-white shadow-lg">
                     <ShoppingCart size={20} />
                     <span className="text-[10px] font-bold mt-1">BUY</span>
                 </div>
              </Html>
          </Float>
      )}

      {/* Content */}
      {!isDisabled && !isLockedShop && (
        <>
            {slot.status === SlotStatus.GROWING && slot.crop && <Crop3D crop={slot.crop} status={slot.status} progress={progress} />}
            
            {/* AD Bubble when READY */}
            {slot.status === SlotStatus.READY && slot.crop && (
                <>
                    <Crop3D crop={slot.crop} status={slot.status} progress={1} />
                    {!isStorageFull && (
                        <Float speed={3} rotationIntensity={0.1} floatIntensity={0.5} floatingRange={[0.1, 0.3]}>
                            <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
                                <div className="relative group cursor-pointer animate-bounce">
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl relative z-10">
                                        <span className="font-black text-white text-lg drop-shadow-md tracking-wider">AD</span>
                                    </div>
                                    {/* Shine effect */}
                                    <div className="absolute top-0 right-0 w-6 h-6 bg-white/50 rounded-full blur-sm z-20"></div>
                                    {/* Glow */}
                                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                                </div>
                            </Html>
                        </Float>
                    )}
                    
                    {/* HARVEST! Label */}
                    <Html position={[0, 2.5, 0]} center zIndexRange={[90, 0]}>
                        <div className="bg-green-500 text-white px-3 py-1 rounded-full font-black text-xs border-2 border-white shadow-lg animate-pulse">
                            HARVEST!
                        </div>
                    </Html>
                </>
            )}

            {/* Timer Pill when GROWING */}
            {slot.status === SlotStatus.GROWING && (
                <Html position={[0, 1.5, 0]} center pointerEvents="none">
                    <div className="bg-gray-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-lg">
                        <Clock size={12} className="text-white" />
                        <span className="font-bold text-xs font-mono">{formatTime(timeLeft)}</span>
                    </div>
                </Html>
            )}
            
            {/* Progress Bar when GROWING */}
            {slot.status === SlotStatus.GROWING && (
                <Html position={[0, 1.2, 0]} center pointerEvents="none">
                    <div className="w-16 bg-gray-800 rounded-full h-1.5 border border-white/10">
                        <div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(progress * 100, 100)}%` }}
                        />
                    </div>
                </Html>
            )}
        </>
      )}
    </group>
  );
};

interface SceneProps {
  slots: FarmSlot[];
  activePage: number;
  user: any;
  onInteract: (id: number) => void;
  onBarnClick: () => void;
}

export const GameScene: React.FC<SceneProps> = ({ slots, activePage, user, onInteract, onBarnClick }) => {
  const positions = [[-1.1, -1], [1.1, -1], [-1.1, 1], [1.1, 1]];
  const [particles, setParticles] = useState<{id: string, startPos: [number, number, number]}[]>([]);
  const prevSlotsRef = useRef(slots);

  useEffect(() => {
    slots.forEach((slot, idx) => {
      const prevSlot = prevSlotsRef.current.find(s => s.id === slot.id);
      if (prevSlot && prevSlot.status === SlotStatus.READY && slot.status === SlotStatus.EMPTY) {
         const pageOffset = Math.floor((slot.id - 1) / 4) + 1;
         if (pageOffset === activePage) {
             const localIdx = (slot.id - 1) % 4;
             const pos = positions[localIdx];
             const startPos: [number, number, number] = [pos[0], 0, pos[1] + 1]; 
             setParticles(prev => [...prev, { id: Math.random().toString(), startPos }]);
         }
      }
    });
    prevSlotsRef.current = slots;
  }, [slots, activePage]);

  const currentSlots = useMemo(() => {
    const startIndex = (activePage - 1) * 4;
    return slots.slice(startIndex, startIndex + 4);
  }, [slots, activePage]);

  const isStorageFull = user.storageMax !== Infinity && user.storageUsed >= (user.storageMax + (user.extraStorage || 0));

  return (
    <div className="absolute inset-0 z-0 bg-[#7CB342]">
      <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
        <color attach="background" args={['#7CB342']} />
        <fog attach="fog" args={['#7CB342', 12, 25]} />
        <ambientLight intensity={0.8} color="#FFFDE7" />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} color="#FFF9C4" />

        <Barn onClick={onBarnClick} storageUsed={user.storageUsed} storageMax={user.storageMax + (user.extraStorage || 0)} />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#7CB342" />
        </mesh>
        
        {/* Hills background effect */}
        <mesh position={[-10, -2, -10]} rotation={[-Math.PI/2, 0, 0]}>
             <sphereGeometry args={[8, 16, 16]} />
             <meshStandardMaterial color="#689F38" />
        </mesh>
         <mesh position={[10, -2, -15]} rotation={[-Math.PI/2, 0, 0]}>
             <sphereGeometry args={[12, 16, 16]} />
             <meshStandardMaterial color="#558B2F" />
        </mesh>

        <group position={[0, 0, 1]}>
            {currentSlots.map((slot, index) => {
                const pos = positions[index] || [0,0];
                return (
                    <group key={slot.id} position={[pos[0], 0, pos[1]]}>
                        <Plot3D 
                            slot={slot} 
                            onInteract={onInteract} 
                            isStorageFull={isStorageFull}
                        />
                    </group>
                );
            })}
        </group>
        
        {particles.map(p => (
            <HarvestParticle 
                key={p.id} 
                startPos={p.startPos} 
                onComplete={() => setParticles(prev => prev.filter(particle => particle.id !== p.id))} 
            />
        ))}

        <ContactShadows resolution={512} scale={20} blur={2} opacity={0.3} color="#1a2e05" />
      </Canvas>
    </div>
  );
};
