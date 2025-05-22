// Singleton para notificações
// Modificar a classe NotificacaoManager para incluir tipo e identificadores
const NotificacaoManager = (function () {
    let instance;
    let notificationId = 0;
    
    function createInstance() {
        return {
            notificacoes: [],
            adicionar(msg, tipo = 'geral', referencia = null) {
                const id = notificationId++;
                this.notificacoes.push({ id, msg, tipo, referencia, data: new Date() });
                atualizarNotificacoes();
                return id;
            },
            remover(id) {
                this.notificacoes = this.notificacoes.filter(n => n.id !== id);
                atualizarNotificacoes();
                atualizarDashboard();
            },
            getAll() {
                return this.notificacoes;
            }
        };
    }
    return {
        getInstance: function () {
            if (!instance) instance = createInstance();
            return instance;
        }
    };
})();

// Factory Method para criar resíduos
function criarResiduo(tipo, item, quantidade) {
    return { tipo, item, quantidade };
}

// Dados simulados
let pacientes = [];
let residuos = [];
let coletas = [];

// Navegação entre seções
function showSection(id) {
    console.log(`Trocando para a seção: ${id}`); // Log para depuração
    const section = document.getElementById(id);
    if (!section) {
        console.error(`Seção com ID "${id}" não encontrada.`);
        return;
    }
    document.querySelectorAll('main section').forEach(sec => {
        sec.classList.remove('active');
    });
    section.classList.add('active');
}

// Função para formatar data do padrão ISO para o formato brasileiro
function formatarData(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}
// Funções de máscara
function mascararCPF(input) {
    // Remove tudo que não for número
    let cpf = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    cpf = cpf.substring(0, 11);
    
    // Aplica a máscara
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    input.value = cpf;
}

