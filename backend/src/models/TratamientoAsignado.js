const { getConnection } = require('../config/database');

class TratamientoAsignado {
    constructor(data = {}) {
        this.id_tratamiento_asignado = data.id_tratamiento_asignado;
        this.id_paciente = data.id_paciente;
        this.id_paquete = data.id_paquete;
        this.fecha_asignacion = data.fecha_asignacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
        this.observaciones = data.observaciones;
        this.estado = data.estado || 'activo'; 
    }

    static async findAll(limit = 10, offset = 0, filters = {}) {
        const connection = getConnection();
        let query = `
            SELECT ta.*, 
                   p.nombre as paciente_nombre, p.apellido as paciente_apellido,
                   pt.nombre as paquete_nombre, pt.numero_sesiones, pt.precio
            FROM TratamientoAsignado ta
            INNER JOIN Paciente p ON ta.id_paciente = p.id_paciente
            INNER JOIN PaqueteTratamiento pt ON ta.id_paquete = pt.id_paquete
            WHERE 1=1
        `;
        let params = [];

        if (filters.id_paciente) {
            query += ` AND ta.id_paciente = ?`;
            params.push(filters.id_paciente);
        }

        if (filters.estado) {
            query += ` AND ta.estado = ?`;
            params.push(filters.estado);
        }

    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;
    query += ` ORDER BY ta.fecha_asignacion DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
    const [rows] = await connection.query(query);
    return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT ta.*, 
                    p.nombre as paciente_nombre, p.apellido as paciente_apellido,
                    pt.nombre as paquete_nombre, pt.numero_sesiones, pt.precio
             FROM TratamientoAsignado ta
             INNER JOIN Paciente p ON ta.id_paciente = p.id_paciente
             INNER JOIN PaqueteTratamiento pt ON ta.id_paquete = pt.id_paquete
             WHERE ta.id_tratamiento_asignado = ?`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    static async findByPacienteId(idPaciente) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT ta.*, 
                    pt.nombre as paquete_nombre, pt.numero_sesiones, pt.precio
             FROM TratamientoAsignado ta
             INNER JOIN PaqueteTratamiento pt ON ta.id_paquete = pt.id_paquete
             WHERE ta.id_paciente = ?
             ORDER BY ta.fecha_asignacion DESC`,
            [idPaciente]
        );
        return rows;
    }

    static async create(tratamientoData) {
        const connection = getConnection();
        const id_paciente = tratamientoData.id_paciente !== undefined ? tratamientoData.id_paciente : null;
        const id_paquete = tratamientoData.id_paquete !== undefined ? tratamientoData.id_paquete : null;
        const observaciones = tratamientoData.observaciones !== undefined ? tratamientoData.observaciones : null;
        const [result] = await connection.execute(
            `INSERT INTO TratamientoAsignado (id_paciente, id_paquete, observaciones) 
             VALUES (?, ?, ?)`,
            [id_paciente, id_paquete, observaciones]
        );
        return await TratamientoAsignado.findById(result.insertId);
    }

    static async update(id, tratamientoData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        Object.keys(tratamientoData).forEach(key => {
            if (key !== 'id_tratamiento_asignado') {
                fields.push(`${key} = ?`);
                values.push(tratamientoData[key] !== undefined ? tratamientoData[key] : null);
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        await connection.execute(
            `UPDATE TratamientoAsignado SET ${fields.join(', ')} WHERE id_tratamiento_asignado = ?`,
            values
        );

        return await TratamientoAsignado.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM TratamientoAsignado WHERE id_tratamiento_asignado = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async count(filters = {}) {
        const connection = getConnection();
        let query = 'SELECT COUNT(*) as total FROM TratamientoAsignado WHERE 1=1';
        let params = [];

        if (filters.id_paciente) {
            query += ` AND id_paciente = ?`;
            params.push(filters.id_paciente);
        }

        if (filters.estado) {
            query += ` AND estado = ?`;
            params.push(filters.estado);
        }

        const [rows] = await connection.execute(query, params);
        return rows[0].total;
    }

    static async getEstadisticas() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                COUNT(*) as total_tratamientos,
                COUNT(CASE WHEN estado = 'activo' THEN 1 END) as activos,
                COUNT(CASE WHEN estado = 'finalizado' THEN 1 END) as finalizados,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as cancelados
            FROM TratamientoAsignado
        `);
        return rows[0];
    }
}

module.exports = TratamientoAsignado;
