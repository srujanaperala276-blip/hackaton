import { FileText, Download, Briefcase, FileSignature, LayoutTemplate, Copy } from 'lucide-react';

export default function TemplateSection() {
  const templates = [
    {
      id: "A4",
      name: "A4 Academic Paper",
      desc: "Standard academic size for essays and research papers. Perfect for journal submissions.",
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      file: "/templates/A4_Academic_Template.docx"
    },
    {
      id: "A2",
      name: "A2 Conference Poster",
      desc: "Large format suitable for research symposiums and academic conferences.",
      icon: <LayoutTemplate className="w-6 h-6 text-emerald-500" />,
      file: "/templates/A2_Poster_Template.docx"
    },
    {
      id: "A5",
      name: "A5 Short Report",
      desc: "Compact format ideal for lab reports, briefs, and internal summaries.",
      icon: <Briefcase className="w-6 h-6 text-amber-500" />,
      file: "/templates/A5_Report_Template.docx"
    },
    {
      id: "A6",
      name: "A6 Conference Abstract",
      desc: "Pocket-sized layout for abstracts, executive summaries, and handouts.",
      icon: <FileSignature className="w-6 h-6 text-rose-500" />,
      file: "/templates/A6_Abstract_Template.docx"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
             <Copy className="w-5 h-5 mr-3 text-indigo-500" />
             Academic Templates
          </h2>
          <p className="text-slate-500 mt-1">Download pre-formatted Word documents to start your writing instantly.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all hover:border-indigo-200 flex flex-col h-full group">
             <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                {tpl.icon}
             </div>
             <h3 className="font-semibold text-slate-800 text-lg mb-2">{tpl.name}</h3>
             <p className="text-slate-500 text-sm flex-grow leading-relaxed mb-6">{tpl.desc}</p>
             
             <a 
               href={tpl.file}
               download
               className="flex items-center justify-center w-full py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-medium text-sm rounded-lg transition-colors border border-slate-200 hover:border-indigo-200 mt-auto"
             >
                <Download className="w-4 h-4 mr-2" />
                Download {tpl.id}
             </a>
          </div>
        ))}
      </div>
    </div>
  );
}
