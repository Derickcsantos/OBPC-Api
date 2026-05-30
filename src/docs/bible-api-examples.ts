export const bibleApiExamples = {
  cache: {
    provider: 'Redis TCP via REDIS_URL',
    ttl_seconds_env: 'REDIS_CACHE_TTL_SECONDS',
    default_ttl_seconds: 604800,
    cached_routes: [
      'GET /api/biblia/testaments',
      'GET /api/biblia/versions',
      'GET /api/biblia/books',
      'GET /api/biblia/chapters',
      'GET /api/biblia/verses sem keyword/q/text',
      'GET /api/biblia/books/:book_id/verses sem keyword/q/text',
    ],
    uncached_routes: [
      'GET /api/biblia/search',
      'GET /api/biblia/verses?keyword=...',
      'GET /api/biblia/verses?q=...',
      'GET /api/biblia/verses?text=...',
    ],
  },
  '/api/biblia/testaments': {
    method: 'GET',
    cached: true,
    response: {
      data: [
        {
          idx: 0,
          id: 1,
          name: 'Antigo Testamento',
        },
        {
          idx: 1,
          id: 2,
          name: 'Novo Testamento',
        },
      ],
    },
  },
  '/api/biblia/versions': {
    method: 'GET',
    cached: true,
    response: {
      data: [
        {
          id: 'nvi',
          name: 'NVI',
        },
      ],
    },
  },
  '/api/biblia/books': {
    method: 'GET',
    cached: true,
    response: {
      data: [
        {
          idx: 0,
          id: 1,
          name: 'Gênesis',
          abbrev: 'gn',
          testament: 1,
        },
        {
          idx: 1,
          id: 2,
          name: 'Êxodo',
          abbrev: 'ex',
          testament: 1,
        },
      ],
    },
  },
  '/api/biblia/books?testament_id=1': {
    method: 'GET',
    cached: true,
    query: {
      testament_id: 1,
    },
    response: {
      data: [
        {
          idx: 0,
          id: 1,
          name: 'Gênesis',
          abbrev: 'gn',
          testament: 1,
        },
        {
          idx: 1,
          id: 2,
          name: 'Êxodo',
          abbrev: 'ex',
          testament: 1,
        },
      ],
    },
  },
  '/api/biblia/chapters?book_id=1&page=1&limit=100': {
    method: 'GET',
    cached: true,
    query: {
      version: 'nvi',
      book_id: 1,
      page: 1,
      limit: 100,
    },
    response: {
      data: [
        {
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
        },
        {
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 2,
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 50,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  },
  '/api/biblia/books/1/verses?page=1&limit=100': {
    method: 'GET',
    cached: true,
    params: {
      book_id: 1,
    },
    query: {
      version: 'nvi',
      page: 1,
      limit: 100,
    },
    response: {
      data: [
        {
          idx: 0,
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
        {
          idx: 1,
          id: 31064,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 2,
          text: 'Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas.',
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1533,
        totalPages: 16,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    },
  },
  '/api/biblia/verses?book_id=1&chapter_id=1&page=1&limit=100': {
    method: 'GET',
    cached: true,
    query: {
      version: 'nvi',
      book_id: 1,
      chapter_id: 1,
      page: 1,
      limit: 100,
    },
    response: {
      data: [
        {
          idx: 0,
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
        {
          idx: 1,
          id: 31064,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 2,
          text: 'Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas.',
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 31,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  },
  '/api/biblia/verses?book_id=1&chapter_id=1&verse=1': {
    method: 'GET',
    cached: true,
    query: {
      version: 'nvi',
      book_id: 1,
      chapter_id: 1,
      verse: 1,
    },
    response: {
      data: [
        {
          idx: 0,
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  },
  '/api/biblia/verses?keyword=graça': {
    method: 'GET',
    cached: false,
    query: {
      version: 'nvi',
      keyword: 'graça',
      page: 1,
      limit: 100,
    },
    response: {
      data: [
        {
          id: 62124,
          version: 'nvi',
          testament: 2,
          book: 66,
          chapter: 22,
          verse: 21,
          text: 'A graça do Senhor Jesus seja com todos. Amém.',
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  },
  '/api/biblia/search?keyword=graça': {
    method: 'GET',
    cached: false,
    query: {
      version: 'nvi',
      keyword: 'graça',
      page: 1,
      limit: 100,
    },
    response: {
      data: [
        {
          id: 62124,
          version: 'nvi',
          testament: 2,
          book: 66,
          chapter: 22,
          verse: 21,
          text: 'A graça do Senhor Jesus seja com todos. Amém.',
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    },
  },
};
