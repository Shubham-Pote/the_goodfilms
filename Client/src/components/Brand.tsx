import { Link } from "react-router-dom";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="The Good Films home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>The Good <em>Films</em></span>
    </Link>
  );
}
