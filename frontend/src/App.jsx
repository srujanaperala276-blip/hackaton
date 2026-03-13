import { useState } from 'react';
import Upload from './components/Upload';
import ResultsDashboard from './components/ResultsDashboard';

function App() {
  const [results, setResults] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      {/* Navbar Minimal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  S
               </div>
               <span className="font-bold text-xl tracking-tight text-slate-800">Srujana<span className="text-indigo-600">Scan</span></span>
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
               <a href="#" className="hover:text-slate-900 transition font-semibold text-slate-900">Detector</a>
               <a href="#" className="hover:text-slate-900 transition">History</a>
               <a href="#" className="hover:text-slate-900 transition">Settings</a>
            </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
         {/* Hero Section if no results yet */}
         {!results && (
           <div className="text-center max-w-2xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                 Detect Plagiarism with <span className="text-indigo-600">AI Precision</span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                 Deep semantic document analysis powered by <span className="font-semibold text-indigo-500">HuggingFace Inference API</span>. 
                 Catch not just exact copies, but clever paraphrasing seamlessly in seconds using advanced semantic matching.
              </p>
           </div>
         )}
         
         {!results ? (
            <Upload onUploadSuccess={(data) => setResults(data)} />
         ) : (
            <ResultsDashboard results={results} onReset={() => setResults(null)} />
         )}
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm mt-auto border-t border-slate-200 bg-white">
          <p>© 2026 Srujana AI Scanner. Designed for academic integrity.</p>
      </footer>
    </div>
  )
}

export default App;
