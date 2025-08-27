const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aliviate_jwt_secret_key');
        const usuario = await Usuario.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Token invalido'
            });
        }

        req.user = usuario;
        next();
    } catch (error) {
        console.error('Error en autenticacion:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Token invalido o expirado'
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta accion'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};
