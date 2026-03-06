<?php
/**
 * API que verifica se o usuário está logado.
 * Usada ao carregar a página para decidir se mostra a tela de login ou o app.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array('authenticated' => false));
    exit;
}

echo json_encode(array(
    'authenticated' => true,
    'user' => array(
        'id' => (int) $_SESSION['user_id'],
        'name' => isset($_SESSION['user_name']) ? $_SESSION['user_name'] : '',
        'email' => isset($_SESSION['user_email']) ? $_SESSION['user_email'] : ''
    )
));
