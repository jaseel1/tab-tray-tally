import { useMemo } from "react";
import { Flame } from "lucide-react";
import { MenuItem } from "@/components/MenuManager";

interface PopularItemsProps {
  orders: Array<{ items: Array<{ name: string; quantity: number }>; timestamp: Date | string }>;
  menuItems: MenuItem[];
  onPick: (item: MenuItem) => void;
  hidden?: boolean;
}

export function PopularItems({ orders, menuItems, onPick, hidden }: PopularItemsProps) {
  const top = useMemo(() => {
    if (hidden) return [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();
    for (const o of orders) {
      const t = new Date(o.timestamp).getTime();
      if (t < cutoff) continue;
      for (const it of o.items || []) {
        counts.set(it.name, (counts.get(it.name) || 0) + (it.quantity || 0));
      }
    }
    const ranked = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => menuItems.find((m) => m.name === name))
      .filter((m): m is MenuItem => !!m)
      .slice(0, 6);
    return ranked;
  }, [orders, menuItems, hidden]);

  if (hidden || top.length < 3) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Flame size={14} className="text-warning" />
        Popular
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {top.map((item) => (
          <button
            key={item.id}
            onClick={() => onPick(item)}
            className="snap-start shrink-0 flex items-center gap-2 bg-card hover:bg-accent active:scale-95 transition-all border border-border rounded-full pl-1 pr-3 py-1 shadow-sm"
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted" />
            )}
            <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.name}</span>
            <span className="text-xs text-muted-foreground">₹{item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
