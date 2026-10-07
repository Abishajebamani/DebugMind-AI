import { Bell, UserCircle } from "lucide-react";

const Navbar = () => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 md:px-6">
      
      <h2 className="text-lg font-semibold text-white">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">

        <Bell
          size={20}
          className="text-slate-300 cursor-pointer"
        />

        <div className="flex items-center gap-2">
          <UserCircle size={30} />
          <span className="text-sm text-white">
            Abisha
          </span>
        </div>

      </div>

    </header>
  );
};

export default Navbar;

