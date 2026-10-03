import { CloudOff } from "lucide-react";

function OfflineNotice({ children = "You're offline. This page needs internet." }) {
  return (
    <div className="notice">
      <CloudOff size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export default OfflineNotice;
