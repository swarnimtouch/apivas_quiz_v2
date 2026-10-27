<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';

initAdminSession();

// Ensures user is logged in and session has not expired due to inactivity
requireAdminAuth();

$env = getEnvConfig();
$sessionTimeout = (int)($env['ADMIN_SESSION_TIMEOUT'] ?? 1800);
if ($sessionTimeout <= 0) $sessionTimeout = 1800;

// Language definitions
$allLanguages = [
    'en' => 'English',
    'hi' => 'Hindi',
    'gu' => 'Gujarati',
    'mr' => 'Marathi',
    'bn' => 'Bengali',
    'te' => 'Telugu',
    'ta' => 'Tamil',
    'kn' => 'Kannada',
    'ml' => 'Malayalam',
    'or' => 'Odia',
    'pa' => 'Punjabi',
    'ur' => 'Urdu',
];

$stats = [];
$visitorLangCounts = [];
$totalVisitors = 0;
$answersData = []; // [lang => [q_num => ['yes' => X, 'no' => Y]]]
$finishData = [];  // [lang => count]
$dbError = '';

try {
    $configFile = dirname(__DIR__, 2) . '/config/database.php';
    $dbConfig = is_file($configFile) ? require $configFile : [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'microlabs_quiz',
        'username' => 'microlabs_quiz',
        'password' => 'micro@123',
    ];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $dbConfig['host'],
        (int)$dbConfig['port'],
        $dbConfig['database']
    );

    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Ensure database tables exist automatically
    $pdo->exec("
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

    // 1. Fetch unique visitors count
    $totalVisitors = (int)$pdo->query('SELECT COUNT(*) FROM quiz_visitors')->fetchColumn();
    $totalUsers = $totalVisitors;

    // 2. Fetch Play Game & Lets Begin counts from quiz_visitors (deduplicated per user)
    $stmtClicks = $pdo->query('SELECT COALESCE(SUM(play_game_clicked), 0) as play_cnt, COALESCE(SUM(lets_begin_clicked), 0) as begin_cnt FROM quiz_visitors')->fetch();
    $totalPlayGame = (int)($stmtClicks['play_cnt'] ?? 0);
    $totalLetsBegin = (int)($stmtClicks['begin_cnt'] ?? 0);

    // 3. Fetch language breakdown from quiz_visitors (exact 1:1 mapping with visitors)
    $stmtLang = $pdo->query('SELECT language_code, COUNT(*) as cnt FROM quiz_visitors GROUP BY language_code');
    while ($row = $stmtLang->fetch()) {
        $code = strtolower(trim((string)$row['language_code']));
        if ($code !== '') {
            $visitorLangCounts[$code] = (int)$row['cnt'];
        }
    }

    // 4. Fetch Question Answers (Yes/No grouped by question and language)
    $stmtAns = $pdo->query('SELECT question_num, answer_choice, language_code, COUNT(*) as cnt FROM quiz_answers GROUP BY question_num, answer_choice, language_code');
    while ($row = $stmtAns->fetch()) {
        $q = (int)$row['question_num'];
        $l = strtolower(trim((string)$row['language_code'])) ?: 'en';
        $ch = strtolower(trim((string)$row['answer_choice']));
        $cnt = (int)$row['cnt'];

        if (!isset($answersData[$l])) {
            $answersData[$l] = [];
        }
        if (!isset($answersData[$l][$q])) {
            $answersData[$l][$q] = ['yes' => 0, 'no' => 0];
        }
        $answersData[$l][$q][$ch] = $cnt;
    }

    // 5. Fetch Question 6 / Finish Clicks grouped by language
    $stmtFinish = $pdo->query('SELECT language_code, COUNT(*) as cnt FROM quiz_finish_clicks GROUP BY language_code');
    while ($row = $stmtFinish->fetch()) {
        $l = strtolower(trim((string)$row['language_code'])) ?: 'en';
        $finishData[$l] = (int)$row['cnt'];
    }
} catch (Throwable $e) {
    $dbError = 'Database error: ' . htmlspecialchars($e->getMessage());
}

// Compute Language Counts (strictly only > 0)
$activeLanguages = [];
foreach ($allLanguages as $code => $name) {
    $c = (int)($visitorLangCounts[$code] ?? 0);
    if ($c > 0) {
        $activeLanguages[$code] = [
            'code' => $code,
            'name' => $name,
            'count' => $c,
        ];
    }
}