function mascararTelefone(input) {
    // Remove tudo que não for número
    let telefone = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    telefone = telefone.substring(0, 11);
    
    // Aplica a máscara
    if (telefone.length <= 10) {
        // Telefone fixo
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        // Celular
        telefone = telefone.replace(/(\d{2})(\d)/, '($1) $2');
        telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    input.value = telefone;
}


// Cadastro de paciente
document.getElementById('formPaciente').onsubmit = function (e) {
    e.preventDefault();
    const nome = document.getElementById('nomePaciente').value;
    const cpf = document.getElementById('cpfPaciente').value;
    const endereco = document.getElementById('enderecoPaciente').value;
    const telefone = document.getElementById('telefonePaciente').value;
    const email = document.getElementById('emailPaciente').value;
    const tipo = document.getElementById('tipoPaciente').value;
    const dataEntrega = document.getElementById('dataEntregaResiduo').value;
    
    pacientes.push({ 
        nome, 
        cpf, 
        endereco, 
        telefone, 
        email, 
        tipo,
        dataEntrega 
    });
    
    atualizarPacientes();
    verificarDatasProximasEntrega();
    atualizarDashboard();
    this.reset();
};

// Listar pacientes
function atualizarPacientes() {
    const ul = document.getElementById('listaPacientes');
    ul.innerHTML = '';
    pacientes.forEach((p, index) => {
        // Formatamos o CPF e telefone quando exibimos
        const cpfFormatado = formatarCPF(p.cpf);
        const telefoneFormatado = formatarTelefone(p.telefone);
        
        const li = document.createElement('li');
        
        // Div para informações do paciente
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<b>${p.nome}</b> - CPF: ${cpfFormatado}<br>
                      Endereço: ${p.endereco}<br>
                      Telefone: ${telefoneFormatado}
                      ${p.email ? '- Email: ' + p.email : ''}<br>
                      Tipo: ${p.tipo} - Data de Entrega: ${formatarData(p.dataEntrega)}`;
        
        // Div para os botões
        const botoesDiv = document.createElement('div');
        botoesDiv.className = 'acoes-paciente';
        
        // Botão de confirmar entrega
        const btnConfirmarEntrega = document.createElement('button');
        btnConfirmarEntrega.className = 'btn-action';
        btnConfirmarEntrega.innerHTML = '<i class="fas fa-check-circle"></i> Confirmar Entrega';
        btnConfirmarEntrega.onclick = () => abrirModalEntregaPaciente(index);
        
        botoesDiv.appendChild(btnConfirmarEntrega);
        
        li.appendChild(infoDiv);
        li.appendChild(botoesDiv);
        ul.appendChild(li);
    });
    document.getElementById('pacientesCount').textContent = pacientes.length;
}
// Nova função para abrir o modal a partir da lista de pacientes (sem notificação)
function abrirModalEntregaPaciente(pacienteIndex) {
    const paciente = pacientes[pacienteIndex];
    if (!paciente) {
        console.error('Paciente não encontrado:', pacienteIndex);
        return;
    }
    
    // Configurar o modal
    document.getElementById('pacienteEntregaInfo').textContent = 
        `Paciente: ${paciente.nome} - CPF: ${formatarCPF(paciente.cpf)}`;
    document.getElementById('pacienteIdEntrega').value = pacienteIndex;
    
    // Calcular data sugerida (30 dias após a data atual)
    const dataHoje = new Date();
    const novaDataSugerida = new Date(dataHoje);
    novaDataSugerida.setDate(dataHoje.getDate() + 30);
    
    // Formatar para YYYY-MM-DD para o input date
    const yyyy = novaDataSugerida.getFullYear();
    const mm = String(novaDataSugerida.getMonth() + 1).padStart(2, '0');
    const dd = String(novaDataSugerida.getDate()).padStart(2, '0');
    document.getElementById('novaDataEntrega').value = `${yyyy}-${mm}-${dd}`;
    // O modal não está associado a nenhuma notificação (valor -1)
    const modal = document.getElementById('entregaModal');
    modal.setAttribute('data-notificacao-id', -1);
    
    // Abrir o modal
    modal.style.display = 'block';
}
    

// Funções para formatação de exibição
function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

/// Modificar a função verificarDatasProximasEntrega para usar o tipo e referência
function verificarDatasProximasEntrega() {
    const hoje = new Date();
    
    pacientes.forEach((p, index) => {
        if (!p.dataEntrega) return;
        
        const dataEntrega = new Date(p.dataEntrega);
        const diferencaDias = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));
        
        if (diferencaDias <= 3 && diferencaDias >= 0) {
            NotificacaoManager.getInstance().adicionar(
                `Entre em contato com ${p.nome} (${formatarTelefone(p.telefone)}) - A data de entrega de resíduos está próxima (${formatarData(p.dataEntrega)})!`,
                'entrega_residuo', 
                index
            );
        }
    });
}

// Função para abrir o modal de confirmação de entrega
function abrirModalEntrega(notificacaoId, pacienteIndex) {
    const paciente = pacientes[pacienteIndex];
    if (!paciente) {
        console.error('Paciente não encontrado:', pacienteIndex);
        return;
    }
    
    // Configurar o modal
    document.getElementById('pacienteEntregaInfo').textContent = 
        `Paciente: ${paciente.nome} - CPF: ${formatarCPF(paciente.cpf)}`;
    document.getElementById('pacienteIdEntrega').value = pacienteIndex;
    
    // Calcular data sugerida (30 dias após a data atual)
    const dataHoje = new Date();
    const novaDataSugerida = new Date(dataHoje);
    novaDataSugerida.setDate(dataHoje.getDate() + 30);
    
    // Formatar para YYYY-MM-DD para o input date
    const yyyy = novaDataSugerida.getFullYear();
    const mm = String(novaDataSugerida.getMonth() + 1).padStart(2, '0');
    const dd = String(novaDataSugerida.getDate()).padStart(2, '0');
    document.getElementById('novaDataEntrega').value = `${yyyy}-${mm}-${dd}`;
    
    // Armazenar o ID da notificação
    const modal = document.getElementById('entregaModal');
    modal.setAttribute('data-notificacao-id', notificacaoId);
    
    // Abrir o modal
    modal.style.display = 'block';
    
    console.log('Modal aberto para paciente:', paciente.nome, 'ID notificação:', notificacaoId);
}
// Função para confirmar a entrega e atualizar a data
function confirmarEntrega(notificacaoId, pacienteIndex, novaData) {
    // Converter o pacienteIndex para número
    pacienteIndex = parseInt(pacienteIndex);
    
    // Verificar se o paciente existe
    if (!pacientes[pacienteIndex]) {
        console.error('Paciente não encontrado:', pacienteIndex);
        return;
    }
    
    console.log('Confirmando entrega para paciente:', pacientes[pacienteIndex].nome, 'Nova data:', novaData);
    
    // Atualizar a data do paciente
    pacientes[pacienteIndex].dataEntrega = novaData;
    
    // Remover a notificação se houver uma associada (notificacaoId diferente de -1)
    if (notificacaoId !== -1 && notificacaoId !== "-1") {
        NotificacaoManager.getInstance().remover(parseInt(notificacaoId));
    } else {
        // Se foi confirmado diretamente da lista de pacientes, verificar se há notificações relacionadas a esse paciente
        const notificacoes = NotificacaoManager.getInstance().getAll();
        const notificacoesRelacionadas = notificacoes.filter(n => 
            n.tipo === 'entrega_residuo' && n.referencia === pacienteIndex
        );
        
        // Remover notificações relacionadas
        notificacoesRelacionadas.forEach(n => {
            NotificacaoManager.getInstance().remover(n.id);
        });
    }
      // Adicionar uma nova notificação de confirmação
      NotificacaoManager.getInstance().adicionar(
        `Entrega de resíduos confirmada para o paciente ${pacientes[pacienteIndex].nome}. Próxima entrega: ${formatarData(novaData)}`,
        'confirmacao'
    );
    
    // Atualizar a interface
    atualizarPacientes();
    verificarDatasProximasEntrega();
    atualizarDashboard();
}
// Adicionar resíduo
document.getElementById('formResiduo').onsubmit = function (e) {
    e.preventDefault();
    const tipo = document.getElementById('tipoResiduo').value;
    const item = document.getElementById('itemResiduo').value;
    const quantidade = document.getElementById('quantidadeResiduo').value;
    residuos.push(criarResiduo(tipo, item, quantidade));
    atualizarResiduos();
    this.reset();
};

// Listar resíduos
function atualizarResiduos() {
    const ul = document.getElementById('listaResiduos');
    ul.innerHTML = '';
    residuos.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fas fa-trash"></i> <b>${r.item}</b> (${r.tipo}) - Quantidade: ${r.quantidade}`;
        ul.appendChild(li);
    });
}

// Agendar coleta - atualizar para incluir status de conclusão
document.getElementById('formColeta').onsubmit = function (e) {
    e.preventDefault();
    const data = document.getElementById('dataColeta').value;
    const empresa = document.getElementById('empresaColeta').value;
    coletas.push({ data, empresa, concluida: false });
    atualizarColetas();
    atualizarDashboard();
    this.reset();
    // Notificação se a coleta estiver próxima
    const dias = Math.ceil((new Date(data) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias <= 3 && dias >= 0) {
        NotificacaoManager.getInstance().adicionar(
            `Coleta agendada para ${formatarData(data)} com a empresa ${empresa} está próxima!`,
            'coleta',
            coletas.length - 1
        );
    }
};


// Listar coletas com botão de confirmar coleta
function atualizarColetas() {
    const ul = document.getElementById('listaColetas');
    ul.innerHTML = '';
    coletas.forEach((c, index) => {
        const li = document.createElement('li');
        
        // Div para informações da coleta
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `<strong>Data:</strong> ${formatarData(c.data)} - <strong>Empresa:</strong> ${c.empresa}`;
        
        if (c.concluida) {
            infoDiv.innerHTML += ' <span class="coleta-concluida"><i class="fas fa-check-circle"></i> Coleta realizada</span>';
        }
        
        // Div para os botões
        const botoesDiv = document.createElement('div');
        botoesDiv.className = 'acoes-coleta';
        
        // Botão de confirmar coleta (apenas se ainda não estiver concluída)
        if (!c.concluida) {
            const btnConfirmarColeta = document.createElement('button');
            btnConfirmarColeta.className = 'btn-action';
            btnConfirmarColeta.innerHTML = '<i class="fas fa-check"></i> Confirmar Coleta';
            btnConfirmarColeta.onclick = () => confirmarColeta(index);
            botoesDiv.appendChild(btnConfirmarColeta);
        }
        
        li.appendChild(infoDiv);
        li.appendChild(botoesDiv);
        ul.appendChild(li);
    });
    document.getElementById('coletasCount').textContent = coletas.length;
}

// Função para confirmar uma coleta
function confirmarColeta(coletaIndex) {
    const coleta = coletas[coletaIndex];
    if (!coleta) {
        console.error('Coleta não encontrada:', coletaIndex);
        return;
    }
    
    // Confirmar com o usuário
    if (confirm(`Confirmar que a coleta da empresa ${coleta.empresa} programada para ${formatarData(coleta.data)} foi realizada?`)) {
        // Marcar a coleta como concluída
        coleta.concluida = true;
        coleta.dataConclusao = new Date();
        
        // Remover notificações relacionadas a esta coleta
        const notificacoes = NotificacaoManager.getInstance().getAll();
        const notificacoesColeta = notificacoes.filter(n => 
            n.tipo === 'coleta' && 
            n.referencia === coletaIndex
        );
        
        // Remover as notificações encontradas
        notificacoesColeta.forEach(n => {
            NotificacaoManager.getInstance().remover(n.id);
        });
        
        // Adicionar notificação de confirmação
        NotificacaoManager.getInstance().adicionar(
            `Coleta realizada com sucesso pela empresa ${coleta.empresa} em ${formatarData(new Date())}`,
            'confirmacao_coleta'
        );
        
        // Atualizar a interface
        atualizarColetas();
        atualizarDashboard();
    }
}

// Listar coletas
function atualizarColetas() {
    const ul = document.getElementById('listaColetas');
    ul.innerHTML = '';
    coletas.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `Data: ${formatarData(c.data)} - Empresa: ${c.empresa}`;
        ul.appendChild(li);
    });
    document.getElementById('coletasCount').textContent = coletas.length;
}

