import { useState } from "react";
import { Film } from "lucide-react";

export function FeaturedArtwork({ src, mobileSrc, fallback }: { src: string; mobileSrc: string; fallback?: string }) {
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const unavailable = backdropFailed && (!fallback || posterFailed);

  return (
    <div className="featured-art" aria-hidden="true">
      {!backdropFailed ? <picture>
        <source media="(max-width: 680px)" srcSet={mobileSrc} />
        <img src={src} alt="" fetchPriority="high" onError={() => setBackdropFailed(true)} />
      </picture> : unavailable
        ? <Film className="feature-placeholder-icon" strokeWidth={0.55} />
        : <img className="featured-poster-fallback" src={fallback} alt="" onError={() => setPosterFailed(true)} />}
    </div>
  );
}
