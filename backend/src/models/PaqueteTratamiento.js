const { getConnection } = require('../config/database');

class PaqueteTratamiento {
    constructor(data = {}) {
        this.id_paquete = data.id_paquete;
        this.nombre = data.nombre;
        this.descripcion = data.descripcion;
        this.numero_sesiones = data.numero_sesiones;
        this.precio = data.precio;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    static async findAll(limit = 10, offset = 0) {
        const connection = getConnection();
        
        try {
            const limitInt = parseInt(limit) || 10;
            const offsetInt = parseInt(offset) || 0;
            
            const [rows] = await connection.query(
                `SELECT * FROM PaqueteTratamiento 
                 ORDER BY fecha_creacion DESC 
                 LIMIT ${limitInt} OFFSET ${offsetInt}`
            );
            return rows.map(row => new PaqueteTratamiento(row));
        } catch (error) {
            console.error('Error en PaqueteTratamiento.findAll:', error);
            throw error;
        }
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM PaqueteTratamiento WHERE id_paquete = ?',
            [id]
        );
        return rows.length > 0 ? new PaqueteTratamiento(rows[0]) : null;
    }

    static async create(paqueteData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO PaqueteTratamiento (nombre, descripcion, numero_sesiones, precio) 
             VALUES (?, ?, ?, ?)`,
            [
                paqueteData.nombre !== undefined ? paqueteData.nombre : null,
                paqueteData.descripcion !== undefined ? paqueteData.descripcion : null,
                paqueteData.numero_sesiones !== undefined ? paqueteData.numero_sesiones : null,
                paqueteData.precio !== undefined ? paqueteData.precio : null
            ]
        );
        return await PaqueteTratamiento.findById(result.insertId);
    }

    static async update(id, paqueteData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        Object.keys(paqueteData).forEach(key => {
            if (key !== 'id_paquete') {
                fields.push(`${key} = ?`);
                values.push(paqueteData[key] !== undefined ? paqueteData[key] : null);
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        await connection.execute(
            `UPDATE PaqueteTratamiento SET ${fields.join(', ')} WHERE id_paquete = ?`,
            values
        );

        return await PaqueteTratamiento.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM PaqueteTratamiento WHERE id_paquete = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async count() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM PaqueteTratamiento');
        return rows[0].total;
    }
}

module.exports = PaqueteTratamiento;
