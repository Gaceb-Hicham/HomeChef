/**
 * Database types placeholder.
 * 
 * To generate real types, run:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
 * 
 * You need to be logged in: npx supabase login
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
