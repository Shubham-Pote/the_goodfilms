import { Router } from "express";
import {
  getPlayerUrls,
  saveProgress,
  getProgress,
  deleteProgress,
  getDownloadLinks
} from "../controllers/movieController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = Router();

// Streaming Player URLs
// Route handles: /movies/player/:type/:id?s=&e= where type is movie, tv, or anime
router.get("/player/:type/:id", getPlayerUrls);

// Download Links (proxies to Supabase edge function)
router.post("/downloads", getDownloadLinks);

// Watch History / Progress Tracking
router.post("/progress", authenticateToken as any, saveProgress);
router.get("/progress", authenticateToken as any, getProgress);
router.delete("/progress", authenticateToken as any, deleteProgress);

export default router;

