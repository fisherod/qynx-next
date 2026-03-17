<?php
// profit_calculator.php

require_once __DIR__ . '/db.php';

/**
 * Runs one daily profit update:
 * profit += usd_balance * ROI_DAILY
 * for each user with positive usd_balance.
 */
function update_user_profits_daily(): array
{
    $users = get_users_collection();
    $cursor = $users->find([]);

    $updatedCount = 0;
    $skippedCount = 0;
    $now = new DateTimeImmutable();

    foreach ($cursor as $user) {
        $usdBalance = isset($user['usdBalance']) ? (float) $user['usdBalance'] : 0.0;
        if (!is_finite($usdBalance) || $usdBalance <= 0) {
            $skippedCount++;
            continue;
        }

        $delta = $usdBalance * ROI_DAILY;
        if (!is_finite($delta) || $delta <= 0) {
            $skippedCount++;
            continue;
        }

        $users->updateOne(
            ['_id' => $user['_id']],
            [
                '$inc' => ['profit' => $delta],
                '$set' => ['updatedAt' => $now]
            ]
        );
        $updatedCount++;
    }

    return [
        'updated' => $updatedCount,
        'skipped' => $skippedCount,
        'timestamp' => $now->format(DateTime::ATOM),
    ];
}
