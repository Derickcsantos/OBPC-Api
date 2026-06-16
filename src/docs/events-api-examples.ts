export const eventsApiExamples = {
  overview: {
    resources: {
      eventos: 'Cadastro principal do evento. O GET ja retorna o array imagens com as imagens auxiliares.',
      eventos_imagens: 'Imagens auxiliares vinculadas ao evento.',
      eventos_inscricoes: 'Inscricoes dos participantes por evento.',
      uploads: 'Uploads de capa e imagens auxiliares para Supabase Storage.',
    },
    vacancy_rule: {
      field: 'eventos.numero_vagas',
      meaning: 'Quantidade de vagas disponiveis.',
      atomicity: 'A inscricao publica usa a RPC inscrever_evento no banco. Com o script de vagas atomicas aplicado, o banco reserva vaga de forma transacional e nao permite numero_vagas negativo.',
    },
  },
  'GET /api/eventos/examples': {
    method: 'GET',
    description: 'Retorna este JSON de exemplos das APIs de eventos.',
    response: {
      data: 'eventsApiExamples',
    },
  },
  'GET /api/eventos': {
    method: 'GET',
    description: 'Lista todos os eventos. Cada evento ja vem com imagens auxiliares em imagens.',
    query: {},
    response: {
      data: [
        {
          evento_id: '11111111-1111-4111-8111-111111111111',
          nome_evento: 'Conferencia de Jovens',
          descricao_evento: 'Encontro especial de jovens.',
          data_evento: '2026-07-20T22:00:00.000Z',
          link_evento: 'https://example.com/eventos/conferencia-jovens',
          url_capa: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/capa/arquivo.webp',
          numero_vagas: 120,
          endereco_evento: 'Rua Exemplo, 123 - Sao Paulo/SP',
          hora_inicio: '19:30:00',
          observacao_evento: 'Entrada permitida a partir das 19h.',
          responsavel_nome: 'Maria Silva',
          responsavel_telefone: '5511999999999',
          created_at: '2026-06-02T12:00:00.000Z',
          updated_at: '2026-06-02T12:00:00.000Z',
          imagens: [
            {
              imagem_id: '22222222-2222-4222-8222-222222222222',
              evento_id: '11111111-1111-4111-8111-111111111111',
              url_imagem: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/imagens/foto-1.webp',
              ordem: 0,
              created_at: '2026-06-02T12:01:00.000Z',
              updated_at: '2026-06-02T12:01:00.000Z',
            },
          ],
        },
      ],
    },
  },
  'GET /api/eventos/{evento_id}': {
    method: 'GET',
    description: 'Busca um evento pelo UUID. Tambem retorna imagens auxiliares.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    response: {
      data: {
        evento_id: '11111111-1111-4111-8111-111111111111',
        nome_evento: 'Conferencia de Jovens',
        descricao_evento: 'Encontro especial de jovens.',
        data_evento: '2026-07-20T22:00:00.000Z',
        link_evento: 'https://example.com/eventos/conferencia-jovens',
        url_capa: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/capa/arquivo.webp',
        numero_vagas: 120,
        endereco_evento: 'Rua Exemplo, 123 - Sao Paulo/SP',
        hora_inicio: '19:30:00',
        observacao_evento: 'Entrada permitida a partir das 19h.',
        responsavel_nome: 'Maria Silva',
        responsavel_telefone: '5511999999999',
        created_at: '2026-06-02T12:00:00.000Z',
        updated_at: '2026-06-02T12:00:00.000Z',
        imagens: [],
      },
    },
  },
  'POST /api/eventos': {
    method: 'POST',
    description: 'Cria um evento. A capa pode ser enviada depois por POST /api/eventos/{evento_id}/capa.',
    body: {
      nome_evento: 'Conferencia de Jovens',
      descricao_evento: 'Encontro especial de jovens.',
      data_evento: '2026-07-20T22:00:00.000Z',
      link_evento: 'https://example.com/eventos/conferencia-jovens',
      numero_vagas: 120,
      endereco_evento: 'Rua Exemplo, 123 - Sao Paulo/SP',
      hora_inicio: '19:30',
      observacao_evento: 'Entrada permitida a partir das 19h.',
      responsavel_nome: 'Maria Silva',
      responsavel_telefone: '5511999999999',
    },
    response: {
      message: 'eventos criado com sucesso',
      data: {
        evento_id: '11111111-1111-4111-8111-111111111111',
        nome_evento: 'Conferencia de Jovens',
        descricao_evento: 'Encontro especial de jovens.',
        data_evento: '2026-07-20T22:00:00.000Z',
        link_evento: 'https://example.com/eventos/conferencia-jovens',
        url_capa: null,
        numero_vagas: 120,
        endereco_evento: 'Rua Exemplo, 123 - Sao Paulo/SP',
        hora_inicio: '19:30:00',
        observacao_evento: 'Entrada permitida a partir das 19h.',
        responsavel_nome: 'Maria Silva',
        responsavel_telefone: '5511999999999',
        created_at: '2026-06-02T12:00:00.000Z',
        updated_at: '2026-06-02T12:00:00.000Z',
      },
    },
  },
  'PUT /api/eventos/{evento_id}': {
    method: 'PUT',
    description: 'Atualiza parcialmente um evento. Envie apenas os campos que deseja alterar.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    body: {
      nome_evento: 'Conferencia de Jovens 2026',
      numero_vagas: 80,
      observacao_evento: 'Levar documento com foto.',
    },
    response: {
      message: 'eventos atualizado com sucesso',
      data: {
        evento_id: '11111111-1111-4111-8111-111111111111',
        nome_evento: 'Conferencia de Jovens 2026',
        numero_vagas: 80,
        observacao_evento: 'Levar documento com foto.',
        updated_at: '2026-06-02T12:30:00.000Z',
      },
    },
  },
  'DELETE /api/eventos/{evento_id}': {
    method: 'DELETE',
    description: 'Remove um evento pelo UUID. Imagens e inscricoes relacionadas dependem das regras de cascade do banco.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    response: {
      message: 'eventos removido com sucesso',
      data: {
        evento_id: '11111111-1111-4111-8111-111111111111',
      },
    },
  },
  'POST /api/eventos/{evento_id}/inscricoes': {
    method: 'POST',
    description: 'Inscricao publica em um evento. Nao envie evento_id nem status no body; o evento vem pela URL. A reserva de vaga deve ocorrer atomicamente no banco pela RPC inscrever_evento.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    body: {
      nome: 'Joao Pereira',
      email: 'joao@example.com',
      telefone: '5511988887777',
    },
    success_response: {
      statusCode: 201,
      data: {
        inscricao_id: 123,
        evento_id: '11111111-1111-4111-8111-111111111111',
        nome: 'Joao Pereira',
        email: 'joao@example.com',
        telefone: '5511988887777',
        status: 'inscrito',
        created_at: '2026-06-02T12:45:00.000Z',
        updated_at: '2026-06-02T12:45:00.000Z',
      },
    },
    conflict_response_when_full: {
      statusCode: 409,
      message: 'Evento lotado',
    },
    validation_rules: {
      nome: 'obrigatorio, texto nao vazio',
      email: 'obrigatorio, email valido',
      telefone: 'obrigatorio, minimo 8 e maximo 20 caracteres',
    },
  },
  'GET /api/eventos-inscricoes': {
    method: 'GET',
    description: 'Lista inscricoes de eventos.',
    response: {
      data: [
        {
          inscricao_id: 123,
          evento_id: '11111111-1111-4111-8111-111111111111',
          nome: 'Joao Pereira',
          email: 'joao@example.com',
          telefone: '5511988887777',
          status: 'inscrito',
          created_at: '2026-06-02T12:45:00.000Z',
          updated_at: '2026-06-02T12:45:00.000Z',
        },
      ],
    },
  },
  'POST /api/eventos-inscricoes': {
    method: 'POST',
    description: 'Cria uma inscricao via CRUD administrativo. Para fluxo publico, prefira POST /api/eventos/{evento_id}/inscricoes.',
    body: {
      evento_id: '11111111-1111-4111-8111-111111111111',
      nome: 'Joao Pereira',
      email: 'joao@example.com',
      telefone: '5511988887777',
      status: 'inscrito',
    },
    response: {
      message: 'eventos_inscricoes criado com sucesso',
      data: {
        inscricao_id: 123,
        evento_id: '11111111-1111-4111-8111-111111111111',
        nome: 'Joao Pereira',
        email: 'joao@example.com',
        telefone: '5511988887777',
        status: 'inscrito',
      },
    },
  },
  'PUT /api/eventos-inscricoes/{inscricao_id}': {
    method: 'PUT',
    description: 'Atualiza uma inscricao. Use status cancelado para cancelar.',
    params: {
      inscricao_id: 123,
    },
    body: {
      status: 'cancelado',
    },
    response: {
      message: 'eventos_inscricoes atualizado com sucesso',
      data: {
        inscricao_id: 123,
        status: 'cancelado',
        updated_at: '2026-06-02T13:00:00.000Z',
      },
    },
  },
  'DELETE /api/eventos-inscricoes/{inscricao_id}': {
    method: 'DELETE',
    description: 'Remove uma inscricao.',
    params: {
      inscricao_id: 123,
    },
    response: {
      message: 'eventos_inscricoes removido com sucesso',
      data: {
        inscricao_id: 123,
      },
    },
  },
  'POST /api/eventos/{evento_id}/capa': {
    method: 'POST',
    description: 'Envia a capa do evento para Supabase Storage e atualiza eventos.url_capa.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    body: {
      fileName: 'capa.webp',
      contentType: 'image/webp',
      base64: 'data:image/webp;base64,UklGR...',
    },
    response: {
      data: {
        upload: {
          key: 'eventos/11111111-1111-4111-8111-111111111111/capa/uuid-capa.webp',
          url: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/capa/uuid-capa.webp',
        },
        evento: {
          evento_id: '11111111-1111-4111-8111-111111111111',
          url_capa: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/capa/uuid-capa.webp',
        },
      },
    },
  },
  'POST /api/eventos/{evento_id}/imagens': {
    method: 'POST',
    description: 'Envia uma ou varias imagens auxiliares do evento para Supabase Storage e cria registros em eventos_imagens.',
    params: {
      evento_id: '11111111-1111-4111-8111-111111111111',
    },
    body_single_file: {
      fileName: 'foto-1.webp',
      contentType: 'image/webp',
      base64: 'data:image/webp;base64,UklGR...',
      ordem: 0,
    },
    body_multiple_files: {
      files: [
        {
          fileName: 'foto-1.webp',
          contentType: 'image/webp',
          base64: 'data:image/webp;base64,UklGR...',
          ordem: 0,
        },
        {
          fileName: 'foto-2.webp',
          contentType: 'image/webp',
          base64: 'data:image/webp;base64,UklGR...',
          ordem: 1,
        },
      ],
    },
    response: {
      data: [
        {
          imagem_id: '22222222-2222-4222-8222-222222222222',
          evento_id: '11111111-1111-4111-8111-111111111111',
          url_imagem: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/imagens/uuid-foto-1.webp',
          ordem: 0,
          created_at: '2026-06-02T12:55:00.000Z',
          updated_at: '2026-06-02T12:55:00.000Z',
        },
      ],
    },
  },
  'GET /api/eventos-imagens': {
    method: 'GET',
    description: 'Lista imagens auxiliares cadastradas para eventos.',
    response: {
      data: [
        {
          imagem_id: '22222222-2222-4222-8222-222222222222',
          evento_id: '11111111-1111-4111-8111-111111111111',
          url_imagem: 'https://projeto.supabase.co/storage/v1/object/public/imagens/eventos/11111111-1111-4111-8111-111111111111/imagens/uuid-foto-1.webp',
          ordem: 0,
          created_at: '2026-06-02T12:55:00.000Z',
          updated_at: '2026-06-02T12:55:00.000Z',
        },
      ],
    },
  },
};
