-- ============================================
-- To-Do Avançado - Estrutura do banco de dados
-- Execute este arquivo no MySQL para criar o banco e as tabelas.
-- Exemplo: mysql -u root -p < database/schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS todo_sistema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_sistema;

-- Tabela de usuários (login e cadastro)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de tarefas (cada tarefa pertence a um usuário)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_completed (user_id, completed)
);
