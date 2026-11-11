export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex animate-pulse flex-col gap-5">
      <div className="h-4 w-40 rounded-full bg-line" />
      <div className="h-9 w-48 rounded-xl bg-line" />
      <div className="h-36 rounded-[22px] bg-card" />
      <div className="h-48 rounded-2xl bg-card" />
    </div>
  );
}
