export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      adicionais: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_id: string
          id: string
          marcado_por_padrao: boolean
          nome: string
          ordem: number
          tipo: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_id: string
          id?: string
          marcado_por_padrao?: boolean
          nome: string
          ordem?: number
          tipo?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          id?: string
          marcado_por_padrao?: boolean
          nome?: string
          ordem?: number
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "adicionais_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_contadores: {
        Row: {
          empresa_id: string
          ultimo: number
        }
        Insert: {
          empresa_id: string
          ultimo?: number
        }
        Update: {
          empresa_id?: string
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "empresa_contadores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_notas_admin: {
        Row: {
          atualizado_em: string
          empresa_id: string
          notas: string | null
        }
        Insert: {
          atualizado_em?: string
          empresa_id: string
          notas?: string | null
        }
        Update: {
          atualizado_em?: string
          empresa_id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_notas_admin_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          condicoes_pagamento: string | null
          cor_primaria: string
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          observacoes_admin: string | null
          pago_ate: string | null
          prazo_entrega_padrao: string | null
          slug: string
          texto_topo: string | null
          validade_dias: number
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          condicoes_pagamento?: string | null
          cor_primaria?: string
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          observacoes_admin?: string | null
          pago_ate?: string | null
          prazo_entrega_padrao?: string | null
          slug: string
          texto_topo?: string | null
          validade_dias?: number
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          condicoes_pagamento?: string | null
          cor_primaria?: string
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          observacoes_admin?: string | null
          pago_ate?: string | null
          prazo_entrega_padrao?: string | null
          slug?: string
          texto_topo?: string | null
          validade_dias?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      grupos_opcao: {
        Row: {
          created_at: string
          id: string
          nome: string
          obrigatorio: boolean
          ordem: number
          produto_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          obrigatorio?: boolean
          ordem?: number
          produto_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          ordem?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_opcao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      opcoes: {
        Row: {
          ativo: boolean
          created_at: string
          grupo_id: string
          id: string
          nome: string
          ordem: number
          tipo_acrescimo: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          grupo_id: string
          id?: string
          nome: string
          ordem?: number
          tipo_acrescimo?: string
          valor?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          grupo_id?: string
          id?: string
          nome?: string
          ordem?: number
          tipo_acrescimo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "opcoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_opcao"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          altura_cm: number | null
          area_m2: number | null
          descricao: string | null
          id: string
          largura_cm: number | null
          orcamento_id: string
          ordem: number
          produto_nome: string
          quantidade: number
          snapshot: Json
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          altura_cm?: number | null
          area_m2?: number | null
          descricao?: string | null
          id?: string
          largura_cm?: number | null
          orcamento_id: string
          ordem?: number
          produto_nome: string
          quantidade?: number
          snapshot?: Json
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          altura_cm?: number | null
          area_m2?: number | null
          descricao?: string | null
          id?: string
          largura_cm?: number | null
          orcamento_id?: string
          ordem?: number
          produto_nome?: string
          quantidade?: number
          snapshot?: Json
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          adicionais_snapshot: Json
          cliente_endereco: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          criado_por: string | null
          desconto_tipo: string
          desconto_total: number
          desconto_valor: number
          empresa_id: string
          id: string
          numero: number
          observacoes: string | null
          status: string
          subtotal: number
          token_publico: string
          total: number
          validade_ate: string | null
        }
        Insert: {
          adicionais_snapshot?: Json
          cliente_endereco?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          desconto_tipo?: string
          desconto_total?: number
          desconto_valor?: number
          empresa_id: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          subtotal?: number
          token_publico?: string
          total?: number
          validade_ate?: string | null
        }
        Update: {
          adicionais_snapshot?: Json
          cliente_endereco?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          criado_por?: string | null
          desconto_tipo?: string
          desconto_total?: number
          desconto_valor?: number
          empresa_id?: string
          id?: string
          numero?: number
          observacoes?: string | null
          status?: string
          subtotal?: number
          token_publico?: string
          total?: number
          validade_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          papel: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id: string
          nome?: string
          papel: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          papel?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          altura_max: number | null
          altura_min: number | null
          area_minima: number
          ativo: boolean
          categoria: string | null
          created_at: string
          empresa_id: string
          id: string
          largura_max: number | null
          largura_min: number | null
          nome: string
          ordem: number
          preco_base: number
          tipo_cobranca: string
          valor_minimo: number
        }
        Insert: {
          altura_max?: number | null
          altura_min?: number | null
          area_minima?: number
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          largura_max?: number | null
          largura_min?: number | null
          nome: string
          ordem?: number
          preco_base?: number
          tipo_cobranca?: string
          valor_minimo?: number
        }
        Update: {
          altura_max?: number | null
          altura_min?: number | null
          area_minima?: number
          ativo?: boolean
          categoria?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          largura_max?: number | null
          largura_min?: number | null
          nome?: string
          ordem?: number
          preco_base?: number
          tipo_cobranca?: string
          valor_minimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_copiar_catalogo: {
        Args: { _destino: string; _origem: string }
        Returns: undefined
      }
      admin_listar_empresas: {
        Args: never
        Returns: {
          ativo: boolean
          cor_primaria: string
          created_at: string
          id: string
          logo_url: string
          nome: string
          observacoes_admin: string
          orcamentos_30d: number
          pago_ate: string
          slug: string
          whatsapp: string
        }[]
      }
      empresa_atual: { Args: never; Returns: string }
      empresa_do_grupo: { Args: { _grupo: string }; Returns: string }
      empresa_do_orcamento: { Args: { _orc: string }; Returns: string }
      empresa_do_produto: { Args: { _produto: string }; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
      obter_orcamento_publico: { Args: { _token: string }; Returns: Json }
      papel_atual: { Args: never; Returns: string }
      pode_acessar_empresa: { Args: { _empresa: string }; Returns: boolean }
      pode_configurar_empresa: { Args: { _empresa: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
