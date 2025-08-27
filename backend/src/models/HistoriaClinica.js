const { getConnection } = require('../config/database');

class HistoriaClinica {
    constructor(data = {}) {
        this.id_historia = data.id_historia;
        this.id_paciente = data.id_paciente;
        this.peso = data.peso;
        this.talla = data.talla;
        this.imc = data.imc;
        this.motivo_consulta = data.motivo_consulta;
        this.diagnostico_medico_rehabilitacion = data.diagnostico_medico_rehabilitacion;
        this.tratamientos_previos = data.tratamientos_previos;
        this.antecedentes_patologicos = data.antecedentes_patologicos;
        this.rasgos = data.rasgos;
        this.cicatriz_quirurgica = data.cicatriz_quirurgica;
        this.traslados = data.traslados;
        this.fase_marcha = data.fase_marcha;
        this.temperatura = data.temperatura;
        this.f_cardiaca = data.f_cardiaca;
        this.f_respiratoria = data.f_respiratoria;
        this.pulso = data.pulso;
        this.oxigenacion = data.oxigenacion;
        this.escala_dolor = data.escala_dolor;
        this.habitos_salud = data.habitos_salud;
        this.estado_ingravidez = data.estado_ingravidez;
        this.fecha_creacion = data.fecha_creacion;
        this.fecha_actualizacion = data.fecha_actualizacion;
    }

    static async findByPacienteId(idPaciente) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM HistoriaClinica WHERE id_paciente = ?',
            [idPaciente]
        );
        return rows.length > 0 ? new HistoriaClinica(rows[0]) : null;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM HistoriaClinica WHERE id_historia = ?',
            [id]
        );
        return rows.length > 0 ? new HistoriaClinica(rows[0]) : null;
    }

    static async create(historiaData) {
        const connection = getConnection();
        
        try {
            const [result] = await connection.execute(
                `INSERT INTO HistoriaClinica (
                    id_paciente, peso, talla, imc, motivo_consulta, diagnostico_medico_rehabilitacion,
                    tratamientos_previos, antecedentes_patologicos, rasgos, cicatriz_quirurgica,
                    traslados, fase_marcha, temperatura, f_cardiaca, f_respiratoria, pulso,
                    oxigenacion, escala_dolor, habitos_salud, estado_ingravidez
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    historiaData.id_paciente !== undefined ? historiaData.id_paciente : null,
                    historiaData.peso !== undefined ? historiaData.peso : null,
                    historiaData.talla !== undefined ? historiaData.talla : null,
                    historiaData.imc !== undefined ? historiaData.imc : null,
                    historiaData.motivo_consulta !== undefined ? historiaData.motivo_consulta : null,
                    historiaData.diagnostico_medico_rehabilitacion !== undefined ? historiaData.diagnostico_medico_rehabilitacion : (historiaData.diagnostico !== undefined ? historiaData.diagnostico : null),
                    historiaData.tratamientos_previos !== undefined ? historiaData.tratamientos_previos : null,
                    historiaData.antecedentes_patologicos !== undefined ? historiaData.antecedentes_patologicos : (historiaData.antecedentes !== undefined ? historiaData.antecedentes : null),
                    historiaData.rasgos !== undefined ? historiaData.rasgos : null,
                    historiaData.cicatriz_quirurgica !== undefined ? historiaData.cicatriz_quirurgica : null,
                    historiaData.traslados !== undefined ? historiaData.traslados : null,
                    historiaData.fase_marcha !== undefined ? historiaData.fase_marcha : null,
                    historiaData.temperatura !== undefined ? historiaData.temperatura : null,
                    historiaData.f_cardiaca !== undefined ? historiaData.f_cardiaca : null,
                    historiaData.f_respiratoria !== undefined ? historiaData.f_respiratoria : null,
                    historiaData.pulso !== undefined ? historiaData.pulso : null,
                    historiaData.oxigenacion !== undefined ? historiaData.oxigenacion : null,
                    historiaData.escala_dolor !== undefined ? historiaData.escala_dolor : null,
                    historiaData.habitos_salud !== undefined ? historiaData.habitos_salud : null,
                    historiaData.estado_ingravidez !== undefined ? historiaData.estado_ingravidez : null
                ]
            );
            return await HistoriaClinica.findById(result.insertId);
        } catch (error) {
            console.error('Error en HistoriaClinica.create:', error);
            throw error;
        }
    }

    static async update(id, historiaData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        const fieldMapping = {
            'diagnostico': 'diagnostico_medico_rehabilitacion',
            'antecedentes': 'antecedentes_patologicos'
        };

        try {
            Object.keys(historiaData).forEach(key => {
                if (key !== 'id_historia' && key !== 'id_paciente') {
                    const dbFieldName = fieldMapping[key] || key;
                    values.push(historiaData[key] !== undefined ? historiaData[key] : null);
                    fields.push(`${dbFieldName} = ?`);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);
            await connection.execute(
                `UPDATE HistoriaClinica SET ${fields.join(', ')} WHERE id_historia = ?`,
                values
            );

            return await HistoriaClinica.findById(id);
        } catch (error) {
            console.error('Error en HistoriaClinica.update:', error);
            throw error;
        }
    }

    static async updateByPacienteId(idPaciente, historiaData) {
        const connection = getConnection();
        const fields = [];
        const values = [];

        const fieldMapping = {
            'diagnostico': 'diagnostico_medico_rehabilitacion',
            'antecedentes': 'antecedentes_patologicos'
        };

        try {
            Object.keys(historiaData).forEach(key => {
                if (historiaData[key] !== undefined && key !== 'id_historia' && key !== 'id_paciente') {
                    const dbFieldName = fieldMapping[key] || key;
                    fields.push(`${dbFieldName} = ?`);
                    values.push(historiaData[key] || null);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(idPaciente);
            await connection.execute(
                `UPDATE HistoriaClinica SET ${fields.join(', ')} WHERE id_paciente = ?`,
                values
            );

            return await HistoriaClinica.findByPacienteId(idPaciente);
        } catch (error) {
            console.error('Error en HistoriaClinica.updateByPacienteId:', error);
            throw error;
        }
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM HistoriaClinica WHERE id_historia = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async deleteByPacienteId(idPaciente) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM HistoriaClinica WHERE id_paciente = ?',
            [idPaciente]
        );
        return result.affectedRows > 0;
    }
}

module.exports = HistoriaClinica;
