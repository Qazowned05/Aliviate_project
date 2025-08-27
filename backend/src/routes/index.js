const express = require('express');

const router = express.Router();

const authRoutes = require('./auth');
const usuarioRoutes = require('./usuarios');
const pacienteRoutes = require('./pacientes');
const historiaRoutes = require('./historias');
const paqueteRoutes = require('./paquetes');
const tratamientoRoutes = require('./tratamientos');
const sesionRoutes = require('./sesiones');

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/pacientes', pacienteRoutes);
router.use('/historias', historiaRoutes);
router.use('/paquetes', paqueteRoutes);
router.use('/tratamientos', tratamientoRoutes);
router.use('/sesiones', sesionRoutes);

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API Aliviate funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
