import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RenameTableDialogProps {
  open: boolean;
  initialLabel: string;
  defaultLabel: string;
  onClose: () => void;
  onSave: (label: string) => Promise<void> | void;
}

export function RenameTableDialog({ open, initialLabel, defaultLabel, onClose, onSave }: RenameTableDialogProps) {
  const [value, setValue] = useState(initialLabel);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setValue(initialLabel); }, [open, initialLabel]);

  const submit = async () => {
    setSaving(true);
    try { await onSave(value.trim()); onClose(); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename table</DialogTitle>
          <DialogDescription>
            This name shows on the cart and printed bill. Leave blank to reset to "{defaultLabel}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            autoFocus
            value={value}
            placeholder={defaultLabel}
            maxLength={40}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            className="rounded-xl"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button onClick={submit} disabled={saving} className="rounded-xl">
              {saving ? "Saving..." : "Save name"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
