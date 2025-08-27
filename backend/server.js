const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { createConnection } = require('./src/config/database');
const { createInitialAdmin } = require('./src/config/initAdmin');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const routes = require('./src/routes');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.shouldInitialize = process.argv.includes('--init');
        
        this.setupMiddlewares();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddlewares() {
        this.app.use(helmet());
        
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
            credentials: true
        }));
        
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        this.app.use('/api', routes);
        
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Servidor Aliviate funcionando correctamente',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                environment: config.NODE_ENV
            });
        });
    }

    setupErrorHandling() {
        this.app.use(notFound);
        
        this.app.use(errorHandler);
    }

    async start() {
        try {
            console.log('=== INICIANDO SERVIDOR ALIVIATE ===');
            console.log('Entorno:', process.env.NODE_ENV || 'development');
            console.log('Puerto:', this.port);
            
            await createConnection();
            
            if (this.shouldInitialize) {
                await createInitialAdmin();
            }
            
            this.app.listen(this.port, () => {
                console.log('=== SERVIDOR INICIADO EXITOSAMENTE ===');
                console.log(`Servidor corriendo en: http://localhost:${this.port}`);
                console.log(`API disponible en: http://localhost:${this.port}/api`);
                console.log(`Salud del servidor: http://localhost:${this.port}/api/health`);
                console.log('Presiona Ctrl+C para detener el servidor');
            });
            
        } catch (error) {
            console.error('Error al iniciar el servidor:', error.message);
            process.exit(1);
        }
    }

    async stop() {
        try {
            console.log('Cerrando servidor...');
            const { closeConnection } = require('./src/config/database');
            await closeConnection();
            process.exit(0);
        } catch (error) {
            console.error('Error al cerrar el servidor:', error.message);
            process.exit(1);
        }
    }
}

process.on('SIGINT', async () => {
    console.log('\nRecibida señal SIGINT. Cerrando servidor...');
    const server = new Server();
    await server.stop();
});

process.on('SIGTERM', async () => {
    console.log('\nRecibida señal SIGTERM. Cerrando servidor...');
    const server = new Server();
    await server.stop();
});

process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
});

if (require.main === module) {
    const server = new Server();
    server.start();
}

module.exports = Server;