<?php
// Funciones de validación reutilizables
function is_valid_email(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function is_valid_string(?string $s, int $min = 1, int $max = 500): bool {
    if ($s === null) return false;
    $len = mb_strlen(trim($s));
    return ($len >= $min && $len <= $max);
}

function validate_file_upload(array $file, array $allowed_mimes, int $max_bytes): array {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'message' => 'No file uploaded or upload error'];
    }

    if ($file['size'] > $max_bytes) {
        return ['ok' => false, 'message' => 'File exceeds maximum allowed size'];
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if ($mime === false) {
        return ['ok' => false, 'message' => 'Unable to detect file MIME type'];
    }

    if (!in_array($mime, $allowed_mimes, true)) {
        return ['ok' => false, 'message' => 'Invalid file type: ' . $mime];
    }

    return ['ok' => true, 'mime' => $mime];
}
