import { vi } from 'vitest';

global.navigator = {
  vibrate: vi.fn(),
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
} as any;

global.window = {
  confirm: vi.fn(),
  alert: vi.fn(),
} as any;

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

vi.useFakeTimers();
