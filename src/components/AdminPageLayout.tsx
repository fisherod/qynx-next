import AdminPanelHeader from "@/components/AdminPanelHeader";
import BscPriceTicker from "@/components/BscPriceTicker";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative z-40 min-h-screen flex flex-col">
        <AdminPanelHeader />
        <div className="min-h-screen">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
      </div>
      <BscPriceTicker />
    </>
  );
}
