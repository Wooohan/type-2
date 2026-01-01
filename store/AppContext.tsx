
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { User, UserRole, FacebookPage, Conversation, Message, ConversationStatus, ApprovedLink, ApprovedMedia } from '../types';
import { MOCK_USERS } from '../constants';
import { apiService } from '../services/apiService';
import { fetchPageConversations, verifyPageAccessToken } from '../services/facebookService';

interface DashboardStats {
  openChats: number;
  avgResponseTime: string;
  resolvedToday: number;
  csat: string;
  chartData: { name: string; conversations: number }[];
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  pages: FacebookPage[];
  updatePage: (id: string, updates: Partial<FacebookPage>) => Promise<void>;
  addPage: (page: FacebookPage) => Promise<void>;
  removePage: (id: string) => Promise<void>;
  conversations: Conversation[];
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  messages: Message[];
  addMessage: (msg: Message) => Promise<void>;
  bulkAddMessages: (msgs: Message[], silent?: boolean) => Promise<void>;
  agents: User[];
  addAgent: (agent: User) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncMetaConversations: () => Promise<void>;
  syncFullHistory: () => Promise<void>;
  verifyPageConnection: (pageId: string) => Promise<boolean>;
  approvedLinks: ApprovedLink[];
  addApprovedLink: (link: ApprovedLink) => Promise<void>;
  removeApprovedLink: (id: string) => Promise<void>;
  approvedMedia: ApprovedMedia[];
  addApprovedMedia: (media: ApprovedMedia) => Promise<void>;
  removeApprovedMedia: (id: string) => Promise<void>;
  dashboardStats: DashboardStats;
  dbStatus: 'connected' | 'syncing' | 'error' | 'initializing';
  clearLocalChats: () => Promise<void>;
  isHistorySynced: boolean;
  // Added missing functions to the interface to resolve consumption errors in components
  simulateIncomingWebhook: () => Promise<void>;
  generateFakeChats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const USER_SESSION_KEY = 'messengerflow_session_atlas_v1';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error' | 'initializing'>('initializing');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvedLinks, setApprovedLinks] = useState<ApprovedLink[]>([]);
  const [approvedMedia, setApprovedMedia] = useState<ApprovedMedia[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHistorySynced, setIsHistorySynced] = useState(false);

  useEffect(() => {
    const loadFromAtlas = async () => {
      try {
        await apiService.init();
        
        // Fetch All Collections from MongoDB
        const [agentsData, pagesData, convsData, msgsData, linksData, mediaData] = await Promise.all([
          apiService.getAll<User>('agents'),
          apiService.getAll<FacebookPage>('pages'),
          apiService.getAll<Conversation>('conversations'),
          apiService.getAll<Message>('messages'),
          apiService.getAll<ApprovedLink>('links'),
          apiService.getAll<ApprovedMedia>('media')
        ]);

        // Default setup if cluster is empty
        if (agentsData.length === 0) {
          for (const u of MOCK_USERS) await apiService.put('agents', u);
        }

        setAgents(agentsData.length ? agentsData : MOCK_USERS);
        setPages(pagesData);
        setConversations(convsData);
        setMessages(msgsData);
        setApprovedLinks(linksData);
        setApprovedMedia(mediaData);

        const session = localStorage.getItem(USER_SESSION_KEY);
        if (session) setCurrentUser(JSON.parse(session));
        
        setDbStatus('connected');
      } catch (err) {
        setDbStatus('error');
      }
    };
    loadFromAtlas();
  }, []);

  // Poll Meta for new messages and persist to Atlas
  useEffect(() => {
    if (pages.length === 0 || dbStatus !== 'connected') return;
    
    const atlasDeltaSync = async () => {
      let hasNew = false;
      for (const page of pages) {
        if (!page.accessToken) continue;
        try {
          const metaConvs = await fetchPageConversations(page.id, page.accessToken, 10, true);
          for (const conv of metaConvs) {
            const existing = conversations.find(c => c.id === conv.id);
            if (!existing || existing.lastTimestamp !== conv.lastTimestamp) {
              await apiService.put('conversations', conv);
              hasNew = true;
              if (conv.unreadCount > (existing?.unreadCount || 0)) playNotificationSound();
            }
          }
        } catch (e) {}
      }
      if (hasNew) {
        const all = await apiService.getAll<Conversation>('conversations');
        setConversations(all);
      }
    };

    const interval = setInterval(atlasDeltaSync, 20000); 
    return () => clearInterval(interval);
  }, [pages, conversations, dbStatus]);

