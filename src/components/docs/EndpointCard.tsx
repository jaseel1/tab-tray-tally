import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "./CodeBlock";

interface Param {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

interface EndpointCardProps {
  name: string;
  purpose: string;
  role?: "Owner" | "Viewer" | "Owner + Viewer" | "Public";
  params?: Param[];
  returns?: string;
  dart: string;
}

const roleColor: Record<string, string> = {
  Owner: "bg-primary/10 text-primary border-primary/20",
  Viewer: "bg-muted text-muted-foreground border-border",
  "Owner + Viewer": "bg-secondary text-secondary-foreground border-border",
  Public: "bg-accent text-accent-foreground border-border",
};

export const EndpointCard = ({
  name,
  purpose,
  role = "Owner",
  params,
  returns,
  dart,
}: EndpointCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 my-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h4 className="font-mono text-sm font-semibold text-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">{purpose}</p>
        </div>
        <Badge variant="outline" className={roleColor[role]}>{role}</Badge>
      </div>

      {params && params.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Parameters</div>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-2 py-1.5 font-medium">Name</th>
                  <th className="text-left px-2 py-1.5 font-medium">Type</th>
                  <th className="text-left px-2 py-1.5 font-medium">Req</th>
                  <th className="text-left px-2 py-1.5 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.name} className="border-t border-border">
                    <td className="px-2 py-1.5 font-mono">{p.name}</td>
                    <td className="px-2 py-1.5 font-mono text-muted-foreground">{p.type}</td>
                    <td className="px-2 py-1.5">{p.required ? "✓" : "—"}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{p.description ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {returns && (
        <div className="mt-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Returns</div>
          <CodeBlock code={returns} language="json" />
        </div>
      )}

      <div className="mt-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Flutter example</div>
        <CodeBlock code={dart} language="dart" />
      </div>
    </div>
  );
};
