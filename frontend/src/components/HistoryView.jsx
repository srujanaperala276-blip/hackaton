import { History, Search, Settings, AlertCircle } from 'lucide-react';

export default function HistoryView() {
  return (
    <div className="max-w-5xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center py-16">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <History className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Scan History</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          Your past plagiarism reports will appear here once you've completed some scans. 
          Currently, history is stored in local memory.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
        >
          Start New Scan
        </button>
      </div>
    </div>
  );
}
