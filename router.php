<?php

declare(strict_types=1);

// Built-in PHP development server router (optional: php -S localhost:8000 router.php)
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if ($uri !== '/' && file_exists(__DIR__ . $uri) && !is_dir(__DIR__ . $uri)) {
    return false; // Serve static file directly
}

if ($uri === '/' || $uri === '/index.html') {
    require __DIR__ . '/index.html';
    return;
}

if ($uri === '/index.php') {
    header('Location: index.html');
    exit;
}

if ($uri === '/admin' || $uri === '/admin/') {
    require __DIR__ . '/admin/index.php';
    return;
}

if ($uri === '/admin/login' || $uri === '/admin/login/') {
    require __DIR__ . '/admin/login/index.php';
    return;
}

if ($uri === '/admin/dashboard' || $uri === '/admin/dashboard/') {
    require __DIR__ . '/admin/dashboard/index.php';
    return;
}

if ($uri === '/admin/logout' || $uri === '/admin/logout/') {
    require __DIR__ . '/admin/logout/index.php';
    return;
}

return false;
