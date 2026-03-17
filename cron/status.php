<?php
// status.php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/profit_calculator.php';

if (isset($_GET['run']) && $_GET['run'] === '1') {
    $result = update_user_profits_daily();
    $msg = 'Manual run: updated ' . $result['updated'] .
           ' users, skipped ' . $result['skipped'] .
           ' at ' . $result['timestamp'];
} else {
    $msg = 'Status OK. Append ?run=1 to run a manual update.';
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Profit Cron Status</title>
</head>
<body>
  <h1>Profit Cron Status</h1>
  <p><?php echo htmlspecialchars($msg, ENT_QUOTES, 'UTF-8'); ?></p>
</body>
</html>
