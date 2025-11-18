import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // This layout can be expanded to include admin-specific navigation, sidebars, etc.
  return (
    <div>
      {children}
    </div>
  );
}
