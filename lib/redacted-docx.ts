import { Document, Packer, Paragraph, TextRun } from "docx";

/**
 * Builds a minimal .docx from redacted plain text (one paragraph per line).
 * Layout and styles from an original Word file are not preserved — only the
 * redacted string we already computed from extraction + Comprehend Medical.
 */
export async function redactedPlainTextToDocxBlob(text: string): Promise<Blob> {
  const lines = text.split("\n");
  const children = lines.map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line.length > 0 ? line : "\u00A0",
          }),
        ],
      })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
