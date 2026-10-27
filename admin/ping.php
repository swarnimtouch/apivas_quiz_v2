<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

initAdminSession();

if (!isAdminLoggedIn()) {
    http_response_code(401);
    echo json_encode(['status' => 'expired']);
    exit;
}

// checkInactivityTimeout() inside isAdminLoggedIn() already refreshed $_SESSION['last_activity']
echo json_encode(['status' => 'active', 'timestamp' => time()]);
exit;
