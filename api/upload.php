<?php
/**
 * ChatVox API - File Upload
 * Gerencia o upload de anexos do chat.
 */

require_once __DIR__ . '/config.php';

// Criar pasta de uploads se não existir
$uploadDir = __DIR__ . '/../public/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['file'])) {
        sendResponse(["error" => "Nenhum arquivo enviado"], 400);
    }

    $file = $_FILES['file'];
    $userId = $_POST['user_id'] ?? 'public';

    // Validar extensão
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp3', 'wav', 'ogg'];

    if (!in_array($ext, $allowed)) {
        sendResponse(["error" => "Extensão não permitida"], 400);
    }

    // Gerar nome único
    $filename = $userId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Retornar a URL pública (ajustar conforme o domínio)
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $url = $protocol . "://" . $host . "/uploads/" . $filename;

        sendResponse(["publicUrl" => $url], 201);
    }
    else {
        sendResponse(["error" => "Falha ao mover arquivo"], 500);
    }
}
