import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Support larger payload sizes for base64 file attachments in study materials
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Initialize LibSQL / Turso database client
const databaseUrl = process.env.TURSO_DATABASE_URL || "file:workspace.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log(`[DB] Initializing database using URL: ${databaseUrl}`);

const db = createClient({
  url: databaseUrl,
  authToken: authToken,
});

// Setup DB Schema
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS workspaces (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'FolderOpen',
        chapters_json TEXT NOT NULL DEFAULT '[]',
        mentor_password TEXT NOT NULL DEFAULT '12345678',
        created_at INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Ensure all required columns exist in workspaces table (for existing DB files)
    try {
      const tableInfo = await db.execute(`PRAGMA table_info(workspaces)`);
      const existingColumns = tableInfo.rows.map((row: any) => String(row.name || row[1]));

      if (!existingColumns.includes("icon")) {
        await db.execute(`ALTER TABLE workspaces ADD COLUMN icon TEXT NOT NULL DEFAULT 'FolderOpen'`);
      }
      if (!existingColumns.includes("chapters_json")) {
        if (existingColumns.includes("syllabus_json")) {
          await db.execute(`ALTER TABLE workspaces ADD COLUMN chapters_json TEXT NOT NULL DEFAULT '[]'`);
          await db.execute(`UPDATE workspaces SET chapters_json = syllabus_json WHERE syllabus_json IS NOT NULL`);
        } else {
          await db.execute(`ALTER TABLE workspaces ADD COLUMN chapters_json TEXT NOT NULL DEFAULT '[]'`);
        }
      }
      if (!existingColumns.includes("mentor_password")) {
        await db.execute(`ALTER TABLE workspaces ADD COLUMN mentor_password TEXT NOT NULL DEFAULT '12345678'`);
      }
      if (!existingColumns.includes("created_at")) {
        await db.execute(`ALTER TABLE workspaces ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0`);
      }
      if (!existingColumns.includes("updated_at")) {
        await db.execute(`ALTER TABLE workspaces ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0`);
      }
    } catch (colErr) {
      console.warn("[DB] Column verification warning for workspaces:", colErr);
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id TEXT PRIMARY KEY,
        workspace_code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        url_or_content TEXT NOT NULL,
        file_name TEXT,
        file_size TEXT,
        topic_tag TEXT,
        created_at INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Ensure all required columns exist in study_materials table
    try {
      const matTableInfo = await db.execute(`PRAGMA table_info(study_materials)`);
      const matColumns = matTableInfo.rows.map((row: any) => String(row.name || row[1]));

      if (!matColumns.includes("topic_tag")) {
        await db.execute(`ALTER TABLE study_materials ADD COLUMN topic_tag TEXT`);
      }
      if (!matColumns.includes("file_name")) {
        await db.execute(`ALTER TABLE study_materials ADD COLUMN file_name TEXT`);
      }
      if (!matColumns.includes("file_size")) {
        await db.execute(`ALTER TABLE study_materials ADD COLUMN file_size TEXT`);
      }
    } catch (matColErr) {
      console.warn("[DB] Column verification warning for study_materials:", matColErr);
    }

    console.log("[DB] Schema initialized successfully.");
  } catch (err) {
    console.error("[DB] Failed to initialize DB schema:", err);
  }
}

initDb();

