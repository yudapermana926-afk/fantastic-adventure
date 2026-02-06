// Withdraw API Utilities
// Per gamesystem.txt section 9: API POST /api/withdraw

import { EXCHANGE_RATE, WITHDRAW_CONFIG } from '../../constants';

export interface WithdrawRequest {
  userId: string;
  amount: number; // PTS
  method: 'FAUCETPAY' | 'TON';
  destination: string; // Email or wallet address
}

export interface WithdrawResponse {
  success: boolean;
  transactionId?: string;
  usdtAmount?: number;
  fee?: number;
  message?: string;
}

// Validate withdrawal request
export const validateWithdrawRequest = (
  amount: number,
  balance: number,
  hasWithdrawn: boolean,
  method: string,
  destination: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check balance
  if (amount > balance) {
    errors.push('Insufficient balance');
  }

  // Check minimum amount
  const minAmount = hasWithdrawn 
    ? WITHDRAW_CONFIG.minAmountExistingUser 
    : WITHDRAW_CONFIG.minAmountNewUser;
  
  if (amount < minAmount) {
    errors.push(`Minimum withdrawal is ${minAmount} PTS (${(minAmount / EXCHANGE_RATE).toFixed(2)} USDT)`);
  }

  // Validate destination based on method
  if (method === 'FAUCETPAY') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!destination || !emailRegex.test(destination)) {
      errors.push('Invalid FaucetPay email address');
    }
  } else if (method === 'TON') {
    if (!destination || destination.length < 10) {
      errors.push('Invalid TON wallet address');
    }
  } else {
    errors.push('Invalid withdrawal method');
  }

  return { valid: errors.length === 0, errors };
};

// Calculate USDT value from PTS
export const ptsToUsdt = (pts: number, method: 'FAUCETPAY' | 'TON'): number => {
  const fee = method === 'TON' ? WITHDRAW_CONFIG.feeTonWallet : WITHDRAW_CONFIG.feeFaucetPay;
  return (pts / EXCHANGE_RATE) * (1 - fee);
};

// Calculate fee amount
export const calculateFee = (pts: number, method: 'FAUCETPAY' | 'TON'): number => {
  const fee = method === 'TON' ? WITHDRAW_CONFIG.feeTonWallet : WITHDRAW_CONFIG.feeFaucetPay;
  return Math.floor(pts * fee);
};

// Format transaction for Firestore
export interface WithdrawTransaction {
  id: string;
  userId: string;
  amountPts: number;
  amountUsdt: number;
  feePts: number;
  method: 'FAUCETPAY' | 'TON';
  destination: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
  processedAt?: Date;
  txHash?: string;
}

export const createWithdrawTransaction = (
  userId: string,
  amount: number,
  method: 'FAUCETPAY' | 'TON',
  destination: string
): WithdrawTransaction => {
  const fee = calculateFee(amount, method);
  const usdtAmount = ptsToUsdt(amount, method);
  
  return {
    id: `wd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amountPts: amount,
    amountUsdt: usdtAmount,
    feePts: fee,
    method,
    destination,
    status: 'PENDING',
    createdAt: new Date(),
  };
};

// USDT rate display helper
export const formatUsdtValue = (pts: number, method: 'FAUCETPAY' | 'TON'): string => {
  const usdt = ptsToUsdt(pts, method);
  return `${usdt.toFixed(4)} USDT`;
};
