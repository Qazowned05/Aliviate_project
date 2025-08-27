const Sesion = require('../models/Sesion');
const TratamientoAsignado = require('../models/TratamientoAsignado');

class SesionController {
    static async getAll(req, res, next) {
        try {
            const { limit, offset } = req.pagination;
            const filters = {
                id_tratamiento_asignado: req.query.tratamiento,
                fecha_programada: req.query.fecha,
                asistencia: req.query.asistencia !== undefined ? req.query.asistencia === 'true' : undefined
            };

            const sesiones = await Sesion.findAll(limit, offset, filters);
            const total = await Sesion.count(filters);

            res.json({
                success: true,
                data: sesiones,
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
            const sesion = await Sesion.findById(id);

            if (!sesion) {
                const error = new Error('Sesion no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: sesion
            });

        } catch (error) {
            next(error);
        }
    }

    static async getByTratamiento(req, res, next) {
        try {
            const { tratamientoId } = req.params;

            const tratamiento = await TratamientoAsignado.findById(tratamientoId);
            if (!tratamiento) {
                const error = new Error('Tratamiento no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const sesiones = await Sesion.findByTratamientoId(tratamientoId);

            res.json({
                success: true,
                data: sesiones
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const sesionData = req.body;

            const tratamiento = await TratamientoAsignado.findById(sesionData.id_tratamiento_asignado);
            if (!tratamiento) {
                return res.status(400).json({
                    success: false,
                    message: 'Tratamiento asignado no encontrado'
                });
            }

            const sesionesExistentes = await Sesion.findByTratamientoId(sesionData.id_tratamiento_asignado);
            const paquete = await require('../models/PaqueteTratamiento').findById(tratamiento.id_paquete);

            if (sesionesExistentes.length >= paquete.numero_sesiones) {
                return res.status(400).json({
                    success: false,
                    message: `No se pueden crear mas sesiones. El paquete permite un maximo de ${paquete.numero_sesiones} sesiones`
                });
            }

            sesionData.numero_sesion = sesionesExistentes.length + 1;

            const nuevaSesion = await Sesion.create(sesionData);

            res.status(201).json({
                success: true,
                message: 'Sesion creada exitosamente',
                data: nuevaSesion
            });

        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const sesion = await Sesion.findById(id);
            if (!sesion) {
                const error = new Error('Sesion no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (sesion.estado_confirmado && (updateData.asistencia !== undefined)) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede modificar la asistencia de sesiones confirmadas'
                });
            }

            const sesionActualizada = await Sesion.update(id, updateData);

            res.json({
                success: true,
                message: 'Sesion actualizada exitosamente',
                data: sesionActualizada
            });

        } catch (error) {
            next(error);
        }
    }

    static async updateAsistencia(req, res, next) {
        try {
            const { id } = req.params;
            const { asistencia, notas } = req.body;

            const sesion = await Sesion.findById(id);
            if (!sesion) {
                const error = new Error('Sesion no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (sesion.estado_confirmado) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede modificar la asistencia de sesiones confirmadas'
                });
            }

            const sesionActualizada = await Sesion.updateAsistencia(id, asistencia, notas);

            res.json({
                success: true,
                message: 'Asistencia actualizada exitosamente',
                data: sesionActualizada
            });

        } catch (error) {
            next(error);
        }
    }

    static async updateMultipleAsistencia(req, res, next) {
        try {
            const { sesiones } = req.body;

            if (!Array.isArray(sesiones) || sesiones.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de sesiones'
                });
            }

            const resultados = [];

            for (const sesionData of sesiones) {
                try {
                    const sesion = await Sesion.findById(sesionData.id);
                    if (!sesion) {
                        resultados.push({
                            id: sesionData.id,
                            success: false,
                            message: 'Sesion no encontrada'
                        });
                        continue;
                    }

                    if (sesion.estado_confirmado) {
                        resultados.push({
                            id: sesionData.id,
                            success: false,
                            message: 'Sesion ya confirmada'
                        });
                        continue;
                    }

                    await Sesion.updateAsistencia(sesionData.id, sesionData.asistencia, sesionData.notas);
                    resultados.push({
                        id: sesionData.id,
                        success: true,
                        message: 'Actualizada exitosamente'
                    });

                } catch (error) {
                    resultados.push({
                        id: sesionData.id,
                        success: false,
                        message: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'Actualizacion masiva completada',
                data: resultados
            });

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const sesion = await Sesion.findById(id);
            if (!sesion) {
                const error = new Error('Sesion no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (sesion.estado_confirmado) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar sesiones confirmadas'
                });
            }

            const eliminado = await Sesion.delete(id);

            if (!eliminado) {
                const error = new Error('Error al eliminar la sesion');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Sesion eliminada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getEstadisticasPorTratamiento(req, res, next) {
        try {
            const { tratamientoId } = req.params;

            const tratamiento = await TratamientoAsignado.findById(tratamientoId);
            if (!tratamiento) {
                const error = new Error('Tratamiento no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const estadisticas = await Sesion.getEstadisticasPorTratamiento(tratamientoId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            next(error);
        }
    }

    static async getCalendario(req, res, next) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;

            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren fecha_inicio y fecha_fin'
                });
            }

            const filters = {};
            const sesiones = await Sesion.findAll(1000, 0, filters);

            const sesionesFiltradas = sesiones.filter(sesion => {
                const fechaSesion = new Date(sesion.fecha_programada);
                const inicio = new Date(fecha_inicio);
                const fin = new Date(fecha_fin);
                return fechaSesion >= inicio && fechaSesion <= fin;
            });

            res.json({
                success: true,
                data: sesionesFiltradas
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = SesionController;
