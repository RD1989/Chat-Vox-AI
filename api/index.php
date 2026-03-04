<?php
/**
 * ChatVox API - Main Router
 * Gerencia as chamadas de API do sistema.
 */

require_once __DIR__ . '/config.php';

// Pegar o caminho da requisição
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api'; // Ajustar se a API estiver em outra subpasta

// Limpar a URI para pegar apenas a rota
$route = str_replace($basePath, '', $requestUri);
$route = explode('?', $route)[0]; // Remover query params do roteamento
$route = trim($route, '/');

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Roteamento Simples
    switch ($route) {
        case 'health':
            sendResponse(["status" => "online", "time" => date('Y-m-d H:i:s')]);
            break;

        case 'signup':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                if (!isset($input['email']) || !isset($input['password']))
                    sendResponse(["error" => "Email e senha obrigatórios"], 400);

                $id = generateUuid();
                $hash = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("INSERT INTO vox_users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)");
                try {
                    $stmt->execute([$id, $input['email'], $hash, $input['full_name'] ?? '']);
                    sendResponse(["id" => $id, "message" => "Usuário criado"], 201);
                }
                catch (PDOException $e) {
                    if ($e->getCode() == 23000)
                        sendResponse(["error" => "Email já cadastrado"], 409);
                    throw $e;
                }
            }
            break;

        case 'login':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("SELECT * FROM vox_users WHERE email = ?");
                $stmt->execute([$input['email']]);
                $user = $stmt->fetch();

                if ($user && password_verify($input['password'], $user['password_hash'])) {
                    sendResponse([
                        "user" => [
                            "id" => $user['id'],
                            "email" => $user['email'],
                            "full_name" => $user['full_name']
                        ],
                        "session" => ["access_token" => $user['id']]
                    ]);
                }
                else {
                    sendResponse(["error" => "Credenciais inválidas"], 401);
                }
            }
            break;

        case 'me':
            if ($method === 'GET') {
                $token = $_GET['token'] ?? null;
                if (!$token)
                    sendResponse(["error" => "Não autorizado"], 401);
                $stmt = $pdo->prepare("SELECT id, email, full_name FROM vox_users WHERE id = ?");
                $stmt->execute([$token]);
                $user = $stmt->fetch();
                if ($user)
                    sendResponse($user);
                else
                    sendResponse(["error" => "Sessão expirada"], 401);
            }
            break;

        case 'agents':
            if ($method === 'GET') {
                if (isset($_GET['id'])) {
                    $stmt = $pdo->prepare("SELECT * FROM vox_agents WHERE id = ?");
                    $stmt->execute([$_GET['id']]);
                    $agent = $stmt->fetch();
                    sendResponse($agent ?: ["error" => "Agente não encontrado"], $agent ? 200 : 404);
                }
                else {
                    $stmt = $pdo->query("SELECT * FROM vox_agents ORDER BY created_at");
                    sendResponse($stmt->fetchAll());
                }
            }
            elseif ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $sql = "INSERT INTO vox_agents (id, user_id, name, system_prompt, welcome_message, ai_avatar_url, primary_color) VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id,
                    $input['user_id'] ?? null,
                    $input['name'] ?? 'Novo Agente',
                    $input['system_prompt'] ?? '',
                    $input['welcome_message'] ?? 'Olá!',
                    $input['ai_avatar_url'] ?? null,
                    $input['primary_color'] ?? '#6366f1'
                ]);
                sendResponse(["id" => $id, "message" => "Agente criado"], 201);
            }
            elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = $input['id'] ?? $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);

                $allowedFields = ['name', 'system_prompt', 'welcome_message', 'ai_avatar_url', 'primary_color', 'is_active', 'ai_persona', 'ai_tone', 'ai_objective', 'ai_restrictions', 'ai_cta', 'ai_qualification_question'];
                $updates = [];
                $values = [];
                foreach ($input as $key => $val) {
                    if (in_array($key, $allowedFields)) {
                        $updates[] = "$key = ?";
                        $values[] = $val;
                    }
                }
                if (empty($updates))
                    sendResponse(["error" => "Nada para atualizar"], 400);

                $values[] = $id;
                $stmt = $pdo->prepare("UPDATE vox_agents SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($values);
                sendResponse(["message" => "Agente atualizado"]);
            }
            elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);
                $stmt = $pdo->prepare("DELETE FROM vox_agents WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(["message" => "Agente removido"]);
            }
            break;

        case 'settings':
            if ($method === 'GET' && isset($_GET['user_id'])) {
                $fields = $_GET['fields'] ?? '*';
                if ($fields !== '*') {
                    $allowed = ['system_prompt', 'ai_persona', 'ai_tone', 'ai_objective', 'ai_restrictions', 'ai_cta', 'ai_qualification_question', 'ai_name', 'ai_avatar_url', 'chat_theme_config', 'voice_enabled', 'voice_response_pct', 'voice_name', 'voice_speed', 'voice_show_text', 'voice_accent'];
                    $requested = explode(',', str_replace(' ', '', $fields));
                    $safe = array_intersect($requested, $allowed);
                    $fields = $safe ? implode(',', $safe) : '*';
                }
                $stmt = $pdo->prepare("SELECT $fields FROM vox_settings WHERE user_id = ?");
                $stmt->execute([$_GET['user_id']]);
                $settings = $stmt->fetch();
                sendResponse($settings ?: []);
            }
            elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = json_decode(file_get_contents('php://input'), true);
                $userId = $input['user_id'] ?? $_GET['user_id'] ?? null;
                if (!$userId)
                    sendResponse(["error" => "User ID não fornecido"], 400);

                $check = $pdo->prepare("SELECT id FROM vox_settings WHERE user_id = ?");
                $check->execute([$userId]);
                $exists = $check->fetch();

                $allowedFields = [
                    'ai_name', 'ai_avatar_url', 'primary_color', 'welcome_message', 'system_prompt',
                    'ai_persona', 'ai_tone', 'ai_objective', 'ai_restrictions', 'ai_cta',
                    'ai_qualification_question', 'webhook_url', 'custom_css',
                    'widget_trigger_seconds', 'widget_trigger_scroll', 'widget_position',
                    'voice_enabled', 'voice_response_pct', 'voice_name', 'voice_speed',
                    'voice_show_text', 'voice_accent', 'chat_theme', 'chat_theme_config'
                ];

                $updates = [];
                $values = [];
                foreach ($input as $key => $val) {
                    if (in_array($key, $allowedFields)) {
                        $updates[] = "$key = ?";
                        $values[] = (is_array($val) || is_object($val)) ? json_encode($val) : $val;
                    }
                }

                if (empty($updates))
                    sendResponse(["error" => "Nada para atualizar"], 400);

                if ($exists) {
                    $values[] = $userId;
                    $stmt = $pdo->prepare("UPDATE vox_settings SET " . implode(', ', $updates) . " WHERE user_id = ?");
                    $stmt->execute($values);
                }
                else {
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO vox_settings (id, user_id) VALUES (?, ?)");
                    $stmt->execute([$id, $userId]);
                    $values[] = $userId;
                    $stmt = $pdo->prepare("UPDATE vox_settings SET " . implode(', ', $updates) . " WHERE user_id = ?");
                    $stmt->execute($values);
                }
                sendResponse(["message" => "Configurações salvas"]);
            }
            break;

        case 'knowledge':
            if ($method === 'GET' && isset($_GET['user_id'])) {
                $userId = $_GET['user_id'];
                $agentId = $_GET['agent_id'] ?? null;
                $sql = "SELECT * FROM vox_knowledge WHERE user_id = ? AND is_active = 1";
                $params = [$userId];
                if ($agentId) {
                    $sql .= " AND (agent_id = ? OR agent_id IS NULL)";
                    $params[] = $agentId;
                }
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                sendResponse($stmt->fetchAll());
            }
            elseif ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $sql = "INSERT INTO vox_knowledge (id, user_id, agent_id, title, content, category) VALUES (?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id,
                    $input['user_id'] ?? null,
                    $input['agent_id'] ?? null,
                    $input['title'] ?? '',
                    $input['content'] ?? '',
                    $input['category'] ?? 'geral'
                ]);
                sendResponse(["id" => $id, "message" => "Conhecimento adicionado"], 201);
            }
            elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = $input['id'] ?? $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);

                $allowedFields = ['title', 'content', 'category', 'is_active'];
                $updates = [];
                $values = [];
                foreach ($input as $key => $val) {
                    if (in_array($key, $allowedFields)) {
                        $updates[] = "$key = ?";
                        $values[] = $val;
                    }
                }
                if (empty($updates))
                    sendResponse(["error" => "Nada para atualizar"], 400);

                $values[] = $id;
                $stmt = $pdo->prepare("UPDATE vox_knowledge SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($values);
                sendResponse(["message" => "Conhecimento atualizado"]);
            }
            elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);
                $stmt = $pdo->prepare("DELETE FROM vox_knowledge WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(["message" => "Conhecimento removido"]);
            }
            break;

        case 'messages':
            if ($method === 'GET') {
                if (isset($_GET['lead_id'])) {
                    $stmt = $pdo->prepare("SELECT * FROM vox_messages WHERE lead_id = ? ORDER BY created_at ASC");
                    $stmt->execute([$_GET['lead_id']]);
                    sendResponse($stmt->fetchAll());
                }
                elseif (isset($_GET['user_id'])) {
                    $stmt = $pdo->prepare("SELECT * FROM vox_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 100");
                    $stmt->execute([$_GET['user_id']]);
                    sendResponse($stmt->fetchAll());
                }
            }
            elseif ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                if (!$input)
                    sendResponse(["error" => "Dados inválidos"], 400);

                $id = generateUuid();
                $sql = "INSERT INTO vox_messages (id, user_id, lead_id, agent_id, role, content, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id,
                    $input['user_id'] ?? null,
                    $input['lead_id'] ?? null,
                    $input['agent_id'] ?? null,
                    $input['role'] ?? 'user',
                    $input['content'] ?? '',
                    $input['message_type'] ?? 'text'
                ]);
                sendResponse(["id" => $id, "message" => "Mensagem salva"], 201);
            }
            break;

        case 'leads':
            if ($method === 'GET') {
                if (isset($_GET['user_id'])) {
                    $stmt = $pdo->prepare("SELECT * FROM vox_leads WHERE user_id = ? ORDER BY created_at DESC");
                    $stmt->execute([$_GET['user_id']]);
                    $leads = $stmt->fetchAll();
                    sendResponse($leads);
                }
            }
            elseif ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                if (!$input)
                    sendResponse(["error" => "Dados inválidos"], 400);

                $id = generateUuid();
                $sql = "INSERT INTO vox_leads (id, user_id, agent_id, name, phone, email, source, status, city, region, ip_address, utm_source, utm_medium, utm_campaign) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id,
                    $input['user_id'] ?? null,
                    $input['agent_id'] ?? null,
                    $input['name'] ?? 'Visitante',
                    $input['phone'] ?? null,
                    $input['email'] ?? null,
                    $input['source'] ?? 'chat',
                    $input['status'] ?? 'novo',
                    $input['city'] ?? null,
                    $input['region'] ?? null,
                    $input['ip_address'] ?? null,
                    $input['utm_source'] ?? null,
                    $input['utm_medium'] ?? null,
                    $input['utm_campaign'] ?? null
                ]);
                sendResponse(["id" => $id, "message" => "Lead criado"], 201);
            }
            elseif ($method === 'PUT' || $method === 'PATCH') {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = $input['id'] ?? $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);

                $allowedFields = ['status', 'tags', 'qualified', 'qualification_score', 'notes', 'handoff_requested'];
                $updates = [];
                $values = [];
                foreach ($input as $key => $val) {
                    if (in_array($key, $allowedFields)) {
                        $updates[] = "$key = ?";
                        $values[] = is_array($val) ? json_encode($val) : $val;
                    }
                }
                if (empty($updates))
                    sendResponse(["error" => "Nada para atualizar"], 400);

                $values[] = $id;
                $stmt = $pdo->prepare("UPDATE vox_leads SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($values);
                sendResponse(["message" => "Lead atualizado"]);
            }
            elseif ($method === 'DELETE') {
                $id = $_GET['id'] ?? null;
                if (!$id)
                    sendResponse(["error" => "ID não fornecido"], 400);
                $stmt = $pdo->prepare("DELETE FROM vox_leads WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(["message" => "Lead removido"]);
            }
            break;

        case 'stats':
            if ($method === 'GET' && isset($_GET['user_id'])) {
                $userId = $_GET['user_id'];
                $leadsStmt = $pdo->prepare("SELECT * FROM vox_leads WHERE user_id = ?");
                $leadsStmt->execute([$userId]);
                $leads = $leadsStmt->fetchAll();
                $msgStmt = $pdo->prepare("SELECT count(*) as total FROM vox_messages WHERE user_id = ?");
                $msgStmt->execute([$userId]);
                $totalMessages = $msgStmt->fetch()['total'];
                $intMsgStmt = $pdo->prepare("SELECT count(*) as total FROM vox_messages WHERE user_id = ? AND message_type = 'interactive'");
                $intMsgStmt->execute([$userId]);
                $interactiveMessages = $intMsgStmt->fetch()['total'];
                sendResponse([
                    "leads" => $leads,
                    "totalMessages" => (int)$totalMessages,
                    "interactiveMessages" => (int)$interactiveMessages,
                ]);
            }
            break;

        default:
            sendResponse(["error" => "Rota não encontrada: " . $route], 404);
            break;
    }
}
catch (Exception $e) {
    sendResponse(["error" => "Erro interno do servidor", "details" => $e->getMessage()], 500);
}
catch (Error $e) {
    sendResponse(["error" => "Erro fatal no PHP", "details" => $e->getMessage()], 500);
}
