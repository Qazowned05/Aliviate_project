import api from './api';

class AuthService {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.success) {
        return {
          success: true,
          user: response.data.usuario,
          token: response.data.token
        };
      } else {
        return {
          success: false,
          message: response.message || 'Error al iniciar sesión'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error de conexión'
      };
    }
  }

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      return response;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }
}

const authService = new AuthService();
export default authService;
