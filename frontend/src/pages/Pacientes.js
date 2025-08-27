import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pacientes.css';
import HistoriaClinica from '../components/HistoriaClinica';

// Función para obtener la URL base (desarrollo o producción)
const getApiUrl = () => {
  // Si estamos en desarrollo y localhost:3001 (frontend), usar localhost:3000 (backend)
  // Si estamos en producción, usar rutas relativas
  if (window.location.hostname === 'localhost' && window.location.port === '3001') {
    return 'http://localhost:3000';
  }
  return ''; // Ruta relativa para producción
};

const Pacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [showHistoriaModal, setShowHistoriaModal] = useState(false);
  const [pacienteIdForHistoria, setPacienteIdForHistoria] = useState(null);
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [fichaData, setFichaData] = useState(null);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [paquetesTratamiento, setPaquetesTratamiento] = useState([]);
  const [asignacionData, setAsignacionData] = useState({
    paquete_id: '',
    observaciones: ''
  });
  const [sessionesData, setSessionesData] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Selección paquete, 2: Programación sesiones
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [calendario, setCalendario] = useState({
    mesActual: new Date(),
    sesionesExistentes: [],
    fechasSeleccionadas: []
  });
  
  // Estado para citas existentes en el sistema
  const [citasExistentes, setCitasExistentes] = useState([]);
  
  // Función para generar horarios cada media hora
  const generarHorarios = () => {
    const horarios = [];
    for (let h = 8; h <= 18; h++) {
      // Agregar hora en punto
      if (h < 18) { // No agregar 18:30
        const hora = `${h.toString().padStart(2, '0')}:00`;
        horarios.push(hora);
      }
      // Agregar hora y media (excepto para las 18:00)
      if (h < 18) {
        const horaMedia = `${h.toString().padStart(2, '0')}:30`;
        horarios.push(horaMedia);
      }
    }
    // Agregar 18:00 como último horario
    horarios.push('18:00');
    return horarios;
  };
  
  // Función para obtener la duración del tratamiento actual
  const obtenerDuracionTratamiento = () => {
    return selectedPackage?.duracion_sesion || 30; // Por defecto 30 minutos
  };

  // Función para calcular horarios ocupados por una sesión según su duración
  const calcularHorariosOcupados = (horaInicio, duracionMinutos) => {
    const horariosOcupados = [];
    const inicio = new Date(`2000-01-01 ${horaInicio}`);
    
    // Generar todos los slots de 30 minutos que ocupa esta sesión
    for (let i = 0; i < duracionMinutos; i += 30) {
      const tiempo = new Date(inicio.getTime() + (i * 60 * 1000));
      const horaFormateada = `${tiempo.getHours().toString().padStart(2, '0')}:${tiempo.getMinutes().toString().padStart(2, '0')}`;
      horariosOcupados.push(horaFormateada);
    }
    
    return horariosOcupados;
  };

  // Función para verificar si un horario está ocupado considerando duración
  const estaHorarioBloqueado = (fecha, hora) => {
    const duracionActual = obtenerDuracionTratamiento();
    
    // Verificar si el horario exacto ya está ocupado
    const ocupadoExacto = citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      
      if (!mismaDia) return false;
      
      // Calcular horarios ocupados por esta cita existente
      const duracionCita = cita.duracion_sesion || 30; // Asumir 30 min si no está especificado
      const horariosOcupados = calcularHorariosOcupados(cita.hora_programada, duracionCita);
      
      return horariosOcupados.includes(hora);
    });

    if (ocupadoExacto) return true;

    // Verificar si la nueva sesión entraría en conflicto con sesiones existentes
    const horariosNuevaSesion = calcularHorariosOcupados(hora, duracionActual);
    
    return citasExistentes.some(cita => {
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      
      if (!mismaDia) return false;
      
      const duracionCita = cita.duracion_sesion || 30;
      const horariosOcupados = calcularHorariosOcupados(cita.hora_programada, duracionCita);
      
      // Verificar si hay solapamiento
      return horariosNuevaSesion.some(horario => horariosOcupados.includes(horario));
    });
  };

  const horariosDisponibles = generarHorarios();
  
  // Función para obtener citas existentes
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
        console.log('Citas obtenidas:', data); // Para debugging
        
        // Asegurarse de que tenemos la estructura correcta
        const sesiones = data.sesiones || data.data || data || [];
        
        // Procesar las sesiones para tener el formato correcto
        const sesionesFormateadas = sesiones.map(sesion => ({
          fecha_programada: sesion.fecha_programada,
          hora_programada: sesion.hora_programada,
          paciente_nombre: sesion.paciente_nombre || `${sesion.nombre || ''} ${sesion.apellido || ''}`.trim()
        }));
        
        console.log('Sesiones formateadas:', sesionesFormateadas); // Para debugging
        setCitasExistentes(sesionesFormateadas);
      } else {
        console.error('Error al obtener sesiones:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al obtener citas existentes:', error);
    }
  };

  // Función para verificar conflictos de horario considerando duración de sesiones
  const verificarConflictoHorario = (fecha, hora) => {
    console.log('Verificando conflicto para:', { fecha, hora }); // Para debugging
    
    const citasDelDia = citasExistentes.filter(cita => {
      const fechaCita = cita.fecha_programada;
      const mismaDia = fechaCita === fecha || 
                      new Date(fechaCita).toISOString().split('T')[0] === fecha;
      return mismaDia;
    });
    
    console.log('Citas del día:', citasDelDia); // Para debugging
    
    if (citasDelDia.length === 0) {
      return { hayConflicto: false };
    }
    
    // Verificar si ya hay 8 sesiones (máximo por día)
    if (citasDelDia.length >= 8) {
      return {
        hayConflicto: true,
        mensaje: 'Este día ya tiene el máximo de 8 sesiones permitidas',
        tipo: 'dia-lleno'
      };
    }
    
    const duracionNueva = obtenerDuracionTratamiento();
    const horariosNuevaSesion = calcularHorariosOcupados(hora, duracionNueva);
    
    for (let cita of citasDelDia) {
      const duracionCita = cita.duracion_sesion || 30;
      const horariosOcupados = calcularHorariosOcupados(cita.hora_programada, duracionCita);
      
      // Verificar solapamiento directo
      const haySolapamiento = horariosNuevaSesion.some(horario => horariosOcupados.includes(horario));
      
      if (haySolapamiento) {
        return {
          hayConflicto: true,
          horaConflicto: cita.hora_programada,
          pacienteConflicto: cita.paciente_nombre || 'Paciente',
          mensaje: `Conflicto de horarios. La sesión se solapa con otra de ${cita.hora_programada} a ${calcularHoraFin(cita.hora_programada, duracionCita)}`
        };
      }
    }
    
    return { hayConflicto: false };
  };

  // Función auxiliar para calcular hora de fin
  const calcularHoraFin = (horaInicio, duracionMinutos) => {
    const inicio = new Date(`2000-01-01 ${horaInicio}`);
    const fin = new Date(inicio.getTime() + (duracionMinutos * 60 * 1000));
    return `${fin.getHours().toString().padStart(2, '0')}:${fin.getMinutes().toString().padStart(2, '0')}`;
  };

  // Función para verificar si una hora está ocupada
  const estaHoraOcupada = (fecha, hora) => {
    console.log('Verificando hora ocupada:', { fecha, hora, citasExistentes }); // Para debugging
    
    return citasExistentes.some(cita => {
      // Normalizar las fechas para comparación
      const fechaCita = cita.fecha_programada;
      const fechaComparar = fecha;
      
      // Comparar fecha y hora exactas
      const mismaDia = fechaCita === fechaComparar || 
                      new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
      const mismaHora = cita.hora_programada === hora;
      
      console.log('Comparación:', { fechaCita, fechaComparar, mismaDia, horaCita: cita.hora_programada, hora, mismaHora });
      
      return mismaDia && mismaHora;
    });
  };

  // Función para contar sesiones en una fecha
  const contarSesionesEnFecha = (fecha) => {
    const fechaComparar = fecha.toISOString().split('T')[0];
    return citasExistentes.filter(cita => {
      const fechaCita = cita.fecha_programada;
      return fechaCita === fechaComparar || 
             new Date(fechaCita).toISOString().split('T')[0] === fechaComparar;
    }).length;
  };

  // Función para obtener el estado de densidad de una fecha
  const obtenerDensidadFecha = (fecha) => {
    const numSesiones = contarSesionesEnFecha(fecha);
    const maxSesiones = 8; // Máximo 8 sesiones por día
    
    if (numSesiones === 0) return { nivel: 'libre', color: 'verde', bloqueada: false };
    if (numSesiones <= 2) return { nivel: 'baja', color: 'verde', bloqueada: false };
    if (numSesiones <= 4) return { nivel: 'media', color: 'amarillo', bloqueada: false };
    if (numSesiones <= 6) return { nivel: 'alta', color: 'naranja', bloqueada: false };
    if (numSesiones < maxSesiones) return { nivel: 'muy-alta', color: 'rojo-claro', bloqueada: false };
    
    return { nivel: 'llena', color: 'rojo', bloqueada: true };
  };

  // Función para verificar si una fecha tiene citas ocupadas (mantenida para compatibilidad)
  const fechaTieneCitas = (fecha) => {
    return contarSesionesEnFecha(fecha) > 0;
  };

  // Función para verificar si una fecha está bloqueada por estar llena
  const fechaEstaBloqueada = (fecha) => {
    return obtenerDensidadFecha(fecha).bloqueada;
  };
  const [filtros, setFiltros] = useState({
    documento_identidad: '',
    nombre: ''
  });

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento_identidad: '',
    tipo_documento: 'DNI',
    sexo: '',
    fecha_nacimiento: '',
    domicilio: '',
    telefono: '',
    email: '',
    estado_civil: '',
    ocupacion: '',
    nacionalidad: 'Peruana',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: ''
  });

  useEffect(() => {
    cargarPacientes();
  }, []);
  
  // Cargar citas existentes cuando se abre el modal de asignación
  useEffect(() => {
    if (showAsignacionModal) {
      obtenerCitasExistentes();
    }
  }, [showAsignacionModal]);

  // Función para aplicar horario personalizado
  const aplicarHorarioPersonalizado = (fechaStr, hora) => {
    // Validar el horario personalizado
    const conflicto = verificarConflictoHorario(fechaStr, hora);
    
    if (conflicto.hayConflicto) {
      setError(`${conflicto.mensaje}`);
      return;
    }
    
    setError(''); // Limpiar error si no hay conflicto
    
    const fechasActualizadas = calendario.fechasSeleccionadas.map(sesion => 
      sesion.fecha === fechaStr ? { ...sesion, hora_personalizada: hora } : sesion
    );
    
    setCalendario(prev => ({
      ...prev,
      fechasSeleccionadas: fechasActualizadas
    }));
  };

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/pacientes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.data || []);
      } else {
        setError('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const cargarPaquetesTratamiento = async () => {
    try {
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
        setPaquetesTratamiento(data.data || []);
      } else {
        console.error('Error al cargar paquetes de tratamiento');
      }
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const pacientesFiltrados = pacientes.filter(paciente => {
    const filtroNombre = filtros.nombre.toLowerCase();
    const filtroDocumento = filtros.documento_identidad.toLowerCase();
    
    const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
    const documento = (paciente.documento_identidad || '').toLowerCase();

    return nombreCompleto.includes(filtroNombre) && documento.includes(filtroDocumento);
  });

  const abrirModal = (modo, paciente = null) => {
    setModalMode(modo);
    setSelectedPaciente(paciente);
    setError('');
    
    if (modo === 'edit' && paciente) {
      setFormData({
        nombre: paciente.nombre || '',
        apellido: paciente.apellido || '',
        documento_identidad: paciente.documento_identidad || '',
        tipo_documento: paciente.tipo_documento || 'DNI',
        sexo: paciente.sexo || '',
        fecha_nacimiento: paciente.fecha_nacimiento ? paciente.fecha_nacimiento.split('T')[0] : '',
        domicilio: paciente.domicilio || '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        estado_civil: paciente.estado_civil || '',
        ocupacion: paciente.ocupacion || '',
        nacionalidad: paciente.nacionalidad || 'Peruana',
        contacto_emergencia_nombre: paciente.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: paciente.contacto_emergencia_telefono || ''
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        documento_identidad: '',
        tipo_documento: 'DNI',
        sexo: '',
        fecha_nacimiento: '',
        domicilio: '',
        telefono: '',
        email: '',
        estado_civil: '',
        ocupacion: '',
        nacionalidad: 'Peruana',
        contacto_emergencia_nombre: '',
        contacto_emergencia_telefono: ''
      });
    }
    
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setSelectedPaciente(null);
    setError('');
  };

  const cerrarModalAsignacion = () => {
    setShowAsignacionModal(false);
    setAsignacionData({ paquete_id: '', observaciones: '' });
    setCurrentStep(1);
    setSelectedPackage(null);
    setCalendario({
      mesActual: new Date(),
      sesionesExistentes: [],
      fechasSeleccionadas: []
    });
    setError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar campos obligatorios
    const camposObligatorios = [
      'nombre', 'apellido', 'documento_identidad', 'tipo_documento', 
      'sexo', 'fecha_nacimiento', 'telefono', 'nacionalidad', 
      'contacto_emergencia_nombre', 'contacto_emergencia_telefono'
    ];

    const camposVacios = camposObligatorios.filter(campo => !formData[campo] || formData[campo].trim() === '');
    
    if (camposVacios.length > 0) {
      setError(`Los siguientes campos son obligatorios: ${camposVacios.join(', ')}`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const url = modalMode === 'create' 
        ? `${apiUrl}/api/pacientes`
        : `${apiUrl}/api/pacientes/${selectedPaciente.id_paciente}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      // Preparar datos: campos obligatorios con valor, campos opcionales como null si están vacíos
      const dataToSend = {};
      const camposOpcionales = ['domicilio', 'email', 'estado_civil', 'ocupacion'];

      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (camposObligatorios.includes(key)) {
          // Campos obligatorios: enviar el valor (ya validamos que no estén vacíos)
          dataToSend[key] = value;
        } else if (camposOpcionales.includes(key)) {
          // Campos opcionales: enviar null si están vacíos, el valor si tienen contenido
          dataToSend[key] = (value && value.trim() !== '') ? value : null;
        }
      });

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
        await cargarPacientes();
        
        // Si es un nuevo paciente, seleccionarlo automáticamente y cargar su ficha
        if (modalMode === 'create') {
          const pacienteCreado = data.data;
          cerrarModal();
          await seleccionarPaciente(pacienteCreado);
        } else {
          const pacienteIdEditado = selectedPaciente?.id_paciente;
          cerrarModal();
          
          // Recargar la lista de pacientes
          await cargarPacientes();
          
          // Si había un paciente seleccionado y es el mismo que editamos, reseleccionarlo
          if (pacienteSeleccionado && pacienteIdEditado === pacienteSeleccionado.paciente?.id_paciente) {
            await refrescarPacienteSeleccionado(pacienteIdEditado);
          }
        }
      } else {
        setError(data.message || 'Error al guardar paciente');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    }
  };

  const eliminarPaciente = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/pacientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await cargarPacientes();
      } else {
        setError(data.message || 'Error al eliminar paciente');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    }
  };

  const abrirHistoriaClinica = (pacienteId) => {
    setPacienteIdForHistoria(pacienteId);
    setShowHistoriaModal(true);
  };

  const cerrarHistoriaClinica = () => {
    setShowHistoriaModal(false);
    setPacienteIdForHistoria(null);
  };

  const handleHistoriaGuardada = async () => {
    cerrarHistoriaClinica();
    // Si hay un paciente seleccionado, actualizar su ficha para mostrar la nueva historia clínica
    if (pacienteSeleccionado) {
      await seleccionarPaciente(pacienteSeleccionado.paciente);
    }
  };

  const abrirFicha = async (paciente) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      // Cargar historia clínica del paciente
      const historiaResponse = await fetch(`${apiUrl}/api/historias/paciente/${paciente.id_paciente}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let historiaClinica = null;
      if (historiaResponse.ok) {
        const data = await historiaResponse.json();
        if (data.success && data.data) {
          historiaClinica = data.data;
        }
      }

      // Cargar tratamientos asignados del paciente
      const tratamientosResponse = await fetch(`${apiUrl}/api/tratamientos/paciente/${paciente.id_paciente}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let tratamientosAsignados = [];
      if (tratamientosResponse.ok) {
        const data = await tratamientosResponse.json();
        if (data.success && data.data) {
          // Filtrar solo los tratamientos activos (pendientes)
          tratamientosAsignados = data.data.filter(tratamiento => tratamiento.estado === 'activo');
        }
      }

      setFichaData({
        paciente: paciente,
        historiaClinica: historiaClinica,
        tratamientosAsignados: tratamientosAsignados
      });
      setShowFichaModal(true);
    } catch (error) {
      console.error('Error al cargar ficha:', error);
      setError('Error al cargar la ficha del paciente');
    } finally {
      setLoading(false);
    }
  };

  const abrirAsignacionTratamiento = async (paciente) => {
    setSelectedPaciente(paciente);
    setAsignacionData({ paquete_id: '', observaciones: '' });
    setCurrentStep(1);
    setSelectedPackage(null);
    setCalendario({
      mesActual: new Date(),
      sesionesExistentes: [],
      fechasSeleccionadas: []
    });
    setSessionesData([]);
    setShowAsignacionModal(true);
    // Cargar paquetes de tratamiento disponibles
    await cargarPaquetesTratamiento();
    await cargarSesionesExistentes();
  };

  const handleAsignacionChange = (e) => {
    const { name, value } = e.target;
    setAsignacionData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si se selecciona un paquete, guardarlo para usar en el paso 2
    if (name === 'paquete_id' && value) {
      const paqueteSeleccionado = paquetesTratamiento.find(p => p.id_paquete === parseInt(value));
      setSelectedPackage(paqueteSeleccionado);
    }
  };

  const avanzarAPaso2 = () => {
    if (!asignacionData.paquete_id) {
      setError('Debe seleccionar un paquete de tratamiento');
      return;
    }
    setCurrentStep(2);
    setError('');
  };

  const volverAPaso1 = () => {
    setCurrentStep(1);
    setCalendario(prev => ({
      ...prev,
      fechasSeleccionadas: []
    }));
  };

  const validarSesiones = () => {
    const sesionesCompletas = calendario.fechasSeleccionadas.filter(sesion => {
      if (!sesion.fecha) return false;
      
      // Si es horario personalizado, verificar que tenga hora definida
      if (sesion.hora === 'personalizado') {
        return sesion.hora_personalizada && sesion.hora_personalizada.trim() !== '';
      }
      
      // Para horarios regulares
      return sesion.hora && sesion.hora.trim() !== '';
    });
    
    if (sesionesCompletas.length !== selectedPackage?.numero_sesiones) {
      setError(`Debe programar todas las ${selectedPackage?.numero_sesiones} sesiones con fecha y horario`);
      return false;
    }
    
    return true;
  };

  const handleAsignacionSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      avanzarAPaso2();
      return;
    }
    
    // Validar sesiones programadas
    if (!validarSesiones()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      // Preparar datos del tratamiento
      const dataToSend = {
        id_paciente: selectedPaciente.id_paciente,
        id_paquete: asignacionData.paquete_id,
        observaciones: asignacionData.observaciones || null,
        sesiones: calendario.fechasSeleccionadas.map(sesion => {
          // Obtener la hora final (personalizada o regular)
          const horaFinal = sesion.hora === 'personalizado' 
            ? sesion.hora_personalizada 
            : sesion.hora;
            
          return {
            fecha: sesion.fecha,
            hora_programada: horaFinal,
            duracion_sesion: obtenerDuracionTratamiento()
          };
        })
      };

      // Crear tratamiento con sesiones
      const response = await fetch(`${apiUrl}/api/tratamientos/con-sesiones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        cerrarModalAsignacion();
        
        // Mostrar mensaje de éxito
        alert(`Tratamiento asignado exitosamente con ${calendario.fechasSeleccionadas.length} sesiones programadas`);
        
        // Recargar datos del paciente seleccionado
        if (pacienteSeleccionado) {
          await seleccionarPaciente(pacienteSeleccionado.paciente);
        }
        
        // Actualizar citas existentes para futuras asignaciones
        await obtenerCitasExistentes();
      } else {
        setError(data.message || 'Error al asignar tratamiento');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const refrescarPacienteSeleccionado = async (pacienteId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      // Cargar datos actualizados del paciente
      const pacienteResponse = await fetch(`${apiUrl}/api/pacientes/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (pacienteResponse.ok) {
        const pacienteData = await pacienteResponse.json();
        if (pacienteData.success) {
          await seleccionarPaciente(pacienteData.data);
        }
      }
    } catch (error) {
      console.error('Error al refrescar paciente:', error);
    }
  };

  const seleccionarPaciente = async (paciente) => {
    try {
      setLoading(true);
      // Limpiar filtros para ocultar las sugerencias
      setFiltros({
        documento_identidad: '',
        nombre: ''
      });
      
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      // Cargar historia clínica del paciente
      const historiaResponse = await fetch(`${apiUrl}/api/historias/paciente/${paciente.id_paciente}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let historiaClinica = null;
      if (historiaResponse.ok) {
        const data = await historiaResponse.json();
        if (data.success && data.data) {
          historiaClinica = data.data;
        }
      }

      // Cargar tratamientos asignados del paciente
      const tratamientosResponse = await fetch(`${apiUrl}/api/tratamientos/paciente/${paciente.id_paciente}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let tratamientosAsignados = [];
      if (tratamientosResponse.ok) {
        const data = await tratamientosResponse.json();
        console.log('Datos de tratamientos recibidos:', data);
        if (data.success && data.data) {
          console.log('Tratamientos encontrados:', data.data);
          // Mostrar todos los tratamientos primero para depurar
          tratamientosAsignados = data.data;
          console.log('Todos los tratamientos:', tratamientosAsignados);
          // Comentamos el filtro temporalmente para ver todos los tratamientos
          // tratamientosAsignados = data.data.filter(tratamiento => tratamiento.estado === 'activo');
          // console.log('Tratamientos activos filtrados:', tratamientosAsignados);
        }
      } else {
        console.error('Error en la respuesta de tratamientos:', tratamientosResponse.status);
      }

      setPacienteSeleccionado({
        paciente: paciente,
        historiaClinica: historiaClinica,
        tratamientosAsignados: tratamientosAsignados
      });
      console.log('Paciente seleccionado con tratamientos:', {
        paciente: paciente,
        historiaClinica: historiaClinica,
        tratamientosAsignados: tratamientosAsignados
      });
    } catch (error) {
      console.error('Error al cargar paciente:', error);
      setError('Error al cargar la información del paciente');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para parsear datos concatenados de historia clínica
  const parsearAntecedentes = (antecedentesStr) => {
    if (!antecedentesStr) return 'No especificado';
    const antecedentes = [];
    if (antecedentesStr.includes('diabetes')) antecedentes.push('Diabetes');
    if (antecedentesStr.includes('alergia')) antecedentes.push('Alergia');
    if (antecedentesStr.includes('cancer')) antecedentes.push('Cáncer');
    if (antecedentesStr.includes('marcapasos')) antecedentes.push('Marcapasos');
    if (antecedentesStr.includes('protesis')) antecedentes.push('Prótesis');
    if (antecedentesStr.includes('osteomalacia')) antecedentes.push('Osteomalacia');
    if (antecedentesStr.includes('desgarro')) antecedentes.push('Desgarro');
    if (antecedentesStr.includes('cirugias')) antecedentes.push('Cirugías');
    if (antecedentesStr.includes('artritis')) antecedentes.push('Artritis');
    if (antecedentesStr.includes('hernias')) antecedentes.push('Hernias');
    return antecedentes.length > 0 ? antecedentes.join(', ') : 'Ninguno';
  };

  const parsearFaseMarcha = (faseMarchaStr) => {
    if (!faseMarchaStr) return 'No especificado';
    const fases = [];
    if (faseMarchaStr.includes('independiente')) fases.push('Independiente');
    if (faseMarchaStr.includes('silla_ruedas')) fases.push('Silla de ruedas');
    if (faseMarchaStr.includes('con_ayudas')) fases.push('Con ayudas');
    if (faseMarchaStr.includes('camilla')) fases.push('Camilla');
    if (faseMarchaStr.includes('libre')) fases.push('Libre');
    if (faseMarchaStr.includes('claudicante')) fases.push('Claudicante');
    if (faseMarchaStr.includes('con_ayuda')) fases.push('Con ayuda');
    if (faseMarchaStr.includes('espastica')) fases.push('Espástica');
    if (faseMarchaStr.includes('ataxica')) fases.push('Atáxica');
    if (faseMarchaStr.includes('con_antepulsion')) fases.push('Con antepulsión');
    if (faseMarchaStr.includes('con_retropulsion')) fases.push('Con retropulsión');
    if (faseMarchaStr.includes('con_rotacion')) fases.push('Con rotación');
    return fases.length > 0 ? fases.join(', ') : 'No especificado';
  };

  const parsearTraslados = (trasladosStr) => {
    if (!trasladosStr) return 'No especificado';
    return trasladosStr;
  };

  const mostrarIMC = (imc) => {
    if (!imc) return 'No calculado';
    
    const imcNum = parseFloat(imc);
    let clasificacion = '';
    
    if (imcNum < 18.5) {
      clasificacion = ' (Bajo peso)';
    } else if (imcNum >= 18.5 && imcNum < 25) {
      clasificacion = ' (Normal)';
    } else if (imcNum >= 25 && imcNum < 30) {
      clasificacion = ' (Sobrepeso)';
    } else if (imcNum >= 30) {
      clasificacion = ' (Obesidad)';
    }
    
    return `${imc}${clasificacion}`;
  };

  const cerrarFicha = () => {
    setShowFichaModal(false);
    setFichaData(null);
  };

  // Funciones para el manejo de calendario y sesiones
  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const dias = [];
    
    // Agregar días del mes anterior para completar la semana
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const diaAnterior = new Date(año, mes, -i);
      dias.push({
        fecha: diaAnterior,
        enMesActual: false,
        disponible: false
      });
    }
    
    // Agregar días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaDia = new Date(año, mes, dia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaDia.setHours(0, 0, 0, 0);
      
      dias.push({
        fecha: fechaDia,
        enMesActual: true,
        disponible: fechaDia >= hoy, // Solo fechas futuras son disponibles
        tieneReserva: verificarReservaEnFecha(fechaDia)
      });
    }
    
    return dias;
  };

  const verificarReservaEnFecha = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return calendario.sesionesExistentes.some(sesion => 
      sesion.fecha.split('T')[0] === fechaStr
    );
  };

  const seleccionarFecha = (fecha) => {
    if (!fecha.disponible || !fecha.enMesActual) return;
    
    const fechaStr = fecha.fecha.toISOString().split('T')[0];
    const fechasSeleccionadas = [...calendario.fechasSeleccionadas];
    const indiceExistente = fechasSeleccionadas.findIndex(f => f.fecha === fechaStr);
    
    if (indiceExistente >= 0) {
      // Si ya está seleccionada, la removemos
      fechasSeleccionadas.splice(indiceExistente, 1);
    } else {
      // Si no está seleccionada y tenemos espacio, la agregamos
      if (fechasSeleccionadas.length < selectedPackage?.numero_sesiones) {
        fechasSeleccionadas.push({
          fecha: fechaStr,
          hora: '',
          observaciones: ''
        });
      } else {
        alert(`Solo puede seleccionar ${selectedPackage?.numero_sesiones} fechas para este tratamiento`);
        return;
      }
    }
    
    setCalendario(prev => ({
      ...prev,
      fechasSeleccionadas: fechasSeleccionadas
    }));
  };

  const actualizarHoraSesion = (fechaStr, hora) => {
    // Si se selecciona horario personalizado, no hacer validaciones aún
    if (hora === 'personalizado') {
      const fechasActualizadas = calendario.fechasSeleccionadas.map(sesion => 
        sesion.fecha === fechaStr ? { ...sesion, hora } : sesion
      );
      
      setCalendario(prev => ({
        ...prev,
        fechasSeleccionadas: fechasActualizadas
      }));
      return;
    }
    
    // Para horarios regulares (los personalizados ya se manejan directamente)
    if (!hora || hora === 'personalizado') {
      return; // No hacer nada si no hay hora definida o es personalizado
    }
    
    // Verificar conflictos de horario
    const conflicto = verificarConflictoHorario(fechaStr, hora);
    
    if (conflicto.hayConflicto) {
      setError(`${conflicto.mensaje}`);
      return;
    }
    
    setError(''); // Limpiar error si no hay conflicto
    
    const fechasActualizadas = calendario.fechasSeleccionadas.map(sesion => 
      sesion.fecha === fechaStr ? { ...sesion, hora } : sesion
    );
    
    setCalendario(prev => ({
      ...prev,
      fechasSeleccionadas: fechasActualizadas
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

  const cargarSesionesExistentes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/sesiones/calendario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCalendario(prev => ({
          ...prev,
          sesionesExistentes: data.data || []
        }));
      }
    } catch (error) {
      console.error('Error al cargar sesiones existentes:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando pacientes...</div>;
  }

  return (
    <div className="pacientes-container">
      <div className="pacientes-header">
        <h2>Gestión de Pacientes</h2>
        <button 
          className="btn-primary"
          onClick={() => abrirModal('create')}
        >
          Nuevo Paciente
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Buscador de pacientes */}
      <div className="buscador-container">
        <div className="buscador-group">
          <label>Buscar por Documento:</label>
          <input
            type="text"
            name="documento_identidad"
            value={filtros.documento_identidad}
            onChange={handleFiltroChange}
            placeholder="Ingrese documento de identidad"
          />
        </div>
        <div className="buscador-group">
          <label>Buscar por Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={filtros.nombre}
            onChange={handleFiltroChange}
            placeholder="Ingrese nombre o apellido"
          />
        </div>
      </div>

      {/* Lista de resultados de búsqueda */}
      {(filtros.documento_identidad || filtros.nombre) && (
        <div className="resultados-busqueda">
          <h3>Resultados de búsqueda:</h3>
          {pacientesFiltrados.length === 0 ? (
            <div className="no-data">No se encontraron pacientes</div>
          ) : (
            <div className="lista-resultados">
              {pacientesFiltrados.map(paciente => (
                <div 
                  key={paciente.id_paciente} 
                  className="resultado-item"
                  onClick={() => seleccionarPaciente(paciente)}
                >
                  <div className="resultado-info">
                    <strong>{paciente.nombre} {paciente.apellido}</strong>
                    <span>DNI: {paciente.documento_identidad}</span>
                  </div>
                  <span className="seleccionar-icon">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ficha del paciente seleccionado */}
      {pacienteSeleccionado && (
        <div className="ficha-paciente">
          <div className="ficha-header">
            <h3>Ficha del Paciente</h3>
            <button 
              className="btn-close"
              onClick={() => setPacienteSeleccionado(null)}
            >
              ×
            </button>
          </div>
          
          <div className="ficha-content">
            {/* Tratamientos Asignados */}
            {pacienteSeleccionado.tratamientosAsignados && pacienteSeleccionado.tratamientosAsignados.length > 0 ? (
              <div className="ficha-section tratamientos-pendientes">
                <h4>� Tratamientos Asignados</h4>
                <div className="tratamientos-grid">
                  {pacienteSeleccionado.tratamientosAsignados.map(tratamiento => (
                    <div key={tratamiento.id_tratamiento_asignado} className="tratamiento-item">
                      <div className="tratamiento-header">
                        <h5>{tratamiento.paquete_nombre}</h5>
                        <span className="badge-asignado">ASIGNADO</span>
                      </div>
                      <div className="tratamiento-details">
                        <div className="tratamiento-info">
                          <label>Fecha de asignación:</label>
                          <span>{new Date(tratamiento.fecha_asignacion).toLocaleDateString()}</span>
                        </div>
                        <div className="tratamiento-info">
                          <label>Número de sesiones:</label>
                          <span>{tratamiento.numero_sesiones}</span>
                        </div>
                        <div className="tratamiento-info">
                          <label>Precio:</label>
                          <span>S/ {tratamiento.precio}</span>
                        </div>
                        {tratamiento.observaciones && (
                          <div className="tratamiento-info">
                            <label>Observaciones:</label>
                            <p>{tratamiento.observaciones}</p>
                          </div>
                        )}
                      </div>
                      <div className="tratamiento-actions">
                        <button 
                          className="btn-seguimiento"
                          onClick={() => navigate(`/dashboard/sesiones/${tratamiento.id_tratamiento_asignado}`)}
                        >
                          Gestionar Sesiones
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-tratamientos">
                <h4>Sin Tratamientos Asignados</h4>
                <p>Este paciente no tiene tratamientos asignados.</p>
              </div>
            )}

            <div className="ficha-grid">
              {/* Información Personal */}
              <div className="ficha-section">
                <h4>Información Personal</h4>
                <div className="ficha-item">
                  <label>Nombre completo:</label>
                  <p>{pacienteSeleccionado.paciente.nombre} {pacienteSeleccionado.paciente.apellido}</p>
                </div>
                <div className="ficha-item">
                  <label>Documento:</label>
                  <p>{pacienteSeleccionado.paciente.documento_identidad} ({pacienteSeleccionado.paciente.tipo_documento})</p>
                </div>
                <div className="ficha-item">
                  <label>Sexo:</label>
                  <p>{pacienteSeleccionado.paciente.sexo}</p>
                </div>
                <div className="ficha-item">
                  <label>Fecha de nacimiento:</label>
                  <p>{pacienteSeleccionado.paciente.fecha_nacimiento 
                    ? new Date(pacienteSeleccionado.paciente.fecha_nacimiento).toLocaleDateString()
                    : 'No especificada'}</p>
                </div>
                <div className="ficha-item">
                  <label>Estado civil:</label>
                  <p>{pacienteSeleccionado.paciente.estado_civil || 'No especificado'}</p>
                </div>
                <div className="ficha-item">
                  <label>Ocupación:</label>
                  <p>{pacienteSeleccionado.paciente.ocupacion || 'No especificada'}</p>
                </div>
                <div className="ficha-item">
                  <label>Nacionalidad:</label>
                  <p>{pacienteSeleccionado.paciente.nacionalidad || 'No especificada'}</p>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="ficha-section">
                <h4>Información de Contacto</h4>
                <div className="ficha-item">
                  <label>Email:</label>
                  <p>{pacienteSeleccionado.paciente.email || 'No especificado'}</p>
                </div>
                <div className="ficha-item">
                  <label>Teléfono:</label>
                  <p>{pacienteSeleccionado.paciente.telefono || 'No especificado'}</p>
                </div>
                <div className="ficha-item">
                  <label>Domicilio:</label>
                  <p>{pacienteSeleccionado.paciente.domicilio || 'No especificado'}</p>
                </div>
                <div className="ficha-item">
                  <label>Contacto de emergencia:</label>
                  <p>{pacienteSeleccionado.paciente.contacto_emergencia_nombre || 'No especificado'}</p>
                </div>
                <div className="ficha-item">
                  <label>Teléfono de emergencia:</label>
                  <p>{pacienteSeleccionado.paciente.contacto_emergencia_telefono || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {/* Historia Clínica */}
            {pacienteSeleccionado.historiaClinica && (
              <div className="ficha-section historia-section">
                <h4>Historia Clínica</h4>
                <div className="historia-grid">
                  <div className="historia-item">
                    <label>Peso (kg):</label>
                    <p>{pacienteSeleccionado.historiaClinica.peso || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Talla (cm):</label>
                    <p>{pacienteSeleccionado.historiaClinica.talla || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>IMC (kg/m²):</label>
                    <p>{mostrarIMC(pacienteSeleccionado.historiaClinica.imc)}</p>
                  </div>
                  <div className="historia-item">
                    <label>Motivo de consulta:</label>
                    <p>{pacienteSeleccionado.historiaClinica.motivo_consulta || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Diagnóstico médico:</label>
                    <p>{pacienteSeleccionado.historiaClinica.diagnostico_medico_rehabilitacion || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Tratamientos previos:</label>
                    <p>{pacienteSeleccionado.historiaClinica.tratamientos_previos || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Antecedentes patológicos:</label>
                    <p>{parsearAntecedentes(pacienteSeleccionado.historiaClinica.antecedentes_patologicos)}</p>
                  </div>
                  <div className="historia-item">
                    <label>Rasgos:</label>
                    <p>{pacienteSeleccionado.historiaClinica.rasgos || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Cicatriz quirúrgica:</label>
                    <p>{pacienteSeleccionado.historiaClinica.cicatriz_quirurgica || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Traslados:</label>
                    <p>{parsearTraslados(pacienteSeleccionado.historiaClinica.traslados)}</p>
                  </div>
                  <div className="historia-item">
                    <label>Fase de marcha:</label>
                    <p>{parsearFaseMarcha(pacienteSeleccionado.historiaClinica.fase_marcha)}</p>
                  </div>
                  <div className="historia-item">
                    <label>Temperatura (°C):</label>
                    <p>{pacienteSeleccionado.historiaClinica.temperatura || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Frecuencia cardíaca (bpm):</label>
                    <p>{pacienteSeleccionado.historiaClinica.f_cardiaca || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Frecuencia respiratoria (rpm):</label>
                    <p>{pacienteSeleccionado.historiaClinica.f_respiratoria || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Pulso (bpm):</label>
                    <p>{pacienteSeleccionado.historiaClinica.pulso || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Oxigenación (%):</label>
                    <p>{pacienteSeleccionado.historiaClinica.oxigenacion || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Escala de dolor (0-10):</label>
                    <p>{pacienteSeleccionado.historiaClinica.escala_dolor || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Hábitos de salud:</label>
                    <p>{pacienteSeleccionado.historiaClinica.habitos_salud || 'No especificado'}</p>
                  </div>
                  <div className="historia-item">
                    <label>Estado de ingravidez:</label>
                    <p>{pacienteSeleccionado.historiaClinica.estado_ingravidez || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="ficha-actions">
              <button 
                className="btn-edit"
                onClick={() => abrirModal('edit', pacienteSeleccionado.paciente)}
              >
                Editar Paciente
              </button>
              <button 
                className="btn-historia"
                onClick={() => abrirHistoriaClinica(pacienteSeleccionado.paciente.id_paciente)}
              >
                {pacienteSeleccionado.historiaClinica ? 'Editar Historia Clínica' : 'Crear Historia Clínica'}
              </button>
              <button 
                className="btn-asignar"
                onClick={() => abrirAsignacionTratamiento(pacienteSeleccionado.paciente)}
              >
                Asignar Tratamiento
              </button>
              <button 
                className="btn-delete"
                onClick={() => eliminarPaciente(pacienteSeleccionado.paciente.id_paciente)}
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Nuevo Paciente' : 'Editar Paciente'}</h3>
              <button className="btn-close" onClick={cerrarModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-note">
                <p><span className="required-asterisk">*</span> Campos obligatorios</p>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellido <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Documento de Identidad <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Documento <span className="required-asterisk">*</span></label>
                  <select
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Carnet de Extranjería">Carnet de Extranjería</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sexo <span className="required-asterisk">*</span></label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Nacimiento <span className="required-asterisk">*</span></label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email (opcional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono <span className="required-asterisk">*</span></label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Domicilio (opcional)</label>
                <textarea
                  name="domicilio"
                  value={formData.domicilio}
                  onChange={handleFormChange}
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estado Civil (opcional)</label>
                  <select
                    name="estado_civil"
                    value={formData.estado_civil}
                    onChange={handleFormChange}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Soltero">Soltero</option>
                    <option value="Casado">Casado</option>
                    <option value="Divorciado">Divorciado</option>
                    <option value="Viudo">Viudo</option>
                    <option value="Conviviente">Conviviente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ocupación (opcional)</label>
                  <input
                    type="text"
                    name="ocupacion"
                    value={formData.ocupacion}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nacionalidad <span className="required-asterisk">*</span></label>
                <input
                  type="text"
                  name="nacionalidad"
                  value={formData.nacionalidad}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contacto de Emergencia <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    name="contacto_emergencia_nombre"
                    value={formData.contacto_emergencia_nombre}
                    onChange={handleFormChange}
                    placeholder="Nombre del contacto"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono de Emergencia <span className="required-asterisk">*</span></label>
                  <input
                    type="tel"
                    name="contacto_emergencia_telefono"
                    value={formData.contacto_emergencia_telefono}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historia Clínica */}
      {showHistoriaModal && (
        <div className="modal-overlay">
          <div className="modal historia-modal">
            <HistoriaClinica
              pacienteId={pacienteIdForHistoria}
              onClose={cerrarHistoriaClinica}
              onSave={handleHistoriaGuardada}
            />
          </div>
        </div>
      )}

      {/* Modal Ficha Completa */}
      {showFichaModal && fichaData && (
        <div className="modal-overlay">
          <div className="modal ficha-modal">
            <div className="modal-header">
              <h3>Ficha Completa - {fichaData.paciente.nombre} {fichaData.paciente.apellido}</h3>
              <button className="btn-close" onClick={cerrarFicha}>×</button>
            </div>
            <div className="modal-body ficha-content">
              {/* Datos del Paciente */}
              <div className="ficha-section">
                <h4>Datos del Paciente</h4>
                <div className="ficha-grid">
                  <div className="ficha-item">
                    <label>Nombre completo:</label>
                    <span>{fichaData.paciente.nombre} {fichaData.paciente.apellido}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Documento:</label>
                    <span>{fichaData.paciente.documento_identidad} ({fichaData.paciente.tipo_documento})</span>
                  </div>
                  <div className="ficha-item">
                    <label>Sexo:</label>
                    <span>{fichaData.paciente.sexo}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Fecha de nacimiento:</label>
                    <span>{fichaData.paciente.fecha_nacimiento ? new Date(fichaData.paciente.fecha_nacimiento).toLocaleDateString() : 'No especificada'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Edad:</label>
                    <span>
                      {fichaData.paciente.fecha_nacimiento ? 
                        Math.floor((new Date() - new Date(fichaData.paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) + ' años'
                        : 'No calculable'
                      }
                    </span>
                  </div>
                  <div className="ficha-item">
                    <label>Domicilio:</label>
                    <span>{fichaData.paciente.domicilio || 'No especificado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Teléfono:</label>
                    <span>{fichaData.paciente.telefono}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Email:</label>
                    <span>{fichaData.paciente.email || 'No especificado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Estado civil:</label>
                    <span>{fichaData.paciente.estado_civil || 'No especificado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Ocupación:</label>
                    <span>{fichaData.paciente.ocupacion || 'No especificada'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Nacionalidad:</label>
                    <span>{fichaData.paciente.nacionalidad}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Contacto de emergencia:</label>
                    <span>{fichaData.paciente.contacto_emergencia_nombre || 'No especificado'}</span>
                  </div>
                  <div className="ficha-item">
                    <label>Teléfono de emergencia:</label>
                    <span>{fichaData.paciente.contacto_emergencia_telefono || 'No especificado'}</span>
                  </div>
                </div>
              </div>

              {/* Historia Clínica */}
              <div className="ficha-section">
                <h4>Historia Clínica</h4>
                {fichaData.historiaClinica ? (
                  <div className="historia-content">
                    <div className="ficha-grid">
                      <div className="ficha-item">
                        <label>Peso:</label>
                        <span>{fichaData.historiaClinica.peso ? `${fichaData.historiaClinica.peso} kg` : 'No registrado'}</span>
                      </div>
                      <div className="ficha-item">
                        <label>Talla:</label>
                        <span>{fichaData.historiaClinica.talla ? `${fichaData.historiaClinica.talla} m` : 'No registrado'}</span>
                      </div>
                      <div className="ficha-item">
                        <label>IMC:</label>
                        <span>{fichaData.historiaClinica.imc ? fichaData.historiaClinica.imc : 'No calculado'}</span>
                      </div>
                    </div>
                    
                    <div className="ficha-text-item">
                      <label>Motivo de consulta:</label>
                      <p>{fichaData.historiaClinica.motivo_consulta}</p>
                    </div>
                    
                    {fichaData.historiaClinica.rasgos && (
                      <div className="ficha-text-item">
                        <label>Rasgos:</label>
                        <p>{fichaData.historiaClinica.rasgos}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.tratamientos_previos && (
                      <div className="ficha-text-item">
                        <label>Tratamientos previos:</label>
                        <p>{fichaData.historiaClinica.tratamientos_previos}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.antecedentes_patologicos && (
                      <div className="ficha-text-item">
                        <label>Antecedentes patológicos:</label>
                        <p>{fichaData.historiaClinica.antecedentes_patologicos}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.habitos_salud && (
                      <div className="ficha-text-item">
                        <label>Hábitos de salud:</label>
                        <p>{fichaData.historiaClinica.habitos_salud}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.estado_ingravidez && (
                      <div className="ficha-text-item">
                        <label>Estado de ingravidez:</label>
                        <p>{fichaData.historiaClinica.estado_ingravidez}</p>
                      </div>
                    )}
                    
                    {/* Signos vitales */}
                    {(fichaData.historiaClinica.temperatura || fichaData.historiaClinica.f_cardiaca || 
                      fichaData.historiaClinica.f_respiratoria || fichaData.historiaClinica.pulso || 
                      fichaData.historiaClinica.oxigenacion) && (
                      <div className="ficha-subsection">
                        <h5>Signos vitales</h5>
                        <div className="ficha-grid">
                          {fichaData.historiaClinica.temperatura && (
                            <div className="ficha-item">
                              <label>Temperatura:</label>
                              <span>{fichaData.historiaClinica.temperatura}°C</span>
                            </div>
                          )}
                          {fichaData.historiaClinica.f_cardiaca && (
                            <div className="ficha-item">
                              <label>F. Cardiaca:</label>
                              <span>{fichaData.historiaClinica.f_cardiaca} bpm</span>
                            </div>
                          )}
                          {fichaData.historiaClinica.f_respiratoria && (
                            <div className="ficha-item">
                              <label>F. Respiratoria:</label>
                              <span>{fichaData.historiaClinica.f_respiratoria} rpm</span>
                            </div>
                          )}
                          {fichaData.historiaClinica.pulso && (
                            <div className="ficha-item">
                              <label>Pulso:</label>
                              <span>{fichaData.historiaClinica.pulso}</span>
                            </div>
                          )}
                          {fichaData.historiaClinica.oxigenacion && (
                            <div className="ficha-item">
                              <label>Oxigenación:</label>
                              <span>{fichaData.historiaClinica.oxigenacion}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.escala_dolor && (
                      <div className="ficha-item">
                        <label>Escala de dolor:</label>
                        <span>{fichaData.historiaClinica.escala_dolor}/10</span>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.diagnostico_medico_rehabilitacion && (
                      <div className="ficha-text-item">
                        <label>Diagnóstico médico en rehabilitación:</label>
                        <p>{fichaData.historiaClinica.diagnostico_medico_rehabilitacion}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.traslados && (
                      <div className="ficha-text-item">
                        <label>Traslados:</label>
                        <p>{fichaData.historiaClinica.traslados}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.fase_marcha && (
                      <div className="ficha-text-item">
                        <label>Fase de marcha:</label>
                        <p>{fichaData.historiaClinica.fase_marcha}</p>
                      </div>
                    )}
                    
                    {fichaData.historiaClinica.cicatriz_quirurgica && (
                      <div className="ficha-text-item">
                        <label>Cicatriz quirúrgica:</label>
                        <p>{fichaData.historiaClinica.cicatriz_quirurgica}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="no-historia">No se ha registrado historia clínica para este paciente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asignación de Tratamiento */}
      {showAsignacionModal && (
        <div className="modal-overlay" onClick={cerrarModalAsignacion}>
          <div className="asignacion-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asignacion-header">
              <h3>
                {currentStep === 1 ? 'Asignar Tratamiento - Paso 1/2' : 'Programar Sesiones - Paso 2/2'}
              </h3>
              <button 
                className="btn-close"
                onClick={cerrarModalAsignacion}
              >
                ×
              </button>
            </div>
            
            <div className="asignacion-content">
              {/* Indicador de pasos */}
              <div className="steps-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Seleccionar Paquete</span>
                </div>
                <div className="step-separator"></div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Programar Sesiones</span>
                </div>
              </div>

              <form onSubmit={handleAsignacionSubmit}>
                <div className="form-note">
                  <p><span className="required-asterisk">*</span> Campos obligatorios</p>
                </div>
                
                <div className="paciente-info-section">
                  <h4>Información del Paciente</h4>
                  <div className="paciente-info-grid">
                    <div className="info-item">
                      <label>Nombre completo:</label>
                      <span>{selectedPaciente?.nombre} {selectedPaciente?.apellido}</span>
                    </div>
                    <div className="info-item">
                      <label>Documento:</label>
                      <span>{selectedPaciente?.documento_identidad}</span>
                    </div>
                  </div>
                </div>
                
                {/* PASO 1: Selección del paquete */}
                {currentStep === 1 && (
                  <div className="form-section">
                    <h4>Detalles del Tratamiento</h4>
                    <div className="form-group">
                      <label>Paquete de Tratamiento <span className="required-asterisk">*</span></label>
                      <select 
                        className="form-control"
                        name="paquete_id"
                        value={asignacionData.paquete_id}
                        onChange={handleAsignacionChange}
                        required
                      >
                        <option value="">
                          {paquetesTratamiento.length === 0 ? 'Cargando paquetes...' : 'Seleccionar paquete...'}
                        </option>
                        {paquetesTratamiento.map(paquete => (
                          <option key={paquete.id_paquete} value={paquete.id_paquete}>
                            {paquete.nombre} - {paquete.numero_sesiones} sesiones - S/. {paquete.precio}
                          </option>
                        ))}
                      </select>
                      {selectedPackage && (
                        <div className="package-info">
                          <p><strong>Descripción:</strong> {selectedPackage.descripcion}</p>
                          <p><strong>Duración por sesión:</strong> {selectedPackage.duracion_sesion} minutos</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Observaciones:</label>
                      <textarea 
                        className="form-control"
                        name="observaciones"
                        value={asignacionData.observaciones}
                        onChange={handleAsignacionChange}
                        rows="4"
                        placeholder="Observaciones adicionales sobre el tratamiento..."
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* PASO 2: Programación de sesiones */}
                {currentStep === 2 && selectedPackage && (
                  <div className="form-section">
                    <h4>Programar {selectedPackage.numero_sesiones} Sesiones</h4>
                    <p className="programming-info">
                      Seleccione {selectedPackage.numero_sesiones} fechas y horarios para las sesiones del tratamiento: <strong>{selectedPackage.nombre}</strong>
                    </p>
                    
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
                          const estaSeleccionada = calendario.fechasSeleccionadas.some(s => s.fecha === fechaStr);
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

                    {/* Lista de sesiones seleccionadas */}
                    {calendario.fechasSeleccionadas.length > 0 && (
                      <div className="sessions-list">
                        <h5>Sesiones programadas ({calendario.fechasSeleccionadas.length}/{selectedPackage.numero_sesiones})</h5>
                        {calendario.fechasSeleccionadas.map((sesion, index) => (
                          <div key={sesion.fecha} className="session-item">
                            <div className="session-date">
                              <strong>Sesión {index + 1}:</strong> {new Date(sesion.fecha).toLocaleDateString('es-ES')}
                            </div>
                            
                            <div className="session-time-inline">
                              <label>Horario <span className="required-asterisk">*</span></label>
                              <select 
                                value={sesion.hora} 
                                onChange={(e) => actualizarHoraSesion(sesion.fecha, e.target.value)}
                                className={`form-control-inline ${obtenerDensidadFecha(new Date(sesion.fecha)).bloqueada ? 'selector-bloqueado' : ''}`}
                                required
                                disabled={obtenerDensidadFecha(new Date(sesion.fecha)).bloqueada}
                              >
                                <option value="">
                                  {obtenerDensidadFecha(new Date(sesion.fecha)).bloqueada 
                                    ? 'Día completo - Sin horarios disponibles' 
                                    : 'Seleccionar horario'}
                                </option>
                                {!obtenerDensidadFecha(new Date(sesion.fecha)).bloqueada && horariosDisponibles.map(hora => {
                                  const bloqueado = estaHorarioBloqueado(sesion.fecha, hora);
                                  const duracionTratamiento = obtenerDuracionTratamiento();
                                  const horaFin = calcularHoraFin(hora, duracionTratamiento);
                                  
                                  let backgroundColor = 'white';
                                  let color = 'black';
                                  let texto = `${hora} - ${horaFin}`;
                                  
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
                                {/* Opción para horario personalizado si el tratamiento dura más de 30 minutos */}
                                {obtenerDuracionTratamiento() > 30 && (
                                  <option value="personalizado">
                                    Horario personalizado
                                  </option>
                                )}
                              </select>
                              
                              {/* Input para horario personalizado */}
                              {sesion.hora === 'personalizado' && (
                                <div className="horario-personalizado">
                                  <label>Hora específica:</label>
                                  <input
                                    type="time"
                                    min="08:00"
                                    max="18:00"
                                    step="300" // 5 minutos
                                    value={sesion.hora_personalizada || ''}
                                    onChange={(e) => {
                                      aplicarHorarioPersonalizado(sesion.fecha, e.target.value);
                                    }}
                                    className="form-control-small"
                                    placeholder="HH:MM"
                                  />
                                  <small className="help-text">
                                    Duración: {obtenerDuracionTratamiento()} minutos 
                                    (hasta {sesion.hora_personalizada ? 
                                      calcularHoraFin(sesion.hora_personalizada, obtenerDuracionTratamiento()) : 
                                      '--:--'})
                                  </small>
                                </div>
                              )}
                              
                              {obtenerDensidadFecha(new Date(sesion.fecha)).bloqueada && (
                                <div className="warning-message">
                                  Este día ya tiene el máximo de 8 sesiones permitidas
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                    onClick={currentStep === 1 ? cerrarModalAsignacion : volverAPaso1}
                  >
                    {currentStep === 1 ? 'Cancelar' : '← Volver'}
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : (currentStep === 1 ? 'Siguiente →' : 'Asignar y Programar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historia Clínica */}
      {showHistoriaModal && (
        <div className="modal-overlay">
          <HistoriaClinica
            pacienteId={pacienteIdForHistoria}
            onClose={cerrarHistoriaClinica}
            onSave={handleHistoriaGuardada}
          />
        </div>
      )}
    </div>
  );
};

export default Pacientes;