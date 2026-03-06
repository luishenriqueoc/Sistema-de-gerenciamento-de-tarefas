To-Do Avançado

Um sistema simples de gerenciamento de tarefas com login de usuário.
Cada pessoa pode criar, editar, concluir e excluir suas próprias tarefas.

O sistema também possui filtros de tarefas, barra de progresso e opção de tema escuro.

Tecnologias utilizadas:
HTML
CSS
JavaScript
PHP
MySQL

Como rodar o projeto
1. Criar o banco de dados
Execute o script SQL que está na pasta database:
mysql -u root -p < database/schema.sql
Isso criará o banco de dados e as tabelas necessárias.

2. Configurar a conexão com o banco
Abra o arquivo:
config/database.php
E ajuste os dados de conexão caso seja necessário (host, usuário e senha do MySQL).

3. Rodar o servidor
Na pasta do projeto execute:
php -S localhost:8000
Depois acesse no navegador:
http://localhost:8000

Pronto.
Agora você já pode criar uma conta e começar a usar o sistema de tarefas :)
