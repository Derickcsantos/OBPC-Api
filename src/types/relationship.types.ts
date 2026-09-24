import { SupabaseClient } from '@supabase/supabase-js';

export interface RelationshipServiceContract {
  markPrayerAsPrayed(userId: string, prayerId: string): Promise<Record<string, unknown>>;
  addMinistryInterest(userId: string, ministryId: string): Promise<Record<string, unknown>>;
  removeMinistryInterest(userId: string, ministryId: string): Promise<Record<string, unknown>>;
  listMinistryInterests(userId: string): Promise<Record<string, unknown>[]>;
  listMinistryInterestedUsers(ministryId: string): Promise<Record<string, unknown>[]>;
}

export type SupabaseRelationshipClient = SupabaseClient;