// Notificações
function atualizarNotificacoes() {
    const ul = document.getElementById('listaNotificacoes');
    const notificacoes = NotificacaoManager.getInstance().getAll();
    ul.innerHTML = '';
    
    notificacoes.forEach(n => {
        const li = document.createElement('li');
        
        // Conteúdo principal da notificação
        const spanTexto = document.createElement('span');
        spanTexto.textContent = n.msg;
        li.appendChild(spanTexto);
        
        // Adicionar div para os botões
        const divBotoes = document.createElement('div');
        divBotoes.className = 'notification-buttons';
        
        // Se for uma notificação de entrega de resíduos, adicionar botão de confirmar
        if (n.tipo === 'entrega_residuo' && n.referencia !== null) {
            const btnConfirmar = document.createElement('button');
            btnConfirmar.className = 'btn-action';
            btnConfirmar.innerHTML = '<i class="fas fa-check"></i> Confirmar Entrega';
            btnConfirmar.onclick = () => abrirModalEntrega(n.id, n.referencia);
            divBotoes.appendChild(btnConfirmar);
        }
        
        // Botão de fechar para todas as notificações
        const btnFechar = document.createElement('button');
        btnFechar.className = 'btn-action';
        btnFechar.innerHTML = '<i class="fas fa-times"></i>';
        btnFechar.onclick = () => NotificacaoManager.getInstance().remover(n.id);
        divBotoes.appendChild(btnFechar);
        
        li.appendChild(divBotoes);
        ul.appendChild(li);
    });
    
    document.getElementById('notificacoesCount').textContent = notificacoes.length;
}

