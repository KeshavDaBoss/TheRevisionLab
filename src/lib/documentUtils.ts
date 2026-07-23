import { StudyMaterial } from "../types";

export interface DocTypeInfo {
  label: string;
  badgeClass: string;
  category: "pdf" | "image" | "text" | "word" | "powerpoint" | "excel" | "archive" | "notes" | "link" | "file";
  iconName: "pdf" | "doc" | "ppt" | "xls" | "image" | "text" | "zip" | "notes" | "link" | "file";
  isDirectlyPreviewable: boolean;
}

export function getDocumentTypeInfo(material: StudyMaterial): DocTypeInfo {
  const fileName = (material.fileName || material.title || "").toLowerCase();
  const type = material.type;

  if (type === "link") {
    return {
      label: "Web Resource",
      badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      category: "link",
      iconName: "link",
      isDirectlyPreviewable: false,
    };
  }

  if (type === "notes" && !material.fileName) {
    return {
      label: "Lecture Notes",
      badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      category: "notes",
      iconName: "notes",
      isDirectlyPreviewable: true,
    };
  }

  // Check extension or data URL prefix
  if (fileName.endsWith(".pdf") || type === "pdf" || material.urlOrContent.startsWith("data:application/pdf")) {
    return {
      label: "PDF Document",
      badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      category: "pdf",
      iconName: "pdf",
      isDirectlyPreviewable: true,
    };
  }

  if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
    return {
      label: "Word Document",
      badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      category: "word",
      iconName: "doc",
      isDirectlyPreviewable: false,
    };
  }

  if (fileName.endsWith(".ppt") || fileName.endsWith(".pptx")) {
    return {
      label: "PowerPoint Slides",
      badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      category: "powerpoint",
      iconName: "ppt",
      isDirectlyPreviewable: false,
    };
  }

  if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx") || fileName.endsWith(".csv")) {
    return {
      label: "Excel Spreadsheet",
      badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      category: "excel",
      iconName: "xls",
      isDirectlyPreviewable: false,
    };
  }

  if (
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".svg") ||
    material.urlOrContent.startsWith("data:image/")
  ) {
    return {
      label: "Image Document",
      badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      category: "image",
      iconName: "image",
      isDirectlyPreviewable: true,
    };
  }

  if (
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".js") ||
    fileName.endsWith(".py") ||
    fileName.endsWith(".c") ||
    fileName.endsWith(".cpp") ||
    fileName.endsWith(".rtf") ||
    material.urlOrContent.startsWith("data:text/")
  ) {
    return {
      label: "Text File",
      badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      category: "text",
      iconName: "text",
      isDirectlyPreviewable: true,
    };
  }

  if (fileName.endsWith(".zip") || fileName.endsWith(".rar") || fileName.endsWith(".7z") || fileName.endsWith(".tar") || fileName.endsWith(".gz")) {
    return {
      label: "Zip Archive",
      badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      category: "archive",
      iconName: "zip",
      isDirectlyPreviewable: false,
    };
  }

  return {
    label: "Study Document",
    badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    category: "file",
    iconName: "file",
    isDirectlyPreviewable: material.urlOrContent.startsWith("data:text/") || material.urlOrContent.startsWith("data:image/") || material.urlOrContent.startsWith("data:application/pdf"),
  };
}
