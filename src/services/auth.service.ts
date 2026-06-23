import { SupabaseClient } from '@supabase/supabase-js';
import { AuthServiceContract, AuthUser, GoogleLoginResult } from '../types/auth.types.js';
import { AppError } from '../utils/app-error.js';
import { signApiToken, verifyGoogleIdToken } from './google-token.service.js';

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

    const accessToken = await signApiToken(
      {
        sub: user.usuario_id,
        email: user.email_usuario,
        provider: 'google',
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
}
