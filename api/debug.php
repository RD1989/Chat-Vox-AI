<?php
/**
 * ChatVox API - Debug Tool
 * Valida a conexão e ambiente.
 */
require_once __DIR__ . '/config.php';

$report = [
    "php_version" => PHP_VERSION,
    "current_time" => date('Y-m-d H:i:s'),
    "database_connection" => "success",
    "mysql_version" => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
    "tables_found" => []
];

try {
    $stmt = $pdo->query("SHOW TABLES");
    $report["tables_found"] = $stmt->fetchAll(PDO::FETCH_COLUMN);
}
catch (Exception $e) {
    $report["database_connection"] = "failed: " . $e->getMessage();
}

sendResponse($report);
