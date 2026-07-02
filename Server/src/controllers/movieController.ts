import type { Request, Response } from "express";

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
