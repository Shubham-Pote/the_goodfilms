import { useState, type PointerEvent } from "react";

// The pointer-relative rotation follows the React Bits Tilted Card interaction.
// https://reactbits.dev/components/tilted-card
export function FeaturedArtwork({ src, mobileSrc, fallback }: { src: string; mobileSrc: string; fallback?: string }) {
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const unavailable = backdropFailed && (!fallback || posterFailed);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;
    const style = event.currentTarget.style;
    style.setProperty("--tilt-x", `${-y * 3}deg`);
    style.setProperty("--tilt-y", `${x * 3}deg`);
  }

  return (
    <div className="featured-art" data-unavailable={unavailable || undefined} onPointerMove={tilt} onPointerLeave={(event) => {
      event.currentTarget.style.removeProperty("--tilt-x");
      event.currentTarget.style.removeProperty("--tilt-y");
    }}>
      {!backdropFailed ? <picture>
        <source media="(max-width: 680px)" srcSet={mobileSrc} />
        <img src={src} alt="" fetchPriority="high" onError={() => setBackdropFailed(true)} />
      </picture> : !unavailable && <img className="featured-poster-fallback" src={fallback} alt="" onError={() => setPosterFailed(true)} />}
    </div>
  );
}
