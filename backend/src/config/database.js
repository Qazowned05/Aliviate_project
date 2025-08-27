const mysql = require('mysql2/promise');
require('dotenv').config();

let connection = null;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const createConnection = async () => {
    try {
        if (!connection) {
            connection = await mysql.createPool(dbConfig);
            console.log('Conexion a la base de datos establecida correctamente');
        }
        return connection;
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.message);
        throw error;
    }
};

const getConnection = () => {
    if (!connection) {
        throw new Error('Base de datos no inicializada. Llama a createConnection() primero.');
    }
    return connection;
};

const closeConnection = async () => {
    if (connection) {
        await connection.end();
        connection = null;
        console.log('Conexion a la base de datos cerrada');
    }
};

module.exports = {
    createConnection,
    getConnection,
    closeConnection,
    dbConfig
};
