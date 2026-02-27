
import { TechnicalDemand, TaskStatus, UserRole, User, TechnicalFile } from './types';

export const FOLDER_STRUCTURE = [
  "Consertos_Similar",
  "Garantia_LS_Electric",
  "Garantia_SICK",
  "Garantia_Brady",
  "Relatorios_Teste",
  "Relatorios_Passo_a_Passo",
  "Pareceres_Tecnicos",
  "Solicitacoes_Servico",
  "Relatorios_Servico",
  "Retirada_Estoque"
];

export const MOCK_USERS: User[] = [
  { id: 'tech-1', name: 'JOÃO LUCAS', email: 'joao@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/joao/200' },
  { id: 'tech-2', name: 'ELIAS', email: 'elias@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/elias/200' },
  { id: 'tech-3', name: 'GUSTAVO', email: 'gustavo@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/gustavo/200' },
  { id: 'tech-4', name: 'WILLIAN', email: 'willian@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/willian/200' },
  { id: 'tech-5', name: 'PEP. TECNICO', email: 'pep@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/pep/200' },
  { id: 'tech-6', name: 'LUIS FELIPE', email: 'luis@similar.ind.br', role: UserRole.CONTRIBUTOR, avatar: 'https://picsum.photos/seed/luis/200' },
  { id: 'admin', name: 'ADMINISTRADOR', email: 'admin@similar.ind.br', role: UserRole.ADMIN, avatar: 'https://picsum.photos/seed/admin/200' }
];

export const MOCK_FILES: TechnicalFile[] = [
  {
    id: 'FILE-001',
    name: 'Manual_Inversor_Sick_V10.pdf',
    type: 'application/pdf',
    size: '4.2 MB',
    uploadDate: new Date(Date.now() - 864000000).toISOString(),
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folder: "Garantia_SICK"
  },
  {
    id: 'FILE-002',
    name: 'Painel_Nidec_LinhaA.jpg',
    type: 'image/jpeg',
    size: '1.8 MB',
    uploadDate: new Date(Date.now() - 432000000).toISOString(),
    url: 'https://picsum.photos/seed/painel/800/600',
    folder: "Consertos_Similar"
  },
  {
    id: 'FILE-003',
    name: 'Esquema_Eletrico_Rev02.pdf',
    type: 'application/pdf',
    size: '12.5 MB',
    uploadDate: new Date(Date.now() - 172800000).toISOString(),
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    folder: "Relatorios_Teste"
  }
];

export const INITIAL_DEMANDS: TechnicalDemand[] = [
  {
    id: 'DEM-001',
    title: 'Manutenção de Sensor de Nível',
    company: 'NIDEC - JOINVILLE',
    sector: 'VI',
    requester: 'ALEX BRUNO',
    type: 'CONSERTO',
    channel: 'WHATSAPP',
    description: 'Sensor apresentando erro de leitura intermitente na Linha A.',
    status: TaskStatus.OPEN,
    priority: 'HIGH',
    assignedTo: 'tech-1',
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
  },
  {
    id: 'DEM-002',
    title: 'Visita Técnica Corretiva',
    company: 'WEG',
    sector: 'VE',
    requester: 'JOGEISAKA',
    type: 'VISITA',
    channel: 'EMAIL',
    description: 'Análise de falha no painel de comando central.',
    status: TaskStatus.OPEN,
    priority: 'MEDIUM',
    assignedTo: 'tech-3',
    createdBy: 'admin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
  }
];
