import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Determinar la sección activa basada en la URL
  const getSeccionActiva = () => {
    const path = location.pathname;
    if (path.includes('pacientes')) return 'pacientes';
    if (path.includes('paquetes')) return 'paquetes';
    return 'inicio';
  };

  const seccionActiva = getSeccionActiva();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Sistema Aliviate</h1>
        <nav className="dashboard-nav">
          <button 
            className={seccionActiva === 'inicio' ? 'nav-active' : ''}
            onClick={() => navigate('/dashboard')}
          >
            Inicio
          </button>
          <button 
            className={seccionActiva === 'pacientes' ? 'nav-active' : ''}
            onClick={() => navigate('/dashboard/pacientes')}
          >
            Pacientes
          </button>
          <button 
            className={seccionActiva === 'paquetes' ? 'nav-active' : ''}
            onClick={() => navigate('/dashboard/paquetes')}
          >
            Paquetes
          </button>
        </nav>
        <div className="user-info">
          <span>Bienvenido, {user?.nombre || 'Usuario'}</span>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
