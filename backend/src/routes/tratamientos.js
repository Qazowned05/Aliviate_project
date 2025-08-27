const express = require('express');
const TratamientoAsignadoController = require('../controllers/TratamientoAsignadoController');
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
    TratamientoAsignadoController.getAll
);

router.get('/stats',
    TratamientoAsignadoController.getEstadisticas
);

router.get('/paciente/:pacienteId',
    validateId('pacienteId'),
    TratamientoAsignadoController.getByPaciente
);

router.get('/:id',
    validateId(),
    TratamientoAsignadoController.getById
);

router.post('/',
    validateRequired(['id_paciente', 'id_paquete']),
    TratamientoAsignadoController.create
);

router.post('/con-horario',
    validateRequired(['id_paciente', 'id_paquete', 'fecha_inicio', 'hora_inicio']),
    TratamientoAsignadoController.createWithSchedule
);

router.post('/con-sesiones',
    validateRequired(['id_paciente', 'id_paquete', 'sesiones']),
    TratamientoAsignadoController.createWithSessions
);

router.put('/:id',
    validateId(),
    TratamientoAsignadoController.update
);

router.post('/:id/finalizar',
    validateId(),
    TratamientoAsignadoController.finalizar
);

router.delete('/:id',
    validateId(),
    TratamientoAsignadoController.delete
);

module.exports = router;
