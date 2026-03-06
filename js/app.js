/**
 * To-Do Avançado - JavaScript
 * Controla login, lista de tarefas, filtros, tema e chamadas à API.
 */

// Caminho base da API (altere se o projeto estiver em uma subpasta)
var API_BASE = 'api';

// Filtro atual da lista: 'all', 'pending' ou 'completed'
var filtroAtual = 'all';

// Lista de todas as tarefas (usada para calcular o progresso)
var listaTarefasCompleta = [];


/* ============================================
   TEMA CLARO / ESCURO
   ============================================ */

/**
 * Aplica o tema salvo no navegador ou usa a preferência do sistema.
 */
function iniciarTema() {
    var temaSalvo = localStorage.getItem('theme');
    var prefereEscuro = window.matchMedia('(prefers-dark-mode: true)').matches;
    var tema = temaSalvo || (prefereEscuro ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', tema === 'dark' ? 'dark' : 'light');
}

/**
 * Alterna entre tema claro e escuro e salva a escolha.
 */
function alternarTema() {
    var estaEscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    var proximoTema = estaEscuro ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', proximoTema);
    localStorage.setItem('theme', proximoTema);
}

// Botão de tema: ao clicar, alterna e salva
document.getElementById('theme-toggle').addEventListener('click', alternarTema);
iniciarTema();


/* ============================================
   AUTENTICAÇÃO (LOGIN / CADASTRO / SAIR)
   ============================================ */

/**
 * Verifica se o usuário está logado. Se sim, mostra a tela do app; se não, mostra login.
 */
function verificarSeEstaLogado() {
    fetch(API_BASE + '/auth/check.php')
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            if (dados.authenticated) {
                document.getElementById('user-name').textContent = dados.user.name;
                document.getElementById('auth-screen').classList.add('hidden');
                document.getElementById('app-screen').classList.remove('hidden');
                carregarTarefas();
            } else {
                document.getElementById('auth-screen').classList.remove('hidden');
                document.getElementById('app-screen').classList.add('hidden');
            }
        })
        .catch(function() {
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('app-screen').classList.add('hidden');
        });
}

/**
 * Alterna entre as abas "Entrar" e "Cadastrar" na tela de login.
 */
function configurarAbasLogin() {
    var botoesAbas = document.querySelectorAll('.auth-tab');
    var formularioLogin = document.getElementById('login-form');
    var formularioCadastro = document.getElementById('register-form');
    var mensagemErroLogin = document.getElementById('login-error');
    var mensagemErroCadastro = document.getElementById('register-error');

    for (var i = 0; i < botoesAbas.length; i++) {
        botoesAbas[i].addEventListener('click', function() {
            var qualAba = this.getAttribute('data-tab');

            // Marca a aba clicada como ativa
            for (var j = 0; j < botoesAbas.length; j++) {
                botoesAbas[j].classList.remove('active');
            }
            this.classList.add('active');

            // Mostra o formulário correto
            if (qualAba === 'login') {
                formularioLogin.classList.remove('hidden');
                formularioCadastro.classList.add('hidden');
            } else {
                formularioLogin.classList.add('hidden');
                formularioCadastro.classList.remove('hidden');
            }

            // Limpa mensagens de erro
            mensagemErroLogin.textContent = '';
            mensagemErroCadastro.textContent = '';
        });
    }
}
configurarAbasLogin();

/**
 * Envia os dados de login para a API e, se der certo, mostra o app.
 */
function enviarLogin(evento) {
    evento.preventDefault();

    var email = document.getElementById('login-email').value.trim();
    var senha = document.getElementById('login-password').value;
    var elementoErro = document.getElementById('login-error');
    elementoErro.textContent = '';

    fetch(API_BASE + '/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: senha })
    })
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(dados) {
        if (dados.success) {
            document.getElementById('user-name').textContent = dados.user.name;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            carregarTarefas();
        } else {
            elementoErro.textContent = dados.message || 'Erro ao entrar';
        }
    })
    .catch(function() {
        elementoErro.textContent = 'Erro de conexão';
    });
}
document.getElementById('login-form').addEventListener('submit', enviarLogin);

/**
 * Envia os dados de cadastro para a API e, se der certo, mostra o app.
 */
function enviarCadastro(evento) {
    evento.preventDefault();

    var nome = document.getElementById('register-name').value.trim();
    var email = document.getElementById('register-email').value.trim();
    var senha = document.getElementById('register-password').value;
    var elementoErro = document.getElementById('register-error');
    elementoErro.textContent = '';

    fetch(API_BASE + '/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, email: email, password: senha })
    })
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(dados) {
        if (dados.success) {
            document.getElementById('user-name').textContent = dados.user.name;
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            carregarTarefas();
        } else {
            elementoErro.textContent = dados.message || 'Erro ao cadastrar';
        }
    })
    .catch(function() {
        elementoErro.textContent = 'Erro de conexão';
    });
}
document.getElementById('register-form').addEventListener('submit', enviarCadastro);

