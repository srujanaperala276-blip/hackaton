import { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadType, setUploadType] = useState('assignment');
  const [successMsg, setSuccessMsg] = useState(null);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    setError(null);
    setSuccessMsg(null);
    
    if (allowedTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.docx')) {
       setFile(selectedFile);
    } else {
       setError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (uploadType === 'source') {
        const res = await axios.post('/source', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg(`"${file.name}" has been added to the reference library.`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const uploadRes = await axios.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        const documentId = uploadRes.data.assignment_id;
        
        const analyzeRes = await axios.post('/analyze', {
           document_id: documentId,
           enable_web_search: enableWebSearch
        });
        
        onUploadSuccess(analyzeRes.data);
      }
      
    } catch (err) {
      console.error("Submission Error:", err);
      let errorMessage = "An error occurred during submission.";
      
      if (!err.response) {
        errorMessage = "Cannot connect to Backend Server. Please ensure 'start.bat' is running.";
      } else if (err.response.data && err.response.data.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-slate-800">Plagiarism Engine</h2>
        <p className="text-slate-500 mt-2">Manage your reference library or scan documents for plagiarism.</p>
        
        <div className="flex bg-slate-100 p-1 rounded-lg mt-6 w-fit mx-auto">
           <button 
             onClick={() => { setUploadType('assignment'); setError(null); setSuccessMsg(null); }}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${uploadType === 'assignment' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Scan Document
           </button>
           <button 
             onClick={() => { setUploadType('source'); setError(null); setSuccessMsg(null); }}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${uploadType === 'source' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Add to Reference Library
           </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div 
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}
            ${file ? 'border-indigo-300 bg-indigo-50/30' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
          />
          
          {file ? (
             <div className="flex flex-col items-center text-indigo-600">
                 <File size={48} className="mb-4 opacity-80" />
                 <p className="font-medium text-lg">{file.name}</p>
                 <p className="text-sm text-indigo-400 mt-1">{formatFileSize(file.size)}</p>
                 <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-sm text-slate-500 hover:text-red-500 transition-colors"
                 >
                   Remove file
                 </button>
             </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <UploadCloud size={48} className="mb-4 text-slate-400" />
              <p className="mb-2 text-sm text-slate-500">
                <span className="font-semibold text-indigo-600">Click to upload</span> {uploadType === 'source' ? 'an ORIGINAL' : 'a SUSPECT'} file
              </p>
              <p className="text-xs text-slate-400">PDF, DOCX, or TXT (Max 10MB)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-center p-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center p-4 text-sm text-emerald-800 border border-emerald-300 rounded-lg bg-emerald-50">
            <div className="w-5 h-5 mr-2 flex-shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold font-mono">
               ✓
            </div>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {uploadType === 'assignment' && (
          <div className="mt-6 flex items-start p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <input 
              type="checkbox" 
              id="webSearchToggle"
              checked={enableWebSearch} 
              onChange={(e) => setEnableWebSearch(e.target.checked)} 
              className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="webSearchToggle" className="ml-3 flex flex-col cursor-pointer">
              <span className="text-sm font-semibold text-slate-700">Enable Deep Web Search</span>
              <span className="text-xs text-slate-500">Cross-reference with Internet sources (Requires Serper API Key)</span>
              <span className="text-xs text-amber-600 mt-1 font-medium italic">Note: Uses free tier Serper.dev API credits (limit 2500 per account).</span>
            </label>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={!file || isUploading}
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-all
              ${!file || isUploading 
                ? 'bg-indigo-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-95'}`}
          >
            {isUploading ? (
              <>
                <Loader className="animate-spin w-5 h-5 mr-2" />
                {uploadType === 'source' ? 'Adding to Library...' : 'Scanning...'}
              </>
            ) : (
              uploadType === 'source' ? 'Add to Reference' : 'Scan Assignment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
