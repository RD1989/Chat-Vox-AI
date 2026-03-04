<?php
require_once __DIR__ . '/config.php';

try {
    echo json_encode([
        "status" => "success",
        "message" => "Conexão estabelecida com sucesso!",
        "host" => DB_HOST,
        "database" => DB_NAME,
        "php_version" => PHP_VERSION
    ]);
}
catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
