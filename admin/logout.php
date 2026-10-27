<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

logoutAdmin();

header('Location: ' . adminUrl('/login?logged_out=1'));
exit;
