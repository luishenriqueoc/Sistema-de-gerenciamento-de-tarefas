<?php
/**
 * API de uma tarefa: buscar, atualizar ou excluir.
 * O id da tarefa vem na URL: task.php?id=1
 * Só altera tarefas do usuário logado.
 */
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
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

$idTarefa = isset($_GET['id']) ? (int) $_GET['id'] : 0;
if ($idTarefa <= 0) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'ID inválido'));
    exit;
}

require_once __DIR__ . '/../config/database.php';
$idUsuario = (int) $_SESSION['user_id'];

/**
 * Busca uma tarefa pelo id, desde que pertença ao usuário.
 * @return array|null A tarefa ou null se não existir.
 */
function buscarTarefa($pdo, $idTarefa, $idUsuario) {
    $stmt = $pdo->prepare('SELECT id, title, description, completed, created_at, updated_at FROM tasks WHERE id = ? AND user_id = ?');
    $stmt->execute(array($idTarefa, $idUsuario));
    $tarefa = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$tarefa) {
        return null;
    }
    $tarefa['id'] = (int) $tarefa['id'];
    $tarefa['completed'] = (bool) (int) $tarefa['completed'];
    return $tarefa;
}

try {
    $pdo = getConnection();

    /* ---------- GET: buscar uma tarefa ---------- */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $tarefa = buscarTarefa($pdo, $idTarefa, $idUsuario);
        if (!$tarefa) {
            http_response_code(404);
            echo json_encode(array('success' => false, 'message' => 'Tarefa não encontrada'));
            exit;
        }
        echo json_encode(array('success' => true, 'task' => $tarefa));
        exit;
    }

    /* ---------- PUT: atualizar tarefa (título, descrição ou concluída) ---------- */
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $tarefa = buscarTarefa($pdo, $idTarefa, $idUsuario);
        if (!$tarefa) {
            http_response_code(404);
            echo json_encode(array('success' => false, 'message' => 'Tarefa não encontrada'));
            exit;
        }

        $entrada = json_decode(file_get_contents('php://input'), true);
        if ($entrada === null) {
            $entrada = array();
        }

        $titulo = isset($entrada['title']) ? trim($entrada['title']) : $tarefa['title'];
        $descricao = array_key_exists('description', $entrada) ? trim($entrada['description']) : $tarefa['description'];
        $concluida = array_key_exists('completed', $entrada) ? (int) (bool) $entrada['completed'] : (int) $tarefa['completed'];

        if (empty($titulo)) {
            http_response_code(400);
            echo json_encode(array('success' => false, 'message' => 'Título é obrigatório'));
            exit;
        }

        $stmt = $pdo->prepare('UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?');
        $stmt->execute(array($titulo, $descricao ? $descricao : null, $concluida, $idTarefa, $idUsuario));
        $tarefaAtualizada = buscarTarefa($pdo, $idTarefa, $idUsuario);
        echo json_encode(array('success' => true, 'task' => $tarefaAtualizada));
        exit;
    }

    /* ---------- DELETE: excluir tarefa ---------- */
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?');
        $stmt->execute(array($idTarefa, $idUsuario));
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(array('success' => false, 'message' => 'Tarefa não encontrada'));
            exit;
        }
        echo json_encode(array('success' => true, 'message' => 'Tarefa excluída'));
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array('success' => false, 'message' => 'Erro no servidor'));
    exit;
}

http_response_code(405);
echo json_encode(array('success' => false, 'message' => 'Método não permitido'));
