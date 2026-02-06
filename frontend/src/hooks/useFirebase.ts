// Firebase Service Hooks for Frontend
// Bridge between React frontend and Firebase backend

import { useState, useEffect, useCallback } from 'react';
import { 
  getAuthResult, 
  getCurrentUser, 
  getTelegramInitData, 
  validateTelegramInitData,
  isMobilePlatform,
  getPlatformInfo,
  TelegramInitData 
} from '../backend/utils/telegram-auth';

// Auth state
export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  error: string | null;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    userId: null,
    username: null,
    error: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if mobile platform (security requirement)
        if (!isMobilePlatform()) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Access denied: Desktop platform not supported',
          }));
          return;
        }

        // Get Telegram user
        const user = getCurrentUser();
        if (user) {
          setState({
            isLoading: false,
            isAuthenticated: true,
            userId: user.id,
            username: user.username,
            error: null,
          });
          return;
        }

        // Try to validate initData from URL
        const initData = getTelegramInitData();
        if (initData) {
          const result = validateTelegramInitData(initData);
          if (result.valid) {
            setState({
              isLoading: false,
              isAuthenticated: true,
              userId: result.userId || null,
              username: result.username || null,
              error: null,
            });
            return;
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: result.error || 'Authentication failed',
            }));
            return;
          }
        }

        // No auth data found
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No authentication data',
        }));
      } catch (error) {
        console.error('Auth init error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication error',
        }));
      }
    };

    initAuth();
  }, []);

  return state;
};

// Platform info hook
export const usePlatform = () => {
  const [platform, setPlatform] = useState(getPlatformInfo());

  useEffect(() => {
    const updatePlatform = () => {
      setPlatform(getPlatformInfo());
    };
    
    // Listen for Telegram platform changes
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp) {
      webApp.onEvent?.('viewportChanged', updatePlatform);
    }
    
    return () => {
      if (webApp) {
        webApp.offEvent?.('viewportChanged', updatePlatform);
      }
    };
  }, []);

  return platform;
};

// Game state sync hook (for real-time updates)
export const useGameState = (userId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);

  const refreshState = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // In production, this would fetch from Firestore
      // For now, use local storage as fallback
      const savedState = localStorage.getItem(`game_state_${userId}`);
      if (savedState) {
        setGameState(JSON.parse(savedState));
      }
    } catch (err) {
      setError('Failed to load game state');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  return { isLoading, error, gameState, refreshState };
};

// Initialize game data for new users
export const useInitGame = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initGame = useCallback(async (userId: string, username: string, referralId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for referral in URL
      const urlParams = new URLSearchParams(window.location.search);
      const refId = referralId || urlParams.get('startapp') || undefined;

      // Create initial game state
      const initialState = {
        id: userId,
        username,
        plan: 'FREE',
        balance: 0,
        storageUsed: 0,
        storageMax: 100,
        extraStorage: 0,
        xp: 0,
        totalHarvests: 0,
        totalSales: 0,
        slots: {
          1: { id: 1, status: 'EMPTY', crop: null, plantedAt: null },
        },
        purchasedSlots: [],
        inventory: {},
        activeBuffs: {},
        lastSpinTime: 0,
        lastDailyReset: Date.now(),
        referralId: refId,
        referrals: [],
        walletAddress: null,
        walletEmail: null,
        hasWithdrawn: false,
        hasYieldBooster: false,
        createdAt: Date.now(),
      };

      // Save to local storage (would be Firestore in production)
      localStorage.setItem(`game_state_${userId}`, JSON.stringify(initialState));

      return initialState;
    } catch (err) {
      setError('Failed to initialize game');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, initGame };
};
