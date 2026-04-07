"use client";

import { useState, useCallback } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DetectPhiApiExport } from "@/lib/detect-phi-export-types";

export interface PhiEntityRow {
  type?: string;
  text?: string;
  score?: number;
  beginOffset?: number;
  endOffset?: number;
}

export interface AnalyzeResult {
  originalName: string;
  redactedText: string;
  entities: PhiEntityRow[];
  /** DetectPHI-shaped payload (Entities, UnmappedAttributes, ModelVersion, …). */
  phiApiResponse: DetectPhiApiExport;
  extractWarnings?: string[];
  /** Server-built .docx with PHI replaced inside the original package (when supported). */
  redactedDocxBase64?: string;
}

interface FileUploadProps {
  onAnalyzeComplete: (result: AnalyzeResult) => void;
  disabled?: boolean;
}

export function FileUpload({ onAnalyzeComplete, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    []
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  const runAnalyze = async () => {
    if (!file) return;

    setWorking(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      onAnalyzeComplete({
        originalName: data.originalName,
        redactedText: data.redactedText,
        entities: data.entities || [],
        phiApiResponse: data.phiApiResponse,
        extractWarnings: data.extractWarnings,
        redactedDocxBase64: data.redactedDocxBase64,
      });

      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-[color-mix(in_srgb,var(--wl-dark-green)_28%,var(--border))] bg-[color-mix(in_srgb,var(--wl-off-white)_65%,white)]">
      <CardContent className="p-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-lg p-8 transition-colors",
            isDragging && "bg-primary/5 border-primary",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {!file ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Drag and drop your clinical text file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files
                </p>
              </div>
              <label>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".txt,.docx"
                  disabled={disabled}
                />
                <Button variant="outline" asChild disabled={disabled}>
                  <span>Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                Supported: UTF-8 <strong>.txt</strong> and <strong>.docx</strong>{" "}
                (body text). English only, up to 20,000 characters after
                extraction. See{" "}
                <a
                  className="underline"
                  href="https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Amazon Comprehend Medical
                </a>
                .
              </p>
            </>
          ) : (
            <div className="flex w-full flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-background p-4 border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={working}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                onClick={runAnalyze}
                disabled={working || disabled}
                className="w-full"
              >
                {working ? "Detecting PHI…" : "Detect & redact PHI"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
