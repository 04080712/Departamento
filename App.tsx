import React, { useState, useRef, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Search, Menu, Monitor, Camera, Loader2, XCircle, X
} from 'lucide-react';

// --- COMPONENTES ---
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DemandsList from './components/DemandsList';
import DemandDetail from './components/DemandDetail';
import NewDemandModal from './components/NewDemandModal';
import ReportsModule from './components/ReportsModule';
import SettingsModule from './components/SettingsModule';
import FilesModule from './components/FilesModule';
import SellerTrackingModule from './components/SellerTrackingModule';
import NotificationBell from './components/NotificationBell';

// --- TIPOS E DEFINIÇÕES ---
import {
  TechnicalDemand, User, TaskStatus, TechnicalFile,
  UserRole, ServiceRequest, AppNotification
} from './types.ts';

// --- SERVIÇOS (Supabase / API) ---
import { supabase } from './services/supabaseClient';
import { signIn, signOut, getCurrentUser, onAuthStateChange } from './services/authService';
import { getDemands, createDemand, updateDemand, deleteDemand, getDemandById } from './services/demandsService';
import { getFiles, uploadFile, deleteFile } from './services/filesService';
import { getUsers, getAllFolderRestrictions, toggleFolderRestriction } from './services/usersService';
import {
  getServiceRequests, createServiceRequest, acceptServiceRequest,
  finalizeServiceRequest, checkOverdueServiceRequests
} from './services/serviceRequestsService';
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotificationsByServiceRequestId
} from './services/notificationsService';

