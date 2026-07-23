import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Clock, HelpCircle, ChevronRight, RefreshCw, Trophy, 
  ChevronLeft, Shuffle, CheckCircle, XCircle, Play, Info, ShieldCheck, Search, Layers, Sparkles,
  FileText, ExternalLink, Download, Copy, Check, KeyRound, FolderOpen, ArrowRight, X, Eye, File
} from "lucide-react";
import gsap from "gsap";
import { Chapter, Topic, Question, Flashcard, Workspace, StudyMaterial } from "../types";
import { getDocumentTypeInfo } from "../lib/documentUtils";
import { getWorkspaceIconComponent } from "../lib/workspaceIcons";
import DocumentViewerModal from "./DocumentViewerModal";

interface StudentViewProps {
  workspace: Workspace;
  onNavigateToMentor: () => void;
  onSwitchWorkspace: () => void;
}

export default function StudentView({ workspace, onNavigateToMentor, onSwitchWorkspace }: StudentViewProps) {
  const chapters = workspace.chapters || [];
  const materials = workspace.materials || [];

  // Main Homepage Tab: "chapters" | "materials"
  const [activeMainTab, setActiveMainTab] = useState<"chapters" | "materials">("chapters");

  // Navigation State
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Active session choice: null | "quiz" | "flashcards"
  const [sessionType, setSessionType] = useState<"quiz" | "flashcards" | null>(null);
  // Is session for entire chapter or topic?
  const [isChapterScope, setIsChapterScope] = useState<boolean>(false);

  // Quiz Gameplay State
  const [quizMode, setQuizMode] = useState<"timed" | "untimed" | null>(null);
  const [timedLimitInput, setTimedLimitInput] = useState<number>(60); // default 60 seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ questionId: string; chosenIndex: number; isCorrect: boolean }[]>([]);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);

  // Active Questions & Cards pools (computed depending on Topic vs Chapter scope)
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);

  // Flashcards Gameplay State
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isAnimatingCard, setIsAnimatingCard] = useState<boolean>(false);

  // Search filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [materialSearch, setMaterialSearch] = useState<string>("");
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>("all");

  // Active Note Modal Viewer
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Copy Code Feedback State
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Refs for Animations
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth entry transitions using GSAP
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [selectedChapter, selectedTopic, sessionType, quizMode, isQuizActive, isQuizFinished, activeMainTab]);

  // Handle Quiz Timer
  useEffect(() => {
    if (isQuizActive && quizMode === "timed") {
      setQuizTimeLeft(timedLimitInput);
      timerIntervalRef.current = setInterval(() => {
        setQuizTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsQuizActive(false);
            setIsQuizFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isQuizActive, quizMode, timedLimitInput]);

  const handleCopyWorkspaceCode = () => {
    navigator.clipboard.writeText(workspace.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Launch Session (Quiz or Flashcards) for either Topic or Chapter
  const launchQuizSession = (questions: Question[], chapterScope: boolean) => {
    if (questions.length === 0) return;
    setActiveQuestions(questions);
    setIsChapterScope(chapterScope);
    setSessionType("quiz");
    setQuizMode(null);
    setIsQuizActive(false);
    setIsQuizFinished(false);
  };

  const launchFlashcardsSession = (flashcards: Flashcard[], chapterScope: boolean) => {
    if (flashcards.length === 0) return;
    const cards = [...flashcards];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setActiveFlashcards(cards);
    setIsChapterScope(chapterScope);
    setSessionType("flashcards");
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  // Helper getters for Chapter totals
  const getChapterQuestions = (chapter: Chapter): Question[] => {
    const allQs: Question[] = [];
    chapter.topics.forEach((t) => {
      if (t.quiz?.questions) {
        allQs.push(...t.quiz.questions);
      }
    });
    return allQs;
  };

  const getChapterFlashcards = (chapter: Chapter): Flashcard[] => {
    const allFCs: Flashcard[] = [];
    chapter.topics.forEach((t) => {
      if (t.flashcards) {
        allFCs.push(...t.flashcards);
      }
    });
    return allFCs;
  };

  useEffect(() => {
    if (sessionType === "flashcards" && cardRef.current) {
      setIsFlipped(false);
      gsap.set(cardRef.current, {
        rotateY: 0,
        x: 0,
        opacity: 1,
        scale: 1
      });
    }
  }, [sessionType]);

  // Flashcard flip animation
  const handleCardClick = () => {
    if (!cardRef.current || isAnimatingCard) return;
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);

    gsap.to(cardRef.current, {
      rotateY: nextFlipped ? 180 : 0,
      duration: 0.4,
      ease: "power2.out"
    });
  };

  const handleNextCard = () => {
    if (currentCardIndex >= activeFlashcards.length - 1 || isAnimatingCard || !cardRef.current) return;
    setIsAnimatingCard(true);

    const cardEl = cardRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimatingCard(false);
      }
    });

    tl.to(cardEl, {
      x: -140,
      opacity: 0,
      scale: 0.88,
      duration: 0.2,
      ease: "power2.in"
    });

    tl.add(() => {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    });

    tl.set(cardEl, {
      x: 140,
      opacity: 0,
      scale: 0.88,
      rotateY: 0
    });

    tl.to(cardEl, {
      x: 0,
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: "power2.out"
    });
  };

  const handlePrevCard = () => {
    if (currentCardIndex <= 0 || isAnimatingCard || !cardRef.current) return;
    setIsAnimatingCard(true);

    const cardEl = cardRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimatingCard(false);
      }
    });

    tl.to(cardEl, {
      x: 140,
      opacity: 0,
      scale: 0.88,
      duration: 0.2,
      ease: "power2.in"
    });

    tl.add(() => {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    });

    tl.set(cardEl, {
      x: -140,
      opacity: 0,
      scale: 0.88,
      rotateY: 0
    });

    tl.to(cardEl, {
      x: 0,
      opacity: 1,
      scale: 1,
      duration: 0.28,
      ease: "power2.out"
    });
  };

  const handleSelectAnswer = (optionIndex: number, currentQuestion: Question) => {
    if (selectedAnswerIndex !== null) return;

    setSelectedAnswerIndex(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setQuizAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        chosenIndex: optionIndex,
        isCorrect
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsQuizActive(false);
      setIsQuizFinished(true);
    }
  };

  const startQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setQuizAnswers([]);
    setIsQuizActive(true);
    setIsQuizFinished(false);
  };

  const resetSession = () => {
    setSessionType(null);
    setQuizMode(null);
    setIsQuizActive(false);
    setIsQuizFinished(false);
    setActiveQuestions([]);
    setActiveFlashcards([]);
  };

  // Filtered lists
  const filteredChapters = chapters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.topics.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMaterials = materials.filter((mat) => {
    const matchesSearch =
      mat.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
      mat.description.toLowerCase().includes(materialSearch.toLowerCase()) ||
      (mat.topicTag && mat.topicTag.toLowerCase().includes(materialSearch.toLowerCase()));

    if (selectedMaterialFilter === "all") return matchesSearch;
    return matchesSearch && mat.type === selectedMaterialFilter;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col relative overflow-hidden font-sans pb-16" style={{ zoom: 1.15 }}>
      {/* Background Glow Accents */}
      <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Top Header */}
      <header className="border-b border-slate-800 bg-[#090d16]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-base sm:text-lg font-extrabold font-display tracking-tight text-white">
              TheRevisionLab
            </h1>
          </div>

          {/* Active Workspace Pill & Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onSwitchWorkspace}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch Workspace</span>
            </button>

            {/* Enter Mentor Dashboard Button */}
            <button
              id="enter-mentor-dashboard-btn"
              onClick={onNavigateToMentor}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20 group"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              <span>Mentor Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6 flex-1 flex flex-col justify-start">

        {/* Workspace Banner */}
        {(() => {
          const WorkspaceIconComp = getWorkspaceIconComponent(workspace.icon);
          return (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <WorkspaceIconComp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white font-display">{workspace.name}</h2>
                    <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      Code: {workspace.code}
                      <button
                        onClick={handleCopyWorkspaceCode}
                        className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy Workspace Code"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {/* Homepage View Switcher Tabs */}
              {!selectedChapter && !sessionType && (
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    onClick={() => setActiveMainTab("chapters")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeMainTab === "chapters"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Chapters ({chapters.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab("materials")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeMainTab === "materials"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Study Materials ({materials.length})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Dynamic Breadcrumbs */}
        {(selectedChapter || selectedTopic) && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-6 border-b border-slate-800/60 pb-3">
            <button
              onClick={() => {
                if (isQuizActive && !confirm("Leaving this page will discard your active quiz progress. Continue?")) return;
                setSelectedChapter(null);
                setSelectedTopic(null);
                resetSession();
              }}
              className="hover:text-indigo-400 cursor-pointer transition-colors font-semibold flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chapters</span>
            </button>

            {selectedChapter && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <button
                  onClick={() => {
                    if (isQuizActive && !confirm("Leaving this page will discard your active quiz progress. Continue?")) return;
                    setSelectedTopic(null);
                    resetSession();
                  }}
                  className="hover:text-indigo-400 cursor-pointer transition-colors max-w-[180px] truncate text-slate-200"
                >
                  {selectedChapter.name}
                </button>
              </>
            )}

            {selectedTopic && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-indigo-400 font-bold max-w-[180px] truncate">
                  {selectedTopic.name}
                </span>
              </>
            )}

            {sessionType && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-purple-400 font-bold">
                  {sessionType === "quiz" ? "Quiz Module" : "Flashcard Deck"} {isChapterScope ? "(Full Chapter)" : ""}
                </span>
              </>
            )}
          </div>
        )}

        <div ref={contentRef} className="flex-1 flex flex-col justify-start">

          {/* ==================== HOMEPAGE TAB 1: CHAPTERS DASHBOARD ==================== */}
          {activeMainTab === "chapters" && !selectedChapter && (
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
                    Chapters
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search chapters or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                  />
                </div>
              </div>

              {filteredChapters.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto my-12 shadow-xl relative">
                  <HelpCircle className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Chapters Found</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {searchQuery ? "No chapters match your search query." : "No chapters logged yet. Click 'Mentor Dashboard' in the header to construct chapters & topics."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChapters.map((chapter) => {
                    const chQuestions = getChapterQuestions(chapter);
                    const chFlashcards = getChapterFlashcards(chapter);

                    return (
                      <div
                        key={chapter.id}
                        className="rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:bg-slate-900/60 group relative overflow-hidden"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                              Chapter
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {chapter.topics.length} Topic{chapter.topics.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold font-display text-white group-hover:text-indigo-300 transition-colors mb-2">
                            {chapter.name}
                          </h3>

                          {/* Stats Pills */}
                          <div className="flex flex-wrap gap-2 my-4">
                            <div className="flex items-center gap-1.5 text-xs bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                              <span><strong>{chQuestions.length}</strong> Questions</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs bg-slate-950/60 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                              <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                              <span><strong>{chFlashcards.length}</strong> Flashcards</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-slate-800/60 flex flex-col gap-2">
                          <button
                            onClick={() => setSelectedChapter(chapter)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                          >
                            <span>Explore Chapter Topics</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={chQuestions.length === 0}
                              onClick={() => {
                                setSelectedChapter(chapter);
                                launchQuizSession(chQuestions, true);
                              }}
                              className="py-1.5 bg-slate-800 hover:bg-indigo-950/40 hover:border-indigo-500/40 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-indigo-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Take quiz containing all questions in this chapter"
                            >
                              <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                              <span>All Quiz Qs ({chQuestions.length})</span>
                            </button>

                            <button
                              disabled={chFlashcards.length === 0}
                              onClick={() => {
                                setSelectedChapter(chapter);
                                launchFlashcardsSession(chFlashcards, true);
                              }}
                              className="py-1.5 bg-slate-800 hover:bg-purple-950/40 hover:border-purple-500/40 border border-slate-700/80 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 hover:text-purple-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title="Practice all flashcards in this chapter"
                            >
                              <Shuffle className="w-3 h-3 text-purple-400" />
                              <span>All Deck ({chFlashcards.length})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== HOMEPAGE TAB 2: STUDY MATERIALS ==================== */}
          {activeMainTab === "materials" && !selectedChapter && (
            <div className="py-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
                    Study Materials
                  </h2>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedMaterialFilter}
                    onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                  >
                    <option value="all">All Material Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="link">Web Links & Resources</option>
                    <option value="file">Uploaded Files</option>
                  </select>

                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                    />
                  </div>
                </div>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto my-12 shadow-xl">
                  <FileText className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Study Materials Available</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {materialSearch
                      ? "No study materials match your search."
                      : "Your teacher has not uploaded any study materials for this workspace yet. Teachers can upload materials via the Mentor Dashboard."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((mat) => {
                    const docInfo = getDocumentTypeInfo(mat);
                    return (
                      <div
                        key={mat.id}
                        className="rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/40 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:bg-slate-900/70 relative group"
                      >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full border ${docInfo.badgeClass}`}>
                              {docInfo.label}
                            </span>

                            {mat.fileSize && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {mat.fileSize}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold font-display text-white group-hover:text-purple-300 transition-colors mb-2">
                            {mat.title}
                          </h3>

                          {mat.topicTag && (
                            <div className="inline-block text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md mb-3">
                              Tag: {mat.topicTag}
                            </div>
                          )}

                          <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed">
                            {mat.description || (mat.type === "notes" ? mat.urlOrContent : `Uploaded study document (${docInfo.label}).`)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setViewingMaterial(mat)}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Read</span>
                          </button>

                          {mat.urlOrContent && (
                            <a
                              href={mat.urlOrContent}
                              download={mat.fileName || `${mat.title.replace(/\s+/g, "_")}.${docInfo.category}`}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Download document to device"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Save</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENT / MATERIAL READER MODAL */}
          {viewingMaterial && (
            <DocumentViewerModal
              material={viewingMaterial}
              onClose={() => setViewingMaterial(null)}
            />
          )}

          {/* LEVEL 2, LEVEL 3, LEVEL 4 QUIZ & FLASHCARD RENDERINGS SAME AS EXISTING CODE */}
          {selectedChapter && !selectedTopic && !sessionType && (
            <div className="py-2">
              <button
                onClick={() => setSelectedChapter(null)}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-4 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Back to All Chapters
              </button>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 mb-8 relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    Active Chapter Overview
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white mt-2 mb-2">
                    {selectedChapter.name}
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                    Contains {selectedChapter.topics.length} topic{selectedChapter.topics.length !== 1 ? "s" : ""}. Choose a topic below or practice the entire chapter deck.
                  </p>
                </div>

                {(() => {
                  const chQuestions = getChapterQuestions(selectedChapter);
                  const chFlashcards = getChapterFlashcards(selectedChapter);

                  return (
                    <div className="mt-6 pt-5 border-t border-indigo-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="text-xs font-mono font-bold text-indigo-300 flex items-center gap-1.5 mr-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Chapter Master Tools:</span>
                      </div>

                      <button
                        disabled={chQuestions.length === 0}
                        onClick={() => launchQuizSession(chQuestions, true)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Practice All Questions ({chQuestions.length} Qs)</span>
                      </button>

                      <button
                        disabled={chFlashcards.length === 0}
                        onClick={() => launchFlashcardsSession(chFlashcards, true)}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/10"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Study All Flashcards ({chFlashcards.length} Cards)</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <span>Topics in this Chapter</span>
                <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                  {selectedChapter.topics.length}
                </span>
              </h3>

              {selectedChapter.topics.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-sm mx-auto shadow-xl">
                  <HelpCircle className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No topics added to this chapter yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {selectedChapter.topics.map((topic) => {
                    const qCount = topic.quiz?.questions?.length ?? 0;
                    const fcCount = topic.flashcards?.length ?? 0;

                    return (
                      <div
                        key={topic.id}
                        className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 text-left transition-all group flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="text-base font-bold text-white group-hover:text-indigo-300 font-display transition-colors mb-3">
                            {topic.name}
                          </h4>

                          <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold mb-4">
                            <span className={`px-2 py-0.5 rounded-full ${
                              qCount > 0 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-500"
                            }`}>
                              {qCount} Quiz Questions
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              fcCount > 0 ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-slate-800 text-slate-500"
                            }`}>
                              {fcCount} Flashcards
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedTopic(topic)}
                          className="w-full py-2 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Open Topic Engine</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LEVEL 3: TOPIC METHOD SELECTION */}
          {selectedChapter && selectedTopic && !sessionType && (
            <div className="py-4">
              <button
                onClick={() => setSelectedTopic(null)}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-6 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Chapter Topics
              </button>

              <div className="text-center max-w-xl mx-auto mb-10">
                <span className="text-xs bg-indigo-500/10 text-indigo-400 font-mono px-3 py-1 rounded-full border border-indigo-500/20 uppercase font-bold">
                  {selectedTopic.name}
                </span>
                <h2 className="text-3xl font-display font-extrabold tracking-tight text-white mt-4 mb-2">
                  Choose Learning Engine
                </h2>
                <p className="text-slate-400 text-xs">
                  Select how you would like to review this topic.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-t-2xl" />
                  <div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Quiz Module</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      Multiple choice tests with instant correctness feedback and optional timed mode.
                    </p>
                  </div>
                  <button
                    disabled={!selectedTopic.quiz || selectedTopic.quiz.questions.length === 0}
                    onClick={() => launchQuizSession(selectedTopic.quiz?.questions || [], false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {selectedTopic.quiz && selectedTopic.quiz.questions.length > 0
                      ? `Start Quiz (${selectedTopic.quiz.questions.length} Qs)`
                      : "No Questions Logged"}
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-purple-400 rounded-t-2xl" />
                  <div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">Flashcard Decks</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      Interactive 3D study cards with question prompts and quick flip answers.
                    </p>
                  </div>
                  <button
                    disabled={!selectedTopic.flashcards || selectedTopic.flashcards.length === 0}
                    onClick={() => launchFlashcardsSession(selectedTopic.flashcards || [], false)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Shuffle className="w-4 h-4" />
                    {selectedTopic.flashcards && selectedTopic.flashcards.length > 0
                      ? `Study Flashcards (${selectedTopic.flashcards.length} Cards)`
                      : "No Flashcards Logged"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 4A: QUIZ MODE SELECTION */}
          {sessionType === "quiz" && !quizMode && !isQuizFinished && (
            <div className="py-4">
              <button
                onClick={resetSession}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs mb-6 cursor-pointer font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Exit Session Options
              </button>

              <div className="text-center max-w-md mx-auto mb-8">
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-3 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                  {isChapterScope ? `Full Chapter: ${selectedChapter?.name}` : selectedTopic?.name}
                </span>
                <h2 className="text-2xl font-display font-bold text-white mt-3 mb-2">
                  Configure Quiz Mode
                </h2>
                <p className="text-slate-400 text-xs">
                  Select your practice parameters. ({activeQuestions.length} Total Questions)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto w-full">
                <button
                  onClick={() => {
                    setQuizMode("untimed");
                    startQuiz();
                  }}
                  className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all hover:scale-[1.01] group flex flex-col justify-between cursor-pointer focus:outline-none"
                >
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4 group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/10">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 font-display group-hover:text-indigo-400">Untimed Practice</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Learn step-by-step at your own relaxed pace without time pressure.
                    </p>
                  </div>
                </button>

                <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-left transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4 border border-indigo-500/10">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 font-display">Timed Challenge</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                      Countdown challenge to test your memory under speed constraints.
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold mb-1">
                        Countdown Seconds
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="600"
                        value={timedLimitInput}
                        onChange={(e) => setTimedLimitInput(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setQuizMode("timed");
                      startQuiz();
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Launch Timed Quiz
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LEVEL 4B: QUIZ GAMEPLAY */}
          {sessionType === "quiz" && quizMode && isQuizActive && !isQuizFinished && activeQuestions.length > 0 && (
            <div className="py-4 max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                <div className="text-xs text-slate-400 font-mono">
                  Question <strong className="text-white">{currentQuestionIndex + 1}</strong> of <strong className="text-white">{activeQuestions.length}</strong>
                </div>

                <div className="text-xs font-mono px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-bold">
                  Score: {score}
                </div>

                {quizMode === "timed" && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border font-bold ${
                    quizTimeLeft < 10 
                      ? "bg-rose-950/40 text-rose-400 border-rose-500/30 animate-pulse" 
                      : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{quizTimeLeft}s</span>
                  </div>
                )}
              </div>

              {(() => {
                const question = activeQuestions[currentQuestionIndex];
                return (
                  <div className="flex-1 flex flex-col justify-start">
                    <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2 leading-snug">
                      {question.text}
                    </h3>
                    
                    {question.subtext && (
                      <div className="flex items-start gap-2 p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-xl mb-6">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-200 leading-relaxed">
                          {question.subtext}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {question.options.map((option, index) => {
                        const isSelected = selectedAnswerIndex === index;
                        const isCorrect = index === question.correctAnswerIndex;
                        const hasAnswered = selectedAnswerIndex !== null;

                        let buttonStyle = "bg-slate-900/40 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-900/80";
                        let iconElement = null;

                        if (hasAnswered) {
                          if (isCorrect) {
                            buttonStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold";
                            iconElement = <CheckCircle className="w-4 h-4 text-emerald-400" />;
                          } else if (isSelected) {
                            buttonStyle = "bg-rose-950/40 border-rose-500 text-rose-300 font-semibold";
                            iconElement = <XCircle className="w-4 h-4 text-rose-400" />;
                          } else {
                            buttonStyle = "bg-slate-950/20 border-slate-900 text-slate-600 opacity-40";
                          }
                        }

                        return (
                          <button
                            key={index}
                            disabled={hasAnswered}
                            onClick={() => handleSelectAnswer(index, question)}
                            className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between focus:outline-none ${buttonStyle} ${!hasAnswered ? "cursor-pointer" : ""}`}
                          >
                            <span>{option}</span>
                            {iconElement}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswerIndex !== null && (
                      <div className="mt-6 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedAnswerIndex === question.correctAnswerIndex ? (
                            <span className="text-emerald-400 font-bold block mb-1">✓ Correct! Spot on.</span>
                          ) : (
                            <span className="text-rose-400 font-bold block mb-1">✕ Incorrect option.</span>
                          )}
                          Correct Answer: <strong className="text-white">"{question.options[question.correctAnswerIndex]}"</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={resetSession}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Quit Quiz
                </button>

                {selectedAnswerIndex !== null ? (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    {currentQuestionIndex < activeQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 italic">Select an option to proceed...</p>
                )}
              </div>
            </div>
          )}

          {/* LEVEL 4C: QUIZ REPORT */}
          {sessionType === "quiz" && isQuizFinished && (
            <div className="py-4 max-w-xl mx-auto w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Trophy className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-display font-extrabold text-white mb-2">Quiz Complete!</h2>
                <p className="text-slate-400 text-xs sm:text-sm">
                  {isChapterScope ? `Chapter Test: ${selectedChapter?.name}` : `Topic Test: ${selectedTopic?.name}`}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center mb-8 shadow-xl relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <p className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold mb-1">
                  Final Score
                </p>
                <div className="text-5xl font-display font-black text-white mb-2">
                  {score} / <span className="text-indigo-400">{activeQuestions.length}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {score === activeQuestions.length 
                    ? "✨ Outstanding! Perfect score across all questions." 
                    : score >= activeQuestions.length / 2 
                      ? "👍 Great effort! Review the flashcards to master remaining concepts." 
                      : "📚 Keep revising! Re-read topics and retry."}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startQuiz}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" /> Retry Quiz
                </button>
                <button
                  onClick={resetSession}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* LEVEL 4D: FLASHCARDS SESSION */}
          {sessionType === "flashcards" && activeFlashcards.length > 0 && (
            <div className="py-4 flex flex-col items-center max-w-xl mx-auto w-full flex-1 justify-between">
              <div className="w-full flex items-center justify-between mb-4">
                <button
                  onClick={resetSession}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs cursor-pointer font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Exit Flashcards
                </button>
                <div className="text-xs font-mono text-slate-400">
                  Card <strong className="text-white">{currentCardIndex + 1}</strong> of <strong className="text-white">{activeFlashcards.length}</strong>
                </div>
                <div className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> Auto-Shuffled
                </div>
              </div>

              <div className="w-full bg-slate-800 h-1 rounded-full mb-6 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / activeFlashcards.length) * 100}%` }}
                />
              </div>

              <div className="w-full flex justify-center py-2">
                <div 
                  className="w-full max-w-md h-72 perspective-1000 cursor-pointer"
                  onClick={handleCardClick}
                >
                  <div 
                    ref={cardRef}
                    className="w-full h-full transform-style-3d relative"
                  >
                    <div className="absolute inset-0 w-full h-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between backface-hidden shadow-xl hover:border-indigo-500/50 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono tracking-wider text-indigo-400 uppercase font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          Concept Prompt
                        </span>
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center text-center">
                        <p className="text-base sm:text-lg font-display font-semibold text-white px-2 leading-relaxed">
                          {activeFlashcards[currentCardIndex].front}
                        </p>
                      </div>

                      <div className="text-center text-[10px] text-slate-500 font-mono tracking-wider">
                        TAP CARD TO REVEAL ANSWER
                      </div>
                    </div>

                    <div className="absolute inset-0 w-full h-full bg-slate-950 border border-purple-500/30 rounded-2xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl shadow-purple-500/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                          Explanation / Answer
                        </span>
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                      </div>

                      <div className="flex-1 flex items-center justify-center text-center overflow-y-auto my-2 pr-1">
                        <p className="text-xs sm:text-sm font-sans font-medium text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {activeFlashcards[currentCardIndex].back}
                        </p>
                      </div>

                      <div className="text-center text-[10px] text-purple-500/60 font-mono tracking-wider">
                        TAP CARD TO FLIP BACK
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex items-center justify-between gap-4 mt-6">
                <button
                  disabled={currentCardIndex === 0 || isAnimatingCard}
                  onClick={handlePrevCard}
                  className="flex-1 py-3 bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={currentCardIndex === activeFlashcards.length - 1 || isAnimatingCard}
                  onClick={handleNextCard}
                  className="flex-1 py-3 bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
