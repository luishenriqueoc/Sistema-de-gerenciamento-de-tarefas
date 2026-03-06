<?php
/**
 * Configuração da conexão com o banco MySQL.
 * Altere os valores abaixo conforme seu ambiente (XAMPP, WAMP, etc).
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'todo_sistema');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Retorna a conexão PDO com o banco.
 * Usa uma única conexão por requisição (não abre várias ao mesmo tempo).
 */
function getConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $opcoes = array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $opcoes);
    }

    return $pdo;
}
