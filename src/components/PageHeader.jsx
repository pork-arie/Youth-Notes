import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function PageHeader({ title, subtitle, back, action }) {
  return (
    <header className="page-header">
      {back && (
        <Link to={back} className="icon-btn" aria-label="Back">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
      )}
      <div className="page-header__text">
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}

export default PageHeader;
