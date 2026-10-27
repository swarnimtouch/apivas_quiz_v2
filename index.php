<?php

declare(strict_types=1);

// Seamlessly redirect to index.html if user accesses /index.php
header('Location: index.html');
exit;
