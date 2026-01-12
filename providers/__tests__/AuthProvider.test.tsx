/**
 * Tests pour AuthProvider
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';

// Mock des dépendances
jest.mock('expo-secure-store');
jest.mock('../../lib/supabase');

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('signIn', () => {
    it('devrait se connecter avec succès', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('221771234567', '1234');
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('devrait gérer les erreurs de connexion', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.signIn('221771234567', 'wrong');
        expect(success).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('signUp', () => {
    it('devrait créer un compte avec succès', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'new@example.com',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.signUp('221771234567', '1234', 'Test User');
        expect(success).toBe(true);
      });
    });

    it('devrait gérer les erreurs d\'inscription', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already exists' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        const success = await result.current.signUp('221771234567', '1234', 'Test User');
        expect(success).toBe(false);
      });
    });
  });

  describe('signOut', () => {
    it('devrait se déconnecter correctement', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userPhone');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userPin');
    });
  });

  describe('Auto-login', () => {
    it('devrait restaurer la session automatiquement', async () => {
      const mockPhone = '221771234567';
      const mockPin = '1234';
      const mockUser = { id: 'user-789', email: 'auto@example.com' };
      const mockSession = { user: mockUser, access_token: 'token-789' };

      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(mockPhone)
        .mockResolvedValueOnce(mockPin);

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      }, { timeout: 3000 });
    });

    it('ne devrait pas auto-login si pas de credentials', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });
});
