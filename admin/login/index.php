<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';

initAdminSession();

// If already logged in, redirect straight to dashboard
requireAdminGuest();

$env = getEnvConfig();
$adminEmail = $env['ADMIN_EMAIL'] ?? 'admin@gmail.com';
$adminPassword = $env['ADMIN_PASSWORD'] ?? '123456';

$error = '';
$info = '';

// Check query param notices
if (isset($_GET['timeout']) && $_GET['timeout'] === '1') {
    $info = 'You have been logged out due to inactivity. Please sign in again.';
} elseif (isset($_GET['logged_out']) && $_GET['logged_out'] === '1') {
    $info = 'You have been safely logged out.';
}

// Brute-force lockout logic
$now = time();
$lockoutUntil = $_SESSION['login_lockout_until'] ?? 0;
$failedAttempts = $_SESSION['login_failed_attempts'] ?? 0;

if ($lockoutUntil > $now) {
    $remainingSeconds = $lockoutUntil - $now;
    $error = "Too many failed attempts. Please wait {$remainingSeconds} seconds.";
}

// Process POST submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($lockoutUntil > $now) {
        $remainingSeconds = $lockoutUntil - $now;
        $error = "Too many failed attempts. Please wait {$remainingSeconds} seconds.";
    } else {
        $submittedToken = (string)($_POST['csrf_token'] ?? '');
        if (!hash_equals($_SESSION['csrf_token'] ?? '', $submittedToken)) {
            $error = 'Security session expired. Please refresh and try again.';
        } else {
            $inputEmail = trim((string)($_POST['email'] ?? ''));
            $inputPassword = (string)($_POST['password'] ?? '');

            $emailMatch = hash_equals(strtolower($adminEmail), strtolower($inputEmail));
            $passMatch = hash_equals($adminPassword, $inputPassword);

            if ($emailMatch && $passMatch) {
                // Successful Login
                session_regenerate_id(true);
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_user_email'] = $adminEmail;
                $_SESSION['last_activity'] = time();
                unset($_SESSION['login_failed_attempts'], $_SESSION['login_lockout_until']);

                header('Location: ' . adminUrl('/dashboard'));
                exit;
            } else {
                $failedAttempts++;
                $_SESSION['login_failed_attempts'] = $failedAttempts;
                if ($failedAttempts >= 5) {
                    $_SESSION['login_lockout_until'] = $now + 60; // 60s lockout
                    $error = 'Too many failed attempts. Please wait 60 seconds.';
                } else {
                    $error = 'Invalid email or password.';
                }
            }
        }
    }
}

$csrfToken = $_SESSION['csrf_token'] ?? '';
$actionUrl = adminUrl('/login/index.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login • Stroke Awareness Quiz</title>
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
      --radius: 20px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: radial-gradient(circle at 10% 20%, rgba(225, 19, 68, 0.05) 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, rgba(13, 55, 112, 0.06) 0%, transparent 40%),
                  var(--bg);
      color: var(--text-dark);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 40px 36px;
      box-shadow: 0 20px 40px -15px rgba(225, 19, 68, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
      text-align: center;
    }

    .login-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
      margin-bottom: 20px;
    }

    .login-card h1 {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--navy);
      margin-bottom: 6px;
    }

    .login-card p.subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 28px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.88rem;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: left;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
    }

    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-dark);
      margin-bottom: 8px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper i {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      font-size: 1rem;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 14px 12px 42px;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      font-size: 0.95rem;
      font-family: inherit;
      color: var(--text-dark);
      outline: none;
      transition: all 0.2s ease;
    }

    .input-wrapper input:focus {
      border-color: var(--primary-red);
      box-shadow: 0 0 0 3px rgba(225, 19, 68, 0.15);
    }

    .btn-submit {
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-red), var(--primary-dark));
      color: #ffffff;
      font-family: inherit;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 26px;
      box-shadow: 0 8px 18px rgba(225, 19, 68, 0.28);
      transition: all 0.2s ease;
    }

    .btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 22px rgba(225, 19, 68, 0.35);
    }

    .footer-note {
      margin-top: 24px;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    /* Mobile responsiveness for Login */
    @media (max-width: 480px) {
      body {
        padding: 16px 12px;
      }
      .login-card {
        padding: 28px 18px;
        border-radius: 16px;
      }
      .login-logo {
        height: 38px;
        margin-bottom: 16px;
      }
      .login-card h1 {
        font-size: 1.35rem;
      }
      .login-card p.subtitle {
        font-size: 0.8rem;
        margin-bottom: 22px;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .input-wrapper input {
        font-size: 0.9rem;
        padding: 11px 12px 11px 38px;
      }
      .btn-submit {
        padding: 12px;
        font-size: 0.92rem;
        margin-top: 20px;
      }
    }
  </style>
</head>
<body>

  <div class="login-card">
    <img src="../../media/microlab.png" alt="Micro Labs" class="login-logo" onerror="this.src='../media/microlab.png'">
    <h1>Admin Login</h1>
    <p class="subtitle">Stroke Awareness Quiz • Management Portal</p>

    <?php if (!empty($error)): ?>
      <div class="alert alert-error">
        <i class="fas fa-circle-exclamation"></i>
        <span><?php echo htmlspecialchars($error); ?></span>
      </div>
    <?php endif; ?>

    <?php if (!empty($info)): ?>
      <div class="alert alert-info">
        <i class="fas fa-circle-info"></i>
        <span><?php echo htmlspecialchars($info); ?></span>
      </div>
    <?php endif; ?>

    <form method="POST" action="<?php echo htmlspecialchars($actionUrl); ?>">
      <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">

      <div class="form-group">
        <label for="email">Admin Email</label>
        <div class="input-wrapper">
          <i class="fas fa-envelope"></i>
          <input type="email" id="email" name="email" placeholder="Enter your email" required autofocus autocomplete="username">
        </div>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password">
        </div>
      </div>

      <button type="submit" class="btn-submit">
        <span>Sign In to Dashboard</span>
        <i class="fas fa-arrow-right"></i>
      </button>
    </form>

    <p class="footer-note">Micro Labs Healthcare Initiative • Admin Security</p>
  </div>

</body>
</html>
