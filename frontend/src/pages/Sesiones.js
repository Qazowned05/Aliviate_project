import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Sesiones.css';

const getApiUrl = () => {
  if (window.location.hostname === 'localhost' && window.location.port === '3001') {
    return 'http://localhost:3000';
  }
  return '';
};

const Sesiones = () => {
  const { tratamientoId } = useParams();
  const navigate = useNavigate();
  
  const [tratamiento, setTratamiento] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProgramarModal, setShowProgramarModal] = useState(false);
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null);
  
  const [showConfirmacionModal, setShowConfirmacionModal] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null); 
  const [observacionAsistencia, setObservacionAsistencia] = useState('');
  
  const [citasExistentes, setCitasExistentes] = useState([]);
  const [calendario, setCalendario] = useState({
    mesActual: new Date(),
    fechaSeleccionada: null,
    horaSeleccionada: '',
    sesionesExistentes: []
  });

  const [formData, setFormData] = useState({
    fecha_inicio: '',
    hora_inicio: '',
    frecuencia: '',
    duracion: 60,
    observaciones: ''
  });

  useEffect(() => {
    cargarDatosTratamiento();
  }, [tratamientoId]);

  useEffect(() => {
    if (showReprogramarModal) {
      obtenerCitasExistentes();
    }
  }, [showReprogramarModal]);

  const generarHorarios = () => {
    const horarios = [];
    for (let h = 8; h <= 18; h++) {
      if (h < 18) { 
        const hora = `${h.toString().padStart(2, '0')}:00`;
        horarios.push(hora);
      }
      if (h < 18) {
        const horaMedia = `${h.toString().padStart(2, '0')}:30`;
        horarios.push(horaMedia);
      }
    }
    horarios.push('18:00');
    return horarios;
  };

  const obtenerCitasExistentes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/sesiones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const sesiones = data.sesiones || data.data || data || [];
        
        const sesionesFormateadas = sesiones.map(sesion => ({
          ...sesion,
          fecha_programada: sesion.fecha_programada || sesion.fecha,
          hora_programada: sesion.hora_programada || sesion.hora_inicio || sesion.hora
        }));
        
        console.log('Sesiones formateadas:', sesionesFormateadas); 
        
        setCitasExistentes(sesionesFormateadas);
        
        setCalendario(prev => ({
          ...prev,
          sesionesExistentes: sesionesFormateadas.map(sesion => ({
            ...sesion,
            fecha: sesion.fecha_programada
          }))
        }));
      }
    } catch (error) {
      console.error('Error al obtener citas existentes:', error);
    }
  };

  const obtenerDuracionTratamiento = () => {
    return tratamiento?.duracion_sesion || 30; // Por defecto 30 minutos
  };

  const calcularHorariosOcupados = (horaInicio, duracionMinutos) => {
    const horariosOcupados = [];
    const inicio = new Date(`2000-01-01 ${horaInicio}`);
    
    for (let i = 0; i < duracionMinutos; i += 30) {
      const tiempo = new Date(inicio.getTime() + (i * 60 * 1000));
      const horaFormateada = `${tiempo.getHours().toString().padStart(2, '0')}:${tiempo.getMinutes().toString().padStart(2, '0')}`;
      horariosOcupados.push(horaFormateada);
    }
    
    return horariosOcupados;
  };

  const estaHorarioBloqueado = (fecha, hora) => {
    const duracionActual = obtenerDuracionTratamiento();
    
    const ocupadoExacto = citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      
      if (!mismaDia) return false;
      
      const duracionCita = cita.duracion_sesion || 30; 
      const horariosOcupados = calcularHorariosOcupados(cita.hora_programada, duracionCita);
      
      return horariosOcupados.includes(hora);
    });

    if (ocupadoExacto) return true;

    const horariosNuevaSesion = calcularHorariosOcupados(hora, duracionActual);
    
    return citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      
      if (!mismaDia) return false;
      
      const duracionCita = cita.duracion_sesion || 30;
      const horariosOcupados = calcularHorariosOcupados(cita.hora_programada, duracionCita);
      
      return horariosNuevaSesion.some(horario => horariosOcupados.includes(horario));
    });
  };

  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    const inicio = new Date(`2000-01-01 ${horaInicio}`);
    const fin = new Date(inicio.getTime() + (duracionMinutos * 60 * 1000));
    return `${fin.getHours().toString().padStart(2, '0')}:${fin.getMinutes().toString().padStart(2, '0')}`;
  };

  const estaHoraOcupada = (fecha, hora) => {
    console.log('Verificando hora ocupada:', { fecha, hora, citasExistentes }); 
    
    return citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      const mismaHora = cita.hora_programada === hora;
      
      console.log('Comparación:', { fechaCita, fechaComparar, mismaDia, horaCita: cita.hora_programada, hora, mismaHora });
      
      return mismaDia && mismaHora;
    });
  };

  const contarSesionesEnFecha = (fecha) => {
    const fechaComparar = fecha.toISOString().split('T')[0];
    return citasExistentes.filter(cita => {
      const fechaCita = cita.fecha_programada;
      return fechaCita === fechaComparar || 
             new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
    }).length;
  };

  const obtenerDensidadFecha = (fecha) => {
    const numSesiones = contarSesionesEnFecha(fecha);
    const maxSesiones = 8; 
    
    if (numSesiones === 0) return { nivel: 'libre', color: 'verde', bloqueada: false };
    if (numSesiones <= 2) return { nivel: 'baja', color: 'verde', bloqueada: false };
    if (numSesiones <= 4) return { nivel: 'media', color: 'amarillo', bloqueada: false };
    if (numSesiones <= 6) return { nivel: 'alta', color: 'naranja', bloqueada: false };
    if (numSesiones < maxSesiones) return { nivel: 'muy-alta', color: 'rojo-claro', bloqueada: false };
    
    return { nivel: 'llena', color: 'rojo', bloqueada: true };
  };

  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const dias = [];
    
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const diaAnterior = new Date(año, mes, -i);
      dias.push({
        fecha: diaAnterior,
        enMesActual: false,
        disponible: false
      });
    }
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaDia = new Date(año, mes, dia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaDia.setHours(0, 0, 0, 0);
      
      dias.push({
        fecha: fechaDia,
        enMesActual: true,
        disponible: fechaDia >= hoy, 
        tieneReserva: verificarReservaEnFecha(fechaDia)
      });
    }
    
    return dias;
  };

  const verificarReservaEnFecha = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada || cita.fecha;
      return fechaCita === fechaStr || 
             new Date(fechaCita).toISOString().split('T')[0] === fechaStr;
    });
  };

  const seleccionarFecha = (fecha) => {
    if (!fecha.disponible || !fecha.enMesActual) return;
    
    const fechaStr = fecha.fecha.toISOString().split('T')[0];
    setCalendario(prev => ({
      ...prev,
      fechaSeleccionada: fechaStr,
      horaSeleccionada: ''
    }));
  };

  const actualizarHoraSesion = (fechaStr, hora) => {
    setCalendario(prev => ({
      ...prev,
      horaSeleccionada: hora
    }));
  };

  const navegarMes = (direccion) => {
    const nuevaFecha = new Date(calendario.mesActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    
    setCalendario(prev => ({
      ...prev,
      mesActual: nuevaFecha
    }));
  };

  const seleccionarHora = (hora) => {
    setCalendario(prev => ({
      ...prev,
      horaSeleccionada: hora
    }));
  };

  const cargarDatosTratamiento = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const tratamientoResponse = await fetch(`${apiUrl}/api/tratamientos/${tratamientoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (tratamientoResponse.ok) {
        const data = await tratamientoResponse.json();
        if (data.success) {
          setTratamiento(data.data);
          if (data.data.sesiones) {
            setSesiones(data.data.sesiones);
          }
        }
      } else {
        setError('Error al cargar el tratamiento');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const programarSesiones = async (e) => {
    e.preventDefault();
    
    if (!formData.fecha_inicio || !formData.hora_inicio || !formData.frecuencia) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/tratamientos/con-horario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_paciente: tratamiento.id_paciente,
          id_paquete: tratamiento.id_paquete,
          observaciones: formData.observaciones,
          fecha_inicio: formData.fecha_inicio,
          hora_inicio: formData.hora_inicio,
          dias_semana: formData.frecuencia,
          generar_consecutivo: formData.frecuencia === 'consecutivo'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowProgramarModal(false);
        setFormData({
          fecha_inicio: '',
          hora_inicio: '',
          frecuencia: '',
          duracion: 60,
          observaciones: ''
        });
        await cargarDatosTratamiento();
        alert('Sesiones programadas exitosamente');
      } else {
        setError(data.message || 'Error al programar sesiones');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const reprogramarSesion = async () => {
    if (!calendario.fechaSeleccionada || !calendario.horaSeleccionada) {
      setError('Debe seleccionar una fecha y hora para reprogramar');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/sesiones/${sesionSeleccionada.id_sesion}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fecha_programada: calendario.fechaSeleccionada,
          hora_programada: calendario.horaSeleccionada,
          notas: `Sesión reprogramada - Nueva fecha: ${new Date(calendario.fechaSeleccionada).toLocaleDateString('es-ES')} a las ${calendario.horaSeleccionada}`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCalendario({
          mesActual: new Date(),
          fechaSeleccionada: null,
          horaSeleccionada: ''
        });
        
        setShowReprogramarModal(false);
        setSesionSeleccionada(null);
        await cargarDatosTratamiento();
        alert('Sesión reprogramada exitosamente');
      } else {
        setError(data.message || 'Error al reprogramar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'programada': return '#007bff';
      case 'realizada': return '#28a745';
      case 'cancelada': return '#dc3545';
      case 'reprogramada': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const abrirModalConfirmacion = (sesionId, asistio) => {
    setAccionPendiente({ tipo: asistio ? 'asistio' : 'no_asistio', sesionId, asistio });
    setObservacionAsistencia('');
    setShowConfirmacionModal(true);
  };

  const confirmarAsistencia = async () => {
    if (!accionPendiente) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const updateData = {
        asistencia: accionPendiente.asistio
      };

      if (accionPendiente.asistio === false) {
        const fechaActual = new Date().toLocaleDateString();
        updateData.notas = observacionAsistencia || `No asistió a la sesión - Registrado el ${fechaActual}`;
      } else {
        updateData.notas = observacionAsistencia || 'Sesión completada exitosamente';
      }

      const response = await fetch(`${apiUrl}/api/sesiones/${accionPendiente.sesionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setSesiones(prevSesiones => 
          prevSesiones.map(sesion => 
            sesion.id_sesion === accionPendiente.sesionId 
              ? { 
                  ...sesion, 
                  asistencia: accionPendiente.asistio,
                  notas: updateData.notas
                }
              : sesion
          )
        );
        
        setShowConfirmacionModal(false);
        setAccionPendiente(null);
        setObservacionAsistencia('');
        
        await cargarDatosTratamiento();
      } else {
        setError('Error al actualizar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const marcarAsistencia = async (sesionId, asistio) => {
    abrirModalConfirmacion(sesionId, asistio);
  };

  const finalizarTratamiento = async () => {
    if (!window.confirm('¿Está seguro que desea finalizar este tratamiento? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/tratamientos/${tratamientoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Tratamiento finalizado exitosamente');
        navigate('/dashboard/pacientes');
      } else {
        setError('Error al finalizar tratamiento');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoSesion = (sesion) => {
    if (sesion.asistencia === true || sesion.asistencia === 1) return 'Completada';
    if (sesion.asistencia === false || sesion.asistencia === 0) return 'No asistió';
    return 'Pendiente';
  };

  const getEstadoClase = (sesion) => {
    if (sesion.asistencia === true || sesion.asistencia === 1) return 'completada';
    if (sesion.asistencia === false || sesion.asistencia === 0) return 'no-asistio';
    return 'pendiente';
  };

  if (loading && !tratamiento) {
    return <div className="loading">Cargando datos del tratamiento...</div>;
  }

  if (error && !tratamiento) {
    return <div className="error-page">{error}</div>;
  }

  return (
    <div className="sesiones-container">
      <div className="sesiones-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/dashboard/pacientes')}
        >
          ← Volver a Pacientes
        </button>
        <h2>Gestión de Sesiones</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      {tratamiento && (
        <>
          {/* Información del Tratamiento */}
          <div className="tratamiento-info-card">
            <h3>Información del Tratamiento</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Paciente:</label>
                <span>{tratamiento.paciente_nombre} {tratamiento.paciente_apellido}</span>
              </div>
              <div className="info-item">
                <label>Paquete:</label>
                <span>{tratamiento.paquete_nombre}</span>
              </div>
              <div className="info-item">
                <label>Total sesiones:</label>
                <span>{tratamiento.numero_sesiones}</span>
              </div>
              <div className="info-item">
                <label>Fecha de asignación:</label>
                <span>{new Date(tratamiento.fecha_asignacion).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>Precio:</label>
                <span>S/ {tratamiento.precio}</span>
              </div>
              <div className="info-item">
                <label>Sesiones programadas:</label>
                <span>{sesiones.length} de {tratamiento.numero_sesiones}</span>
              </div>
            </div>
            {tratamiento.observaciones && (
              <div className="observaciones">
                <label>Observaciones:</label>
                <p>{tratamiento.observaciones}</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="acciones-container">
            <button 
              className="btn-programar"
              onClick={() => setShowProgramarModal(true)}
              disabled={sesiones.length >= tratamiento.numero_sesiones}
            >
              Programar Sesiones
            </button>
            <button 
              className="btn-finalizar"
              onClick={finalizarTratamiento}
            >
              Finalizar Tratamiento
            </button>
          </div>

          {/* Lista de Sesiones */}
          <div className="sesiones-lista">
            <h3>Sesiones Programadas</h3>
            {sesiones.length === 0 ? (
              <div className="no-sesiones">
                <p>No hay sesiones programadas para este tratamiento.</p>
                <p>Utiliza el botón "Programar Sesiones" para crear un horario.</p>
              </div>
            ) : (
              <div className="sesiones-grid">
                {sesiones.map((sesion, index) => (
                  <div key={sesion.id_sesion} className="sesion-card">
                    <div className="sesion-header">
                      <span className="sesion-numero">Sesión #{index + 1}</span>
                      <span className={`sesion-estado ${getEstadoClase(sesion)}`}>
                        {getEstadoSesion(sesion)}
                      </span>
                    </div>
                    <div className="sesion-details">
                      <div className="detail-item">
                        <label>Fecha:</label>
                        <span>{new Date(sesion.fecha_programada).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <label>Hora:</label>
                        <span>{sesion.hora_programada}</span>
                      </div>
                      {sesion.notas && (
                        <div className="detail-item">
                          <label>Notas:</label>
                          <p>{sesion.notas}</p>
                        </div>
                      )}
                    </div>
                    <div className="sesion-actions">
                      {(sesion.asistencia === null || sesion.asistencia === undefined) ? (
                        <>
                          <button 
                            className="btn-asistio"
                            onClick={() => marcarAsistencia(sesion.id_sesion, true)}
                          >
                            Asistió
                          </button>
                          <button 
                            className="btn-no-asistio"
                            onClick={() => marcarAsistencia(sesion.id_sesion, false)}
                          >
                            No asistió
                          </button>
                        </>
                      ) : (
                        <div className="estado-confirmado">
                          {(sesion.asistencia === false || sesion.asistencia === 0) && (
                            <span className="nota-automatica">
                              (Observación registrada automáticamente)
                            </span>
                          )}
                        </div>
                      )}
                      <button 
                        className="btn-reprogramar"
                        onClick={() => {
                          setSesionSeleccionada(sesion);
                          setShowReprogramarModal(true);
                        }}
                        disabled={sesion.asistencia !== null && sesion.asistencia !== undefined}
                      >
                        Reprogramar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Programar Sesiones */}
      {showProgramarModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Programar Sesiones</h3>
              <button 
                className="modal-close"
                onClick={() => setShowProgramarModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={programarSesiones} className="modal-content">
              <div className="form-group">
                <label>Fecha de inicio <span className="required">*</span></label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hora de inicio <span className="required">*</span></label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Frecuencia <span className="required">*</span></label>
                <select
                  name="frecuencia"
                  value={formData.frecuencia}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Seleccionar frecuencia</option>
                  <option value="lunes,miercoles,viernes">Lunes, Miércoles, Viernes</option>
                  <option value="martes,jueves">Martes, Jueves</option>
                  <option value="lunes,martes,miercoles,jueves,viernes">Lunes a Viernes</option>
                  <option value="consecutivo">Días consecutivos</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duración por sesión (minutos)</label>
                <input
                  type="number"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleFormChange}
                  min="30"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Observaciones adicionales..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProgramarModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Programando...' : 'Programar Sesiones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reprogramar Sesión */}
      {showReprogramarModal && sesionSeleccionada && (
        <div className="modal-overlay">
          <div className="asignacion-modal">
            <div className="asignacion-header">
              <h3>Reprogramar Sesión</h3>
              <button 
                className="btn-close"
                onClick={() => setShowReprogramarModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="asignacion-content">
              <div className="form-note">
                <p><span className="required-asterisk">*</span> Campos obligatorios</p>
              </div>

              <div className="paciente-info-section">
                <h4>Sesión Actual</h4>
                <div className="paciente-info-grid">
                  <div className="info-item">
                    <label>Fecha actual:</label>
                    <span>{new Date(sesionSeleccionada.fecha_programada).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="info-item">
                    <label>Hora actual:</label>
                    <span>{sesionSeleccionada.hora_inicio}</span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Seleccionar nueva fecha y horario</h4>
                
                <div className="programming-info">
                  <p>Seleccione {1} fecha y horario para reprogramar la sesión</p>
                </div>

                {/* Navegación del calendario */}
                <div className="calendar-navigation">
                  <button 
                    type="button" 
                    className="btn-nav" 
                    onClick={() => navegarMes(-1)}
                  >
                    ← Anterior
                  </button>
                  <h4 className="month-year">
                    {calendario.mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button 
                    type="button" 
                    className="btn-nav" 
                    onClick={() => navegarMes(1)}
                  >
                    Siguiente →
                  </button>
                </div>

                {/* Calendario */}
                <div className="calendar-grid">
                  <div className="calendar-header">
                    <div className="day-name">Dom</div>
                    <div className="day-name">Lun</div>
                    <div className="day-name">Mar</div>
                    <div className="day-name">Mié</div>
                    <div className="day-name">Jue</div>
                    <div className="day-name">Vie</div>
                    <div className="day-name">Sáb</div>
                  </div>
                  <div className="calendar-body">
                    {obtenerDiasDelMes(calendario.mesActual).map((dia, index) => {
                      const fechaStr = dia.fecha.toISOString().split('T')[0];
                      const estaSeleccionada = calendario.fechaSeleccionada === fechaStr;
                      const densidad = obtenerDensidadFecha(dia.fecha);
                      const numSesiones = contarSesionesEnFecha(dia.fecha);
                      
                      return (
                        <div
                          key={index}
                          className={`calendar-day ${dia.enMesActual ? 'current-month' : 'other-month'} 
                                     ${dia.disponible && !densidad.bloqueada ? 'available' : 'unavailable'} 
                                     ${estaSeleccionada ? 'selected' : ''} 
                                     ${dia.tieneReserva ? 'has-reservation' : ''}
                                     densidad-${densidad.nivel}
                                     ${densidad.bloqueada ? 'fecha-bloqueada' : ''}`}
                          onClick={() => !densidad.bloqueada && seleccionarFecha(dia)}
                          style={{ cursor: densidad.bloqueada ? 'not-allowed' : 'pointer' }}
                        >
                          {dia.fecha.getDate()}
                          {dia.tieneReserva && <div className="reservation-dot"></div>}
                          {numSesiones > 0 && (
                            <div className={`ocupacion-dots densidad-${densidad.nivel}`}>
                              {Array.from({ length: Math.min(numSesiones, 8) }, (_, i) => (
                                <div key={i} className={`ocupacion-dot dot-${densidad.color}`}></div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de horario para la fecha seleccionada */}
                {calendario.fechaSeleccionada && (
                  <div className="sessions-list">
                    <h5>Horarios disponibles para {new Date(calendario.fechaSeleccionada).toLocaleDateString('es-ES')}</h5>
                    <div className="session-item">
                      <div className="session-date">
                        <strong>Nueva sesión:</strong> {new Date(calendario.fechaSeleccionada).toLocaleDateString('es-ES')}
                      </div>
                      
                      <div className="session-time-inline">
                        <label>Horario <span className="required-asterisk">*</span></label>
                        <select 
                          value={calendario.horaSeleccionada} 
                          onChange={(e) => actualizarHoraSesion(calendario.fechaSeleccionada, e.target.value)}
                          className={`form-control-inline ${obtenerDensidadFecha(new Date(calendario.fechaSeleccionada)).bloqueada ? 'selector-bloqueado' : ''}`}
                          required
                          disabled={obtenerDensidadFecha(new Date(calendario.fechaSeleccionada)).bloqueada}
                        >
                          <option value="">
                            {obtenerDensidadFecha(new Date(calendario.fechaSeleccionada)).bloqueada 
                              ? 'Día completo - Sin horarios disponibles' 
                              : 'Seleccionar horario'}
                          </option>
                          {!obtenerDensidadFecha(new Date(calendario.fechaSeleccionada)).bloqueada && generarHorarios().map(hora => {
                            const bloqueado = estaHorarioBloqueado(calendario.fechaSeleccionada, hora);
                            
                            let backgroundColor = 'white';
                            let color = 'black';
                            let texto = hora;
                            
                            if (bloqueado) {
                              backgroundColor = '#ffebee';
                              color = '#d32f2f';
                              texto += ' (Ocupado)';
                            }
                            
                            return (
                              <option 
                                key={hora} 
                                value={hora}
                                style={{ backgroundColor, color }}
                                disabled={bloqueado}
                              >
                                {texto}
                              </option>
                            );
                          })}
                        </select>
                        
                        {obtenerDensidadFecha(new Date(calendario.fechaSeleccionada)).bloqueada && (
                          <div className="warning-message">
                            Este día ya tiene el máximo de 8 sesiones permitidas
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mostrar errores */}
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowReprogramarModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={reprogramarSesion}
                  disabled={loading || !calendario.fechaSeleccionada || !calendario.horaSeleccionada}
                >
                  {loading ? 'Reprogramando...' : 'Reprogramar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Asistencia */}
      {showConfirmacionModal && accionPendiente && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>
                {accionPendiente.tipo === 'asistio' ? 'Confirmar Asistencia' : 'Confirmar Inasistencia'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowConfirmacionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p>
                {accionPendiente.tipo === 'asistio' 
                  ? '¿Confirma que el paciente asistió a la sesión?' 
                  : '¿Confirma que el paciente NO asistió a la sesión?'
                }
              </p>

              <div className="form-group">
                <label>Observaciones de la sesión:</label>
                <textarea
                  value={observacionAsistencia}
                  onChange={(e) => setObservacionAsistencia(e.target.value)}
                  placeholder={accionPendiente.tipo === 'asistio' 
                    ? 'Ingrese observaciones sobre la sesión (opcional)' 
                    : 'Ingrese el motivo de la inasistencia (opcional)'
                  }
                  rows="3"
                  className="form-control"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowConfirmacionModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className={`btn-primary ${accionPendiente.tipo === 'asistio' ? 'btn-success' : 'btn-warning'}`}
                  onClick={confirmarAsistencia}
                  disabled={loading}
                >
                  {loading ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sesiones;
