export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh flex-col bg-[#0A0A0B] text-white overflow-x-hidden">
      <main className="flex-1 min-h-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
