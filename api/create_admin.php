<?php
require_once __DIR__ . '/config.php';

// Este script deve ser deletado após o uso em produção!
// Uso: api/create_admin.php?email=seu@email.com&pass=suasenha

$email = $_GET['email'] ?? 'admin@chatvox.io';
$pass = $_GET['pass'] ?? 'admin123';
$hash = password_hash($pass, PASSWORD_BCRYPT);

try {
    $pdo->beginTransaction();

    // Tenta inserir ou atualizar usuário
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password)");
    $stmt->execute([$email, $hash]);

    $userId = $pdo->lastInsertId();
    if (!$userId) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $userId = $stmt->fetchColumn();
    }

    // Tenta inserir ou atualizar perfil como scale (admin)
    $stmtProf = $pdo->prepare("INSERT INTO profiles (user_id, full_name, plan) VALUES (?, 'Administrador', 'scale') ON DUPLICATE KEY UPDATE plan = 'scale'");
    $stmtProf->execute([$userId]);

    $pdo->commit();
    response(['success' => true, 'message' => "Usuário $email criado/atualizado com sucesso. Plano: Scale."]);
}
catch (Exception $e) {
    if ($pdo->inTransaction())
        $pdo->rollBack();
    response(['error' => $e->getMessage()], 500);
}
?>
