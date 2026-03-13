import { PieChart, AlertTriangle, CheckCircle, FileText, Download } from 'lucide-react';

export default function ResultsDashboard({ results, onReset }) {
  if (!results) return null;

  const score = results.overall_similarity;
  
  // Determine color based on threshold
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
      {/* Header Summary Card */}
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
               <button 
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition flex items-center"
               >
                 <Download className="w-4 h-4 mr-2"/>
                 Export JSON
               </button>
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
          {/* Main Score */}
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

          {/* Stats Group */}
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

      {/* Flagged Sentences List */}
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
    </div>
  );
}
