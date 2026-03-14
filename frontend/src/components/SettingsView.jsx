import { Shield, Settings as SettingsIcon, Bell, User } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="max-w-3xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-slate-500">Configure your analysis environment and preferences.</p>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-600" />
               </div>
               <div>
                  <p className="font-semibold text-slate-700">Similarity Threshold</p>
                  <p className="text-sm text-slate-500">Sensitivity for flagging paraphrased content.</p>
               </div>
            </div>
            <div className="text-indigo-600 font-bold">15%</div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-slate-600" />
               </div>
               <div>
                  <p className="font-semibold text-slate-700">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive reports in your inbox.</p>
               </div>
            </div>
            <div className="w-12 h-6 bg-slate-200 rounded-full relative">
               <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
             <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
                Save Preferences
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
