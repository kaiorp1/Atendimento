const ASSUNTO_LABEL = {
  debitos_negociacao: 'Débitos e negociação',
  consumo_alto: 'Consumo alto',
  erro_leitura: 'Erro de leitura',
  revisao_cadastral: 'Revisão cadastral',
  outros: 'Outros'
};

const MOTIVO_LABEL = {
  nao_recebeu: 'Não recebeu',
  perdeu: 'Perdeu',
  nao_conseguiu_acesso_digital: 'Não conseguiu acesso digital',
  outro: 'Outro'
};

function simNaoTag(v) {
  if (v === true) return '<span class="tag tag-sim">Sim</span>';
  if (v === false) return '<span class="tag tag-nao">Não</span>';
  return '-';
}

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const MODULOS = {
  grandes_clientes: {
    tabela: 'contato_grandes_clientes',
    titulo: 'Contato - Grandes Clientes',
    arquivoBase: 'contato-grandes-clientes',
    filtroAssuntoOptions: [
      ['', 'Todos os assuntos'],
      ['debitos_negociacao', 'Débitos e negociação'],
      ['consumo_alto', 'Consumo alto'],
      ['erro_leitura', 'Erro de leitura'],
      ['revisao_cadastral', 'Revisão cadastral'],
      ['outros', 'Outros']
    ],
    filtroAssuntoCampo: 'assunto',
    buscaCampos: ['nome_cliente', 'ligacao_cliente'],
    buscaPlaceholder: 'Buscar por nome ou telefone...',
    colunas: [
      { head: 'Data/Hora', get: r => formatarData(r.created_at), exportKey: 'Data/Hora' },
      { head: 'Ligação', get: r => r.ligacao_cliente || '', exportKey: 'Ligação do cliente' },
      { head: 'Nome do cliente', get: r => r.nome_cliente || '', exportKey: 'Nome do cliente' },
      { head: 'Assunto', get: r => ASSUNTO_LABEL[r.assunto] || r.assunto || '', exportKey: 'Assunto' },
      { head: 'Obs. assunto', get: r => r.assunto_observacao || '', exportKey: 'Observação do assunto' },
      { head: 'Contato c/ sucesso', get: r => simNaoTag(r.contato_sucesso), exportGet: r => r.contato_sucesso ? 'Sim' : 'Não', exportKey: 'Contato com sucesso' },
      { head: 'Problema sanado', get: r => simNaoTag(r.problema_sanado), exportGet: r => r.problema_sanado ? 'Sim' : 'Não', exportKey: 'Problema sanado' },
      { head: 'Obs. problema', get: r => r.problema_sanado_obs || '', exportKey: 'Observação do problema' },
      { head: 'Negociou débito', get: r => simNaoTag(r.negociacao_debito), exportGet: r => r.negociacao_debito ? 'Sim' : 'Não', exportKey: 'Negociou débito' },
      { head: 'Valor negociado', get: r => r.valor_negociado != null ? 'R$ ' + Number(r.valor_negociado).toFixed(2) : '-', exportGet: r => r.valor_negociado != null ? Number(r.valor_negociado) : '', exportKey: 'Valor negociado' },
      { head: 'OS aberta', get: r => simNaoTag(r.os_aberta), exportGet: r => r.os_aberta ? 'Sim' : 'Não', exportKey: 'OS aberta' },
      { head: 'Nº OS', get: r => r.os_numero || '-', exportKey: 'Número da OS' },
      { head: 'Observações gerais', get: r => r.observacoes_gerais || '', exportKey: 'Observações gerais' },
      { head: 'Registrado por', get: r => r.registrado_por || '-', exportKey: 'Registrado por' }
    ]
  },

  segunda_via: {
    tabela: 'registro_segunda_via',
    titulo: 'Registro Segunda Via',
    arquivoBase: 'registro-segunda-via',
    filtroAssuntoOptions: [
      ['', 'Todos os motivos'],
      ['nao_recebeu', 'Não recebeu'],
      ['perdeu', 'Perdeu'],
      ['nao_conseguiu_acesso_digital', 'Não conseguiu acesso digital'],
      ['outro', 'Outro']
    ],
    filtroAssuntoCampo: 'motivo',
    buscaCampos: ['nome_titular', 'matricula', 'telefone', 'email'],
    buscaPlaceholder: 'Buscar por nome, matrícula, telefone ou e-mail...',
    colunas: [
      { head: 'Data/Hora', get: r => formatarData(r.created_at), exportKey: 'Data/Hora' },
      { head: 'Matrícula', get: r => r.matricula || '', exportKey: 'Matrícula' },
      { head: 'Nome do titular', get: r => r.nome_titular || '', exportKey: 'Nome do titular' },
      { head: 'Motivo', get: r => MOTIVO_LABEL[r.motivo] || r.motivo || '', exportKey: 'Motivo' },
      { head: 'Obs. motivo', get: r => r.motivo_observacao || '', exportKey: 'Observação do motivo' },
      { head: 'Telefone', get: r => r.telefone || '-', exportKey: 'Telefone' },
      { head: 'E-mail', get: r => r.email || '-', exportKey: 'E-mail' },
      { head: 'Aceita conta digital', get: r => simNaoTag(r.aceita_conta_digital), exportGet: r => r.aceita_conta_digital ? 'Sim' : 'Não', exportKey: 'Aceita conta digital' },
      { head: 'Auxílio APP', get: r => simNaoTag(r.auxilio_instalacao_app), exportGet: r => r.auxilio_instalacao_app ? 'Sim' : 'Não', exportKey: 'Auxílio instalação/acesso APP' }
    ]
  }
};

