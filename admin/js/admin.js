const ASSUNTO_LABEL = {
  debitos_negociacao: 'Débitos e negociação',
  consumo_alto: 'Consumo alto',
  erro_leitura: 'Erro de leitura',
  revisao_cadastral: 'Revisão cadastral',
  outros: 'Outros'
};

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

async function carregarDados() {
  document.getElementById('count-info').textContent = 'Carregando...';
  const { data, error } = await supabaseClient
    .from('contato_grandes_clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('count-info').textContent = 'Erro ao carregar: ' + error.message;
    return;
  }
  registros = data || [];
  renderTabela();
}

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function simNaoTag(v) {
  if (v === true) return '<span class="tag tag-sim">Sim</span>';
  if (v === false) return '<span class="tag tag-nao">Não</span>';
  return '-';
}

function aplicarFiltros(lista) {
  const busca = document.getElementById('filtro-busca').value.trim().toLowerCase();
  const assunto = document.getElementById('filtro-assunto').value;
  const dataIni = document.getElementById('filtro-data-ini').value;
  const dataFim = document.getElementById('filtro-data-fim').value;

  return lista.filter(r => {
    if (busca) {
      const alvo = (r.nome_cliente + ' ' + r.ligacao_cliente).toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    if (assunto && r.assunto !== assunto) return false;
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
  const filtrados = aplicarFiltros(registros);
  const tbody = document.getElementById('tabela-body');
  tbody.innerHTML = filtrados.map(r => `
    <tr>
      <td>${formatarData(r.created_at)}</td>
      <td>${r.ligacao_cliente || ''}</td>
      <td>${r.nome_cliente || ''}</td>
      <td>${ASSUNTO_LABEL[r.assunto] || r.assunto || ''}</td>
      <td>${r.assunto_observacao || ''}</td>
      <td>${simNaoTag(r.contato_sucesso)}</td>
      <td>${simNaoTag(r.problema_sanado)}</td>
      <td>${r.problema_sanado_obs || ''}</td>
      <td>${simNaoTag(r.negociacao_debito)}</td>
      <td>${r.valor_negociado != null ? 'R$ ' + Number(r.valor_negociado).toFixed(2) : '-'}</td>
      <td>${simNaoTag(r.os_aberta)}</td>
      <td>${r.os_numero || '-'}</td>
      <td>${r.observacoes_gerais || ''}</td>
      <td>${r.registrado_por || '-'}</td>
    </tr>
  `).join('');

  document.getElementById('count-info').textContent =
    `${filtrados.length} registro(s) de ${registros.length} no total.`;
}

['filtro-busca', 'filtro-assunto', 'filtro-data-ini', 'filtro-data-fim'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderTabela);
});

function montarPlanilhaDados() {
  const filtrados = aplicarFiltros(registros);
  return filtrados.map(r => ({
    'Data/Hora': formatarData(r.created_at),
    'Ligação do cliente': r.ligacao_cliente,
    'Nome do cliente': r.nome_cliente,
    'Assunto': ASSUNTO_LABEL[r.assunto] || r.assunto,
    'Observação do assunto': r.assunto_observacao || '',
    'Contato com sucesso': r.contato_sucesso ? 'Sim' : 'Não',
    'Problema sanado': r.problema_sanado ? 'Sim' : 'Não',
    'Observação do problema': r.problema_sanado_obs || '',
    'Negociou débito': r.negociacao_debito ? 'Sim' : 'Não',
    'Valor negociado': r.valor_negociado != null ? Number(r.valor_negociado) : '',
    'OS aberta': r.os_aberta ? 'Sim' : 'Não',
    'Número da OS': r.os_numero || '',
    'Observações gerais': r.observacoes_gerais || '',
    'Registrado por': r.registrado_por || ''
  }));
}

document.getElementById('btn-xlsx').addEventListener('click', () => {
  const dados = montarPlanilhaDados();
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Grandes Clientes');
  const dataStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `contato-grandes-clientes-${dataStr}.xlsx`);
});

document.getElementById('btn-csv').addEventListener('click', () => {
  const dados = montarPlanilhaDados();
  const ws = XLSX.utils.json_to_sheet(dados);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dataStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `contato-grandes-clientes-${dataStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

checkSession();
