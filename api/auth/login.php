<?php
/**
 * API de login.
 * Recebe e-mail e senha, valida e cria a sessão do usuário.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'message' => 'Método não permitido'));
    exit;
}

require_once __DIR__ . '/../../config/database.php';

// Lê os dados enviados pelo front (JSON)
$entrada = json_decode(file_get_contents('php://input'), true);
if ($entrada === null) {
    $entrada = array();
}
$email = isset($entrada['email']) ? trim($entrada['email']) : '';
$senha = isset($entrada['password']) ? $entrada['password'] : '';

if (empty($email) || empty($senha)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'E-mail e senha são obrigatórios'));
    exit;
}

try {
    $pdo = getConnection();
    $stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
    $stmt->execute(array($email));
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario || !password_verify($senha, $usuario['password_hash'])) {
        http_response_code(401);
        echo json_encode(array('success' => false, 'message' => 'E-mail ou senha incorretos'));
        exit;
    }

    // Login ok: grava dados na sessão
    $_SESSION['user_id'] = (int) $usuario['id'];
    $_SESSION['user_name'] = $usuario['name'];
    $_SESSION['user_email'] = $usuario['email'];

    echo json_encode(array(
        'success' => true,
        'message' => 'Login realizado com sucesso',
        'user' => array(
            'id' => (int) $usuario['id'],
            'name' => $usuario['name'],
            'email' => $usuario['email']
        )
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Erro ao fazer login'));
}
