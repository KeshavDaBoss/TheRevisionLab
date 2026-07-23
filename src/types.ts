export interface Question {
  id: string;
  text: string;
  subtext?: string; // Support for sub-parts / description
  options: string[]; // 2 to 6 options
  correctAnswerIndex: number;
}

export interface Quiz {
  questions: Question[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Topic {
  id: string;
  name: string;
  quiz?: Quiz;
  flashcards?: Flashcard[];
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

// Global settings
export interface MentorSettings {
  password: string;
}

export type MaterialType = "pdf" | "notes" | "link" | "file";

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  urlOrContent: string; // Base64 data URL, text notes, or web URL
  fileName?: string;
  fileSize?: string;
  topicTag?: string;
  createdAt: number;
}

export interface Workspace {
  code: string;
  name: string;
  icon?: string;
  chapters: Chapter[];
  materials: StudyMaterial[];
  mentorPassword?: string;
  createdAt: number;
  updatedAt: number;
}

