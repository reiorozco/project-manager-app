import { head, put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const LOG_FILE = "/tmp/backfill-log.txt";
const SUPABASE_URL = "https://hslsqmuhkctcjftwnive.supabase.co";

function mimeFromExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".zip": "application/zip",
  };
  return map[ext] || "application/octet-stream";
}

async function backfill() {
  const files = await prisma.file.findMany();
  const logLines: string[] = [];

  for (const file of files) {
    try {
      await head(file.path);
      const msg = `SKIP ${file.path}`;
      console.log(msg);
      logLines.push(msg);
      continue;
    } catch {
      // Not in Blob yet, proceed to backfill
    }

    if (DRY_RUN) {
      const msg = `DRY-RUN WOULD_UPLOAD ${file.path}`;
      console.log(msg);
      logLines.push(msg);
      continue;
    }

    const supabaseUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/project-files/${file.path}`;
    const response = await fetch(supabaseUrl, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const msg = `MISSING ${file.path} (HTTP ${response.status})`;
      console.warn(msg);
      logLines.push(msg);
      continue;
    }

    const buffer = await response.arrayBuffer();
    await put(file.path, buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: mimeFromExt(file.filename),
    });

    const msg = `OK ${file.path}`;
    console.log(msg);
    logLines.push(msg);
  }

  fs.writeFileSync(LOG_FILE, logLines.join("\n") + "\n");
  console.log(`\nDone. ${logLines.length} files processed. Log: ${LOG_FILE}`);
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
