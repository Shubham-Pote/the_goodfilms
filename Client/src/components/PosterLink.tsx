import { Link } from "react-router-dom";
import { Film } from "lucide-react";
import { TMDB_IMG } from "@/lib/tmdb";

export type PosterItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
};

export function PosterLink({ item, mediaType = "movie" }: { item: PosterItem; mediaType?: string }) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date)?.slice(0, 4);
  const type = item.media_type || mediaType;

  return (
    <Link to={`/title/${type}/${item.id}`} className="poster-link">
      <div className="poster-art">
        <Film size={24} aria-hidden="true" />
        {item.poster_path && <img src={`${TMDB_IMG}/w342${item.poster_path}`} alt="" loading="lazy" decoding="async"
          onError={(event) => { event.currentTarget.hidden = true; }} />}
      </div>
      <span className="poster-title">{title}</span>
      <span className="poster-meta">{type === "movie" ? "Film" : "Series"}{year && ` · ${year}`}</span>
    </Link>
  );
}
