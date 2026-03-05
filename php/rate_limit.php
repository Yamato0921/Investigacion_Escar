<?php
// Limitador de tasa simple por IP usando archivo con ventana en segundos
function rate_limit_check(int $maxRequests = 120, int $windowSeconds = 60): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $dir = __DIR__ . '/logs/ratelimit';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $file = $dir . '/' . md5($ip) . '.json';

    $now = time();
    $data = ['ts' => $now, 'count' => 0];
    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $parsed = json_decode($raw, true);
        if (is_array($parsed)) $data = $parsed;
    }

    // Resetear ventana si expiró
    if (($now - ($data['ts'] ?? 0)) > $windowSeconds) {
        $data = ['ts' => $now, 'count' => 0];
    }

    $data['count'] = ($data['count'] ?? 0) + 1;

    // Guardar estado (con bloqueo simple)
    $fp = fopen($file, 'c+');
    if ($fp) {
        flock($fp, LOCK_EX);
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }

    return $data['count'] <= $maxRequests;
}
