import api from './api';
import { DEMO_USERS, ROLES } from '../constants/roles';

// Simulated latency for dev fallback
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Log in user with credentials via backend API POST /auth/login
   */
  async login({ email, password, targetRole }) {
    try {
      // 1. Attempt real backend API call
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const data = response.data?.data || response.data;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const user = data.user;

      if (accessToken) {
        localStorage.setItem('cf_access_token', accessToken);
        localStorage.setItem('cf_auth_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('cf_refresh_token', refreshToken);
      }

      return {
        user,
        accessToken,
        refreshToken,
        isMock: false,
      };
    } catch (err) {
      // If server returned a business error (e.g. 400, 401, 404, 422), propagate server error message!
      if (err.response && err.response.data) {
        const errorMsg =
          err.response.data?.message ||
          err.response.data?.error ||
          'Invalid email or password';
        throw new Error(errorMsg);
      }

      // If backend server is not running (ERR_CONNECTION_REFUSED / Network Error),
      // provide development mock fallback so teammates can continue building UI
      console.warn(
        'Backend server unreachable at /api/auth/login. Using development offline fallback mode.'
      );
      await wait(300);

      let matchedUser = null;
      if (targetRole) {
        matchedUser = DEMO_USERS.find((u) => u.role === targetRole || u.roleKey === targetRole);
      }
      if (!matchedUser && email) {
        matchedUser = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
      }
      if (!matchedUser) {
        matchedUser = DEMO_USERS[0];
      }

      const userData = {
        ...matchedUser,
        email: email || matchedUser.email,
      };

      const mockAccessToken = `cf_jwt_mock_${matchedUser.roleKey}_${Date.now()}`;
      const mockRefreshToken = `cf_refresh_mock_${Date.now()}`;

      localStorage.setItem('cf_access_token', mockAccessToken);
      localStorage.setItem('cf_auth_token', mockAccessToken);
      localStorage.setItem('cf_refresh_token', mockRefreshToken);

      return {
        user: userData,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        isMock: true,
      };
    }
  },

  /**
   * Register new student account via backend API POST /auth/register
   * Does NOT accept arbitrary roles; backend assigns default member role.
   */
  async signup(formData) {
    try {
      // 1. Attempt real backend API call
      const payload = {
        name: formData.fullName || formData.name,
        email: formData.email.trim(),
        password: formData.password,
        studentId: formData.studentId,
        department: formData.department,
        phone: formData.phone,
      };

      const response = await api.post('/auth/register', payload);
      const data = response.data?.data || response.data;
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const user = data.user;

      if (accessToken) {
        localStorage.setItem('cf_access_token', accessToken);
        localStorage.setItem('cf_auth_token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('cf_refresh_token', refreshToken);
      }

      return {
        user,
        accessToken,
        refreshToken,
        isMock: false,
      };
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg =
          err.response.data?.message ||
          err.response.data?.error ||
          (err.response.status === 409
            ? 'A user with this email address already exists'
            : 'Registration failed');
        throw new Error(errorMsg);
      }

      console.warn(
        'Backend server unreachable at /api/auth/register. Using development offline fallback.'
      );
      await wait(350);

      const newUser = {
        id: `STU-${Math.floor(10000 + Math.random() * 90000)}`,
        name: formData.fullName || formData.name,
        studentId: formData.studentId,
        department: formData.department,
        email: formData.email,
        phone: formData.phone,
        role: ROLES.MEMBER, // Always member
        roleKey: 'member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256',
        year: 'Freshman (Class of 2029)',
        title: 'Active Association Member',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };

      const mockAccessToken = `cf_jwt_mock_reg_${Date.now()}`;
      const mockRefreshToken = `cf_refresh_mock_${Date.now()}`;

      localStorage.setItem('cf_access_token', mockAccessToken);
      localStorage.setItem('cf_auth_token', mockAccessToken);
      localStorage.setItem('cf_refresh_token', mockRefreshToken);

      return {
        user: newUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        isMock: true,
      };
    }
  },

  /**
   * Get current authenticated user profile: GET /auth/me or GET /users/profile
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data?.user || response.data?.data?.user || response.data;
    } catch {
      // Fallback to stored user in localStorage
      const saved = localStorage.getItem('cf_user');
      return saved ? JSON.parse(saved) : null;
    }
  },

  /**
   * Update profile details: PUT /users/profile
   * Note: Email is read-only on backend.
   */
  async updateProfile(updates) {
    try {
      const response = await api.put('/users/profile', updates);
      return response.data?.user || response.data?.data || updates;
    } catch (err) {
      if (err.response && err.response.data) {
        throw new Error(err.response.data?.message || 'Failed to update profile');
      }
      return updates;
    }
  },

  /**
   * Logout user and revoke refresh token: POST /auth/logout
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('cf_refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout request failed or server offline:', err.message);
    } finally {
      localStorage.removeItem('cf_access_token');
      localStorage.removeItem('cf_auth_token');
      localStorage.removeItem('cf_refresh_token');
      localStorage.removeItem('cf_user');
    }
  },

  /**
   * Check backend server health: GET /health
   */
  async checkHealth() {
    try {
      const response = await api.get('/health');
      return { status: 'healthy', data: response.data };
    } catch (err) {
      return { status: 'offline', error: err.message };
    }
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch {
      await wait(300);
      return {
        success: true,
        message: `Password reset instructions have been dispatched to ${email}.`,
      };
    }
  },
};

export default authService;
