import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  // Función para obtener la URL de la API
  const getApiUrl = () => {
    // En desarrollo (localhost:3001), usar localhost:3000
    // En producción, usar URL relativa
    return window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
  };

  const [formData, setFormData] = useState({
    email: 'admin@aliviate.com',
    password: 'Admin123!'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.usuario));
        window.location.href = '/dashboard';
      } else {
        // Errores específicos del backend
        if (response.status === 401) {
          setError('Email o contraseña incorrectos');
        } else if (response.status === 400) {
          setError(data.message || 'Datos inválidos');
        } else if (response.status === 500) {
          setError('Error interno del servidor');
        } else {
          setError(data.message || 'Error al iniciar sesión');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error de conexión/red
      setError('Error de conexión. Verifica que el servidor esté funcionando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sistema Aliviate</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="admin@aliviate.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;