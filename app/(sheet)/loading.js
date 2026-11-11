export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex animate-pulse flex-col gap-5 pt-14">
      <div className="mx-auto h-12 w-40 rounded-xl bg-line" />
      <div className="h-10 rounded-full bg-line" />
      <div className="h-36 rounded-2xl bg-card" />
    </div>
  );
}
