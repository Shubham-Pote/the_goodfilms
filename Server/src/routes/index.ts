import { Router } from "express";
import authRoutes from "./authRoutes";
import movieRoutes from "./movieRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/movies", movieRoutes);

export default router;
