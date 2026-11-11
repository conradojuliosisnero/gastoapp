import Fresh from "./fresh";

// Full-screen forms, without the tab bar. On wide screens they become a centered panel.
export default function SheetLayout({ children }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-36 lg:max-w-xl lg:py-14">
      <div className="lg:rounded-[28px] lg:bg-bg lg:px-6 lg:pt-5 lg:shadow-[0_24px_80px_rgba(0,0,0,0.18)] lg:ring-1 lg:ring-line">
        <Fresh>{children}</Fresh>
      </div>
    </div>
  );
}
