<?php
require_once __DIR__ . '/config.php';

$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query strings
$path = parse_url($request, PHP_URL_PATH);
$path = str_replace('/api/', '', $path);

// Roteamento Dinâmico (Mini-PostgREST)
$allowedTables = ['vox_agents', 'vox_leads', 'vox_messages', 'profiles', 'plans', 'system_settings'];

if (in_array($path, $allowedTables)) {
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM `$path` LIMIT 100");
        $stmt->execute();
        response($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $keys = array_keys($input);
        $fields = implode('`, `', $keys);
        $placeholders = implode(', ', array_fill(0, count($keys), '?'));

        $sql = "INSERT INTO `$path` (`$fields`) VALUES ($placeholders)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($input));

        response(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}

// Rotas Específicas
switch ($path) {
    case 'auth/login':
        require_once __DIR__ . '/auth.php';
        break;

    case 'auth/register':
        $_GET['action'] = 'register';
        require_once __DIR__ . '/auth.php';
        break;

    default:
        response(['error' => 'Route not found: ' . $path], 404);
        break;
}
?>