const App: React.FC = () => {
  // ==========================================
  // ESTADOS DE DADOS (DATABASE)
  // ==========================================
  const [user, setUser] = useState<User | null>(null);               // Usuário logado
  const [users, setUsers] = useState<User[]>([]);                    // Lista de todos os usuários
  const [demands, setDemands] = useState<TechnicalDemand[]>([]);   // Demandas técnicas
  const [files, setFiles] = useState<TechnicalFile[]>([]);           // Arquivos na central
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]); // OS (Solicitações)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);    // Notificações
  const [folderRestrictions, setFolderRestrictions] = useState<Record<string, string[]>>({}); // Permissões

  // ==========================================
  // ESTADOS DE INTERFACE (UI)
  // ==========================================
  const [isLoading, setIsLoading] = useState(true);                  // Loading inicial do app
  const [isAuthLoading, setIsAuthLoading] = useState(false);        // Loading de login/logout
  const [authError, setAuthError] = useState('');                   // Erro de autenticação
  const [appError, setAppError] = useState<string | null>(null);     // Erro crítico de banco/config
  const [activeTab, setActiveTab] = useState<string>(() => {         // Aba atual (Dashboard, Demandas, etc)
    return localStorage.getItem('portal_active_tab') || 'dashboard';
  });
  const [selectedDemand, setSelectedDemand] = useState<TechnicalDemand | null>(null); // Demanda em detalhes
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null); // OS em detalhes

  // Modais e Painéis
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);       // Modal de nova demanda
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);         // Sidebar mobile
  const [isPreviewMode, setIsPreviewMode] = useState(false);         // Modo monitor/TV (Preview)
  const [isCapturing, setIsCapturing] = useState(false);             // Estado de screenshot

  // Busca Global
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ==========================================
  // REFERÊNCIAS (REFS)
  // ==========================================
  const searchContainerRef = useRef<HTMLDivElement>(null);           // Container da busca global
  const dashboardRef = useRef<HTMLDivElement>(null);                 // Ref para captura de tela do dashboard
  const isLoadingData = useRef(false);                               // Flag para evitar loops de sincronização
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);           // Timer para debounce do Realtime
  const lastActivityRef = useRef<number>(Date.now());                // Timestamp da última atividade
  // ==========================================
  // SINCRONIZAÇÃO DE DADOS (SYNC & REALTIME)
  // ==========================================

  /**
   * Função principal para carregar todos os dados do banco.
   * Suporta atualizações "silenciosas" (sem travar a UI).
   */
  const loadData = async (options: { skipOverdueCheck?: boolean } = {}) => {
    if (isLoadingData.current) return;
    isLoadingData.current = true;

    console.log(`[App] Sincronizando dados (OverdueCheck: ${!options.skipOverdueCheck})...`);
    try {
      // 1. Verifica OS em atraso (regra de negócio de 7 dias)
      if (!options.skipOverdueCheck) {
        await checkOverdueServiceRequests();
      }

      // 2. Busca todos os dados em paralelo para melhor performance
      const [demandsData, filesData, usersData, restrictionsData, srData, notifData] = await Promise.all([
        getDemands(),
        getFiles(),
        getUsers(),
        getAllFolderRestrictions(),
        getServiceRequests(),
        getNotifications(),
      ]);

      // 3. Atualiza os estados locais com os dados do banco
      setDemands(demandsData);
      setFiles(filesData);
      setUsers(usersData);
      setFolderRestrictions(restrictionsData);
      setServiceRequests(srData);
      setNotifications(notifData);

      console.log('[App] Dados sincronizados com sucesso.');
    } catch (err: any) {
      console.error('[App] Erro ao sincronizar dados:', err);
      // Tratamento especial para erro de token/sessão
      if (err.message?.includes('JWT')) {
        setAppError('Sessão expirada. Por favor, faça login novamente.');
      }
    } finally {
      isLoadingData.current = false;
    }
  };

  /**
   * Debounce para o Realtime.
   * Evita recarregar o app 10 vezes se 10 coisas mudarem ao mesmo tempo.
   */
  const debouncedSync = () => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      loadData({ skipOverdueCheck: true });
    }, 1000);
  };

  // ==========================================
  // EFEITOS (SIDE EFFECTS)
  // ==========================================

  /**
   * useEffect de Inicialização: 
   * Roda uma vez quando o app abre.
   */
  useEffect(() => {
    const init = async () => {
      console.log('[App] Iniciando aplicação...');
      try {
        // Verifica se já existe um usuário logado no navegador
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          // Se logado, carrega os dados iniciais
          await loadData();

          // Redirecionamento automático por cargo (Vendedores)
          const savedTab = localStorage.getItem('portal_active_tab');
          if (!savedTab && (
            currentUser.role === UserRole.VENDEDOR ||
            currentUser.role === UserRole.REGIONAL_ADMIN ||
            currentUser.role === UserRole.VENDEDOR_LS ||
            currentUser.role === UserRole.REGIONAL_ADMIN_LS
          )) {
            setActiveTab('tracking');
          }
        }
      } catch (err: any) {
        console.error('[App] Erro na inicialização:', err);
        setAppError(`Erro crítico na inicialização: ${err.message || 'Erro desconhecido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Listener de AUTH: Reage a Login/Logout em tempo real
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      console.log('[App] Mudança detectada no estado de autenticação.');
      setUser(authUser);
      if (authUser) {
        await loadData();
      } else {
        // Limpa tudo ao deslogar
        setDemands([]);
        setFiles([]);
        setUsers([]);
        setFolderRestrictions({});
        setServiceRequests([]);
        setNotifications([]);
      }
    });

    /**
     * Listener de VISIBILIDADE: 
     * Revalida a sessão quando o usuário volta para a aba (evita hangs).
     */
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('[App] Aba focada. Validando sessão...');
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();
          if (error || !session) {
            const authUser = await getCurrentUser();
            if (!authUser) {
              console.warn('[App] Sessão expirada.');
              setUser(null);
              return;
            }
          }
          loadData({ skipOverdueCheck: true });
        } catch (e) {
          console.error('[App] Erro ao revalidar sessão:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    /**
     * REALTIME: Assina canais do Supabase para atualizações automáticas.
     */
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_demands' }, () => {
        console.log('[Realtime] Mudança em demandas.');
        debouncedSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        console.log('[Realtime] Mudança em OS.');
        debouncedSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        console.log('[Realtime] Nova notificação.');
        debouncedSync();
      })
      .subscribe();

    /**
     * POLLING: Backup de segurança a cada 5 minutos.
     */
    const pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        console.log('[Polling] Sincronização de fundo...');
        loadData();
      }
    }, 5 * 60 * 1000);

    // Cleanup: Limpa event listeners e timers ao desmontar o componente
    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]);

  /**
   * MONITOR DE INATIVIDADE E HEARTBEAT:
   * Mantém a conexão ativa enviando um sinal (heartbeat) a cada 3s
   * e atualiza a página após 1 minuto de inatividade.
   */
  useEffect(() => {
    if (!user) return;

    const HEARTBEAT_INTERVAL = 3000; // 3 segundos para manter o socket vivo
    const IDLE_TIMEOUT = 60000;     // 1 minuto de inatividade total

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Registrar eventos de atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, handleActivity));

    // Heartbeat: Pequena query para evitar timeout de proxy/firewall
    const heartbeatInterval = setInterval(async () => {
      try {
        await supabase.from('users').select('id').limit(1).single();
        console.log('[App] Heartbeat enviado.');
      } catch (err) {
        console.warn('[App] Falha no heartbeat:', err);
      }
    }, HEARTBEAT_INTERVAL);

    // Verificação de inatividade
    const idleInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > IDLE_TIMEOUT) {
        console.warn('[App] Inatividade detectada por mais de 1 minuto. Atualizando...');
        window.location.reload();
      }
    }, 5000); // Check a cada 5 segundos

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      clearInterval(heartbeatInterval);
      clearInterval(idleInterval);
    };
  }, [user?.id]);

  /**
   * Persistência da aba ativa no LocalStorage.
   */
  useEffect(() => {
    if (activeTab && user) {
      localStorage.setItem('portal_active_tab', activeTab);
    }
  }, [activeTab, user]);

  // ==========================================
  // BUSCA GLOBAL
  // ==========================================
  const searchResults = useMemo(() => {
    if (!globalSearchTerm.trim()) return { demands: [], files: [] };
    const term = globalSearchTerm.toLowerCase();

    const filteredDemands = demands.filter(d =>
      d.title.toLowerCase().includes(term) ||
      d.company.toLowerCase().includes(term) ||
      d.id.toLowerCase().includes(term)
    ).slice(0, 5);

    const filteredFiles = files.filter(f =>
      f.name.toLowerCase().includes(term) ||
      f.folder.toLowerCase().includes(term)
    ).slice(0, 5);

    return { demands: filteredDemands, files: filteredFiles };
  }, [globalSearchTerm, demands, files]);


  // ==========================================
  // HANDLERS: AUTENTICAÇÃO
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    const target = e.target as any;
    try {
      const loggedUser = await signIn(target.email.value, target.password.value);
      setUser(loggedUser);
      // Vendedores vão direto para o módulo de acompanhamento
      if (
        loggedUser.role === UserRole.VENDEDOR ||
        loggedUser.role === UserRole.REGIONAL_ADMIN ||
        loggedUser.role === UserRole.VENDEDOR_LS ||
        loggedUser.role === UserRole.REGIONAL_ADMIN_LS
      ) {
        setActiveTab('tracking');
      }
    } catch (err: any) {
      setAuthError('Email ou senha inválidos.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setActiveTab('dashboard');
    setSelectedDemand(null);
  };


  // ==========================================
  // HANDLERS: UTILITÁRIOS (UI/SNAPSHOT)
  // ==========================================
  const handleEnterPreview = async () => {
    setIsPreviewMode(true);
    await loadData();
  };

  const handleCaptureScreen = async () => {
    if (!dashboardRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      window.scrollTo(0, 0);
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f3f4f6',
        onclone: (clonedDoc: Document) => {
          // Limpeza de estilos não suportados pelo html2canvas (oklch/oklab)
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const tag = styleTags[i];
            if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
              tag.innerHTML = tag.innerHTML.replace(/oklch\([^)]+\)/g, '#666');
              tag.innerHTML = tag.innerHTML.replace(/oklab\([^)]+\)/g, '#666');
            }
          }
        }
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `SNAPSHOT_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err: any) {
      console.error("[Snapshot] Erro:", err);
      alert(`Falha na captura: ${err.message}`);
    } finally {
      setIsCapturing(false);
    }
  };


  // ==========================================
  // HANDLERS: DEMANDAS TÉCNICAS
  // ==========================================
  const handleCreateDemand = async (demandData: Omit<TechnicalDemand, 'id' | 'createdAt' | 'updatedAt' | 'files'>) => {
    if (!user) return;
    try {
      const newDemand = await createDemand(demandData, user.id);
      setDemands(prev => [newDemand, ...prev]);
    } catch (err: any) {
      alert(`Erro ao criar demanda: ${err.message}`);
      throw err;
    }
  };

  const handleUpdateDemand = async (updated: TechnicalDemand) => {
    try {
      const savedDemand = await updateDemand(updated.id, updated);
      setDemands(prev => prev.map(d => d.id === savedDemand.id ? savedDemand : d));
      setSelectedDemand(savedDemand);
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteDemand = async (id: string) => {
    try {
      await deleteDemand(id);
      setDemands(prev => prev.filter(d => d.id !== id));
      setSelectedDemand(null);
    } catch (err: any) {
      alert(`Erro na exclusão: ${err.message}`);
    }
  };

  const handleViewDemand = async (demand: TechnicalDemand) => {
    try {
      if (demand.files && demand.files.length > 0 && demand.description) {
        setSelectedDemand(demand);
        return;
      }
      const fullDemand = await getDemandById(demand.id);
      setSelectedDemand(fullDemand);
    } catch (err: any) {
      alert('Não foi possível carregar os detalhes da demanda.');
    }
  };


  // ==========================================
  // HANDLERS: SOLICITAÇÕES DE SERVIÇO (OS)
  // ==========================================
  const handleCreateServiceRequest = async (data: any) => {
    if (!user) return;
    try {
      let pdf_url = undefined;
      const categoryFolder = data.category || 'Geral';

      // 1. Upload do PDF se existir
      if (data.pdfBlob) {
        const fileName = `Solicitacao_${Date.now()}.pdf`;
        const file = new File([data.pdfBlob], fileName, { type: 'application/pdf' });
        const uploadedFile = await uploadFile(file, `Solicitacoes_Servico/${categoryFolder}`, user.id);
        pdf_url = uploadedFile.url;
        await uploadFile(file, `Solicitação de Serviço/${categoryFolder}`, user.id); // Cópia para Central
      }

      // 2. Upload das fotos
      let photoUrls: string[] = [];
      if (data.photos?.length > 0) {
        const uploadPromises = data.photos.map(async (photoFile: File, index: number) => {
          const fileName = `Foto_${index}_${Date.now()}.jpg`;
          const uploaded = await uploadFile(photoFile, `Solicitacoes_Servico/${categoryFolder}/Fotos`, user.id);
          return uploaded.url;
        });
        photoUrls = await Promise.all(uploadPromises);
      }

      // 3. Cria a OS no banco
      const newRequest = await createServiceRequest({ ...data, pdfUrl: pdf_url, photos: photoUrls });
      setServiceRequests(prev => [newRequest, ...prev]);

      // 4. Cria notificações para equipe técnica e regional
      const adminTechNotif = ['ADMIN', 'CONTRIBUTOR'].map(role =>
        createNotification({
          type: 'SERVICE_REQUEST',
          title: `Nova solicitação: ${data.title}`,
          message: `${user.name} enviou uma nova OS.`,
          serviceRequestId: newRequest.id,
          targetRole: role,
        })
      );

      let regionalNotif: any[] = [];
      if (data.region || user.region) {
        const targetRegion = data.region || user.region;
        const regionalAdmins = users.filter(u => u.role === UserRole.REGIONAL_ADMIN && u.region === targetRegion);
        regionalNotif = regionalAdmins.map(admin => createNotification({
          type: 'SERVICE_REQUEST',
          title: `Nova demanda regional (${targetRegion}): ${data.title}`,
          message: `${user.name} solicitou um serviço em sua região.`,
          serviceRequestId: newRequest.id,
          targetUserId: admin.id,
        }));
      }

      const allNotifs = await Promise.all([...adminTechNotif, ...regionalNotif]);
      setNotifications(prev => [...allNotifs, ...prev]);
    } catch (err: any) {
      alert(`Erro ao criar solicitação: ${err.message}`);
      throw err;
    }
  };

  const handleAcceptServiceRequest = async (id: string) => {
    if (!user) return;
    try {
      const updated = await acceptServiceRequest(id, user.id);
      setServiceRequests(prev => prev.map(r => r.id === id ? updated : r));

      // Cria Demanda Técnica automática ao aceitar OS
      try {
        const newDemand = await createDemand({
          title: `[OS #${updated.id.substring(0, 5)}] ${updated.title}`,
          description: `Vinculada à OS #${updated.id}\n\n${updated.description}`,
          status: TaskStatus.OPEN,
          priority: 'MEDIUM',
          company: updated.requesterRegion || 'Regional',
          sector: (updated.category as any) || 'ADM',
          requester: updated.requesterEmail,
          type: updated.category === 'Teste' ? 'TESTE' : 'ATENDIMENTO',
          channel: 'EMAIL',
          assignedTo: user.id,
          createdBy: user.id,
          technicalDetails: `Amostra: ${updated.hasSample ? 'SIM' : 'NÃO'}`
        }, user.id);
        setDemands(prev => [newDemand, ...prev]);
      } catch (e) { console.error("Erro na demanda auto:", e); }

      // Limpa notificações da OS e cria novas para o solicitante
      await deleteNotificationsByServiceRequestId(id);
      setNotifications(prev => prev.filter(n => n.serviceRequestId !== id));

      const resNotif = await createNotification({
        type: 'SERVICE_REQUEST',
        title: `Sua solicitação foi aceita`,
        message: `${user.name} aceitou sua demanda: ${updated.title}`,
        serviceRequestId: id,
        targetUserId: updated.requesterId,
      });
      setNotifications(prev => [resNotif, ...prev]);
    } catch (err: any) {
      alert(`Erro ao aceitar: ${err.message}`);
    }
  };

  const handleFinalizeServiceRequest = async (id: string, updates?: { technicalActions: string; file: File | null }) => {
    if (!user) return;
    try {
      let final_report_url = undefined;
      const request = serviceRequests.find(r => r.id === id);
      const categoryFolder = request?.category || 'Geral';

      if (updates?.file) {
        const uploadedFile = await uploadFile(updates.file, `Relatorios_Servico/${categoryFolder}`, user.id);
        final_report_url = uploadedFile.url;
      }

      const updated = await finalizeServiceRequest(id, {
        finalizationDescription: updates?.technicalActions,
        finalReportUrl: final_report_url
      });

      setServiceRequests(prev => prev.map(r => r.id === id ? updated : r));

      const finishNotif = await createNotification({
        type: 'SERVICE_REQUEST',
        title: `Serviço Concluído: ${request?.title}`,
        message: `Sua OS foi finalizada com sucesso.`,
        serviceRequestId: id,
        targetUserId: request?.requesterId,
      });
      setNotifications(prev => [finishNotif, ...prev]);
    } catch (err: any) {
      alert(`Erro ao finalizar: ${err.message}`);
    }
  };


  // ==========================================
  // HANDLERS: ARQUIVOS E NOTIFICAÇÕES
  // ==========================================
  const handleUploadFile = async (file: File, folder: string, demandId?: string) => {
    if (!user) return;
    try {
      const newFile = await uploadFile(file, folder, user.id, demandId);
      setFiles(prev => [newFile, ...prev]);
    } catch (err: any) {
      alert(`Erro no upload: ${err.message}`);
      throw err;
    }
  };

  const handleDeleteFile = async (id: string) => {
    try { await deleteFile(id); setFiles(prev => prev.filter(f => f.id !== id)); } catch (e) { console.error(e); }
  };

  const handleUpdateRestrictions = async (userId: string, folder: string) => {
    const current = folderRestrictions[userId] || [];
    try {
      await toggleFolderRestriction(userId, folder, current);
      setFolderRestrictions(prev => ({
        ...prev,
        [userId]: current.includes(folder) ? current.filter(f => f !== folder) : [...current, folder]
      }));
    } catch (e) { console.error(e); }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await markNotificationAsRead(notificationId, user.id);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, readBy: [...n.readBy, user.id] } : n));
    } catch (e) { console.error(e); }
  };

  const handleViewServiceRequest = (requestId: string) => {
    const request = serviceRequests.find(r => r.id === requestId);
    if (request) { setSelectedServiceRequest(request); setActiveTab('tracking'); }
  };


  // ==========================================
  // LOGICA DE RENDERIZAÇÃO (MAIN CONTENT)
  // ==========================================
  const renderContent = () => {
    // Se houver uma demanda selecionada, mostra os detalhes dela antes de tudo
    if (selectedDemand) {
      return (
        <DemandDetail
          demand={selectedDemand}
          onBack={() => setSelectedDemand(null)}
          onUpdate={handleUpdateDemand}
          onDelete={handleDeleteDemand}
          users={users}
          userRole={user!.role}
          onAutoSaveFile={handleUploadFile}
        />
      );
    }

    // Renderiza o módulo da aba ativa
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard demands={demands} serviceRequests={serviceRequests} users={users} onAddDemand={() => setIsNewModalOpen(true)} onViewDemand={handleViewDemand} />;

      case 'demands':
        return <DemandsList demands={demands} users={users} currentUser={user!} onAddDemand={() => setIsNewModalOpen(true)} onViewDemand={handleViewDemand} />;

      case 'tracking':
        return (
          <SellerTrackingModule
            user={user!}
            users={users}
            serviceRequests={serviceRequests}
            selectedRequest={selectedServiceRequest}
            onSelectRequest={setSelectedServiceRequest}
            onCreateRequest={handleCreateServiceRequest}
            onAcceptRequest={handleAcceptServiceRequest}
            onFinalizeRequest={handleFinalizeServiceRequest}
          />
        );

      case 'files':
        return (
          <FilesModule
            files={files}
            userRole={user!.role}
            restrictedFolders={folderRestrictions[user!.id] || []}
            onUpload={handleUploadFile}
            onDelete={handleDeleteFile}
          />
        );

      case 'reports': return <ReportsModule />;

      case 'settings':
        return (
          <SettingsModule
            user={user!}
            onUpdateUser={(u) => setUser(u)}
            users={users}
            onCreateUser={(nu) => setUsers(prev => [...prev, nu])}
            folderRestrictions={folderRestrictions}
            onUpdateRestrictions={handleUpdateRestrictions}
          />
        );

      default:
        return <Dashboard demands={demands} serviceRequests={serviceRequests} users={users} />;
    }
  };

  // Tela de erro global
  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-lg text-center">
          <div className="bg-red-100 p-6 rounded-[32px] w-fit mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-red-900 mb-4">Falha na Inicialização</h2>
          <p className="text-gray-600 mb-8 font-medium">{appError}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setAppError(null);
                loadData();
              }}
              className="px-10 py-4 bg-[#000080] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl"
            >
              Reconectar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Recarregar (F5)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de loading inicial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#000080] animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFFAFA]">
        <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#000080] p-6 rounded-[32px] mb-6 shadow-xl w-full flex justify-center">
              <img src="https://www.similar.ind.br/wp-content/uploads/2020/10/logo-200-whiter.png" alt="Logo Similar" className="h-14" />
            </div>
            <h1 className="text-2xl font-black text-[#000080]">Portal Técnico</h1>
            <p className="text-gray-500 text-sm mt-1">Departamento de Engenharia Similar</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <input name="email" type="email" required className="w-full px-6 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" placeholder="E-mail Corporativo" />
            <input name="password" type="password" required className="w-full px-6 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" placeholder="Senha" />
            {authError && (
              <p className="text-red-500 text-xs font-bold text-center">{authError}</p>
            )}
            <button
              disabled={isAuthLoading}
              className="w-full bg-[#000080] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-xl active:scale-95 mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {isAuthLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <button onClick={handleEnterPreview} className="w-full mt-6 bg-white text-gray-500 border border-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-3">
            Painel Público
          </button>
        </div>
      </div>
    );
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 animate-in fade-in flex flex-col gap-8">
        <header className="flex items-center justify-between border-b pb-6">
          <h1 className="text-xl font-black text-[#000080]">MONITORAMENTO OPERACIONAL</h1>
          <div className="flex gap-2">
            <button onClick={handleCaptureScreen} className="bg-white px-6 py-3 rounded-2xl text-xs font-black uppercase border">{isCapturing ? 'Gerando...' : 'Capturar Snapshot'}</button>
            <button onClick={() => setIsPreviewMode(false)} className="bg-[#000080] text-white px-8 py-3 rounded-2xl text-xs font-black uppercase">Sair</button>
          </div>
        </header>
        <div ref={dashboardRef}><Dashboard demands={demands} serviceRequests={serviceRequests} users={users} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user!.role} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 p-4 md:p-8 min-h-screen">
        <header className="flex items-center justify-between mb-8 pb-6 border-b gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border rounded-2xl text-[#000080] hover:bg-gray-50"><Menu className="w-6 h-6" /></button>
            <div className="relative hidden lg:block" ref={searchContainerRef}>
              <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border w-96">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Busca global..." className="bg-transparent border-none outline-none text-sm w-full" value={globalSearchTerm} onChange={(e) => setGlobalSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} />
              </div>
              {isSearchFocused && globalSearchTerm && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border rounded-[32px] shadow-2xl z-[120] p-4">
                  <h4 className="px-4 mb-2 text-[10px] font-black text-gray-400 uppercase">Resultados</h4>
                  {searchResults.demands.map(d => <button key={d.id} onClick={() => { setActiveTab('demands'); handleViewDemand(d); setGlobalSearchTerm(''); }} className="w-full text-left p-3 hover:bg-blue-50 rounded-xl text-xs font-bold">{d.title}</button>)}
                  {searchResults.demands.length === 0 && searchResults.files.length === 0 && (
                    <p className="text-center text-xs text-gray-400 py-4">Nenhum resultado encontrado</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell
              notifications={notifications}
              user={user!}
              users={users}
              onMarkAsRead={handleMarkNotificationAsRead}
              onAcceptRequest={handleAcceptServiceRequest}
              onViewRequest={handleViewServiceRequest}
            />
            <div className="flex items-center gap-3 bg-white border p-1.5 pr-4 rounded-2xl">
              <img src={user!.avatar} className="w-10 h-10 md:w-14 md:h-14 rounded-xl object-cover" />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-950 leading-none">{user!.name}</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">{user!.role}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
      </main>
      {isNewModalOpen && (
        <NewDemandModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={(d) => handleCreateDemand({ ...d, status: TaskStatus.OPEN })}
          users={users}
        />
      )}
    </div>
  );
};

export default App;
