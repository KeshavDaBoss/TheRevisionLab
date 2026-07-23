import React, { useState } from "react";
import { 
  FileText, Download, ExternalLink, X, Copy, Check, Eye, File, 
  Image as ImageIcon, Link as LinkIcon, Folder, AlertCircle, FileCode, CheckCircle2, ShieldCheck, Sparkles
} from "lucide-react";
import { StudyMaterial } from "../types";
import { getDocumentTypeInfo } from "../lib/documentUtils";

interface DocumentViewerModalProps {
  material: StudyMaterial;
  onClose: () => void;
}

export default function DocumentViewerModal({ material, onClose }: DocumentViewerModalProps) {
  const info = getDocumentTypeInfo(material);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(material.urlOrContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getDownloadFileName = (): string => {
    if (material.fileName) return material.fileName;
    if (info.category === "pdf") return `${material.title.replace(/\s+/g, "_")}.pdf`;
    if (info.category === "word") return `${material.title.replace(/\s+/g, "_")}.docx`;
    if (info.category === "powerpoint") return `${material.title.replace(/\s+/g, "_")}.pptx`;
    if (info.category === "excel") return `${material.title.replace(/\s+/g, "_")}.xlsx`;
    if (info.category === "image") return `${material.title.replace(/\s+/g, "_")}.png`;
    if (info.category === "text" || info.category === "notes") return `${material.title.replace(/\s+/g, "_")}.txt`;
    return `${material.title.replace(/\s+/g, "_")}.file`;
  };

  const isDataUrl = material.urlOrContent.startsWith("data:");
  
  // Only allow viewing for: text/notes
  // All other file types should be downloadable only
  const isViewable = info.category === "notes" || info.category === "text";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className={`p-2.5 rounded-2xl border ${info.badgeClass} shrink-0`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${info.badgeClass}`}>
                  {info.label}
                </span>
                {material.topicTag && (
                  <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    Tag: {material.topicTag}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white font-display truncate mt-1">
                {material.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {material.urlOrContent && (
              <a
                href={material.urlOrContent}
                download={getDownloadFileName()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Download file to device"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Document</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Material Description Header if provided */}
        {material.description && (
          <div className="mb-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-300 shrink-0">
            <span className="font-bold text-purple-400 mr-1.5">Description:</span>
            {material.description}
          </div>
        )}

        {/* Modal Body depending on document category */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">

          {/* 1. Text File / Lecture Notes Reader - Only viewable type */}
          {(info.category === "notes" || info.category === "text") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="font-mono text-slate-400">
                  {info.category === "notes" ? "Lecture Text Content" : `File Content: ${material.fileName || "Text File"}`}
                </span>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Content"}</span>
                </button>
              </div>

              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text overflow-x-auto min-h-[220px] max-h-[450px]">
                {material.urlOrContent}
              </div>
            </div>
          )}

          {/* 4. Binary Documents (Word, PowerPoint, Excel, Zip, PDF, images, executables, etc.) - Downloadable only */}
          {(info.category === "word" ||
            info.category === "powerpoint" ||
            info.category === "excel" ||
            info.category === "archive" ||
            info.category === "file" ||
            info.category === "image" ||
            info.category === "pdf") && (
            <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 my-4">
              <div className={`p-4 rounded-3xl border ${info.badgeClass}`}>
                <File className="w-12 h-12" />
              </div>

              <div>
                <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${info.badgeClass}`}>
                  {info.label}
                </span>
                <h4 className="text-xl font-bold text-white font-display mt-3">
                  {material.fileName || material.title}
                </h4>
                {material.fileSize && (
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    File Size: <span className="text-slate-200">{material.fileSize}</span>
                  </p>
                )}
              </div>

              <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                This document type cannot be previewed inline. You can download it to open in the appropriate application.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href={material.urlOrContent}
                  download={getDownloadFileName()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document File</span>
                </a>
              </div>
            </div>
          )}

          {/* 5. Web Resource Link */}
          {info.category === "link" && (
            <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 my-4">
              <div className="p-4 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-3xl">
                <ExternalLink className="w-12 h-12" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white font-display">
                  Web Resource Link
                </h4>
                <p className="text-xs font-mono text-sky-400 mt-1 break-all max-w-lg">
                  {material.urlOrContent}
                </p>
              </div>

              <a
                href={material.urlOrContent}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit External Link</span>
              </a>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Uploaded on: {new Date(material.createdAt).toLocaleDateString()}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}