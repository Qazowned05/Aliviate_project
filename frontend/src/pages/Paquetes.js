import React, { useState, useEffect } from 'react';
import './Paquetes.css';

const getApiUrl = () => {

  if (window.location.hostname === 'localhost' && window.location.port === '3001') {
    return 'http://localhost:3000';
  }
  return ''; 
};

const Paquetes = () => {
  const [paquetes, setPaquetes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [selectedPaquete, setSelectedPaquete] = useState(null);
  const [filtros, setFiltros] = useState({
    nombre: ''
  });

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    numero_sesiones: '',
    precio: ''
  });

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const cargarPaquetes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/paquetes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaquetes(data.data || []);
        } else {
          setError(data.message || 'Error al cargar paquetes');
        }
      } else {
        setError('Error al conectar con el servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      numero_sesiones: '',
      precio: ''
    });
  };

  const abrirModal = (mode, paquete = null) => {
    setModalMode(mode);
    setSelectedPaquete(paquete);
    
    if (mode === 'edit' && paquete) {
      setFormData({
        nombre: paquete.nombre || '',
        descripcion: paquete.descripcion || '',
        numero_sesiones: paquete.numero_sesiones || '',
        precio: paquete.precio || ''
      });
    } else {
      limpiarFormulario();
    }
    
    setShowModal(true);
    setError('');
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedPaquete(null);
    limpiarFormulario();
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('El nombre del paquete es obligatorio');
      return false;
    }
    
    if (!formData.numero_sesiones || formData.numero_sesiones <= 0) {
      setError('El número de sesiones debe ser mayor a 0');
      return false;
    }
    
    if (formData.precio && formData.precio < 0) {
      setError('El precio no puede ser negativo');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Preparar datos
      const dataToSend = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        numero_sesiones: parseInt(formData.numero_sesiones),
        precio: formData.precio ? parseFloat(formData.precio) : null
      };

      const apiUrl = getApiUrl();
      const url = modalMode === 'create' 
        ? `${apiUrl}/api/paquetes`
        : `${apiUrl}/api/paquetes/${selectedPaquete.id_paquete}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        cerrarModal();
        cargarPaquetes();
      } else {
        setError(data.message || 'Error al guardar paquete');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPaquete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este paquete?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/paquetes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        cargarPaquetes();
      } else {
        setError(data.message || 'Error al eliminar paquete');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar paquetes
  const paquetesFiltrados = paquetes.filter(paquete => {
    const cumpleNombre = !filtros.nombre || 
      paquete.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
    
    return cumpleNombre;
  });

  if (loading) {
    return <div className="loading">Cargando paquetes...</div>;
  }

  return (
    <div className="paquetes-container">
      <div className="paquetes-header">
        <h2>Gestión de Paquetes de Tratamiento</h2>
        <button 
          className="btn-primary"
          onClick={() => abrirModal('create')}
        >
          Nuevo Paquete
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="filtros-section">
        <h3>Filtros</h3>
        <div className="filtros-form">
          <div className="form-group">
            <label>Buscar por nombre</label>
            <input
              type="text"
              name="nombre"
              value={filtros.nombre}
              onChange={handleFiltroChange}
              placeholder="Escriba el nombre del paquete..."
            />
          </div>
          <button 
            className="btn-secondary"
            onClick={() => setFiltros({ nombre: '' })}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de paquetes */}
      <div className="paquetes-grid">
        {paquetesFiltrados.length === 0 ? (
          <div className="no-data">No se encontraron paquetes</div>
        ) : (
          paquetesFiltrados.map(paquete => (
            <div key={paquete.id_paquete} className="paquete-card">
              <div className="paquete-info">
                <h3>{paquete.nombre}</h3>
                {paquete.descripcion && (
                  <p className="descripcion">{paquete.descripcion}</p>
                )}
                <div className="paquete-details">
                  <p><strong>Sesiones:</strong> {paquete.numero_sesiones}</p>
                  <p><strong>Precio:</strong> {
                    paquete.precio 
                      ? `S/ ${parseFloat(paquete.precio).toFixed(2)}`
                      : 'No especificado'
                  }</p>
                  <p><strong>Creado:</strong> {
                    new Date(paquete.fecha_creacion).toLocaleDateString()
                  }</p>
                </div>
              </div>
              <div className="paquete-actions">
                <button 
                  className="btn-edit"
                  onClick={() => abrirModal('edit', paquete)}
                >
                  Editar
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => eliminarPaquete(paquete.id_paquete)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Nuevo Paquete' : 'Editar Paquete'}</h3>
              <button className="btn-close" onClick={cerrarModal}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre del paquete <span className="required">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Fisioterapia básica"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Descripción del paquete de tratamiento..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Número de sesiones <span className="required">*</span></label>
                    <input
                      type="number"
                      name="numero_sesiones"
                      value={formData.numero_sesiones}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="Ej: 10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="precio"
                      value={formData.precio}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Ej: 150.00"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : (modalMode === 'create' ? 'Crear' : 'Actualizar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paquetes;
