const PaqueteTratamiento = require('../models/PaqueteTratamiento');

class PaqueteTratamientoController {
    static async getAll(req, res, next) {
        try {
            const { limit, offset } = req.pagination;

            const paquetes = await PaqueteTratamiento.findAll(limit, offset);
            const total = await PaqueteTratamiento.count();

            res.json({
                success: true,
                data: paquetes,
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

    static async getAllSimple(req, res, next) {
        try {
            const paquetes = await PaqueteTratamiento.findAll(1000, 0);

            res.json({
                success: true,
                data: paquetes
            });

        } catch (error) {
            next(error);
        }
    }

    static async getById(req, res, next) {
        try {
            const { id } = req.params;
            const paquete = await PaqueteTratamiento.findById(id);

            if (!paquete) {
                const error = new Error('Paquete de tratamiento no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: paquete
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const paqueteData = req.body;

            if (paqueteData.numero_sesiones <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El numero de sesiones debe ser mayor a 0'
                });
            }

            if (paqueteData.precio < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio no puede ser negativo'
                });
            }

            const nuevoPaquete = await PaqueteTratamiento.create(paqueteData);

            res.status(201).json({
                success: true,
                message: 'Paquete de tratamiento creado exitosamente',
                data: nuevoPaquete
            });

        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const paquete = await PaqueteTratamiento.findById(id);
            if (!paquete) {
                const error = new Error('Paquete de tratamiento no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (updateData.numero_sesiones !== undefined && updateData.numero_sesiones <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El numero de sesiones debe ser mayor a 0'
                });
            }

            if (updateData.precio !== undefined && updateData.precio < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio no puede ser negativo'
                });
            }

            const paqueteActualizado = await PaqueteTratamiento.update(id, updateData);

            res.json({
                success: true,
                message: 'Paquete de tratamiento actualizado exitosamente',
                data: paqueteActualizado
            });

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const paquete = await PaqueteTratamiento.findById(id);
            if (!paquete) {
                const error = new Error('Paquete de tratamiento no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            const eliminado = await PaqueteTratamiento.delete(id);

            if (!eliminado) {
                const error = new Error('Error al eliminar el paquete de tratamiento');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Paquete de tratamiento eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getStats(req, res, next) {
        try {
            const total = await PaqueteTratamiento.count();
            const paquetes = await PaqueteTratamiento.findAll(1000, 0);

            const stats = {
                total_paquetes: total,
                precio_promedio: paquetes.length > 0 ? 
                    paquetes.reduce((sum, p) => sum + parseFloat(p.precio), 0) / paquetes.length : 0,
                sesiones_promedio: paquetes.length > 0 ? 
                    paquetes.reduce((sum, p) => sum + p.numero_sesiones, 0) / paquetes.length : 0
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = PaqueteTratamientoController;
