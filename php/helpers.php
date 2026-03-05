<?php
// Helpers para respuestas JSON y control de errores
function send_json(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit();
}

function respond_ok($data = null): void {
    $out = ['success' => true];
    if ($data !== null) $out['data'] = $data;
    send_json($out, 200);
}

function respond_error(string $message, int $status = 400): void {
    send_json(['success' => false, 'message' => $message], $status);
}
