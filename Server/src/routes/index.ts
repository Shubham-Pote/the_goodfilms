import { Router } from "express";
import authRoutes from "./authRoutes.js";
import movieRoutes from "./movieRoutes.js";
import liveRoutes from "./liveRoutes.js";
import proxyRoutes from "./proxyRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/movies", movieRoutes);
router.use("/live", liveRoutes);
router.use("/proxy", proxyRoutes);

export default router;
