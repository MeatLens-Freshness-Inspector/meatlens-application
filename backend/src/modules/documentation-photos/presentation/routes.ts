import { Router } from "express";
import { DocumentationPhotoController } from "./controllers/DocumentationPhotoController";

const router = Router();
const controller = new DocumentationPhotoController();

router.get("/", (req, res) => void controller.getAll(req, res));
router.post("/", (req, res) => void controller.create(req, res));

export default router;
