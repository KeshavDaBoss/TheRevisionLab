import React, { useState, useEffect } from "react";
import { Chapter, StudyMaterial, Workspace } from "./types";
import { 
  getWorkspace, 
  updateWorkspaceSyllabus, 
  uploadStudyMaterial, 
  deleteStudyMaterial 
} from "./lib/api";
import WorkspaceLogin from "./components/WorkspaceLogin";
import StudentView from "./components/StudentView";
import MentorView from "./components/MentorView";
import { RefreshCw, KeyRound, AlertCircle } from "lucide-react";

export default function App() {
  const [activeCode, setActiveCode] = useState<string | null>(() => {
    return localStorage.getItem("therevisionlab_active_code");
  });

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activePage, setActivePage] = useState<"student" | "mentor">("student");

  // Load active workspace on mount or code change
  useEffect(() => {
    if (!activeCode) {
      setWorkspace(null);
      setIsLoadingWorkspace(false);
      return;
    }

    let isMounted = true;
    setIsLoadingWorkspace(true);
    setFetchError(null);

    getWorkspace(activeCode)
      .then((ws) => {
        if (isMounted) {
          setWorkspace(ws);
          localStorage.setItem("therevisionlab_active_code", ws.code);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load workspace:", err);
          setFetchError(err.message || "Failed to load workspace.");
          // Clear invalid code
          localStorage.removeItem("therevisionlab_active_code");
          setActiveCode(null);
          setWorkspace(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingWorkspace(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCode]);

  // Workspace Login / Selection Handler
  const handleSelectWorkspace = (ws: Workspace) => {
    setWorkspace(ws);
    setActiveCode(ws.code);
    localStorage.setItem("therevisionlab_active_code", ws.code);
    setActivePage("student");
  };

  // Switch Workspace Handler
  const handleSwitchWorkspace = () => {
    localStorage.removeItem("therevisionlab_active_code");
    setActiveCode(null);
    setWorkspace(null);
  };

  // Handle Syllabus Changes (Sync to Turso Database via API)
  const handleSyllabusChange = async (updatedChapters: Chapter[]) => {
    if (!workspace) return;

    // Optimistic UI update
    setWorkspace((prev) => (prev ? { ...prev, chapters: updatedChapters } : null));

    try {
      await updateWorkspaceSyllabus(workspace.code, updatedChapters);
    } catch (err: any) {
      console.error("Failed to sync syllabus update to backend:", err);
      alert("Failed to save syllabus to database: " + err.message);
    }
  };

  // Handle Study Material Upload
  const handleUploadMaterial = async (materialData: {
    title: string;
    description: string;
    type: "pdf" | "notes" | "link" | "file";
    urlOrContent: string;
    fileName?: string;
    fileSize?: string;
    topicTag?: string;
  }) => {
    if (!workspace) return;

    const newMaterial = await uploadStudyMaterial(workspace.code, materialData);

    // Update local workspace state
    setWorkspace((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        materials: [newMaterial, ...(prev.materials || [])],
      };
    });
  };

  // Handle Delete Study Material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!workspace) return;

    await deleteStudyMaterial(workspace.code, materialId);

    setWorkspace((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        materials: (prev.materials || []).filter((m) => m.id !== materialId),
      };
    });
  };

  // Loading Screen
  if (isLoadingWorkspace) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-xs font-mono font-bold text-slate-200">
            Connecting to Turso Database for Workspace {activeCode}...
          </span>
        </div>
      </div>
    );
  }

  // Gateway Login screen when no workspace is active
  if (!workspace || !activeCode) {
    return <WorkspaceLogin onSelectWorkspace={handleSelectWorkspace} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 selection:text-white font-sans">
      {activePage === "student" && (
        <StudentView
          workspace={workspace}
          onNavigateToMentor={() => setActivePage("mentor")}
          onSwitchWorkspace={handleSwitchWorkspace}
        />
      )}

      {activePage === "mentor" && (
        <MentorView
          workspace={workspace}
          onSyllabusChange={handleSyllabusChange}
          onUploadMaterial={handleUploadMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onNavigateToStudent={() => setActivePage("student")}
          onSwitchWorkspace={handleSwitchWorkspace}
        />
      )}
    </div>
  );
}
