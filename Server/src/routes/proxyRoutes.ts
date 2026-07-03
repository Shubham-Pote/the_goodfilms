import { Router } from "express";

const router = Router();

// Handle CORS preflight
router.options("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.status(204).end();
});

router.all("/", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  const referer = req.query.referer as string | undefined;
  const origin = req.query.origin as string | undefined;
  const userAgent = (req.query.userAgent as string) || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const cookie = req.query.cookie as string | undefined;

  try {
    const fetchHeaders: Record<string, string> = {
      "User-Agent": userAgent,
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    };
    
    if (referer) fetchHeaders["Referer"] = referer;
    if (origin) fetchHeaders["Origin"] = origin;
    if (cookie) fetchHeaders["Cookie"] = cookie;
    
    // Pass along content-type for POST/PUT requests
    if (req.headers["content-type"]) {
      fetchHeaders["Content-Type"] = req.headers["content-type"] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: fetchHeaders,
    };

    // Include body for methods that allow it
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      fetchOptions.body = Buffer.concat(chunks);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Read the full body into a buffer first
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Only copy safe headers — specifically content-type
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "*");

    // Send as a simple, clean response
    res.status(response.status).send(buffer);
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: "Proxy request failed", details: error.message });
  }
});

export default router;
