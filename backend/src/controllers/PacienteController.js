const Paciente = require('../models/Paciente');
const HistoriaClinica = require('../models/HistoriaClinica');

class PacienteController {
    static async getAll(req, res, next) {
        try {
            const { limit, offset } = req.pagination;
            const search = req.query.search || '';

            const pacientes = await Paciente.findAll(limit, offset, search);
            const total = await Paciente.count(search);

            res.json({
                success: true,
                data: pacientes,
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
            const paciente = await Paciente.findById(id);

            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: paciente
            });

        } catch (error) {
            next(error);
        }
    }

    static async getByDocumento(req, res, next) {
        try {
            const { documento } = req.params;
            const paciente = await Paciente.findByDocumento(documento);

            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún paciente con ese documento'
                });
            }

            res.json({
                success: true,
                data: paciente
            });

        } catch (error) {
            next(error);
        }
    }

    static async getWithHistoria(req, res, next) {
        try {
            const { id } = req.params;
            const pacienteCompleto = await Paciente.getWithHistoriaClinica(id);

            if (!pacienteCompleto) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: pacienteCompleto
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const rawData = req.body;

            const pacienteData = {};
            Object.keys(rawData).forEach(key => {
                const value = rawData[key];
                if (['nombre', 'apellido', 'documento_identidad', 'tipo_documento', 'sexo', 'fecha_nacimiento', 'telefono', 'nacionalidad', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono'].includes(key)) {
                    pacienteData[key] = value;
                } else {
                    pacienteData[key] = (value && value.trim() !== '') ? value : null;
                }
            });

            const existingPaciente = await Paciente.findByDocumento(pacienteData.documento_identidad);
            if (existingPaciente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un paciente con este documento de identidad'
                });
            }

            const nuevoPaciente = await Paciente.create(pacienteData);

            res.status(201).json({
                success: true,
                message: 'Paciente registrado exitosamente',
                data: nuevoPaciente
            });

        } catch (error) {
            next(error);
        }
    }

    static async createComplete(req, res, next) {
        try {
            const { paciente, historiaClinica } = req.body;

            const existingPaciente = await Paciente.findByDocumento(paciente.documento_identidad);
            if (existingPaciente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un paciente con este documento de identidad'
                });
            }

            const nuevoPaciente = await Paciente.create(paciente);

            let nuevaHistoria = null;
            if (historiaClinica) {
                historiaClinica.id_paciente = nuevoPaciente.id_paciente;
                nuevaHistoria = await HistoriaClinica.create(historiaClinica);
            }

            res.status(201).json({
                success: true,
                message: 'Paciente e historia clinica registrados exitosamente',
                data: {
                    paciente: nuevoPaciente,
                    historiaClinica: nuevaHistoria
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const rawData = req.body;

            const updateData = {};
            Object.keys(rawData).forEach(key => {
                const value = rawData[key];
                if (['nombre', 'apellido', 'documento_identidad', 'tipo_documento', 'sexo', 'fecha_nacimiento', 'telefono', 'nacionalidad', 'contacto_emergencia_nombre', 'contacto_emergencia_telefono'].includes(key)) {
                    updateData[key] = value;
                } else {
                    updateData[key] = (value && value.trim() !== '') ? value : null;
                }
            });

            const paciente = await Paciente.findById(id);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (updateData.documento_identidad && updateData.documento_identidad !== paciente.documento_identidad) {
                const existingPaciente = await Paciente.findByDocumento(updateData.documento_identidad);
                if (existingPaciente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un paciente con este documento de identidad'
                    });
                }
            }

            const pacienteActualizado = await Paciente.update(id, updateData);

            res.json({
                success: true,
                message: 'Paciente actualizado exitosamente',
                data: pacienteActualizado
            });

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const paciente = await Paciente.findById(id);
            if (!paciente) {
                const error = new Error('Paciente no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const eliminado = await Paciente.delete(id);

            if (!eliminado) {
                const error = new Error('Error al eliminar el paciente');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Paciente eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async search(req, res, next) {
        try {
            const { q, dni, nombre, apellido } = req.query;
            
            let searchTerm = q || dni || nombre || apellido;
            
            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'La búsqueda debe tener al menos 2 caracteres'
                });
            }

            if (dni) {
                const paciente = await Paciente.findByDocumento(dni.trim());
                return res.json({
                    success: true,
                    data: paciente ? [paciente] : []
                });
            }

            // Búsqueda general
            const pacientes = await Paciente.findAll(20, 0, searchTerm.trim());

            res.json({
                success: true,
                data: pacientes,
                message: `Se encontraron ${pacientes.length} paciente(s)`
            });

        } catch (error) {
            next(error);
        }
    }

    static async getStats(req, res, next) {
        try {
            const total = await Paciente.count();
            
            res.json({
                success: true,
                data: {
                    total_pacientes: total
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = PacienteController;
