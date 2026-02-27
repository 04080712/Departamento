import React, { useRef, useState } from 'react';
import {
  User as UserIcon, Camera, Lock, Eye, EyeOff,
  FolderLock, Check, UserPlus, Users, X,
  ShieldAlert, Mail, Shield, ArrowRight, UserCheck, Loader2
} from 'lucide-react';
import { User, UserRole } from '../types';
import { FOLDER_STRUCTURE } from '../constants';
import { createUser, updateUserProfile } from '../services/usersService';
import { updatePassword } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface SettingsModuleProps {
  user: User;
  users: User[];
  onUpdateUser: (userData: User) => void;
  onCreateUser: (newUser: User) => void;
  folderRestrictions: Record<string, string[]>;
  onUpdateRestrictions: (userId: string, folder: string) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({
  user, users, onUpdateUser, onCreateUser, folderRestrictions, onUpdateRestrictions
}) => {
  const [showPass, setShowPass] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [createError, setCreateError] = useState('');
  const [selectedUserAcl, setSelectedUserAcl] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.CONTRIBUTOR, region: '' });

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const path = `${user.id}/avatar_${Date.now()}.${fileExt}`; // Usar timestamp para evitar cache do navegador

      // Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = data.publicUrl;

      // Atualizar no banco (tabela users)
      await updateUserProfile(user.id, { avatar: avatarUrl });

      // Atualizar estado local do App
      onUpdateUser({ ...user, avatar: avatarUrl });
    } catch (err: any) {
      console.error('Erro ao atualizar avatar:', err);
      alert('Erro ao carregar foto: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setIsCreatingUser(true);
    setCreateError('');

    // Timer de segurança para resetar o loading se a função "sumir"
    const timeoutId = setTimeout(() => {
      if (isCreatingUser) {
        setIsCreatingUser(false);
        setCreateError('A solicitação está demorando mais do que o esperado. Verifique sua conexão.');
      }
    }, 30000); // 30 segundos

    try {
      // Garantir que region seja null se estiver vazio para consistência no banco
      const region = newUser.region.trim() || null;
      console.log('[SettingsModule] Iniciando criação de usuário:', { ...newUser, region });

      const created = await createUser(newUser.email, newUser.password, newUser.name, newUser.role, region || undefined);

      console.log('[SettingsModule] Usuário criado com sucesso:', created);
      onCreateUser(created);
      setIsCreating(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.CONTRIBUTOR, region: '' });
    } catch (err: any) {
      console.error('[SettingsModule] Erro ao criar usuário:', err);
      // Se for o erro do nosso timeout, não sobrepor a mensagem
      if (!createError.includes('demorando')) {
        setCreateError(err.message || 'Erro ao criar usuário.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsCreatingUser(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPassMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setIsSavingPass(true);
    setPassMsg('');
    try {
      await updatePassword(newPassword);
      // Sincronizar o estado local do usuário no App.tsx
      onUpdateUser({ ...user, password_plain: newPassword });
      setPassMsg('Senha atualizada com sucesso! ✅');
      setNewPassword('');
    } catch (err: any) {
      console.error('[Settings] Erro ao salvar senha:', err);
      setPassMsg(err.message || 'Erro ao atualizar senha. ❌');
    } finally {
      setIsSavingPass(false);
      setTimeout(() => setPassMsg(''), 5000);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#000080] tracking-tight">Painel Administrativo</h2>
          <p className="text-gray-500 font-medium">Controle de acesso e identidade corporativa.</p>
        </div>
        {user.role === UserRole.ADMIN && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[#000080] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-900 transition-all flex items-center gap-3 shadow-xl shadow-blue-900/10 active:scale-95"
          >
            <UserPlus className="w-5 h-5" /> Adicionar Colaborador
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Painel Pessoal (Todos) */}
        <div className="xl:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <h3 className="text-lg font-black text-gray-950 mb-10 uppercase tracking-tight flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-blue-600" /> Minha Conta
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative group cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
                <div className={`w-40 h-40 rounded-[40px] overflow-hidden border-[10px] shadow-2xl transition-all duration-500 relative ${isUploadingAvatar ? 'border-blue-100' : 'border-gray-50 group-hover:scale-105'
                  }`}>
                  <img src={user.avatar} alt="Perfil" className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-30 blur-[2px]' : ''}`} />

                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20">
                      <Loader2 className="w-8 h-8 text-[#000080] animate-spin" />
                      <span className="text-[10px] font-black text-[#000080] uppercase mt-2">Enviando...</span>
                    </div>
                  )}
                </div>

                {!isUploadingAvatar && (
                  <div className="absolute inset-0 bg-[#000080]/70 rounded-[40px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white scale-90 group-hover:scale-100">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Trocar Foto</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu Nome</label>
                    <input type="text" defaultValue={user.name} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Privilégio</label>
                    <input type="text" readOnly value={user.role} className="w-full px-5 py-3.5 bg-gray-100 border border-gray-100 rounded-2xl font-bold text-xs text-gray-400 uppercase tracking-widest cursor-not-allowed" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Trocar Senha de Acesso</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-amber-50 pr-12" placeholder="Nova senha (mín. 6 caracteres)" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passMsg && <p className={`text-xs font-bold ${passMsg.includes('sucesso') ? 'text-emerald-600' : 'text-red-500'}`}>{passMsg}</p>}
                </div>
                <button type="button" onClick={handleSavePassword} disabled={isSavingPass} className="bg-[#000080] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center gap-2">
                  {isSavingPass && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>

          {/* Controle de Acesso Reativo (Admin Only) */}
          {user.role === UserRole.ADMIN && (
            <div className="bg-blue-50/50 p-10 rounded-[40px] border border-blue-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-[#000080] uppercase tracking-tight flex items-center gap-3">
                  <FolderLock className="w-6 h-6" /> Restrição de Pastas (ACL)
                </h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. Escolha o Colaborador para Limitar</label>
                  <select
                    value={selectedUserAcl}
                    onChange={(e) => setSelectedUserAcl(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Selecione na lista...</option>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {selectedUserAcl ? (
                  <div className="space-y-4 animate-in fade-in">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. Marcar Pastas que devem ser OCULTADAS para este usuário</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FOLDER_STRUCTURE.map(folder => {
                        const isRestricted = folderRestrictions[selectedUserAcl]?.includes(folder);
                        return (
                          <button
                            key={folder}
                            onClick={() => onUpdateRestrictions(selectedUserAcl, folder)}
                            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${isRestricted
                              ? 'bg-red-50 border-red-200 text-red-900 shadow-md'
                              : 'bg-white border-transparent text-gray-400 hover:border-blue-100'
                              }`}
                          >
                            <span className="text-[10px] font-black uppercase truncate pr-4">{folder}</span>
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors relative ${isRestricted ? 'bg-red-500' : 'bg-gray-200'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isRestricted ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center bg-white/40 rounded-[32px] border-2 border-dashed border-gray-100">
                    <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Selecione um colaborador para ver as permissões</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Lateral */}
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-[#000080] p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden group">
            <Shield className="w-24 h-24 absolute -right-6 -bottom-6 opacity-10" />
            <h4 className="text-2xl font-black mb-4 leading-tight">Política de Identidade</h4>
            <p className="text-sm text-blue-100/70 font-medium leading-relaxed mb-8">
              O administrador pode criar usuários e limitar o acesso a pastas técnicas sensíveis através da Matriz de Governança à esquerda.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/5">
                <Check className="w-4 h-4 text-emerald-400" /> Auditoria Ativa de Login
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/5">
                <Check className="w-4 h-4 text-emerald-400" /> Troca de Senha Criptografada
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Colaboradores Ativos ({users.length})
            </h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-9 h-9 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-950 truncate">{u.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                  </div>
                  {u.role === UserRole.ADMIN && <UserCheck className="w-4 h-4 text-[#000080]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Criar Usuário */}
      {isCreating && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#000033]/70 backdrop-blur-sm animate-in fade-in" onClick={() => setIsCreating(false)} />
          <div className="bg-white w-full max-w-lg rounded-[32px] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-gray-100 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg md:text-xl font-black text-[#000080] flex items-center gap-3"><UserPlus className="w-6 h-6" /> Novo Colaborador</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 md:p-3 hover:bg-white rounded-2xl text-gray-400 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required type="text" placeholder="Nome do Técnico" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="email" placeholder="email@similar.ind.br" className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.CONTRIBUTOR, region: '' })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.CONTRIBUTOR ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>Técnico</button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.ADMIN, region: '' })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.ADMIN ? 'bg-[#000080] border-[#000080] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>Admin</button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.VENDEDOR })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.VENDEDOR ? 'bg-amber-50 border-amber-600 text-amber-600 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>Vendedor</button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.REGIONAL_ADMIN })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.REGIONAL_ADMIN ? 'bg-emerald-50 border-emerald-600 text-emerald-600 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>Admin Regional</button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.VENDEDOR_LS })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.VENDEDOR_LS ? 'bg-amber-100 border-amber-700 text-amber-700 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>Vendedor LS</button>
                  <button type="button" onClick={() => setNewUser({ ...newUser, role: UserRole.REGIONAL_ADMIN_LS })} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${newUser.role === UserRole.REGIONAL_ADMIN_LS ? 'bg-emerald-100 border-emerald-700 text-emerald-700 shadow-md' : 'bg-white border-gray-100 text-gray-400'}`}>Admin Regional LS</button>
                </div>
              </div>
              {(newUser.role === UserRole.VENDEDOR || newUser.role === UserRole.REGIONAL_ADMIN || newUser.role === UserRole.VENDEDOR_LS || newUser.role === UserRole.REGIONAL_ADMIN_LS) && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Região</label>
                  <input type="text" placeholder="Ex: PR, SC, SP" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={newUser.region} onChange={e => setNewUser({ ...newUser, region: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input required type="password" placeholder="Mínimo 6 caracteres" className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
              </div>
              {createError && <p className="text-red-500 text-xs font-bold text-center">{createError}</p>}
              <button disabled={isCreatingUser} className="w-full py-5 bg-[#000080] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 mt-4 disabled:opacity-70 flex items-center justify-center gap-2 flex-shrink-0">
                {isCreatingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreatingUser ? 'Criando...' : 'Criar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
