<?php
/**
 * API de tarefas: listar (com filtro) e criar.
 * Só funciona se o usuário estiver logado (sessão).
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(array('success' => false, 'message' => 'Não autorizado'));
    exit;
}

require_once __DIR__ . '/../config/database.php';
$idUsuario = (int) $_SESSION['user_id'];


/* ---------- GET: listar tarefas (com filtro opcional) ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filtro = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    $filtrosValidos = array('all', 'pending', 'completed');
    if (!in_array($filtro, $filtrosValidos)) {
        $filtro = 'all';
    }

    try {
        $pdo = getConnection();
        $sql = 'SELECT id, title, description, completed, created_at, updated_at FROM tasks WHERE user_id = ?';
        $params = array($idUsuario);

        if ($filtro === 'pending') {
            $sql .= ' AND completed = 0';
        } elseif ($filtro === 'completed') {
            $sql .= ' AND completed = 1';
        }
        $sql .= ' ORDER BY completed ASC, updated_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $listaTarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Garante que id é número e completed é booleano no JSON
        foreach ($listaTarefas as &$tarefa) {
            $tarefa['id'] = (int) $tarefa['id'];
            $tarefa['completed'] = (bool) (int) $tarefa['completed'];
        }

        echo json_encode(array('success' => true, 'tasks' => $listaTarefas));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array('success' => false, 'message' => 'Erro ao listar tarefas'));
    }
    exit;
}


/* ---------- POST: criar nova tarefa ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entrada = json_decode(file_get_contents('php://input'), true);
    if ($entrada === null) {
        $entrada = array();
    }
    $titulo = isset($entrada['title']) ? trim($entrada['title']) : '';
    $descricao = isset($entrada['description']) ? trim($entrada['description']) : '';

    if (empty($titulo)) {
        http_response_code(400);
        echo json_encode(array('success' => false, 'message' => 'Título é obrigatório'));
        exit;
    }

    try {
        $pdo = getConnection();
        $stmt = $pdo->prepare('INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)');
        $stmt->execute(array($idUsuario, $titulo, $descricao ? $descricao : null));
        $novoId = (int) $pdo->lastInsertId();

        // Busca a tarefa criada para devolver com todos os campos
        $stmt = $pdo->prepare('SELECT id, title, description, completed, created_at, updated_at FROM tasks WHERE id = ?');
        $stmt->execute(array($novoId));
        $tarefa = $stmt->fetch(PDO::FETCH_ASSOC);
        $tarefa['id'] = (int) $tarefa['id'];
        $tarefa['completed'] = (bool) (int) $tarefa['completed'];

        echo json_encode(array('success' => true, 'task' => $tarefa));
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array('success' => false, 'message' => 'Erro ao criar tarefa'));
    }
    exit;
}

http_response_code(405);
echo json_encode(array('success' => false, 'message' => 'Método não permitido'));
