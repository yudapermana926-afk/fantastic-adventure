// Backend Module Exports
// Per gamesystem.txt: Firebase Firestore + Serverless Functions

// Firebase Configuration
export * from './firebase/config';

// Backend Utilities
export * from './utils/telegram-auth';
export * from './utils/server-rng';
export * from './utils/withdraw';

// API Endpoints (for Vercel Serverless Functions)
// These would be separate files in /api/ directory

/*
  Vercel Serverless Functions Structure:
  
  /api/
  ├── auth/
  │   └── login.ts         # POST /api/auth/login
  ├── user/
  │   ├── get.ts          # GET /api/user/get
  │   └── update.ts       # POST /api/user/update
  ├── game/
  │   ├── plant.ts        # POST /api/game/plant
  │   ├── harvest.ts      # POST /api/game/harvest
  │   └── spin.ts         # POST /api/game/spin
  ├── market/
  │   ├── sell.ts         # POST /api/market/sell
  │   └── buy.ts          # POST /api/market/buy
  ├── withdraw/
  │   └── request.ts      # POST /api/withdraw/request
  └── affiliate/
      └── stats.ts         # GET /api/affiliate/stats
*/

// Frontend hooks for backend communication
export { useAuth, usePlatform, useGameState, useInitGame } from '../frontend/src/hooks/useFirebase';
