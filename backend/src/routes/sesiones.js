const express = require('express');
const SesionController = require('../controllers/SesionController');
const { authenticateToken } = require('../middlewares/auth');
const { 
    validatePagination, 
    validateId, 
    validateRequired
} = require('../middlewares/validation');

const router = express.Router();

router.use(authenticateToken);

router.get('/', 
    validatePagination,
    SesionController.getAll
);

router.get('/calendario',
    SesionController.getCalendario
);

router.get('/tratamiento/:tratamientoId',
    validateId('tratamientoId'),
    SesionController.getByTratamiento
);

router.get('/tratamiento/:tratamientoId/stats',
    validateId('tratamientoId'),
    SesionController.getEstadisticasPorTratamiento
);

router.get('/:id',
    validateId(),
    SesionController.getById
);

router.post('/',
    validateRequired(['id_tratamiento_asignado', 'fecha_programada', 'hora_programada']),
    SesionController.create
);

router.put('/:id',
    validateId(),
    SesionController.update
);

router.patch('/:id/asistencia',
    validateId(),
    validateRequired(['asistencia']),
    SesionController.updateAsistencia
);

router.patch('/asistencia/multiple',
    validateRequired(['sesiones']),
    SesionController.updateMultipleAsistencia
);

router.delete('/:id',
    validateId(),
    SesionController.delete
);

module.exports = router;
