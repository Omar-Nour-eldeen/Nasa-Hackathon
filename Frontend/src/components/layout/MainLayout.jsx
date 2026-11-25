import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  const { pathname } = useLocation();
  const [drawerPath, setDrawerPath] = useState(null);
  const mobileNavOpen = drawerPath === pathname;

  return (
    <div className="flex min-h-dvh overflow-x-clip bg-(--app-bg)">
      <Sidebar
        isOpen={mobileNavOpen}
        onClose={() => setDrawerPath(null)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          isMenuOpen={mobileNavOpen}
          onMenuClick={() => setDrawerPath(pathname)}
        />

        <main className="min-w-0 flex-1 p-3.5 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}