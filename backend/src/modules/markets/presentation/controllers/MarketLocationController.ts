import { Request, Response } from "express";
import { marketLocationService } from "../../infrastructure/MarketLocationService";
import { auditLogService } from "../../../audit/infrastructure/AuditLogService";
import { getErrorStatus, resolveTrackedRequestAuthContext, toAuditActor, type RequestAuthContext } from "../../../../middleware/auth";
import { ListMarketLocations } from "../../application/ListMarketLocations";
import { CreateMarketLocation } from "../../application/CreateMarketLocation";
import { DeleteMarketLocation } from "../../application/DeleteMarketLocation";
import { UpdateMarketLocation } from "../../application/UpdateMarketLocation";
import {
  normalizeMarketCoordinates,
  type MarketCoordinatePair,
} from "../../domain/market-location-resolver";

class MarketLocationAccessError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export class MarketLocationController {
  private readonly listLocations = new ListMarketLocations(marketLocationService);
  private readonly createLocation = new CreateMarketLocation(marketLocationService);
  private readonly deleteLocation = new DeleteMarketLocation(marketLocationService);
  private readonly updateLocation = new UpdateMarketLocation(marketLocationService);

  private parseMarketInput(body: unknown): {
    name: string;
    coordinates: MarketCoordinatePair;
  } {
    const input = (body ?? {}) as {
      name?: unknown;
      latitude?: unknown;
      longitude?: unknown;
    };
    const name = typeof input.name === "string" ? input.name : "";
    if (!name.trim()) {
      throw new MarketLocationAccessError(400, "Market location name is required");
    }

    try {
      return {
        name,
        coordinates: normalizeMarketCoordinates({
          latitude: input.latitude,
          longitude: input.longitude,
        }),
      };
    } catch (error) {
      throw new MarketLocationAccessError(
        400,
        error instanceof Error ? error.message : "Invalid market coordinates",
      );
    }
  }
  private async requireAdmin(req: Request): Promise<RequestAuthContext> {
    try {
      const authContext = await resolveTrackedRequestAuthContext(req);
      if (!authContext.isAdmin) {
        throw new MarketLocationAccessError(403, "Admin access required");
      }

      return authContext;
    } catch (error) {
      if (error instanceof MarketLocationAccessError) {
        throw error;
      }

      throw new MarketLocationAccessError(
        getErrorStatus(error) ?? 401,
        error instanceof Error ? error.message : "Authentication required",
      );
    }
  }

  private handleError(action: string, res: Response, error: unknown, fallbackMessage: string): void {
    console.error(`${action} error:`, error);

    if (error instanceof MarketLocationAccessError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error instanceof Error ? error.message : fallbackMessage });
  }

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const locations = await this.listLocations.execute();
      res.json(locations);
    } catch (error) {
      this.handleError("Get market locations", res, error, "Failed to fetch market locations");
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const actor = await this.requireAdmin(req);

      const { name, coordinates } = this.parseMarketInput(req.body);
      const createdLocation = await this.createLocation.execute(name, coordinates);

      await auditLogService.write({
        payload: {
          event_type: "admin.market_location.create",
          event_time: new Date().toISOString(),
          actor: toAuditActor(actor),
          source: {
            ip: req.ip || null,
            user_agent: req.header("user-agent") || null,
          },
          data: {
            market_location_id: createdLocation.id,
            name: createdLocation.name,
            latitude: createdLocation.latitude,
            longitude: createdLocation.longitude,
          },
        },
      });

      res.status(201).json(createdLocation);
    } catch (error) {
      this.handleError("Create market location", res, error, "Failed to create market location");
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const actor = await this.requireAdmin(req);
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Market location ID is required" });
        return;
      }

      const { name, coordinates } = this.parseMarketInput(req.body);
      const updatedLocation = await this.updateLocation.execute(id, name, coordinates);

      await auditLogService.write({
        payload: {
          event_type: "admin.market_location.update",
          event_time: new Date().toISOString(),
          actor: toAuditActor(actor),
          source: {
            ip: req.ip || null,
            user_agent: req.header("user-agent") || null,
          },
          data: {
            market_location_id: updatedLocation.id,
            name: updatedLocation.name,
            latitude: updatedLocation.latitude,
            longitude: updatedLocation.longitude,
          },
        },
      });

      res.json(updatedLocation);
    } catch (error) {
      this.handleError("Update market location", res, error, "Failed to update market location");
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const actor = await this.requireAdmin(req);

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "Market location ID is required" });
        return;
      }

      await this.deleteLocation.execute(id);

      await auditLogService.write({
        payload: {
          event_type: "admin.market_location.delete",
          event_time: new Date().toISOString(),
          actor: toAuditActor(actor),
          source: {
            ip: req.ip || null,
            user_agent: req.header("user-agent") || null,
          },
          data: {
            market_location_id: id,
          },
        },
      });

      res.status(204).send();
    } catch (error) {
      this.handleError("Delete market location", res, error, "Failed to delete market location");
    }
  }
}
