const HistoriaClinica = require('../models/HistoriaClinica');
const Paciente = require('../models/Paciente');

class HistoriaClinicaController {
    static async getByPacienteId(req, res, next) {
        try {
            const { pacienteId } = req.params;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const historia = await HistoriaClinica.findByPacienteId(pacienteId);

            if (!historia) {
                return res.status(404).json({
                    success: false,
                    message: 'Historia clinica no encontrada para este paciente'
                });
            }

            res.json({
                success: true,
                data: historia
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const { pacienteId } = req.params;
            const historiaData = req.body;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const existingHistoria = await HistoriaClinica.findByPacienteId(pacienteId);
            if (existingHistoria) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una historia clinica para este paciente'
                });
            }

            historiaData.id_paciente = pacienteId;
            const nuevaHistoria = await HistoriaClinica.create(historiaData);

            res.status(201).json({
                success: true,
                message: 'Historia clinica creada exitosamente',
                data: nuevaHistoria
            });

        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { pacienteId } = req.params;
            const updateData = req.body;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const historia = await HistoriaClinica.findByPacienteId(pacienteId);
            if (!historia) {
                const error = new Error('Historia clinica no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const historiaActualizada = await HistoriaClinica.updateByPacienteId(pacienteId, updateData);

            res.json({
                success: true,
                message: 'Historia clinica actualizada exitosamente',
                data: historiaActualizada
            });

        } catch (error) {
            next(error);
        }
    }

    static async createOrUpdate(req, res, next) {
        try {
            const { pacienteId } = req.params;
            const historiaData = req.body;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const existingHistoria = await HistoriaClinica.findByPacienteId(pacienteId);

            let resultado;
            let mensaje;

            if (existingHistoria) {
                resultado = await HistoriaClinica.updateByPacienteId(pacienteId, historiaData);
                mensaje = 'Historia clinica actualizada exitosamente';
            } else {
                historiaData.id_paciente = pacienteId;
                resultado = await HistoriaClinica.create(historiaData);
                mensaje = 'Historia clinica creada exitosamente';
            }

            res.json({
                success: true,
                message: mensaje,
                data: resultado
            });

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { pacienteId } = req.params;

            const paciente = await Paciente.findById(pacienteId);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const historia = await HistoriaClinica.findByPacienteId(pacienteId);
            if (!historia) {
                const error = new Error('Historia clinica no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const eliminado = await HistoriaClinica.deleteByPacienteId(pacienteId);

            if (!eliminado) {
                const error = new Error('Error al eliminar la historia clinica');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Historia clinica eliminada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const historia = await HistoriaClinica.findById(id);

            if (!historia) {
                const error = new Error('Historia clinica no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: historia
            });

        } catch (error) {
            next(error);
        }
    }

    static async updateById(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const historia = await HistoriaClinica.findById(id);
            if (!historia) {
                const error = new Error('Historia clinica no encontrada');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const historiaActualizada = await HistoriaClinica.update(id, updateData);

            res.json({
                success: true,
                message: 'Historia clinica actualizada exitosamente',
                data: historiaActualizada
            });

        } catch (error) {
            next(error);
        }
    }

    static async createFromBody(req, res, next) {
        try {
            const { id_paciente, ...historiaData } = req.body;

            const paciente = await Paciente.findById(id_paciente);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            const existingHistoria = await HistoriaClinica.findByPacienteId(id_paciente);
            if (existingHistoria) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una historia clínica para este paciente. Use PUT para actualizar.'
                });
            }

            const nuevaHistoria = await HistoriaClinica.create({
                ...historiaData,
                id_paciente
            });

            res.status(201).json({
                success: true,
                message: 'Historia clínica creada exitosamente',
                data: nuevaHistoria
            });

        } catch (error) {
            next(error);
        }
    }

    static async updateFromBody(req, res, next) {
        try {
            const { id_historia, ...historiaData } = req.body;
            
            console.log('Datos recibidos para actualizar:', { id_historia, historiaData });

            if (!id_historia) {
                return res.status(400).json({
                    success: false,
                    message: 'id_historia es requerido'
                });
            }

            const existingHistoria = await HistoriaClinica.findById(id_historia);
            if (!existingHistoria) {
                return res.status(404).json({
                    success: false,
                    message: 'Historia clínica no encontrada'
                });
            }

            console.log('Historia encontrada:', existingHistoria);

            const historiaActualizada = await HistoriaClinica.update(id_historia, historiaData);

            res.json({
                success: true,
                message: 'Historia clínica actualizada exitosamente',
                data: historiaActualizada
            });

        } catch (error) {
            console.error('Error en updateFromBody:', error);
            next(error);
        }
    }
}

module.exports = HistoriaClinicaController;
