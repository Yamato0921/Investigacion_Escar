<?php
// Helpers para gestionar uploads de forma segura (almacenar en filesystem)

function ensure_dir(string $path): bool
{
    if (!is_dir($path)) {
        return @mkdir($path, 0777, true);
    }
    return is_writable($path);
}

function sanitize_filename(string $name): string
{
    $name = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $name);
    $name = preg_replace('/_+/', '_', $name);
    return $name;
}

// Devolver el contenido del archivo como string Base64 para persistencia en DB (Render fix)
function get_file_as_base64(array $file, array $allowed_mimes = [], int $max_bytes = 2097152): ?string
{
    // default 2MB max for BSON performance
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK)
        return null;

    if ($file['size'] > $max_bytes)
        return null;

    if (!empty($allowed_mimes)) {
        if (file_exists(__DIR__ . '/validators.php')) {
            require_once __DIR__ . '/validators.php';
            $res = validate_file_upload($file, $allowed_mimes, $max_bytes);
            if (!$res['ok'])
                return null;
        }
    }

    $data = file_get_contents($file['tmp_name']);
    $base64 = base64_encode($data);
    $mime = mime_content_type($file['tmp_name']);

    return 'data:' . $mime . ';base64,' . $base64;
}

function save_uploaded_file(array $file, string $subdir = 'files', array $allowed_mimes = [], int $max_bytes = 5242880): ?string
{
    // allowed_mimes: array of MIME types. max_bytes default 5MB
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK)
        return null;
    // Validación básica de MIME y tamaño si se pasan allowed_mimes
    if (!empty($allowed_mimes)) {
        if (!file_exists(__DIR__ . '/validators.php')) {
            // fallback: allow
        } else {
            require_once __DIR__ . '/validators.php';
            $res = validate_file_upload($file, $allowed_mimes, $max_bytes);
            if (!$res['ok'])
                return null;
        }
    }

    $uploadBase = __DIR__ . '/uploads';
    if (!ensure_dir($uploadBase . '/' . $subdir)) {
        // Si no se puede crear/acceder al directorio, fallar silenciosamente o loguear
        error_log("[storage] Cannot ensure directory: " . $uploadBase . '/' . $subdir);
        return null;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = sanitize_filename(pathinfo($file['name'], PATHINFO_FILENAME));
    $newName = $safeName . '_' . bin2hex(random_bytes(6)) . ($ext ? '.' . $ext : '');
    $target = $uploadBase . '/' . $subdir . '/' . $newName;

    if (!move_uploaded_file($file['tmp_name'], $target))
        return null;

    // Asegurar que el archivo sea legible para el servidor web (644)
    @chmod($target, 0644);

    // devolver ruta relativa desde php/ para uso en DB
    return 'php/uploads/' . $subdir . '/' . $newName;
}
