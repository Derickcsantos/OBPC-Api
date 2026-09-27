import { SupabaseClient } from '@supabase/supabase-js';
import { AdminServiceContract, PaginationInput } from '../types/user-content.types.js';
import { AppError } from '../utils/app-error.js';

const publicColumns = 'usuario_id,nome_usuario,email_usuario,telefone_usuario,data_nascimento,avatar_url,auth_provider,role,created_at,updated_at';

export class AdminService implements AdminServiceContract {
  constructor(private readonly client: SupabaseClient) {}

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.client.from('usuarios').select('role').eq('usuario_id', userId).maybeSingle();
    if (error) throw new AppError(500, 'Erro ao validar permissao administrativa.', error);
    return data?.role === 'admin';
  }

  async listUsers({ page, limit }: PaginationInput): Promise<unknown> {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client.from('usuarios').select(publicColumns, { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, from + limit - 1);
    if (error) throw new AppError(500, 'Erro ao listar usuarios.', error);
    return { data: data ?? [], pagination: this.pagination(page, limit, count ?? 0) };
  }

  async getUser(id: string): Promise<unknown> {
    const { data, error } = await this.client.from('usuarios').select(publicColumns).eq('usuario_id', id).maybeSingle();
    if (error) throw new AppError(500, 'Erro ao consultar usuario.', error);
    if (!data) throw new AppError(404, 'Usuario nao encontrado.');
    return data;
  }

  async updateUserRole(actorId: string, id: string, role: 'user' | 'admin'): Promise<unknown> {
    if (actorId === id && role === 'user') {
      const { count, error } = await this.client.from('usuarios').select('usuario_id', { count: 'exact', head: true }).eq('role', 'admin');
      if (error) throw new AppError(500, 'Erro ao contar administradores.', error);
      if ((count ?? 0) <= 1) throw new AppError(409, 'Nao e permitido remover o ultimo administrador.');
    }
    const { data, error } = await this.client.from('usuarios').update({ role }).eq('usuario_id', id).select(publicColumns).maybeSingle();
    if (error) throw new AppError(500, 'Erro ao atualizar papel do usuario.', error);
    if (!data) throw new AppError(404, 'Usuario nao encontrado.');
    return data;
  }

  private pagination(page: number, limit: number, total: number) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
  }
}
