/** Serializable DetectPHI-style payload for API / JSON download (no AWS SDK on the client). */
export type DetectPhiApiExport = {
  Entities: Record<string, unknown>[];
  UnmappedAttributes: unknown[];
  ModelVersion?: string;
  PaginationToken?: string;
};
