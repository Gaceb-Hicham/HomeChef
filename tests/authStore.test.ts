import { useAuthStore } from '@/stores/authStore';

/**
 * Unit tests for AuthStore — verifiable without a real backend.
 * Run with: npx jest tests/authStore.test.ts
 */

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      isOnboarded: false,
      selectedRole: null,
      hasSeenOnboarding: false,
      isDemoMode: false,
    });
  });

  describe('demoLogin', () => {
    it('should set customer demo profile', () => {
      useAuthStore.getState().demoLogin('customer');

      const state = useAuthStore.getState();
      expect(state.isDemoMode).toBe(true);
      expect(state.profile).not.toBeNull();
      expect(state.profile?.role).toBe('customer');
      expect(state.profile?.full_name).toBe('Sarah Foodie');
      expect(state.selectedRole).toBe('customer');
      expect(state.isLoading).toBe(false);
    });

    it('should set chef demo profile', () => {
      useAuthStore.getState().demoLogin('chef');

      const state = useAuthStore.getState();
      expect(state.isDemoMode).toBe(true);
      expect(state.profile?.role).toBe('chef');
      expect(state.profile?.full_name).toBe('Chef Ahmed');
      expect(state.selectedRole).toBe('chef');
    });
  });

  describe('signOut', () => {
    it('should clear demo state on sign out', async () => {
      useAuthStore.getState().demoLogin('customer');
      expect(useAuthStore.getState().isDemoMode).toBe(true);

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.isDemoMode).toBe(false);
      expect(state.profile).toBeNull();
      expect(state.session).toBeNull();
    });
  });

  describe('setters', () => {
    it('should set selectedRole', () => {
      useAuthStore.getState().setSelectedRole('chef');
      expect(useAuthStore.getState().selectedRole).toBe('chef');
    });

    it('should set hasSeenOnboarding', () => {
      useAuthStore.getState().setHasSeenOnboarding(true);
      expect(useAuthStore.getState().hasSeenOnboarding).toBe(true);
    });

    it('should set isLoading', () => {
      useAuthStore.getState().setIsLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
