import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, Plus, Trash2, Edit3, Check, 
  ChevronRight, ChevronLeft, Save, Settings, X, PlusCircle, MinusCircle, 
  HelpCircle, Sparkles, BookOpen, FileText, Settings2, Key, Info, Eye, EyeOff, ShieldCheck, ArrowLeft, Shuffle,
  Upload, Link as LinkIcon, FolderOpen, KeyRound, CheckCircle, ExternalLink, Download, RefreshCw, File
} from "lucide-react";
import gsap from "gsap";
import { Chapter, Topic, Question, Flashcard, Workspace, StudyMaterial } from "../types";
import { updateMentorPasswordApi, updateWorkspaceSyllabus } from "../lib/api";
import { getDocumentTypeInfo } from "../lib/documentUtils";
import { getWorkspaceIconComponent } from "../lib/workspaceIcons";
import WorkspaceIconPicker from "./WorkspaceIconPicker";
import DocumentViewerModal from "./DocumentViewerModal";

interface MentorViewProps {
  workspace: Workspace;
  onSyllabusChange: (updatedChapters: Chapter[]) => void;
  onUploadMaterial: (material: {
    title: string;
    description: string;
    type: "pdf" | "notes" | "link" | "file";
    urlOrContent: string;
    fileName?: string;
    fileSize?: string;
    topicTag?: string;
  }) => Promise<void>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onNavigateToStudent: () => void;
  onSwitchWorkspace: () => void;
}

