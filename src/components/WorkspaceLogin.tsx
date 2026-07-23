import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  KeyRound,
  Plus,
  ArrowRight,
  Copy,
  Check,
  BookOpen,
  RefreshCw,
  AlertCircle,
  History,
  Sparkles,
  PartyPopper,
  ChevronRight,
  Gem,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getWorkspace, createWorkspace } from "../lib/api";
import { Workspace } from "../types";
import WorkspaceIconPicker from "./WorkspaceIconPicker";
import { getWorkspaceIconComponent } from "../lib/workspaceIcons";

interface WorkspaceLoginProps {
  onSelectWorkspace: (workspace: Workspace) => void;
}

/* ─── Animated background particles ─── */
const PARTICLE_COUNT = 24;

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const size = 2 + Math.random() * 3;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 4 + Math.random() * 8;
        const delay = Math.random() * 6;
        const driftX = (Math.random() - 0.5) * 40;
        const driftY = (Math.random() - 0.5) * 40;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-indigo-400/25 to-purple-400/10"
            style={{
              width: size,
              height: size,
              left: `${x}%`,
              top: `${y}%`,
            }}
            animate={{
              x: [0, driftX, -driftX * 0.5, driftX * 0.7, 0],
              y: [0, driftY, -driftY * 0.7, driftY, 0],
              opacity: [0.15, 0.5, 0.25, 0.45, 0.15],
              scale: [1, 1.4, 0.8, 1.2, 1],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
      {/* Orbiting ring particles */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-indigo-500/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-purple-500/5"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ─── Digit input boxes for 6-digit code ─── */
function DigitCodeInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6 - value.length).fill(""));

  const handleDigitChange = (index: number, char: string) => {
    const upper = char.toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (!upper) return;
    const newDigits = value.split("");
    newDigits[index] = upper;
    const newVal = newDigits.join("").slice(0, 6);
    onChange(newVal);
    // Auto-advance to next
    if (index < 5 && newVal.length === index + 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        // Remove current digit
        const newDigits = value.split("");
        newDigits.splice(index, 1);
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // Move back
        inputRefs.current[index - 1]?.focus();
        const newDigits = value.split("");
        newDigits.splice(index - 1, 1);
        onChange(newDigits.join(""));
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <React.Fragment key={i}>
            {i === 3 && (
              <div className="text-slate-600 text-2xl font-thin select-none mx-1">
                —
              </div>
            )}
            <motion.div
              animate={
                error
                  ? {
                      x: [0, -4, 4, -4, 4, 0],
                      borderColor: ["#f43f5e80", "#f43f5e80"],
                    }
                  : {}
              }
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="relative"
            >
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-extrabold font-mono rounded-xl border-2 transition-all duration-200 outline-none bg-slate-900/80 ${
                  error
                    ? "border-rose-500/60 text-rose-300 shadow-lg shadow-rose-500/10"
                    : digit
                    ? "border-indigo-500/60 text-white shadow-lg shadow-indigo-500/15"
                    : "border-slate-800/80 text-white hover:border-slate-700/80"
                }`}
                aria-label={`Digit ${i + 1}`}
              />
              {/* Faux caret when focused and empty */}
            </motion.div>
          </React.Fragment>
        ))}
      </div>
      <p className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
        Enter the 6-character code provided by your mentor or workspace owner
      </p>
    </div>
  );
}

/* ─── Main Component ─── */
export default function WorkspaceLogin({ onSelectWorkspace }: WorkspaceLoginProps) {
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");

  // Join Form State
  const [codeDigits, setCodeDigits] = useState<string>("");
  const [joinError, setJoinError] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isHoveringJoin, setIsHoveringJoin] = useState(false);

  // Create Form State
  const [workspaceNameInput, setWorkspaceNameInput] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<string>("GraduationCap");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createdWorkspace, setCreatedWorkspace] = useState<Workspace | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedIcon, setCopiedIcon] = useState<"copy" | "check" | "party">("copy");
  const createFormRef = useRef<HTMLDivElement>(null);

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

  const saveToRecentWorkspaces = useCallback(
    (code: string, name: string) => {
      const updated = [{ code, name }, ...recentCodes.filter((item) => item.code !== code)].slice(0, 5);
      setRecentCodes(updated);
      localStorage.setItem("therevisionlab_recent_workspaces", JSON.stringify(updated));
    },
    [recentCodes]
  );

  // Join Workspace Handler
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = codeDigits.toUpperCase().trim();
    if (cleanCode.length !== 6) {
      setJoinError("Please enter all 6 characters of the workspace code.");
      return;
    }

    setIsJoining(true);
    setJoinError("");

    try {
      const ws = await getWorkspace(cleanCode);
      saveToRecentWorkspaces(ws.code, ws.name);
      onSelectWorkspace(ws);
    } catch (err: any) {
      setJoinError(err.message || "Invalid workspace code. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  // Create Workspace Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const ws = await createWorkspace(
        workspaceNameInput.trim() || undefined,
        selectedIcon
      );
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
      setCopiedIcon("check");
      setTimeout(() => {
        setCopiedCode(false);
        setCopiedIcon("copy");
      }, 2200);
      // Brief party mode
      setCopiedIcon("party");
    }
  };

  // Reset on tab change
  const switchTab = (tab: "join" | "create") => {
    setActiveTab(tab);
    setCreatedWorkspace(null);
    setJoinError("");
  };

  const CreatedIcon = createdWorkspace
    ? getWorkspaceIconComponent(createdWorkspace.icon || selectedIcon)
    : null;

  /* ─── Animations ─── */
  const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
    },
  };

  const tabContentVariants = {
    enter: { opacity: 0, x: 30, scale: 0.98 },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
    },
    exit: {
      opacity: 0,
      x: -30,
      scale: 0.98,
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Animated Background */}
      <ParticleField />

      {/* Gradient Orbs */}
      <div className="absolute -top-64 -left-64 w-[800px] h-[800px] bg-indigo-600/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-purple-600/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/60 bg-[#090d16]/70 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: -8, scale: 1.05 }}
            className="p-2 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-600/25"
          >
            <BookOpen className="w-5 h-5" />
          </motion.div>
          <span className="text-base font-extrabold font-display tracking-tight text-white">
            TheRevisionLab
          </span>
        </div>
      </motion.header>

      {/* Main Gateway */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 my-4 max-w-6xl mx-auto w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl"
        >
          {/* Heading */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.23, 1, 0.32, 1],
                delay: 0.15,
              }}
              className="w-16 h-16 mx-auto mb-4 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rotate-6 opacity-30 blur-sm" />
              <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl flex items-center justify-center shadow-xl">
                <motion.div
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <KeyRound className="w-7 h-7 text-indigo-400" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h2
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight"
            >
              Enter Workspace
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed"
            >
              Enter your 6-digit workspace code to join, or create a brand new
              study workspace.
            </motion.p>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={itemVariants}
            className="relative bg-slate-900/50 border border-slate-800/70 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden"
          >
            {/* Gradient top border */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

            {/* Tabs */}
            <div className="relative p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl mb-8 flex">
              <motion.button
                onClick={() => switchTab("join")}
                className={`relative flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer z-10 ${
                  activeTab === "join" ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {activeTab === "join" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Join Workspace</span>
                </span>
              </motion.button>

              <motion.button
                onClick={() => switchTab("create")}
                className={`relative flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer z-10 ${
                  activeTab === "create" ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {activeTab === "create" && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg shadow-purple-600/25"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </span>
              </motion.button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "join" ? (
                <motion.div
                  key="join"
                  variants={tabContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="min-h-[300px]"
                >
                  <form onSubmit={handleJoin} className="space-y-6">
                    {/* Digit Code Input */}
                    <div className="bg-slate-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800/60">
                      <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 font-bold mb-5 text-center">
                        6-Digit Workspace Code
                      </label>

                      <DigitCodeInput
                        value={codeDigits}
                        onChange={(v) => {
                          setCodeDigits(v);
                          setJoinError("");
                        }}
                        error={joinError}
                      />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {joinError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="flex items-center gap-2.5 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/25 p-3.5 rounded-xl font-medium"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{joinError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={isJoining || codeDigits.length !== 6}
                      onMouseEnter={() => setIsHoveringJoin(true)}
                      onMouseLeave={() => setIsHoveringJoin(false)}
                      whileHover={
                        codeDigits.length === 6 && !isJoining
                          ? { scale: 1.01 }
                          : {}
                      }
                      whileTap={
                        codeDigits.length === 6 && !isJoining
                          ? { scale: 0.98 }
                          : {}
                      }
                      className="relative w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none disabled:text-slate-500 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed overflow-hidden group"
                    >
                      {/* Shimmer */}
                      <AnimatePresence>
                        {isHoveringJoin && codeDigits.length === 6 && !isJoining && (
                          <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      {isJoining ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Finding workspace…</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Workspace</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </motion.button>

                    {/* Recent Workspaces */}
                    <AnimatePresence>
                      {recentCodes.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="pt-6 border-t border-slate-800/60"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-mono font-bold text-slate-400 mb-4">
                            <History className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Recent Workspaces</span>
                            <button
                              type="button"
                              onClick={() => {
                                setRecentCodes([]);
                                localStorage.removeItem("therevisionlab_recent_workspaces");
                              }}
                              className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="Clear recent workspaces"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
                            {recentCodes.map((item, i) => (
                              <motion.button
                                key={item.code}
                                type="button"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 + i * 0.06 }}
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                  setCodeDigits(item.code);
                                  setIsJoining(true);
                                  setJoinError("");
                                  try {
                                    const ws = await getWorkspace(item.code);
                                    onSelectWorkspace(ws);
                                  } catch (err: any) {
                                    setJoinError(
                                      "Failed to open recent workspace: " +
                                        err.message
                                    );
                                  } finally {
                                    setIsJoining(false);
                                  }
                                }}
                                className="p-3.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-indigo-500/40 rounded-xl text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="font-bold text-indigo-400 text-sm tracking-wider">
                                    {item.code}
                                  </span>
                                </span>
                                <span className="text-slate-400 text-xs truncate max-w-[160px] group-hover:text-slate-300 transition-colors">
                                  {item.name}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
              ) : (
                /* ─── CREATE TAB ─── */
                <motion.div
                  key="create"
                  variants={tabContentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="min-h-[300px]"
                >
                  <AnimatePresence mode="wait">
                    {!createdWorkspace ? (
                      <motion.form
                        key="create-form"
                        ref={createFormRef}
                        onSubmit={handleCreate}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        {/* Workspace Name + Icon */}
                        <div className="bg-slate-950/40 p-6 sm:p-8 rounded-2xl border border-slate-800/60 space-y-5">
                          <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                            Workspace Details
                          </label>

                          <div className="flex items-center gap-3">
                            <WorkspaceIconPicker
                              selectedIcon={selectedIcon}
                              onSelectIcon={setSelectedIcon}
                            />
                            <div className="flex-1 relative">
                              <input
                                type="text"
                                placeholder="e.g. Physics Revision"
                                value={workspaceNameInput}
                                onChange={(e) =>
                                  setWorkspaceNameInput(e.target.value)
                                }
                                className="w-full bg-slate-900/80 border-2 border-slate-800/80 focus:border-purple-500/60 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-950/60 rounded-xl px-4 py-2.5 border border-slate-800/40">
                            <Gem className="w-3 h-3 text-purple-400/60" />
                            <span>
                              Pick a name and icon that represents your subject
                            </span>
                          </div>
                        </div>

                        {/* Create Button */}
                        <motion.button
                          type="submit"
                          disabled={isCreating}
                          whileHover={!isCreating ? { scale: 1.01 } : {}}
                          whileTap={!isCreating ? { scale: 0.98 } : {}}
                          className="relative w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-purple-600/20 disabled:shadow-none disabled:text-slate-500 flex items-center justify-center gap-2 cursor-pointer overflow-hidden group"
                        >
                          {isCreating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Creating workspace…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                              <span>Create Workspace</span>
                              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    ) : (
                      /* ─── CREATED WORKSPACE SUCCESS ─── */
                      <motion.div
                        key="created-success"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          ease: [0.23, 1, 0.32, 1],
                        }}
                        className="text-center space-y-6"
                      >
                        {/* Success Banner */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 0.15,
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="relative bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 overflow-hidden"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.3,
                              type: "spring",
                              stiffness: 200,
                              damping: 12,
                            }}
                            className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"
                          />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.4,
                              type: "spring",
                              stiffness: 200,
                              damping: 12,
                            }}
                            className="absolute -bottom-6 -left-6 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl"
                          />

                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.25 }}
                          >
                            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                              <PartyPopper className="w-7 h-7 text-emerald-400" />
                            </div>
                            <span className="text-xs uppercase font-mono font-bold text-emerald-400 tracking-widest">
                              Workspace Ready!
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mt-2 flex items-center justify-center gap-2">
                              {CreatedIcon && (
                                <CreatedIcon className="w-6 h-6 text-purple-400" />
                              )}
                              {createdWorkspace.name}
                            </h3>
                          </motion.div>
                        </motion.div>

                        {/* Code Display */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.35 }}
                        >
                          <span className="text-xs uppercase font-mono font-bold text-slate-400 block mb-3 tracking-wider">
                            Your 6-Digit Code
                          </span>
                          <div className="flex items-center justify-center gap-3">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                delay: 0.45,
                                type: "spring",
                                stiffness: 150,
                                damping: 12,
                              }}
                              className="bg-slate-950 border-2 border-purple-500/60 rounded-2xl px-8 py-4 font-mono text-3xl sm:text-4xl font-black text-purple-400 tracking-[0.25em] shadow-xl shadow-purple-500/10"
                            >
                              {createdWorkspace.code}
                            </motion.div>

                            <motion.button
                              type="button"
                              onClick={handleCopyCode}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                                copiedCode
                                  ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                                  : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-200 hover:text-white"
                              }`}
                              title="Copy Workspace Code"
                            >
                              {copiedIcon === "party" ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  key="party"
                                >
                                  <PartyPopper className="w-6 h-6" />
                                </motion.div>
                              ) : copiedCode ? (
                                <Check className="w-6 h-6" />
                              ) : (
                                <Copy className="w-6 h-6" />
                              )}
                            </motion.button>
                          </div>

                          <AnimatePresence>
                            {copiedCode && (
                              <motion.p
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="text-xs text-emerald-400 font-mono font-bold mt-3 flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Copied to clipboard!
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Proceed Button */}
                        <motion.button
                          type="button"
                          onClick={() => onSelectWorkspace(createdWorkspace)}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.55 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative w-full max-w-md mx-auto py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer overflow-hidden group"
                        >
                          <span>Proceed to Workspace</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 text-center py-4 border-t border-slate-800/50 text-[11px] text-slate-600 font-mono"
      >
        TheRevisionLab
      </motion.footer>
    </div>
  );
}