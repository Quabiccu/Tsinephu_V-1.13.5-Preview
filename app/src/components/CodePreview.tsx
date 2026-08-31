import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Maximize,
  Minimize,
  Copy,
  Check,
  Code2,
  FileText,
} from "lucide-react";
import type { CodeData } from "@/types";

interface CodePreviewProps {
  codeData: CodeData;
  isFullscreen?: boolean;
}

function buildDocument(codeData: CodeData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${codeData.css}
</style>
</head>
<body>
${codeData.html}
<script>
${codeData.js}
<\/script>
</body>
</html>`;
}

export function CodePreview({
  codeData,
  isFullscreen: initialFullscreen = false,
}: CodePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [iframeKey, setIframeKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = buildDocument(codeData);
  const isTextOnly = codeData.lang === "text/file";

  const handleRun = useCallback(() => {
    setIframeKey((prev) => prev + 1);
  }, []);

  const handleCopyCode = useCallback(async () => {
    const fullCode = isTextOnly
      ? codeData.text
      : `<!-- HTML -->\n${codeData.html}\n\n/* CSS */\n${codeData.css}\n\n// JS\n${codeData.js}`;
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  }, [codeData, isTextOnly]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Auto-run on mount and when codeData changes
  useEffect(() => {
    setIframeKey((prev) => prev + 1);
  }, [codeData]);

  const toolbar = (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {isTextOnly ? (
            <FileText className="h-4 w-4 text-green-500" />
          ) : (
            <Code2 className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium truncate max-w-[200px]">
            {codeData.title}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {codeData.totalLines} lines
        </span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isTextOnly
              ? "text-green-400 bg-green-900/30"
              : "text-muted-foreground bg-muted"
          }`}
        >
          {isTextOnly ? ".TXT / RAW" : codeData.lang}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRun}
          className="h-7 gap-1 text-xs"
        >
          <Play className="h-3 w-3" />
          Run
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCode}
          className="h-7 gap-1 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-7 gap-1 text-xs"
        >
          {isFullscreen ? (
            <>
              <Minimize className="h-3 w-3" />
              Exit
            </>
          ) : (
            <>
              <Maximize className="h-3 w-3" />
              Full
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const iframeContent = isTextOnly ? (
    <div className="w-full h-full bg-[#1e1e1e] overflow-auto">
      <pre className="font-mono text-[13px] text-[#d4d4d4] whitespace-pre p-4 leading-5 min-w-full w-max">
        {codeData.text}
      </pre>
    </div>
  ) : (
    <iframe
      key={iframeKey}
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="w-full h-full border-0 bg-white overflow-auto"
      title={codeData.title}
      style={{ overflow: "auto" }}
    />
  );

  // Fullscreen dialog
  if (isFullscreen) {
    return (
      <Dialog open onOpenChange={() => setIsFullscreen(false)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="sr-only">
              Code Preview: {codeData.title}
            </DialogTitle>
          </DialogHeader>
          {toolbar}
          <div className="flex-1 min-h-0">{iframeContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline preview (contained, ~400px height with scroll)
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-background">
      {toolbar}
      <div className="h-[400px] overflow-auto">{iframeContent}</div>
    </div>
  );
}
