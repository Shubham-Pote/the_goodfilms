import { Link } from "react-router-dom";
import { Clapperboard } from "lucide-react";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="The Good Films home">
      <span className="brand-mark" aria-hidden="true"><Clapperboard strokeWidth={2.3} /></span>
      <span>The Good Films</span>
    </Link>
  );
}
