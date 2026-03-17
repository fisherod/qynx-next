<?php
// db.php

require_once __DIR__ . '/config.php';

use MongoDB\Client;

/**
 * Get MongoDB users collection.
 *
 * @return MongoDB\Collection
 */
function get_users_collection()
{
    static $collection = null;
    if ($collection !== null) {
        return $collection;
    }

    // Requires "mongodb/mongodb" via Composer, or the MongoDB PHP driver.
    $client = new Client(MONGO_URI);
    $db = $client->selectDatabase(MONGO_DB_NAME);
    $collection = $db->selectCollection(MONGO_USERS_COLLECTION);

    return $collection;
}
