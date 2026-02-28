export enum TaskStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VENDEDOR = 'VENDEDOR',
  REGIONAL_ADMIN = 'REGIONAL_ADMIN',
  VENDEDOR_LS = 'VENDEDOR_LS',
  REGIONAL_ADMIN_LS = 'REGIONAL_ADMIN_LS'
}

export enum ServiceRequestStatus {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  EM_ATRASO = 'EM_ATRASO'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  password_plain?: string;
  region?: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  requesterId: string;
  requesterEmail: string;
  requesterRegion?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  hasSample?: boolean;
  photos?: string[];
  pdfUrl?: string; // Request PDF
  category?: string; // Type of service
  finalizationDescription?: string; // Technical actions
  finalReportUrl?: string; // Attached report (PDF/PPT)
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  serviceRequestId?: string;
  targetRole?: string;
  targetUserId?: string;
  readBy: string[];
  createdAt: string;
}

export interface TechnicalFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url: string;
  folder: string;
}

export type DemandSector = 'VE' | 'VI' | 'ADM' | 'PJ' | 'CLIENTE' | '';

export type DemandRequester = 'ALEX BRUNO' | 'JOGE ISAKA' | 'VANESSA' | 'ALBERTO RITER' | 'GABRIEL' | 'GABRIEL RITER' | 'LUCAS RITER' | 'OUTRO';

export type DemandType =
  | 'CONSERTO' | 'TESTE' | 'ATENDIMENTO' | 'VISITA' | 'PROJETOS'
  | 'CONVERSAO' | 'TREINAMENTO' | 'PARAMETRIZACAO' | '5S'
  | 'MELHORIAS' | 'DESCRICAO_ITENS' | 'OUTROS';

export type DemandChannel = 'WHATSAPP' | 'BLIP' | 'EMAIL' | 'WA VE' | 'REUNIAO';

export interface TechnicalDemand {
  id: string;
  code?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  company: string;
  sector: DemandSector;
  requester: string;
  type: string;
  channel: DemandChannel;
  assignedTo: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  files: TechnicalFile[];
  expectedDate?: string;
  technicalDetails?: string;
}

export interface ReportField {
  id: string;
  label: string;
  type: string;
  placeholder: string;
}

export interface ReportSection {
  title: string;
  fields: ReportField[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}