const Button = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="
      w-full
      py-3
      rounded-xl
      font-semibold
      text-white
      bg-gradient-to-r
      from-cyan-500
      to-purple-600
      hover:scale-105
      transition-all
      duration-300
      shadow-lg
      shadow-cyan-500/20
      "
    >
      {children}
    </button>
  );
};

export default Button;