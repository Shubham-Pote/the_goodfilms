import { Router } from "express";
import {
  getPlayerUrls,
  getDownloadLinks
} from "../controllers/movieController";

const router = Router();

// Streaming Player URLs
// Route handles: /movies/player/:type/:id?s=&e= where type is movie, tv, or anime
router.get("/player/:type/:id", getPlayerUrls);

// Download Links (proxies to Supabase edge function)
router.post("/downloads", getDownloadLinks);

export default router;
