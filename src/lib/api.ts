import { Chapter, StudyMaterial, Workspace } from "../types";

export async function createWorkspace(name?: string, icon?: string): Promise<Workspace> {
  const res = await fetch("/api/workspaces/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to create workspace.");
  }

  return await res.json();
}

export async function getWorkspace(code: string): Promise<Workspace> {
  const cleanCode = code.toUpperCase().trim();
  const res = await fetch(`/api/workspaces/${cleanCode}`);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Workspace code not found.");
  }

  return await res.json();
}

export async function updateWorkspaceSyllabus(
  code: string,
  chapters?: Chapter[],
  name?: string,
  icon?: string
): Promise<void> {
  const cleanCode = code.toUpperCase().trim();
  const res = await fetch(`/api/workspaces/${cleanCode}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chapters, name, icon }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to update workspace details.");
  }
}

export async function uploadStudyMaterial(
  code: string,
  material: {
    title: string;
    description: string;
    type: "pdf" | "notes" | "link" | "file";
    urlOrContent: string;
    fileName?: string;
    fileSize?: string;
    topicTag?: string;
  }
): Promise<StudyMaterial> {
  const cleanCode = code.toUpperCase().trim();
  const res = await fetch(`/api/workspaces/${cleanCode}/materials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(material),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to upload study material.");
  }

  return await res.json();
}

export async function deleteStudyMaterial(
  code: string,
  materialId: string
): Promise<void> {
  const cleanCode = code.toUpperCase().trim();
  const res = await fetch(`/api/workspaces/${cleanCode}/materials/${materialId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to delete study material.");
  }
}

export async function updateMentorPasswordApi(
  code: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const cleanCode = code.toUpperCase().trim();
  const res = await fetch(`/api/workspaces/${cleanCode}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to update mentor password.");
  }
}
