const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

class UsuarioController {
    static async getAll(req, res, next) {
        try {
            const { limit, offset } = req.pagination;
            const search = req.query.search || '';

            const usuarios = await Usuario.findAll(limit, offset);
            const total = await Usuario.count();

            res.json({
                success: true,
                data: usuarios,
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
            const usuario = await Usuario.findById(id);

            if (!usuario) {
                const error = new Error('Usuario no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            res.json({
                success: true,
                data: usuario
            });

        } catch (error) {
            next(error);
        }
    }

    static async create(req, res, next) {
        try {
            const { nombre, apellido, email, password, rol } = req.body;

            const existingUser = await Usuario.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un usuario con este email'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            const nuevoUsuario = await Usuario.create({
                nombre,
                apellido,
                email,
                password_hash: hashedPassword,
                rol
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: nuevoUsuario
            });

        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;
            const { password, ...updateData } = req.body;

            const usuario = await Usuario.findById(id);
            if (!usuario) {
                const error = new Error('Usuario no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (password) {
                updateData.password_hash = await bcrypt.hash(password, 12);
            }

            if (updateData.email && updateData.email !== usuario.email) {
                const existingUser = await Usuario.findByEmail(updateData.email);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un usuario con este email'
                    });
                }
            }

            const usuarioActualizado = await Usuario.update(id, updateData);

            res.json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: usuarioActualizado
            });

        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;

            const usuario = await Usuario.findById(id);
            if (!usuario) {
                const error = new Error('Usuario no encontrado');
                error.type = 'NOT_FOUND';
                throw error;
            }

            if (usuario.rol === 'administrador') {
                const [adminUsers] = await Usuario.findAll(100, 0);
                const adminCount = adminUsers.filter(u => u.rol === 'administrador').length;
                
                if (adminCount <= 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede eliminar el ultimo administrador del sistema'
                    });
                }
            }

            const eliminado = await Usuario.delete(id);

            if (!eliminado) {
                const error = new Error('Error al eliminar el usuario');
                error.type = 'INTERNAL_ERROR';
                throw error;
            }

            res.json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async getStats(req, res, next) {
        try {
            const total = await Usuario.count();
            const usuarios = await Usuario.findAll(1000, 0);

            const stats = {
                total,
                administradores: usuarios.filter(u => u.rol === 'administrador').length,
                operadores: usuarios.filter(u => u.rol === 'operador').length
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

module.exports = UsuarioController;
