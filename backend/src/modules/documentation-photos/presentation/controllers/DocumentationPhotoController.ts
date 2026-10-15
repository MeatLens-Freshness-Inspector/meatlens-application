import type { Request, Response } from "express";
import {
  getErrorStatus,
  resolveTrackedRequestAuthContext,
} from "../../../../middleware/auth";
import { normalizeInspectionCoordinates } from "../../../../types/inspectionCoordinates";
import type { DocumentationPhotoInsert } from "../../../../types/documentationPhoto";
import { documentationPhotoService } from "../../infrastructure/DocumentationPhotoService";

export class DocumentationPhotoController {
  private async getUserId(req: Request): Promise<string> {
    try {
      return (await resolveTrackedRequestAuthContext(req)).userId;
    } catch (error) {
      const status = getErrorStatus(error) ?? 401;
      const authError = new Error(error instanceof Error ? error.message : "Authentication required");
      Object.assign(authError, { status });
      throw authError;
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = await this.getUserId(req);
      const requestedLimit = Number.parseInt(String(req.query.limit ?? "100"), 10);
      const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 200)
        : 100;
      res.json(await documentationPhotoService.getAll(limit, userId));
    } catch (error) {
      const status = getErrorStatus(error) ?? 500;
      res.status(status).json({
        error: error instanceof Error ? error.message : "Failed to fetch documentation photos",
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = await this.getUserId(req);
      const body = req.body as Partial<DocumentationPhotoInsert>;
      if (!body.client_submission_id?.trim()) {
        res.status(400).json({ error: "client_submission_id is required" });
        return;
      }
      if (!body.image_url?.trim()) {
        res.status(400).json({ error: "image_url is required" });
        return;
      }
      if (!body.captured_at || Number.isNaN(Date.parse(body.captured_at))) {
        res.status(400).json({ error: "captured_at must be a valid ISO datetime string" });
        return;
      }

      let coordinates;
      try {
        coordinates = normalizeInspectionCoordinates({
          location_latitude: body.location_latitude,
          location_longitude: body.location_longitude,
        });
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : "Invalid coordinates" });
        return;
      }

      const input: DocumentationPhotoInsert = {
        client_submission_id: body.client_submission_id.trim(),
        image_url: body.image_url.trim(),
        location: body.location?.trim() || null,
        ...coordinates,
        stall_number: body.stall_number?.trim() || null,
        captured_at: new Date(Date.parse(body.captured_at)).toISOString(),
      };
      const result = await documentationPhotoService.create(input, userId);
      res.status(result.created ? 201 : 200).json(result.photo);
    } catch (error) {
      const status = getErrorStatus(error) ?? 500;
      res.status(status).json({
        error: error instanceof Error ? error.message : "Failed to save documentation photo",
      });
    }
  }
}
