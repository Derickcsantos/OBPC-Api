export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthUser {
  usuario_id: string;
  nome_usuario: string;
  email_usuario: string;
  telefone_usuario?: string | null;
  data_nascimento?: string | null;
  avatar_url?: string | null;
  auth_provider?: string | null;
}

export interface GoogleLoginResult {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: AuthUser;
}

export interface AuthServiceContract {
  loginWithGoogle(idToken: string): Promise<GoogleLoginResult>;
}