// Helper to generate 6-digit uppercase alphanumeric code (0-9, A-Z)
function generate6DigitCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initial sample chapters for newly created workspaces
const SAMPLE_CHAPTERS = [
  {
    id: "chapter-light",
    name: "Light - Reflection & Refraction",
    topics: [
      {
        id: "spherical-mirrors",
        name: "Spherical Mirrors & Reflection",
        quiz: {
          questions: [
            {
              id: "q1",
              text: "What type of image is formed by a concave mirror when the object is placed between the Pole (P) and Focus (F)?",
              subtext: "Note: Think about ray diagrams for makeup or shaving mirrors.",
              options: [
                "Real and Inverted",
                "Virtual and Erect",
                "Real and Erect",
                "Virtual and Inverted",
                "No image is formed"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "q2",
              text: "The focal length of a spherical mirror is defined as:",
              subtext: "The relationship between Radius of Curvature (R) and Focal Length (f) is R = 2f.",
              options: [
                "Half of its radius of curvature",
                "Double of its radius of curvature",
                "Equal to its radius of curvature",
                "Triple of its radius of curvature"
              ],
              correctAnswerIndex: 0
            },
            {
              id: "q3",
              text: "Which mirror is widely used as a rear-view mirror in vehicles?",
              subtext: "Consider which mirror gives a wider field of view and forms an erect image.",
              options: [
                "Concave mirror",
                "Convex mirror",
                "Plane mirror",
                "Plano-concave mirror"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fc1",
            front: "What is the relation between focal length (f) and radius of curvature (R) of a spherical mirror?",
            back: "R = 2f or f = R/2.\nThe focal length is exactly half of the radius of curvature."
          },
          {
            id: "fc2",
            front: "Why are convex mirrors preferred as rear-view mirrors in vehicles?",
            back: "Because they always give an erect (upright) though diminished image, and offer a wider field of view as they curve outwards."
          },
          {
            id: "fc3",
            front: "What sign convention is used for the focal length of a concave mirror?",
            back: "According to the Cartesian sign convention, the focal length of a concave mirror is always negative (-f)."
          },
          {
            id: "fc4",
            front: "What is the Mirror Formula?",
            back: "1/f = 1/v + 1/u\nWhere f is focal length, v is image distance, and u is object distance."
          }
        ]
      },
      {
        id: "refraction-lens",
        name: "Refraction of Light & Lenses",
        quiz: {
          questions: [
            {
              id: "ql1",
              text: "What is the SI unit of power of a lens?",
              subtext: "Represented by the symbol D.",
              options: [
                "Meter",
                "Dioptre",
                "Watt",
                "Newton",
                "Joule"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "ql2",
              text: "When a ray of light passes from an optically rarer medium to a denser medium, it:",
              subtext: "Think about light entering water or glass from air.",
              options: [
                "Bends towards the normal",
                "Bends away from the normal",
                "Goes straight without bending",
                "Reflects completely back"
              ],
              correctAnswerIndex: 0
            }
          ]
        },
        flashcards: [
          {
            id: "fcl1",
            front: "What is Snell's Law of refraction?",
            back: "The ratio of the sine of the angle of incidence to the sine of the angle of refraction is a constant for a given pair of media.\nsin(i) / sin(r) = constant (refractive index)."
          },
          {
            id: "fcl2",
            front: "What is the formula for Power of a Lens?",
            back: "P = 1 / f (where f is focal length in meters).\nPower is measured in Dioptres (D)."
          }
        ]
      }
    ]
  },
  {
    id: "chapter-chemical-reactions",
    name: "Chemical Reactions & Equations",
    topics: [
      {
        id: "types-reactions",
        name: "Types of Chemical Reactions",
        quiz: {
          questions: [
            {
              id: "qc1",
              text: "Which type of reaction occurs when two or more substances combine to form a single product?",
              subtext: "Example: CaO + H2O → Ca(OH)2 + Heat",
              options: [
                "Decomposition Reaction",
                "Combination Reaction",
                "Displacement Reaction",
                "Double Displacement Reaction"
              ],
              correctAnswerIndex: 1
            },
            {
              id: "qc2",
              text: "Respiration is considered an:",
              subtext: "Energy is released during digestion and glucose breakdown.",
              options: [
                "Endothermic reaction",
                "Exothermic reaction",
                "Neutralization reaction",
                "Precipitation reaction"
              ],
              correctAnswerIndex: 1
            }
          ]
        },
        flashcards: [
          {
            id: "fcc1",
            front: "Define an Exothermic Reaction.",
            back: "A reaction in which heat is released along with the formation of products."
          },
          {
            id: "fcc2",
            front: "What is a Double Displacement Reaction?",
            back: "A chemical reaction in which there is an exchange of ions between the reactants to form new compounds."
          }
        ]
      }
    ]
  }
];

const INITIAL_MATERIALS = [
  {
    id: "mat-demo-1",
    title: "Light & Reflection Summary Formula Sheet",
    description: "Quick revision formula sheet for spherical mirrors, Snell's law, and lens formulas.",
    type: "notes",
    urlOrContent: "MIRROR FORMULA: 1/f = 1/v + 1/u\nMAGNIFICATION: m = -v/u = h'/h\nSNELL'S LAW: n = sin(i) / sin(r)\nPOWER OF LENS: P = 1/f (in meters, Dioptres)",
    fileName: "formula_sheet.txt",
    fileSize: "1.2 KB",
    topicTag: "Light - Reflection & Refraction",
    createdAt: Date.now() - 86400000
  }
];

// API ROUTES

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Create new Workspace
app.post("/api/workspaces/create", async (req, res) => {
  try {
    const { name, icon } = req.body;
    let code = generate6DigitCode();
    let attempts = 0;

    // Ensure code is unique
    while (attempts < 10) {
      const existing = await db.execute({
        sql: "SELECT code FROM workspaces WHERE code = ?",
        args: [code]
      });
      if (existing.rows.length === 0) break;
      code = generate6DigitCode();
      attempts++;
    }

    const workspaceName = name?.trim() || `Workspace ${code}`;
    const workspaceIcon = icon?.trim() || "FolderOpen";
    const now = Date.now();
    const defaultPassword = "12345678";
    const chaptersJson = JSON.stringify(SAMPLE_CHAPTERS);

    await db.execute({
      sql: `INSERT INTO workspaces (code, name, icon, chapters_json, mentor_password, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [code, workspaceName, workspaceIcon, chaptersJson, defaultPassword, now, now]
    });

    // Add initial demo study material for new workspace
    for (const mat of INITIAL_MATERIALS) {
      await db.execute({
        sql: `INSERT INTO study_materials (id, workspace_code, title, description, type, url_or_content, file_name, file_size, topic_tag, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `mat-${code}-${Date.now()}`,
          code,
          mat.title,
          mat.description,
          mat.type,
          mat.urlOrContent,
          mat.fileName,
          mat.fileSize,
          mat.topicTag,
          mat.createdAt
        ]
      });
    }

    res.json({
      code,
      name: workspaceName,
      icon: workspaceIcon,
      chapters: SAMPLE_CHAPTERS,
      materials: INITIAL_MATERIALS,
      mentorPassword: defaultPassword,
      createdAt: now,
      updatedAt: now
    });
  } catch (err: any) {
    console.error("Error creating workspace:", err);
    res.status(500).json({ error: "Failed to create workspace." });
  }
});

// Join / Fetch Workspace by 6-digit Code
app.get("/api/workspaces/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();

    const wsResult = await db.execute({
      sql: "SELECT * FROM workspaces WHERE code = ?",
      args: [code]
    });

    if (wsResult.rows.length === 0) {
      return res.status(404).json({ error: "Invalid 6-digit workspace code. Please check and try again or create a new workspace." });
    }

    const row = wsResult.rows[0];
    const chapters = JSON.parse(row.chapters_json as string || "[]");

    // Fetch study materials for workspace
    const matResult = await db.execute({
      sql: "SELECT * FROM study_materials WHERE workspace_code = ? ORDER BY created_at DESC",
      args: [code]
    });

    const materials = matResult.rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) || "",
      type: r.type as "pdf" | "notes" | "link" | "file",
      urlOrContent: r.url_or_content as string,
      fileName: (r.file_name as string) || undefined,
      fileSize: (r.file_size as string) || undefined,
      topicTag: (r.topic_tag as string) || undefined,
      createdAt: Number(r.created_at)
    }));

    res.json({
      code: row.code as string,
      name: row.name as string,
      icon: (row.icon as string) || "FolderOpen",
      chapters,
      materials,
      mentorPassword: row.mentor_password as string,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    });
  } catch (err: any) {
    console.error("Error fetching workspace:", err);
    res.status(500).json({ error: "Server error fetching workspace." });
  }
});