let moduloAtual = 'grandes_clientes';
let registros = [];

const loginView = document.getElementById('login-view');
const panelView = document.getElementById('panel-view');
const loginStatus = document.getElementById('login-status');

function showLoginStatus(msg) {
  loginStatus.textContent = msg;
  loginStatus.classList.remove('hidden');
  loginStatus.classList.add('err');
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    loginView.classList.add('hidden');
    panelView.classList.remove('hidden');
    aplicarConfigModulo();
    await carregarDados();
  } else {
    loginView.classList.remove('hidden');
    panelView.classList.add('hidden');
  }
}

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) {
    showLoginStatus('Login inválido: ' + error.message);
  } else {
    await checkSession();
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  await checkSession();
});

document.getElementById('btn-refresh').addEventListener('click', carregarDados);

function aplicarConfigModulo() {
  const cfg = MODULOS[moduloAtual];

  document.getElementById('module-title').textContent = cfg.titulo;
  document.getElementById('filtro-busca').placeholder = cfg.buscaPlaceholder;

  const selectAssunto = document.getElementById('filtro-assunto');
  selectAssunto.innerHTML = cfg.filtroAssuntoOptions
    .map(([val, label]) => `<option value="${val}">${label}</option>`)
    .join('');

  const head = document.getElementById('tabela-head');
  head.innerHTML = cfg.colunas.map(c => `<th>${c.head}</th>`).join('');

  document.querySelectorAll('.module-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.modulo === moduloAtual);
  });

  document.getElementById('filtro-busca').value = '';
  document.getElementById('filtro-data-ini').value = '';
  document.getElementById('filtro-data-fim').value = '';
}

document.getElementById('tab-grandes-clientes').addEventListener('click', () => trocarModulo('grandes_clientes'));
document.getElementById('tab-segunda-via').addEventListener('click', () => trocarModulo('segunda_via'));

async function trocarModulo(modulo) {
  if (modulo === moduloAtual) return;
  moduloAtual = modulo;
  aplicarConfigModulo();
  await carregarDados();
}

async function carregarDados() {
  const cfg = MODULOS[moduloAtual];
  document.getElementById('count-info').textContent = 'Carregando...';
  const { data, error } = await supabaseClient
    .from(cfg.tabela)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('count-info').textContent = 'Erro ao carregar: ' + error.message;
    registros = [];
    document.getElementById('tabela-body').innerHTML = '';
    return;
  }
  registros = data || [];
  renderTabela();
}

function aplicarFiltros(lista) {
  const cfg = MODULOS[moduloAtual];
  const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
  const assunto = document.getElementById('filtro-assunto').value;
  const dataIni = document.getElementById('filtro-data-ini').value;
  const dataFim = document.getElementById('filtro-data-fim').value;

  return lista.filter(r => {
    if (busca) {
      const alvo = cfg.buscaCampos.map(campo => (r[campo] || '')).join(' ').toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    if (assunto && r[cfg.filtroAssuntoCampo] !== assunto) return false;
    if (dataIni) {
      const d = new Date(r.created_at);
      if (d < new Date(dataIni + 'T00:00:00')) return false;
    }
    if (dataFim) {
      const d = new Date(r.created_at);
      if (d > new Date(dataFim + 'T23:59:59')) return false;
    }
    return true;
  });
}

function renderTabela() {
  const cfg = MODULOS[moduloAtual];
  const filtrados = aplicarFiltros(registros);
  const tbody = document.getElementById('tabela-body');

  tbody.innerHTML = filtrados.map(r => {
    const tds = cfg.colunas.map(c => `<td>${c.get(r)}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  document.getElementById('count-info').textContent =
    `${filtrados.length} registro(s) de ${registros.length} no total.`;
}

['filtro-busca', 'filtro-assunto', 'filtro-data-ini', 'filtro-data-fim'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderTabela);
});

function montarPlanilhaDados() {
  const cfg = MODULOS[moduloAtual];
  const filtrados = aplicarFiltros(registros);
  return filtrados.map(r => {
    const linha = {};
    cfg.colunas.forEach(c => {
      linha[c.exportKey] = c.exportGet ? c.exportGet(r) : c.get(r);
    });
    return linha;
  });
}

document.getElementById('btn-xlsx').addEventListener('click', () => {
  const cfg = MODULOS[moduloAtual];
  const dados = montarPlanilhaDados();
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, cfg.titulo.slice(0, 31));
  const dataStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${cfg.arquivoBase}-${dataStr}.xlsx`);
});

document.getElementById('btn-csv').addEventListener('click', () => {
  const cfg = MODULOS[moduloAtual];
  const dados = montarPlanilhaDados();
  const ws = XLSX.utils.json_to_sheet(dados);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dataStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${cfg.arquivoBase}-${dataStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

checkSession();
