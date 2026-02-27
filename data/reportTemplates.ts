
import { ReportTemplate } from '../types';

export const CONSERTO_TEMPLATE: ReportTemplate = {
  id: 'tp-01',
  name: 'RELATÓRIO DE CONSERTO',
  description: 'Template oficial para análise técnica e orçamentos de manutenção Similar.',
  sections: [
    {
      title: 'Informações do Cabeçalho',
      fields: [
        { id: 'report_no', label: 'Relatório Nº', type: 'text', placeholder: 'Ex: F06-26' },
        { id: 'client', label: 'Para (Cliente)', type: 'text', placeholder: 'NIDEC' },
        { id: 'email', label: 'A/C (Email)', type: 'text', placeholder: 'vitor.l.stepan@nidec-ga.com' },
        { id: 'date', label: 'Data', type: 'text', placeholder: new Date().toLocaleDateString('pt-BR') },
        { id: 'technician', label: 'Técnico Responsável', type: 'text', placeholder: 'Luiz Umbelino' }
      ]
    },
    {
      title: 'Dados do Item 01',
      fields: [
        { id: 'pn', label: 'Part Number', type: 'text', placeholder: '1060979' },
        { id: 'desc', label: 'Descrição', type: 'text', placeholder: 'PFG08-E1CM0371' },
        { id: 'sn', label: 'Serial Number', type: 'text', placeholder: '25279994' },
        { id: 'nf', label: 'NF Entrada', type: 'text', placeholder: '304954' }
      ]
    },
    {
      title: 'Diagnóstico',
      fields: [
        { id: 'defect', label: 'Defeito Apresentado', type: 'textarea', placeholder: 'Encoder não apresenta envio de sinal ao ser conectado no CLP.' },
        { id: 'analysis', label: 'Análise Técnica', type: 'textarea', placeholder: 'O Encoder SICK, modelo PFG08-E1CM0371, foi recebido...' }
      ]
    }
  ]
};

export const VISITA_TECNICA_TEMPLATE: ReportTemplate = {
  id: 'tp-02',
  name: 'RELATÓRIO DE VISITA TÉCNICA',
  description: 'Documento de acompanhamento de campo, instalações e vistorias preventivas.',
  sections: [
    {
      title: 'Informações da Visita',
      fields: [
        { id: 'visit_no', label: 'Ordem de Serviço', type: 'text', placeholder: 'OS-8890' },
        { id: 'location', label: 'Local da Visita', type: 'text', placeholder: 'Planta Industrial Joinville' },
        { id: 'start_time', label: 'Hora de Início', type: 'text', placeholder: '08:00' },
        { id: 'end_time', label: 'Hora de Término', type: 'text', placeholder: '17:30' }
      ]
    },
    {
      title: 'Escopo do Serviço',
      fields: [
        { id: 'activity', label: 'Atividades Realizadas', type: 'textarea', placeholder: 'Descreva os passos realizados no cliente...' },
        { id: 'observations', label: 'Observações de Campo', type: 'textarea', placeholder: 'Condições ambientais, impedimentos ou sugestões...' }
      ]
    }
  ]
};

export const REPORT_TEMPLATES = [CONSERTO_TEMPLATE, VISITA_TECNICA_TEMPLATE];
