import { Suspense } from "react";
import TabBar from "./tab-bar";
import AppHeader, { AppHeaderSkeleton } from "./app-header";

// Phones: one column with the floating tab bar. Desktop (lg+): sidebar on the left and wider, 2-column screens.
export default function AppLayout({ children }) {
  return (
    <div className="min-h-dvh lg:pl-64">
      <div className="mx-auto max-w-md px-4 pb-32 lg:max-w-5xl lg:px-10 lg:pb-16">
        <Suspense fallback={<AppHeaderSkeleton />}>
          <AppHeader />
        </Suspense>
        {children}
      </div>
      <TabBar />
    </div>
  );
}
