
import React, { useState, useEffect } from 'react';
import { Settings, Shield, Globe, Bell, User, Database, CheckCircle2, Save, Trash2, AlertTriangle, Loader2, RefreshCw, Key, Code, Cloud, ExternalLink } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';

const SettingsView: React.FC = () => {
  const { currentUser, dbStatus, clearLocalChats, syncFullHistory, updateCloudCredentials } = useApp();
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const [atlasEndpoint, setAtlasEndpoint] = useState(localStorage.getItem('atlas_endpoint') || '');
  const [atlasKey, setAtlasKey] = useState(localStorage.getItem('atlas_api_key') || '');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const handleSaveCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCloud(true);
    await updateCloudCredentials(atlasEndpoint, atlasKey);
    setIsSavingCloud(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Portal Configuration</h2>
          <p className="text-slate-500 text-sm mt-1">Connect your real MongoDB Atlas Cluster0 for multi-device sync.</p>
        </div>
      </div>

      {dbStatus === 'unconfigured' && (
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[40px] animate-shake">
           <div className="flex gap-6 items-start">
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                 <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-amber-800">Connection Required</h3>
                 <p className="text-amber-700 text-sm leading-relaxed">
                   The portal is currently in offline mode. To sync data across devices and store it in your Atlas cluster, you must enable the <strong>Data API</strong> in your MongoDB Atlas Dashboard and provide the credentials below.
                 </p>
                 <a 
                   href="https://www.mongodb.com/docs/atlas/api/data-api/" 
                   target="_blank" 
                   className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-900 hover:underline"
                 >
                   Setup Guide <ExternalLink size={12} />
                 </a>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                 <User size={24} />
              </div>
              <h4 className="font-bold text-slate-800">Zayn Admin</h4>
              <p className="text-xs text-slate-400">Portal Owner</p>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                 <Database size={20} className="text-blue-400" />
                 <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Atlas Engine</h4>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-500">Status</span>
                    <span className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}>
                      {dbStatus.toUpperCase()}
                    </span>
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${dbStatus === 'connected' ? 'bg-emerald-500 w-full' : 'bg-red-500 w-1/4'}`} />
                 </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">
                Region: AWS / us-east-1<br/>
                Cluster: Cluster0
              </p>
           </div>
        </div>

        <div className="md:col-span-2 space-y-6">
           <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-sm">
              <form onSubmit={handleSaveCloud} className="space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="p-3 bg-blue-600 text-white rounded-2xl">
                      <Cloud size={24} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cloud Credentials</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data API Endpoint URL</label>
                    <input 
                      type="url"
                      required
                      placeholder="https://data.mongodb-api.com/app/data-portal-xxxx/endpoint/data/v1"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-mono text-xs"
                      value={atlasEndpoint}
                      onChange={e => setAtlasEndpoint(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atlas API Key</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        type="password"
                        required
                        placeholder="Your Data API Key"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 transition-all font-mono text-xs"
                        value={atlasKey}
                        onChange={e => setAtlasKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSavingCloud}
                  className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  {isSavingCloud ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Connect to Cluster0
                </button>

                {showSuccess && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 size={16} /> Connection Updated
                  </div>
                )}
              </form>
           </div>

           {isAdmin && dbStatus === 'connected' && (
             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <RefreshCw size={20} className="text-emerald-500" />
                  <h3 className="font-bold text-slate-800">Cloud Sync Tools</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={syncFullHistory}
                    className="p-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-3xl border border-blue-100 flex flex-col items-center gap-3 transition-all"
                  >
                    <RefreshCw size={24} />
                    <div className="text-center">
                      <h4 className="text-xs font-black uppercase tracking-tight">Pull Remote History</h4>
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowPurgeConfirm(true)}
                    className="p-6 bg-red-50 hover:bg-red-100 text-red-600 rounded-3xl border border-red-100 flex flex-col items-center gap-3 transition-all"
                  >
                    <Trash2 size={24} />
                    <div className="text-center">
                      <h4 className="text-xs font-black uppercase tracking-tight">Purge Local Cache</h4>
                    </div>
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>

      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">CONFIRM PURGE</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              This will clear the frontend cache. Data remains safe in your <span className="font-bold">Atlas Cluster0</span>.
            </p>
            <div className="space-y-3">
              <button 
                onClick={clearLocalChats}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-red-100"
              >
                Clear Cache
              </button>
              <button 
                onClick={() => setShowPurgeConfirm(false)}
                className="w-full py-4 text-slate-400 font-bold uppercase text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
