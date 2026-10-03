import { NavLink } from "react-router-dom";
import { Home, NotebookPen, User, Users } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/profile", label: "Profile", icon: User },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="bottom-nav__item">
          <Icon size={20} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
