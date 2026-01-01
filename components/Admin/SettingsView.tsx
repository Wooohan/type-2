
import React, { useState } from 'react';
import { Shield, Globe, User, Database, CheckCircle2, RefreshCw, AlertTriangle, Loader2, Key, Code, HardDrive, Server, ExternalLink, Settings, Save } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { UserRole } from '../../types';

const SettingsView: React.FC = () => {
  const { currentUser, dbStatus, dbName, updateDbName, clearLocalChats, syncFullHistory } = useApp();
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [newDbName, setNewDbName] = useState(dbName);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDbUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDbName === dbName) return;
    setIsUpdating(true);
    await updateDbName(newDbName);
    setIsUpdating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Infrastructure</h2>
          <p className="text-slate-500 text-sm mt-1">Backend: Node.js Driver • Cloud: MongoDB Atlas Cluster0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                 <User size={24} />
              </div>
              <h4 className="font-bold text-slate-800">{currentUser?.name}</h4>
              <p className="text-xs text-slate-400">Portal Architect</p>
              <div className="pt-2">
                 <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-600 uppercase tracking-widest">
                    {currentUser?.role}
                 </span>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Server size={60} />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                 <Database size={20} className="text-blue-400" />
                 <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Atlas Engine</h4>
              </div>
              <div className="space-y-3 relative z-10">
                 <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-500">Node Driver Status</span>
                    <span className={dbStatus === 'connected' ? 'text-emerald-400' : 'text-rose-400'}>
                      {dbStatus.toUpperCase()}
                    </span>
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${dbStatus === 'connected' ? 'bg-emerald-500 w-full' : 'bg-rose-500 w-1/4'}`} />
                 </div>
              </div>
              <div className="pt-2 space-y-1 relative z-10">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Region: AWS / us-east-1</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Cluster: Cluster0</p>
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-tight">Active DB: {dbName}</p>
              </div>
           </div>
        </div>

        <div className="md:col-span-2 space-y-6">
           {/* New Database Configuration Card */}
           {isAdmin && (
             <div className="bg-white p-8 md:p-10 rounded-[48px] border-2 border-blue-50 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                      <Settings size={24} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Database Configuration</h3>
                     <p className="text-xs text-slate-400 font-medium">Select your target Atlas environment</p>
                   </div>
                </div>

                <form onSubmit={handleDbUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atlas Database Name</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={newDbName}
                        onChange={(e) => setNewDbName(e.target.value)}
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-slate-700"
                        placeholder="e.g. MessengerFlow"
                      />
                      <button 
                        type="submit"
                        disabled={isUpdating || newDbName === dbName}
                        className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-30 shadow-lg"
                      >
                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Sync
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 italic px-1">Tip: Change this to create a new isolated database instance (e.g. 'Test_Environment').</p>
                  </div>
                </form>
             </div>
           )}

           <div className="bg-white p-8 md:p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
              {dbStatus === 'error' && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[32px] space-y-4 animate-in shake duration-500">
                  <div className="flex items-center gap-3 text-rose-600">
                    <AlertTriangle size={24} />
                    <h4 className="font-black text-sm uppercase tracking-tight">Atlas Connection Failed</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      The Node.js bridge is having trouble communicating with <span className="font-bold">Cluster0</span> on database <span className="font-bold">"{dbName}"</span>.
                    </p>
                    <ul className="text-xs text-slate-500 space-y-2 ml-4 list-disc font-medium">
                      <li>Check if <strong>0.0.0.0/0</strong> is whitelisted in Atlas Network Access.</li>
                      <li>Ensure your database name matches your Atlas collections.</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-rose-200 hover:bg-rose-100 transition-all"
                  >
                    <RefreshCw size={12} /> Retry Handshake
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                   <div className="p-3 bg-slate-900 text-white rounded-2xl">
                      <HardDrive size={24} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">Storage Layer</h3>
                     <p className="text-xs text-slate-400 font-medium">Native MongoDB Driver Integration</p>
                   </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white text-emerald-500 rounded-xl shadow-sm">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Multi-Device Synchronized</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        The database connection is managed by a secure Node.js bridge. All portal data is stored directly in your personal Cluster0 within database <strong>"{dbName}"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <RefreshCw size={20} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800">Cluster Tools</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={syncFullHistory}
                      className="p-6 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-[28px] border border-blue-100 flex flex-col items-center gap-3 transition-all"
                    >
                      <RefreshCw size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Re-Sync Atlas</span>
                    </button>

                    <button 
                      onClick={() => setShowPurgeConfirm(true)}
                      className="p-6 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-[28px] border border-rose-100 flex flex-col items-center gap-3 transition-all"
                    >
                      <AlertTriangle size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Clear Cache</span>
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {showPurgeConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-10 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[32px] flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">CONFIRM PURGE</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              This will clear the local frontend index for <strong>{dbName}</strong>.
            </p>
            <div className="space-y-3">
              <button 
                onClick={clearLocalChats}
                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-rose-100"
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
