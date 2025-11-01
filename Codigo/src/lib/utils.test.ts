import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('handles conditional values', () => {
    const active = true;
    expect(cn('base', active && 'on')).toBe('base on');
  });
  it('deduplicates tailwind classes with conflicts', () => {
    expect(cn('px-2 px-4')).toBe('px-4');
  });
});