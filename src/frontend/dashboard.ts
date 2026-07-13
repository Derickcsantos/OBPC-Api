const apiResources = [
  {
    name: 'ministerios',
    label: 'Ministerios',
    idField: 'ministerio_id',
    fields: [
      { name: 'nome_ministerio', label: 'Nome', type: 'text', required: true },
      { name: 'descricao_ministerio', label: 'Descricao', type: 'textarea', required: true },
      { name: 'url_ministerio', label: 'URL', type: 'url', required: true },
      { name: 'fotos_ministerio_files', label: 'Fotos do ministerio', type: 'dropzone', uploadOnly: true },
    ],
  },
  {
    name: 'fotos_ministerios',
    label: 'Fotos de Ministerios',
    idField: 'foto_ministerio_id',
    fields: [
      { name: 'ministerio_id', label: 'Ministerio', type: 'ministry-combobox', required: true },
      { name: 'foto_ministerio_file', label: 'Imagem', type: 'dropzone', uploadOnly: true, single: true, required: true },
      { name: 'url_imagem', label: 'URL da imagem', type: 'url', hidden: true },
      { name: 'ordem', label: 'Ordem', type: 'number' },
    ],
  },
  {
    name: 'pessoas',
    label: 'Pessoas',
    idField: 'pessoa_id',
    fields: [
      { name: 'url_imagem', label: 'URL da imagem', type: 'url', hiddenInput: true },
      { name: 'imagem_pessoa_file', label: 'Imagem da pessoa', type: 'dropzone', uploadOnly: true, single: true },
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'cargo', label: 'Cargo', type: 'text', required: true },
      { name: 'sobre', label: 'Sobre', type: 'textarea', required: true },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
    ],
  },
  {
    name: 'usuarios',
    label: 'Usuarios',
    idField: 'usuario_id',
    fields: [
      { name: 'nome_usuario', label: 'Nome', type: 'text', required: true },
      { name: 'telefone_usuario', label: 'Telefone', type: 'text', required: true },
      { name: 'senha_usuario', label: 'Senha', type: 'password', required: true },
      { name: 'email_usuario', label: 'Email', type: 'email', required: true },
      { name: 'data_nascimento', label: 'Nascimento', type: 'date', required: true },
    ],
  },
  {
    name: 'eventos',
    label: 'Eventos',
    idField: 'evento_id',
    fields: [
      { name: 'nome_evento', label: 'Nome', type: 'text', required: true },
      { name: 'descricao_evento', label: 'Descricao', type: 'textarea', required: true },
      { name: 'data_evento', label: 'Data', type: 'datetime-local', required: true },
      { name: 'link_evento', label: 'Link', type: 'url', required: true },
      { name: 'url_capa', label: 'URL da capa', type: 'url', hiddenInput: true },
      { name: 'capa_evento_file', label: 'Capa do evento', type: 'dropzone', uploadOnly: true, single: true },
      { name: 'imagens_evento_files', label: 'Imagens auxiliares', type: 'dropzone', uploadOnly: true },
      { name: 'numero_vagas', label: 'Numero de vagas', type: 'number' },
      { name: 'endereco_evento', label: 'Endereco', type: 'textarea' },
      { name: 'hora_inicio', label: 'Hora de inicio', type: 'time' },
      { name: 'observacao_evento', label: 'Observacoes', type: 'textarea' },
      { name: 'responsavel_nome', label: 'Responsavel', type: 'text' },
      { name: 'responsavel_telefone', label: 'Telefone do responsavel', type: 'text' },
    ],
  },
  {
    name: 'eventos_imagens',
    label: 'Imagens de Evento',
    idField: 'imagem_id',
    fields: [
      { name: 'evento_id', label: 'Evento', type: 'event-combobox', required: true },
      { name: 'imagem_evento_file', label: 'Imagens', type: 'dropzone', uploadOnly: true, required: true },
      { name: 'url_imagem', label: 'URL da imagem', type: 'url', hidden: true },
      { name: 'ordem', label: 'Ordem', type: 'number' },
    ],
  },
  {
    name: 'eventos_inscricoes',
    label: 'Inscricoes',
    idField: 'inscricao_id',
    fields: [
      { name: 'evento_id', label: 'Evento com vaga', type: 'event-combobox', onlyWithVacancy: true, required: true },
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['inscrito', 'cancelado'] },
    ],
  },
  {
    name: 'noticias',
    label: 'Noticias',
    idField: 'noticia_id',
    fields: [
      { name: 'nome_noticia', label: 'Nome', type: 'text', required: true },
      { name: 'mensagem_noticia', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'data_noticia', label: 'Data', type: 'datetime-local', required: true },
      { name: 'url_capa', label: 'URL da capa', type: 'url', hiddenInput: true },
      { name: 'capa_noticia_file', label: 'Capa da noticia', type: 'dropzone', uploadOnly: true, single: true },
      { name: 'observacao_noticia', label: 'Observacao', type: 'textarea' },
    ],
  },
  {
    name: 'louvores',
    label: 'Louvores',
    idField: 'louvor_id',
    fields: [
      { name: 'nome_louvor', label: 'Nome', type: 'text', required: true },
      { name: 'url_louvor', label: 'URL', type: 'url', required: true },
      { name: 'observacao_louvor', label: 'Observacao', type: 'textarea' },
    ],
  },
  {
    name: 'mensagens',
    label: 'Mensagens',
    idField: 'mensagem_id',
    fields: [
      { name: 'nome_mensagem', label: 'Nome', type: 'text', required: true },
      { name: 'texto_mensagem', label: 'Texto', type: 'textarea', required: true },
    ],
  },
  {
    name: 'oracoes',
    label: 'Oracoes',
    idField: 'oracao_id',
    fields: [
      { name: 'nome_pedido', label: 'Nome', type: 'text', required: true },
      { name: 'descricao_pedido', label: 'Descricao', type: 'textarea', required: true },
      { name: 'mostrar_grupo', label: 'Mostrar grupo', type: 'checkbox' },
      { name: 'aceita_ligacao', label: 'Aceita ligacao', type: 'checkbox' },
      { name: 'status', label: 'Status', type: 'select', options: ['em andamento', 'finalizado', 'concluído'] },
    ],
  },
];

