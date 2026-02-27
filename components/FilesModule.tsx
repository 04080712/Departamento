
import React, { useState, useRef, useMemo } from 'react';
import {
  FileText, Search, Plus, File as FileIcon,
  Trash2, Download, Image as ImageIcon,
  Folder, ArrowLeft, ArrowUpCircle, X,
  ChevronRight, Check, Eye, Maximize2, Lock
} from 'lucide-react';
import { TechnicalFile, UserRole } from '../types';
import { FOLDER_STRUCTURE } from '../constants';

interface FilesModuleProps {
  files: TechnicalFile[];
  userRole: UserRole;
  restrictedFolders: string[];
  onUpload: (file: File, folder: string) => Promise<void>;
  onDelete: (id: string) => void;
}

const FilesModule: React.FC<FilesModuleProps> = ({ files, userRole, restrictedFolders, onUpload, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<TechnicalFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadData, setUploadData] = useState<{ file: File | null; folder: string }>({
    file: null,
    folder: FOLDER_STRUCTURE[0]
  });

  const getFileIcon = (type: string | undefined) => {
    if (!type) return <FileIcon className="w-8 h-8 text-blue-500" />;
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return <ImageIcon className="w-8 h-8 text-emerald-500" />;
    return <FileIcon className="w-8 h-8 text-blue-500" />;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;
    setIsUploading(true);
    setUploadError('');
    try {
      await onUpload(uploadData.file, uploadData.folder);
      setIsUploadModalOpen(false);
      setUploadData({ file: null, folder: FOLDER_STRUCTURE[0] });
    } catch (err: any) {
      setUploadError('Erro ao fazer upload. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = (file: TechnicalFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem de Pastas Baseada em Permissões
  const visibleFolders = useMemo(() => {
    return FOLDER_STRUCTURE.filter(folder => {
      if (userRole === UserRole.ADMIN) return true;
      return !restrictedFolders.includes(folder);
    });
  }, [userRole, restrictedFolders]);

  // Navegação e Filtros
  const subFolders = useMemo(() => {
    if (!selectedFolder) return [];
    const prefix = selectedFolder + '/';
    const subSet = new Set<string>();
    files.forEach(f => {
      if (f.folder.startsWith(prefix)) {
        const remaining = f.folder.substring(prefix.length);
        const subName = remaining.split('/')[0];
        if (subName) subSet.add(subName);
      }
    });
    return Array.from(subSet);
  }, [files, selectedFolder]);

  const folderFiles = useMemo(() => {
    if (!selectedFolder) return [];
    return files.filter(f =>
      f.folder === selectedFolder &&
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, selectedFolder, searchTerm]);

  const handleBack = () => {
    if (!selectedFolder) return;
    const parts = selectedFolder.split('/');
    if (parts.length <= 1) {
      setSelectedFolder(null);
    } else {
      parts.pop();
      setSelectedFolder(parts.join('/'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-4">
          {selectedFolder && (
            <button
              onClick={handleBack}
              className="p-3 bg-white border border-gray-200 rounded-2xl text-[#000080] hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="text-left">
            <h2 className="text-3xl font-black text-[#000080] tracking-tight">
              {selectedFolder ? selectedFolder.split('/').pop()?.replace(/_/g, ' ') : 'Central de Arquivos'}
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              {selectedFolder ? `Navegando em ${selectedFolder.replace(/\//g, ' > ').replace(/_/g, ' ')}` : 'Repositório técnico oficial Similar.'}
            </p>
          </div>
        </div>
        {(userRole === UserRole.ADMIN || userRole === UserRole.CONTRIBUTOR) && (
          <button
            onClick={() => {
              setUploadData(prev => ({ ...prev, folder: selectedFolder || FOLDER_STRUCTURE[0] }));
              setIsUploadModalOpen(true);
            }}
            className="bg-[#000080] text-white px-8 py-4 rounded-[20px] font-black flex items-center gap-2 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95 text-sm uppercase tracking-widest shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Salvar Arquivo</span>
            <span className="sm:hidden text-[10px]">Novo</span>
          </button>
        )}
      </div>

      {!selectedFolder ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-700">
          {visibleFolders.map((folder) => {
            const fileCount = files.filter(f => f.folder === folder || f.folder.startsWith(folder + '/')).length;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className="group relative bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:border-[#000080] hover:scale-[1.02] transition-all duration-500 text-left flex flex-col h-56 overflow-hidden"
              >
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-[0.07] translate-x-12 group-hover:translate-x-0 group-hover:scale-[2.5] group-hover:rotate-12 transition-all duration-700 ease-out pointer-events-none">
                  <Folder className="w-32 h-32 text-[#000080]" />
                </div>
                <div className="bg-blue-50 p-6 rounded-[28px] w-fit mb-auto group-hover:bg-[#000080] group-hover:ring-8 group-hover:ring-blue-50 transition-all duration-500 relative z-10">
                  <Folder className="w-10 h-10 text-[#000080] group-hover:text-white group-hover:rotate-6 transition-all duration-500" />
                </div>
                <div className="mt-4 relative z-10">
                  <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight group-hover:text-[#000080] transition-colors duration-300">
                    {folder.replace(/_/g, ' ')}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-500 transition-colors">
                      {fileCount} Documentos
                    </span>
                    <div className="bg-blue-50 p-2 rounded-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                      <ChevronRight className="w-5 h-5 text-[#000080]" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Grid de Subpastas */}
          {subFolders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {subFolders.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedFolder(`${selectedFolder}/${sub}`)}
                  className="flex items-center gap-4 bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:border-[#000080] hover:shadow-md transition-all group"
                >
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-[#000080] transition-colors">
                    <Folder className="w-5 h-5 text-[#000080] group-hover:text-white" />
                  </div>
                  <span className="font-black text-xs text-gray-700 uppercase tracking-tight">{sub.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Grid de Arquivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
            {folderFiles.map((file) => (
              <div key={file.id} className="group bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-gray-50 rounded-2xl overflow-hidden group-hover:shadow-md transition-all flex items-center justify-center h-24 w-24 flex-shrink-0">
                    {file.type.includes('image') ? (
                      <img src={file.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPreviewFile(file)} className="p-2.5 text-gray-300 hover:text-[#000080] rounded-xl"><Eye className="w-4 h-4" /></button>
                    {(userRole === UserRole.ADMIN || userRole === UserRole.CONTRIBUTOR) && (
                      <button onClick={() => onDelete(file.id)} className="p-2.5 text-gray-300 hover:text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-black text-gray-950 truncate mb-1">{file.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{file.size} • {new Date(file.uploadDate).toLocaleDateString('pt-BR')}</p>
                <button onClick={() => setPreviewFile(file)} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-[#000080] rounded-xl hover:bg-[#000080] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Maximize2 className="w-3.5 h-3.5" /> Abrir Documento
                </button>
              </div>
            ))}
            {folderFiles.length === 0 && subFolders.length === 0 && (
              <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Nenhum arquivo ou subpasta encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#000033]/90 backdrop-blur-md animate-in fade-in" onClick={() => setPreviewFile(null)} />
          <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[40px] relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-white z-20">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-[#000080]">{getFileIcon(previewFile.type)}</div>
                <div>
                  <h3 className="text-lg font-black text-gray-950 truncate max-w-md">{previewFile.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pasta: {previewFile.folder}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => downloadFile(previewFile)} className="flex items-center gap-2 px-6 py-3 bg-[#000080] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95"><Download className="w-4 h-4" /> Download</button>
                <button onClick={() => setPreviewFile(null)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100/50 flex items-center justify-center p-4 md:p-8">
              {(() => {
                const type = previewFile.type ? previewFile.type.toLowerCase() : '';
                const isImage = type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg');
                const isPdf = type.includes('pdf');

                if (isImage) {
                  return (
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="max-h-full max-w-full rounded-2xl shadow-2xl border border-gray-200 object-contain"
                    />
                  );
                }

                if (isPdf) {
                  return (
                    <div className="w-full h-full flex flex-col gap-4">
                      <iframe
                        src={`${previewFile.url}#toolbar=0`}
                        className="w-full h-full rounded-2xl border border-gray-200 shadow-inner bg-white"
                        title={previewFile.name}
                      />
                      <div className="flex justify-center">
                        <a
                          href={previewFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black text-[#000080] uppercase tracking-widest hover:underline flex items-center gap-2"
                        >
                          <Maximize2 className="w-3 h-3" /> Ver em Tela Cheia
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="text-center p-20 bg-white rounded-[40px] border border-gray-100 shadow-sm max-w-md">
                    <Lock className="w-12 h-12 text-[#000080] mx-auto mb-4 opacity-20" />
                    <p className="font-black text-xs uppercase tracking-widest text-[#000080] mb-2">Formato não suportado no preview</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Tipo: {previewFile.type}
                    </p>
                    <button
                      onClick={() => downloadFile(previewFile)}
                      className="mt-6 px-8 py-3 bg-gray-50 text-[#000080] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#000080] hover:text-white transition-all w-full"
                    >
                      <Download className="w-4 h-4 inline-block mr-2" /> Baixar para Visualizar
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#000033]/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsUploadModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-[#000080] flex items-center gap-3"><ArrowUpCircle className="w-6 h-6" /> Novo Upload</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleFileUpload} className="p-8 space-y-6">
              <select className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none" onChange={e => setUploadData({ ...uploadData, folder: e.target.value })}>
                {visibleFolders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input type="file" required className="w-full px-5 py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[30px] font-bold text-sm" onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })} />
              {uploadError && <p className="text-red-500 text-xs font-bold text-center">{uploadError}</p>}
              <button disabled={isUploading} className="w-full py-5 bg-[#000080] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 mt-4 disabled:opacity-70 flex items-center justify-center gap-2">
                {isUploading ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Enviando...</> : 'Concluir Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesModule;
