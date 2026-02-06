// Server-Side RNG for Crop Drops
// Per gamesystem.txt section 4: "Seluruh RNG dilakukan di sisi server (Backend) untuk mencegah cheat"

import { DROP_PROBABILITIES, DROP_THRESHOLDS, CROPS, Rarity } from '../../constants';

// Client-side interface for requesting crop drop
export interface CropDropRequest {
  userId: string;
  timestamp: number;
  seed?: string; // Server-generated seed for verification
}

// Response with server-verified result
export interface CropDropResponse {
  success: boolean;
  crop?: {
    name: string;
    rarity: Rarity;
    growthTime: number;
    sellPrice: number;
  };
  seed?: string; // For client-side verification
  error?: string;
}

// Server-side RNG crop selection (deterministic based on seed)
export const serverRollCrop = (request: CropDropRequest): CropDropResponse => {
  try {
    const { userId, timestamp, seed } = request;
    
    // Combine inputs for deterministic randomness
    const seedString = seed || `${userId}-${timestamp}-${Math.random()}`;
    const hash = hashString(seedString);
    
    // Generate random value 0-1 from hash
    const randomValue = (hash >>> 0) / 0xFFFFFFFF;
    
    // Determine rarity based on DROP_THRESHOLDS
    let selectedRarity: Rarity = Rarity.COMMON;
    
    if (randomValue < DROP_THRESHOLDS[Rarity.LEGENDARY]) {
      selectedRarity = Rarity.LEGENDARY;
    } else if (randomValue < DROP_THRESHOLDS[Rarity.EPIC]) {
      selectedRarity = Rarity.EPIC;
    } else if (randomValue < DROP_THRESHOLDS[Rarity.RARE]) {
      selectedRarity = Rarity.RARE;
    } else if (randomValue < DROP_THRESHOLDS[Rarity.UNCOMMON]) {
      selectedRarity = Rarity.UNCOMMON;
    } else {
      selectedRarity = Rarity.COMMON;
    }

    // Select random crop within rarity
    const cropsOfRarity = CROPS.filter(c => c.rarity === selectedRarity);
    const cropIndex = Math.floor(hash >>> 16) % cropsOfRarity.length;
    const selectedCrop = cropsOfRarity[cropIndex];

    return {
      success: true,
      crop: {
        name: selectedCrop.name,
        rarity: selectedCrop.rarity,
        growthTime: selectedCrop.growthTime,
        sellPrice: selectedCrop.sellPrice,
      },
      seed: seedString,
    };
  } catch (error) {
    console.error('Server RNG error:', error);
    return { success: false, error: 'RNG generation failed' };
  }
};

// Simple hash function for seed generation
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Client-side verification (for transparency)
export const verifyCropDrop = (
  serverSeed: string,
  serverRarity: Rarity,
  clientRandom: number
): boolean => {
  // Verify client randomness matches server seed
  const expectedHash = hashString(serverSeed);
  const expectedRandom = (expectedHash >>> 0) / 0xFFFFFFFF;
  
  // Allow small variance for timing
  return Math.abs(expectedRandom - clientRandom) < 0.1;
};

// Get all crops by rarity (for frontend display)
export const getCropsByRarity = (): Record<Rarity, typeof CROPS> => {
  return {
    [Rarity.COMMON]: CROPS.filter(c => c.rarity === Rarity.COMMON),
    [Rarity.UNCOMMON]: CROPS.filter(c => c.rarity === Rarity.UNCOMMON),
    [Rarity.RARE]: CROPS.filter(c => c.rarity === Rarity.RARE),
    [Rarity.EPIC]: CROPS.filter(c => c.rarity === Rarity.EPIC),
    [Rarity.LEGENDARY]: CROPS.filter(c => c.rarity === Rarity.LEGENDARY),
  };
};

// Display-friendly drop rates
export const DROP_RATE_DISPLAY = {
  [Rarity.COMMON]: '10%',
  [Rarity.UNCOMMON]: '6%',
  [Rarity.RARE]: '2%',
  [Rarity.EPIC]: '0.5%',
  [Rarity.LEGENDARY]: '0.1%',
};
