const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const usuario = await Usuario.findByEmail(email);
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales invalidas'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales invalidas'
                });
            }

            const token = jwt.sign(
                { 
                    id: usuario.id_usuario, 
                    email: usuario.email, 
                    rol: usuario.rol 
                },
                process.env.JWT_SECRET || 'aliviate_jwt_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: {
                        id: usuario.id_usuario,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        email: usuario.email,
                        rol: usuario.rol
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async getProfile(req, res, next) {
        try {
            const usuario = req.user;

            res.json({
                success: true,
                data: {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    rol: usuario.rol,
                    fecha_creacion: usuario.fecha_creacion
                }
            });

        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id_usuario;

            const usuario = await Usuario.findByEmail(req.user.email);
            
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, usuario.password_hash);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Contrasena actual incorrecta'
                });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            await Usuario.update(userId, { password_hash: hashedNewPassword });

            res.json({
                success: true,
                message: 'Contrasena actualizada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    static async refreshToken(req, res, next) {
        try {
            const usuario = req.user;

            const token = jwt.sign(
                { 
                    id: usuario.id_usuario, 
                    email: usuario.email, 
                    rol: usuario.rol 
                },
                process.env.JWT_SECRET || 'aliviate_jwt_secret_key',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            res.json({
                success: true,
                message: 'Token renovado exitosamente',
                data: { token }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;
