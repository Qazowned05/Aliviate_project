const { createConnection, getConnection } = require('./database');
const bcrypt = require('bcryptjs');

const createInitialAdmin = async () => {
  try {
    console.log('Verificando usuario administrador inicial...');
    
    // Crear conexión a la base de datos
    await createConnection();
    const db = getConnection();
    
    // Primero verificar si la tabla Usuario existe
    try {
      await db.execute('DESCRIBE Usuario');
    } catch (tableError) {
      console.log('La tabla Usuario no existe. Crear la base de datos primero.');
      return;
    }
    
    // Verificar si ya existe un usuario administrador
    const [adminUsers] = await db.execute(
      'SELECT * FROM Usuario WHERE rol = ?',
      ['administrador']
    );
    
    console.log(`Usuarios administradores encontrados: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('Usuario administrador ya existe:');
      adminUsers.forEach(user => {
        console.log(`   - ID: ${user.id_usuario}, Nombre: ${user.nombre}, Email: ${user.email}`);
      });
      console.log('=== CREDENCIALES DEL ADMINISTRADOR ===');
      console.log('   Email: admin@aliviate.com');
      console.log('   Contraseña: Admin123!');
      console.log('   IMPORTANTE: Cambiar esta contraseña después del primer inicio de sesión');
      return;
    }
    
    // Crear contraseña hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin123!', salt);
    
    // Crear usuario administrador
    await db.execute(
      'INSERT INTO Usuario (nombre, apellido, email, clave_hash, rol, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
      ['Administrador', 'Sistema', 'admin@aliviate.com', passwordHash, 'administrador', true]
    );
    
    console.log('Usuario administrador inicial creado:');
    console.log('   Email: admin@aliviate.com');
    console.log('   Contraseña: Admin123!');
    console.log('   IMPORTANTE: Cambiar esta contraseña después del primer inicio de sesión');
  } catch (error) {
    console.error('Error al crear usuario administrador inicial:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 La tabla no existe. Asegúrate de haber ejecutado el script de creación de la base de datos.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 La base de datos no existe. Crear la base de datos "aliviate_db" primero.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 No se puede conectar a la base de datos. Verificar que MySQL esté ejecutándose.');
    }
  }
};

module.exports = { createInitialAdmin };
