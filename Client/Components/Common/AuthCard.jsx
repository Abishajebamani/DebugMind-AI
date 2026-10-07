const AuthCard = ({ children }) => {
  return (
    <div
      className="
      w-full
      max-w-md
      rounded-3xl
      border
      border-white/10
      bg-white/10
      backdrop-blur-xl
      shadow-2xl
      p-8
      "
    >
      {children}
    </div>
  );
};

export default AuthCard;