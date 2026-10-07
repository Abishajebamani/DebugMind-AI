import Sidebar from "../../Components/layout/Sidebar";
import Navbar from "../../Components/layout/Navbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Navbar />

        <main className="p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
