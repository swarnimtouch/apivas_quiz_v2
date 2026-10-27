<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

initAdminSession();

if (isAdminLoggedIn()) {
    header('Location: ' . adminUrl('/dashboard'));
    exit;
} else {
    header('Location: ' . adminUrl('/login'));
    exit;
}
