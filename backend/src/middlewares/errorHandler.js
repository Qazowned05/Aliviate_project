const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Ya existe un registro con estos datos',
            error: 'DUPLICATE_ENTRY'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referencia a un registro que no existe',
            error: 'FOREIGN_KEY_CONSTRAINT'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token invalido',
            error: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
            error: 'EXPIRED_TOKEN'
        });
    }

    if (err.type === 'VALIDATION_ERROR') {
        return res.status(400).json({
            success: false,
            message: err.message,
            error: 'VALIDATION_ERROR',
            details: err.details
        });
    }

    if (err.type === 'NOT_FOUND') {
        return res.status(404).json({
            success: false,
            message: err.message,
            error: 'NOT_FOUND'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
    });
};

const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
        error: 'ROUTE_NOT_FOUND'
    });
};

module.exports = {
    errorHandler,
    notFound
};
