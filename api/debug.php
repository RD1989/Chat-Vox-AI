<?php
require_once __DIR__ . '/config.php';

// Script de Diagnóstico Chat Vox v1.0
echo "<h1>Diagnóstico de Migração Chat Vox</h1>";

// 1. Verificar PHP
echo "<li>PHP Versão: " . phpversion() . "</li>";

// 2. Verificar PDO e Conexão
try {
    $stmt = $pdo->query("SELECT 1");
    echo "<li style='color:green'>Conexão com Banco de Dados: OK</li>";
}
catch (Exception $e) {
    echo "<li style='color:red'>Erro de Conexão: " . $e->getMessage() . "</li>";
    exit();
}

// 3. Verificar Tabelas
$requiredTables = ['users', 'profiles', 'vox_agents', 'vox_leads', 'plans'];
echo "<h3>Verificando Tabelas:</h3><ul>";
foreach ($requiredTables as $table) {
    try {
        $pdo->query("SELECT 1 FROM `$table` LIMIT 1");
        echo "<li style='color:green'>Tabela `$table`: Presente</li>";
    }
    catch (Exception $e) {
        echo "<li style='color:red'>Tabela `$table`: NÃO ENCONTRADA</li>";
    }
}
echo "</ul>";

// 4. Verificar .htaccess
$url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
$apiTest = str_replace('debug.php', 'auth/login', $url);

echo "<h3>Teste de Roteamento:</h3>";
echo "<li>URL de Teste: <a href='$apiTest' target='_blank'>$apiTest</a></li>";
echo "<p>Se o link acima retornar um erro JSON 401 ou 405 (em vez de um erro 404 do servidor), o seu .htaccess está configurado corretamente.</p>";

echo "<hr><p><b>Antigravity Migration System</b></p>";
?>
