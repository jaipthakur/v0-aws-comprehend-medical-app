"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Braces, Download, Stethoscope, ListTree } from "lucide-react";
import type { AnalyzeResult } from "@/components/file-upload";
import { redactedPlainTextToDocxBlob } from "@/lib/redacted-docx";

interface PhiResultsProps {
  result: AnalyzeResult;
  onClear: () => void;
}

export function PhiResults({ result, onClear }: PhiResultsProps) {
  const [docxWorking, setDocxWorking] = useState(false);

  const downloadRedacted = useCallback(() => {
    const base =
      result.originalName.replace(/\.[^.]+$/, "") || "clinical-note";
    const filename = `${base}-phi-redacted.txt`;
    const blob = new Blob([result.redactedText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.originalName, result.redactedText]);

  const downloadRedactedDocxPlain = useCallback(async () => {
    setDocxWorking(true);
    try {
      const base =
        result.originalName.replace(/\.[^.]+$/, "") || "clinical-note";
      const filename = `${base}-phi-redacted-plain.docx`;
      const blob = await redactedPlainTextToDocxBlob(result.redactedText);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDocxWorking(false);
    }
  }, [result.originalName, result.redactedText]);

  const downloadPhiApiJson = useCallback(() => {
    const base =
      result.originalName.replace(/\.[^.]+$/, "") || "clinical-note";
    const filename = `${base}-detect-phi-response.json`;
    const body = JSON.stringify(result.phiApiResponse, null, 2);
    const blob = new Blob([body], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.originalName, result.phiApiResponse]);

  const downloadRedactedDocxOriginalLayout = useCallback(() => {
    if (!result.redactedDocxBase64) return;
    const base =
      result.originalName.replace(/\.[^.]+$/, "") || "clinical-note";
    const filename = `${base}-phi-redacted.docx`;
    const binary = atob(result.redactedDocxBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result.originalName, result.redactedDocxBase64]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Redacted text
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={downloadRedacted}>
                <Download className="h-4 w-4 mr-1" />
                Download .txt
              </Button>
              <Button size="sm" variant="outline" onClick={downloadPhiApiJson}>
                <Braces className="h-4 w-4 mr-1" />
                Download JSON
              </Button>
              {result.redactedDocxBase64 ? (
                <Button size="sm" onClick={downloadRedactedDocxOriginalLayout}>
                  <Download className="h-4 w-4 mr-1" />
                  Download .docx (keep layout)
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void downloadRedactedDocxPlain()}
                disabled={docxWorking}
              >
                <Download className="h-4 w-4 mr-1" />
                {docxWorking
                  ? "Building .docx…"
                  : "Download .docx (new file)"}
              </Button>
              <Button size="sm" variant="outline" onClick={onClear}>
                Clear results
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-normal">
            Source: {result.originalName}
            <span className="block mt-1">
              {result.redactedDocxBase64
                ? "“Keep layout” replaces PHI inside your original Word file when the document structure matches our extractor (same text as Mammoth). Otherwise use “new file” for a simple .docx built from redacted text only."
                : "For .docx uploads, “keep layout” appears when the file is supported; otherwise use “new file” for a simple .docx from redacted text only."}
            </span>
            {result.extractWarnings?.length ? (
              <span className="block mt-1 text-amber-700 dark:text-amber-400">
                Warnings: {result.extractWarnings.join(" · ")}
              </span>
            ) : null}
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[220px] w-full rounded-md border p-3">
            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
              {result.redactedText}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            Detected PHI entities ({result.entities.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            From Amazon Comprehend Medical <code>DetectPHI</code>. Review
            high-sensitivity use cases with qualified reviewers per AWS
            guidance.
          </p>
        </CardHeader>
        <CardContent>
          {result.entities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No PHI entities returned for this text.
            </p>
          ) : (
            <ScrollArea className="max-h-[min(20rem,50vh)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead>Snippet</TableHead>
                    <TableHead className="w-[72px] text-right">
                      Score
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.entities.map((e, i) => (
                    <TableRow key={`${e.beginOffset}-${e.endOffset}-${i}`}>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {e.type || "PHI"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-xs font-mono">
                        {e.text ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {typeof e.score === "number"
                          ? e.score.toFixed(2)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
