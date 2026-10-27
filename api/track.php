<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = [];

if (!empty($_POST)) {
    $data = $_POST;
} elseif (!empty($rawInput)) {
    $jsonData = json_decode($rawInput, true);
    if (is_array($jsonData)) {
        $data = $jsonData;
    } else {
        parse_str($rawInput, $parsed);
        if (is_array($parsed)) {
            $data = $parsed;
        }
    }
}

$event = trim((string)($data['event'] ?? $data['metric'] ?? ''));
$userId = substr(trim((string)($data['user_id'] ?? $data['uid'] ?? '')), 0, 64);
$lang = strtolower(substr(trim((string)($data['lang'] ?? $data['language'] ?? 'en')), 0, 10));
if ($lang === '') $lang = 'en';

$questionNum = isset($data['question']) ? (int)$data['question'] : 0;
$choice = strtolower(trim((string)($data['choice'] ?? $data['answer'] ?? '')));
if ($choice !== 'yes' && $choice !== 'no') {
    $choice = '';
}

// Map legacy event aliases
if ($event === 'play_quiz') $event = 'play_game';
if ($event === 'start_quiz' || $event === 'quiz_started') $event = 'lets_begin';

$validEvents = ['visitor', 'user_visit', 'play_game', 'lets_begin', 'answer', 'finish_click', 'quiz_completed', 'lang_used'];

if (!in_array($event, $validEvents, true) && !str_starts_with($event, 'question_')) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid event']);
    exit;
}

$configFile = dirname(__DIR__) . '/config/database.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database configuration is missing']);
    exit;
}

$database = require $configFile;

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $database['host'],
        (int)$database['port'],
        $database['database']
    );

    $pdo = new PDO($dsn, $database['username'], $database['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Ensure database tables exist with proper schema and unique constraints
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS quiz_stats (
            metric_name VARCHAR(50) NOT NULL PRIMARY KEY,
            total_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS quiz_visitors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            language_code VARCHAR(10) NOT NULL DEFAULT 'en',
            play_game_clicked TINYINT(1) NOT NULL DEFAULT 0,
            lets_begin_clicked TINYINT(1) NOT NULL DEFAULT 0,
            first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_lang (user_id, language_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            question_num TINYINT NOT NULL,
            answer_choice ENUM('yes', 'no') NOT NULL,
            language_code VARCHAR(10) NOT NULL DEFAULT 'en',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_lang_q (user_id, language_code, question_num),
            INDEX idx_q_lang_ans (question_num, language_code, answer_choice)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS quiz_finish_clicks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            language_code VARCHAR(10) NOT NULL DEFAULT 'en',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_lang (user_id, language_code),
            INDEX idx_finish_lang (language_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Helper to register / update visitor in quiz_visitors with click tracking
    $helperUpsertVisitor = function(string $uid, string $language, int $play = 0, int $begin = 0) use ($pdo) {
        if ($uid === '') return;
        $stmt = $pdo->prepare('
            INSERT INTO quiz_visitors (user_id, language_code, play_game_clicked, lets_begin_clicked)
            VALUES (:uid, :lang, :play, :begin)
            ON DUPLICATE KEY UPDATE 
                play_game_clicked = GREATEST(play_game_clicked, VALUES(play_game_clicked)),
                lets_begin_clicked = GREATEST(lets_begin_clicked, VALUES(lets_begin_clicked)),
                last_seen = CURRENT_TIMESTAMP
        ');
        $stmt->execute([
            'uid' => $uid,
            'lang' => $language,
            'play' => $play,
            'begin' => $begin,
        ]);
    };

    // 1. Visitor / User registration or language update
    if ($event === 'visitor' || $event === 'user_visit' || $event === 'lang_used') {
        if ($userId !== '') {
            $helperUpsertVisitor($userId, $lang, 0, 0);
        }
    }

    // 2. Play Game click
    elseif ($event === 'play_game') {
        if ($userId !== '') {
            $helperUpsertVisitor($userId, $lang, 1, 0);
        }
    }

    // 3. Let's Begin click
    elseif ($event === 'lets_begin') {
        if ($userId !== '') {
            $helperUpsertVisitor($userId, $lang, 0, 1);
        }
    }

    // 4. Answer Yes / No
    elseif ($event === 'answer') {
        if ($questionNum >= 1 && $questionNum <= 5 && ($choice === 'yes' || $choice === 'no') && $userId !== '') {
            $stmt = $pdo->prepare('
                INSERT INTO quiz_answers (user_id, question_num, answer_choice, language_code)
                VALUES (:uid, :q, :choice, :lang)
                ON DUPLICATE KEY UPDATE 
                    answer_choice = VALUES(answer_choice), 
                    created_at = CURRENT_TIMESTAMP
            ');
            $stmt->execute([
                'uid' => $userId,
                'q' => $questionNum,
                'choice' => $choice,
                'lang' => $lang,
            ]);

            $helperUpsertVisitor($userId, $lang, 0, 0);
        }
    }

    // 5. Finish Click (Emergency Level / Finish Game)
    elseif ($event === 'finish_click' || $event === 'quiz_completed') {
        if ($userId !== '') {
            $stmt = $pdo->prepare('
                INSERT INTO quiz_finish_clicks (user_id, language_code)
                VALUES (:uid, :lang)
                ON DUPLICATE KEY UPDATE 
                    created_at = CURRENT_TIMESTAMP
            ');
            $stmt->execute([
                'uid' => $userId,
                'lang' => $lang,
            ]);

            $helperUpsertVisitor($userId, $lang, 0, 0);
        }
    }

    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    error_log('Tracking error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to record tracking event']);
}
