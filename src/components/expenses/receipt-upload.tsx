"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptData {
  amount?: number;
  currency?: string;
  date?: string;
  description?: string;
  merchant?: string;
  category?: string;
}

interface ReceiptUploadProps {
  onUploadComplete?: (url: string) => void;
  onAnalysisComplete?: (data: ReceiptData) => void;
  existingUrl?: string;
  className?: string;
}

export function ReceiptUpload({
  onUploadComplete,
  onAnalysisComplete,
  existingUrl,
  className,
}: ReceiptUploadProps) {
  const t = useTranslations("receipt");

  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/upload/receipt", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.error || "Upload failed");
        }

        const { url } = await uploadResponse.json();
        onUploadComplete?.(url);

        // Analyze receipt with AI
        setIsAnalyzing(true);
        const analyzeResponse = await fetch("/api/ai/analyze-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
        });

        if (analyzeResponse.ok) {
          const analysisData = await analyzeResponse.json();
          onAnalysisComplete?.(analysisData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      } finally {
        setIsUploading(false);
        setIsAnalyzing(false);
      }
    },
    [onUploadComplete, onAnalysisComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
      "application/pdf": [".pdf"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: isUploading || isAnalyzing,
  });

  const clearReceipt = () => {
    setPreview(null);
    setError(null);
  };

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg border bg-muted/50 p-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
            {preview.startsWith("data:application/pdf") ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("pdfReceipt")}
                  </p>
                </div>
              </div>
            ) : (
              <img
                src={preview}
                alt="Receipt preview"
                className="h-full w-full object-contain"
              />
            )}
            {(isUploading || isAnalyzing) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isUploading ? t("uploading") : t("analyzing")}
                  </p>
                </div>
              </div>
            )}
          </div>
          {!isUploading && !isAnalyzing && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6"
              onClick={clearReceipt}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {isAnalyzing && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {t("aiExtracting")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          (isUploading || isAnalyzing) && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {isDragActive ? t("dropHere") : t("dragOrClick")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("fileTypes")}</p>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
