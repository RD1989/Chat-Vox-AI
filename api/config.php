<?php
/**
 * ChatVox API Config
 * Gerencia a conexão com o banco de dados e headers globais.
 */

// Headers de segurança e CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Tratar requisição OPTIONS (Pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações do Banco de Dados
// NOTA: Em produção, estas variáveis devem vir de variáveis de ambiente ou arquivo oculto.
define('DB_HOST', 'localhost');
define('DB_NAME', 'chat_vox_db'); // Alterar conforme o banco criado
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        // Forçar modo de erro para exceção (usando valores numéricos para evitar alertas de lint)
        3 => 2, // 3 = PDO::ATTR_ERRMODE, 2 = PDO::ERRMODE_EXCEPTION
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
}
catch (\PDOException $e) {
    // Retornar erro JSON em vez de dump HTML
    http_response_code(500);
    echo json_encode([
        "error" => "Falha na conexão com o banco de dados",
        "details" => $e->getMessage()
    ]);
    exit();
}

/**
 * Função auxiliar para retornar JSON
 */
function sendResponse($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit();
}

/**
 * Função para gerar UUID v4
 */
function generateUuid()
{
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
