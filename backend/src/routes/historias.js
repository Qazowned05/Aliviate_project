const express = require('express');
const HistoriaClinicaController = require('../controllers/HistoriaClinicaController');
const { authenticateToken } = require('../middlewares/auth');
const { 
    validateId, 
    validateRequired,
    validateEscalaDolor
} = require('../middlewares/validation');

const router = express.Router();

router.use(authenticateToken);

router.post('/',
    validateRequired(['id_paciente']),
    validateEscalaDolor,
    HistoriaClinicaController.createFromBody
);

router.put('/',
    validateRequired(['id_historia']),
    validateEscalaDolor,
    HistoriaClinicaController.updateFromBody
);

router.get('/:id',
    validateId(),
    HistoriaClinicaController.getById
);

router.put('/:id',
    validateId(),
    validateEscalaDolor,
    HistoriaClinicaController.updateById
);

router.get('/paciente/:pacienteId',
    validateId('pacienteId'),
    HistoriaClinicaController.getByPacienteId
);

router.post('/paciente/:pacienteId',
    validateId('pacienteId'),
    validateEscalaDolor,
    HistoriaClinicaController.create
);

router.put('/paciente/:pacienteId',
    validateId('pacienteId'),
    validateEscalaDolor,
    HistoriaClinicaController.update
);

router.post('/paciente/:pacienteId/upsert',
    validateId('pacienteId'),
    validateEscalaDolor,
    HistoriaClinicaController.createOrUpdate
);

router.delete('/paciente/:pacienteId',
    validateId('pacienteId'),
    HistoriaClinicaController.delete
);

module.exports = router;