// Compute Overall (All Languages) Answer Counts for Questions 1..5
$overallAnswers = [];
for ($q = 1; $q <= 5; $q++) {
    $relYes = 0;
    $relNo = 0;
    foreach ($answersData as $l => $qData) {
        if (isset($qData[$q])) {
            $relYes += (int)($qData[$q]['yes'] ?? 0);
            $relNo += (int)($qData[$q]['no'] ?? 0);
        }
    }
    $overallAnswers[$q] = [
        'yes' => $relYes,
        'no' => $relNo,
    ];
}

// Overall Finish Click (exact sum from quiz_finish_clicks)
$overallFinishClicks = (int)array_sum($finishData);

$logoutUrl = adminUrl('/logout');
$refreshUrl = adminUrl('/dashboard');

// Questions definition
$questionInfo = [
    1 => ['sign' => 'B', 'title' => 'Balance Loss'],
    2 => ['sign' => 'E', 'title' => 'Eye (Vision) Changes'],
    3 => ['sign' => 'F', 'title' => 'Face Drooping / Twisting'],
    4 => ['sign' => 'A', 'title' => 'Arm Weakness'],
    5 => ['sign' => 'S', 'title' => 'Speech Difficulty'],
];

// Determine active languages for Answer filters
$tab2Languages = [];
foreach ($allLanguages as $code => $name) {
    if (isset($answersData[$code]) || isset($finishData[$code]) || isset($activeLanguages[$code])) {
        $tab2Languages[$code] = $name;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard • Stroke Awareness Quiz</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --primary-red: #e11344;
      --primary-dark: #b80d35;
      --navy: #0d3770;
      --navy-dark: #062557;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-dark: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --radius: 14px;
      --shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: var(--bg);
      color: var(--text-dark);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ===== TOP HEADER BAR ===== */
    .top-header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .header-container {
      max-width: 1320px;
      margin: 0 auto;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .header-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      background: #ffffff;
      border-radius: 6px;
    }

    .header-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--navy);
      line-height: 1.2;
      white-space: nowrap;
    }

    .header-badge {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .btn-refresh {
      background: #f1f5f9;
      color: var(--text-dark);
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-refresh:hover {
      background: #e2e8f0;
      color: var(--navy);
    }

    .btn-logout {
      background: rgba(225, 19, 68, 0.08);
      color: var(--primary-red);
      padding: 9px 16px;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(225, 19, 68, 0.25);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-logout:hover {
      background: var(--primary-red);
      color: #ffffff;
      border-color: var(--primary-red);
      box-shadow: 0 4px 12px rgba(225, 19, 68, 0.28);
    }

    /* ===== DASHBOARD MAIN CONTAINER ===== */
    .dashboard-container {
      max-width: 1320px;
      width: 100%;
      margin: 0 auto;
      padding: 28px 28px 48px;
      flex: 1;
    }

    .dashboard-section {
      margin-bottom: 34px;
    }

    .dashboard-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title i {
      font-size: 1.15rem;
      color: var(--primary-red);
    }

    /* ===== PRIMARY STAT CARDS ===== */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .stat-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 22px 20px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--card-accent, var(--navy));
    }

    .stat-label {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-number {
      font-size: 2.3rem;
      font-weight: 800;
      line-height: 1;
      color: var(--navy);
    }

    .accent-blue { --card-accent: #0d3770; }
    .accent-red { --card-accent: #e11344; }
    .accent-amber { --card-accent: #f59e0b; }

    /* ===== LANGUAGES SINGLE CARD DISPLAY ===== */
    .lang-single-wrap {
      display: flex;
    }

    .lang-card-single {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 20px 24px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 4px solid var(--primary-red);
      width: 100%;
      max-width: 380px;
      transition: all 0.2s ease;
    }

    .lang-card-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .lang-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--navy);
      line-height: 1.2;
    }

    .lang-code {
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .lang-card-stat {
      text-align: right;
    }

    .lang-stat-label {
      display: block;
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }

    .lang-count {
      font-size: 2.1rem;
      font-weight: 800;
      color: var(--navy);
      line-height: 1;
    }

    /* ===== INDUSTRY STANDARD LANGUAGE FILTER DROPDOWN ===== */
    .ans-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }

    .ans-title-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ans-title-block .section-title {
      margin-bottom: 0;
    }

    .section-badge {
      background: #eff6ff;
      color: var(--navy);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .lang-filter-control {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .filter-control-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--navy);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .filter-control-label i {
      color: var(--primary-red);
      font-size: 0.82rem;
    }

    .custom-select-wrap {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 260px;
    }

    .select-prefix-icon {
      position: absolute;
      left: 14px;
      color: var(--navy);
      font-size: 0.95rem;
      pointer-events: none;
      z-index: 1;
    }

    .custom-filter-select {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      padding: 10px 38px 10px 40px;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--navy);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
      transition: all 0.2s ease;
    }

    .custom-filter-select:hover {
      border-color: var(--navy);
      box-shadow: 0 4px 10px rgba(13, 55, 112, 0.08);
    }

    .custom-filter-select:focus {
      outline: none;
      border-color: var(--primary-red);
      box-shadow: 0 0 0 3px rgba(225, 19, 68, 0.15);
    }

    .select-arrow-icon {
      position: absolute;
      right: 14px;
      color: #94a3b8;
      font-size: 0.78rem;
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    .custom-select-wrap:focus-within .select-arrow-icon {
      color: var(--primary-red);
      transform: rotate(180deg);
    }

    .grid-qa {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 18px;
    }

    .qa-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 20px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .qa-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }

    .qa-sign-badge {
      background: #eff6ff;
      color: var(--navy);
      font-size: 0.72rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .qa-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--navy);
    }

    .qa-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .qa-box {
      border-radius: 10px;
      padding: 12px 14px;
      text-align: center;
    }

    .qa-box-yes {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .qa-box-yes .qa-choice-label {
      color: #059669;
    }
    .qa-box-yes .qa-choice-count {
      color: #065f46;
    }

    .qa-box-no {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    .qa-box-no .qa-choice-label {
      color: #dc2626;
    }
    .qa-box-no .qa-choice-count {
      color: #991b1b;
    }

    .qa-choice-label {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .qa-choice-count {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.1;
    }

    /* Finish Card (Sign T • Emergency Part) */
    .finish-card {
      grid-column: 1 / -1;
      max-width: 460px;
    }

    .qa-box-finish {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .qa-box-finish .qa-choice-label {
      font-size: 0.85rem;
      color: var(--navy);
      font-weight: 700;
    }

    .qa-box-finish .qa-choice-count {
      color: var(--navy);
      font-size: 2.2rem;
    }

    /* ===== RESPONSIVE MEDIA QUERIES ===== */

    /* Tablet: <= 1024px */
    @media (max-width: 1024px) {
      .header-container {
        padding: 14px 22px;
      }
      .dashboard-container {
        padding: 22px 22px 40px;
      }
      .grid-3 {
        gap: 14px;
      }
      .stat-card {
        padding: 18px 16px;
      }
      .stat-number {
        font-size: 2rem;
      }
      .grid-qa {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }
    }

    /* Mobile: <= 768px */
    @media (max-width: 768px) {
      .header-container {
        padding: 12px 16px;
      }
      .header-logo {
        height: 32px;
      }
      .header-title {
        font-size: 1.05rem;
      }
      .header-badge {
        font-size: 0.68rem;
      }
      .header-actions {
        gap: 8px;
      }
      .btn-refresh, .btn-logout {
        padding: 8px 12px;
        font-size: 0.82rem;
        border-radius: 8px;
      }

      .dashboard-container {
        padding: 16px 14px 36px;
      }
      .dashboard-section {
        margin-bottom: 26px;
      }
      .section-title {
        font-size: 1rem;
        margin-bottom: 12px;
      }

      /* Stack Primary Stats */
      .grid-3 {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .stat-card {
        padding: 16px;
        border-radius: 12px;
      }
      .stat-label {
        font-size: 0.78rem;
        margin-bottom: 6px;
      }
      .stat-number {
        font-size: 1.95rem;
      }

      /* Languages Card on Mobile */
      .lang-card-single {
        max-width: 100%;
        padding: 16px 18px;
      }
      .lang-name {
        font-size: 0.95rem;
      }
      .lang-count {
        font-size: 1.85rem;
      }

      /* Ans Header & Filter Dropdown on Mobile */
      .ans-header-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
      }
      .lang-filter-control {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      .custom-select-wrap {
        flex: 1;
        min-width: 0;
      }
      .custom-filter-select {
        font-size: 0.85rem;
        padding: 9px 34px 9px 36px;
      }

      /* Question Cards */
      .grid-qa {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .qa-card {
        padding: 16px 14px;
        border-radius: 12px;
      }
      .qa-header {
        margin-bottom: 12px;
        padding-bottom: 8px;
      }
      .qa-title {
        font-size: 0.9rem;
      }
      .qa-sign-badge {
        font-size: 0.68rem;
        padding: 2px 7px;
      }
      .qa-boxes {
        gap: 8px;
      }
      .qa-box {
        padding: 10px;
        border-radius: 8px;
      }
      .qa-choice-label {
        font-size: 0.7rem;
      }
      .qa-choice-count {
        font-size: 1.55rem;
      }
      .finish-card {
        max-width: 100%;
      }
      .qa-box-finish {
        padding: 14px 16px;
        border-radius: 8px;
      }
      .qa-box-finish .qa-choice-label {
        font-size: 0.82rem;
      }
      .qa-box-finish .qa-choice-count {
        font-size: 1.85rem;
      }
    }

    /* Small Mobile: <= 480px */
    @media (max-width: 480px) {
      .filter-control-label span {
        display: none;
      }
      .header-container {
        padding: 10px 12px;
      }
      .header-title {
        font-size: 0.95rem;
      }
      .header-badge {
        font-size: 0.64rem;
      }
      .btn-refresh, .btn-logout {
        padding: 7px 10px;
        font-size: 0.78rem;
        gap: 5px;
      }
      .dashboard-container {
        padding: 14px 10px 32px;
      }

      .lang-name {
        font-size: 0.82rem;
      }
      .lang-count {
        font-size: 1.35rem;
      }
      .stat-number {
        font-size: 1.75rem;
      }
    }

    /* Extra Small: <= 360px */
    @media (max-width: 360px) {
      .btn-refresh span, .btn-logout span {
        display: none;
      }

    }
  </style>
</head>
<body>

  <!-- ===== TOP HEADER ===== -->
  <header class="top-header">
    <div class="header-container">
      <div class="header-brand">
        <img src="../../media/microlab.png" alt="Micro Labs" class="header-logo" onerror="this.src='../media/microlab.png'">
        <div>
          <h1 class="header-title">Stroke Awareness Quiz</h1>
          <span class="header-badge">Admin Dashboard</span>
        </div>
      </div>

      <!-- Refresh & Logout Buttons side-by-side -->
      <div class="header-actions">
        <a href="<?php echo htmlspecialchars($refreshUrl); ?>" class="btn-refresh" title="Reload Counts">
          <i class="fas fa-rotate"></i>
          <span>Refresh</span>
        </a>

        <a href="<?php echo htmlspecialchars($logoutUrl); ?>" class="btn-logout" title="Sign Out">
          <i class="fas fa-arrow-right-from-bracket"></i>
          <span>Logout</span>
        </a>
      </div>
    </div>
  </header>

  <!-- ===== MAIN DASHBOARD CONTENT ===== -->
  <main class="dashboard-container">

    <!-- ============================================== -->
    <!-- SECTION 1: USERS & PRIMARY COUNTS             -->
    <!-- ============================================== -->
    <section class="dashboard-section">
      <div class="grid-3">
        <!-- Total Users -->
        <div class="stat-card accent-blue">
          <div class="stat-label">
            <span>Total Users</span>
            <i class="fas fa-user-group"></i>
          </div>
          <div class="stat-number"><?php echo number_format($totalUsers); ?></div>
        </div>

        <!-- Total Play Game click -->
        <div class="stat-card accent-amber">
          <div class="stat-label">
            <span>Total Play Game click</span>
            <i class="fas fa-play"></i>
          </div>
          <div class="stat-number"><?php echo number_format($totalPlayGame); ?></div>
        </div>

        <!-- Total Lets Begin click -->
        <div class="stat-card accent-red">
          <div class="stat-label">
            <span>Total Lets Begin click</span>
            <i class="fas fa-rocket"></i>
          </div>
          <div class="stat-number"><?php echo number_format($totalLetsBegin); ?></div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- SECTION 2: LANGUAGES                          -->
    <!-- ============================================== -->
    <section class="dashboard-section" id="languagesSection">
      <div class="ans-header-bar">
        <div class="ans-title-block">
          <h2 class="section-title">
            <i class="fas fa-language"></i>
            <span>Languages</span>
          </h2>
        </div>

        <!-- Language Filter Dropdown for Languages Section (No All Languages, default English) -->
        <div class="lang-filter-control">
          <label for="overviewLangSelect" class="filter-control-label">
            <i class="fas fa-filter"></i>
            <span>Language:</span>
          </label>
          <div class="custom-select-wrap">
            <i class="fas fa-globe select-prefix-icon"></i>
            <select id="overviewLangSelect" class="custom-filter-select" aria-label="Filter Language">
              <?php foreach ($allLanguages as $code => $name): ?>
                <option value="<?php echo htmlspecialchars($code); ?>" <?php echo $code === 'en' ? 'selected' : ''; ?>>
                  <?php echo htmlspecialchars($name); ?> (<?php echo strtoupper($code); ?>)
                </option>
              <?php endforeach; ?>
            </select>
            <i class="fas fa-chevron-down select-arrow-icon"></i>
          </div>
        </div>
      </div>

      <!-- Selected Language Box (Total Users for selected language) -->
      <div class="lang-single-wrap">
        <div class="lang-card-single" id="selectedLangCard">
          <div class="lang-card-info">
            <div class="lang-name" id="selectedLangName"><?php echo htmlspecialchars($allLanguages['en']); ?></div>
            <span class="lang-code" id="selectedLangCode">EN</span>
          </div>
          <div class="lang-card-stat">
            <span class="lang-stat-label">Total Users</span>
            <div class="lang-count" id="selectedLangCount"><?php echo number_format((int)($visitorLangCounts['en'] ?? 0)); ?></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================== -->
    <!-- SECTION 3: ANS (QUESTIONS & RESPONSES)        -->
    <!-- ============================================== -->
    <section class="dashboard-section" id="ansSection">
      <div class="ans-header-bar">
        <div class="ans-title-block">
          <h2 class="section-title">
            <i class="fas fa-clipboard-check"></i>
            <span>Ans</span>
          </h2>
        </div>

        <!-- Language Filter Dropdown for Ans Section (Includes All Languages by default) -->
        <div class="lang-filter-control">
          <label for="ansLangSelect" class="filter-control-label">
            <i class="fas fa-filter"></i>
            <span>Language:</span>
          </label>
          <div class="custom-select-wrap">
            <i class="fas fa-globe select-prefix-icon"></i>
            <select id="ansLangSelect" class="custom-filter-select" aria-label="Filter Answers by Language">
              <option value="all" selected>All Languages</option>
              <?php foreach ($allLanguages as $code => $name): ?>
                <option value="<?php echo htmlspecialchars($code); ?>">
                  <?php echo htmlspecialchars($name); ?> (<?php echo strtoupper($code); ?>)
                </option>
              <?php endforeach; ?>
            </select>
            <i class="fas fa-chevron-down select-arrow-icon"></i>
          </div>
        </div>
      </div>

      <!-- Question Cards Grid -->
      <div class="grid-qa">
        <?php for ($q = 1; $q <= 5; $q++): ?>
          <div class="qa-card" data-q="<?php echo $q; ?>">
            <div class="qa-header">
              <span class="qa-title"><?php echo htmlspecialchars($questionInfo[$q]['title']); ?></span>
              <span class="qa-sign-badge">Sign <?php echo $questionInfo[$q]['sign']; ?> • Q<?php echo $q; ?></span>
            </div>
            <div class="qa-boxes">
              <div class="qa-box qa-box-yes">
                <div class="qa-choice-label">Yes</div>
                <div class="qa-choice-count" id="q<?php echo $q; ?>-yes"><?php echo number_format($overallAnswers[$q]['yes']); ?></div>
              </div>
              <div class="qa-box qa-box-no">
                <div class="qa-choice-label">No</div>
                <div class="qa-choice-count" id="q<?php echo $q; ?>-no"><?php echo number_format($overallAnswers[$q]['no']); ?></div>
              </div>
            </div>
          </div>
        <?php endfor; ?>

        <!-- 6th Time to emergency is NOT a question, strictly Finish Click -->
        <div class="qa-card finish-card">
          <div class="qa-header">
            <span class="qa-title">Emergency Level (Call 112)</span>
            <span class="qa-sign-badge">Sign T • Finish Part</span>
          </div>
          <div class="qa-box-finish">
            <div class="qa-choice-label">Finish Click</div>
            <div class="qa-choice-count" id="finish-count"><?php echo number_format($overallFinishClicks); ?></div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- Raw data passed safely for instant language filtering -->
  <script>
    var answersByLanguage = <?php echo json_encode($answersData, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
    var finishByLanguage = <?php echo json_encode($finishData, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
    var overallAnswers = <?php echo json_encode($overallAnswers, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
    var overallFinish = <?php echo (int)$overallFinishClicks; ?>;

    var langNames = <?php echo json_encode($allLanguages, JSON_HEX_TAG | JSON_HEX_AMP); ?>;
    var visitorLangCounts = <?php echo json_encode($visitorLangCounts, JSON_HEX_TAG | JSON_HEX_AMP); ?>;

    // 1. Language Filter for Section 2 (Languages) - Updates single box
    var overviewLangSelect = document.getElementById('overviewLangSelect');
    var selectedLangName = document.getElementById('selectedLangName');
    var selectedLangCode = document.getElementById('selectedLangCode');
    var selectedLangCount = document.getElementById('selectedLangCount');

    if (overviewLangSelect) {
      overviewLangSelect.addEventListener('change', function() {
        var code = this.value;
        if (selectedLangName) selectedLangName.textContent = langNames[code] || code;
        if (selectedLangCode) selectedLangCode.textContent = code.toUpperCase();
        if (selectedLangCount) {
          var count = visitorLangCounts[code] || 0;
          selectedLangCount.textContent = Number(count).toLocaleString();
        }
      });
    }

    // 2. Language Filter for Section 3 (Ans)
    var ansLangSelect = document.getElementById('ansLangSelect');
    if (ansLangSelect) {
      ansLangSelect.addEventListener('change', function() {
        updateAnswerCountsForLanguage(this.value);
      });
    }

    function updateAnswerCountsForLanguage(lang) {
      if (lang === 'all') {
        for (var q = 1; q <= 5; q++) {
          var yEl = document.getElementById('q' + q + '-yes');
          var nEl = document.getElementById('q' + q + '-no');
          if (yEl) yEl.textContent = overallAnswers[q] ? (overallAnswers[q].yes || 0).toLocaleString() : '0';
          if (nEl) nEl.textContent = overallAnswers[q] ? (overallAnswers[q].no || 0).toLocaleString() : '0';
        }
        var fEl = document.getElementById('finish-count');
        if (fEl) fEl.textContent = overallFinish.toLocaleString();
        return;
      }

      var langData = answersByLanguage[lang] || {};
      for (var q = 1; q <= 5; q++) {
        var qData = langData[q] || { yes: 0, no: 0 };
        var yEl = document.getElementById('q' + q + '-yes');
        var nEl = document.getElementById('q' + q + '-no');
        if (yEl) yEl.textContent = (qData.yes || 0).toLocaleString();
        if (nEl) nEl.textContent = (qData.no || 0).toLocaleString();
      }

      var finishCnt = finishByLanguage[lang] || 0;
      var fEl = document.getElementById('finish-count');
      if (fEl) fEl.textContent = finishCnt.toLocaleString();
    }

    // 30-Minute Inactivity Auto-Logout (Resets on click/interaction, runs silently with NO timer visible)
    (function() {
      var INACTIVITY_LIMIT_MS = <?php echo (int)$sessionTimeout * 1000; ?>;
      var loginUrl = '<?php echo adminUrl("/login?timeout=1"); ?>';
      var pingUrl = '<?php echo adminUrl("/ping.php"); ?>';
      var logoutTimer = null;
      var lastPingTime = Date.now();

      function triggerLogout() {
        window.location.href = loginUrl;
      }

      function resetInactivityTimer() {
        if (logoutTimer) clearTimeout(logoutTimer);
        logoutTimer = setTimeout(triggerLogout, INACTIVITY_LIMIT_MS);

        // Periodically ping server when user is active to keep PHP session in sync
        var now = Date.now();
        if (now - lastPingTime > 5 * 60 * 1000) {
          lastPingTime = now;
          fetch(pingUrl, { credentials: 'same-origin' }).catch(function() {});
        }
      }

      // Initial timer start
      resetInactivityTimer();

      // Listen for click and user interactions in admin panel to reset inactivity timer
      ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(function(evt) {
        document.addEventListener(evt, resetInactivityTimer, { passive: true });
      });
    })();
  </script>
</body>
</html>