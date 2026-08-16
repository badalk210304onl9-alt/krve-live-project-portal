export type StudentEvaluation = {
  taskQuality: number;
  timeliness: number;
  initiative: number;
  teamwork: number;
  businessImpact: number;
  finalPresentation: number;
  totalScore: number;

  grade?: string | null;
  evaluatorName?: string | null;
  remarks?: string | null;
};

export type StudentProfile = {
  id: string;

  applicationNumber: string;

  fullName: string;

  email: string;

  phone?: string | null;

  college?: string | null;

  course?: string | null;

  yearSemester?: string | null;

  status: string;

  projectCode?: string | null;

  assignedDepartment?: string | null;

  projectTitle?: string | null;

  coordinatorName?: string | null;

  startDate?: string | null;

  endDate?: string | null;

  referralCode?: string | null;

  evaluation?: StudentEvaluation | null;

  certificateId?: string | null;

  certificateIssueDate?: string | null;
};

export type StudentTask = {
  id: string;

  applicationId: string;

  weekNumber: number;

  title: string;

  description?: string | null;

  priority?: string | null;

  dueDate?: string | null;

  status: string;

  score?: number | null;

  reviewerComment?: string | null;

  submissionUrl?: string | null;

  submissionSummary?: string | null;

  studentRemarks?: string | null;

  submittedAt?: string | null;

  createdAt?: string | null;

  updatedAt?: string | null;
};

export type StudentPortalSummary = {
  assignedTasks: number;

  submittedTasks: number;

  approvedTasks: number;

  pendingTasks: number;
};

export type StudentPortalData = {
  student: StudentProfile;

  tasks: StudentTask[];

  summary: StudentPortalSummary;
};

export type StudentCredentials = {
  applicationNumber: string;

  email: string;

  phone: string;
};
