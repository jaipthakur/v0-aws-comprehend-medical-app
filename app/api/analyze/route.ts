import { NextRequest, NextResponse } from "next/server";
import {
  applyPhiRedaction,
  COMPREHEND_MAX_INPUT_LENGTH,
  detectPhi,
  detectPhiResponseToApiJson,
} from "@/lib/comprehend-medical";
import { extractClinicalText } from "@/lib/extract-clinical-text";
import { tryRedactDocxPreservingFormatting } from "@/lib/docx-inplace-redact";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extracted = await extractClinicalText(file, buffer);
    if (!extracted.ok) {
      return NextResponse.json({ error: extracted.error }, { status: 400 });
    }

    /* No trim: Comprehend offsets must match the same string we map in .docx XML. */
    let text = extracted.text.replace(/\r\n/g, "\n");
    if (text.length > COMPREHEND_MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text is ${text.length.toLocaleString()} characters; Amazon Comprehend Medical allows at most ${COMPREHEND_MAX_INPUT_LENGTH.toLocaleString()} characters per request. Shorten the document or split it.`,
        },
        { status: 400 }
      );
    }

    const phiResponse = await detectPhi(text);
    const entities = phiResponse.Entities ?? [];
    const redactedText = applyPhiRedaction(text, entities);

    const entityPayload = entities.map((e) => ({
      type: e.Type,
      text: e.Text,
      score: e.Score,
      beginOffset: e.BeginOffset,
      endOffset: e.EndOffset,
    }));

    const phiApiResponse = detectPhiResponseToApiJson(phiResponse);

    let redactedDocxBase64: string | undefined;
    if (file.name.toLowerCase().endsWith(".docx")) {
      const inplace = await tryRedactDocxPreservingFormatting(
        buffer,
        entities,
        text
      );
      if (inplace.ok) {
        redactedDocxBase64 = inplace.buffer.toString("base64");
      }
    }

    return NextResponse.json({
      success: true,
      originalName: file.name,
      redactedText,
      entities: entityPayload,
      phiApiResponse,
      extractWarnings: extracted.warnings,
      ...(redactedDocxBase64 ? { redactedDocxBase64 } : {}),
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "PHI detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
