import {
  ComprehendMedicalClient,
  DetectPHICommand,
  type Entity,
} from "@aws-sdk/client-comprehendmedical";

/** Amazon Comprehend Medical synchronous text limit (Unicode characters). */
export const COMPREHEND_MAX_INPUT_LENGTH = 20_000;

export function getComprehendMedicalClient(): ComprehendMedicalClient {
  const region = process.env.AWS_REGION || "us-east-1";
  return new ComprehendMedicalClient({ region });
}

export async function detectPhi(text: string) {
  const client = getComprehendMedicalClient();
  return client.send(new DetectPHICommand({ Text: text }));
}

/**
 * Replace PHI spans from end to start so offsets stay valid.
 * Uses entity type as mask label (similar in spirit to entity-style redaction).
 */
export function applyPhiRedaction(text: string, entities: Entity[] = []): string {
  const valid = entities.filter(
    (e) =>
      typeof e.BeginOffset === "number" &&
      typeof e.EndOffset === "number" &&
      e.BeginOffset >= 0 &&
      e.EndOffset <= text.length &&
      e.EndOffset > e.BeginOffset
  );
  const sorted = [...valid].sort((a, b) => b.BeginOffset! - a.BeginOffset!);
  let result = text;
  for (const e of sorted) {
    const label = e.Type || "PHI";
    result =
      result.slice(0, e.BeginOffset!) + `[${label}]` + result.slice(e.EndOffset!);
  }
  return result;
}
