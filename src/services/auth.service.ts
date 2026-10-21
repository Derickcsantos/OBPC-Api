import { SupabaseClient } from '@supabase/supabase-js';
import { AuthServiceContract, AuthUser, DeletionSession, GoogleLoginResult } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';
import { signApiToken, verifyGoogleIdToken } from './google-token.service.js';
import { verifyAppleIdToken } from './apple-token.service.js';

interface AuthServiceConfig {
  googleClientIds: string[];
  jwtSecret: string;
  jwtExpiresIn: number;
  issuer: string;
}

const userColumns = [
  'usuario_id',
  'nome_usuario',
  'email_usuario',
  'telefone_usuario',
  'data_nascimento',
  'avatar_url',
  'auth_provider',
  'role',
].join(',');

export class AuthService implements AuthServiceContract {
  constructor(
    private readonly client: SupabaseClient,
    private readonly config: AuthServiceConfig,
  ) {}

  async loginWithGoogle(idToken: string): Promise<GoogleLoginResult> {
    const identity = await verifyGoogleIdToken(idToken, this.config.googleClientIds);

    const byGoogleSub = await this.client
      .from('usuarios')
      .select(userColumns)
      .eq('google_sub', identity.sub)
      .maybeSingle();
    if (byGoogleSub.error) {
      throw new AppError(500, 'Erro ao consultar usuario.', byGoogleSub.error);
    }

    let user = byGoogleSub.data as AuthUser | null;
    if (!user) {
      const byEmail = await this.client
        .from('usuarios')
        .select(userColumns)
        .eq('email_usuario', identity.email)
        .maybeSingle();
      if (byEmail.error) {
        throw new AppError(500, 'Erro ao consultar usuario.', byEmail.error);
      }

      const existingByEmail = byEmail.data as unknown as AuthUser | null;
      if (existingByEmail) {
        const linked = await this.client
          .from('usuarios')
          .update({
            google_sub: identity.sub,
            avatar_url: identity.picture ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('usuario_id', existingByEmail.usuario_id)
          .select(userColumns)
          .single();
        if (linked.error) {
          throw new AppError(500, 'Erro ao vincular conta Google.', linked.error);
        }
        user = linked.data as unknown as AuthUser;
      } else {
        const created = await this.client
          .from('usuarios')
          .insert({
            nome_usuario: identity.name,
            email_usuario: identity.email,
            google_sub: identity.sub,
            avatar_url: identity.picture ?? null,
            auth_provider: 'google',
          })
          .select(userColumns)
          .single();
        if (created.error) {
          throw new AppError(500, 'Erro ao criar usuario com Google.', created.error);
        }
        user = created.data as unknown as AuthUser;
      }
    }

    user = {
      ...user,
      role: user.role === 'admin' ? 'admin' : 'user',
    };

    const accessToken = await signApiToken(
      {
        sub: user.usuario_id,
        email: user.email_usuario,
        provider: 'google',
        role: user.role,
      },
      this.config.jwtSecret,
      this.config.jwtExpiresIn,
      this.config.issuer,
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.config.jwtExpiresIn,
      user,
    };
  }

  async loginWithApple(idToken: string, nonce: string): Promise<GoogleLoginResult> {
    const identity = await verifyAppleIdToken(idToken, nonce, ['com.obpcapp']);
    let lookup = await this.client.from('usuarios').select(userColumns).eq('apple_sub', identity.sub).maybeSingle();
    if (lookup.error) throw new AppError(500, 'Erro ao consultar usuario.', lookup.error);
    let user = lookup.data as AuthUser | null;
    if (!user) {
      const byEmail = await this.client.from('usuarios').select(userColumns).eq('email_usuario', identity.email).maybeSingle();
      if (byEmail.error) throw new AppError(500, 'Erro ao consultar usuario.', byEmail.error);
      if (byEmail.data) {
        const linked = await this.client.from('usuarios').update({ apple_sub: identity.sub, updated_at: new Date().toISOString() }).eq('usuario_id', (byEmail.data as unknown as AuthUser).usuario_id).select(userColumns).single();
        if (linked.error) throw new AppError(500, 'Erro ao vincular conta Apple.', linked.error);
        user = linked.data as unknown as AuthUser;
      } else {
        const created = await this.client.from('usuarios').insert({ nome_usuario: identity.name, email_usuario: identity.email, apple_sub: identity.sub, auth_provider: 'apple' }).select(userColumns).single();
        if (created.error) throw new AppError(500, 'Erro ao criar usuario com Apple.', created.error);
        user = created.data as unknown as AuthUser;
      }
    }
    user = { ...user!, role: user!.role === 'admin' ? 'admin' : 'user' };
    const accessToken = await signApiToken({ sub: user.usuario_id, email: user.email_usuario, provider: 'apple', role: user.role }, this.config.jwtSecret, this.config.jwtExpiresIn, this.config.issuer);
    return { access_token: accessToken, token_type: 'Bearer', expires_in: this.config.jwtExpiresIn, user };
  }

  async createDeletionSession(idToken: string): Promise<DeletionSession> {
    const identity = await verifyGoogleIdToken(idToken, this.config.googleClientIds);
    let result = await this.client.from('usuarios').select(userColumns).eq('google_sub', identity.sub).maybeSingle();
    if (result.error) throw new AppError(500, 'Erro ao verificar a conta.', result.error);
    if (!result.data) {
      result = await this.client.from('usuarios').select(userColumns).eq('email_usuario', identity.email).maybeSingle();
      if (result.error) throw new AppError(500, 'Erro ao verificar a conta.', result.error);
    }
    if (!result.data) throw new AppError(404, 'Nenhuma conta do OBPC foi encontrada para esta identidade Google.');

    const user = result.data as unknown as AuthUser;
    const accessToken = await signApiToken(
      { sub: user.usuario_id, email: user.email_usuario, provider: 'google', role: user.role === 'admin' ? 'admin' : 'user' },
      this.config.jwtSecret,
      this.config.jwtExpiresIn,
      this.config.issuer,
    );
    return { access_token: accessToken, token_type: 'Bearer', expires_in: this.config.jwtExpiresIn };
  }

  async deleteAccount(userId: string): Promise<void> {
    const { data: account, error: lookupError } = await this.client.from('usuarios').select('email_usuario').eq('usuario_id', userId).maybeSingle();
    if (lookupError) throw new AppError(500, 'Não foi possível consultar a conta.', lookupError);
    if (!account) throw new AppError(404, 'Conta não encontrada.');
    const { error } = await this.client.rpc('delete_obpc_account', { p_user_id: userId, p_email: account.email_usuario });
    if (error) throw new AppError(500, 'Não foi possível excluir a conta.', error);
  }
}
