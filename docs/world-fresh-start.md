# Inicio desde cero

Ejecutar el contenido completo de `supabase/start-our-world-from-zero.sql` en el SQL Editor de Supabase y recargar la app.

La query está limitada al mundo de Amaro y Javiera (`7b8edae0-65da-44b7-a9b9-8073ecdd607e`). Limpia inventario, objetos colocados, XP, logros, recompensas reclamadas y visitas del bosque. Deja nivel 1, XP 0 y solo el bosque disponible. No borra fotos, racha, mensajes ni otros datos de la pareja, y no modifica el mundo de Test.

Antes del reinicio guarda una copia privada en `world_fresh_start_backups`. La clave `amaro-javiera-launch-v1` hace que repetir esta misma query conserve cualquier progreso posterior: no vuelve a vaciar el mundo.

La bienvenida se registra por usuario y por reinicio en Supabase. Cerrarla en la cuenta de Amaro no la cierra para Javiera. Mientras se muestra, el fondo presenta únicamente el paisaje, aunque la pareja haya jugado antes. Al entrar se muestra el estado compartido real, con Max y Abi. Los nuevos mundos también empiezan sin paquete inicial; el primer objeto se obtiene reclamando el regalo diario.

Validación: `npm run build`, `node scripts/check-world-catalog-sql.mjs` y `node scripts/check-world-editor.mjs`. La tarjeta también se comprobó en navegador a 320 y 390 px, en ambos temas, con reintento ante un fallo al guardar.
