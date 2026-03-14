import { useState } from 'react';
import Upload from './components/Upload';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import TemplateSection from './components/TemplateSection';
import ChatbotAssistant from './components/ChatbotAssistant';

function App() {
  const [results, setResults] = useState(null);
  const [currentView, setCurrentView] = useState('detector'); // 'detector', 'history', 'settings'

  const handleNavClick = (view) => {
    setCurrentView(view);
    if (view === 'detector') setResults(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200 flex flex-col">
      {/* Navbar Minimal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => handleNavClick('detector')}
            >
               <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  S
               </div>
               <span className="font-bold text-xl tracking-tight text-slate-800">Srujana<span className="text-indigo-600">Scan</span></span>
            </div>
            <nav className="flex gap-4 md:gap-8 text-sm font-medium">
               <button 
                onClick={() => handleNavClick('detector')}
                className={`transition-colors py-1 px-2 rounded-md ${currentView === 'detector' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Detector
               </button>
               <button 
                onClick={() => handleNavClick('history')}
                className={`transition-colors py-1 px-2 rounded-md ${currentView === 'history' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 History
               </button>
               <button 
                onClick={() => handleNavClick('settings')}
                className={`transition-colors py-1 px-2 rounded-md ${currentView === 'settings' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Settings
               </button>
            </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
         {
         currentView === 'detector' && (
           <>
             {/* Hero Section if no results yet */}
             {!results && (
               <div className="text-center max-w-2xl mx-auto mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                     Detect Plagiarism with <span className="text-indigo-600">Web Search</span>
                  </h1>
                  <p className="text-lg text-slate-600 leading-relaxed">
                     Fast document analysis powered by <span className="font-semibold text-indigo-500">TF-IDF & Serper.dev</span>. 
                     Catch exact copies against your local database or cross-reference the live internet in seconds.
                  </p>
               </div>
             )
             }
             
             {!results ? (
                <>
                   <Upload onUploadSuccess={(data) => setResults(data)} />
                   <TemplateSection />
                </>
             ) : (
                <ResultsDashboard results={results} onReset={() => setResults(null)} />
             )}
           </>
         )}

         {currentView === 'history' && <HistoryView />}
         {currentView === 'settings' && <SettingsView />}
         
         <ChatbotAssistant />
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200 bg-white">
          <p>© 2026 Srujana AI Scanner. Designed for academic integrity and semantic excellence.</p>
      </footer>
    </div>
  )
}

export default App;
