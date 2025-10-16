// AI-powered analysis utilities for CareCircle

export function computeAdherence(logs) {
  // logs: array of {status, scheduledTime, actualTime}
    const total = logs.length;
  const taken = logs.filter(l => l.status === "Taken").length;
  const missed = logs.filter(l => l.status === "Missed").length;
  const skipped = logs.filter(l => l.status === "Skipped").length;
  const delayed = logs.filter(l => l.status === "Delayed").length;
  
  const pct = total === 0 ? 100 : Math.round((taken / total) * 100);
  
    let risk = "Low";
  if (pct < 60) risk = "High";
  else if (pct < 80) risk = "Medium";
  
  return { pct, risk, taken, missed, skipped, delayed, total };
}

export function analyzeBehavioralPatterns(activities) {
  // Analyze patterns in medication adherence
  const patterns = {
    consistency: 0,
    timingAccuracy: 0,
    riskFactors: [],
    recommendations: []
  };

  if (activities.length === 0) return patterns;

  // Calculate consistency (how often they take meds at the same time)
  const timeVariance = calculateTimeVariance(activities);
  patterns.consistency = Math.max(0, 100 - timeVariance);

  // Calculate timing accuracy (how close to scheduled time)
  patterns.timingAccuracy = calculateTimingAccuracy(activities);

  // Identify risk factors
  patterns.riskFactors = identifyRiskFactors(activities);

  // Generate recommendations
  patterns.recommendations = generateRecommendations(patterns);

  return patterns;
}

function calculateTimeVariance(activities) {
  const takenActivities = activities.filter(a => a.status === "Taken" && a.actualTime);
  if (takenActivities.length < 2) return 0;

  const times = takenActivities.map(a => new Date(a.actualTime).getHours() * 60 + new Date(a.actualTime).getMinutes());
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
  
  return Math.sqrt(variance); // Standard deviation in minutes
}

function calculateTimingAccuracy(activities) {
  const takenActivities = activities.filter(a => a.status === "Taken" && a.scheduledTime && a.actualTime);
  if (takenActivities.length === 0) return 100;

  const delays = takenActivities.map(a => {
    const scheduled = new Date(a.scheduledTime);
    const actual = new Date(a.actualTime);
    return Math.abs(actual - scheduled) / (1000 * 60); // Delay in minutes
  });

  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  return Math.max(0, 100 - (avgDelay / 30) * 100); // 30 minutes = 0% accuracy
}

function identifyRiskFactors(activities) {
  const riskFactors = [];
  const recentActivities = activities.slice(-7); // Last 7 days

  // Check for consecutive missed doses
  let consecutiveMissed = 0;
  for (let i = recentActivities.length - 1; i >= 0; i--) {
    if (recentActivities[i].status === "Missed") {
      consecutiveMissed++;
    } else {
      break;
    }
  }

  if (consecutiveMissed >= 3) {
    riskFactors.push({
      type: "consecutive_missed",
      severity: "high",
      message: `${consecutiveMissed} consecutive missed doses`
    });
  }

  // Check for frequent delays
  const delayedCount = recentActivities.filter(a => a.status === "Delayed").length;
  if (delayedCount >= 3) {
    riskFactors.push({
      type: "frequent_delays",
      severity: "medium",
      message: "Frequent medication delays detected"
    });
  }

  // Check for weekend patterns
  const weekendActivities = recentActivities.filter(a => {
    const day = new Date(a.scheduledTime).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });
  
  const weekendMissed = weekendActivities.filter(a => a.status === "Missed").length;
  if (weekendMissed >= 2) {
    riskFactors.push({
      type: "weekend_pattern",
      severity: "medium",
      message: "Poor adherence on weekends"
    });
  }

  return riskFactors;
}

function generateRecommendations(patterns) {
  const recommendations = [];

  if (patterns.consistency < 70) {
    recommendations.push({
      type: "consistency",
      message: "Try taking medications at the same time each day. Set phone reminders to help build a routine."
    });
  }

  if (patterns.timingAccuracy < 80) {
    recommendations.push({
      type: "timing",
      message: "Consider setting multiple reminders 15 minutes before your scheduled medication time."
    });
  }

  if (patterns.riskFactors.some(rf => rf.severity === "high")) {
    recommendations.push({
      type: "urgent",
      message: "Contact your doctor immediately. Multiple missed doses can be dangerous."
    });
  }

  if (patterns.riskFactors.some(rf => rf.type === "weekend_pattern")) {
    recommendations.push({
      type: "weekend",
      message: "Set weekend-specific reminders or use a pill organizer for weekends."
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "positive",
      message: "Great job! You're maintaining excellent medication adherence. Keep up the good work!"
    });
  }

  return recommendations;
}

