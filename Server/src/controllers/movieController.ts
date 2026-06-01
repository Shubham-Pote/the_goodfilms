import type { Request, Response } from "express";
import { prisma } from "../db";
import type { AuthRequest } from "../middlewares/authMiddleware";

export const getPlayerUrls = async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const { s, e } = req.query;

  try {
    let videasyUrl = "";
    let twoEmbedUrl = "";
    let vidfastUrl = "";

    if (type === "movie") {
      videasyUrl = `https://player.videasy.net/movie/${id}`;
      twoEmbedUrl = `https://www.2embed.cc/embed/${id}`; 
      vidfastUrl = `https://vidfast.pro/movie/${id}?autoPlay=true`;
    } else if (type === "tv") {
      videasyUrl = `https://player.videasy.net/tv/${id}/${s}/${e}`;
      twoEmbedUrl = `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`;
      vidfastUrl = `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true`;
    } else if (type === "anime") {
        if (e) {
             videasyUrl = `https://player.videasy.net/anime/${id}/${e}`;
             vidfastUrl = `https://vidfast.pro/tv/${id}/1/${e}?autoPlay=true`; // Assuming anime maps to season 1 tv show generally, adjust if needed
        } else {
             videasyUrl = `https://player.videasy.net/anime/${id}`;
             vidfastUrl = `https://vidfast.pro/movie/${id}?autoPlay=true`;
        }
    } else {
      res.status(400).json({ error: "Invalid type. Must be 'movie', 'tv', or 'anime'." });
      return;
    }

    res.json({
      servers: {
        videasy: videasyUrl,
        twoEmbed: twoEmbedUrl || null,
        vidfast: vidfastUrl || null,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate player URLs" });
  }
};

export const saveProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { contentId, contentType, progress, timestamp, duration, season, episode } = req.body;

        if (!contentId || !contentType) {
             res.status(400).json({ error: "contentId and contentType are required" });
             return;
        }

        let progressKey = `${contentType}:${contentId}`;
        if (contentType === "tv" || contentType === "anime") {
            if (season) progressKey += `:${season}`;
            if (episode) progressKey += `:${episode}`;
        }

        const watchProgress = await prisma.watchHistory.upsert({
            where: {
                userId_progressKey: {
                    userId,
                    progressKey,
                }
            },
            update: { progress, timestamp, duration, season, episode },
            create: { userId, contentId, contentType, progressKey, progress, timestamp, duration, season, episode }
        });

        res.json({ success: true, watchProgress });
    } catch (error) {
        console.error("Save progress error:", error);
        res.status(500).json({ error: "Failed to save progress" });
    }
};

export const getProgress = async (req: AuthRequest, res: Response) => {
    try {
         const userId = req.user?.id;
         if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
         }

         const { contentId, contentType, season, episode } = req.query;

         if (contentId && contentType) {
            let progressKey = `${contentType}:${contentId}`;
            if (contentType === "tv" || contentType === "anime") {
                if (season) progressKey += `:${season}`;
                if (episode) progressKey += `:${episode}`;
            }

            const history = await prisma.watchHistory.findUnique({
                where: { userId_progressKey: { userId, progressKey } }
            });
            res.json({ history });
            return;
         } else {
             const history = await prisma.watchHistory.findMany({
                 where: { userId },
                 orderBy: { updatedAt: 'desc' }
             });
             res.json({ history });
             return;
         }
    } catch (error) {
        console.error("Get progress error:", error);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
};

export const deleteProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const { contentId, contentType, season, episode } = req.body;

        if (!contentId || !contentType) {
             res.status(400).json({ error: "contentId and contentType are required" });
             return;
        }

        let progressKey = `${contentType}:${contentId}`;
        if (contentType === "tv" || contentType === "anime") {
            if (season) progressKey += `:${season}`;
            if (episode) progressKey += `:${episode}`;
        }

        await prisma.watchHistory.delete({
            where: {
                userId_progressKey: {
                    userId,
                    progressKey,
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Delete progress error:", error);
        res.status(500).json({ error: "Failed to delete progress" });
    }
};

const SUPABASE_DOWNLOAD_URL = "https://pkvaqroqebmyejpcgxkf.supabase.co/functions/v1/movie-downloads";

export const getDownloadLinks = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        if (!payload || !payload.action) {
            res.status(400).json({ error: "action is required" });
            return;
        }

        console.log("[Downloads Proxy] Forwarding to Supabase:", payload);

        const response = await fetch(SUPABASE_DOWNLOAD_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Supabase API error:", response.status, errorText);
            res.status(response.status).json({ error: "Failed to proxy download request" });
            return;
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("getDownloadLinks proxy error:", error);
        res.status(500).json({ error: "Failed to fetch download links" });
    }
};
