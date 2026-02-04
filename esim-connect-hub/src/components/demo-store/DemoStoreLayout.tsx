import { Outlet } from "react-router-dom";
import { DemoStoreNavbar } from "./DemoStoreNavbar";
import { DemoStoreFooter } from "./DemoStoreFooter";

export function DemoStoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <DemoStoreNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <DemoStoreFooter />
    </div>
  );
}
