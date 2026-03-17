<?php
// config.php

// ==== ROI SETTINGS (MUST MATCH YOUR APP) ====

// Monthly ROI 11% (0.11)
define('ROI_MONTHLY', 0.11);
// Weekly ROI (simple division by 4)
define('ROI_WEEKLY', ROI_MONTHLY / 4);
// Daily ROI (weekly / 7)
define('ROI_DAILY', ROI_WEEKLY / 7);

// ==== DATABASE SETTINGS ====
// For MongoDB:
define('MONGO_URI', getenv('MONGODB_URI') ?: 'mongodb://127.0.0.1:27017');
define('MONGO_DB_NAME', getenv('MONGODB_DB') ?: 'crypto-payment');
define('MONGO_USERS_COLLECTION', 'users');

// If you prefer MySQL instead of Mongo,
// you can ignore these and use the MySQL section in db.php.
