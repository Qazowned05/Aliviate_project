import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Paquetes from './pages/Paquetes';
import Sesiones from './pages/Sesiones';
import './App.css';

const DashboardHome = () => {
  const navigate = useNavigate();
  
  return (
    <div className="dashboard-content">
      <h2>Panel de Control</h2>
      <p>¡Bienvenido al sistema de gestión médica Aliviate!</p>
      
      <div className="dashboard-grid">
        <div 
          className="dashboard-card clickable"
          onClick={() => navigate('/dashboard/pacientes')}
        >
          <h3>Pacientes</h3>
          <p>Gestión de pacientes registrados</p>
          <span className="card-arrow">→</span>
        </div>
        
        <div 
          className="dashboard-card clickable"
          onClick={() => navigate('/dashboard/paquetes')}
        >
          <h3>Paquetes de Tratamiento</h3>
          <p>Administración de paquetes médicos</p>
          <span className="card-arrow">→</span>
        </div>
        
        <div className="dashboard-card">
          <h3>Sesiones</h3>
          <p>Control de sesiones médicas</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Historias Clínicas</h3>
          <p>Registro de historias médicas</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="paquetes" element={<Paquetes />} />
            <Route path="sesiones/:tratamientoId" element={<Sesiones />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
