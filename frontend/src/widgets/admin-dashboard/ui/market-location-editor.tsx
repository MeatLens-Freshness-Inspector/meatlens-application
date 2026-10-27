import { Check, Pencil, X } from "lucide-react";
import { Button, Input, Label } from "@/shared/ui";
import type { MarketLocation } from "@/entities/market-location";

type MarketLocationEditorProps = {
  market: MarketLocation;
  isEditing: boolean;
  latitude: string;
  longitude: string;
  onStartEditing: () => void;
  onCancel: () => void;
  onSave: () => void;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

export function MarketLocationEditor({
  market,
  isEditing,
  latitude,
  longitude,
  onStartEditing,
  onCancel,
  onSave,
  onLatitudeChange,
  onLongitudeChange,
}: MarketLocationEditorProps) {
  if (!isEditing) {
    return (
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">
          {market.latitude != null && market.longitude != null
            ? `Reference point: ${market.latitude.toFixed(6)}, ${market.longitude.toFixed(6)}`
            : "Reference point not configured"}
        </p>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={onStartEditing}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit point
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-primary/30 bg-background/70 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Latitude</Label>
          <Input type="number" step="any" value={latitude} onChange={(event) => onLatitudeChange(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Longitude</Label>
          <Input type="number" step="any" value={longitude} onChange={(event) => onLongitudeChange(event.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 rounded-lg" onClick={onSave}>
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Save point
        </Button>
        <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={onCancel}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
