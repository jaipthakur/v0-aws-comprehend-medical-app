"use client";

import { useCallback } from "react";
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
import { Download, Stethoscope, ListTree } from "lucide-react";
import type { AnalyzeResult } from "@/components/file-upload";

interface PhiResultsProps {
  result: AnalyzeResult;
  onClear: () => void;
}

export function PhiResults({ result, onClear }: PhiResultsProps) {
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
              <Button size="sm" variant="outline" onClick={onClear}>
                Clear results
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-normal">
            Source: {result.originalName}
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
