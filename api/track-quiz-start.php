<?php

declare(strict_types=1);

// Backward-compatible entrypoint that delegates to track.php
if (empty($_POST['event']) && empty($_POST['metric'])) {
    $_POST['event'] = 'quiz_started';
}

require __DIR__ . '/track.php';
