/**
 * Tipos de la base de datos, escritos a mano para reflejar exactamente
 * supabase/migrations/0001_init.sql. Cuando el proyecto se vincule con el
 * Supabase CLI, este archivo puede regenerarse con:
 *
 *   supabase gen types typescript --project-id <id> > types/database.ts
 *
 * mientras tanto, cualquier cambio al esquema SQL debe reflejarse aquí manualmente.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ItineraryStatus = "draft" | "generating" | "ready" | "error";
export type PdfStatus = "none" | "generating" | "ready" | "error";
export type ProposalCurrency = "MXN" | "USD" | "EUR";

export interface Database {
  public: {
    Tables: {
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          passenger_name: string;
          destination: string;
          start_date: string;
          end_date: string;
          observations: string | null;
          status: ItineraryStatus;
          json_data: Json;
          pdf_url: string | null;
          pdf_generated_at: string | null;
          pdf_version: number;
          pdf_status: PdfStatus;
          search_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          passenger_name: string;
          destination: string;
          start_date: string;
          end_date: string;
          observations?: string | null;
          status?: ItineraryStatus;
          json_data?: Json;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          pdf_version?: number;
          pdf_status?: PdfStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          passenger_name?: string;
          destination?: string;
          start_date?: string;
          end_date?: string;
          observations?: string | null;
          status?: ItineraryStatus;
          json_data?: Json;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          pdf_version?: number;
          pdf_status?: PdfStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "itineraries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      proposals: {
        Row: {
          id: string;
          user_id: string;
          client_name: string;
          client_email: string | null;
          client_phone: string | null;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          num_days: number | null;
          num_travelers: number | null;
          trip_type: string | null;
          title: string | null;
          currency: ProposalCurrency;
          status: ItineraryStatus;
          json_data: Json;
          pdf_url: string | null;
          pdf_generated_at: string | null;
          pdf_version: number;
          pdf_status: PdfStatus;
          search_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_name: string;
          client_email?: string | null;
          client_phone?: string | null;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          num_days?: number | null;
          num_travelers?: number | null;
          trip_type?: string | null;
          title?: string | null;
          currency?: ProposalCurrency;
          status?: ItineraryStatus;
          json_data?: Json;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          pdf_version?: number;
          pdf_status?: PdfStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_name?: string;
          client_email?: string | null;
          client_phone?: string | null;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          num_days?: number | null;
          num_travelers?: number | null;
          trip_type?: string | null;
          title?: string | null;
          currency?: ProposalCurrency;
          status?: ItineraryStatus;
          json_data?: Json;
          pdf_url?: string | null;
          pdf_generated_at?: string | null;
          pdf_version?: number;
          pdf_status?: PdfStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
