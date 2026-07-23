import React, { useState, useEffect } from "react";
import { 
  KeyRound, Plus, Sparkles, ArrowRight, Copy, Check, ShieldCheck, 
  BookOpen, Layers, RefreshCw, AlertCircle, History
} from "lucide-react";
import { getWorkspace, createWorkspace } from "../lib/api";
import { Workspace } from "../types";
import WorkspaceIconPicker from "./WorkspaceIconPicker";
import { getWorkspaceIconComponent } from "../lib/workspaceIcons";

interface WorkspaceLoginProps {
  onSelectWorkspace: (workspace: Workspace) => void;
}

export default function WorkspaceLogin({ onSelectWorkspace }: WorkspaceLoginProps) {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  
  // Join Form State
  const [codeDigits, setCodeDigits] = useState<string>("");
  const [joinError, setJoinError] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Create Form State
  const [workspaceNameInput, setWorkspaceNameInput] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>("FolderOpen");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Recent Workspaces history stored in browser
  const [recentCodes, setRecentCodes] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("therevisionlab_recent_workspaces");
    if (storedHistory) {
      try {
        setRecentCodes(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse recent workspaces history:", e);
      }
    }
  }, []);

  const saveToRecentWorkspaces = (code: string, name: string) => {
    const updated = [{ code, name }, ...recentCodes.filter((item) => item.code !== code)].slice(0, 5);
    setRecentCodes(updated);
    localStorage.setItem("therevisionlab_recent_workspaces", JSON.stringify(updated));
  };

  // Join Workspace Handler
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeDigits.toUpperCase().trim();
    if (cleanCode.length !== 6) {
      setJoinError("Workspace code must be exactly 6 alphanumeric characters (0-9, A-Z).");
      return;
    }

    setIsJoining(true);
    setJoinError("");

    try {
      const ws = await getWorkspace(cleanCode);
      saveToRecentWorkspaces(ws.code, ws.name);
      onSelectWorkspace(ws);
    } catch (err: any) {
      setJoinError(err.message || "Invalid 6-digit workspace code. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  // Create Workspace Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const ws = await createWorkspace(workspaceNameInput.trim() || undefined, selectedIcon);
      setCreatedWorkspace(ws);
      saveToRecentWorkspaces(ws.code, ws.name);
    } catch (err: any) {
      alert("Failed to create workspace: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (createdWorkspace) {
      navigator.clipboard.writeText(createdWorkspace.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans" style={{ zoom: 0.85 }}>
      {/* Background Decorative Glows */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-base font-extrabold font-display tracking-tight text-white">
            TheRevisionLab
          </span>
        </div>
      </header>

      {/* Main Gateway Form */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 my-4 max-w-6xl mx-auto w-full">
        <div className="w-full bg-slate-900/60 border border-slate-800/90 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <KeyRound className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
              Enter Workspace
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Enter your 6-digit workspace code to join, or create a brand new study workspace.
            </p>
          </div>

          {/* Tabs: Join / Create */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-8 max-w-2xl mx-auto">
            <button
              onClick={() => {
                setActiveTab("join");
                setCreatedWorkspace(null);
                setJoinError("");
              }}
              className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "join"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Enter 6-Digit Code</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("create");
                setCreatedWorkspace(null);
                setJoinError("");
              }}
              className={`py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === "create"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Workspace</span>
            </button>
          </div>

          {/* TAB 1: JOIN WORKSPACE */}
          {activeTab === "join" && (
            <form onSubmit={handleJoin} className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-slate-950/80 p-6 sm:p-8 rounded-2xl border border-slate-800/80">
                <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 font-bold mb-3 text-center">
                  6-Digit Alphanumeric Code (0-9, A-Z)
                </label>
                
                <input
                  type="text"
                  maxLength={6}
                  value={codeDigits}
                  onChange={(e) => {
                    setCodeDigits(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""));
                    setJoinError("");
                  }}
                  placeholder="e.g. 7K2M9P"
                  className="w-full max-w-md mx-auto block text-center text-3xl sm:text-4xl font-mono font-extrabold tracking-[0.3em] uppercase bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl py-4 text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-600 focus:outline-none transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {joinError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-xl font-medium max-w-md mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{joinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining || codeDigits.length !== 6}
                className="w-full max-w-md mx-auto py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Locating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Recent Workspaces History */}
              {recentCodes.length > 0 && (
                <div className="pt-6 border-t border-slate-800/80">
                  <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-mono font-bold text-slate-400 mb-3">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>Recent Workspaces</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                    {recentCodes.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={async () => {
                          setCodeDigits(item.code);
                          setIsJoining(true);
                          setJoinError("");
                          try {
                            const ws = await getWorkspace(item.code);
                            onSelectWorkspace(ws);
                          } catch (err: any) {
                            setJoinError("Failed to open recent workspace: " + err.message);
                          } finally {
                            setIsJoining(false);
                          }
                        }}
                        className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-between gap-2 cursor-pointer shadow-sm group"
                      >
                        <span className="font-bold text-indigo-400 text-sm group-hover:scale-105 transition-transform">{item.code}</span>
                        <span className="text-slate-400 text-xs truncate max-w-[140px]">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: CREATE WORKSPACE */}
          {activeTab === "create" && (
            <div className="max-w-3xl mx-auto">
              {!createdWorkspace ? (
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="bg-slate-950/80 p-6 sm:p-8 rounded-2xl border border-slate-800/80 space-y-4">
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-300 font-bold">
                      Workspace Name & Icon
                    </label>
                    <div className="flex items-center gap-3">
                      <WorkspaceIconPicker
                        selectedIcon={selectedIcon}
                        onSelectIcon={setSelectedIcon}
                      />
                      <input
                        type="text"
                        placeholder="e.g. Physics Revision, Medical Finals, AP Chem..."
                        value={workspaceNameInput}
                        onChange={(e) => setWorkspaceNameInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Workspace</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* CREATED WORKSPACE DISPLAY */
                <div className="text-center space-y-6 animate-fadeIn bg-slate-950/80 p-6 sm:p-10 rounded-2xl border border-slate-800/80">
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl">
                    <span className="text-xs uppercase font-mono font-bold text-emerald-400">
                      Workspace Ready!
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {createdWorkspace.name}
                    </h3>
                  </div>

                  <div>
                    <span className="text-xs uppercase font-mono font-bold text-slate-400 block mb-3">
                      Your 6-Digit Alphanumeric Code:
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-slate-950 border-2 border-purple-500 rounded-2xl px-8 py-4 font-mono text-3xl sm:text-4xl font-black text-purple-400 tracking-widest shadow-inner">
                        {createdWorkspace.code}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl transition-all cursor-pointer border border-slate-700"
                        title="Copy Workspace Code"
                      >
                        {copiedCode ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
                      </button>
                    </div>
                    {copiedCode && (
                      <p className="text-xs text-emerald-400 font-mono font-bold mt-2">
                        Code copied to clipboard!
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectWorkspace(createdWorkspace)}
                    className="w-full max-w-md mx-auto py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center py-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
        TheRevisionLab
      </footer>
    </div>
  );
}
