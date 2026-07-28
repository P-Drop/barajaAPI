import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';

it('useAuth fuera de AuthProvider lanza', () => {
  expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
});
