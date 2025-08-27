const { getConnection } = require('../config/database');

class Usuario {
    constructor(data = {}) {
        this.id_usuario = data.id_usuario;
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.rol = data.rol;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    static async findAll(limit = 10, offset = 0) {
        const connection = getConnection();
        
        try {
            const limitInt = parseInt(limit) || 10;
            const offsetInt = parseInt(offset) || 0;
            
            const [rows] = await connection.query(
                `SELECT id_usuario, nombre, apellido, email, rol, fecha_creacion, fecha_actualizacion 
                 FROM Usuario 
                 ORDER BY fecha_creacion DESC 
                 LIMIT ${limitInt} OFFSET ${offsetInt}`
            );
            return rows.map(row => new Usuario(row));
        } catch (error) {
            console.error('Error en findAll:', error);
            throw error;
        }
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT id_usuario, nombre, apellido, email, rol, fecha_creacion, fecha_actualizacion 
             FROM Usuario 
             WHERE id_usuario = ?`,
            [id]
        );
        return rows.length > 0 ? new Usuario(rows[0]) : null;
    }

    static async findByEmail(email) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM Usuario WHERE email = ?',
            [email]
        );
        return rows.length > 0 ? new Usuario(rows[0]) : null;
    }

    static async create(userData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Usuario (nombre, apellido, email, password_hash, rol) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                userData.nombre !== undefined ? userData.nombre : null,
                userData.apellido !== undefined ? userData.apellido : null,
                userData.email !== undefined ? userData.email : null,
                userData.password_hash !== undefined ? userData.password_hash : null,
                userData.rol !== undefined ? userData.rol : null
            ]
        );
        return await Usuario.findById(result.insertId);
    }

    static async update(id, userData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        Object.keys(userData).forEach(key => {
            if (key !== 'id_usuario') {
                fields.push(`${key} = ?`);
                values.push(userData[key] !== undefined ? userData[key] : null);
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        await connection.execute(
            `UPDATE Usuario SET ${fields.join(', ')} WHERE id_usuario = ?`,
            values
        );

        return await Usuario.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Usuario WHERE id_usuario = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async count() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM Usuario');
        return rows[0].total;
    }
}

module.exports = Usuario;
