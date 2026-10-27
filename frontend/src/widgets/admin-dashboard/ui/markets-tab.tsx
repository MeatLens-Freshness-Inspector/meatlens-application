import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui";
import { Label } from "@/shared/ui";
import type { AdminDashboardPageViewModel } from "@/widgets/admin-dashboard";
import { MarketLocationEditor } from "./market-location-editor";

type MarketsTabContentProps = {
  dashboard: AdminDashboardPageViewModel;
};

const MarketsTab = ({ dashboard }: MarketsTabContentProps) => {
  const {
    marketLocations,
    newMarketName,
    newMarketLatitude,
    newMarketLongitude,
    setNewMarketLatitude,
    setNewMarketLongitude,
    setNewMarketName,
    handleCreateMarket,
    handleDeleteMarket,
    editingMarketId,
    editingLatitude,
    editingLongitude,
    setEditingLatitude,
    setEditingLongitude,
    startEditingMarket,
    cancelEditingMarket,
    saveMarketCoordinates,
  } = dashboard;

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="min-w-0 rounded-3xl border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-sm font-display uppercase tracking-wider">
            Add Market Location
          </CardTitle>
          <CardDescription>
            Configure the capture station location options used by inspectors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Market Name
            </Label>
            <Input
              placeholder="e.g. Old Market"
              value={newMarketName}
              onChange={(event) => setNewMarketName(event.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 14.5995"
                value={newMarketLatitude}
                onChange={(event) => setNewMarketLatitude(event.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 120.9842"
                value={newMarketLongitude}
                onChange={(event) => setNewMarketLongitude(event.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => void handleCreateMarket()}
            className="h-10 rounded-xl gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Market
          </Button>
        </CardContent>
      </Card>

      <Card className="min-w-0 rounded-3xl border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-sm font-display uppercase tracking-wider">
            Manage Market Locations
          </CardTitle>
          <CardDescription>
            Add or remove barangay markets shown in the capture station selector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketLocations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No markets configured yet
            </p>
          ) : (
            <div className="space-y-3">
              {marketLocations.map((market) => (
                <div
                  key={market.id}
                  className="rounded-2xl border border-border/70 bg-background/50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold">
                        {market.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Created {format(new Date(market.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => void handleDeleteMarket(market.id)}
                      aria-label={`Delete ${market.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <MarketLocationEditor
                    market={market}
                    isEditing={editingMarketId === market.id}
                    latitude={editingLatitude}
                    longitude={editingLongitude}
                    onStartEditing={() => startEditingMarket(market)}
                    onCancel={cancelEditingMarket}
                    onSave={() => void saveMarketCoordinates(market.id)}
                    onLatitudeChange={setEditingLatitude}
                    onLongitudeChange={setEditingLongitude}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketsTab;
