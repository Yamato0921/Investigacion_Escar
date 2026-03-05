# Backend (PHP) - Instrucciones rápidas

Pasos para poner en producción el backend:

1. Instalar dependencias Composer:

```bash
composer install
```

2. Crear archivo de variables de entorno en `php/.env` (usar `.env.example` como referencia) y configurar:

- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET` (valor fuerte y secreto)
- `CORS_ORIGIN` (origen permitido)

3. Asegurar permisos y configuración del servidor web (Apache/Nginx) apuntando la API a `php/api_v2.php` o reescribir rutas según convenga.

4. Probar endpoints:

- `POST php/api_v2.php?action=login` (JSON: `username`, `password`) → devuelve `token`.
- `GET php/api_v2.php?action=list_investigadores` → lista pública.
- `POST php/api_v2.php?action=create_investigador` (multipart/form-data o JSON; requiere Authorization: Bearer <token>)

Endpoints principales (resumen)

- `POST php/api_v2.php?action=login` — Body JSON `{username,password}` → devuelve `{token}`.
- `POST php/api_v2.php?action=register` — Body JSON `{username,password,role?}` → crear usuario.
- `GET php/api_v2.php?action=list_investigadores` — público.
- `GET php/api_v2.php?action=get_investigador&id=ID` — protegido (Bearer).
- `POST php/api_v2.php?action=create_investigador` — multipart/form-data (foto opcional) (Bearer required).
- `POST php/api_v2.php?action=update_investigador` — multipart/form-data con `id` para actualizar (Bearer required).
- `GET php/api_v2.php?action=list_proyectos` — público.
- `GET php/api_v2.php?action=get_proyecto&id=ID` — público.
- `POST php/api_v2.php?action=create_proyecto` — crear proyecto (Bearer required).
- `POST php/api_v2.php?action=update_proyecto` — actualizar proyecto (Bearer required).
- `DELETE php/api_v2.php?action=delete_proyecto&id=ID` — eliminar (Admin only).
- `GET php/api_v2.php?action=list_semilleros` — público.
- `GET php/api_v2.php?action=get_semillero&id=ID` — público.
- `GET php/api_v2.php?action=list_convocatorias` — público.
- `GET php/api_v2.php?action=get_convocatoria&id=ID` — público.
- `POST php/api_v2.php?action=create_semillero` — crear semillero (Bearer required).
- `POST php/api_v2.php?action=update_semillero` — actualizar semillero (Bearer required).
- `GET php/api_v2.php?action=list_integrantes&semillero_id=ID` — listar integrantes.
- `POST php/api_v2.php?action=add_integrante` — agregar integrante (Bearer required).
- `DELETE php/api_v2.php?action=delete_integrante&id=ID` — eliminar integrante (Admin only).

Rol y permisos:

- Para rutas críticas de modificación y eliminación se requiere un token JWT con el `role` adecuado. El rol `admin` es necesario para operaciones de borrado.

Seguridad y recomendaciones:

- Validar y sanitizar siempre entradas desde frontend.
- En producción, configurar `CORS_ORIGIN` en `php/.env` para restringir orígenes.
- Migrar almacenamiento de archivos a S3/GCS si necesitas alta disponibilidad.
 - Para conectar a una base de datos en la nube (MySQL/MariaDB) establezca en `php/.env`:
	 - `DB_HOST`, `DB_PORT` (por defecto 3306), `DB_USER`, `DB_PASS`, `DB_NAME`.
	 - Si el proveedor ofrece un socket o DSN, puede usar `DB_SOCKET`.
	 - Para conexiones TLS, subir el certificado CA en el servidor y configurar `DB_SSL_CA=/ruta/ca.pem`.
 - Asegure que el servidor tenga acceso al host de la base de datos (firewall, lista de IPs permitidas).
 - Use usuarios y roles con privilegios mínimos en la DB y cambie la contraseña `admin` por defecto.
 - El backend incluye un limitador de tasa simple (configurable con `RATE_LIMIT_PER_MIN` en `php/.env`). Para producción se recomienda un rate limiter más robusto (Redis, nginx limit_req).

Notas de seguridad y despliegue:

- Cambiar `JWT_SECRET` por un valor seguro en producción.
- Usar HTTPS en producción.
- Configurar límites de tamaño de subida y validación de archivos.
