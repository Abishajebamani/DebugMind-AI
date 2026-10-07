import { useNavigate } from "react-router-dom";
import { Brain,Sparkles,Bug,CheckCircle } from "lucide-react";

const insights=[
  {
    icon:<Bug className="w-5 h-5 text-red-400"/>,
    title:"High Priority Bugs",
    value:"Scanning highlights risky patterns instantly",
  },
  {
    icon:<CheckCircle className="w-5 h-5 text-green-400"/>,
    title:"Resolution Rate",
    value:"AI-generated fixes reduce manual triage time",
  },
  {
    icon:<Sparkles className="w-5 h-5 text-yellow-400"/>,
    title:"AI Suggestion",
    value:"Upload a ZIP archive to kick off a project review.",
  },
];

const AIInsights=({projectId})=>{
  const navigate=useNavigate();

  return(
    <div className="bg-[#151C33] rounded-2xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="text-cyan-400 w-7 h-7"/>
        <h2 className="text-2xl font-bold text-white">
          AI Insights
        </h2>
      </div>

      <div className="space-y-4">
        {insights.map((item,index)=>(
          <div
            key={index}
            className="bg-[#1B2440] rounded-xl p-4 border border-slate-700 hover:border-cyan-500 transition"
          >
            <div className="flex items-start gap-4">
              <div>{item.icon}</div>
              <div>
                <h3 className="text-white font-semibold">{item.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={()=>navigate(`/bugs?projectId=${projectId}`)}
      
        className="mt-6 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        View Detailed AI Report
      </button>
    </div>
  );
};

export default AIInsights;