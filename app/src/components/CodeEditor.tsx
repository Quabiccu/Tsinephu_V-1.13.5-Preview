import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Check, Code2, Keyboard, FileText } from "lucide-react";
import type { CodeData } from "@/types";

interface CodeEditorProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  initialTitle?: string;
  onSave: (data: CodeData) => void;
  onCancel: () => void;
}

const MAX_LINES = 2000;

function countLines(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").length;
}

function getLineNumbers(text: string): string {
  if (!text.trim()) return "1";
  const lines = text.split("\n").length;
  return Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}

export function CodeEditor({
  initialHtml = "",
  initialCss = "",
  initialJs = "",
  initialTitle = "",
  onSave,
  onCancel,
}: CodeEditorProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [text, setText] = useState("");
  const [title, setTitle] = useState(initialTitle);
  const [activeTab, setActiveTab] = useState("html");

  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const cssRef = useRef<HTMLTextAreaElement>(null);
  const jsRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const htmlLines = countLines(html);
  const cssLines = countLines(css);
  const jsLines = countLines(js);
  const textLines = countLines(text);
  const totalLines = htmlLines + cssLines + jsLines + textLines;
  const remainingLines = MAX_LINES - totalLines;
  const isOverLimit = totalLines > MAX_LINES;
  const canSave = title.trim().length > 0 && totalLines > 0 && !isOverLimit;

  const getActiveText = useCallback(() => {
    switch (activeTab) {
      case "html":
        return html;
      case "css":
        return css;
      case "javascript":
        return js;
      case "text":
        return text;
      default:
        return html;
    }
  }, [activeTab, html, css, js, text]);

  const getActiveRef = useCallback(() => {
    switch (activeTab) {
      case "html":
        return htmlRef;
      case "css":
        return cssRef;
      case "javascript":
        return jsRef;
      case "text":
        return textRef;
      default:
        return htmlRef;
    }
  }, [activeTab]);

  const lineNumbers = getLineNumbers(getActiveText());

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const hasCode = html.trim() || css.trim() || js.trim();
    const codeData: CodeData = {
      html,
      css,
      js,
      text,
      title: title.trim(),
      lang: text.trim() && !hasCode ? "text/file" : "html/css/js",
      totalLines,
      forkCount: 0,
    };
    onSave(codeData);
  };

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (canSave) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canSave, html, css, js, text, title, totalLines]);

  const renderEditor = (
    value: string,
    onChange: (val: string) => void,
    ref: React.RefObject<HTMLTextAreaElement | null>,
    placeholder: string,
  ) => (
    <div className="flex flex-1 border border-border rounded-md overflow-hidden bg-muted/30 min-h-0">
      {/* Line numbers — scroll-synced */}
      <div className="flex-shrink-0 w-12 bg-muted/50 border-r border-border overflow-hidden">
        <div
          ref={ref === getActiveRef() ? lineNumRef : undefined}
          className="text-muted-foreground text-sm font-mono text-right pr-2 pt-2 select-none overflow-hidden"
          style={{ lineHeight: "1.5rem" }}
        >
          <pre className="font-mono text-xs leading-6 m-0 p-0">
            {lineNumbers}
          </pre>
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 min-h-[300px] max-h-[calc(90vh-220px)] font-mono text-sm leading-6 bg-transparent border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:outline-none p-2 whitespace-pre overflow-y-auto"
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b border-border flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Code Parnik Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
          {/* Title input */}
          <div className="flex-shrink-0">
            <Input
              placeholder="Enter code title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex items-center justify-between flex-shrink-0">
              <TabsList>
                <TabsTrigger value="html" className="gap-1.5">
                  <span className="text-xs font-mono text-orange-500 font-bold">
                    HTML
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({htmlLines})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="css" className="gap-1.5">
                  <span className="text-xs font-mono text-blue-500 font-bold">
                    CSS
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({cssLines})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="javascript" className="gap-1.5">
                  <span className="text-xs font-mono text-yellow-500 font-bold">
                    JS
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({jsLines})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1.5">
                  <FileText className="h-3 w-3 text-green-500" />
                  <span className="text-xs font-mono text-green-600 font-bold">
                    .TXT
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({textLines})
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Line count indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`font-mono font-medium ${
                    isOverLimit
                      ? "text-destructive"
                      : remainingLines <= 100
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {totalLines} / {MAX_LINES} lines
                </span>
                {remainingLines >= 0 && (
                  <span className="text-muted-foreground">
                    ({remainingLines} remaining)
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 mt-2">
              <TabsContent value="html" className="h-full mt-0">
                {renderEditor(
                  html,
                  setHtml,
                  htmlRef,
                  "<!-- Write your HTML here -->",
                )}
              </TabsContent>
              <TabsContent value="css" className="h-full mt-0">
                {renderEditor(css, setCss, cssRef, "/* Write your CSS here */")}
              </TabsContent>
              <TabsContent value="javascript" className="h-full mt-0">
                {renderEditor(
                  js,
                  setJs,
                  jsRef,
                  "// Write your JavaScript here",
                )}
              </TabsContent>
              <TabsContent value="text" className="h-full mt-0">
                {renderEditor(
                  text,
                  setText,
                  textRef,
                  "/* Paste any code file content here — .txt, .py, .java, .c, .cpp, .rs, .go, .rb, .php, .swift, .kt, .scala, .r, .m, .h, .sh, .sql, .json, .xml, .yaml, .lua, .perl, .dart, .elm, .haskell, .ocaml, .erlang, .clojure, .groovy, .powershell, .vb, .asm, .fortran, .cobol, .lisp, .prolog, .tcl, .awk, .sed, .matlab, .julia, .zig, .nim, .crystal, .v, .wren, .gleam, .pony */",
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between flex-shrink-0 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span>Ctrl+S to save</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onCancel} size="sm">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave}
                size="sm"
                className="bg-[#DC143C] hover:bg-[#B01030]"
              >
                <Check className="h-4 w-4 mr-1" />
                Save Code
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
