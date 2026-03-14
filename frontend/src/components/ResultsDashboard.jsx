import { PieChart, AlertTriangle, CheckCircle, FileText, Download, Sparkles, RefreshCcw, ChevronDown } from 'lucide-react';
import ChatbotAssistant from './ChatbotAssistant';
import { useState } from 'react';
import axios from 'axios';

export default function ResultsDashboard({ results, onReset }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (!results) return null;

  const handleExport = async (size) => {
    setIsExporting(true);
    setShowExportOptions(false);
    try {
      const response = await axios.post('http://localhost:8000/export', {
        report_data: results,
        size: size
      });
      
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.setAttribute('download', response.data.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const score = results.overall_similarity;
  
  let targetColor = 'text-green-500';
  let targetBg = 'bg-green-50';
  let targetBorder = 'border-green-200';
  let StatusIcon = CheckCircle;
  let statusText = 'Low Risk';
  
  if (score > 15 && score <= 40) {
      targetColor = 'text-yellow-500';
      targetBg = 'bg-yellow-50';
      targetBorder = 'border-yellow-200';
      StatusIcon = AlertTriangle;
      statusText = 'Moderate Risk';
  } else if (score > 40) {
      targetColor = 'text-red-500';
      targetBg = 'bg-red-50';
      targetBorder = 'border-red-200';
      StatusIcon = AlertTriangle;
      statusText = 'High Risk';
  }

  const handleDownloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `plagiarism_report_${results.metadata?.filename || "document"}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 animate-in fade-in zoom-in-95 duration-300 pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-8 pb-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Analysis Report</h2>
              <p className="text-slate-500 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {results.metadata?.filename || "Uploaded Document"}
              </p>
            </div>
             <div className="flex gap-3">
                <div className="relative">
                   <button 
                     onClick={() => setShowExportOptions(!showExportOptions)}
                     className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                     disabled={isExporting}
                   >
                     <Download className="w-4 h-4" />
                     {isExporting ? 'Generating...' : 'Export Report'}
                     <ChevronDown className="w-4 h-4 ml-1" />
                   </button>
                   
                   {showExportOptions && (
                     <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                       {[
                         { id: 'A4', label: 'A4 Academic Paper', desc: 'Standard essay/research size' },
                         { id: 'A2', label: 'A2 Conference Poster', desc: 'Large format symposium' },
                         { id: 'A5', label: 'A5 Short Report', desc: 'Lab reports & briefs' },
                         { id: 'A6', label: 'A6 Abstract', desc: 'Handouts & summaries' }
                       ].map(opt => (
                         <button 
                           key={opt.id}
                           onClick={() => handleExport(opt.id)}
                           className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors group border-none bg-transparent cursor-pointer"
                         >
                           <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 m-0">{opt.label}</p>
                           <p className="text-[10px] text-slate-400 font-semibold m-0">{opt.desc}</p>
                         </button>
                       ))}
                       <div className="border-t border-slate-100 my-1"></div>
                       <button 
                         onClick={handleDownloadReport}
                         className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors group border-none bg-transparent cursor-pointer"
                       >
                         <p className="text-sm font-bold text-slate-600 m-0">Export JSON (Raw Data)</p>
                       </button>
                     </div>
                   )}
                </div>
                
                <button 
                   onClick={onReset}
                   className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition"
                >
                  Scan Another
                </button>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-t border-slate-100">
          <div className="p-8 flex flex-col items-center justify-center">
             <div className={`w-32 h-32 rounded-full border-8 ${targetBorder} flex items-center justify-center mb-4 relative`}>
                <span className={`text-4xl font-bold ${targetColor}`}>{score}%</span>
             </div>
             <div className={`flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${targetBg} ${targetColor}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusText}
             </div>
             <p className="text-slate-500 mt-3 text-center text-sm">Overall Similarity Score</p>
          </div>

          <div className="p-8 flex flex-col justify-center space-y-6 col-span-2">
             <h3 className="font-semibold text-slate-700 text-lg flex items-center border-b border-slate-100 pb-3">
               <PieChart className="w-5 h-5 mr-3 text-indigo-500" />
               Section Breakdown
             </h3>
             <div className="grid grid-cols-3 gap-6">
                {Object.entries(results.sections || {}).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 rounded-xl p-4">
                     <p className="text-sm text-slate-500 capitalize mb-1">{key}</p>
                     <p className={`text-2xl font-bold ${val > 20 ? 'text-amber-500' : 'text-slate-700'}`}>{val}%</p>
                  </div>
                ))}
             </div>
             <div className="flex justify-between items-center text-sm text-slate-500 bg-slate-50/50 p-4 rounded-lg mt-4 h-full">
                <span>Total Sentences: <strong className="text-slate-700">{results.statistics?.total_sentences || 0}</strong></span>
                <span>Matches Found: <strong className="text-red-500">{results.statistics?.plagiarized_count || 0}</strong></span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
         <h3 className="font-semibold text-slate-800 text-xl mb-6">Detailed Findings</h3>
         
         {results.flagged_sentences && results.flagged_sentences.length > 0 ? (
           <div className="space-y-6">
             {results.flagged_sentences.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md
                        ${item.type === 'exact' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}
                      `}>
                         {item.type} Match
                      </span>
                      <span className="text-sm font-semibold text-slate-600">
                        Similarity: {(item.similarity * 100).toFixed(1)}%
                      </span>
                   </div>
                   <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Submitted Text</p>
                         <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                            <p className="text-slate-800 text-sm leading-relaxed">{item.sentence}</p>
                         </div>
                      </div>
                      <div>
                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Matched Source</p>
                         <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                            <p className="text-slate-800 text-sm leading-relaxed">{item.matched_sentence}</p>
                         </div>
                      </div>
                   </div>

                    {item.ai_rewrite_suggestion && (
                       <div className="px-5 pb-5 pt-0">
                          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                             <div className="flex items-center gap-2 mb-2">
                                <RefreshCcw className="w-4 h-4 text-emerald-600" />
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">AI Suggested Rewrite (Zero Plagiarism)</p>
                             </div>
                             <p className="text-emerald-900 text-sm leading-relaxed font-medium italic">
                                "{item.ai_rewrite_suggestion}"
                             </p>
                          </div>
                       </div>
                    )}
                 </div>
              ))}
           </div>
         ) : (
           <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-800">No Plagiarism Detected</h4>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">The analysis found absolutely zero matching semantics or exact copies in the provided corpus.</p>
           </div>
         )}
      </div>

      {results.web_matches && results.web_matches.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-8">
           <h3 className="font-semibold text-slate-800 text-xl mb-6 flex items-center">
              <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
              Web Search Matches
           </h3>
           <div className="space-y-6">
             {results.web_matches.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                   <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md">
                         Internet Search
                      </span>
                   </div>
                   <div className="p-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Queried Sentence</p>
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg mb-4">
                         <p className="text-slate-800 text-sm leading-relaxed">{item.sentence}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Web Results</p>
                      <div className="space-y-3">
                         {item.matches.map((match, mIdx) => (
                             <div key={mIdx} className="bg-white border border-slate-100 shadow-sm p-4 rounded-lg hover:border-indigo-200 transition-colors">
                                <a href={match.link} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline line-clamp-1">{match.title}</a>
                                <p className="text-xs text-emerald-600 mb-2 truncate">{match.link}</p>
                                <p className="text-sm text-slate-600 line-clamp-2">{match.snippet}</p>
                             </div>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

       <ChatbotAssistant context={`The user just finished a plagiarism scan for '${results.metadata?.filename}'. Total similarity is ${results.overall_similarity}%. There are ${results.statistics?.plagiarized_count || 0} flagged matches.`} />
    </div>
  );
}
