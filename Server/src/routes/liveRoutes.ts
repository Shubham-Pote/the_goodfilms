import { Router } from "express";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js";
import {
  getLiveEvents,
  getLiveEvent,
  createLiveEvent,
  updateLiveEvent,
  deleteLiveEvent,
  addStreamToEvent,
  deleteStream
} from "../controllers/liveController.js";

const router = Router();

// Public routes (though might need simple auth depending on requirements, let's keep them public or just authenticateToken)
// Assuming we want only registered users to see live streams:
router.get("/", authenticateToken, getLiveEvents);
router.get("/:id", authenticateToken, getLiveEvent);

// Admin only routes
router.post("/", authenticateToken, isAdmin, createLiveEvent);
router.put("/:id", authenticateToken, isAdmin, updateLiveEvent);
router.delete("/:id", authenticateToken, isAdmin, deleteLiveEvent);

// Streams
router.post("/:eventId/streams", authenticateToken, isAdmin, addStreamToEvent);
router.delete("/streams/:streamId", authenticateToken, isAdmin, deleteStream);

export default router;