// Update Chapters / Syllabus / Details for Workspace
app.put("/api/workspaces/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { chapters, name, icon } = req.body;

    if (chapters && !Array.isArray(chapters)) {
      return res.status(400).json({ error: "Invalid chapters payload" });
    }

    const now = Date.now();
    let sql = "UPDATE workspaces SET updated_at = ?";
    const args: any[] = [now];

    if (chapters) {
      sql += ", chapters_json = ?";
      args.push(JSON.stringify(chapters));
    }
    if (name) {
      sql += ", name = ?";
      args.push(name.trim());
    }
    if (icon) {
      sql += ", icon = ?";
      args.push(icon.trim());
    }

    sql += " WHERE code = ?";
    args.push(code);

    const result = await db.execute({ sql, args });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    res.json({ success: true, updatedAt: now });
  } catch (err: any) {
    console.error("Error updating workspace:", err);
    res.status(500).json({ error: "Failed to update workspace." });
  }
});

// Add Study Material to Workspace
app.post("/api/workspaces/:code/materials", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { title, description, type, urlOrContent, fileName, fileSize, topicTag } = req.body;

    if (!title || !urlOrContent || !type) {
      return res.status(400).json({ error: "Title, type, and content/URL are required." });
    }

    const matId = "mat-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const createdAt = Date.now();

    await db.execute({
      sql: `INSERT INTO study_materials (id, workspace_code, title, description, type, url_or_content, file_name, file_size, topic_tag, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        matId,
        code,
        title.trim(),
        description?.trim() || "",
        type,
        urlOrContent,
        fileName || null,
        fileSize || null,
        topicTag?.trim() || null,
        createdAt
      ]
    });

    res.json({
      id: matId,
      title: title.trim(),
      description: description?.trim() || "",
      type,
      urlOrContent,
      fileName,
      fileSize,
      topicTag,
      createdAt
    });
  } catch (err: any) {
    console.error("Error creating study material:", err);
    res.status(500).json({ error: "Failed to save study material." });
  }
});

// Delete Study Material from Workspace
app.delete("/api/workspaces/:code/materials/:id", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const matId = req.params.id;

    await db.execute({
      sql: "DELETE FROM study_materials WHERE id = ? AND workspace_code = ?",
      args: [matId, code]
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting study material:", err);
    res.status(500).json({ error: "Failed to delete study material." });
  }
});

// Update Mentor Password for Workspace
app.put("/api/workspaces/:code/password", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { oldPassword, newPassword } = req.body;

    const ws = await db.execute({
      sql: "SELECT mentor_password FROM workspaces WHERE code = ?",
      args: [code]
    });

    if (ws.rows.length === 0) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const currentPass = ws.rows[0].mentor_password as string;
    if (oldPassword !== currentPass) {
      return res.status(400).json({ error: "Current password does not match." });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    await db.execute({
      sql: "UPDATE workspaces SET mentor_password = ?, updated_at = ? WHERE code = ?",
      args: [newPassword, Date.now(), code]
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating password:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

// Start Express + Vite Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
