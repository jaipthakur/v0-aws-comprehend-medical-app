import { NextRequest, NextResponse } from "next/server";
import {
  applyPhiRedaction,
  COMPREHEND_MAX_INPUT_LENGTH,
  detectPhi,
} from "@/lib/comprehend-medical";
import { extractClinicalText } from "@/lib/extract-clinical-text";

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

    let text = extracted.text.replace(/\r\n/g, "\n").trim();
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

    return NextResponse.json({
      success: true,
      originalName: file.name,
      redactedText,
      entities: entityPayload,
      extractWarnings: extracted.warnings,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "PHI detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
