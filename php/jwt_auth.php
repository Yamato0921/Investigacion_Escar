<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/bootstrap.php';

function jwt_secret(): string {
    $s = getenv('JWT_SECRET');
    if (!$s) {
        // seguridad: no dejar vacío en producción
        $s = 'dev_secret_change_me';
    }
    return $s;
}

function generate_jwt(array $payload): string {
    $issuedAt = time();
    $exp = $issuedAt + 3600 * 24; // 24 horas por defecto
    $token = array_merge(['iat' => $issuedAt, 'exp' => $exp], $payload);
    return JWT::encode($token, jwt_secret(), 'HS256');
}

function get_bearer_token(): ?string {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx o fastcgi
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!$headers) return null;
    if (preg_match('/Bearer\s+(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

function validate_jwt(): ?array {
    $token = get_bearer_token();
    if (!$token) return null;
    try {
        $decoded = JWT::decode($token, new Key(jwt_secret(), 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        error_log('JWT validate error: ' . $e->getMessage());
        return null;
    }
}
