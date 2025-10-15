export function computeAdherence(logs){
    // logs: array of {status}
    const total = logs.length;
    const taken = logs.filter(l=>l.status==="Taken").length;
    const pct = total===0 ? 100 : Math.round( (taken/total)*100 );
    let risk = "Low";
    if(pct < 60) risk = "High";
    else if(pct < 80) risk = "Medium";
    return { pct, risk };
  }
  
  export function aiInsightFromLogs(logs){
    const missed = logs.filter(l=>l.status==="Missed").length;
    if(missed >= 3) return "⚠️ High risk: multiple missed doses — notify doctor";
    if(missed === 0) return "✅ Excellent adherence this week";
    return "Keep it up — try setting a consistent routine.";
  }
  