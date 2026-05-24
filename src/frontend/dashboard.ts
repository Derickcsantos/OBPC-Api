const apiResources = [
  {
    name: 'ministerios',
    label: 'Ministerios',
    idField: 'ministerio_id',
    fields: [
      { name: 'nome_ministerio', label: 'Nome', type: 'text', required: true },
      { name: 'descricao_ministerio', label: 'Descricao', type: 'textarea', required: true },
      { name: 'url_ministerio', label: 'URL', type: 'url', required: true },
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
      --accent-2: #b42318;
      --focus: #2563eb;
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
      display: grid;
      grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }

    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
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

    .table-wrap {
      overflow: auto;
      max-height: calc(100vh - 168px);
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
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 10px;
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
            <span id="form-title" class="section-title">Cadastro</span>
          </div>
          <form id="form"></form>
        </section>
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
            </div>
            <label>Texto <input id="bible-keyword" type="search"></label>
            <div class="actions">
              <button id="bible-fetch" type="button" class="primary">Buscar</button>
            </div>
          </div>
          <pre id="bible-output">{}</pre>
        </section>
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
    const table = document.querySelector('#table');
    const crudView = document.querySelector('#crud-view');
    const bibleView = document.querySelector('#bible-view');
    const reloadBtn = document.querySelector('#reload');
    const newBtn = document.querySelector('#new-record');

    function setStatus(message, isError = false) {
      statusEl.textContent = message || '';
      statusEl.style.color = isError ? '#b42318' : '#64707d';
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
      if (field.type === 'textarea') {
        return '<textarea name="' + field.name + '" ' + (field.required ? 'required' : '') + '>' + escapeHtml(value || '') + '</textarea>';
      }

      if (field.type === 'select') {
        return '<select name="' + field.name + '">' + field.options.map((option) => '<option value="' + option + '"' + (value === option ? ' selected' : '') + '>' + option + '</option>').join('') + '</select>';
      }

      if (field.type === 'checkbox') {
        return '<label class="check-row"><input name="' + field.name + '" type="checkbox" ' + (value === true || value === undefined ? 'checked' : '') + '> ' + field.label + '</label>';
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
        if (field.type === 'checkbox') return fieldInput(field, row[field.name]);
        return '<label>' + field.label + fieldInput(field, row[field.name]) + '</label>';
      }).join('') + '<div class="actions"><button type="submit" class="primary">' + (editing ? 'Salvar' : 'Criar') + '</button><button type="button" id="cancel-edit">Limpar</button></div>';
      document.querySelector('#cancel-edit').addEventListener('click', () => {
        editing = null;
        renderForm();
      });
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
      const keys = [...new Set([...defaultKeys, ...rows.flatMap((row) => Object.keys(row))])];
      const body = rows.length
        ? rows.map((row) => {
        return '<tr>' + keys.map((key) => '<td>' + escapeHtml(preview(row[key])) + '</td>').join('') + '<td><div class="row-actions"><button type="button" data-edit="' + row[current.idField] + '">Editar</button><button class="danger" type="button" data-delete="' + row[current.idField] + '">Excluir</button></div></td></tr>';
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

    async function editRow(id) {
      try {
        const json = await request('/api/' + current.name + '/' + id);
        editing = id;
        renderForm(json.data || {});
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
        await loadRows();
      } catch (error) {
        setStatus(error.message, true);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {};
      for (const field of current.fields) {
        const input = form.elements[field.name];
        if (!input) continue;
        if (field.type === 'checkbox') {
          payload[field.name] = input.checked;
        } else if (input.value !== '' || !editing) {
          payload[field.name] = input.value;
        }
      }

      try {
        await request('/api/' + current.name + (editing ? '/' + editing : ''), {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        editing = null;
        renderForm();
        await loadRows();
      } catch (error) {
        setStatus(error.message, true);
      }
    });

    async function fetchBible() {
      const endpoint = document.querySelector('#bible-endpoint').value;
      const params = new URLSearchParams();
      const testament = document.querySelector('#bible-testament').value;
      const book = document.querySelector('#bible-book').value;
      const chapter = document.querySelector('#bible-chapter').value;
      const verse = document.querySelector('#bible-verse').value;
      const keyword = document.querySelector('#bible-keyword').value;

      if (endpoint.includes('books') && testament) params.set('testament_id', testament);
      if ((endpoint.includes('chapters') || endpoint.includes('verses') || endpoint.includes('search')) && book) params.set('book_id', book);
      if ((endpoint.includes('verses') || endpoint.includes('search')) && chapter) params.set('chapter_id', chapter);
      if (endpoint.includes('verses') && verse) params.set('verse', verse);
      if ((endpoint.includes('verses') || endpoint.includes('search')) && keyword) params.set('keyword', keyword);

      const url = endpoint + (params.toString() ? '?' + params.toString() : '');
      try {
        const json = await request(url);
        document.querySelector('#bible-output').textContent = JSON.stringify(json, null, 2);
        setStatus(url);
      } catch (error) {
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
    newBtn.addEventListener('click', () => { editing = null; renderForm(); });
    document.querySelector('#bible-fetch').addEventListener('click', fetchBible);
    document.querySelector('#bible-endpoint').addEventListener('change', fetchBible);

    renderNav();
    renderForm();
    loadRows();
  </script>
</body>
</html>`;
