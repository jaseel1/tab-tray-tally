import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Pencil } from "lucide-react";

export interface TableSession {
  id: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: "open" | "billed" | "closed";
  bill_number?: string | null;
  opened_at?: string;
  billed_at?: string | null;
}

export interface PosTable {
  id: string;
  table_number: number;
  label: string;
  status: "free" | "occupied" | "billed";
  current_session_id: string | null;
  session: TableSession | null;
}

interface TableGridProps {
  tables: PosTable[];
  activeTableId?: string | null;
  onSelect: (table: PosTable) => void;
  onRename?: (table: PosTable) => void;
  canRename?: boolean;
}

const statusStyles: Record<PosTable["status"], string> = {
  free: "bg-success/15 border-success/40 text-success-foreground",
  occupied: "bg-warning/15 border-warning/50",
  billed: "bg-info/15 border-info/50",
};

const badgeStyles: Record<PosTable["status"], string> = {
  free: "bg-success text-success-foreground",
  occupied: "bg-warning text-warning-foreground",
  billed: "bg-info text-info-foreground",
};

function timeAgo(iso?: string) {
  if (!iso) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function TableGrid({ tables, activeTableId, onSelect, onRename, canRename }: TableGridProps) {
  if (tables.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6 text-center">
          <Utensils className="mx-auto mb-3 text-muted-foreground" size={32} />
          <p className="text-muted-foreground text-sm">
            No tables configured. Ask your admin to set the number of tables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tables.map((t) => {
        const itemCount = t.session?.items?.reduce((a: number, b: any) => a + (b.quantity || 0), 0) ?? 0;
        const isActive = activeTableId === t.id;
        const displayLabel = t.label || `Table ${t.table_number}`;
        return (
          <Card
            key={t.id}
            onClick={() => onSelect(t)}
            className={`cursor-pointer rounded-2xl border-2 transition-all hover:shadow-lg active:scale-[0.98] ${statusStyles[t.status]} ${
              isActive ? "ring-2 ring-primary shadow-lg" : ""
            }`}
          >
            <CardContent className="p-3 min-h-[110px]">
              <div className="flex items-start justify-between mb-2 gap-1">
                <span className="font-bold text-foreground text-sm truncate flex-1" title={displayLabel}>
                  {displayLabel}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={`${badgeStyles[t.status]} text-[10px] capitalize`}>{t.status}</Badge>
                  {canRename && onRename && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRename(t); }}
                      className="p-1 rounded-md hover:bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Rename table"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              </div>
              {t.session ? (
                <div className="text-xs space-y-0.5 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">₹{Number(t.session.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open</span>
                    <span>{timeAgo(t.session.opened_at)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Tap to start order</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
