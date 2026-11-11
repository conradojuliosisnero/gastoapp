import { Suspense } from "react";
import TabBar from "./tab-bar";
import AppHeader, { AppHeaderSkeleton } from "./app-header";

export default function AppLayout({ children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-32">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AppHeader />
      </Suspense>
      {children}
      <TabBar />
    </div>
  );
}
