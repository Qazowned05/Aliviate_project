const express = require('express');
const PacienteController = require('../controllers/PacienteController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { 
    validatePagination, 
    validateId, 
    validateRequired, 
    validateEmail,
    validateDocumento,
    validateFechaNacimiento
} = require('../middlewares/validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', 
    validatePagination,
    PacienteController.getAll
);

router.get('/search',
    PacienteController.search
);

router.get('/dni/:documento',
    PacienteController.getByDocumento
);

router.get('/stats',
    PacienteController.getStats
);

router.get('/:id/completo',
    validateId(),
    PacienteController.getWithHistoria
);

router.get('/:id',
    validateId(),
    PacienteController.getById
);

router.post('/',
    validateRequired(['nombre', 'apellido', 'documento_identidad']),
    validateEmail,
    validateDocumento,
    validateFechaNacimiento,
    PacienteController.create
);

router.post('/completo',
    validateRequired(['paciente']),
    validateEmail,
    validateDocumento,
    validateFechaNacimiento,
    PacienteController.createComplete
);

router.put('/:id',
    validateId(),
    validateEmail,
    validateDocumento,
    validateFechaNacimiento,
    PacienteController.update
);

router.delete('/:id',
    requireRole('administrador'),
    validateId(),
    PacienteController.delete
);

module.exports = router;
