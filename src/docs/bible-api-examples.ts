export const bibleApiExamples = {
  '/api/biblia/books': {
    method: 'GET',
    description: 'Lista todos os livros da Biblia.',
    response: {
      data: [
        {
          id: 1,
          name: 'Gênesis',
          abbrev: 'gn',
          testament: 1,
        },
        {
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
    description: 'Lista livros filtrando pelo testamento.',
    query: {
      testament_id: 1,
    },
    response: {
      data: [
        {
          id: 1,
          name: 'Gênesis',
          abbrev: 'gn',
          testament: 1,
        },
        {
          id: 2,
          name: 'Êxodo',
          abbrev: 'ex',
          testament: 1,
        },
      ],
    },
  },
  '/api/biblia/chapters?book_id=1': {
    method: 'GET',
    description: 'Lista capitulos existentes para um livro.',
    query: {
      book_id: 1,
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
    },
  },
  '/api/biblia/books/1/verses': {
    method: 'GET',
    description: 'Lista todos os versos de um livro, em todos os capitulos.',
    params: {
      book_id: 1,
    },
    query: {
      version: 'nvi',
    },
    response: {
      data: [
        {
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
        {
          id: 31064,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 2,
          text: 'Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas.',
        },
      ],
    },
  },
  '/api/biblia/verses?book_id=1&chapter_id=1': {
    method: 'GET',
    description: 'Lista todos os versos de um capitulo.',
    query: {
      book_id: 1,
      chapter_id: 1,
    },
    response: {
      data: [
        {
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
        {
          id: 31064,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 2,
          text: 'Era a terra sem forma e vazia; trevas cobriam a face do abismo, e o Espírito de Deus se movia sobre a face das águas.',
        },
      ],
    },
  },
  '/api/biblia/verses?book_id=1&chapter_id=1&verse=1': {
    method: 'GET',
    description: 'Busca um verso especifico.',
    query: {
      book_id: 1,
      chapter_id: 1,
      verse: 1,
    },
    response: {
      data: [
        {
          id: 31063,
          version: 'nvi',
          testament: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          text: 'No princípio Deus criou os céus e a terra.',
        },
      ],
    },
  },
  '/api/biblia/verses?keyword=graça': {
    method: 'GET',
    description: 'Busca versos por texto usando a rota de versos.',
    query: {
      keyword: 'graça',
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
    },
  },
  '/api/biblia/search?keyword=graça': {
    method: 'GET',
    description: 'Busca versos por texto usando a rota de pesquisa.',
    query: {
      keyword: 'graça',
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
    },
  },
};
