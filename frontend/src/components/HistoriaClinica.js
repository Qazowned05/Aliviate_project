import React, { useState, useEffect } from 'react';
import './HistoriaClinica.css';

const getApiUrl = () => {

  if (window.location.hostname === 'localhost' && window.location.port === '3001') {
    return 'http://localhost:3000';
  }
  return ''; 
};

const HistoriaClinica = ({ pacienteId, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historiaExists, setHistoriaExists] = useState(false);
  
  const [formData, setFormData] = useState({
    peso: '',
    talla: '',
    imc: '',
    rasgos: '',
    motivo_consulta: '',
    tratamientos_previos: '',
    
    diabetes: false,
    alergia: false,
    cancer: false,
    marcapasos: false,
    protesis: false,
    osteomalacia: false,
    desgarro: false,
    cirugias: false,
    artritis: false,
    hernias: false,
    
    encames: '',
    escoliosis: '',
    luxaciones: '',
    espasmos: '',
    contracturas: '',
    marcas: '',
    temperatura: '',
    f_cardiaca: '',
    f_respiratoria: '',
    pulso: '',
    oxigenacion: '',
    
    fuma: '',
    bebe: '',
    medicamentos: '',
    pasatiempos: '',
    cuantos_meses: '',
    cuantos_hijos: '',
    lleva_control: '',
    
    embarazada: '',
    
    reflejos: '',
    sensibilidad: '',
    lenguaje: '',
    otros_diagnostico: '',
    
    cicatriz_sitio: '',
    queloide: '',
    retractil: '',
    abierta: '',
    
    independiente: false,
    silla_ruedas: false,
    con_ayudas: false,
    camilla: false,
    
    libre: false,
    claudicante: false,
    con_ayuda_marcha: false,
    espastica: false,  
    ataxica: false,
    con_antepulsion: false,
    con_retropulsion: false,
    con_rotacion: false,
    
    escala_dolor: '',
    
    consume_cigarrillo: '',
    cantidad_cigarrillo: '',
    consume_alcohol: '',
    cantidad_alcohol: '',
    consume_drogas: '',
    cuales_drogas: '',
    consume_cafe: '',
    cantidad_cafe: '',
    practica_ejercicio: '',
    cual_ejercicio: '',
    duerme_bien: '',
    horas_sueno: '',
    
    temperatura_embarazo: '',
    f_cardiaca_embarazo: '',
    f_respiratoria_embarazo: '',
    pulso_embarazo: '',
    oxigenacion_embarazo: '',
    
    hta: false,
    fiebre: false,
    fracturas: false,
    osteosintesis: false,
    desgarros: false,
    artrosis: false,
    accidentes: false,
    
    en_sitio: false,
    con_adherencia: false,
    queloide: false,
    sin_adherencia: false,
    retractil: false,
    hipertrofica: false,
    abierta: false,
    con_inflamacion: false
  });

  useEffect(() => {
    if (pacienteId) {
      cargarHistoriaClinica();
    }
  }, [pacienteId]);

  const cargarHistoriaClinica = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/historias/paciente/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setHistoriaExists(true);
          const historia = data.data;
          
          const parsearAntecedentes = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            return {
              diabetes: items.includes('diabetes'),
              alergia: items.includes('alergia'),
              cancer: items.includes('cancer'),
              marcapasos: items.includes('marcapasos'),
              protesis: items.includes('protesis'),
              osteomalacia: items.includes('osteomalacia'),
              desgarro: items.includes('desgarro'),
              cirugias: items.includes('cirugias'),
              artritis: items.includes('artritis'),
              hernias: items.includes('hernias'),
              hta: items.includes('hta'),
              fiebre: items.includes('fiebre'),
              fracturas: items.includes('fracturas'),
              osteosintesis: items.includes('osteosintesis'),
              desgarros: items.includes('desgarros'),
              artrosis: items.includes('artrosis'),
              accidentes: items.includes('accidentes')
            };
          };

          const parsearHabitos = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            const resultado = {
              consume_cigarrillo: '', cantidad_cigarrillo: '',
              consume_alcohol: '', cantidad_alcohol: '',
              consume_drogas: '', cuales_drogas: '',
              consume_cafe: '', cantidad_cafe: '',
              practica_ejercicio: '', cual_ejercicio: '',
              duerme_bien: '', horas_sueno: ''
            };

            items.forEach(item => {
              if (item.includes('cigarrillo:')) {
                resultado.consume_cigarrillo = 'SI';
                resultado.cantidad_cigarrillo = item.split(':')[1]?.trim() || '';
              }
              if (item.includes('alcohol:')) {
                resultado.consume_alcohol = 'SI';
                resultado.cantidad_alcohol = item.split(':')[1]?.trim() || '';
              }
              if (item.includes('drogas:')) {
                resultado.consume_drogas = 'SI';
                resultado.cuales_drogas = item.split(':')[1]?.trim() || '';
              }
              if (item.includes('cafe:')) {
                resultado.consume_cafe = 'SI';
                resultado.cantidad_cafe = item.split(':')[1]?.trim() || '';
              }
              if (item.includes('ejercicio:')) {
                resultado.practica_ejercicio = 'SI';
                resultado.cual_ejercicio = item.split(':')[1]?.trim() || '';
              }
              if (item.includes('sueño:')) {
                resultado.duerme_bien = 'NO';
                resultado.horas_sueno = item.split(':')[1]?.trim() || '';
              }
            });

            return resultado;
          };

          const parsearEstadoIngravidez = (texto) => {
            if (!texto) return {};
            const resultado = {
              embarazada: '', cuantos_meses: '', cuantos_hijos: '', lleva_control: '',
              temperatura_embarazo: '', f_cardiaca_embarazo: '', f_respiratoria_embarazo: '',
              pulso_embarazo: '', oxigenacion_embarazo: ''
            };

            if (texto.includes('embarazada: NO_APLICA')) {
              resultado.embarazada = 'NO_APLICA';
            } else if (texto.includes('embarazada: NO')) {
              resultado.embarazada = 'NO';
            } else if (texto.includes('embarazada: SI')) {
              resultado.embarazada = 'SI';
              const items = texto.split('/');
              items.forEach(item => {
                if (item.includes('meses:')) resultado.cuantos_meses = item.split(':')[1]?.trim() || '';
                if (item.includes('hijos:')) resultado.cuantos_hijos = item.split(':')[1]?.trim() || '';
                if (item.includes('control:')) resultado.lleva_control = item.split(':')[1]?.trim() || '';
                if (item.includes('temp:')) resultado.temperatura_embarazo = item.split(':')[1]?.trim() || '';
                if (item.includes('fc:')) resultado.f_cardiaca_embarazo = item.split(':')[1]?.trim() || '';
                if (item.includes('fr:')) resultado.f_respiratoria_embarazo = item.split(':')[1]?.trim() || '';
                if (item.includes('pulso:')) resultado.pulso_embarazo = item.split(':')[1]?.trim() || '';
                if (item.includes('ox:')) resultado.oxigenacion_embarazo = item.split(':')[1]?.trim() || '';
              });
            }

            return resultado;
          };

          const parsearTraslados = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            return {
              independiente: items.includes('independiente'),
              silla_ruedas: items.includes('silla_ruedas'),
              con_ayudas: items.includes('con_ayudas'),
              camilla: items.includes('camilla')
            };
          };

          const parsearFaseMarcha = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            return {
              libre: items.includes('libre'),
              claudicante: items.includes('claudicante'),
              con_ayuda_marcha: items.includes('con_ayuda'),
              espastica: items.includes('espastica'),
              ataxica: items.includes('ataxica'),
              con_antepulsion: items.includes('con_antepulsion'),
              con_retropulsion: items.includes('con_retropulsion'),
              con_rotacion: items.includes('con_rotacion')
            };
          };

          const parsearCicatrizQuirurgica = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            const resultado = {
              cicatriz_sitio: '', en_sitio: false, con_adherencia: false,
              sin_adherencia: false, queloide: false, retractil: false,
              abierta: false, hipertrofica: false, con_inflamacion: false
            };

            items.forEach(item => {
              if (item.includes('sitio:')) {
                resultado.cicatriz_sitio = item.split(':')[1]?.trim() || '';
              } else {
                resultado[item.trim()] = true;
              }
            });

            return resultado;
          };

          const parsearDiagnostico = (texto) => {
            if (!texto) return {};
            const items = texto.split('/');
            const resultado = {
              reflejos: '', sensibilidad: '', lenguaje: '', otros_diagnostico: ''
            };

            items.forEach(item => {
              if (item.includes('reflejos:')) resultado.reflejos = item.split(':')[1]?.trim() || '';
              if (item.includes('sensibilidad:')) resultado.sensibilidad = item.split(':')[1]?.trim() || '';
              if (item.includes('lenguaje:')) resultado.lenguaje = item.split(':')[1]?.trim() || '';
              if (item.includes('otros:')) resultado.otros_diagnostico = item.split(':')[1]?.trim() || '';
            });

            return resultado;
          };

          const antecedentes = parsearAntecedentes(historia.antecedentes_patologicos);
          const habitos = parsearHabitos(historia.habitos_salud);
          const estadoIngravidez = parsearEstadoIngravidez(historia.estado_ingravidez);
          const traslados = parsearTraslados(historia.traslados);
          const faseMarcha = parsearFaseMarcha(historia.fase_marcha);
          const cicatrizQuirurgica = parsearCicatrizQuirurgica(historia.cicatriz_quirurgica);
          const diagnostico = parsearDiagnostico(historia.diagnostico_medico_rehabilitacion);

          setFormData({
            peso: historia.peso || '',
            talla: historia.talla || '',
            imc: historia.imc || '',
            rasgos: historia.rasgos || '',
            motivo_consulta: historia.motivo_consulta || '',
            tratamientos_previos: historia.tratamientos_previos || '',
            
            ...antecedentes,
            
            temperatura: historia.temperatura || '',
            f_cardiaca: historia.f_cardiaca || '',
            f_respiratoria: historia.f_respiratoria || '',
            pulso: historia.pulso || '',
            oxigenacion: historia.oxigenacion || '',
            escala_dolor: historia.escala_dolor || '',
            
            ...habitos,
            
            ...estadoIngravidez,
            
            ...diagnostico,
            
            ...traslados,
            
            ...faseMarcha,
            
            ...cicatrizQuirurgica,
            
            encames: '',
            escoliosis: '',
            luxaciones: '',
            espasmos: '',
            contracturas: '',
            marcas: '',
            fuma: '',
            bebe: '',
            medicamentos: '',
            pasatiempos: ''
          });
          
          if (!historia.imc && historia.peso && historia.talla) {
            const peso = parseFloat(historia.peso);
            const talla = parseFloat(historia.talla);
            if (peso && talla && talla > 0) {
              const imcCalculado = (peso / (talla * talla)).toFixed(2);
              setFormData(prev => ({
                ...prev,
                imc: imcCalculado
              }));
            }
          }
        } else {
          setHistoriaExists(false);
        }
      } else if (response.status === 404) {
        setHistoriaExists(false);
      } else {
        setError('Error al cargar historia clínica');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (name === 'embarazada' && (value === 'NO' || value === 'NO_APLICA')) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cuantos_meses: '',
        cuantos_hijos: '',
        lleva_control: '',
        temperatura_embarazo: '',
        f_cardiaca_embarazo: '',
        f_respiratoria_embarazo: '',
        pulso_embarazo: '',
        oxigenacion_embarazo: ''
      }));
      return;
    }
    
    if (name === 'peso' || name === 'talla') {
      const peso = name === 'peso' ? parseFloat(value) : parseFloat(formData.peso);
      const talla = name === 'talla' ? parseFloat(value) : parseFloat(formData.talla);
      
      if (peso && talla && talla > 0) {
        const imc = (peso / (talla * talla)).toFixed(2);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          imc: imc
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.motivo_consulta || formData.motivo_consulta.trim() === '') {
      setError('El motivo de consulta es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const concatenarAntecedentes = () => {
        const antecedentes = [];
        if (formData.diabetes) antecedentes.push('diabetes');
        if (formData.alergia) antecedentes.push('alergia');
        if (formData.cancer) antecedentes.push('cancer');
        if (formData.marcapasos) antecedentes.push('marcapasos');
        if (formData.protesis) antecedentes.push('protesis');
        if (formData.osteomalacia) antecedentes.push('osteomalacia');
        if (formData.desgarro) antecedentes.push('desgarro');
        if (formData.cirugias) antecedentes.push('cirugias');
        if (formData.artritis) antecedentes.push('artritis');
        if (formData.hernias) antecedentes.push('hernias');
        if (formData.hta) antecedentes.push('hta');
        if (formData.fiebre) antecedentes.push('fiebre');
        if (formData.fracturas) antecedentes.push('fracturas');
        if (formData.osteosintesis) antecedentes.push('osteosintesis');
        if (formData.desgarros) antecedentes.push('desgarros');
        if (formData.artrosis) antecedentes.push('artrosis');
        if (formData.accidentes) antecedentes.push('accidentes');
        return antecedentes.length > 0 ? antecedentes.join('/') : null;
      };

      const concatenarHabitos = () => {
        const habitos = [];
        if (formData.consume_cigarrillo) {
          habitos.push(`cigarrillo: ${formData.consume_cigarrillo}`);
        }
        if (formData.consume_alcohol) {
          habitos.push(`alcohol: ${formData.consume_alcohol}`);
        }
        if (formData.consume_drogas) {
          habitos.push(`drogas: ${formData.consume_drogas}`);
        }
        if (formData.consume_cafe) {
          habitos.push(`cafe: ${formData.consume_cafe}`);
        }
        if (formData.practica_ejercicio) {
          habitos.push(`ejercicio: ${formData.practica_ejercicio}`);
        }
        if (formData.duerme_bien) {
          habitos.push(`duerme bien: ${formData.duerme_bien}`);
        }
        return habitos.length > 0 ? habitos.join('/') : null;
      };

      const concatenarEstadoIngravidez = () => {
        if (formData.embarazada === 'SI') {
          const datos = ['embarazada: SI'];
          if (formData.cuantos_meses) datos.push(`meses: ${formData.cuantos_meses}`);
          if (formData.cuantos_hijos) datos.push(`hijos: ${formData.cuantos_hijos}`);
          if (formData.lleva_control) datos.push(`control: ${formData.lleva_control}`);
          if (formData.temperatura_embarazo) datos.push(`temp: ${formData.temperatura_embarazo}`);
          if (formData.f_cardiaca_embarazo) datos.push(`fc: ${formData.f_cardiaca_embarazo}`);
          if (formData.f_respiratoria_embarazo) datos.push(`fr: ${formData.f_respiratoria_embarazo}`);
          if (formData.pulso_embarazo) datos.push(`pulso: ${formData.pulso_embarazo}`);
          if (formData.oxigenacion_embarazo) datos.push(`ox: ${formData.oxigenacion_embarazo}`);
          return datos.join('/');
        } else if (formData.embarazada === 'NO') {
          return 'embarazada: NO';
        } else if (formData.embarazada === 'NO_APLICA') {
          return 'embarazada: NO_APLICA';
        }
        return null;
      };

      const concatenarTraslados = () => {
        const traslados = [];
        if (formData.independiente) traslados.push('independiente');
        if (formData.silla_ruedas) traslados.push('silla_ruedas');
        if (formData.con_ayudas) traslados.push('con_ayudas');
        if (formData.camilla) traslados.push('camilla');
        return traslados.length > 0 ? traslados.join('/') : null;
      };

      const concatenarFaseMarcha = () => {
        const marcha = [];
        if (formData.libre) marcha.push('libre');
        if (formData.claudicante) marcha.push('claudicante');
        if (formData.con_ayuda_marcha) marcha.push('con_ayuda');
        if (formData.espastica) marcha.push('espastica');
        if (formData.ataxica) marcha.push('ataxica');
        if (formData.con_antepulsion) marcha.push('con_antepulsion');
        if (formData.con_retropulsion) marcha.push('con_retropulsion');
        if (formData.con_rotacion) marcha.push('con_rotacion');
        return marcha.length > 0 ? marcha.join('/') : null;
      };

      const concatenarCicatrizQuirurgica = () => {
        const cicatriz = [];
        if (formData.cicatriz_sitio) cicatriz.push(`sitio: ${formData.cicatriz_sitio}`);
        if (formData.en_sitio) cicatriz.push('en_sitio');
        if (formData.con_adherencia) cicatriz.push('con_adherencia');
        if (formData.sin_adherencia) cicatriz.push('sin_adherencia');
        if (formData.queloide) cicatriz.push('queloide');
        if (formData.retractil) cicatriz.push('retractil');
        if (formData.abierta) cicatriz.push('abierta');
        if (formData.hipertrofica) cicatriz.push('hipertrofica');
        if (formData.con_inflamacion) cicatriz.push('con_inflamacion');
        return cicatriz.length > 0 ? cicatriz.join('/') : null;
      };

      const dataToSend = {
        peso: formData.peso || null,
        talla: formData.talla || null,
        imc: formData.imc || null,
        rasgos: formData.rasgos || null,
        motivo_consulta: formData.motivo_consulta || null,
        tratamientos_previos: formData.tratamientos_previos || null,
        antecedentes_patologicos: concatenarAntecedentes(),
        habitos_salud: concatenarHabitos(),
        estado_ingravidez: concatenarEstadoIngravidez(),
        traslados: concatenarTraslados(),
        fase_marcha: concatenarFaseMarcha(),
        cicatriz_quirurgica: concatenarCicatrizQuirurgica(),
        temperatura: formData.temperatura || null,
        f_cardiaca: formData.f_cardiaca || null,
        f_respiratoria: formData.f_respiratoria || null,
        pulso: formData.pulso || null,
        oxigenacion: formData.oxigenacion || null,
        escala_dolor: formData.escala_dolor || null,
        diagnostico_medico_rehabilitacion: [
          formData.reflejos ? `reflejos: ${formData.reflejos}` : null,
          formData.sensibilidad ? `sensibilidad: ${formData.sensibilidad}` : null,
          formData.lenguaje ? `lenguaje: ${formData.lenguaje}` : null,
          formData.otros_diagnostico ? `otros: ${formData.otros_diagnostico}` : null
        ].filter(Boolean).join('/') || null
      };

      const apiUrl = getApiUrl();
      const url = historiaExists 
        ? `${apiUrl}/api/historias/paciente/${pacienteId}`
        : `${apiUrl}/api/historias/paciente/${pacienteId}`;
      
      const method = historiaExists ? 'PUT' : 'POST';

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
        onSave && onSave();
      } else {
        setError(data.message || 'Error al guardar historia clínica');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="historia-loading">
        <p>Cargando historia clínica...</p>
      </div>
    );
  }

  return (
    <div className="historia-clinica-container">
      <div className="historia-header">
        <h3>{historiaExists ? 'Editar Historia Clínica' : 'Nueva Historia Clínica'}</h3>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="historia-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-note">
          <p><span className="required-asterisk">*</span> Campos obligatorios</p>
        </div>

        {/* Exploración Física */}
        <div className="form-section">
          <h4>Exploración Física</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Peso</label>
              <input
                type="number"
                step="0.01"
                name="peso"
                value={formData.peso}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Talla</label>
              <input
                type="number"
                step="0.01"
                name="talla"
                value={formData.talla}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>IMC</label>
              <input
                type="number"
                step="0.01"
                name="imc"
                value={formData.imc}
                onChange={handleFormChange}
                readOnly
              />
            </div>
          </div>
          <div className="form-group">
            <label>Rasgos</label>
            <textarea
              name="rasgos"
              value={formData.rasgos}
              onChange={handleFormChange}
              rows="2"
            />
          </div>
        </div>

        {/* Motivo de consulta */}
        <div className="form-section">
          <h4>Motivo de consulta<span className="required-asterisk">*</span></h4>
          <div className="form-group"> 
            <textarea
              name="motivo_consulta"
              value={formData.motivo_consulta}
              onChange={handleFormChange}
              rows="3"
              required
            />
          </div>
        </div>

        {/* Tratamientos Previos */}
        <div className="form-section">
          <h4>Tratamientos Previos</h4>
          <div className="form-group">
            <textarea
              name="tratamientos_previos"
              value={formData.tratamientos_previos}
              onChange={handleFormChange}
              rows="3"
            />
          </div>
        </div>

        {/* Antecedentes patológicos y heredofamiliares */}
        <div className="form-section">
          <h4>Antecedentes patológicos y heredofamiliares</h4>
          <div className="antecedentes-grid">
            <div className="antecedentes-column">
              <div className="checkbox-group">
                <label><input type="checkbox" name="diabetes" checked={formData.diabetes} onChange={handleFormChange} /> Diabetes</label>
                <label><input type="checkbox" name="alergia" checked={formData.alergia} onChange={handleFormChange} /> Alergia</label>
                <label><input type="checkbox" name="hta" checked={formData.hta} onChange={handleFormChange} /> HTA</label>
                <label><input type="checkbox" name="cancer" checked={formData.cancer} onChange={handleFormChange} /> Cáncer</label>
                <label><input type="checkbox" name="fiebre" checked={formData.fiebre} onChange={handleFormChange} /> Fiebre</label>
                <label><input type="checkbox" name="marcapasos" checked={formData.marcapasos} onChange={handleFormChange} /> Marcapasos</label>
                <label><input type="checkbox" name="protesis" checked={formData.protesis} onChange={handleFormChange} /> Prótesis</label>
              </div>
            </div>
            <div className="antecedentes-column">
              <div className="checkbox-group">
                <label><input type="checkbox" name="fracturas" checked={formData.fracturas} onChange={handleFormChange} /> Fracturas</label>
                <label><input type="checkbox" name="osteosintesis" checked={formData.osteosintesis} onChange={handleFormChange} /> Osteosíntesis</label>
                <label><input type="checkbox" name="desgarros" checked={formData.desgarros} onChange={handleFormChange} /> Desgarros</label>
                <label><input type="checkbox" name="cirugias" checked={formData.cirugias} onChange={handleFormChange} /> Cirugías</label>
                <label><input type="checkbox" name="artrosis" checked={formData.artrosis} onChange={handleFormChange} /> Artrosis</label>
                <label><input type="checkbox" name="artritis" checked={formData.artritis} onChange={handleFormChange} /> Artritis</label>
                <label><input type="checkbox" name="hernias" checked={formData.hernias} onChange={handleFormChange} /> Hernias</label>
              </div>
            </div>
            <div className="antecedentes-column">
              <div className="checkbox-group">
                <label><input type="checkbox" name="accidentes" checked={formData.accidentes} onChange={handleFormChange} /> Accidentes</label>
                <label><input type="checkbox" name="encames" checked={formData.encames} onChange={handleFormChange} /> Encames</label>
                <label><input type="checkbox" name="escoliosis" checked={formData.escoliosis} onChange={handleFormChange} /> Escoliosis</label>
                <label><input type="checkbox" name="luxaciones" checked={formData.luxaciones} onChange={handleFormChange} /> Luxaciones</label>
                <label><input type="checkbox" name="espasmos" checked={formData.espasmos} onChange={handleFormChange} /> Espasmos</label>
                <label><input type="checkbox" name="contracturas" checked={formData.contracturas} onChange={handleFormChange} /> Contracturas</label>
                <label><input type="checkbox" name="mareos" checked={formData.mareos} onChange={handleFormChange} /> Mareos</label>
              </div>
            </div>
          </div>
        </div>

        {/* Signos vitales */}
        <div className="form-section">
          <h4>Signos Vitales</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperatura"
                value={formData.temperatura}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>F. Cardiaca (bpm)</label>
              <input
                type="number"
                name="f_cardiaca"
                value={formData.f_cardiaca}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>F. Respiratoria (rpm)</label>
              <input
                type="number"
                name="f_respiratoria"
                value={formData.f_respiratoria}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label>Pulso</label>
              <input
                type="text"
                name="pulso"
                value={formData.pulso}
                onChange={handleFormChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Oxigenación (%)</label>
              <input
                type="number"
                step="0.1"
                name="oxigenacion"
                value={formData.oxigenacion}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>

        {/* Hábitos */}
        <div className="form-section">
          <h4>Hábitos</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Consume cigarrillo</label>
              <div className="radio-group">
                <label><input type="radio" name="consume_cigarrillo" value="SI" checked={formData.consume_cigarrillo === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="consume_cigarrillo" value="NO" checked={formData.consume_cigarrillo === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
            <div className="form-group">
              <label>Consume alcohol</label>
              <div className="radio-group">
                <label><input type="radio" name="consume_alcohol" value="SI" checked={formData.consume_alcohol === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="consume_alcohol" value="NO" checked={formData.consume_alcohol === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Consume drogas</label>
              <div className="radio-group">
                <label><input type="radio" name="consume_drogas" value="SI" checked={formData.consume_drogas === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="consume_drogas" value="NO" checked={formData.consume_drogas === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
            <div className="form-group">
              <label>Consume café</label>
              <div className="radio-group">
                <label><input type="radio" name="consume_cafe" value="SI" checked={formData.consume_cafe === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="consume_cafe" value="NO" checked={formData.consume_cafe === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Practica ejercicio</label>
              <div className="radio-group">
                <label><input type="radio" name="practica_ejercicio" value="SI" checked={formData.practica_ejercicio === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="practica_ejercicio" value="NO" checked={formData.practica_ejercicio === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
            <div className="form-group">
              <label>Duerme bien</label>
              <div className="radio-group">
                <label><input type="radio" name="duerme_bien" value="SI" checked={formData.duerme_bien === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="duerme_bien" value="NO" checked={formData.duerme_bien === 'NO'} onChange={handleFormChange} /> NO</label>
              </div>
            </div>
          </div>
        </div>

        {/* Mujeres: estado de ingravidez */}
        <div className="form-section">
          <h4>Mujeres: estado de ingravidez</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Está embarazada</label>
              <div className="radio-group">
                <label><input type="radio" name="embarazada" value="SI" checked={formData.embarazada === 'SI'} onChange={handleFormChange} /> SI</label>
                <label><input type="radio" name="embarazada" value="NO" checked={formData.embarazada === 'NO'} onChange={handleFormChange} /> NO</label>
                <label><input type="radio" name="embarazada" value="NO_APLICA" checked={formData.embarazada === 'NO_APLICA'} onChange={handleFormChange} /> No aplica</label>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cuántos meses</label>
              <input 
                type="text" 
                name="cuantos_meses" 
                value={formData.cuantos_meses} 
                onChange={handleFormChange}
                disabled={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA'}
                style={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA' ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
              />
            </div>
            <div className="form-group">
              <label>Cuántos hijos</label>
              <input 
                type="text" 
                name="cuantos_hijos" 
                value={formData.cuantos_hijos} 
                onChange={handleFormChange}
                disabled={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA'}
                style={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA' ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lleva control</label>
              <input 
                type="text" 
                name="lleva_control" 
                value={formData.lleva_control} 
                onChange={handleFormChange}
                disabled={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA'}
                style={formData.embarazada === 'NO' || formData.embarazada === 'NO_APLICA' ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
              />
            </div>
          </div>
        </div>

        {/* Diagnóstico médico en rehabilitación */}
        <div className="form-section">
          <h4>Diagnóstico médico en rehabilitación</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Reflejos</label>
              <input type="text" name="reflejos" value={formData.reflejos} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <label>Sensibilidad</label>
              <input type="text" name="sensibilidad" value={formData.sensibilidad} onChange={handleFormChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lenguaje</label>
              <input type="text" name="lenguaje" value={formData.lenguaje} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <label>Otros</label>
              <input type="text" name="otros_diagnostico" value={formData.otros_diagnostico} onChange={handleFormChange} />
            </div>
          </div>
        </div>

        {/* Cicatriz Quirúrgica */}
        <div className="form-section">
          <h4>Cicatriz Quirúrgica</h4>
          <div className="checkbox-group">
            <label><input type="checkbox" name="en_sitio" checked={formData.en_sitio} onChange={handleFormChange} /> En sitio</label>
            <label><input type="checkbox" name="con_adherencia" checked={formData.con_adherencia} onChange={handleFormChange} /> Con adherencia</label>
            <label><input type="checkbox" name="queloide" checked={formData.queloide} onChange={handleFormChange} /> Queloide</label>
            <label><input type="checkbox" name="sin_adherencia" checked={formData.sin_adherencia} onChange={handleFormChange} /> Sin adherencia</label>
            <label><input type="checkbox" name="retractil" checked={formData.retractil} onChange={handleFormChange} /> Retráctil</label>
            <label><input type="checkbox" name="hipertrofica" checked={formData.hipertrofica} onChange={handleFormChange} /> Hipertrófica</label>
            <label><input type="checkbox" name="abierta" checked={formData.abierta} onChange={handleFormChange} /> Abierta</label>
            <label><input type="checkbox" name="con_inflamacion" checked={formData.con_inflamacion} onChange={handleFormChange} /> Con inflamación</label>
          </div>
        </div>

        {/* Traslados */}
        <div className="form-section">
          <h4>Traslados</h4>
          <div className="checkbox-group">
            <label><input type="checkbox" name="independiente" checked={formData.independiente} onChange={handleFormChange} /> Independiente</label>
            <label><input type="checkbox" name="silla_ruedas" checked={formData.silla_ruedas} onChange={handleFormChange} /> Silla de ruedas</label>
            <label><input type="checkbox" name="con_ayudas" checked={formData.con_ayudas} onChange={handleFormChange} /> Con ayudas</label>
            <label><input type="checkbox" name="camilla" checked={formData.camilla} onChange={handleFormChange} /> Camilla</label>
          </div>
        </div>

        {/* Fase de marcha */}
        <div className="form-section">
          <h4>Fase de marcha</h4>
          <div className="checkbox-group">
            <label><input type="checkbox" name="libre" checked={formData.libre} onChange={handleFormChange} /> Libre</label>
            <label><input type="checkbox" name="claudicante" checked={formData.claudicante} onChange={handleFormChange} /> Claudicante</label>
            <label><input type="checkbox" name="con_ayuda_marcha" checked={formData.con_ayuda_marcha} onChange={handleFormChange} /> Con ayuda</label>
            <label><input type="checkbox" name="espastica" checked={formData.espastica} onChange={handleFormChange} /> Espástica</label>
            <label><input type="checkbox" name="ataxica" checked={formData.ataxica} onChange={handleFormChange} /> Atáxica</label>
            <label><input type="checkbox" name="con_antepulsion" checked={formData.con_antepulsion} onChange={handleFormChange} /> Con antepulsión</label>
            <label><input type="checkbox" name="con_retropulsion" checked={formData.con_retropulsion} onChange={handleFormChange} /> Con retropulsión</label>
            <label><input type="checkbox" name="con_rotacion" checked={formData.con_rotacion} onChange={handleFormChange} /> Con Rotación</label>
          </div>
        </div>

        {/* Escala de dolor */}
        <div className="form-section">
          <h4>Escala de dolor (0-10)</h4>
          <div className="escala-dolor">
            <div className="escala-numeros">
              {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                <label key={num} className={`escala-item ${formData.escala_dolor == num ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="escala_dolor" 
                    value={num} 
                    checked={formData.escala_dolor == num} 
                    onChange={handleFormChange} 
                  />
                  {num}
                </label>
              ))}
            </div>
            <div className="escala-labels">
              <span>Sin dolor</span>
              <span>Poco dolor</span>
              <span>Dolor moderado</span>
              <span>Dolor fuerte</span>
              <span>Dolor muy fuerte</span>
              <span>Dolor insoportable</span>
            </div>
          </div>
        </div>

        <div className="historia-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : (historiaExists ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HistoriaClinica;
