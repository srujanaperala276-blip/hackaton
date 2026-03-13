import { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    setError(null);
    
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

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload File
      const uploadRes = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const documentId = uploadRes.data.assignment_id;
      
      // 2. Trigger Analysis
      const analyzeRes = await axios.post('http://localhost:8000/analyze', {
         document_id: documentId
      });
      
      // 3. Pass results to parent
      onUploadSuccess(analyzeRes.data);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred during submission.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-slate-800">Scan for Plagiarism</h2>
        <p className="text-slate-500 mt-2">Upload your assignment to detect exact and paraphrased matches.</p>
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
                 <p className="text-sm text-indigo-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
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
                Processing...
              </>
            ) : (
              'Scan Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
