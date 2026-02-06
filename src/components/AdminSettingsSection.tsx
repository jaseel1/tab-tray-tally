import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings, Clock, Ban, Infinity } from "lucide-react";

type EditMode = "off" | "unlimited" | "time_limited";

interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_metadata: Record<string, any>;
  updated_at: string;
}

export function AdminSettingsSection() {
  const [editMode, setEditMode] = useState<EditMode>("time_limited");
  const [editMinutes, setEditMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.rpc("get_admin_settings");

      if (error) throw error;

      const result = data as unknown as { success: boolean; data: AdminSetting[] };

      if (result.success && result.data) {
        const orderEditSetting = result.data.find(
          (s) => s.setting_key === "order_edit_mode"
        );
        if (orderEditSetting) {
          setEditMode(orderEditSetting.setting_value as EditMode);
          if (orderEditSetting.setting_metadata?.minutes) {
            setEditMinutes(orderEditSetting.setting_metadata.minutes);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const metadata = editMode === "time_limited" ? { minutes: editMinutes } : {};

      const { data, error } = await supabase.rpc("upsert_admin_setting", {
        p_key: "order_edit_mode",
        p_value: editMode,
        p_metadata: metadata,
      });

      if (error) throw error;

      const result = data as { success: boolean };

      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Editing Settings
        </CardTitle>
        <CardDescription>
          Configure how and when POS users can edit orders after creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-3 block">Edit Mode</Label>
          <RadioGroup
            value={editMode}
            onValueChange={(value) => setEditMode(value as EditMode)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="off" id="off" />
              <Label
                htmlFor="off"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Ban className="h-5 w-5 text-destructive-foreground" />
                <div>
                  <div className="font-medium">Off</div>
                  <div className="text-sm text-muted-foreground">
                    Order editing is completely disabled
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="unlimited" id="unlimited" />
              <Label
                htmlFor="unlimited"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Infinity className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Unlimited</div>
                  <div className="text-sm text-muted-foreground">
                    Orders can be edited at any time
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="time_limited" id="time_limited" />
              <Label
                htmlFor="time_limited"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Time Limited</div>
                  <div className="text-sm text-muted-foreground">
                    Orders can only be edited within a specific time window
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {editMode === "time_limited" && (
          <div className="pl-6 border-l-2 border-muted">
            <Label htmlFor="minutes" className="text-sm font-medium mb-2 block">
              Edit Window (minutes)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="minutes"
                type="number"
                min={1}
                max={1440}
                value={editMinutes}
                onChange={(e) => setEditMinutes(parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                minutes after order creation
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Orders can be edited for {editMinutes} minutes after they are created
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
