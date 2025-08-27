const validatePagination = (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (page < 1) {
        return res.status(400).json({
            success: false,
            message: 'El numero de pagina debe ser mayor a 0'
        });
    }
    
    if (limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            message: 'El limite debe estar entre 1 y 100'
        });
    }
    
    req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
    };
    
    next();
};

const validateId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = parseInt(req.params[paramName]);
        
        if (!id || id < 1) {
            return res.status(400).json({
                success: false,
                message: `ID ${paramName} invalido`
            });
        }
        
        req.params[paramName] = id;
        next();
    };
};

const validateRequired = (fields) => {
    return (req, res, next) => {
        const missingFields = [];
        
        fields.forEach(field => {
            if (!req.body[field] || req.body[field].toString().trim() === '') {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Campos requeridos faltantes',
                missingFields
            });
        }
        
        next();
    };
};

const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return next();
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Formato de email invalido'
        });
    }
    
    next();
};

const validatePassword = (req, res, next) => {
    const { password } = req.body;
    
    if (!password) {
        return next();
    }
    
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'La contrasena debe tener al menos 8 caracteres'
        });
    }
    
    // Al menos una mayúscula, una minúscula, un número y un caracter especial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'La contrasena debe contener al menos: una mayuscula, una minuscula, un numero y un caracter especial'
        });
    }
    
    next();
};

const validateDocumento = (req, res, next) => {
    const { documento_identidad, tipo_documento } = req.body;
    
    if (!documento_identidad) {
        return next();
    }
    
    const tipoDoc = tipo_documento || 'DNI';
    
    if (tipoDoc === 'DNI' && documento_identidad.length !== 8) {
        return res.status(400).json({
            success: false,
            message: 'El DNI debe tener 8 digitos'
        });
    }
    
    if (tipoDoc === 'CE' && documento_identidad.length !== 12) {
        return res.status(400).json({
            success: false,
            message: 'El Carnet de Extranjeria debe tener 12 caracteres'
        });
    }
    
    next();
};

const validateFechaNacimiento = (req, res, next) => {
    const { fecha_nacimiento } = req.body;
    
    if (!fecha_nacimiento) {
        return next();
    }
    
    const fecha = new Date(fecha_nacimiento);
    const hoy = new Date();
    
    if (fecha > hoy) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de nacimiento no puede ser futura'
        });
    }
    
    const edad = hoy.getFullYear() - fecha.getFullYear();
    
    if (edad > 120) {
        return res.status(400).json({
            success: false,
            message: 'La fecha de nacimiento no es valida'
        });
    }
    
    next();
};

const validateEscalaDolor = (req, res, next) => {
    const { escala_dolor } = req.body;
    
    if (escala_dolor === undefined || escala_dolor === null) {
        return next();
    }
    
    const escala = parseInt(escala_dolor);
    
    if (escala < 0 || escala > 10) {
        return res.status(400).json({
            success: false,
            message: 'La escala de dolor debe estar entre 0 y 10'
        });
    }
    
    req.body.escala_dolor = escala;
    next();
};

module.exports = {
    validatePagination,
    validateId,
    validateRequired,
    validateEmail,
    validatePassword,
    validateDocumento,
    validateFechaNacimiento,
    validateEscalaDolor
};
