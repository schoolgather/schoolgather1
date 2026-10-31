export const CURRICULA = ["IB", "British", "American", "National", "French", "Other"];

export const APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
  "ENROLLED",
];

export const STATUS_META = {
  DRAFT: { label: "Draft", dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "Submitted", dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  UNDER_REVIEW: { label: "Under review", dot: "bg-chart-4", chip: "bg-chart-4/15 text-chart-4" },
  INTERVIEW: { label: "Interview", dot: "bg-chart-2", chip: "bg-accent/20 text-accent-foreground" },
  ACCEPTED: { label: "Accepted", dot: "bg-chart-3", chip: "bg-chart-3/15 text-chart-3" },
  REJECTED: { label: "Not selected", dot: "bg-destructive", chip: "bg-destructive/10 text-destructive" },
  ENROLLED: { label: "Enrolled", dot: "bg-chart-3", chip: "bg-chart-3/20 text-chart-3" },
};

export const GRADES = [
  "Pre-K",
  "Kindergarten",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export const ACADEMIC_YEARS = ["2026–2027", "2027–2028", "2028–2029"];

export const LEARNING_STYLES = [
  "Structured & academic",
  "Creative & project-based",
  "Hands-on & practical",
  "Discussion & seminar led",
  "Independent & self-paced",
  "Sports & movement focused",
];

export const INTERESTS = [
  "STEM & robotics",
  "Visual arts",
  "Music & performing arts",
  "Competitive sports",
  "Languages",
  "Debate & Model UN",
  "Entrepreneurship",
  "Community service",
  "Outdoor education",
  "Coding & AI",
];

export const DOCUMENT_KINDS = [
  "Transcript",
  "Birth certificate",
  "Passport / ID",
  "Recommendation letter",
  "Assessment report",
  "Other",
];