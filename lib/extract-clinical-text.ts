import mammoth from "mammoth";

export type ExtractResult =
  | { ok: true; text: string; warnings?: string[] }
  | { ok: false; error: string };

/**
 * Comprehend Medical expects English clinical/plain text. We support UTF-8 .txt and .docx body text.
 */
export async function extractClinicalText(
  file: File,
  buffer: Buffer
): Promise<ExtractResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    const text = buffer.toString("utf-8");
    if (!text.trim()) {
      return { ok: false, error: "File is empty." };
    }
    return { ok: true, text };
  }

  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    if (!text.trim()) {
      return { ok: false, error: "No text could be read from the DOCX file." };
    }
    const warnings = result.messages.map((m) => m.message).filter(Boolean);
    return {
      ok: true,
      text,
      warnings: warnings.length ? warnings : undefined,
    };
  }

  return {
    ok: false,
    error:
      "Unsupported format. Use .txt or .docx containing English clinical text (Comprehend Medical requirement).",
  };
}
