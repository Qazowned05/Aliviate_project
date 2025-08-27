# Aliviate Backend API

Backend profesional para la gestión de pacientes, historias clínicas, tratamientos y sesiones, con arquitectura modular, autenticación JWT y base de datos MySQL.

Este proyecto está diseñado para clínicas y centros de rehabilitación, permitiendo administrar pacientes, tratamientos, sesiones y usuarios de forma segura y escalable.

---

## Características

- **Arquitectura Modular:** Código organizado en controllers, models, middlewares y rutas.
- **Autenticación JWT:** Sistema seguro con tokens para administradores y operadores.
- **Gestión Completa:** Pacientes, historias clínicas, tratamientos, sesiones y usuarios.
- **Validación y Seguridad:** Validación de datos, CORS, sanitización y manejo de errores.
- **API RESTful:** Endpoints claros y documentados para integración con cualquier frontend.
- **Escalable:** Fácil de adaptar y ampliar para nuevas funcionalidades.

---

## Tecnologías

- **Backend:** Node.js + Express.js
- **Base de Datos:** MySQL
- **Autenticación:** JWT (JSON Web Tokens)
- **Validación:** Express Validator
- **Seguridad:** Helmet, CORS

---

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuración de base de datos y usuarios iniciales
│   ├── controllers/      # Lógica de negocio y endpoints
│   ├── models/           # Modelos de datos y consultas SQL
│   ├── middlewares/      # Autenticación, validación y manejo de errores
│   ├── routes/           # Definición de rutas de la API
├── server.js             # Servidor principal
├── package.json
├── README.md
├── API_DOCUMENTACION.md
├── database_complete.sql # Script de base de datos
└── .env.example          # Variables de entorno de ejemplo
```

---

## Instalación y Configuración

### Prerequisitos

- Node.js 16 o superior
- MySQL 8.0 o superior
- NPM o Yarn

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tuusuario/aliviate-backend.git
cd aliviate-backend/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```
# Servidor
PORT=3001
NODE_ENV=development

# Base de Datos MySQL
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=aliviate_db
DB_PORT=3306

