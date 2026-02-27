export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            folder_restrictions: {
                Row: {
                    folder: string
                    id: string
                    user_id: string
                }
                Insert: {
                    folder: string
                    id?: string
                    user_id: string
                }
                Update: {
                    folder?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "folder_restrictions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string | null
                    id: string
                    message: string | null
                    read_by: string[] | null
                    service_request_id: string | null
                    target_role: string | null
                    title: string
                    type: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    read_by?: string[] | null
                    service_request_id?: string | null
                    target_role?: string | null
                    title: string
                    type?: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    message?: string | null
                    read_by?: string[] | null
                    service_request_id?: string | null
                    target_role?: string | null
                    title?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_service_request_id_fkey"
                        columns: ["service_request_id"]
                        isOneToOne: false
                        referencedRelation: "service_requests"
                        referencedColumns: ["id"]
                    },
                ]
            }
            service_requests: {
                Row: {
                    accepted_by: string | null
                    created_at: string | null
                    description: string
                    id: string
                    pdf_url: string | null
                    requester_email: string
                    requester_id: string
                    requester_region: string | null
                    status: string
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    accepted_by?: string | null
                    created_at?: string | null
                    description: string
                    id?: string
                    pdf_url?: string | null
                    requester_email: string
                    requester_id: string
                    requester_region?: string | null
                    status?: string
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    accepted_by?: string | null
                    created_at?: string | null
                    description?: string
                    id?: string
                    pdf_url?: string | null
                    requester_email?: string
                    requester_id?: string
                    requester_region?: string | null
                    status?: string
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "service_requests_accepted_by_fkey"
                        columns: ["accepted_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_requests_requester_id_fkey"
                        columns: ["requester_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            technical_demands: {
                Row: {
                    assigned_to: string | null
                    channel: Database["public"]["Enums"]["demand_channel"]
                    company: string
                    created_at: string | null
                    created_by: string | null
                    description: string
                    id: string
                    priority: Database["public"]["Enums"]["demand_priority"]
                    requester: string
                    sector: Database["public"]["Enums"]["demand_sector"] | null
                    status: Database["public"]["Enums"]["task_status"]
                    technical_details: string | null
                    title: string
                    type: string
                    updated_at: string | null
                }
                Insert: {
                    assigned_to?: string | null
                    channel: Database["public"]["Enums"]["demand_channel"]
                    company: string
                    created_at?: string | null
                    created_by?: string | null
                    description: string
                    id?: string
                    priority?: Database["public"]["Enums"]["demand_priority"]
                    requester: string
                    sector?: Database["public"]["Enums"]["demand_sector"] | null
                    status?: Database["public"]["Enums"]["task_status"]
                    technical_details?: string | null
                    title: string
                    type: string
                    updated_at?: string | null
                }
                Update: {
                    assigned_to?: string | null
                    channel?: Database["public"]["Enums"]["demand_channel"]
                    company?: string
                    created_at?: string | null
                    created_by?: string | null
                    description?: string
                    id?: string
                    priority?: Database["public"]["Enums"]["demand_priority"]
                    requester?: string
                    sector?: Database["public"]["Enums"]["demand_sector"] | null
                    status?: Database["public"]["Enums"]["task_status"]
                    technical_details?: string | null
                    title?: string
                    type?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "technical_demands_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "technical_demands_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            technical_files: {
                Row: {
                    demand_id: string | null
                    folder: string
                    id: string
                    name: string
                    size: string
                    storage_path: string
                    type: string
                    upload_date: string | null
                    uploaded_by: string | null
                    url: string
                }
                Insert: {
                    demand_id?: string | null
                    folder: string
                    id?: string
                    name: string
                    size: string
                    storage_path: string
                    type: string
                    upload_date?: string | null
                    uploaded_by?: string | null
                    url: string
                }
                Update: {
                    demand_id?: string | null
                    folder?: string
                    id?: string
                    name?: string
                    size?: string
                    storage_path?: string
                    type?: string
                    upload_date?: string | null
                    uploaded_by?: string | null
                    url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "technical_files_demand_id_fkey"
                        columns: ["demand_id"]
                        isOneToOne: false
                        referencedRelation: "technical_demands"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "technical_files_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    avatar: string | null
                    created_at: string | null
                    email: string
                    id: string
                    name: string
                    password_plain: string | null
                    region: string | null
                    role: Database["public"]["Enums"]["user_role"]
                    updated_at: string | null
                }
                Insert: {
                    avatar?: string | null
                    created_at?: string | null
                    email: string
                    id: string
                    name: string
                    password_plain?: string | null
                    region?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Update: {
                    avatar?: string | null
                    created_at?: string | null
                    email?: string
                    id?: string
                    name?: string
                    password_plain?: string | null
                    region?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            is_admin: { Args: never; Returns: boolean }
        }
        Enums: {
            demand_channel: "WHATSAPP" | "BLIP" | "EMAIL" | "WA VE" | "REUNIAO"
            demand_priority: "LOW" | "MEDIUM" | "HIGH"
            demand_sector: "VE" | "VI" | "ADM" | "PJ"
            task_status: "OPEN" | "CLOSED"
            user_role: "ADMIN" | "CONTRIBUTOR" | "VENDEDOR" | "REGIONAL_ADMIN"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
    Database["public"]["Enums"][T]
