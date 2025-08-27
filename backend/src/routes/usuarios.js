const express = require('express');
const UsuarioController = require('../controllers/UsuarioController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { 
    validatePagination, 
    validateId, 
    validateRequired, 
    validateEmail, 
    validatePassword 
} = require('../middlewares/validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', 
    requireRole('administrador'),
    validatePagination,
    UsuarioController.getAll
);

router.get('/stats',
    requireRole('administrador'),
    UsuarioController.getStats
);

router.get('/:id',
    requireRole('administrador'),
    validateId(),
    UsuarioController.getById
);

router.post('/',
    requireRole('administrador'),
    validateRequired(['nombre', 'apellido', 'email', 'password', 'rol']),
    validateEmail,
    validatePassword,
    UsuarioController.create
);

router.put('/:id',
    requireRole('administrador'),
    validateId(),
    validateEmail,
    UsuarioController.update
);

router.delete('/:id',
    requireRole('administrador'),
    validateId(),
    UsuarioController.delete
);

module.exports = router;
