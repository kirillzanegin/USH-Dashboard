/**
 * Database types matching the exact schema.
 * Tables: users, spins, prizes
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          telegram_id: number | null;
          first_name: string | null;
          last_name: string | null;
          username: string | null;
          phone: string | null;
          invited_by: number | null;
          created_at: string;
          coins: number | null;
          admin: boolean | null;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      spins: {
        Row: {
          id: number;
          user_id: number;
          prize_id: number;
          created_at: string;
          meta: unknown | null;
          promo_code: string | null;
          valid_until: string | null;
          is_active: boolean | null;
          used_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['spins']['Row']>;
        Update: Partial<Database['public']['Tables']['spins']['Row']>;
      };
      prizes: {
        Row: {
          id: number;
          name: string | null;
          description: string | null;
          weight: number | null;
          stock: number | null;
          promo_code: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['prizes']['Row']>;
        Update: Partial<Database['public']['Tables']['prizes']['Row']>;
      };
    };
  };
}

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbSpin = Database['public']['Tables']['spins']['Row'];
export type DbPrize = Database['public']['Tables']['prizes']['Row'];
