import React, { useState, useRef } from 'react';
import {
  FileText, CheckCircle2, Image as ImageIcon,
  ArrowLeft, Plus, Trash2, Printer, ChevronRight, Camera
} from 'lucide-react';
import { ReportTemplate } from '../types.ts';

import { REPORT_TEMPLATES } from '../data/reportTemplates';

const ReportsModule: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (step === 1) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col mb-8">
          <h2 className="text-2xl font-bold text-[#000080]">Módulo de Relatórios Técnicos</h2>
          <p className="text-gray-600">Selecione o modelo oficial Similar para exportação em PDF.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REPORT_TEMPLATES.map(tp => (
            <button
              key={tp.id}
              onClick={() => { setSelectedTemplate(tp); setStep(2); }}
              className="group bg-white p-6 rounded-3xl border border-gray-200 text-left hover:border-[#000080] hover:shadow-xl transition-all flex flex-col h-full"
            >
              <div className="bg-blue-50 p-4 rounded-2xl w-fit mb-6 group-hover:bg-[#000080] group-hover:text-white transition-colors">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-950 mb-2 uppercase tracking-tight">{tp.name}</h3>
              <p className="text-sm text-gray-500 flex-1">{tp.description}</p>
              <div className="mt-6 flex items-center text-[#000080] font-bold text-sm">
                Iniciar Preenchimento
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-200 sticky top-0 z-50 shadow-sm print:hidden">
        <button
          onClick={() => { setStep(1); setFormData({}); setImages([]); }}
          className="flex items-center gap-2 text-gray-600 hover:text-[#000080] font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Alterar Modelo
        </button>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status da Edição</p>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
              Pronto para Exportar
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-[#000080] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/30 active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        <div className="w-full xl:w-[450px] space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-[#000080] mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Dados do Relatório
            </h3>

            <div className="space-y-8">
              {selectedTemplate?.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">
                    {section.title}
                  </h4>
                  {section.fields.map(field => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none text-sm min-h-[120px] transition-all"
                          placeholder={field.placeholder}
                          value={formData[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none text-sm transition-all"
                          placeholder={field.placeholder}
                          value={formData[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#000080] flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Figuras do Laudo
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-blue-50 text-[#000080] rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-gray-300">
                <ImageIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-200/50 p-4 md:p-10 rounded-[40px] border border-gray-300/30 print:p-0 print:bg-transparent print:border-none">
          <div className="pdf-container">
            <div className="report-page">
              <div className="report-header">
                <div className="report-logo">
                  <img src="https://www.similar.ind.br/wp-content/uploads/2020/10/logo-200-whiter.png" alt="Similar" style={{ filter: 'invert(1) brightness(0.2)', width: '180px' }} />
                </div>
                <div className="report-address-box">
                  <div className="addr-col">
                    <strong>Paraná</strong>
                    SIMILAR TECNOLOGIA E AUTOMAÇÃO LTDA<br />
                    CGC/MF 82.321.845/0001-43 - IE 9014380563<br />
                    Rua Alagoas, 2466 - Vila Guaíra<br />
                    80.630-050 - Curitiba - PR
                  </div>
                  <div className="addr-col">
                    <strong>Santa Catarina</strong>
                    SIMILAR AUTOMAÇAO LTDA<br />
                    CGC/MF 03.189.824/0001-40 - IE 253917115<br />
                    Rua Dona Elza Meinert, 942 - Costa e Silva<br />
                    89218-650 - Joinville - SC
                  </div>
                </div>
              </div>

              <h1 className="report-title-main">{selectedTemplate?.name}</h1>

              <table className="report-meta-table">
                <tbody>
                  <tr>
                    <td colSpan={2}><span className="r-lbl">CLIENTE:</span> <span className="r-v">{formData.client || 'N/A'}</span></td>
                    <td rowSpan={4} className="r-similar-contact">
                      <strong>SIMILAR TECNOLOGIA E AUTOMAÇÃO LTDA.</strong><br /><br />
                      FONE: (41) 3074-0300
                    </td>
                  </tr>
                  <tr>
                    <td><span className="r-lbl">A/C:</span> <span className="r-v blue-txt">{formData.email || 'N/A'}</span></td>
                    <td><span className="r-lbl">SETOR:</span> <span className="r-v">Técnico</span></td>
                  </tr>
                  <tr>
                    <td><span className="r-lbl">RESPONSÁVEL:</span> <span className="r-v">{formData.technician || 'Consultor Técnico'}</span></td>
                    <td><span className="r-lbl">DOC:</span> <span className="r-v">{formData.report_no || formData.visit_no || '---'}</span></td>
                  </tr>
                  <tr>
                    <td><span className="r-lbl">DATA:</span> <span className="r-v">{formData.date || new Date().toLocaleDateString('pt-BR')}</span></td>
                    <td><span className="r-lbl">Pg.</span> <span className="r-v">1/1</span></td>
                  </tr>
                </tbody>
              </table>

              <div className="report-box-group">
                {selectedTemplate?.sections.slice(1).map((section, idx) => (
                  <div key={idx} className="r-analysis-box mb-4">
                    <div className="r-analysis-header">{section.title}</div>
                    {section.fields.map(f => (
                      <div key={f.id} className="mt-4">
                        <strong className="text-xs uppercase text-gray-400 block mb-1">{f.label}:</strong>
                        <p className="r-v text-sm whitespace-pre-wrap">{formData[f.id] || 'Nenhum dado informado.'}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="r-figs-grid mt-10">
                {images.slice(0, 2).map((img, idx) => (
                  <div key={idx} className="r-fig-item">
                    <div className="r-fig-frame">
                      <img src={img} alt={`Anexo ${idx + 1}`} />
                    </div>
                    <p className="text-[10px] font-bold">Anexo {idx + 1}</p>
                  </div>
                ))}
              </div>

              <div className="report-logos-footer">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/SICK_Logo.svg/1200px-SICK_Logo.svg.png" alt="SICK" />
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Similar Tecnologia e Automação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pdf-container { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .report-page {
          width: 210mm; min-height: 297mm; padding: 15mm; background: white;
          font-family: Arial, sans-serif; color: #000; box-sizing: border-box; position: relative;
        }
        .report-header { display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 20px; }
        .report-address-box { display: flex; gap: 15px; color: #444; line-height: 1.2; }
        .addr-col { width: 170px; }
        .report-title-main {
          text-align: center; font-size: 20px; margin: 20px 0; font-weight: bold;
          border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0;
        }
        .report-meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
        .report-meta-table td { border: 1px solid #000; padding: 6px; }
        .r-similar-contact { width: 30%; background: #fafafa; }
        .r-lbl { font-weight: bold; margin-right: 5px; }
        .r-analysis-box { border: 1px solid #000; padding: 15px; min-height: 150px; }
        .r-analysis-header { font-weight: bold; font-size: 14px; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; }
        .r-figs-grid { display: flex; gap: 20px; justify-content: center; }
        .r-fig-frame { width: 250px; height: 180px; border: 1px solid #000; overflow: hidden; }
        .r-fig-frame img { width: 100%; height: 100%; object-fit: cover; }
        .report-logos-footer { position: absolute; bottom: 10mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10px; }
        .report-logos-footer img { height: 20px; filter: grayscale(1); }
        @media print {
          @page { margin: 0; size: A4; }
          body * { visibility: hidden; }
          .pdf-container, .pdf-container * { visibility: visible; }
          .pdf-container { position: absolute; left: 0; top: 0; width: 100%; }
          .report-page { box-shadow: none; padding: 15mm; }
        }
      `}</style>
    </div>
  );
};

export default ReportsModule;