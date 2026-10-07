const DashboardCard = ({ title, value, color }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    </div>
  );
};

export default DashboardCard;