/**
 * Faz logout (chama a API) e volta para a tela de login.
 */
function fazerLogout() {
    fetch(API_BASE + '/auth/logout.php')
        .then(function() {
            document.getElementById('auth-screen').classList.remove('hidden');
            document.getElementById('app-screen').classList.add('hidden');
        });
}
document.getElementById('logout-btn').addEventListener('click', fazerLogout);


/* ============================================
   LISTA DE TAREFAS (CRUD)
   ============================================ */

/**
 * Busca as tarefas na API conforme o filtro atual e exibe na tela.
 */
function carregarTarefas() {
    fetch(API_BASE + '/tasks.php?filter=' + filtroAtual)
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            if (dados.success) {
                exibirTarefas(dados.tasks);
                atualizarListaParaProgresso();
            }
        })
        .catch(function() {
            document.getElementById('task-list').innerHTML = '<li class="empty-state">Erro ao carregar tarefas.</li>';
        });
}

/**
 * Busca todas as tarefas (sem filtro) para calcular a porcentagem de progresso.
 */
function atualizarListaParaProgresso() {
    fetch(API_BASE + '/tasks.php?filter=all')
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            if (dados.success) {
                listaTarefasCompleta = dados.tasks;
                atualizarBarraProgresso();
            }
        })
        .catch(function() {});
}

/**
 * Calcula quantas tarefas foram concluídas e atualiza a barra e o texto de progresso.
 */
function atualizarBarraProgresso() {
    var total = listaTarefasCompleta.length;
    var concluidas = 0;
    for (var i = 0; i < total; i++) {
        if (listaTarefasCompleta[i].completed) {
            concluidas++;
        }
    }
    var porcentagem = total === 0 ? 0 : Math.round((concluidas / total) * 100);

    document.getElementById('progress-fill').style.width = porcentagem + '%';
    document.getElementById('progress-text').textContent = porcentagem + '%';
}

/**
 * Monta o HTML da lista de tarefas e exibe na tela. Também liga os eventos (checkbox, editar, excluir).
 */
function exibirTarefas(tarefas) {
    var lista = document.getElementById('task-list');
    var mensagemVazio = document.getElementById('empty-state');

    if (tarefas.length === 0) {
        lista.innerHTML = '';
        mensagemVazio.classList.remove('hidden');
        return;
    }

    mensagemVazio.classList.add('hidden');
    var html = '';

    for (var i = 0; i < tarefas.length; i++) {
        var tarefa = tarefas[i];
        var classeConcluida = tarefa.completed ? 'completed' : '';
        var checked = tarefa.completed ? ' checked' : '';
        var descricaoHtml = tarefa.description ? '<div class="task-description">' + escaparHtml(tarefa.description) + '</div>' : '';

        html += '<li class="task-item ' + classeConcluida + '" data-id="' + tarefa.id + '">';
        html += '<input type="checkbox" class="task-checkbox"' + checked + ' aria-label="Marcar como concluída">';
        html += '<div class="task-content">';
        html += '<div class="task-title">' + escaparHtml(tarefa.title) + '</div>';
        html += descricaoHtml;
        html += '</div>';
        html += '<div class="task-actions">';
        html += '<button type="button" class="btn btn-edit" data-edit="' + tarefa.id + '">Editar</button>';
        html += '<button type="button" class="btn btn-delete" data-delete="' + tarefa.id + '">Excluir</button>';
        html += '</div></li>';
    }

    lista.innerHTML = html;

    // Ligar evento de marcar como concluída em cada checkbox
    var checkboxes = lista.querySelectorAll('.task-checkbox');
    for (var c = 0; c < checkboxes.length; c++) {
        var itemTarefa = checkboxes[c].closest('.task-item');
        var idTarefa = parseInt(itemTarefa.getAttribute('data-id'), 10);
        checkboxes[c].addEventListener('change', function(id) {
            return function() {
                marcarComoConcluida(id);
            };
        }(idTarefa));
    }

    // Ligar botões Editar
    var botoesEditar = lista.querySelectorAll('[data-edit]');
    for (var e = 0; e < botoesEditar.length; e++) {
        botoesEditar[e].addEventListener('click', function() {
            var id = parseInt(this.getAttribute('data-edit'), 10);
            abrirModalEdicao(id);
        });
    }

    // Ligar botões Excluir
    var botoesExcluir = lista.querySelectorAll('[data-delete]');
    for (var x = 0; x < botoesExcluir.length; x++) {
        botoesExcluir[x].addEventListener('click', function() {
            var id = parseInt(this.getAttribute('data-delete'), 10);
            excluirTarefa(id);
        });
    }
}

/**
 * Evita que texto do usuário seja interpretado como HTML (segurança).
 */
