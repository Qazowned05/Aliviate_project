const express = require('express');
const PaqueteTratamientoController = require('../controllers/PaqueteTratamientoController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { 
    validatePagination, 
    validateId, 
    validateRequired
} = require('../middlewares/validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', 
    validatePagination,
    PaqueteTratamientoController.getAll
);

router.get('/simple',
    PaqueteTratamientoController.getAllSimple
);

router.get('/stats',
    PaqueteTratamientoController.getStats
);

router.get('/:id',
    validateId(),
    PaqueteTratamientoController.getById
);

router.post('/',
    requireRole('administrador'),
    validateRequired(['nombre', 'numero_sesiones', 'precio']),
    PaqueteTratamientoController.create
);

router.put('/:id',
    requireRole('administrador'),
    validateId(),
    PaqueteTratamientoController.update
);

router.delete('/:id',
    requireRole('administrador'),
    validateId(),
    PaqueteTratamientoController.delete
);

module.exports = router;
