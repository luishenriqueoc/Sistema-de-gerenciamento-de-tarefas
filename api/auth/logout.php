<?php
/**
 * API de logout.
 * Destrói a sessão do usuário.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Limpa os dados da sessão
$_SESSION = array();

// Remove o cookie de sessão do navegador
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

session_destroy();
echo json_encode(array('success' => true, 'message' => 'Logout realizado'));
exit;
