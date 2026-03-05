<?php
// Uso: php hash_and_update.php <username> <newpassword>
require_once __DIR__ . '/bootstrap.php';

$username = $argv[1] ?? null;
$newpass = $argv[2] ?? null;
if (!$username || !$newpass) {
    echo "Usage: php hash_and_update.php <username> <newpassword>\n";
    exit(1);
}

$hash = password_hash($newpass, PASSWORD_BCRYPT);
try {
    $stmt = $conn->prepare('UPDATE usuarios SET password = ? WHERE username = ?');
    $stmt->execute([$hash, $username]);
    if ($stmt->rowCount() > 0) {
        echo "Password updated for user: {$username}\n";
    } else {
        echo "No user updated (check username).\n";
    }
} catch (PDOException $e) {
    echo "DB error: " . $e->getMessage() . PHP_EOL;
}
