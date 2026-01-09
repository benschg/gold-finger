export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      account_invitations: {
        Row: {
          account_id: string;
          created_at: string | null;
          expires_at: string | null;
          id: string;
          invitee_email: string;
          inviter_id: string;
          status: string | null;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          invitee_email: string;
          inviter_id: string;
          status?: string | null;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          invitee_email?: string;
          inviter_id?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "account_invitations_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_invitations_inviter_id_fkey";
            columns: ["inviter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      account_members: {
        Row: {
          account_id: string;
          id: string;
          joined_at: string | null;
          role: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          id?: string;
          joined_at?: string | null;
          role?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          id?: string;
          joined_at?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          color: string | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          account_id: string;
          color: string;
          created_at: string | null;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          account_id: string;
          color?: string;
          created_at?: string | null;
          icon: string;
          id?: string;
          name: string;
        };
        Update: {
          account_id?: string;
          color?: string;
          created_at?: string | null;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      currencies: {
        Row: {
          code: string;
          exchange_rate: number | null;
          name: string;
          symbol: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          exchange_rate?: number | null;
          name: string;
          symbol: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          exchange_rate?: number | null;
          name?: string;
          symbol?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      expense_tags: {
        Row: {
          expense_id: string;
          tag_id: string;
        };
        Insert: {
          expense_id: string;
          tag_id: string;
        };
        Update: {
          expense_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_tags_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          account_currency: string | null;
          account_id: string;
          amount: number;
          category_id: string | null;
          converted_amount: number | null;
          created_at: string | null;
          currency: string;
          date: string;
          description: string | null;
          exchange_rate: number | null;
          id: string;
          rate_date: string | null;
          receipt_analysis: Json | null;
          receipt_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          account_currency?: string | null;
          account_id: string;
          amount: number;
          category_id?: string | null;
          converted_amount?: number | null;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          rate_date?: string | null;
          receipt_analysis?: Json | null;
          receipt_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          account_currency?: string | null;
          account_id?: string;
          amount?: number;
          category_id?: string | null;
          converted_amount?: number | null;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          rate_date?: string | null;
          receipt_analysis?: Json | null;
          receipt_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_account_currency_fkey";
            columns: ["account_currency"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "expenses_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_currency_fkey";
            columns: ["currency"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      income_categories: {
        Row: {
          account_id: string;
          color: string;
          created_at: string | null;
          icon: string;
          id: string;
          name: string;
        };
        Insert: {
          account_id: string;
          color?: string;
          created_at?: string | null;
          icon: string;
          id?: string;
          name: string;
        };
        Update: {
          account_id?: string;
          color?: string;
          created_at?: string | null;
          icon?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "income_categories_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      incomes: {
        Row: {
          account_currency: string | null;
          account_id: string;
          amount: number;
          converted_amount: number | null;
          created_at: string | null;
          currency: string;
          date: string;
          description: string | null;
          exchange_rate: number | null;
          id: string;
          income_category_id: string | null;
          rate_date: string | null;
          receipt_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          account_currency?: string | null;
          account_id: string;
          amount: number;
          converted_amount?: number | null;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          income_category_id?: string | null;
          rate_date?: string | null;
          receipt_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          account_currency?: string | null;
          account_id?: string;
          amount?: number;
          converted_amount?: number | null;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          exchange_rate?: number | null;
          id?: string;
          income_category_id?: string | null;
          rate_date?: string | null;
          receipt_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "incomes_account_currency_fkey";
            columns: ["account_currency"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "incomes_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incomes_currency_fkey";
            columns: ["currency"];
            isOneToOne: false;
            referencedRelation: "currencies";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "incomes_income_category_id_fkey";
            columns: ["income_category_id"];
            isOneToOne: false;
            referencedRelation: "income_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incomes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          id: string;
          preferred_currency: string | null;
          theme: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          id: string;
          preferred_currency?: string | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          id?: string;
          preferred_currency?: string | null;
          theme?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          account_id: string;
          color: string | null;
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          account_id: string;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          account_id?: string;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: { Args: { invitation_id: string }; Returns: boolean };
      cleanup_expired_invitations: { Args: never; Returns: number };
      decline_invitation: { Args: { invitation_id: string }; Returns: boolean };
      get_account_stats: {
        Args: { account_uuid: string };
        Returns: {
          avg_expense: number;
          current_month_total: number;
          expense_count: number;
          previous_month_total: number;
          total_expenses: number;
        }[];
      };
      get_expenses_by_category: {
        Args: { account_uuid: string; end_date?: string; start_date?: string };
        Returns: {
          category_color: string;
          category_icon: string;
          category_id: string;
          category_name: string;
          expense_count: number;
          percentage: number;
          total_amount: number;
        }[];
      };
      get_user_email: { Args: { user_uuid: string }; Returns: string };
      is_account_member: { Args: { account_uuid: string }; Returns: boolean };
      is_account_owner: { Args: { account_uuid: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
