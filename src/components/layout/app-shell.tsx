import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopHeader } from "@/components/layout/app-top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <AppSidebar />
      <div className="ml-[250px] flex min-h-screen w-[calc(100%-250px)] min-w-0 flex-col">
        <AppTopHeader />
        <main className="w-full flex-1 px-4 py-6 md:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
