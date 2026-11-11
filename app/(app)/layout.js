import TabBar from "./tab-bar";

export default function AppLayout({ children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(48px,env(safe-area-inset-top))] pb-32">
      {children}
      <TabBar />
    </div>
  );
}
