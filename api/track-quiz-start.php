<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$configFile = dirname(__DIR__) . '/config/database.php';

if (!is_file($configFile)) {
    error_log('Quiz tracking database configuration is missing.');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Tracking is not configured']);
    exit;
}

$database = require $configFile;
$requiredKeys = ['host', 'port', 'database', 'username', 'password'];

foreach ($requiredKeys as $key) {
    if (!array_key_exists($key, $database)) {
        error_log("Quiz tracking database configuration is missing the '{$key}' value.");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Tracking is not configured']);
        exit;
    }
}

if ($database['username'] === 'CHANGE_ME' || $database['password'] === 'CHANGE_ME') {
    error_log('Quiz tracking database credentials have not been configured.');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Tracking is not configured']);
    exit;
}

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $database['host'],
        (int) $database['port'],
        $database['database']
    );

    $pdo = new PDO($dsn, $database['username'], $database['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $statement = $pdo->prepare(
        'INSERT INTO quiz_stats (metric_name, total_count)
         VALUES (:metric_name, 1)
         ON DUPLICATE KEY UPDATE total_count = total_count + 1'
    );
    $statement->execute(['metric_name' => 'quiz_started']);

    http_response_code(204);
} catch (Throwable $error) {
    error_log('Quiz start tracking failed: ' . $error->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to save quiz start']);
}
