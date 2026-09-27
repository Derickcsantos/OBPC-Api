export interface PaginationInput { page: number; limit: number }
export interface VerseSelection { version: string; book: number; chapter: number; verse: number }
export interface AnnotationInput { titulo?: string | null; conteudo: string; versiculos: VerseSelection[] }
export interface HighlightInput extends VerseSelection { estilo: 'background' | 'underline'; cor: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' }

export interface UserContentServiceContract {
  listPublicPrayers(userId: string | undefined, pagination: PaginationInput): Promise<unknown>;
  listMyPrayers(userId: string, pagination: PaginationInput): Promise<unknown>;
  listUserPrayerStatus(userId: string, viewerId: string, pagination: PaginationInput): Promise<unknown>;
  listAdminPrayers(viewerId: string, pagination: PaginationInput): Promise<unknown>;
  listAnnotations(userId: string, pagination: PaginationInput): Promise<unknown>;
  getAnnotation(userId: string, id: string): Promise<unknown>;
  createAnnotation(userId: string, input: AnnotationInput): Promise<unknown>;
  updateAnnotation(userId: string, id: string, input: AnnotationInput): Promise<unknown>;
  deleteAnnotation(userId: string, id: string): Promise<unknown>;
  listHighlights(userId: string, filters: Record<string, string>, pagination: PaginationInput): Promise<unknown>;
  upsertHighlight(userId: string, input: HighlightInput): Promise<unknown>;
  deleteHighlight(userId: string, id: string): Promise<unknown>;
}

export interface AdminServiceContract {
  isAdmin(userId: string): Promise<boolean>;
  listUsers(pagination: PaginationInput): Promise<unknown>;
  getUser(id: string): Promise<unknown>;
  updateUserRole(actorId: string, id: string, role: 'user' | 'admin'): Promise<unknown>;
}
