"use client";

import { useState, useCallback } from "react";
import { FileUpload, type AnalyzeResult } from "@/components/file-upload";
import { PhiResults } from "@/components/phi-results";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Upload, FileSearch, Download } from "lucide-react";

export default function HomePage() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const handleAnalyzeComplete = useCallback((data: AnalyzeResult) => {
    setResult(data);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div
            className="h-1.5 w-full bg-gradient-to-r from-[#077AB5] via-[#F3F3F5] to-[#01473B]"
            aria-hidden
          />
          <div className="px-6 py-10 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[color-mix(in_srgb,var(--wl-dark-green)_12%,white)] mb-4">
              <Shield className="h-8 w-8 text-[#01473B]" />
            </div>
            <h1 className="text-[2rem] leading-tight font-bold tracking-tight text-[#262626]">
              Clinical PHI detection
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto text-base text-left sm:text-center">
              Detect protected health information in English clinical text using{" "}
              <a
                href="https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html"
                className="underline underline-offset-[3px] font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Amazon Comprehend Medical
              </a>
              , then download redacted text.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[color-mix(in_srgb,var(--wl-dark-green)_12%,white)] flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-[#01473B]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-[family-name:var(--font-montserrat)] text-[#262626]">
                    1. Upload
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    Provide a .txt or .docx note (extracted text is analyzed)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[color-mix(in_srgb,var(--wl-dark-green)_12%,white)] flex items-center justify-center shrink-0">
                  <FileSearch className="h-5 w-5 text-[#01473B]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-[family-name:var(--font-montserrat)] text-[#262626]">
                    2. Detect PHI
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    Comprehend Medical runs{" "}
                    <code className="text-[10px] font-mono bg-muted px-1 rounded">
                      DetectPHI
                    </code>{" "}
                    on your text
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[color-mix(in_srgb,var(--wl-dark-green)_12%,white)] flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-[#01473B]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-[family-name:var(--font-montserrat)] text-[#262626]">
                    3. Download
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    Copy or download redacted text with PHI spans labeled
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Clinical document</CardTitle>
              <CardDescription>
                This sample app analyzes plain text (not native PDF layout).
                For production, add OCR, chunking, and human review as required
                for your compliance program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onAnalyzeComplete={handleAnalyzeComplete} />
            </CardContent>
          </Card>

          {result && (
            <PhiResults result={result} onClear={() => setResult(null)} />
          )}
        </div>

        <div className="text-center mt-12 text-xs text-muted-foreground space-y-1 font-medium">
          <p>Powered by Amazon Comprehend Medical (AWS)</p>
          <p>
            Not a substitute for professional medical or legal advice — see{" "}
            <a
              className="underline underline-offset-2"
              href="https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              AWS documentation
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
