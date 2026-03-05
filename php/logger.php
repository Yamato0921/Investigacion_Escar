<?php
function backend_log(string $level, string $message): void {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) mkdir($logDir, 0755, true);
    $file = $logDir . '/backend.log';
    $time = date('Y-m-d H:i:s');
    $line = "[{$time}] [{$level}] {$message}\n";
    error_log($line, 3, $file);
}