export default function MentorView({
  workspace,
  onSyllabusChange,
  onUploadMaterial,
  onDeleteMaterial,
  onNavigateToStudent,
  onSwitchWorkspace,
}: MentorViewProps) {
  const chapters = workspace.chapters || [];
  const materials = workspace.materials || [];

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  const getActiveMentorPassword = (): string => {
    return workspace.mentorPassword || "12345678";
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = getActiveMentorPassword();
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect password. Default password for new workspaces is 12345678.");
    }
  };

  // Selection states
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Form creation inputs
  const [newChapterName, setNewChapterName] = useState<string>("");
  const [newTopicName, setNewTopicName] = useState<string>("");

  // Edit Chapter Name
  const [isEditingChapterName, setIsEditingChapterName] = useState<boolean>(false);
  const [editChapterNameInput, setEditChapterNameInput] = useState<string>("");

  // Panel modes: null | "make_quiz" | "make_flashcards" | "materials" | "settings"
  const [panelMode, setPanelMode] = useState<"make_quiz" | "make_flashcards" | "materials" | "settings" | null>(null);

  // Settings Panel Inputs
  const [editWorkspaceName, setEditWorkspaceName] = useState<string>(workspace.name);
  const [editWorkspaceIcon, setEditWorkspaceIcon] = useState<string>(workspace.icon || "FolderOpen");
  const [detailsMessage, setDetailsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState<boolean>(false);

  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  useEffect(() => {
    setEditWorkspaceName(workspace.name);
    setEditWorkspaceIcon(workspace.icon || "FolderOpen");
  }, [workspace]);

  // Study Material Upload State
  const [matTitle, setMatTitle] = useState<string>("");
  const [matDescription, setMatDescription] = useState<string>("");
  const [matType, setMatType] = useState<"pdf" | "notes" | "link" | "file">("file");
  const [matContentOrUrl, setMatContentOrUrl] = useState<string>("");
  const [matFileName, setMatFileName] = useState<string>("");
  const [matFileSize, setMatFileSize] = useState<string>("");
  const [matTopicTag, setMatTopicTag] = useState<string>("");
  const [isUploadingMat, setIsUploadingMat] = useState<boolean>(false);
  const [matStatusMsg, setMatStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Quiz Builder Inputs
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState<string>("");
  const [questionSubtext, setQuestionSubtext] = useState<string>("");
  const [questionOptions, setQuestionOptions] = useState<string[]>(["", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);

  // Flashcards Builder Inputs
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>([]);
  const [fcFrontText, setFcFrontText] = useState<string>("");
  const [fcBackText, setFcBackText] = useState<string>("");
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);

  // Sidebar states
  const [sidebarSearch, setSidebarSearch] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Refs for animation
  const formAnimationRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);

  // Auto-expand active selections
  useEffect(() => {
    if (selectedChapter) {
      setExpandedNodes((prev) => ({ ...prev, [selectedChapter.id]: true }));
    }
  }, [selectedChapter]);

  // Entrance animations
  useEffect(() => {
    if (!isAuthenticated && loginRef.current) {
      gsap.fromTo(
        loginRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.1)" }
      );
    }
  }, [isAuthenticated]);

  // Load Quiz or Flashcards when topic is selected or panel opens
  useEffect(() => {
    if (selectedTopic) {
      setQuizQuestions(selectedTopic.quiz?.questions || []);
      setFlashcardsList(selectedTopic.flashcards || []);
    }
  }, [selectedTopic, panelMode]);

  // Sync main syllabus to parent
  const updateSyllabus = (updatedChapters: Chapter[]) => {
    onSyllabusChange(updatedChapters);

    if (selectedChapter) {
      const freshChapter = updatedChapters.find((c) => c.id === selectedChapter.id) || null;
      setSelectedChapter(freshChapter);

      if (freshChapter && selectedTopic) {
        const freshTopic = freshChapter.topics.find((t) => t.id === selectedTopic.id) || null;
        setSelectedTopic(freshTopic);
      }
    }
  };

  // ==================== CHAPTER & TOPIC ACTIONS ====================

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    const newChap: Chapter = {
      id: "chap-" + Date.now(),
      name: newChapterName.trim(),
      topics: []
    };
    updateSyllabus([...chapters, newChap]);
    setNewChapterName("");
    setSelectedChapter(newChap);
  };

  const handleDeleteChapter = (chapterId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this Chapter? All topics, quizzes, and flashcards inside it will be permanently deleted.")) {
      updateSyllabus(chapters.filter((c) => c.id !== chapterId));
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
        setSelectedTopic(null);
        setPanelMode(null);
      }
    }
  };

  const handleRenameChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter || !editChapterNameInput.trim()) return;
    const updated = chapters.map((c) => {
      if (c.id === selectedChapter.id) {
        return { ...c, name: editChapterNameInput.trim() };
      }
      return c;
    });
    updateSyllabus(updated);
    setIsEditingChapterName(false);
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter || !newTopicName.trim()) return;
    const newTop: Topic = {
      id: "top-" + Date.now(),
      name: newTopicName.trim(),
      quiz: { questions: [] },
      flashcards: []
    };
    const updated = chapters.map((c) => {
      if (c.id === selectedChapter.id) {
        return { ...c, topics: [...c.topics, newTop] };
      }
      return c;
    });
    updateSyllabus(updated);
    setNewTopicName("");
  };

  const handleDeleteTopic = (topicId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this topic?")) {
      const updated = chapters.map((c) => {
        if (c.id === selectedChapter!.id) {
          return { ...c, topics: c.topics.filter((t) => t.id !== topicId) };
        }
        return c;
      });
      updateSyllabus(updated);
      if (selectedTopic?.id === topicId) {
        setSelectedTopic(null);
        setPanelMode(null);
      }
    }
  };

  // ==================== STUDY MATERIAL ACTIONS ====================

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setMatContentOrUrl(base64Url);
      setMatFileName(file.name);
      
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      const sizeInKB = (file.size / 1024).toFixed(1);
      setMatFileSize(file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`);

      if (!matTitle) {
        setMatTitle(file.name.replace(/\.[^/.]+$/, ""));
      }

      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".pdf") || file.type.includes("pdf")) {
        setMatType("pdf");
      } else {
        setMatType("file");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStudyMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim() || !matContentOrUrl.trim()) {
      setMatStatusMsg({ type: "error", text: "Please enter a title and content/URL/file." });
      return;
    }

    setIsUploadingMat(true);
    setMatStatusMsg(null);

    try {
      await onUploadMaterial({
        title: matTitle.trim(),
        description: matDescription.trim(),
        type: matType,
        urlOrContent: matContentOrUrl.trim(),
        fileName: matFileName || undefined,
        fileSize: matFileSize || undefined,
        topicTag: matTopicTag.trim() || undefined,
      });

      setMatStatusMsg({ type: "success", text: "Study material published to Student Homepage!" });
      setMatTitle("");
      setMatDescription("");
      setMatContentOrUrl("");
      setMatFileName("");
      setMatFileSize("");
      setMatTopicTag("");
    } catch (err: any) {
      setMatStatusMsg({ type: "error", text: err.message || "Failed to publish study material." });
    } finally {
      setIsUploadingMat(false);
    }
  };

  // ==================== QUIZ WORKSHOP ACTIONS ====================

  const handleAddOption = () => {
    if (questionOptions.length < 6) {
      setQuestionOptions([...questionOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (questionOptions.length > 2) {
      const updated = questionOptions.filter((_, i) => i !== index);
      setQuestionOptions(updated);
      if (correctOptionIdx >= updated.length) {
        setCorrectOptionIdx(updated.length - 1);
      }
    }
  };

  const handleOptionChange = (text: string, index: number) => {
    const updated = [...questionOptions];
    updated[index] = text;
    setQuestionOptions(updated);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const validOptions = questionOptions.map((o) => o.trim()).filter((o) => o !== "");
    if (validOptions.length < 2) {
      alert("A question must have at least 2 non-empty options.");
      return;
    }

    let updatedQuestions: Question[] = [];

    if (editingQuestionId) {
      updatedQuestions = quizQuestions.map((q) => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            text: questionText.trim(),
            subtext: questionSubtext.trim() || undefined,
            options: validOptions,
            correctAnswerIndex: Math.min(correctOptionIdx, validOptions.length - 1)
          };
        }
        return q;
      });
    } else {
      const newQ: Question = {
        id: "q-" + Date.now(),
        text: questionText.trim(),
        subtext: questionSubtext.trim() || undefined,
        options: validOptions,
        correctAnswerIndex: Math.min(correctOptionIdx, validOptions.length - 1)
      };
      updatedQuestions = [...quizQuestions, newQ];
    }

    setQuizQuestions(updatedQuestions);

    const updatedChapters = chapters.map((c) => {
      if (c.id === selectedChapter!.id) {
        return {
          ...c,
          topics: c.topics.map((t) => {
            if (t.id === selectedTopic!.id) {
              return { ...t, quiz: { questions: updatedQuestions } };
            }
            return t;
          })
        };
      }
      return c;
    });

    updateSyllabus(updatedChapters);

    // Reset form
    setEditingQuestionId(null);
    setQuestionText("");
    setQuestionSubtext("");
    setQuestionOptions(["", ""]);
    setCorrectOptionIdx(0);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.text);
    setQuestionSubtext(q.subtext || "");
    setQuestionOptions([...q.options]);
    setCorrectOptionIdx(q.correctAnswerIndex);
  };

  const handleDeleteQuestion = (qId: string) => {
    const updatedQuestions = quizQuestions.filter((q) => q.id !== qId);
    setQuizQuestions(updatedQuestions);

    const updatedChapters = chapters.map((c) => {
      if (c.id === selectedChapter!.id) {
        return {
          ...c,
          topics: c.topics.map((t) => {
            if (t.id === selectedTopic!.id) {
              return { ...t, quiz: { questions: updatedQuestions } };
            }
            return t;
          })
        };
      }
      return c;
    });

    updateSyllabus(updatedChapters);
  };

  // ==================== FLASHCARD WORKSHOP ACTIONS ====================

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcFrontText.trim() || !fcBackText.trim()) return;

    let updatedFCs: Flashcard[];

    if (editingFlashcardId) {
      updatedFCs = flashcardsList.map((fc) => {
        if (fc.id === editingFlashcardId) {
          return { ...fc, front: fcFrontText.trim(), back: fcBackText.trim() };
        }
        return fc;
      });
    } else {
      const newFc: Flashcard = {
        id: "fc-" + Date.now(),
        front: fcFrontText.trim(),
        back: fcBackText.trim()
      };
      updatedFCs = [...flashcardsList, newFc];
    }

    setFlashcardsList(updatedFCs);

    const updatedChapters = chapters.map((c) => {
      if (c.id === selectedChapter!.id) {
        return {
          ...c,
          topics: c.topics.map((t) => {
            if (t.id === selectedTopic!.id) {
              return { ...t, flashcards: updatedFCs };
            }
            return t;
          })
        };
      }
      return c;
    });

    updateSyllabus(updatedChapters);
    setFcFrontText("");
    setFcBackText("");
    setEditingFlashcardId(null);
  };

  const handleDeleteFlashcard = (fcId: string) => {
    const updatedFCs = flashcardsList.filter((f) => f.id !== fcId);
    setFlashcardsList(updatedFCs);

    const updatedChapters = chapters.map((c) => {
      if (c.id === selectedChapter!.id) {
        return {
          ...c,
          topics: c.topics.map((t) => {
            if (t.id === selectedTopic!.id) {
              return { ...t, flashcards: updatedFCs };
            }
            return t;
          })
        };
      }
      return c;
    });

    updateSyllabus(updatedChapters);
  };

  // ==================== WORKSPACE CUSTOMIZATION ====================

  const handleUpdateWorkspaceDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsMessage(null);
    setIsUpdatingDetails(true);

    try {
      await updateWorkspaceSyllabus(workspace.code, undefined, editWorkspaceName.trim() || workspace.name, editWorkspaceIcon);
      workspace.name = editWorkspaceName.trim() || workspace.name;
      workspace.icon = editWorkspaceIcon;
      setDetailsMessage({ type: "success", text: "Workspace icon and details updated successfully!" });
    } catch (err: any) {
      setDetailsMessage({ type: "error", text: err.message || "Failed to update workspace details." });
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  // ==================== PASSWORD UPDATE ====================

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage(null);

    if (newPassword.length < 6) {
      setSettingsMessage({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await updateMentorPasswordApi(workspace.code, currentPasswordConfirm, newPassword);
      setSettingsMessage({ type: "success", text: "Password updated successfully in workspace database!" });
      setCurrentPasswordConfirm("");
      setNewPassword("");
    } catch (err: any) {
      setSettingsMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Filtered sidebar tree
  const filteredChapters = chapters.filter((c) =>
    c.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
    c.topics.some((t) => t.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
  );

  // AUTHENTICATION LOGIN GATEWAY
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans" style={{ zoom: 1.15 }}>
        {/* Removed background glow accents */}

        <div ref={loginRef} className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />

          <button
            onClick={onNavigateToStudent}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Student Dashboard
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-display font-extrabold text-white">
              Mentor Dashboard
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Workspace Code: <span className="font-mono font-bold text-purple-400">{workspace.code}</span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                Mentor Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter mentor password (default- 12345678)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500 font-mono">
              TheRevisionLab Mentor Portal
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans" style={{ zoom: 1.15 }}>
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToStudent}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Return to Student View"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {(() => {
              const HeaderIcon = getWorkspaceIconComponent(workspace.icon);
              return (
                <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white flex items-center justify-center">
                  <HeaderIcon className="w-5 h-5" />
                </div>
              );
            })()}

            <div>
              <h1 className="text-base font-extrabold font-display tracking-tight text-white flex items-center gap-2">
                Mentor Dashboard
                <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase">
                  {workspace.code}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Workspace: <span className="text-slate-200 font-medium">{workspace.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPanelMode("materials")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                panelMode === "materials"
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Study Materials ({materials.length})</span>
            </button>

            <button
              onClick={() => setPanelMode("settings")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                panelMode === "settings"
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={onNavigateToStudent}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Student View
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 md:px-6 py-6 gap-6">

        {/* SIDEBAR: CHAPTERS & TOPICS DIRECTORY TREE */}
        <aside className="w-80 shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Syllabus Directory
              </span>
            </div>

            {/* Search Sidebar */}
            <input
              type="text"
              placeholder="Filter chapters..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none mb-4 font-sans"
            />

            {/* Add Chapter Input */}
            <form onSubmit={handleAddChapter} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="+ New Chapter Name"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newChapterName.trim()}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-white rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Chapters Tree List */}
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
              {filteredChapters.map((chapter) => {
                const isSelectedCh = selectedChapter?.id === chapter.id;
                const isExpanded = expandedNodes[chapter.id];

                return (
                  <div key={chapter.id} className="rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950/40">
                    <div
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setSelectedTopic(null);
                        setPanelMode(null);
                        setExpandedNodes((prev) => ({ ...prev, [chapter.id]: !prev[chapter.id] }));
                      }}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelectedCh ? "bg-purple-950/40 text-purple-200 font-bold" : "hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        <span className="text-xs truncate">{chapter.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-slate-500">
                          {chapter.topics.length}
                        </span>
                        <button
                          onClick={(e) => handleDeleteChapter(chapter.id, e)}
                          className="p-1 hover:text-rose-400 text-slate-600 transition-colors"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Topics List Under Chapter */}
                    {isExpanded && (
                      <div className="pl-6 pr-2 py-1 bg-slate-900/60 border-t border-slate-800/60 space-y-1">
                        {chapter.topics.map((topic) => {
                          const isSelectedTop = selectedTopic?.id === topic.id;
                          return (
                            <div
                              key={topic.id}
                              onClick={() => {
                                setSelectedChapter(chapter);
                                setSelectedTopic(topic);
                                setPanelMode(null);
                              }}
                              className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                isSelectedTop ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-800 text-slate-400"
                              }`}
                            >
                              <span className="truncate">{topic.name}</span>
                              <button
                                onClick={(e) => handleDeleteTopic(topic.id, e)}
                                className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}

                        {/* Add Topic under Chapter */}
                        {isSelectedCh && (
                          <form onSubmit={handleAddTopic} className="flex gap-1.5 pt-1 pb-1">
                            <input
                              type="text"
                              placeholder="+ Topic Name"
                              value={newTopicName}
                              onChange={(e) => setNewTopicName(e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!newTopicName.trim()}
                              className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative flex flex-col overflow-y-auto max-h-[calc(100vh-120px)]">

          {/* PANEL 1: STUDY MATERIALS WORKSHOP */}
          {panelMode === "materials" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <span>Upload Study Material & Documents</span>
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Upload documents of any format (PDF, Word, PowerPoint, Excel, Images, Text, ZIP), lecture notes, or web links for your students.
                  </p>
                </div>
                <button
                  onClick={() => setPanelMode(null)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleCreateStudyMaterial} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Material Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 1 Formula Sheet / Class Notes..."
                      value={matTitle}
                      onChange={(e) => setMatTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Topic / Chapter Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spherical Mirrors or General"
                      value={matTopicTag}
                      onChange={(e) => setMatTopicTag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reference document for revision test..."
                    value={matDescription}
                    onChange={(e) => setMatDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Material Type Switch */}
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-2">
                    Material Source & Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMatType("file")}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        matType === "file" || matType === "pdf" ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Document File (Any Format)
                    </button>

                    <button
                      type="button"
                      onClick={() => setMatType("notes")}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        matType === "notes" ? "bg-amber-500/20 border-amber-500 text-amber-300" : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Written Lecture Notes
                    </button>

                    <button
                      type="button"
                      onClick={() => setMatType("link")}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        matType === "link" ? "bg-sky-500/20 border-sky-500 text-sky-300" : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      Web Link / Resource URL
                    </button>
                  </div>
                </div>

                {/* Input Fields according to type */}
                {matType === "notes" && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Note Content / Text / Markdown
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write or paste your revision notes here..."
                      value={matContentOrUrl}
                      onChange={(e) => setMatContentOrUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                )}

                {matType === "link" && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Destination Web URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/study-guide.pdf"
                      value={matContentOrUrl}
                      onChange={(e) => setMatContentOrUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                )}

                {(matType === "file" || matType === "pdf") && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Upload Document File (PDF, Word, PowerPoint, Excel, Images, Text, ZIP, etc.)
                    </label>
                    <div className="bg-slate-950 border border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 text-center transition-colors">
                      <input
                        type="file"
                        accept="*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white file:text-xs file:font-bold hover:file:bg-purple-700 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-500 mt-2 font-mono">
                        Supported: Any file format (PDF, DOCX, PPTX, XLSX, TXT, PNG, JPG, ZIP, etc.) up to 25MB
                      </p>
                    </div>
                    {matFileName && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>File Attached: <strong>{matFileName}</strong> ({matFileSize})</span>
                      </div>
                    )}
                  </div>
                )}

                {matStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    matStatusMsg.type === "success" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                  }`}>
                    {matStatusMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploadingMat}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUploadingMat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Publish Document / Study Material</span>
                </button>
              </form>

              {/* Uploaded Study Materials Table */}
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-300 uppercase tracking-wider mb-3">
                  Published Study Materials & Documents ({materials.length})
                </h3>

                {materials.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
                    No study materials uploaded yet. Use the form above to attach document files, notes, or web links.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {materials.map((m) => {
                      const docInfo = getDocumentTypeInfo(m);
                      return (
                        <div key={m.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-3 truncate">
                            <div className={`p-2 rounded-xl border ${docInfo.badgeClass} shrink-0`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white truncate">{m.title}</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${docInfo.badgeClass}`}>
                                  {docInfo.label}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                {m.fileName ? `File: ${m.fileName} (${m.fileSize || "Attachment"}) • ` : ""}Tag: {m.topicTag || "General"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(docInfo.category === "notes" || docInfo.category === "text") ? (
                              <button
                                onClick={() => setViewingMaterial(m)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-400" />
                                <span>Preview</span>
                              </button>
                            ) : (
                              <a
                                href={m.urlOrContent}
                                download={m.fileName || `${m.title.replace(/\s+/g, "_")}.${docInfo.category}`}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Download document to device"
                              >
                                <Download className="w-3.5 h-3.5 text-purple-400" />
                                <span>Download</span>
                              </a>
                            )}

                            <button
                              onClick={async () => {
                                if (confirm(`Delete "${m.title}"?`)) {
                                  await onDeleteMaterial(m.id);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Material"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DOCUMENT VIEWER MODAL IN MENTOR VIEW */}
          {viewingMaterial && (
            <DocumentViewerModal
              material={viewingMaterial}
              onClose={() => setViewingMaterial(null)}
            />
          )}

          {/* PANEL 2: SETTINGS WORKSHOP */}
          {panelMode === "settings" && (
            <div className="max-w-md mx-auto w-full space-y-8 py-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white font-display">Workspace Settings</h2>
                </div>
                <button onClick={() => setPanelMode(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECTION 1: WORKSPACE IDENTITY & ICON CUSTOMIZATION */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Workspace Identity & Icon
                  </h3>
                </div>

                <form onSubmit={handleUpdateWorkspaceDetails} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Workspace Name & Icon
                    </label>
                    <div className="flex items-center gap-2">
                      <WorkspaceIconPicker
                        selectedIcon={editWorkspaceIcon}
                        onSelectIcon={setEditWorkspaceIcon}
                      />
                      <input
                        type="text"
                        value={editWorkspaceName}
                        onChange={(e) => setEditWorkspaceName(e.target.value)}
                        placeholder="Workspace Name"
                        className="flex-1 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {detailsMessage && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${
                      detailsMessage.type === "success" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                    }`}>
                      {detailsMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingDetails}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {isUpdatingDetails ? "Saving..." : "Save Workspace Customization"}
                  </button>
                </form>
              </div>

              {/* SECTION 2: SECURITY & PASSWORD */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Mentor Password
                  </h3>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPasswordConfirm}
                      onChange={(e) => setCurrentPasswordConfirm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                      New Mentor Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {settingsMessage && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${
                      settingsMessage.type === "success" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                    }`}>
                      {settingsMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Mentor Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PANEL 3: TOPIC SELECTION / QUIZ / FLASHCARD BUILDER */}
          {!panelMode && (
            <div>
              {selectedTopic ? (
                <div className="space-y-6">
                  {/* Topic Header */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        Chapter: {selectedChapter?.name}
                      </span>
                      <h2 className="text-xl font-display font-extrabold text-white mt-1">
                        {selectedTopic.name}
                      </h2>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setPanelMode("make_quiz")}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Build Quiz ({quizQuestions.length} Qs)</span>
                      </button>

                      <button
                        onClick={() => setPanelMode("make_flashcards")}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Build Flashcards ({flashcardsList.length} Cards)</span>
                      </button>
                    </div>
                  </div>

                  {/* Overview of Topic Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quiz Questions List */}
                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl">
                      <h3 className="text-sm font-bold text-white font-display mb-3 flex items-center justify-between">
                        <span>Quiz Questions ({quizQuestions.length})</span>
                      </h3>

                      {quizQuestions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No quiz questions logged for this topic.</p>
                      ) : (
                        <div className="space-y-2">
                          {quizQuestions.map((q, idx) => (
                            <div key={q.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-indigo-400 mr-1.5">Q{idx + 1}.</span>
                                <span className="text-slate-200">{q.text}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    handleEditQuestion(q);
                                    setPanelMode("make_quiz");
                                  }}
                                  className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
                                  title="Edit question"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Delete question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Flashcards List */}
                    <div className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl">
                      <h3 className="text-sm font-bold text-white font-display mb-3 flex items-center justify-between">
                        <span>Flashcard Decks ({flashcardsList.length})</span>
                      </h3>

                      {flashcardsList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No flashcards logged for this topic.</p>
                      ) : (
                        <div className="space-y-2">
                          {flashcardsList.map((fc, idx) => (
                            <div key={fc.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-purple-400 mr-1.5">Card {idx + 1}.</span>
                                <span className="text-slate-200">{fc.front}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingFlashcardId(fc.id);
                                    setFcFrontText(fc.front);
                                    setFcBackText(fc.back);
                                    setPanelMode("make_flashcards");
                                  }}
                                  className="text-slate-500 hover:text-purple-400 p-1 transition-colors"
                                  title="Edit flashcard"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFlashcard(fc.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                  title="Delete flashcard"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedChapter ? (
                <div className="text-center py-12 max-w-sm mx-auto">
                  <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white font-display">{selectedChapter.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a topic from the sidebar on the left to add questions or flashcards, or create a new topic.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16 max-w-sm mx-auto">
                  <ShieldCheck className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white font-display">Mentor Workspace Control</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select a chapter or topic from the syllabus tree on the left to start editing syllabus content, or click "Study Materials" in the header to upload notes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PANEL 4: QUIZ WORKSHOP PANEL */}
          {panelMode === "make_quiz" && selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display">
                  Quiz Question Builder for "{selectedTopic.name}"
                </h3>
                <button onClick={() => setPanelMode(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuestion} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Question Text
                  </label>
                  <input
                    type="text"
                    placeholder="Enter question statement..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Subtext / Hint (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Extra hint or detail..."
                    value={questionSubtext}
                    onChange={(e) => setQuestionSubtext(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Answer Options (Check radio for correct option)
                  </label>
                  <div className="space-y-2">
                    {questionOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOptionIdx === idx}
                          onChange={() => setCorrectOptionIdx(idx)}
                          className="accent-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(e.target.value, idx)}
                          className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        {questionOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-600 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {questionOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="mt-2 text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {editingQuestionId ? "Update Question" : "Save Question to Quiz"}
                </button>
              </form>
            </div>
          )}

          {/* PANEL 5: FLASHCARDS WORKSHOP PANEL */}
          {panelMode === "make_flashcards" && selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display">
                  Flashcard Builder for "{selectedTopic.name}"
                </h3>
                <button onClick={() => setPanelMode(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddFlashcard} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Front Side (Concept / Prompt)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. What is the Mirror Formula?"
                    value={fcFrontText}
                    onChange={(e) => setFcFrontText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                    Back Side (Answer / Explanation)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 1/f = 1/v + 1/u where f is focal length..."
                    value={fcBackText}
                    onChange={(e) => setFcBackText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {editingFlashcardId ? "Update Flashcard" : "Save Flashcard to Deck"}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}