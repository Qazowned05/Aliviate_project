const { getConnection } = require('../config/database');

class Paciente {
    constructor(data = {}) {
        this.id_paciente = data.id_paciente;
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.documento_identidad = data.documento_identidad;
        this.tipo_documento = data.tipo_documento;
        this.sexo = data.sexo;
        this.fecha_nacimiento = data.fecha_nacimiento;
        this.domicilio = data.domicilio;
        this.telefono = data.telefono;
        this.email = data.email;
        this.estado_civil = data.estado_civil;
        this.ocupacion = data.ocupacion;
        this.nacionalidad = data.nacionalidad;
        this.contacto_emergencia_nombre = data.contacto_emergencia_nombre;
        this.contacto_emergencia_telefono = data.contacto_emergencia_telefono;
        this.fecha_registro = data.fecha_registro;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    static async findAll(limit = 10, offset = 0, search = '') {
        const connection = getConnection();
        
        try {
            const limitInt = parseInt(limit) || 10;
            const offsetInt = parseInt(offset) || 0;
            
            let query = `
                SELECT * FROM Paciente 
                WHERE 1=1
            `;

            if (search) {
                const searchTerm = search.replace(/'/g, "''"); 
                query += ` AND (nombre LIKE '%${searchTerm}%' OR apellido LIKE '%${searchTerm}%' OR documento_identidad LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%')`;
            }

            query += ` ORDER BY fecha_registro DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

            const [rows] = await connection.query(query);
            return rows.map(row => new Paciente(row));
        } catch (error) {
            console.error('Error en Paciente.findAll:', error);
            throw error;
        }
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM Paciente WHERE id_paciente = ?',
            [id]
        );
        return rows.length > 0 ? new Paciente(rows[0]) : null;
    }

    static async findByDocumento(documento) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM Paciente WHERE documento_identidad = ?',
            [documento]
        );
        return rows.length > 0 ? new Paciente(rows[0]) : null;
    }

    static async create(pacienteData) {
        const connection = getConnection();
        
        try {
            const [result] = await connection.execute(
                `INSERT INTO Paciente (
                    nombre, apellido, documento_identidad, tipo_documento, sexo, 
                    fecha_nacimiento, domicilio, telefono, email, estado_civil, 
                    ocupacion, nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pacienteData.nombre !== undefined ? pacienteData.nombre : null,
                    pacienteData.apellido !== undefined ? pacienteData.apellido : null,
                    pacienteData.documento_identidad !== undefined ? pacienteData.documento_identidad : null,
                    pacienteData.tipo_documento !== undefined ? pacienteData.tipo_documento : 'DNI',
                    pacienteData.sexo !== undefined ? pacienteData.sexo : null,
                    pacienteData.fecha_nacimiento !== undefined ? pacienteData.fecha_nacimiento : null,
                    pacienteData.domicilio !== undefined ? pacienteData.domicilio : null,
                    pacienteData.telefono !== undefined ? pacienteData.telefono : null,
                    pacienteData.email !== undefined ? pacienteData.email : null,
                    pacienteData.estado_civil !== undefined ? pacienteData.estado_civil : null,
                    pacienteData.ocupacion !== undefined ? pacienteData.ocupacion : null,
                    pacienteData.nacionalidad !== undefined ? pacienteData.nacionalidad : 'Peruana',
                    pacienteData.contacto_emergencia_nombre !== undefined ? pacienteData.contacto_emergencia_nombre : null,
                    pacienteData.contacto_emergencia_telefono !== undefined ? pacienteData.contacto_emergencia_telefono : null
                ]
            );
            return await Paciente.findById(result.insertId);
        } catch (error) {
            console.error('Error en Paciente.create:', error);
            throw error;
        }
    }

    static async update(id, pacienteData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        Object.keys(pacienteData).forEach(key => {
            if (key !== 'id_paciente') {
                fields.push(`${key} = ?`);
                values.push(pacienteData[key] !== undefined ? pacienteData[key] : null);
            }
        });

        if (fields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        await connection.execute(
            `UPDATE Paciente SET ${fields.join(', ')} WHERE id_paciente = ?`,
            values
        );

        return await Paciente.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM Paciente WHERE id_paciente = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async count(search = '') {
        const connection = getConnection();
        
        try {
            let query = 'SELECT COUNT(*) as total FROM Paciente WHERE 1=1';

            if (search) {
                const searchTerm = search.replace(/'/g, "''");
                query += ` AND (nombre LIKE '%${searchTerm}%' OR apellido LIKE '%${searchTerm}%' OR documento_identidad LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%')`;
            }

            const [rows] = await connection.query(query);
            return rows[0].total;
        } catch (error) {
            console.error('Error en Paciente.count:', error);
            throw error;
        }
    }

    static async getWithHistoriaClinica(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT p.*, h.* 
             FROM Paciente p 
             LEFT JOIN HistoriaClinica h ON p.id_paciente = h.id_paciente 
             WHERE p.id_paciente = ?`,
            [id]
        );
        return rows.length > 0 ? rows[0] : null;
    }
}

module.exports = Paciente;
