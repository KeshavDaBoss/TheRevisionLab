import React from "react";
import {
  FolderOpen,
  BookOpen,
  GraduationCap,
  Atom,
  Brain,
  FlaskConical,
  Calculator,
  Globe,
  Microscope,
  Dna,
  Code2,
  Sparkles,
  Target,
  Trophy,
  Lightbulb,
  Music,
  Palette,
  Activity,
  Bookmark,
  FileText,
  Layers,
  Cpu,
  Flame,
  Scale,
  PenTool,
  Zap,
  Award,
  Rocket,
  Binary,
  Library,
  Clock,
  ShieldCheck,
  LucideProps
} from "lucide-react";

export interface WorkspaceIconOption {
  id: string;
  name: string;
  icon: React.ComponentType<LucideProps>;
}

export const WORKSPACE_ICONS: WorkspaceIconOption[] = [
  { id: "FolderOpen", name: "Folder", icon: FolderOpen },
  { id: "BookOpen", name: "Textbook", icon: BookOpen },
  { id: "GraduationCap", name: "Academy", icon: GraduationCap },
  { id: "Atom", name: "Physics", icon: Atom },
  { id: "Brain", name: "Mind & Brain", icon: Brain },
  { id: "FlaskConical", name: "Chemistry", icon: FlaskConical },
  { id: "Calculator", name: "Mathematics", icon: Calculator },
  { id: "Globe", name: "Geography", icon: Globe },
  { id: "Microscope", name: "Biology", icon: Microscope },
  { id: "Dna", name: "Genetics", icon: Dna },
  { id: "Code2", name: "Programming", icon: Code2 },
  { id: "Sparkles", name: "AI & Innovation", icon: Sparkles },
  { id: "Target", name: "Exam Prep", icon: Target },
  { id: "Trophy", name: "Achievement", icon: Trophy },
  { id: "Lightbulb", name: "Logic & Ideas", icon: Lightbulb },
  { id: "Music", name: "Music & Arts", icon: Music },
];

export function getWorkspaceIconComponent(iconId?: string): React.ComponentType<LucideProps> {
  const match = WORKSPACE_ICONS.find((item) => item.id === iconId);
  return match ? match.icon : FolderOpen;
}
