<?php
/**
 * API de cadastro de usuário.
 * Recebe nome, e-mail e senha, valida e cria o usuário no banco e na sessão.
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

$entrada = json_decode(file_get_contents('php://input'), true);
if ($entrada === null) {
    $entrada = array();
}
$nome = isset($entrada['name']) ? trim($entrada['name']) : '';
$email = isset($entrada['email']) ? trim($entrada['email']) : '';
$senha = isset($entrada['password']) ? $entrada['password'] : '';

if (empty($nome) || empty($email) || empty($senha)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Nome, e-mail e senha são obrigatórios'));
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Senha deve ter no mínimo 6 caracteres'));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'E-mail inválido'));
    exit;
}

try {
    $pdo = getConnection();

    // Verifica se o e-mail já existe
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(array($email));
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(array('success' => false, 'message' => 'E-mail já cadastrado'));
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute(array($nome, $email, $senhaHash));
    $novoId = (int) $pdo->lastInsertId();

    // Já deixa o usuário logado
    $_SESSION['user_id'] = $novoId;
    $_SESSION['user_name'] = $nome;
    $_SESSION['user_email'] = $email;

    echo json_encode(array(
        'success' => true,
        'message' => 'Cadastro realizado com sucesso',
        'user' => array('id' => $novoId, 'name' => $nome, 'email' => $email)
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Erro ao cadastrar'));
}
