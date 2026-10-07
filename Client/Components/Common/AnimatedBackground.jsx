const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">

      {/* Top Left Blob */}
      <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>

      {/* Top Right Blob */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl top-0 right-0 animate-pulse"></div>

      {/* Bottom Center Blob */}
      <div className="absolute w-[450px] h-[450px] bg-blue-500/20 rounded-full blur-3xl bottom-0 left-1/2 -translate-x-1/2 animate-pulse"></div>

      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;