import { forwardRef } from "react";

const Input = forwardRef(({ label, ...props }, ref) => {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">
        {label}
      </label>

      <input
        ref={ref}
        {...props}
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
      />
    </div>
  );
});

export default Input;