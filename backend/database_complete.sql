CREATE DATABASE IF NOT EXISTS aliviate_db;
USE aliviate_db;

CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('administrador', 'operador') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE PaqueteTratamiento (
    id_paquete INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    numero_sesiones INT NOT NULL CHECK (numero_sesiones > 0),
    precio DECIMAL(10,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Paciente (
    id_paciente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    documento_identidad VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento VARCHAR(20) DEFAULT 'DNI',
    sexo ENUM('Masculino', 'Femenino'),
    fecha_nacimiento DATE,
    domicilio VARCHAR(200),
    telefono VARCHAR(15),
    email VARCHAR(100),
    estado_civil VARCHAR(20),
    ocupacion VARCHAR(100),
    nacionalidad VARCHAR(50) DEFAULT 'Peruana',
    contacto_emergencia_nombre VARCHAR(100),
    contacto_emergencia_telefono VARCHAR(15),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE HistoriaClinica (
    id_historia INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL UNIQUE,
    peso DECIMAL(5,2),
    talla DECIMAL(5,2),
    imc DECIMAL,
    motivo_consulta TEXT NOT NULL,
    diagnostico_medico_rehabilitacion TEXT,
    tratamientos_previos TEXT,
    antecedentes_patologicos TEXT,
    rasgos TEXT,
    cicatriz_quirurgica TEXT,
    traslados TEXT,
    fase_marcha TEXT,
    temperatura DECIMAL(4,2),
    f_cardiaca INT,
    f_respiratoria INT,
    pulso VARCHAR(50),
    oxigenacion DECIMAL(5,2),
    escala_dolor INT CHECK (escala_dolor BETWEEN 0 AND 10),
    habitos_salud TEXT,
    estado_ingravidez TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente) ON DELETE CASCADE
);

CREATE TABLE TratamientoAsignado (
    id_tratamiento_asignado INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_paquete INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observaciones TEXT,
    FOREIGN KEY (id_paciente) REFERENCES Paciente(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_paquete) REFERENCES PaqueteTratamiento(id_paquete) ON DELETE CASCADE
);

CREATE TABLE Sesion (
    id_sesion INT PRIMARY KEY AUTO_INCREMENT,
    id_tratamiento_asignado INT NOT NULL,
    numero_sesion INT NOT NULL CHECK (numero_sesion > 0),
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    asistencia BOOLEAN DEFAULT FALSE,
    notas TEXT,
    FOREIGN KEY (id_tratamiento_asignado) REFERENCES TratamientoAsignado(id_tratamiento_asignado) ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_fecha_programada ON Sesion(fecha_programada);
CREATE INDEX idx_id_paciente ON TratamientoAsignado(id_paciente);
