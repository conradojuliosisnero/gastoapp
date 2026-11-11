// Full-screen forms, without the tab bar.
export default function SheetLayout({ children }) {
  return <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(16px,env(safe-area-inset-top))] pb-10">{children}</div>;
}
