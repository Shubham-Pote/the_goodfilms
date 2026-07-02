import { Router } from "express";
import authRoutes from "./authRoutes.js";
import movieRoutes from "./movieRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/movies", movieRoutes);

export default router;
