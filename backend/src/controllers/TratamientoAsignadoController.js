const TratamientoAsignado = require('../models/TratamientoAsignado');
const Sesion = require('../models/Sesion');
const Paciente = require('../models/Paciente');
const PaqueteTratamiento = require('../models/PaqueteTratamiento');

class TratamientoAsignadoController {
    static async getAll(req, res, next) {
        try {
            const { limit, offset } = req.pagination;
            const filters = {
                id_paciente: req.query.paciente,
                estado: req.query.estado
            };

            const tratamientos = await TratamientoAsignado.findAll(limit, offset, filters);
            const total = await TratamientoAsignado.count(filters);

            res.json({
                success: true,
                data: tratamientos,
                pagination: {
                    page: req.pagination.page,
                    limit: req.pagination.limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const tratamiento = await TratamientoAsignado.findById(id);

            if (!tratamiento) {
                const error = new Error('Tratamiento asignado no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const sesiones = await Sesion.findByTratamientoId(id);

            res.json({
                success: true,
                data: {
                    ...tratamiento,
                    sesiones
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async getByPaciente(req, res, next) {
        try {
            const { pacienteId } = req.params;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const tratamientos = await TratamientoAsignado.findByPacienteId(pacienteId);

            res.json({
                success: true,
                data: tratamientos
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const { id_paciente, id_paquete, observaciones, sesiones } = req.body;

            const paciente = await Paciente.findById(id_paciente);
            if (!paciente) {
                return res.status(400).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            const paquete = await PaqueteTratamiento.findById(id_paquete);
            if (!paquete) {
                return res.status(400).json({
                    success: false,
                    message: 'Paquete de tratamiento no encontrado'
                });
            }

            const nuevoTratamiento = await TratamientoAsignado.create({
                id_paciente,
                id_paquete,
                observaciones
            });

            if (sesiones && sesiones.length > 0) {
                if (sesiones.length !== paquete.numero_sesiones) {
                    return res.status(400).json({
                        success: false,
                        message: `El paquete requiere exactamente ${paquete.numero_sesiones} sesiones`
                    });
                }

                const sesionesConTratamiento = sesiones.map((sesion, index) => ({
                    id_tratamiento_asignado: nuevoTratamiento.id_tratamiento_asignado,
                    numero_sesion: index + 1,
                    fecha_programada: sesion.fecha_programada,
                    hora_programada: sesion.hora_programada,
                    notas: sesion.notas
                }));

                await Sesion.createMultiple(sesionesConTratamiento);
            }

            const tratamientoCompleto = await TratamientoAsignado.findById(nuevoTratamiento.id_tratamiento_asignado);
            const sesionesTratamiento = await Sesion.findByTratamientoId(nuevoTratamiento.id_tratamiento_asignado);

            res.status(201).json({
                success: true,
                message: 'Tratamiento asignado exitosamente',
                data: {
                    ...tratamientoCompleto,
                    sesiones: sesionesTratamiento
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async createWithSchedule(req, res, next) {
        try {
            const { 
                id_paciente, 
                id_paquete, 
                observaciones,
                fecha_inicio,
                hora_inicio,
                dias_semana,
                generar_consecutivo
            } = req.body;

            const paciente = await Paciente.findById(id_paciente);
            if (!paciente) {
                return res.status(400).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            const paquete = await PaqueteTratamiento.findById(id_paquete);
            if (!paquete) {
                return res.status(400).json({
                    success: false,
                    message: 'Paquete de tratamiento no encontrado'
                });
            }

            const nuevoTratamiento = await TratamientoAsignado.create({
                id_paciente,
                id_paquete,
                observaciones
            });

            const sesiones = this.generarSesiones(
                nuevoTratamiento.id_tratamiento_asignado,
                paquete.numero_sesiones,
                fecha_inicio,
                hora_inicio,
                dias_semana,
                generar_consecutivo
            );

            await Sesion.createMultiple(sesiones);

            const tratamientoCompleto = await TratamientoAsignado.findById(nuevoTratamiento.id_tratamiento_asignado);
            const sesionesTratamiento = await Sesion.findByTratamientoId(nuevoTratamiento.id_tratamiento_asignado);

            res.status(201).json({
                success: true,
                message: 'Tratamiento con horario asignado exitosamente',
                data: {
                    ...tratamientoCompleto,
                    sesiones: sesionesTratamiento
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static generarSesiones(idTratamiento, numeroSesiones, fechaInicio, horaInicio, diasSemana, consecutivo) {
        const sesiones = [];
        const fechaActual = new Date(fechaInicio);
        
        if (consecutivo) {
            for (let i = 0; i < numeroSesiones; i++) {
                sesiones.push({
                    id_tratamiento_asignado: idTratamiento,
                    numero_sesion: i + 1,
                    fecha_programada: new Date(fechaActual),
                    hora_programada: horaInicio,
                    notas: null
                });
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
        } else {
            let sesionesCreadas = 0;
            
            while (sesionesCreadas < numeroSesiones) {
                const diaSemana = fechaActual.getDay(); 
                
                if (diasSemana.includes(diaSemana)) {
                    sesiones.push({
                        id_tratamiento_asignado: idTratamiento,
                        numero_sesion: sesionesCreadas + 1,
                        fecha_programada: new Date(fechaActual),
                        hora_programada: horaInicio,
                        notas: null
                    });
                    sesionesCreadas++;
                }
                
                fechaActual.setDate(fechaActual.getDate() + 1);
            }
        }
        
        return sesiones;
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const tratamiento = await TratamientoAsignado.findById(id);
            if (!tratamiento) {
                const error = new Error('Tratamiento asignado no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const tratamientoActualizado = await TratamientoAsignado.update(id, updateData);

            res.json({
                success: true,
                message: 'Tratamiento actualizado exitosamente',
                data: tratamientoActualizado
            });

        } catch (error) {
            next(error);
        }
    }

    static async finalizar(req, res, next) {
        try {
            const { id } = req.params;

            const tratamiento = await TratamientoAsignado.findById(id);
            if (!tratamiento) {
                const error = new Error('Tratamiento asignado no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const eliminado = await TratamientoAsignado.delete(id);

            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Tratamiento eliminado exitosamente'
                });
            } else {
                throw new Error('No se pudo eliminar el tratamiento');
            }

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const tratamiento = await TratamientoAsignado.findById(id);
            if (!tratamiento) {
                const error = new Error('Tratamiento asignado no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const eliminado = await TratamientoAsignado.delete(id);

            if (!eliminado) {
                const error = new Error('Error al eliminar el tratamiento');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Tratamiento eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getEstadisticas(req, res, next) {
        try {
            const stats = await TratamientoAsignado.getEstadisticas();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            next(error);
        }
    }

    static async createWithSessions(req, res, next) {
        try {
            const { id_paciente, id_paquete, observaciones, sesiones } = req.body;

            const paciente = await Paciente.findById(id_paciente);
            if (!paciente) {
                return res.status(400).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            const paquete = await PaqueteTratamiento.findById(id_paquete);
            if (!paquete) {
                return res.status(400).json({
                    success: false,
                    message: 'Paquete de tratamiento no encontrado'
                });
            }

            if (!sesiones || sesiones.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar las sesiones programadas'
                });
            }

            if (sesiones.length !== paquete.numero_sesiones) {
                return res.status(400).json({
                    success: false,
                    message: `El paquete requiere exactamente ${paquete.numero_sesiones} sesiones`
                });
            }

            for (let i = 0; i < sesiones.length; i++) {
                if (!sesiones[i].fecha || !sesiones[i].hora_programada) {
                    return res.status(400).json({
                        success: false,
                        message: `La sesión ${i + 1} debe tener fecha y hora programada`
                    });
                }
            }

            const nuevoTratamiento = await TratamientoAsignado.create({
                id_paciente,
                id_paquete,
                observaciones
            });

            const sesionesParaCrear = sesiones.map((sesion, index) => ({
                id_tratamiento_asignado: nuevoTratamiento.id_tratamiento_asignado,
                numero_sesion: index + 1,
                fecha_programada: sesion.fecha,
                hora_programada: sesion.hora_programada,
                notas: sesion.observaciones || null
            }));

            await Sesion.createMultiple(sesionesParaCrear);

            const tratamientoCompleto = await TratamientoAsignado.findById(nuevoTratamiento.id_tratamiento_asignado);
            const sesionesTratamiento = await Sesion.findByTratamientoId(nuevoTratamiento.id_tratamiento_asignado);

            res.status(201).json({
                success: true,
                message: `Tratamiento asignado exitosamente con ${sesiones.length} sesiones programadas`,
                data: {
                    tratamiento: tratamientoCompleto,
                    sesiones: sesionesTratamiento
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = TratamientoAsignadoController;
