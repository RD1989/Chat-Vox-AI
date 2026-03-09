<?php
require_once __DIR__ . '/config.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

if ($path === 'auth/login' || $action === 'login') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Busca perfil
        $stmtProf = $pdo->prepare("SELECT * FROM profiles WHERE user_id = ?");
        $stmtProf->execute([$user['id']]);
        $profile = $stmtProf->fetch();

        response([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'profile' => $profile
            ],
            'access_token' => 'local-session-' . bin2hex(random_bytes(16))
        ]);
    }
    else {
        response(['error' => 'Credenciais inválidas'], 401);
    }
}

if ($action === 'register') {
    $email = $input['email'] ?? '';
    $password = password_hash($input['password'] ?? '', PASSWORD_BCRYPT);
    $full_name = $input['full_name'] ?? 'Usuário';

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        $stmt->execute([$email, $password]);
        $userId = $pdo->lastInsertId();

        $stmtProf = $pdo->prepare("INSERT INTO profiles (user_id, full_name, plan) VALUES (?, ?, 'free')");
        $stmtProf->execute([$userId, $full_name]);

        $pdo->commit();
        response(['success' => true, 'id' => $userId]);
    }
    catch (Exception $e) {
        $pdo->rollBack();
        response(['error' => 'Falha ao registrar: ' . $e->getMessage()], 500);
    }
}
?>
