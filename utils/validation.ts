import { Plan } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validators = {
  withdrawAmount: (amount: string, balance: number, plan: Plan): ValidationResult => {
    const errors: string[] = [];
    const parsedAmount = parseInt(amount.replace(/,/g, '')) || 0;

    if (!amount.trim()) {
      errors.push('Amount is required');
    } else if (parsedAmount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (parsedAmount > balance) {
      errors.push('Insufficient balance');
    } else {
      const minThreshold = plan === Plan.FREE ? 100 : 1000;
      if (parsedAmount < minThreshold) {
        errors.push(`Minimum withdrawal is ${minThreshold.toLocaleString()} PTS`);
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  email: (email: string): ValidationResult => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    return { isValid: errors.length === 0, errors };
  },

  tonAddress: (address: string): ValidationResult => {
    const errors: string[] = [];

    if (!address.trim()) {
      errors.push('TON wallet address is required');
    } else if (address.length < 10) {
      errors.push('Invalid TON wallet address');
    }

    return { isValid: errors.length === 0, errors };
  },

  username: (username: string): ValidationResult => {
    const errors: string[] = [];

    if (!username.trim()) {
      errors.push('Username is required');
    } else if (username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (username.length > 20) {
      errors.push('Username must be less than 20 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    return { isValid: errors.length === 0, errors };
  },

  password: (password: string): ValidationResult => {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    } else if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Format helpers
export const formatters = {
  currency: (amount: number): string => {
    return amount.toLocaleString('en-US');
  },

  trimSpaces: (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
  },

  maxLength: (value: string, max: number): string => {
    return value.slice(0, max);
  },

  numbersOnly: (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  },
};
