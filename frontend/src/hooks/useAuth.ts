import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { STORAGE_KEYS } from '../utils/constants';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface UseAuthProviderResult extends AuthContextType {
  AuthProvider: React.FC<{ children: React.ReactNode }>;
}

export function useAuthProvider(): UseAuthProviderResult {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(STORAGE_KEYS.AUTH),
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (token) {
        try {
          const user = await fetchUserProfile(token);
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem(STORAGE_KEYS.AUTH);
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const { token, user } = await response.json();
      localStorage.setItem(STORAGE_KEYS.AUTH, token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Redirect to previous page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

      toast.success('Successfully logged in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  }, [navigate, location]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      navigate('/login');
      toast.success('Successfully logged out');
    }
  }, [navigate, state.token]);

  // Register
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const { token, user } = await response.json();
      localStorage.setItem(STORAGE_KEYS.AUTH, token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      navigate('/dashboard');
      toast.success('Successfully registered');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  }, [navigate]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Password reset failed');
      throw error;
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const updatedUser = await response.json();
      setState(prev => ({
        ...prev,
        user: { ...prev.user, ...updatedUser } as User,
      }));

      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Profile update failed');
      throw error;
    }
  }, [state.token]);

  // Auth provider component
  const AuthProvider: React.FC<{ children: React.ReactNode }> = useCallback(
    ({ children }) => (
      <AuthContext.Provider
        value={{
          ...state,
          login,
          logout,
          register,
          resetPassword,
          updateProfile,
        }}
      >
        {children}
      </AuthContext.Provider>
    ),
    [state, login, logout, register, resetPassword, updateProfile]
  );

  return {
    ...state,
    login,
    logout,
    register,
    resetPassword,
    updateProfile,
    AuthProvider,
  };
}

// Helper function to fetch user profile
async function fetchUserProfile(token: string): Promise<User> {
  const response = await fetch('/api/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}