import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to global mocks', () => {
    expect(window.localStorage).toBeDefined();
    expect(window.sessionStorage).toBeDefined();
    expect(window.matchMedia).toBeDefined();
  });

  it('should mock localStorage correctly', () => {
    window.localStorage.setItem('test', 'value');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('test', 'value');
  });
});