export const dashboardHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OBPC API</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --panel-2: #eef2f5;
      --ink: #1b1f24;
      --muted: #64707d;
      --line: #d9e0e7;
      --accent: #0f766e;
      --accent-soft: #e6f4f1;
      --accent-2: #b42318;
      --focus: #2563eb;
      --shadow: 0 18px 45px rgba(27, 31, 36, 0.08);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    button, input, textarea, select {
      font: inherit;
    }

    button {
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--ink);
      cursor: pointer;
    }

    button:hover { border-color: var(--focus); }
    button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    button.danger { color: var(--accent-2); }

    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 240px minmax(0, 1fr);
    }

    aside {
      border-right: 1px solid var(--line);
      background: #fff;
      padding: 16px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
    }

    .brand {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 18px;
    }

    nav {
      display: grid;
      gap: 6px;
    }

    .nav-button {
      width: 100%;
      text-align: left;
      padding: 9px 10px;
      background: transparent;
    }

    .nav-button.active {
      background: var(--panel-2);
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 650;
    }

    main {
      min-width: 0;
      padding: 20px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 22px;
      margin: 0;
    }

    .status {
      min-height: 24px;
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    .workspace {
      min-width: 0;
    }

    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
      box-shadow: var(--shadow);
    }

    .section-head {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .section-title {
      font-weight: 700;
    }

    form {
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    label {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 650;
    }

    input, textarea, select {
      width: 100%;
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 8px 10px;
      color: var(--ink);
      background: #fff;
    }

    textarea {
      min-height: 90px;
      resize: vertical;
    }

    .check-row {
      grid-template-columns: 20px 1fr;
      align-items: center;
      color: var(--ink);
      font-size: 14px;
    }

    .check-row input {
      width: 18px;
      min-height: 18px;
      padding: 0;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .dropzone {
      border: 1.5px dashed #93a4b5;
      border-radius: 8px;
      background: #f9fbfc;
      min-height: 132px;
      display: grid;
      place-items: center;
      padding: 16px;
      color: var(--muted);
      text-align: center;
      cursor: pointer;
    }

    .dropzone.single {
      min-height: 104px;
    }

    .dropzone.dragging {
      border-color: var(--accent);
      background: var(--accent-soft);
      color: var(--accent);
    }

    .dropzone strong {
      color: var(--ink);
      display: block;
      margin-bottom: 4px;
    }

    .file-list {
      display: grid;
      gap: 6px;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
    }

    .thumb {
      width: 72px;
      height: 48px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid var(--line);
      background: var(--panel-2);
      display: block;
    }

    .hint {
      color: var(--muted);
      font-size: 12px;
    }

    .table-wrap {
      overflow: auto;
      max-height: calc(100vh - 168px);
    }

    .modal {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(17, 24, 39, 0.42);
    }

    .modal[hidden] {
      display: none;
    }

    .modal-panel {
      width: min(760px, 100%);
      max-height: calc(100vh - 36px);
      overflow: auto;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(17, 24, 39, 0.22);
    }

    .modal-head {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--panel);
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
    }

    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
      max-width: 300px;
      overflow-wrap: anywhere;
    }

    th {
      position: sticky;
      top: 0;
      background: var(--panel);
      z-index: 1;
      color: var(--muted);
      font-size: 12px;
    }

    .row-actions {
      display: flex;
      gap: 6px;
      min-width: 150px;
    }

    .bible-tools {
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(6, minmax(120px, 1fr));
      gap: 10px;
    }

    .bible-results {
      display: grid;
      gap: 14px;
      padding: 0 14px 14px;
    }

    .result-block {
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: var(--panel);
    }

    .result-block h3 {
      margin: 0;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
      color: var(--muted);
    }

    .result-list {
      display: grid;
    }

    .result-item {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
    }

    .result-item:last-child {
      border-bottom: 0;
    }

    .result-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .result-meta {
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 6px;
    }

    pre {
      margin: 0;
      padding: 14px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #111827;
      color: #e5e7eb;
      border-radius: 0 0 8px 8px;
      max-height: 520px;
      overflow: auto;
    }

    @media (max-width: 940px) {
      .shell { grid-template-columns: 1fr; }
      aside { position: static; height: auto; }
      nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .workspace { grid-template-columns: 1fr; }
      .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <p class="brand">OBPC API</p>
      <nav id="nav"></nav>
    </aside>
    <main>
      <div class="topbar">
        <h1 id="title">Ministerios</h1>
        <div class="actions">
          <button id="reload" type="button">Atualizar</button>
          <button id="new-record" type="button" class="primary">Novo</button>
        </div>
      </div>
      <p id="status" class="status"></p>
      <div id="crud-view" class="workspace">
        <section>
          <div class="section-head">
            <span class="section-title">Dados</span>
          </div>
          <div class="table-wrap">
            <table id="table"></table>
          </div>
        </section>
      </div>
      <div id="bible-view" hidden>
        <section>
          <div class="section-head">
            <span class="section-title">Biblia</span>
          </div>
          <div class="bible-tools">
            <div class="filters">
              <label>Endpoint
                <select id="bible-endpoint">
                  <option value="/api/biblia/testaments">Testamentos</option>
                  <option value="/api/biblia/books">Livros</option>
                  <option value="/api/biblia/chapters">Capitulos</option>
                  <option value="/api/biblia/verses">Versos</option>
                  <option value="/api/biblia/search">Busca</option>
                  <option value="/api/biblia/examples">Exemplos JSON</option>
                </select>
              </label>
              <label>Testamento <input id="bible-testament" type="number" min="1"></label>
              <label>Livro <input id="bible-book" type="number" min="1"></label>
              <label>Capitulo <input id="bible-chapter" type="number" min="1"></label>
              <label>Versiculo <input id="bible-verse" type="number" min="1"></label>
              <label>Escopo
                <select id="bible-scope">
                  <option value="all">Tudo</option>
                  <option value="books">Livros</option>
                  <option value="verses">Versiculos</option>
                </select>
              </label>
            </div>
            <label>Texto <input id="bible-keyword" type="search"></label>
            <div class="actions">
              <button id="bible-fetch" type="button" class="primary">Buscar</button>
            </div>
          </div>
          <div id="bible-results" class="bible-results"></div>
          <pre id="bible-output">{}</pre>
        </section>
      </div>
      <div id="form-modal" class="modal" hidden>
        <div class="modal-panel">
          <div class="modal-head">
            <span id="form-title" class="section-title">Cadastro</span>
            <button id="modal-close" type="button">Fechar</button>
          </div>
          <form id="form"></form>
        </div>
      </div>
    </main>
  </div>
  <script>
    const resources = ${JSON.stringify(apiResources)};
    const bibleTab = { name: 'biblia', label: 'Biblia' };
    let current = resources[0];
    let editing = null;

    const nav = document.querySelector('#nav');
    const title = document.querySelector('#title');
    const statusEl = document.querySelector('#status');
    const form = document.querySelector('#form');
    const formModal = document.querySelector('#form-modal');
    const modalClose = document.querySelector('#modal-close');
    const table = document.querySelector('#table');
    const crudView = document.querySelector('#crud-view');
    const bibleView = document.querySelector('#bible-view');
    const reloadBtn = document.querySelector('#reload');
    const newBtn = document.querySelector('#new-record');
    const eventCache = { all: [], withVacancy: [], loadedAt: 0 };
    const ministryCache = { all: [], loadedAt: 0 };

    function setStatus(message, isError = false) {
      statusEl.textContent = message || '';
      statusEl.style.color = isError ? '#b42318' : '#64707d';
    }

    function openModal() {
      formModal.hidden = false;
      const firstInput = form.querySelector('input:not([type="hidden"]), textarea, select');
      if (firstInput) firstInput.focus();
    }

    function closeModal() {
      formModal.hidden = true;
    }

    function renderNav() {
      nav.innerHTML = '';
      [...resources, bibleTab].forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nav-button' + (current.name === item.name ? ' active' : '');
        button.textContent = item.label;
        button.addEventListener('click', () => selectResource(item.name));
        nav.appendChild(button);
      });
    }

    function selectResource(name) {
      if (name === 'biblia') {
        current = bibleTab;
        title.textContent = 'Biblia';
        crudView.hidden = true;
        bibleView.hidden = false;
        newBtn.hidden = true;
        reloadBtn.hidden = true;
        renderNav();
        fetchBible();
        return;
      }

      current = resources.find((resource) => resource.name === name);
      editing = null;
      title.textContent = current.label;
      crudView.hidden = false;
      bibleView.hidden = true;
      newBtn.hidden = false;
      reloadBtn.hidden = false;
      renderNav();
      renderForm();
      loadRows();
    }

    function fieldInput(field, value) {
      if (field.hiddenInput || field.hidden) {
        return '<input name="' + field.name + '" type="hidden" value="' + escapeHtml(formatInputValue(field, value)) + '">';
      }

      if (field.type === 'textarea') {
        return '<textarea name="' + field.name + '" ' + (field.required ? 'required' : '') + '>' + escapeHtml(value || '') + '</textarea>';
      }

      if (field.type === 'select') {
        return '<select name="' + field.name + '">' + field.options.map((option) => '<option value="' + option + '"' + (value === option ? ' selected' : '') + '>' + option + '</option>').join('') + '</select>';
      }

      if (field.type === 'checkbox') {
        return '<label class="check-row"><input name="' + field.name + '" type="checkbox" ' + (value === true || value === undefined ? 'checked' : '') + '> ' + field.label + '</label>';
      }

      if (field.type === 'file') {
        return '<input name="' + field.name + '" type="file" accept="image/jpeg,image/png,image/webp,image/gif" ' + (field.required && !editing ? 'required' : '') + '>';
      }

      if (field.type === 'dropzone') {
        const multiple = field.single ? '' : ' multiple';
        const title = field.single ? 'Arraste a imagem aqui' : 'Arraste imagens aqui';
        const helper = field.single ? 'ou clique para escolher uma imagem' : 'ou clique para escolher varias imagens';
        return '<div class="dropzone' + (field.single ? ' single' : '') + '" data-dropzone="' + field.name + '"><div><strong>' + title + '</strong><span>' + helper + '</span><div class="file-list" data-file-list="' + field.name + '"></div></div></div><input name="' + field.name + '" type="file" accept="image/jpeg,image/png,image/webp,image/gif"' + multiple + ' hidden>';
      }

      if (field.type === 'event-combobox') {
        return '<input name="' + field.name + '_search" list="' + field.name + '_list" data-event-search="' + field.name + '" placeholder="Digite o nome do evento" autocomplete="off"><input name="' + field.name + '" type="hidden" value="' + escapeHtml(value || '') + '"><datalist id="' + field.name + '_list"></datalist><span class="hint" data-event-hint="' + field.name + '">Selecione um evento pelo nome.</span>';
      }

      if (field.type === 'ministry-combobox') {
        return '<input name="' + field.name + '_search" list="' + field.name + '_list" data-ministry-search="' + field.name + '" placeholder="Digite o nome do ministerio" autocomplete="off"><input name="' + field.name + '" type="hidden" value="' + escapeHtml(value || '') + '"><datalist id="' + field.name + '_list"></datalist><span class="hint" data-ministry-hint="' + field.name + '">Selecione um ministerio pelo nome.</span>';
      }

      return '<input name="' + field.name + '" type="' + field.type + '" value="' + escapeHtml(formatInputValue(field, value)) + '" ' + (field.required && !editing ? 'required' : '') + '>';
    }

    function formatInputValue(field, value) {
      if (!value) return '';
      if (field.type === 'datetime-local') return String(value).slice(0, 16);
      if (field.type === 'date') return String(value).slice(0, 10);
      return String(value);
    }

    function renderForm(row = {}) {
      document.querySelector('#form-title').textContent = editing ? 'Edicao' : 'Cadastro';
      form.innerHTML = current.fields.map((field) => {
        if (field.hiddenInput || field.hidden) return fieldInput(field, row[field.name]);
        if (field.type === 'checkbox') return fieldInput(field, row[field.name]);
        return '<label>' + field.label + fieldInput(field, row[field.name]) + '</label>';
      }).join('') + '<div class="actions"><button type="submit" class="primary">' + (editing ? 'Salvar' : 'Criar') + '</button><button type="button" id="cancel-edit">Limpar</button></div>';
      document.querySelector('#cancel-edit').addEventListener('click', () => {
        editing = null;
        renderForm();
        closeModal();
      });
      wireSpecialFields(row);
    }

    async function wireSpecialFields(row = {}) {
      for (const field of current.fields) {
        if (field.type === 'dropzone') setupDropzone(field.name);
        if (field.type === 'event-combobox') await setupEventCombobox(field, row[field.name]);
        if (field.type === 'ministry-combobox') await setupMinistryCombobox(field, row[field.name]);
      }
    }

    function setupDropzone(name) {
      const zone = form.querySelector('[data-dropzone="' + name + '"]');
      const input = form.elements[name];
      const list = form.querySelector('[data-file-list="' + name + '"]');
      if (!zone || !input || !list) return;

      const renderFiles = () => {
        const files = [...(input.files || [])];
        list.innerHTML = files.length ? files.map((file) => '<span>' + escapeHtml(file.name) + '</span>').join('') : '';
      };

      zone.addEventListener('click', () => input.click());
      zone.addEventListener('dragover', (event) => {
        event.preventDefault();
        zone.classList.add('dragging');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
      zone.addEventListener('drop', (event) => {
        event.preventDefault();
        zone.classList.remove('dragging');
        if (input.multiple) {
          input.files = event.dataTransfer.files;
        } else {
          const transfer = new DataTransfer();
          if (event.dataTransfer.files[0]) transfer.items.add(event.dataTransfer.files[0]);
          input.files = transfer.files;
        }
        renderFiles();
      });
      input.addEventListener('change', renderFiles);
    }

    async function setupEventCombobox(field, selectedId) {
      const search = form.querySelector('[data-event-search="' + field.name + '"]');
      const hidden = form.elements[field.name];
      const list = form.querySelector('#' + field.name + '_list');
      const hint = form.querySelector('[data-event-hint="' + field.name + '"]');
      if (!search || !hidden || !list) return;

      const events = await getEvents(field.onlyWithVacancy);
      const selected = events.find((event) => event.evento_id === selectedId);
      if (selected) search.value = eventLabel(selected);

      list.innerHTML = events.map((event) => '<option value="' + escapeHtml(eventLabel(event)) + '"></option>').join('');

      const sync = () => {
        const match = events.find((event) => eventLabel(event) === search.value);
        hidden.value = match ? match.evento_id : '';
        if (hint) {
          hint.textContent = match ? 'Evento selecionado: ' + match.evento_id : 'Selecione um evento valido pelo nome.';
        }
      };

      search.addEventListener('change', sync);
      search.addEventListener('input', sync);
    }

    async function getEvents(onlyWithVacancy = false) {
      const now = Date.now();
      if (!eventCache.loadedAt || now - eventCache.loadedAt > 30000) {
        const json = await request('/api/eventos');
        eventCache.all = json.data || [];
        eventCache.withVacancy = await filterEventsWithVacancy(eventCache.all);
        eventCache.loadedAt = now;
      }
      return onlyWithVacancy ? eventCache.withVacancy : eventCache.all;
    }

    async function setupMinistryCombobox(field, selectedId) {
      const search = form.querySelector('[data-ministry-search="' + field.name + '"]');
      const hidden = form.elements[field.name];
      const list = form.querySelector('#' + field.name + '_list');
      const hint = form.querySelector('[data-ministry-hint="' + field.name + '"]');
      if (!search || !hidden || !list) return;

      const ministries = await getMinistries();
      const selected = ministries.find((item) => item.ministerio_id === selectedId);
      if (selected) search.value = selected.nome_ministerio;

      list.innerHTML = ministries
        .map((item) => '<option value="' + escapeHtml(item.nome_ministerio) + '"></option>')
        .join('');

      const sync = () => {
        const match = ministries.find((item) => item.nome_ministerio === search.value);
        hidden.value = match ? match.ministerio_id : '';
        if (hint) {
          hint.textContent = match ? 'Ministerio selecionado: ' + match.ministerio_id : 'Selecione um ministerio valido pelo nome.';
        }
      };

      search.addEventListener('change', sync);
      search.addEventListener('input', sync);
    }

    async function getMinistries() {
      const now = Date.now();
      if (!ministryCache.loadedAt || now - ministryCache.loadedAt > 30000) {
        const json = await request('/api/ministerios');
        ministryCache.all = json.data || [];
        ministryCache.loadedAt = now;
      }
      return ministryCache.all;
    }

    async function filterEventsWithVacancy(events) {
      const inscriptions = await request('/api/eventos-inscricoes').catch(() => ({ data: [] }));
      const activeByEvent = (inscriptions.data || []).reduce((acc, item) => {
        if (item.status !== 'cancelado') acc[item.evento_id] = (acc[item.evento_id] || 0) + 1;
        return acc;
      }, {});
      return events.filter((event) => !event.numero_vagas || (activeByEvent[event.evento_id] || 0) < Number(event.numero_vagas));
    }

    function eventLabel(event) {
      const vacancies = event.numero_vagas ? ' - ' + event.numero_vagas + ' vagas' : '';
      return event.nome_evento + ' (' + String(event.data_evento || '').slice(0, 10) + ')' + vacancies;
    }

    async function loadRows() {
      setStatus('Carregando...');
      try {
        const json = await request('/api/' + current.name);
        renderTable(json.data || []);
        setStatus((json.data || []).length + ' registro(s).');
      } catch (error) {
        setStatus(error.message, true);
      }
    }

    function renderTable(rows) {
      const defaultKeys = [current.idField, ...current.fields.map((field) => field.name), 'created_at', 'updated_at'];
      const hiddenKeys = new Set(current.fields.filter((field) => field.uploadOnly || field.hidden).map((field) => field.name));
      const keys = [...new Set([...defaultKeys, ...rows.flatMap((row) => Object.keys(row))])].filter((key) => !hiddenKeys.has(key));
      const body = rows.length
        ? rows.map((row) => {
        return '<tr>' + keys.map((key) => '<td>' + renderCell(key, row[key]) + '</td>').join('') + '<td><div class="row-actions"><button type="button" data-edit="' + row[current.idField] + '">Editar</button><button class="danger" type="button" data-delete="' + row[current.idField] + '">Excluir</button></div></td></tr>';
      }).join('')
        : '<tr><td colspan="' + (keys.length + 1) + '">Nenhum registro encontrado.</td></tr>';

      table.innerHTML = '<thead><tr>' + keys.map((key) => '<th>' + key + '</th>').join('') + '<th>Acoes</th></tr></thead><tbody>' + body + '</tbody>';

      table.querySelectorAll('[data-edit]').forEach((button) => {
        button.addEventListener('click', () => editRow(button.dataset.edit));
      });
      table.querySelectorAll('[data-delete]').forEach((button) => {
        button.addEventListener('click', () => deleteRow(button.dataset.delete));
      });
    }

    function renderCell(key, value) {
      if ((key === 'url_capa' || key === 'url_imagem') && value) {
        return '<a href="' + escapeHtml(value) + '" target="_blank" rel="noreferrer"><img class="thumb" src="' + escapeHtml(value) + '" alt="Imagem"></a>';
      }
      if (key === 'imagens' && Array.isArray(value)) {
        return value.length
          ? '<div class="actions">' + value.map((image) => '<a href="' + escapeHtml(image.url_imagem || '') + '" target="_blank" rel="noreferrer"><img class="thumb" src="' + escapeHtml(image.url_imagem || '') + '" alt="Imagem"></a>').join('') + '</div>'
          : '';
      }
      if (key === 'fotos' && Array.isArray(value)) {
        return value.length
          ? '<div class="actions">' + value.map((image) => '<a href="' + escapeHtml(image.url_imagem || '') + '" target="_blank" rel="noreferrer"><img class="thumb" src="' + escapeHtml(image.url_imagem || '') + '" alt="Foto"></a>').join('') + '</div>'
          : '';
      }
      return escapeHtml(preview(value));
    }

    async function editRow(id) {
      try {
        const json = await request('/api/' + current.name + '/' + id);
        editing = id;
        renderForm(json.data || {});
        openModal();
        setStatus('Registro selecionado.');
      } catch (error) {
        setStatus(error.message, true);
      }
    }

    async function deleteRow(id) {
      if (!confirm('Excluir este registro?')) return;
      try {
        await request('/api/' + current.name + '/' + id, { method: 'DELETE' });
        editing = null;
        renderForm();
        closeModal();
        await loadRows();
      } catch (error) {
        setStatus(error.message, true);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {};
      for (const field of current.fields) {
        if (field.uploadOnly) continue;
        const input = form.elements[field.name];
        if (!input) continue;
        if (field.type === 'checkbox') {
          payload[field.name] = input.checked;
        } else if (input.value !== '') {
          payload[field.name] = input.value;
        }
      }

      try {
        if (current.name === 'eventos_imagens' && !editing && !form.elements.imagem_evento_file?.files?.length) {
          throw new Error('Envie ao menos uma imagem para o evento.');
        }

        if (current.name === 'fotos_ministerios' && !editing && !form.elements.foto_ministerio_file?.files?.[0]) {
          throw new Error('Envie uma foto para o ministerio.');
        }

        if (current.name === 'fotos_ministerios' && !editing && !payload.ministerio_id) {
          throw new Error('Selecione um ministerio valido.');
        }

        if (current.name === 'pessoas' && !editing && !form.elements.imagem_pessoa_file?.files?.[0]) {
          throw new Error('Envie uma imagem para a pessoa.');
        }

        if (current.name === 'fotos_ministerios' && !editing && form.elements.foto_ministerio_file?.files?.[0]) {
          const filePayload = await fileToPayload(form.elements.foto_ministerio_file.files[0]);
          await request('/api/ministerios/' + payload.ministerio_id + '/fotos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...filePayload,
              ordem: Number(payload.ordem || 0),
            }),
          });
          renderForm();
          closeModal();
          await loadRows();
          return;
        }

        if (current.name === 'eventos_imagens' && !editing && form.elements.imagem_evento_file?.files?.length) {
          const files = await Promise.all([...form.elements.imagem_evento_file.files].map(fileToPayload));
          await request('/api/eventos/' + payload.evento_id + '/imagens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: files.map((file, index) => ({
                ...file,
                ordem: Number(payload.ordem || 0) + index,
              })),
            }),
          });
          renderForm();
          closeModal();
          await loadRows();
          return;
        }

        let saved;
        if (current.name === 'pessoas' && !editing) {
          const filePayload = await fileToPayload(form.elements.imagem_pessoa_file.files[0]);
          saved = await request('/api/pessoas/com-imagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              imagem: filePayload,
            }),
          });
        } else {
          saved = await request('/api/' + current.name + (editing ? '/' + editing : ''), {
            method: editing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        const savedData = saved.data || {};

        if (current.name === 'eventos' && form.elements.capa_evento_file?.files?.[0]) {
          const id = savedData.evento_id || editing;
          const filePayload = await fileToPayload(form.elements.capa_evento_file.files[0]);
          await request('/api/eventos/' + id + '/capa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filePayload),
          });
        }

        if (current.name === 'eventos' && form.elements.imagens_evento_files?.files?.length) {
          const id = savedData.evento_id || editing;
          const files = await Promise.all([...form.elements.imagens_evento_files.files].map(fileToPayload));
          await request('/api/eventos/' + id + '/imagens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: files.map((file, index) => ({ ...file, ordem: index })),
            }),
          });
        }

        if (current.name === 'noticias' && form.elements.capa_noticia_file?.files?.[0]) {
          const id = savedData.noticia_id || editing;
          const filePayload = await fileToPayload(form.elements.capa_noticia_file.files[0]);
          await request('/api/noticias/' + id + '/capa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filePayload),
          });
        }

        if (current.name === 'ministerios' && form.elements.fotos_ministerio_files?.files?.length) {
          const id = savedData.ministerio_id || editing;
          const files = await Promise.all([...form.elements.fotos_ministerio_files.files].map(fileToPayload));
          await request('/api/ministerios/' + id + '/fotos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: files.map((file, index) => ({ ...file, ordem: index })),
            }),
          });
        }

        if (current.name === 'pessoas' && editing && form.elements.imagem_pessoa_file?.files?.[0]) {
          const id = savedData.pessoa_id || editing;
          const filePayload = await fileToPayload(form.elements.imagem_pessoa_file.files[0]);
          await request('/api/pessoas/' + id + '/imagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filePayload),
          });
        }

        editing = null;
        if (current.name === 'eventos') eventCache.loadedAt = 0;
        if (current.name === 'ministerios') ministryCache.loadedAt = 0;
        renderForm();
        closeModal();
        await loadRows();
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    function fileToPayload(file) {
      return new Promise((resolve, reject) => {
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!supportedTypes.includes(file.type)) {
          reject(new Error('Envie uma imagem PNG, JPEG, WebP ou GIF.'));
          return;
        }
        if (!file.size || file.size > 20 * 1024 * 1024) {
          reject(new Error('A imagem original deve ter no maximo 20 MB.'));
          return;
        }

        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (!image.width || !image.height) {
            reject(new Error('A imagem enviada nao possui dimensoes validas.'));
            return;
          }

          const maxDimension = 1920;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Nao foi possivel processar a imagem.'));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Nao foi possivel compactar a imagem.'));
              return;
            }

            const reader = new FileReader();
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagem';
            const outputType = blob.type === 'image/webp' ? 'image/webp' : 'image/png';
            const outputExtension = outputType === 'image/webp' ? 'webp' : 'png';
            reader.onload = () => resolve({
              fileName: baseName + '.' + outputExtension,
              contentType: outputType,
              base64: String(reader.result),
            });
            reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem compactada.'));
            reader.readAsDataURL(blob);
          }, 'image/webp', 0.8);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Nao foi possivel carregar a imagem.'));
        };
        image.src = objectUrl;
      });
    }

    function rawFileToPayload(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          base64: String(reader.result),
        });
        reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo.'));
        reader.readAsDataURL(file);
      });
    }

    function renderBibleSearchResults(json) {
      const container = document.querySelector('#bible-results');
      const books = Array.isArray(json.books)
        ? json.books
        : json.meta?.scope === 'books' && Array.isArray(json.data)
          ? json.data
          : [];
      const verses = json.meta?.scope === 'books' ? [] : Array.isArray(json.data) ? json.data : [];

      if (!books.length && !verses.length) {
        container.innerHTML = '';
        return;
      }

      const booksHtml = books.length ? \`
        <div class="result-block">
          <h3>Livros encontrados</h3>
          <div class="result-list">
            \${books.map((book) => \`
              <div class="result-item">
                <div class="result-title">\${escapeHtml(book.name || '')}</div>
                <div class="result-meta">ID \${escapeHtml(book.id || '')} · \${escapeHtml(book.abbrev || '')} · Testamento \${escapeHtml(book.testament || '')}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      \` : '';

      const versesHtml = verses.length ? \`
        <div class="result-block">
          <h3>Versiculos encontrados</h3>
          <div class="result-list">
            \${verses.map((verse) => \`
              <div class="result-item">
                <div class="result-title">\${escapeHtml(verse.book_name || verse.book || '')} \${escapeHtml(verse.chapter || '')}:\${escapeHtml(verse.verse || '')}</div>
                <div class="result-meta">\${escapeHtml(verse.version || '')} · \${escapeHtml(verse.book_abbrev || '')}</div>
                <div>\${escapeHtml(verse.text || '')}</div>
              </div>
            \`).join('')}
          </div>
        </div>
      \` : '';

      container.innerHTML = booksHtml + versesHtml;
    }

    function renderBibleResponse(endpoint, json) {
      if (endpoint.includes('search')) {
        renderBibleSearchResults(json);
      } else {
        document.querySelector('#bible-results').innerHTML = '';
      }

      document.querySelector('#bible-output').textContent = JSON.stringify(json, null, 2);
    }

    async function fetchBible() {
      const endpoint = document.querySelector('#bible-endpoint').value;
      const params = new URLSearchParams();
      const testament = document.querySelector('#bible-testament').value;
      const book = document.querySelector('#bible-book').value;
      const chapter = document.querySelector('#bible-chapter').value;
      const verse = document.querySelector('#bible-verse').value;
      const keyword = document.querySelector('#bible-keyword').value;
      const scope = document.querySelector('#bible-scope').value;

      if (endpoint.includes('books') && testament) params.set('testament_id', testament);
      if ((endpoint.includes('chapters') || endpoint.includes('verses') || endpoint.includes('search')) && book) params.set('book_id', book);
      if ((endpoint.includes('verses') || endpoint.includes('search')) && chapter) params.set('chapter_id', chapter);
      if (endpoint.includes('verses') && verse) params.set('verse', verse);
      if ((endpoint.includes('verses') || endpoint.includes('search')) && keyword) params.set('keyword', keyword);
      if (endpoint.includes('search')) params.set('scope', scope || 'all');

      const url = endpoint + (params.toString() ? '?' + params.toString() : '');
      try {
        const json = await request(url);
        renderBibleResponse(endpoint, json);
        setStatus(url);
      } catch (error) {
        document.querySelector('#bible-results').innerHTML = '';
        document.querySelector('#bible-output').textContent = JSON.stringify({ error: error.message }, null, 2);
        setStatus(error.message, true);
      }
    }

    async function request(url, options = {}) {
      const response = await fetch(url, options);
      const text = await response.text();
      const json = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(json.message || json.error || response.statusText);
      }
      return json;
    }

    function preview(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).length > 180 ? String(value).slice(0, 180) + '...' : String(value);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    reloadBtn.addEventListener('click', loadRows);
    newBtn.addEventListener('click', () => { editing = null; renderForm(); openModal(); });
    modalClose.addEventListener('click', closeModal);
    formModal.addEventListener('click', (event) => {
      if (event.target === formModal) closeModal();
    });
    document.querySelector('#bible-fetch').addEventListener('click', fetchBible);
    document.querySelector('#bible-endpoint').addEventListener('change', fetchBible);
    document.querySelector('#bible-scope').addEventListener('change', fetchBible);

    renderNav();
    renderForm();
    loadRows();
  </script>
</body>
</html>`;

