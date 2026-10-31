import { distanceToSchool } from "@/lib/geo";

/**
 * Score a school against student/family preferences.
 * Returns an integer percentage from 30 to 99.
 */
export function scoreSchool(school, answers = {}) {
  if (!school) return 50;
  let score = 55;

  // 1. Curriculum match (+20 or -10)
  if (answers.curriculum && answers.curriculum !== "Any") {
    if (school.curriculum_type === answers.curriculum) {
      score += 20;
    } else {
      score -= 10;
    }
  } else {
    score += 10;
  }

  // 2. Budget match (+15 or penalty)
  if (answers.maxTuition && Number(answers.maxTuition) > 0) {
    const minTuition = Number(school.tuition_min) || 0;
    if (minTuition <= Number(answers.maxTuition)) {
      score += 15;
    } else {
      const overRatio = (minTuition - Number(answers.maxTuition)) / Number(answers.maxTuition);
      score -= Math.min(25, Math.round(overRatio * 20));
    }
  } else {
    score += 5;
  }

  // 3. Learning style match (+15)
  if (answers.learningStyles?.length > 0 && school.learning_styles?.length > 0) {
    const matches = answers.learningStyles.filter((style) =>
      school.learning_styles.includes(style)
    );
    score += Math.round((matches.length / answers.learningStyles.length) * 15);
  }

  // 4. Interests / Extracurriculars (+15)
  if (answers.interests?.length > 0) {
    const schoolActivities = [
      ...(school.extracurriculars || []),
      ...(school.programs || []),
      ...(school.facilities || []),
    ];
    const matches = answers.interests.filter((interest) =>
      schoolActivities.some((act) => act.toLowerCase().includes(interest.toLowerCase()))
    );
    score += Math.min(15, matches.length * 4);
  }

  // 5. Grade match (+5)
  if (answers.grade) {
    if (!school.grades_offered || school.grades_offered.includes(answers.grade)) {
      score += 5;
    }
  }

  // 6. Proximity / Location match
  if (answers.origin && answers.radiusKm) {
    const dist = distanceToSchool(school, answers.origin);
    if (dist !== null) {
      if (dist <= answers.radiusKm) {
        score += 8;
      } else {
        score -= 12;
      }
    }
  }

  // 7. Scholarship match
  if (answers.needsScholarship && school.scholarship_available) {
    score += 8;
  }

  return Math.min(99, Math.max(35, Math.round(score)));
}

/**
 * Return friendly reasons why this school matches the student
 */
export function explainMatch(school, answers = {}) {
  const reasons = [];

  if (answers.curriculum && answers.curriculum !== "Any" && school.curriculum_type === answers.curriculum) {
    reasons.push(`Offers your preferred ${school.curriculum_type} curriculum framework`);
  }

  if (answers.maxTuition && Number(answers.maxTuition) > 0) {
    const minTuition = Number(school.tuition_min) || 0;
    if (minTuition <= Number(answers.maxTuition)) {
      reasons.push(`Tuition aligns comfortably within your target budget`);
    }
  }

  if (answers.learningStyles?.length > 0 && school.learning_styles?.length > 0) {
    const matchedStyles = answers.learningStyles.filter((s) => school.learning_styles.includes(s));
    if (matchedStyles.length > 0) {
      reasons.push(`Nurtures ${matchedStyles.slice(0, 2).join(" and ")}`);
    }
  }

  if (answers.interests?.length > 0) {
    const matched = answers.interests.filter((i) =>
      (school.extracurriculars || []).concat(school.programs || []).some((act) =>
        act.toLowerCase().includes(i.toLowerCase())
      )
    );
    if (matched.length > 0) {
      reasons.push(`Strong programs in ${matched.slice(0, 2).join(", ")}`);
    }
  }

  if (reasons.length === 0) {
    if (school.scholarship_available) {
      reasons.push("Merit and financial aid scholarships available");
    }
    if (school.rating >= 4.8) {
      reasons.push("Exceptionally high parent and student satisfaction rating");
    } else {
      reasons.push(`Renowned for holistic ${school.curriculum_type} education`);
    }
  }

  return reasons.slice(0, 3);
}