function escaparHtml(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

/**
 * Marca ou desmarca a tarefa como concluída (chama a API e atualiza a tela).
 */
function marcarComoConcluida(idTarefa) {
    var item = document.querySelector('.task-item[data-id="' + idTarefa + '"]');
    var checkbox = item.querySelector('.task-checkbox');
    var concluida = checkbox.checked;

    fetch(API_BASE + '/task.php?id=' + idTarefa, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: concluida })
    })
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(dados) {
        if (dados.success) {
            if (filtroAtual === 'all') {
                item.classList.toggle('completed', concluida);
                checkbox.checked = concluida;
            } else {
                carregarTarefas();
            }
            atualizarListaParaProgresso();
        }
    })
    .catch(function() {});
}

/**
 * Abre o modal de edição e preenche com os dados da tarefa.
 * Busca os dados na lista em memória ou no próprio texto exibido na tela.
 */
function abrirModalEdicao(idTarefa) {
    var titulo = '';
    var descricao = '';

    var itemNaTela = document.querySelector('.task-item[data-id="' + idTarefa + '"]');
    if (itemNaTela) {
        var elTitulo = itemNaTela.querySelector('.task-title');
        var elDescricao = itemNaTela.querySelector('.task-description');
        titulo = elTitulo ? elTitulo.textContent : '';
        descricao = elDescricao ? elDescricao.textContent : '';
    } else {
        for (var i = 0; i < listaTarefasCompleta.length; i++) {
            if (listaTarefasCompleta[i].id === idTarefa) {
                titulo = listaTarefasCompleta[i].title || '';
                descricao = listaTarefasCompleta[i].description || '';
                break;
            }
        }
    }

    document.getElementById('edit-id').value = idTarefa;
    document.getElementById('edit-title').value = titulo;
    document.getElementById('edit-description').value = descricao;
    document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Fecha o modal de edição.
 */
function fecharModalEdicao() {
    document.getElementById('edit-modal').classList.add('hidden');
}

document.getElementById('edit-cancel').addEventListener('click', fecharModalEdicao);
document.querySelector('.modal-backdrop').addEventListener('click', fecharModalEdicao);

/**
 * Salva as alterações da tarefa editada (chama a API).
 */
function salvarEdicao(evento) {
    evento.preventDefault();

    var idTarefa = parseInt(document.getElementById('edit-id').value, 10);
    var titulo = document.getElementById('edit-title').value.trim();
    var descricao = document.getElementById('edit-description').value.trim();

    fetch(API_BASE + '/task.php?id=' + idTarefa, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo, description: descricao })
    })
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(dados) {
        if (dados.success) {
            fecharModalEdicao();
            carregarTarefas();
            atualizarListaParaProgresso();
        }
    })
    .catch(function() {});
}
document.getElementById('edit-form').addEventListener('submit', salvarEdicao);

/**
 * Exclui a tarefa após confirmação (chama a API).
 */
function excluirTarefa(idTarefa) {
    if (!confirm('Excluir esta tarefa?')) {
        return;
    }

    fetch(API_BASE + '/task.php?id=' + idTarefa, { method: 'DELETE' })
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            if (dados.success) {
                var item = document.querySelector('.task-item[data-id="' + idTarefa + '"]');
                if (item) {
                    item.remove();
                }
                if (document.getElementById('task-list').children.length === 0) {
                    document.getElementById('empty-state').classList.remove('hidden');
                }
                atualizarListaParaProgresso();
            }
        })
        .catch(function() {});
}

/**
 * Adiciona uma nova tarefa (envia para a API e recarrega a lista).
 */
function adicionarTarefa(evento) {
    evento.preventDefault();

    var titulo = document.getElementById('task-title').value.trim();
    var descricao = document.getElementById('task-description').value.trim();

    if (!titulo) {
        return;
    }

    fetch(API_BASE + '/tasks.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: titulo, description: descricao })
    })
    .then(function(resposta) {
        return resposta.json();
    })
    .then(function(dados) {
        if (dados.success) {
            document.getElementById('task-title').value = '';
            document.getElementById('task-description').value = '';
            carregarTarefas();
            atualizarListaParaProgresso();
        }
    })
    .catch(function() {});
}
document.getElementById('task-form').addEventListener('submit', adicionarTarefa);

/**
 * Ao clicar em um filtro (Todas, Pendentes, Concluídas), atualiza o filtro e recarrega a lista.
 */
function configurarFiltros() {
    var botoesFiltro = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < botoesFiltro.length; i++) {
        botoesFiltro[i].addEventListener('click', function() {
            filtroAtual = this.getAttribute('data-filter');
            for (var j = 0; j < botoesFiltro.length; j++) {
                botoesFiltro[j].classList.remove('active');
            }
            this.classList.add('active');
            carregarTarefas();
        });
    }
}
configurarFiltros();


/* ============================================
   INÍCIO: verifica se já está logado
   ============================================ */
verificarSeEstaLogado();
