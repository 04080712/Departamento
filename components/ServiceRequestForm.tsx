import React, { useState, useRef } from 'react';
import {
    FileText, Send, X, Printer, Building2,
    MessageSquare, Tag, AlignLeft, Tags, Box, AlertCircle, TestTube, Camera
} from 'lucide-react';
import { User, ServiceRequestStatus } from '../types';
import { jsPDF } from 'jspdf';
import { useEffect } from 'react';

interface ServiceRequestFormProps {
    user: User;
    category?: string | null;
    onSubmit: (data: {
        title: string;
        description: string;
        category: string;
        status: ServiceRequestStatus;
        requesterId: string;
        requesterEmail: string;
        requesterRegion?: string;
        hasSample: boolean;
        photos: File[];
        pdfBlob?: Blob;
    }) => Promise<void>;
    onClose: () => void;
}

const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({ user, category, onSubmit, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Novas informações para modal de Teste
    const [companyName, setCompanyName] = useState('');
    const [testType, setTestType] = useState('');
    const [equipment, setEquipment] = useState('');
    const [itemToTest, setItemToTest] = useState('');
    const [problemDetail, setProblemDetail] = useState('');

    const [hasSample, setHasSample] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const isTestMode = category === 'Teste';

    // Helper para adicionar imagem ao PDF
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    };

    const generatePdfBlob = async (): Promise<Blob> => {
        const doc = new jsPDF();

        // Estilos
        const navy = [0, 0, 128] as [number, number, number];
        const darkGray = [60, 60, 60] as [number, number, number];

        // Header
        doc.setFontSize(22);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('SOLICITAÇÃO DE SERVIÇO', 105, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`CLASSE: ${category?.toUpperCase() || 'GERAL'}`, 105, 32, { align: 'center' });

        doc.setLineWidth(0.8);
        doc.setDrawColor(navy[0], navy[1], navy[2]);
        doc.line(20, 38, 190, 38);

        let y = 50;
        const marginX = 25;
        const fieldLabelSize = 10;
        const fieldValueSize = 11;

        const addField = (label: string, value: string) => {
            doc.setFontSize(fieldLabelSize);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'bold');
            doc.text(label.toUpperCase(), marginX, y);
            y += 6;

            doc.setFontSize(fieldValueSize);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.setFont('helvetica', 'normal');

            const splitText = doc.splitTextToSize(value || '---', 160);
            doc.text(splitText, marginX, y);
            y += (splitText.length * 6) + 6;
        };

        // Dados do Solicitante
        doc.setFontSize(12);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO SOLICITANTE', marginX, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(`NOME: ${user.name}`, marginX, y);
        doc.text(`EMAIL: ${user.email}`, 105, y);
        y += 7;
        doc.text(`REGIÃO: ${user.region || 'N/A'}`, marginX, y);
        doc.text(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, 105, y);
        y += 15;

        // Conteúdo
        doc.setLineWidth(0.1);
        doc.setDrawColor(200);
        doc.line(20, y - 5, 190, y - 5);

        if (isTestMode) {
            addField('Empresa', companyName);
            addField('Teste a Realizar', testType);
            addField('Equipamentos Necessários', equipment);
            addField('Item / Componente', itemToTest);
            addField('Situação Problema', problemDetail);
        } else {
            addField('Título', title);
            addField('Descrição', description);
        }

        // Amostra
        addField('Envio de Amostra', hasSample ? 'SIM - a solicitação de teste só será aceita se a amostra estiver no departamento tecnico/' : 'NÃO');

        // Fotos
        if (photos.length > 0) {
            doc.setFontSize(fieldLabelSize);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'bold');
            doc.text('FOTOS ANEXADAS', marginX, y);
            y += 10;

            for (let i = 0; i < photos.length; i++) {
                try {
                    const imgData = await readFileAsDataURL(photos[i]);
                    // Adicionar nova página se necessário
                    if (y + 60 > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.addImage(imgData, 'JPEG', marginX, y, 60, 45);
                    y += 50;
                } catch (err) {
                    console.error('Erro ao adicionar imagem ao PDF:', err);
                }
            }
        }

        // Footer
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(180);
            doc.text(`Página ${i} de ${pageCount}`, 190, pageHeight - 15, { align: 'right' });
            doc.text(`Documento gerado digitalmente pelo Portal Técnico Similar - ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 15, { align: 'center' });
        }

        return doc.output('blob');
    };

    // Atualização do Preview em Tempo Real
    useEffect(() => {
        const updatePreview = async () => {
            try {
                const blob = await generatePdfBlob();
                const url = URL.createObjectURL(blob);
                setPdfPreviewUrl(url);
                return url;
            } catch (err) {
                console.error('Erro ao gerar preview do PDF:', err);
                return null;
            }
        };

        const timer = setTimeout(async () => {
            const url = await updatePreview();
            if (url) {
                return () => URL.revokeObjectURL(url);
            }
        }, 800); // Aumentado para 800ms para compensar processamento de fotos

        return () => clearTimeout(timer);
    }, [title, description, companyName, testType, equipment, itemToTest, problemDetail, hasSample, photoPreviews]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 4) {
            setError('Máximo de 4 fotos permitidas.');
            return;
        }

        setPhotos(files);

        // Limpar previews antigos
        photoPreviews.forEach(URL.revokeObjectURL);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isTestMode) {
            if (!companyName.trim() || !testType.trim() || !problemDetail.trim()) {
                setError('Preencha os campos obrigatórios (*)');
                return;
            }
        } else {
            if (!title.trim() || !description.trim()) {
                setError('Preencha o título e a descrição.');
                return;
            }
        }

        setIsSubmitting(true);
        setError('');

        try {
            const pdfBlob = await generatePdfBlob();

            // Se for teste, construir título e descrição automáticos
            const finalTitle = isTestMode ? `[TESTE] ${companyName} - ${testType}` : title.trim();
            const finalDescription = isTestMode
                ? `Empresa: ${companyName}\nTeste: ${testType}\nEquipamentos: ${equipment}\nItem: ${itemToTest}\nProblema: ${problemDetail}`
                : description.trim();

            await onSubmit({
                title: finalTitle,
                description: finalDescription,
                category: category || 'Geral',
                status: ServiceRequestStatus.PENDENTE,
                requesterId: user.id,
                requesterEmail: user.email,
                requesterRegion: user.region,
                hasSample: hasSample,
                photos: photos,
                pdfBlob: pdfBlob,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao criar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintPdf = () => {
        if (pdfPreviewUrl) {
            window.open(pdfPreviewUrl, '_blank');
        }
    };

    return (
        <>
            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-[#000033]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <FileText className="w-6 h-6 text-[#000080]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-[#000080] tracking-tight">
                                    {isTestMode ? `Solicitação de Teste` : 'Nova Solicitação de Serviço'}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                    Preencha os campos para gerar o documento técnico
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Form Side */}
                        <form onSubmit={handleSubmit} className="w-full lg:w-[450px] p-8 space-y-6 overflow-y-auto border-r border-gray-50 bg-white">
                            {isTestMode ? (
                                <>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <Building2 className="w-3 h-3" /> Nome da Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Ex: Nidec Joinville"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <TestTube className="w-3 h-3" /> Teste a Ser Realizado *
                                        </label>
                                        <input
                                            type="text"
                                            value={testType}
                                            onChange={(e) => setTestType(e.target.value)}
                                            placeholder="Ex: Laudo de Estanqueidade"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <Tags className="w-3 h-3" /> Item / Componente *
                                        </label>
                                        <input
                                            type="text"
                                            value={itemToTest}
                                            onChange={(e) => setItemToTest(e.target.value)}
                                            placeholder="Ex: Sensor de Nível SN-10"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <Box className="w-3 h-3" /> Equipamentos Necessários
                                        </label>
                                        <input
                                            type="text"
                                            value={equipment}
                                            onChange={(e) => setEquipment(e.target.value)}
                                            placeholder="Ex: Multímetro, Bomba Vácuo"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <AlertCircle className="w-3 h-3" /> Situação Problema *
                                        </label>
                                        <textarea
                                            value={problemDetail}
                                            onChange={(e) => setProblemDetail(e.target.value)}
                                            rows={4}
                                            placeholder="Descreva o defeito ou motivo do teste..."
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <Tag className="w-3 h-3" /> Título da Solicitação *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Ex: Solicitar laudo técnico"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                            <AlignLeft className="w-3 h-3" /> Descrição Detalhada *
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            placeholder="Descreva detalhadamente o serviço..."
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#000080]/10 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Seção de Amostra e Fotos */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${hasSample ? 'bg-[#000080] text-white' : 'bg-white text-gray-400'}`}>
                                                <TestTube className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#000080] uppercase tracking-widest">Enviar Amostra?</p>
                                                <p className="text-[10px] font-bold text-gray-400">Marque se enviará amostra física</p>
                                            </div>
                                        </div>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasSample}
                                                onChange={(e) => setHasSample(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000080]"></div>
                                        </div>
                                    </label>

                                    {hasSample && (
                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black text-amber-700 leading-tight uppercase tracking-wider flex items-start gap-2">
                                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                a solicitação de teste só será aceita se a amostra estiver no departamento tecnico/
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        <Camera className="w-3 h-3" /> Anexar Fotos (Máx. 4)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        id="photo-upload"
                                    />
                                    <label
                                        htmlFor="photo-upload"
                                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50 hover:bg-gray-100 hover:border-gray-200 cursor-pointer transition-all gap-2"
                                    >
                                        <Camera className="w-6 h-6 text-gray-400" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selecionar Imagens</span>
                                    </label>

                                    {photoPreviews.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2 mt-4">
                                            {photoPreviews.map((url, i) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-gray-100 relative group shadow-sm">
                                                    <img src={url} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPhotos = photos.filter((_, idx) => idx !== i);
                                                            const newPreviews = photoPreviews.filter((_, idx) => idx !== i);
                                                            setPhotos(newPhotos);
                                                            setPhotoPreviews(newPreviews);
                                                        }}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95">
                                    <p className="text-xs font-bold text-red-600 flex items-center gap-2">
                                        <X className="w-3.5 h-3.5" /> {error}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-4 sticky bottom-0 bg-white pb-2 mt-auto">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#000080] text-white text-xs font-black uppercase tracking-widest rounded-[20px] hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-blue-900/20"
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? 'Enviando...' : 'Solicitar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintPdf}
                                    className="p-4 bg-gray-100 text-gray-700 rounded-[20px] hover:bg-gray-200 transition-all shadow-sm"
                                    title="Exportar PDF"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        {/* Preview Side */}
                        <div className="hidden lg:flex flex-1 bg-gray-100 p-8 flex-col relative overflow-hidden">
                            <div className="absolute top-4 left-4 z-10">
                                <span className="px-4 py-2 bg-white/80 backdrop-blur rounded-full text-[10px] font-black text-[#000080] uppercase tracking-widest shadow-sm border border-white">
                                    Visualização do Documento
                                </span>
                            </div>

                            <div className="flex-1 bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-200/50 flex items-center justify-center">
                                {pdfPreviewUrl ? (
                                    <iframe
                                        src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-full border-none"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="animate-spin text-[#000080] opacity-20">
                                            <Printer className="w-12 h-12" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gerando preview...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default ServiceRequestForm;
