// Needs-based + merit financial aid engine.
// Estimates an expected family contribution from household income and size,
// then layers merit awards on top of the remaining need.
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function estimateAid({
  tuition = 0,
  householdIncome = 0,
  householdSize = 3,
  meritPct = 0,
  scholarshipAvailable = true,
} = {}) {
  const annual = Number(tuition) || 0;
  const income = Math.max(0, Number(householdIncome) || 0);
  const size = clamp(Number(householdSize) || 3, 1, 12);

  // Family contribution: 18% of income, discounted for larger households.
  const householdDiscount = clamp((size - 3) * 0.04, -0.18, 0.35);
  const contribution = Math.max(0, income * 0.18 * (1 - householdDiscount));

  const needRatio = annual > 0 ? clamp(1 - contribution / annual, 0, 1) : 0;
  const needBasedPct = scholarshipAvailable ? Math.round(needRatio * 88) : 0;
  const meritAwardPct = clamp(Math.round(Number(meritPct) || 0), 0, 60);
  const totalAidPct = clamp(needBasedPct + meritAwardPct, 0, 95);

  const needAward = Math.round((annual * needBasedPct) / 100);
  const meritAward = Math.round((annual * meritAwardPct) / 100);
  const totalAid = Math.round((annual * totalAidPct) / 100);
  const netTuition = Math.max(0, annual - totalAid);

  const band =
    totalAidPct >= 75
      ? { label: "Exceptional support", tone: "text-chart-3" }
      : totalAidPct >= 45
        ? { label: "Strong support", tone: "text-primary" }
        : totalAidPct >= 20
          ? { label: "Partial support", tone: "text-chart-4" }
          : { label: "Limited support", tone: "text-muted-foreground" };

  return {
    annual,
    contribution: Math.round(contribution),
    needBasedPct,
    meritAwardPct,
    totalAidPct,
    needAward,
    meritAward,
    totalAid,
    netTuition,
    monthly: Math.round(netTuition / 12),
    band,
  };
}