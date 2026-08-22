import { Link } from "react-router-dom";

/** Fallback route: the static template had no 404 page. */
export default function NotFound() {
  return (
    <section className="flat-section">
      <div className="container">
        <div className="box-title text-center">
          <h3 className="title mt-4">Page not found</h3>
          <p className="desc text-variant-1 mt-4">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link to="/" className="tf-btn primary mt-20">
            Back to homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
