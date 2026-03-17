<?php
// cron_run.php
// This is the entrypoint your cPanel cron job should run.

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/profit_calculator.php';

try {
    $result = update_user_profits_daily();

    echo '[' . $result['timestamp'] . '] ';
    echo 'Daily profit update finished. Updated: ' . $result['updated'] .
         ', Skipped: ' . $result['skipped'] . PHP_EOL;
} catch (Throwable $e) {
    fwrite(STDERR, '[' . date(DATE_ATOM) . '] Error updating user profits: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
