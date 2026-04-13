import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { CrudController } from '../controllers/crud.controller.js';
import { createUsuarioSchema, updateUsuarioSchema } from '../dtos/usuarios.dto.js';
import { CrudServiceContract, EntityRecord } from '../types/crud.types.js';
import { registerCrudRoutes } from './crud-route.factory.js';

const hidePassword = (payload: EntityRecord): EntityRecord => {
  const { senha_usuario, ...rest } = payload;
  void senha_usuario;
  return rest;
};

export const usuariosRoutes = (app: FastifyInstance, service: CrudServiceContract): void => {
  const controller = new CrudController(service, {
    resource: 'usuarios',
    idField: 'usuario_id',
    createSchema: createUsuarioSchema,
    updateSchema: updateUsuarioSchema,
    transformCreate: async (payload) => ({
      ...payload,
      senha_usuario: await bcrypt.hash(String(payload.senha_usuario), 10),
    }),
    transformUpdate: async (payload) => {
      if (!payload.senha_usuario) {
        return payload;
      }

      return {
        ...payload,
        senha_usuario: await bcrypt.hash(String(payload.senha_usuario), 10),
      };
    },
    sanitizeOutput: hidePassword,
  });

  registerCrudRoutes(app, '/usuarios', controller);
};
