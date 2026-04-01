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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Clinical PHI detection
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Detect protected health information in English clinical text using{" "}
            <a
              href="https://docs.aws.amazon.com/comprehend-medical/latest/dev/comprehendmedical-welcome.html"
              className="underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Amazon Comprehend Medical
            </a>
            , then download redacted text.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">1. Upload</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Provide a .txt or .docx note (extracted text is analyzed)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">2. Detect PHI</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comprehend Medical runs{" "}
                    <code className="text-[10px]">DetectPHI</code> on your text
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">3. Download</h3>
                  <p className="text-xs text-muted-foreground mt-1">
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

        <div className="text-center mt-12 text-xs text-muted-foreground space-y-1">
          <p>Powered by Amazon Comprehend Medical (AWS)</p>
          <p>
            Not a substitute for professional medical or legal advice — see{" "}
            <a
              className="underline"
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