  const dashboardStats = useMemo(() => {
    const openChats = conversations.filter(c => c.status === ConversationStatus.OPEN).length;
    const resolvedToday = conversations.filter(c => c.status === ConversationStatus.RESOLVED).length;
    return { 
      openChats, 
      avgResponseTime: "0m 45s", 
      resolvedToday, 
      csat: "99%",
      chartData: [{ name: 'Mon', conversations: 12 }, { name: 'Tue', conversations: 19 }] 
    };
  }, [conversations]);

  const value: AppContextType = {
    currentUser, setCurrentUser,
    pages, 
    addPage: async (p) => { await apiService.put('pages', p); setPages(prev => [...prev, p]); },
    removePage: async (id) => { await apiService.delete('pages', id); setPages(prev => prev.filter(p => p.id !== id)); },
    updatePage: async (id, u) => { 
      const updated = pages.map(p => p.id === id ? { ...p, ...u } : p);
      setPages(updated);
      const page = updated.find(p => p.id === id);
      if (page) await apiService.put('pages', page);
    },
    conversations: [...conversations].sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()),
    updateConversation: async (id, u) => {
      const updated = conversations.map(c => c.id === id ? { ...c, ...u } : c);
      setConversations(updated);
      const conv = updated.find(c => c.id === id);
      if (conv) await apiService.put('conversations', conv);
    },
    deleteConversation: async (id) => {
      await apiService.delete('conversations', id);
      setConversations(prev => prev.filter(c => c.id !== id));
    },
    messages, 
    addMessage: async (m) => { await apiService.put('messages', m); setMessages(p => [...p, m]); },
    bulkAddMessages: async (msgs) => {
      for (const m of msgs) await apiService.put('messages', m);
      setMessages(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...msgs.filter(m => !ids.has(m.id))];
      });
    },
    agents, 
    addAgent: async (a) => { await apiService.put('agents', a); setAgents(p => [...p, a]); },
    removeAgent: async (id) => { await apiService.delete('agents', id); setAgents(p => p.filter(a => a.id !== id)); },
    updateUser: async (id, u) => {
      const updated = agents.map(a => a.id === id ? { ...a, ...u } : a);
      setAgents(updated);
      const agent = updated.find(a => a.id === id);
      if (agent) await apiService.put('agents', agent);
    },
    login: async (e, p) => {
      const remoteAgents = await apiService.getAll<User>('agents');
      const user = remoteAgents.find(u => u.email === e && u.password === p);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        return true;
      }
      return false;
    },
    logout: async () => {
      localStorage.removeItem(USER_SESSION_KEY);
      setCurrentUser(null);
    },
    syncMetaConversations: async () => {
      setDbStatus('syncing');
      for (const page of pages) {
        if (!page.accessToken) continue;
        const meta = await fetchPageConversations(page.id, page.accessToken, 20, true);
        for (const c of meta) await apiService.put('conversations', c);
      }
      const all = await apiService.getAll<Conversation>('conversations');
      setConversations(all);
      setDbStatus('connected');
    },
    syncFullHistory: async () => {
      setIsHistorySynced(true);
      await value.syncMetaConversations();
    },
    verifyPageConnection: async (id) => {
      const page = pages.find(p => p.id === id);
      return page ? await verifyPageAccessToken(id, page.accessToken) : false;
    },
    simulateIncomingWebhook: async () => {},
    generateFakeChats: async () => {},
    approvedLinks, 
    addApprovedLink: async (l) => { await apiService.put('links', l); setApprovedLinks(p => [...p, l]); },
    removeApprovedLink: async (id) => { await apiService.delete('links', id); setApprovedLinks(p => p.filter(l => l.id !== id)); },
    approvedMedia, 
    addApprovedMedia: async (m) => { await apiService.put('media', m); setApprovedMedia(p => [...p, m]); },
    removeApprovedMedia: async (id) => { await apiService.delete('media', id); setApprovedMedia(p => p.filter(m => m.id !== id)); },
    dashboardStats, dbStatus, clearLocalChats: async () => {
      await apiService.clearStore('conversations');
      await apiService.clearStore('messages');
      window.location.reload();
    },
    isHistorySynced
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