export function predictHealthRisks(activities, medicines) {
  const risks = [];

  // Analyze each medicine for specific risks
  medicines.forEach(medicine => {
    const medicineActivities = activities.filter(a => a.medicine === medicine._id);
    const recentActivities = medicineActivities.slice(-14); // Last 2 weeks

    // Critical medicine analysis
    if (isCriticalMedicine(medicine.name)) {
      const missedCount = recentActivities.filter(a => a.status === "Missed").length;
      if (missedCount >= 2) {
        risks.push({
          type: "critical_medicine_missed",
          severity: "high",
          medicine: medicine.name,
          message: `Critical medicine ${medicine.name} missed ${missedCount} times in 2 weeks`,
          action: "Contact doctor immediately"
        });
      }
    }

    // Blood pressure medicine specific risks
    if (isBloodPressureMedicine(medicine.name)) {
      const missedCount = recentActivities.filter(a => a.status === "Missed").length;
      if (missedCount >= 1) {
        risks.push({
          type: "bp_medication_risk",
          severity: "high",
          medicine: medicine.name,
          message: "Skipped blood pressure medication - risk of hypertension complications",
          action: "Monitor blood pressure and contact doctor"
        });
      }
    }

    // Diabetes medicine specific risks
    if (isDiabetesMedicine(medicine.name)) {
      const missedCount = recentActivities.filter(a => a.status === "Missed").length;
      if (missedCount >= 1) {
        risks.push({
          type: "diabetes_medication_risk",
          severity: "high",
          medicine: medicine.name,
          message: "Skipped diabetes medication - risk of blood sugar complications",
          action: "Monitor blood sugar levels and contact doctor"
        });
      }
    }
  });

  return risks;
}

function isCriticalMedicine(medicineName) {
  const criticalMeds = [
    "warfarin", "digoxin", "lithium", "phenytoin", "carbamazepine",
    "valproic acid", "theophylline", "cyclosporine", "tacrolimus"
  ];
  return criticalMeds.some(med => medicineName.toLowerCase().includes(med));
}

function isBloodPressureMedicine(medicineName) {
  const bpMeds = [
    "lisinopril", "amlodipine", "metoprolol", "losartan", "hydrochlorothiazide",
    "atenolol", "ramipril", "valsartan", "carvedilol", "diltiazem"
  ];
  return bpMeds.some(med => medicineName.toLowerCase().includes(med));
}

function isDiabetesMedicine(medicineName) {
  const diabetesMeds = [
    "metformin", "insulin", "glipizide", "glyburide", "pioglitazone",
    "rosiglitazone", "sitagliptin", "saxagliptin", "linagliptin"
  ];
  return diabetesMeds.some(med => medicineName.toLowerCase().includes(med));
}

export function generateAdherenceReport(activities, medicines, period = 30) {
  const report = {
    period: `${period} days`,
    summary: {},
    medicineBreakdown: [],
    trends: {},
    insights: [],
    recommendations: []
  };

  // Calculate overall adherence
  const recentActivities = activities.slice(-period);
  const adherence = computeAdherence(recentActivities);
  report.summary = adherence;

  // Medicine-specific breakdown
  medicines.forEach(medicine => {
    const medicineActivities = recentActivities.filter(a => a.medicine === medicine._id);
    const medicineAdherence = computeAdherence(medicineActivities);
    
    report.medicineBreakdown.push({
      medicine: medicine.name,
      adherence: medicineAdherence,
      totalDoses: medicineActivities.length
    });
  });

  // Calculate trends (comparing first half vs second half of period)
  const midPoint = Math.floor(recentActivities.length / 2);
  const firstHalf = computeAdherence(recentActivities.slice(0, midPoint));
  const secondHalf = computeAdherence(recentActivities.slice(midPoint));
  
  report.trends = {
    firstHalf: firstHalf.pct,
    secondHalf: secondHalf.pct,
    trend: secondHalf.pct > firstHalf.pct ? "improving" : 
           secondHalf.pct < firstHalf.pct ? "declining" : "stable"
  };

  // Generate insights
  const patterns = analyzeBehavioralPatterns(recentActivities);
  report.insights = patterns.recommendations;

  // Predict health risks
  const risks = predictHealthRisks(recentActivities, medicines);
  report.healthRisks = risks;

  return report;
}

export function aiInsightFromLogs(logs) {
  const adherence = computeAdherence(logs);
  const patterns = analyzeBehavioralPatterns(logs);

  if (adherence.risk === "High") {
    return "⚠️ High risk: multiple missed doses — notify doctor immediately";
  } else if (adherence.risk === "Medium") {
    return "⚠️ Moderate risk: inconsistent medication adherence — consider setting reminders";
  } else if (patterns.consistency < 70) {
    return "📅 Try to take medications at more consistent times";
  } else if (adherence.pct === 100) {
    return "✅ Excellent adherence this week!";
  } else {
    return "👍 Good adherence — keep up the routine!";
  }
  }
  