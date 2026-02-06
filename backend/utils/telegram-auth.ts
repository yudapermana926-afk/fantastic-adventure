// Telegram WebApp Authentication
// Per gamesystem.txt section 7.1: Validasi initDataUnsafe (HMAC-SHA256)

import { createHmac, timingSafeEqual } from 'crypto';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || 'demo-bot-token';

// Verify Telegram initData
export interface TelegramInitData {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  auth_date: number;
  hash: string;
}

export interface AuthResult {
  valid: boolean;
  userId?: string;
  username?: string;
  error?: string;
}

// Validate Telegram initData (HMAC-SHA256 per security spec)
export const validateTelegramInitData = (initData: string): AuthResult => {
  try {
    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = params.get('auth_date');
    
    if (!hash || !authDate) {
      return { valid: false, error: 'Missing hash or auth_date' };
    }

    // Remove hash from params for verification
    params.delete('hash');
    
    // Convert to array of key=value, sort alphabetically, join with \n
    const dataCheckString = Array.from(params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');

    // Calculate expected hash
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const expectedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes using timingSafeEqual to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(hash, 'hex'), expectedHash)) {
      return { valid: false, error: 'Invalid hash signature' };
    }

    // Check auth_date (should be within last 24 hours)
    const authTime = parseInt(authDate) * 1000;
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - authTime > maxAge) {
      return { valid: false, error: 'Init data expired' };
    }

    // Parse user data
    const userData = params.get('user');
    if (!userData) {
      return { valid: false, error: 'No user data' };
    }

    const user = JSON.parse(decodeURIComponent(userData));
    
    return {
      valid: true,
      userId: String(user.id),
      username: user.username || user.first_name,
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { valid: false, error: 'Parse error' };
  }
};

// Get initData from Telegram WebApp
export const getTelegramInitData = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get from WebApp interface
  const webApp = (window as any).Telegram?.WebApp;
  if (webApp?.initData) {
    return webApp.initData;
  }
  
  // Fallback to URL params (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tgWebAppData');
};

// Get current user from Telegram
export const getCurrentUser = (): { id: string; username: string } | null => {
  if (typeof window === 'undefined') return null;
  
  const webApp = (window as any).Telegram?.WebApp;
  if (webApp?.initDataUnsafe?.user) {
    const user = webApp.initDataUnsafe.user;
    return {
      id: String(user.id),
      username: user.username || user.first_name,
    };
  }
  
  return null;
};

// Check if running on mobile (per gamesystem.txt section 9.4)
export const isMobilePlatform = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check Telegram WebApp platform
  const webApp = (window as any).Telegram?.WebApp;
  if (webApp?.platform) {
    const mobilePlatforms = ['android', 'ios', 'macos'];
    return mobilePlatforms.includes(webApp.platform.toLowerCase());
  }
  
  return isMobile;
};

// Platform detection for logging
export const getPlatformInfo = (): { platform: string; isMobile: boolean; version?: string } => {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', isMobile: false };
  }
  
  const webApp = (window as any).Telegram?.WebApp;
  return {
    platform: webApp?.platform || 'browser',
    isMobile: isMobilePlatform(),
    version: webApp?.version,
  };
};
