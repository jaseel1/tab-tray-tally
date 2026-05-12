import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = "dart" }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative group rounded-md border border-border bg-muted/40 my-3">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-wide">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={onCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono text-foreground whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};