# Autenticación
JWT_SECRET=tu-clave-secreta-muy-segura
```

> **Importante:** Cambia todas las credenciales por las tuyas antes de usar en producción.

### 4. Configurar Base de Datos

Ejecuta el siguiente script SQL en MySQL (o usa `database_complete.sql`):

```sql
CREATE DATABASE aliviate_db;
USE aliviate_db;
-- Ejecuta el contenido de database_complete.sql para crear todas las tablas necesarias
```

### 5. Iniciar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## Endpoints y Funcionalidades

A continuación se detallan todos los endpoints disponibles, su función y ejemplos de uso:

### Autenticación

- **POST /auth/login**
  - Inicia sesión y devuelve un token JWT.
  - Body: `{ email, password }`
  - Respuesta: `{ success, message, data: { token, usuario } }`

- **GET /auth/profile**
  - Devuelve el perfil del usuario autenticado.
  - Header: `Authorization: Bearer <token>`

- **POST /auth/change-password**
  - Permite cambiar la contraseña del usuario autenticado.
  - Body: `{ currentPassword, newPassword }`

- **POST /auth/refresh-token**
  - Renueva el token JWT.

### Usuarios (Solo Administradores)

- **GET /usuarios**
  - Lista todos los usuarios.
  - Query: `?page=1&limit=10`

- **POST /usuarios**
  - Crea un nuevo usuario.
  - Body: `{ nombre, apellido, email, password, rol }`

- **GET /usuarios/:id**
  - Obtiene usuario por ID.

- **PUT /usuarios/:id**
  - Actualiza usuario por ID.
  - Body: `{ nombre, apellido, email, rol }`

- **GET /usuarios/stats**
  - Devuelve estadísticas de usuarios.

### Pacientes

- **GET /pacientes**
  - Lista todos los pacientes.
  - Query: `?page=1&limit=10`

- **POST /pacientes**
  - Crea un nuevo paciente.
  - Body: `{ nombre, apellido, documento_identidad, email, telefono, fecha_nacimiento, genero, direccion, contacto_emergencia }`

- **GET /pacientes/search**
  - Busca pacientes por nombre o documento.
  - Query: `?q=María`

- **GET /pacientes/:id**
  - Obtiene paciente por ID.

- **GET /pacientes/:id/completo**
  - Obtiene paciente con historia clínica completa.

- **PUT /pacientes/:id**
  - Actualiza paciente por ID.
  - Body: `{ nombre, apellido, telefono, direccion }`

### Historias Clínicas

- **POST /historias**
  - Crea una historia clínica para un paciente.
  - Body: `{ id_paciente, diagnostico, observaciones, antecedentes, medicamentos }`

- **GET /historias/:id**
  - Obtiene historia clínica por ID.

- **PUT /historias/:id**
  - Actualiza historia clínica por ID.
  - Body: `{ diagnostico, observaciones, medicamentos }`

### Paquetes de Tratamiento

- **GET /paquetes**
  - Lista todos los paquetes de tratamiento.

- **POST /paquetes**
  - Crea un nuevo paquete de tratamiento.
  - Body: `{ nombre, descripcion, precio, numero_sesiones, duracion_sesion }`

- **GET /paquetes/:id**
  - Obtiene paquete por ID.

### Tratamientos Asignados

- **POST /tratamientos**
  - Asigna un tratamiento a un paciente.
  - Body: `{ id_paciente, id_paquete, fecha_inicio, observaciones }`

- **GET /tratamientos**
  - Lista todos los tratamientos asignados.

- **GET /tratamientos/paciente/:id**
  - Lista tratamientos asignados a un paciente.

### Sesiones

- **POST /sesiones**
  - Programa una sesión para un tratamiento.
  - Body: `{ id_tratamiento, fecha_programada, hora_programada, observaciones_pre }`

- **GET /sesiones**
  - Lista todas las sesiones programadas.

- **PUT /sesiones/:id/completar**
  - Marca una sesión como completada.
  - Body: `{ hora_fin, observaciones_post, ejercicios_realizados }`

### Salud

- **GET /health**
  - Verifica el estado de la API.

---

## Ejemplos de Uso

### Login

```js
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@aliviate.com', password: 'Admin123!' })
});
const data = await response.json();
const token = data.data.token;
```

### Crear Paciente

```js
const response = await fetch('http://localhost:3001/api/pacientes', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ nombre: 'María', apellido: 'González', documento_identidad: '12345678', ... })
});
```

### Programar Sesión

```js
const response = await fetch('http://localhost:3001/api/sesiones', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ id_tratamiento: 1, fecha_programada: '2025-08-17', hora_programada: '09:00:00', observaciones_pre: 'Primera sesión' })
});
```

---

## Seguridad

- **Autenticación JWT:** Tokens seguros con expiración.
- **Validación:** Todos los inputs son validados y sanitizados.
- **CORS:** Configurado para dominios específicos.
- **Helmet:** Headers de seguridad.
- **Variables de Entorno:** Configuración sensible fuera del código.

---

## Despliegue

### VPS/Servidor Dedicado

```bash
npm install -g pm2
pm2 start server.js --name "aliviate-backend"
pm2 startup
pm2 save
```

### Docker

```bash
docker build -t aliviate-backend .
docker run -p 3001:3001 aliviate-backend
```

---

## Monitoreo y Logs

El servidor incluye logging automático de:

- Conexiones a la base de datos
- Accesos de usuarios
- Errores del sistema

---

## Frontend de Ejemplo

Este repositorio incluye un **frontend de ejemplo** en la carpeta `frontend/` para probar y visualizar todas las funcionalidades de la API. El frontend está desarrollado en React y permite:

- Autenticación y gestión de usuarios
- Registro y edición de pacientes
- Asignación de tratamientos y programación de sesiones
- Visualización de historias clínicas
- Interfaz moderna y fácil de usar

Para instalar y ejecutar el frontend:

```bash
cd ../frontend
npm install
npm start
```

---

## Contribuir al Proyecto

¡Las contribuciones son bienvenidas! Este proyecto está diseñado para ser:

- **Código Abierto:** Libre para usar, modificar y distribuir
- **Genérico:** Fácil de adaptar a cualquier clínica o centro de salud
- **Educativo:** Buena base para aprender arquitectura Node.js

---

## Soporte

Para soporte técnico o preguntas, abre un issue en GitHub o contacta al autor.

---

**Aliviate Backend API** -  Desarrollado con ❤️ para la comunidad, por Qazowned05 (visita mi web de implementaciones: www.qazflow.com)

