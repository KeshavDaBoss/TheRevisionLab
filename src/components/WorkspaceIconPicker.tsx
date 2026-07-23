import React, { useState, useRef, useEffect } from "react";
import { WORKSPACE_ICONS, getWorkspaceIconComponent } from "../lib/workspaceIcons";
import { ChevronDown } from "lucide-react";

interface WorkspaceIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
  className?: string;
}

export default function WorkspaceIconPicker({
  selectedIcon,
  onSelectIcon,
  className = ""
}: WorkspaceIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SelectedIcon = getWorkspaceIconComponent(selectedIcon);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-[42px] px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl text-purple-400 flex items-center gap-2 transition-all cursor-pointer group shrink-0 shadow-sm"
        title="Choose Workspace Icon"
      >
        <SelectedIcon className="w-5 h-5 transition-transform group-hover:scale-110 text-purple-400" />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 p-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 w-[320px] sm:w-[480px] md:w-[560px] max-w-[calc(100vw-3rem)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-3 px-1 flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-purple-300">Choose Workspace Icon</span>
            <span className="text-[10px] text-slate-500 font-normal">32 Options</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2.5 max-h-64 overflow-y-auto pr-1 p-0.5 custom-scrollbar">
            {WORKSPACE_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectIcon(item.id);
                    setIsOpen(false);
                  }}
                  className={`h-11 sm:h-12 w-full rounded-xl border flex items-center justify-center transition-all cursor-pointer group ${
                    isSelected
                      ? "bg-purple-600/30 border-purple-500 text-purple-300 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20 scale-105"
                      : "bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-800"
                  }`}
                  title={item.name}
                >
                  <IconComp className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