// Dashboard
function atualizarDashboard() {
    document.getElementById('pacientesCount').textContent = pacientes.length;
    document.getElementById('coletasCount').textContent = coletas.length;
    document.getElementById('notificacoesCount').textContent = NotificacaoManager.getInstance().getAll().length;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando eventos de navegação');
    document.getElementById('btnResumo').addEventListener('click', () => showSection('resumo'));
    document.getElementById('btnPacientes').addEventListener('click', () => showSection('pacientes'));
    document.getElementById('btnResiduos').addEventListener('click', () => showSection('residuos'));
    document.getElementById('btnColetas').addEventListener('click', () => showSection('coletas'));
    document.getElementById('btnNotificacoes').addEventListener('click', () => showSection('notificacoes'));
    
    // Adicionar eventos para as máscaras
    const cpfInput = document.getElementById('cpfPaciente');
    const telefoneInput = document.getElementById('telefonePaciente');
    // Eventos do modal de confirmação de entrega
    const modal = document.getElementById('entregaModal');
    const span = modal.querySelector('.close');
    const btnCancelar = document.getElementById('btnCancelarEntrega');
    
    // Fechar o modal ao clicar no X
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    // Fechar o modal ao clicar em Cancelar
    btnCancelar.onclick = function() {
        modal.style.display = 'none';
    }
    
    // Fechar o modal ao clicar fora dele
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    cpfInput.addEventListener('input', function() {
        mascararCPF(this);
    });
    
    telefoneInput.addEventListener('input', function() {
        mascararTelefone(this);
    });

    // Processar o formulário de confirmação
    document.getElementById('formConfirmarEntrega').onsubmit = function(e) {
        e.preventDefault();
        const pacienteIndex = document.getElementById('pacienteIdEntrega').value;
        const novaData = document.getElementById('novaDataEntrega').value;
        const notificacaoId = modal.getAttribute('data-notificacao-id');
        
        confirmarEntrega(notificacaoId, pacienteIndex, novaData);
        
        // Fechar o modal
        modal.style.display = 'none';
    }
    
    showSection('resumo'); // Exibe a seção "Resumo" ao carregar a página
    verificarDatasProximasEntrega(); // Verifica datas próximas na inicialização
});

atualizarNotificacoes();
showSection('resumo');
atualizarDashboard();
atualizarPacientes();
atualizarResiduos();
atualizarColetas();
atualizarNotificacoes();