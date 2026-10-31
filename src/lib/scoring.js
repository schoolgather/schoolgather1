import { distanceToSchool, schoolCoords } from "@/lib/geo";

// Deterministic, explainable compatibility engine.
// Weighted signals → 0-100 match score plus human-readable reasons.
const WEIGHTS = {
  curriculum: 25,
  budget: 25,
  distance: 20,
  learning: 15,
  interests: 15,
};

const overlap = (a = [], b = []) => {
  const setB = new Set((b || []).map((x) => String(x).toLowerCase()));
  return (a || []).filter((x) => setB.has(String(x).toLowerCase()));
};

export function matchSchool(school, answers = {}) {
  const reasons = [];
  const breakdown = [];
  let score = 0;

  // Curriculum alignment
  let curriculumPoints = WEIGHTS.curriculum * 0.45;
  if (!answers.curriculum || answers.curriculum === "Any") {
    curriculumPoints = WEIGHTS.curriculum * 0.8;
    reasons.push(`Offers the ${school.curriculum_type} curriculum`);
  } else if (school.curriculum_type === answers.curriculum) {
    curriculumPoints = WEIGHTS.curriculum;
    reasons.push(`${school.curriculum_type} curriculum, exactly as you asked`);
  } else {
    reasons.push(`Runs ${school.curriculum_type} rather than ${answers.curriculum}`);
  }
  score += curriculumPoints;
  breakdown.push({ label: "Curriculum", value: Math.round((curriculumPoints / WEIGHTS.curriculum) * 100) });

  // Budget fit
  let budgetPoints = WEIGHTS.budget * 0.5;
  const budget = Number(answers.budget) || 0;
  const min = Number(school.tuition_min) || 0;
  const max = Number(school.tuition_max) || min;
  if (budget > 0) {
    if (max && max <= budget) {
      budgetPoints = WEIGHTS.budget;
      reasons.push("Tuition sits comfortably inside your budget");
    } else if (min && min <= budget) {
      budgetPoints = WEIGHTS.budget * 0.7;
      reasons.push("Entry tuition fits your budget band");
    } else {
      const gap = min ? Math.min(1, budget / min) : 0;
      budgetPoints = WEIGHTS.budget * 0.35 * gap;
      reasons.push("Tuition is above your stated budget");
    }
  }
  score += budgetPoints;
  breakdown.push({ label: "Affordability", value: Math.round((budgetPoints / WEIGHTS.budget) * 100) });

  // Distance
  const km = answers.origin ? distanceToSchool(school, answers.origin) : null;
  let distancePoints = WEIGHTS.distance * 0.6;
  if (km !== null) {
    const radius = Number(answers.radiusKm) || 25;
    if (km <= radius) {
      const closeness = 1 - Math.min(1, km / radius) * 0.5;
      distancePoints = WEIGHTS.distance * closeness;
      reasons.push(`${km < 10 ? km.toFixed(1) : Math.round(km)} km from you, inside your radius`);
    } else {
      distancePoints = WEIGHTS.distance * 0.15;
      reasons.push(`Outside your ${radius} km radius`);
    }
  } else if (schoolCoords(school)) {
    distancePoints = WEIGHTS.distance * 0.6;
  }
  score += distancePoints;
  breakdown.push({ label: "Location", value: Math.round((distancePoints / WEIGHTS.distance) * 100) });

  // Learning style
  const styleHits = overlap(answers.learningStyles, school.learning_styles);
  let learningPoints = WEIGHTS.learning * 0.35;
  if (styleHits.length) {
    learningPoints = WEIGHTS.learning * Math.min(1, 0.55 + styleHits.length * 0.2);
    reasons.push(`Teaching style matches ${styleHits[0].toLowerCase()}`);
  }
  score += learningPoints;
  breakdown.push({ label: "Learning style", value: Math.round((learningPoints / WEIGHTS.learning) * 100) });

  // Interests / extracurriculars
  const interestHits = overlap(answers.interests, school.extracurriculars);
  let interestPoints = WEIGHTS.interests * 0.35;
  if (interestHits.length) {
    interestPoints = WEIGHTS.interests * Math.min(1, 0.5 + interestHits.length * 0.2);
    reasons.push(`Strong ${interestHits.slice(0, 2).join(" & ").toLowerCase()} programme`);
  }
  score += interestPoints;
  breakdown.push({ label: "Interests", value: Math.round((interestPoints / WEIGHTS.interests) * 100) });

  if (school.scholarship_available && answers.budget && max > budget) {
    reasons.push("Scholarships available to close the gap");
  }

  return {
    schoolId: school.id,
    score: Math.max(12, Math.min(99, Math.round(score))),
    breakdown,
    reasons: reasons.slice(0, 3),
    distanceKm: km,
  };
}

export function rankSchools(schools, answers) {
  return (schools || [])
    .map((school) => ({ school, ...matchSchool(school, answers) }))
    .sort((a, b) => b.score - a.score);
}