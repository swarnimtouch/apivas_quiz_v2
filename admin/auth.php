<?php

declare(strict_types=1);

if (!function_exists('getEnvConfig')) {
    function getEnvConfig(): array {
        static $cached = null;
        if ($cached !== null) return $cached;

        $envPath = dirname(__DIR__) . '/.env';
        $config = [];
        if (is_file($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                if (strpos($line, '=') !== false) {
                    [$k, $v] = explode('=', $line, 2);
                    $k = trim($k);
                    $v = trim($v);
                    if ((str_starts_with($v, '"') && str_ends_with($v, '"')) ||
                        (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                        $v = substr($v, 1, -1);
                    }
                    $config[$k] = $v;
                }
            }
        }
        $cached = $config;
        return $config;
    }
}

function initAdminSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.use_strict_mode', '1');
        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax',
        ]);
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

function getAdminBaseUrl(): string {
    $projectDir = str_replace('\\', '/', dirname(__DIR__));
    $docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT'] ?? '');

    if ($docRoot !== '' && str_starts_with($projectDir, $docRoot)) {
        $sub = substr($projectDir, strlen($docRoot));
        $prefix = rtrim($sub, '/');
        return ($prefix !== '' ? $prefix : '') . '/admin';
    }

    return '/admin';
}

function adminUrl(string $path = ''): string {
    $base = getAdminBaseUrl();
    $cleanPath = '/' . ltrim($path, '/');
    return ($cleanPath === '/') ? $base : $base . $cleanPath;
}

function checkInactivityTimeout(): void {
    initAdminSession();

    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        return;
    }

    $env = getEnvConfig();
    // Default: 1800 seconds (30 minutes) of inactivity
    $timeout = (int)($env['ADMIN_SESSION_TIMEOUT'] ?? 1800);
    if ($timeout <= 0) $timeout = 1800;

    $now = time();
    $lastActivity = $_SESSION['last_activity'] ?? $now;

    if (($now - $lastActivity) > $timeout) {
        logoutAdmin();
        $redirectUrl = adminUrl('/login?timeout=1');
        header('Location: ' . $redirectUrl);
        exit;
    }

    // Refresh last activity timestamp
    $_SESSION['last_activity'] = $now;
}

function isAdminLoggedIn(): bool {
    initAdminSession();
    checkInactivityTimeout();
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function requireAdminAuth(): void {
    if (!isAdminLoggedIn()) {
        header('Location: ' . adminUrl('/login'));
        exit;
    }
}

function requireAdminGuest(): void {
    if (isAdminLoggedIn()) {
        header('Location: ' . adminUrl('/dashboard'));
        exit;
    }
}

function logoutAdmin(): void {
    initAdminSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
}
