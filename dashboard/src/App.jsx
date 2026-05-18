const DebtCard = ({ item }) => {
  const isHighRisk = item.riskScore >= 7;
  
  // Calculate how long the debt has existed
  const createdDate = new Date(item.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return (
    <div className={`p-5 rounded-xl border-t-4 bg-gray-800 flex flex-col justify-between ${isHighRisk ? 'border-red-500 shadow-lg shadow-red-900/20' : 'border-blue-500'}`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-bold uppercase tracking-wider bg-gray-700 px-2 py-1 rounded text-blue-300">
            {item.category}
          </span>
          <span className={`text-lg font-bold ${isHighRisk ? 'text-red-400' : 'text-blue-400'}`}>
            Score: {item.riskScore}
          </span>
        </div>
        
        <p className="text-gray-200 font-medium mb-2 italic">"{item.comment}"</p>
        <p className="text-sm text-gray-400 mb-4">{item.explanation}</p>
      </div>

      <div>
        {/* New Blame UI metadata segment */}
        <div className="flex justify-between text-xs text-gray-400 bg-gray-900/50 p-2 rounded mb-2 border border-gray-700/50">
          <div>👤 <span className="font-semibold text-gray-300">{item.author || 'system'}</span></div>
          <div>⏳ <span className="font-semibold text-yellow-500">{diffDays} days old</span></div>
        </div>

        <div className="text-xs text-gray-500 font-mono bg-black/30 p-2 rounded truncate">
          {item.file} : Line {item.line}
        </div>
      </div>
    </div>
  );
};