import React, { useState } from 'react';
import { X, Send, FileUp, CheckCircle2, AlertCircle, Loader2, FileText, Presentation } from 'lucide-react';
import { User } from '../types';

interface ServiceFinalizationFormProps {
    user: User;
    onSubmit: (data: { technicalActions: string; file: File | null }) => Promise<void>;
    onClose: () => void;
}

const ServiceFinalizationForm: React.FC<ServiceFinalizationFormProps> = ({ user, onSubmit, onClose }) => {
    const [technicalActions, setTechnicalActions] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!technicalActions.trim()) {
            setError('Por favor, descreva as ações técnicas tomadas.');
            return;
        }

        setIsSubmitting(true);
        setError('');
        try {
            await onSubmit({ technicalActions, file });
        } catch (err: any) {
            setError(err.message || 'Erro ao finalizar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Permitir PDF, PPT, PPTX
            const validExtensions = ['.pdf', '.ppt', '.pptx'];
            const fileName = selectedFile.name.toLowerCase();
            const isValid = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValid) {
                setError('Por favor, selecione um arquivo PDF ou PowerPoint (.pdf, .ppt, .pptx).');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000030]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500 rounded-2xl p-3 text-white">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#000080] leading-none mb-1">Finalizar Atividade</h2>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Relatório Técnico de Conclusão</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            AÇÕES TÉCNICAS TOMADAS
                        </label>
                        <textarea
                            value={technicalActions}
                            onChange={(e) => setTechnicalActions(e.target.value)}
                            placeholder="Descreva detalhadamente o que foi realizado..."
                            className="w-full h-40 bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm font-medium focus:border-emerald-500 focus:ring-0 transition-all resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            ANEXAR RELATÓRIO (PDF OU PPT)
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.ppt,.pptx"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className={`
                                border-2 border-dashed rounded-3xl p-6 text-center transition-all
                                ${file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50 group-hover:border-emerald-300 group-hover:bg-white'}
                            `}>
                                {file ? (
                                    <div className="flex items-center justify-center gap-3 text-emerald-700 font-bold">
                                        {file.name.toLowerCase().endsWith('.pdf') ? <FileText className="w-6 h-6" /> : <Presentation className="w-6 h-6" />}
                                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileUp className="w-8 h-8 text-gray-400 group-hover:text-emerald-500" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Clique ou arraste o arquivo aqui
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-[#000080] text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-3xl hover:shadow-[0_8px_30px_rgb(0,0,128,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                    <span className="text-white">ENVIANDO...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>FINALIZAR E SALVAR</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceFinalizationForm;
