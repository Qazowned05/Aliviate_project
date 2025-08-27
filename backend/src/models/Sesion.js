const { getConnection } = require('../config/database');

class Sesion {
    constructor(data = {}) {
        this.id_sesion = data.id_sesion;
        this.id_tratamiento_asignado = data.id_tratamiento_asignado;
        this.numero_sesion = data.numero_sesion;
        this.fecha_programada = data.fecha_programada;
        this.hora_programada = data.hora_programada;
        this.asistencia = data.asistencia;
        this.notas = data.notas;
        this.estado_confirmado = data.estado_confirmado || false;
    }

    static async findAll(limit = 10, offset = 0, filters = {}) {
        const connection = getConnection();
        let query = `
            SELECT s.*, 
                   ta.id_paciente,
                   p.nombre as paciente_nombre, p.apellido as paciente_apellido,
                   pt.nombre as paquete_nombre
            FROM Sesion s
            INNER JOIN TratamientoAsignado ta ON s.id_tratamiento_asignado = ta.id_tratamiento_asignado
            INNER JOIN Paciente p ON ta.id_paciente = p.id_paciente
            INNER JOIN PaqueteTratamiento pt ON ta.id_paquete = pt.id_paquete
            WHERE 1=1
        `;
        let params = [];

        if (filters.id_tratamiento_asignado) {
            query += ` AND s.id_tratamiento_asignado = ?`;
            params.push(filters.id_tratamiento_asignado);
        }

        if (filters.fecha_programada) {
            query += ` AND DATE(s.fecha_programada) = ?`;
            params.push(filters.fecha_programada);
        }

        if (filters.asistencia !== undefined) {
            query += ` AND s.asistencia = ?`;
            params.push(filters.asistencia);
        }

    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;
    query += ` ORDER BY s.fecha_programada DESC, s.hora_programada DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;
    const [rows] = await connection.query(query);
    return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT s.*, 
                    ta.id_paciente,
                    p.nombre as paciente_nombre, p.apellido as paciente_apellido,
                    pt.nombre as paquete_nombre
             FROM Sesion s
             INNER JOIN TratamientoAsignado ta ON s.id_tratamiento_asignado = ta.id_tratamiento_asignado
             INNER JOIN Paciente p ON ta.id_paciente = p.id_paciente
             INNER JOIN PaqueteTratamiento pt ON ta.id_paquete = pt.id_paquete
             WHERE s.id_sesion = ?`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    static async findByTratamientoId(idTratamiento) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT * FROM Sesion 
             WHERE id_tratamiento_asignado = ? 
             ORDER BY numero_sesion ASC`,
            [idTratamiento]
        );
        return rows.map(row => {
            const sesion = new Sesion(row);
            if (sesion.asistencia === 1) {
                sesion.asistencia = true;
            } else if (sesion.asistencia === 0) {
                sesion.asistencia = false;
            }
            return sesion;
        });
    }

    static async create(sesionData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO Sesion (id_tratamiento_asignado, numero_sesion, fecha_programada, hora_programada, notas) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                sesionData.id_tratamiento_asignado !== undefined ? sesionData.id_tratamiento_asignado : null,
                sesionData.numero_sesion !== undefined ? sesionData.numero_sesion : null,
                sesionData.fecha_programada !== undefined ? sesionData.fecha_programada : null,
                sesionData.hora_programada !== undefined ? sesionData.hora_programada : null,
                sesionData.notas !== undefined ? sesionData.notas : null
            ]
        );
        return await Sesion.findById(result.insertId);
    }

    static async createMultiple(sesionesData) {
        const connection = getConnection();
        const values = sesionesData.map(sesion => [
            sesion.id_tratamiento_asignado,
            sesion.numero_sesion,
            sesion.fecha_programada,
            sesion.hora_programada,
            null, 
            sesion.notas || null
        ]);

        const placeholders = sesionesData.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = values.flat();

        const [result] = await connection.execute(
            `INSERT INTO Sesion (id_tratamiento_asignado, numero_sesion, fecha_programada, hora_programada, asistencia, notas) 
             VALUES ${placeholders}`,
            flatValues
        );

        return result.affectedRows;
    }

    static async update(id, sesionData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        Object.keys(sesionData).forEach(key => {
            if (key !== 'id_sesion') {
                fields.push(`${key} = ?`);
                values.push(sesionData[key] !== undefined ? sesionData[key] : null);
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        await connection.execute(
            `UPDATE Sesion SET ${fields.join(', ')} WHERE id_sesion = ?`,
            values
        );

        return await Sesion.findById(id);
    }

    static async updateAsistencia(id, asistencia, notas = null) {
        const connection = getConnection();
        await connection.execute(
            'UPDATE Sesion SET asistencia = ?, notas = ? WHERE id_sesion = ?',
            [asistencia, notas, id]
        );
        return await Sesion.findById(id);
    }

    static async confirmarEstados(idTratamiento) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'UPDATE Sesion SET estado_confirmado = true WHERE id_tratamiento_asignado = ?',
            [idTratamiento]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Sesion WHERE id_sesion = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async deleteByTratamientoId(idTratamiento) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Sesion WHERE id_tratamiento_asignado = ?',
            [idTratamiento]
        );
        return result.affectedRows > 0;
    }

    static async count(filters = {}) {
        const connection = getConnection();
        let query = 'SELECT COUNT(*) as total FROM Sesion WHERE 1=1';
        let params = [];

        if (filters.id_tratamiento_asignado) {
            query += ` AND id_tratamiento_asignado = ?`;
            params.push(filters.id_tratamiento_asignado);
        }

        if (filters.fecha_programada) {
            query += ` AND DATE(fecha_programada) = ?`;
            params.push(filters.fecha_programada);
        }

        if (filters.asistencia !== undefined) {
            query += ` AND asistencia = ?`;
            params.push(filters.asistencia);
        }

        const [rows] = await connection.execute(query, params);
        return rows[0].total;
    }

    static async getEstadisticasPorTratamiento(idTratamiento) {
        const connection = getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                COUNT(*) as total_sesiones,
                COUNT(CASE WHEN asistencia = true THEN 1 END) as sesiones_asistidas,
                COUNT(CASE WHEN asistencia = false THEN 1 END) as sesiones_perdidas,
                COUNT(CASE WHEN asistencia IS NULL THEN 1 END) as sesiones_pendientes
            FROM Sesion 
            WHERE id_tratamiento_asignado = ?
        `, [idTratamiento]);
        return rows[0];
    }
}

module.exports = Sesion;
