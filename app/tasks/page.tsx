"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
  Search,
  Send,
  Target,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import type {
  StudentCredentials,
  StudentPortalData,
} from "@/lib/portal-types";

/* =========================================================
   TYPES
========================================================= */

type SessionData = {
  credentials: StudentCredentials;
  portal: StudentPortalData;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: StudentPortalData;
  student?: StudentPortalData["student"];
  tasks?: StudentPortalData["tasks"];
  summary?: StudentPortalData["summary"];
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type PortalTask =
  StudentPortalData["tasks"][number] & {
    score?: number | null;
    reviewerComment?: string | null;
    submissionUrl?: string | null;
    submissionSummary?: string | null;
    studentRemarks?: string | null;
    submittedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };

type FilterStatus =
  | "all"
  | "pending"
  | "submitted"
  | "revision"
  | "approved";

type SubmitForm = {
  submissionUrl: string;
  submissionSummary: string;
  studentRemarks: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const SESSION_KEY =
  "krve-live-project-student-session";

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Project",
    href: "/project",
    icon: BookOpen,
  },
  {
    label: "Weekly Tasks",
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    label: "My Submissions",
    href: "/submissions",
    icon: FileCheck2,
  },
  {
    label: "Feedback",
    href: "/feedback",
    icon: MessageSquareText,
  },
  {
    label: "Performance",
    href: "/performance",
    icon: BarChart3,
  },
  {
    label: "Sales & Impact",
    href: "/sales",
    icon: BriefcaseBusiness,
  },
  {
    label: "Certificate",
    href: "/certificate",
    icon: Award,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

const emptySubmitForm: SubmitForm = {
  submissionUrl: "",
  submissionSummary: "",
  studentRemarks: "",
};

/* =========================================================
   HELPERS
========================================================= */

function extractPortalData(
  response: ApiResponse,
): StudentPortalData | null {
  if (response.data?.student) {
    return response.data;
  }

  if (
    response.student &&
    response.tasks &&
    response.summary
  ) {
    return {
      student: response.student,
      tasks: response.tasks,
      summary: response.summary,
    };
  }

  return null;
}

function normalizeStatus(
  value?: string | null,
) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function statusLabel(
  value?: string | null,
) {
  const normalized =
    String(value || "")
      .replace(/_/g, " ")
      .trim();

  if (!normalized) {
    return "Pending";
  }

  return normalized.replace(
    /\b\w/g,
    (letter) =>
      letter.toUpperCase(),
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "Not assigned";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value?: string | null,
) {
  if (!value) {
    return "Not submitted";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getStatusClass(
  value?: string | null,
) {
  const status =
    normalizeStatus(value);

  if (status === "approved") {
    return "approved";
  }

  if (
    status === "submitted" ||
    status === "under_review"
  ) {
    return "submitted";
  }

  if (
    status ===
    "revision_requested"
  ) {
    return "revision";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "pending";
}

function getPriorityClass(
  value?: string | null,
) {
  const priority =
    normalizeStatus(value);

  if (priority === "high") {
    return "high";
  }

  if (priority === "low") {
    return "low";
  }

  return "medium";
}

function dueInfo(
  task: PortalTask,
) {
  if (
    normalizeStatus(task.status) ===
    "approved"
  ) {
    return {
      label: "Completed",
      className: "complete",
    };
  }

  if (!task.dueDate) {
    return {
      label: "No deadline",
      className: "neutral",
    };
  }

  const due =
    new Date(task.dueDate);

  if (
    Number.isNaN(
      due.getTime(),
    )
  ) {
    return {
      label: task.dueDate,
      className: "neutral",
    };
  }

  due.setHours(
    23,
    59,
    59,
    999,
  );

  const now =
    new Date();

  const days =
    Math.ceil(
      (due.getTime() -
        now.getTime()) /
        86400000,
    );

  if (days < 0) {
    const count =
      Math.abs(days);

    return {
      label: `${count} day${
        count === 1 ? "" : "s"
      } overdue`,
      className: "overdue",
    };
  }

  if (days === 0) {
    return {
      label: "Due today",
      className: "urgent",
    };
  }

  if (days <= 2) {
    return {
      label: `${days} day${
        days === 1 ? "" : "s"
      } left`,
      className: "urgent",
    };
  }

  return {
    label: `${days} days left`,
    className: "normal",
  };
}

function filterBucket(
  task: PortalTask,
): Exclude<FilterStatus, "all"> {
  const status =
    normalizeStatus(task.status);

  if (status === "approved") {
    return "approved";
  }

  if (
    status ===
    "revision_requested"
  ) {
    return "revision";
  }

  if (
    status === "submitted" ||
    status === "under_review"
  ) {
    return "submitted";
  }

  return "pending";
}

function isValidHttpUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function TasksPage() {
  const [
    session,
    setSession,
  ] =
    useState<SessionData | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<FilterStatus>(
      "all",
    );

  const [
    expandedTaskId,
    setExpandedTaskId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    submitTask,
    setSubmitTask,
  ] =
    useState<PortalTask | null>(
      null,
    );

  const [
    submitForm,
    setSubmitForm,
  ] =
    useState<SubmitForm>(
      emptySubmitForm,
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    submitError,
    setSubmitError,
  ] =
    useState("");

  /* =======================================================
     SESSION LOAD
  ======================================================= */

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(
          SESSION_KEY,
        );

      if (!stored) {
        window.location.replace(
          "/",
        );

        return;
      }

      const parsed =
        JSON.parse(
          stored,
        ) as SessionData;

      if (
        !parsed.credentials ||
        !parsed.portal?.student
      ) {
        window.localStorage.removeItem(
          SESSION_KEY,
        );

        window.location.replace(
          "/",
        );

        return;
      }

      setSession(
        parsed,
      );

      void refreshPortal(
        parsed.credentials,
        false,
      );
    } catch {
      window.localStorage.removeItem(
        SESSION_KEY,
      );

      window.location.replace(
        "/",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshPortal(
    credentials:
      StudentCredentials,
    showLoader = true,
  ) {
    if (showLoader) {
      setRefreshing(
        true,
      );
    }

    setError("");

    try {
      const response =
        await fetch(
          "/api/portal",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action: "login",

                applicationNumber:
                  credentials.applicationNumber,

                email:
                  credentials.email,

                phone:
                  credentials.phone,
              }),

            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to refresh tasks.",
        );
      }

      const portal =
        extractPortalData(
          data,
        );

      if (!portal) {
        throw new Error(
          "Portal data was not returned.",
        );
      }

      const nextSession:
        SessionData = {
        credentials,
        portal,
      };

      setSession(
        nextSession,
      );

      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(
          nextSession,
        ),
      );
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh tasks.",
      );
    } finally {
      setRefreshing(
        false,
      );
    }
  }

  /* =======================================================
     OPEN SUBMISSION
  ======================================================= */

  function openSubmission(
    task: PortalTask,
  ) {
    setSubmitTask(task);

    setSubmitForm({
      submissionUrl:
        task.submissionUrl || "",

      submissionSummary:
        task.submissionSummary || "",

      studentRemarks:
        task.studentRemarks || "",
    });

    setSubmitError("");
    setSuccess("");
  }

  function closeSubmission() {
    if (submitting) {
      return;
    }

    setSubmitTask(null);
    setSubmitForm(
      emptySubmitForm,
    );
    setSubmitError("");
  }

  /* =======================================================
     SUBMIT WORK
  ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !session ||
      !submitTask
    ) {
      return;
    }

    const submissionUrl =
      submitForm.submissionUrl.trim();

    const submissionSummary =
      submitForm.submissionSummary.trim();

    const studentRemarks =
      submitForm.studentRemarks.trim();

    if (!submissionUrl) {
      setSubmitError(
        "Please add your submission link.",
      );

      return;
    }

    if (
      !isValidHttpUrl(
        submissionUrl,
      )
    ) {
      setSubmitError(
        "Please enter a valid http or https submission link.",
      );

      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/portal",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action: "submit",

                applicationNumber:
                  session.credentials
                    .applicationNumber,

                email:
                  session.credentials
                    .email,

                phone:
                  session.credentials
                    .phone,

                taskId:
                  submitTask.id,

                submissionUrl,

                submissionSummary,

                studentRemarks,
              }),

            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as {
          success?: boolean;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit your work.",
        );
      }

      await refreshPortal(
        session.credentials,
        false,
      );

      setSuccess(
        submitTask.submissionUrl
          ? "Submission updated successfully. Your evaluator can now review the latest version."
          : "Work submitted successfully. It is now available to the KEOS evaluator.",
      );

      setSubmitTask(null);

      setSubmitForm(
        emptySubmitForm,
      );
    } catch (submissionError) {
      setSubmitError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your work.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function logout() {
    window.localStorage.removeItem(
      SESSION_KEY,
    );

    window.location.replace(
      "/",
    );
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const portal =
    session?.portal;

  const tasks =
    useMemo(() => {
      if (!portal) {
        return [];
      }

      return (
        portal.tasks as PortalTask[]
      )
        .slice()
        .sort(
          (a, b) =>
            Number(
              a.weekNumber || 0,
            ) -
            Number(
              b.weekNumber || 0,
            ),
        );
    }, [portal]);

  const filteredTasks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          const bucket =
            filterBucket(task);

          const matchesFilter =
            filter === "all" ||
            bucket === filter;

          const matchesSearch =
            !query ||
            String(
              task.title || "",
            )
              .toLowerCase()
              .includes(query) ||
            String(
              task.description || "",
            )
              .toLowerCase()
              .includes(query) ||
            String(
              task.weekNumber || "",
            ).includes(query);

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      tasks,
      filter,
      search,
    ]);

  const counts =
    useMemo(() => {
      return {
        all: tasks.length,

        pending:
          tasks.filter(
            (task) =>
              filterBucket(task) ===
              "pending",
          ).length,

        submitted:
          tasks.filter(
            (task) =>
              filterBucket(task) ===
              "submitted",
          ).length,

        revision:
          tasks.filter(
            (task) =>
              filterBucket(task) ===
              "revision",
          ).length,

        approved:
          tasks.filter(
            (task) =>
              filterBucket(task) ===
              "approved",
          ).length,
      };
    }, [tasks]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session ||
    !portal
  ) {
    return (
      <main className="tasks-loading">
        <div className="loading-logo">
          KRVÉ
        </div>

        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading weekly
          assignments...
        </span>

        <style jsx global>{`
          html,
          body {
            margin: 0;
            background: #f4f7fb;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .tasks-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .loading-logo {
            color: #0b2c71;
            font-size: 23px;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          .tasks-loading span {
            color: #8793a4;
            font-size: 11px;
          }

          .spin {
            animation:
              spin 0.8s linear
              infinite;
          }

          @keyframes spin {
            to {
              transform:
                rotate(360deg);
            }
          }
        `}</style>
      </main>
    );
  }

  const {
    student,
  } = portal;

  const projectActive =
    normalizeStatus(
      student.status,
    ) === "active";

  return (
    <main className="tasks-page">
      {/* ===================================================
          MOBILE HEADER
      =================================================== */}

      <header className="mobile-header">
        <div>
          <strong>
            KRVÉ
          </strong>

          <span>
            LIVE PROJECT PORTAL
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              true,
            )
          }
          aria-label="Open menu"
        >
          <Menu size={21} />
        </button>
      </header>

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`sidebar ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-logo">
            K
          </div>

          <div>
            <strong>
              KRVÉ
            </strong>

            <span>
              LIVE PROJECT PORTAL
            </span>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() =>
              setMobileMenuOpen(
                false,
              )
            }
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <a
          href="/profile"
          className="student-mini"
        >
          <div className="avatar">
            {student.fullName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {student.fullName}
            </strong>

            <span>
              {student.assignedDepartment ||
                "Live Project Student"}
            </span>
          </div>
        </a>

        <div className="nav-heading">
          WORKSPACE
        </div>

        <nav>
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <a
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={
                    item.href ===
                    "/tasks"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setMobileMenuOpen(
                      false,
                    )
                  }
                >
                  <Icon
                    size={17}
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </a>
              );
            },
          )}
        </nav>

        <div className="sidebar-bottom">
          <span>
            APPLICATION ID
          </span>

          <strong
            title={
              student.applicationNumber
            }
          >
            {
              student.applicationNumber
            }
          </strong>

          <button
            type="button"
            onClick={
              logout
            }
          >
            <LogOut
              size={16}
            />

            Sign Out
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="overlay"
          onClick={() =>
            setMobileMenuOpen(
              false,
            )
          }
          aria-label="Close navigation"
        />
      )}

      {/* ===================================================
          MAIN
      =================================================== */}

      <section className="main-content">
        <header className="page-header">
          <div>
            <a
              href="/dashboard"
              className="back-link"
            >
              <ArrowLeft
                size={14}
              />

              Dashboard
            </a>

            <p>
              PROJECT EXECUTION
            </p>

            <h1>
              Weekly Tasks
            </h1>

            <span>
              View assignments,
              deadlines, submit
              work and respond to
              evaluator revisions.
            </span>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() =>
              refreshPortal(
                session.credentials,
              )
            }
            disabled={
              refreshing
            }
          >
            <RefreshCcw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </button>
        </header>

        {error && (
          <Notice
            tone="error"
            icon={
              <AlertCircle
                size={18}
              />
            }
            title="Unable to refresh tasks"
            text={error}
          />
        )}

        {success && (
          <Notice
            tone="success"
            icon={
              <CheckCircle2
                size={18}
              />
            }
            title="Submission saved"
            text={success}
          />
        )}

        {!projectActive && (
          <Notice
            tone="warning"
            icon={
              <AlertCircle
                size={18}
              />
            }
            title="Project is not active"
            text="You can view assignments, but new task submissions are available only while your Live Project status is Active."
          />
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="tasks-hero">
          <div>
            <p>
              CURRENT PROJECT
            </p>

            <h2>
              {student.projectTitle ||
                "Live Business Project"}
            </h2>

            <div className="hero-meta">
              <span>
                {student.assignedDepartment ||
                  "Department"}
              </span>

              <i />

              <span>
                {student.projectCode ||
                  "Project code pending"}
              </span>
            </div>
          </div>

          <div className="hero-summary">
            <div>
              <span>
                ASSIGNED
              </span>

              <strong>
                {counts.all}
              </strong>
            </div>

            <div>
              <span>
                SUBMITTED
              </span>

              <strong>
                {counts.submitted}
              </strong>
            </div>

            <div>
              <span>
                REVISION
              </span>

              <strong>
                {counts.revision}
              </strong>
            </div>

            <div>
              <span>
                APPROVED
              </span>

              <strong>
                {counts.approved}
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="task-controls">
          <div className="search-box">
            <Search
              size={16}
            />

            <input
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search tasks..."
            />
          </div>

          <div className="filter-tabs">
            {(
              [
                [
                  "all",
                  "All",
                  counts.all,
                ],
                [
                  "pending",
                  "Pending",
                  counts.pending,
                ],
                [
                  "submitted",
                  "Submitted",
                  counts.submitted,
                ],
                [
                  "revision",
                  "Revision",
                  counts.revision,
                ],
                [
                  "approved",
                  "Approved",
                  counts.approved,
                ],
              ] as Array<
                [
                  FilterStatus,
                  string,
                  number,
                ]
              >
            ).map(
              ([
                value,
                label,
                count,
              ]) => (
                <button
                  type="button"
                  key={value}
                  className={
                    filter ===
                    value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      value,
                    )
                  }
                >
                  {label}

                  <span>
                    {count}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {/* =================================================
            TASK LIST
        ================================================= */}

        <section className="task-list">
          {filteredTasks.length ===
          0 ? (
            <div className="empty-state">
              <div>
                <ClipboardList
                  size={28}
                />
              </div>

              <h3>
                {tasks.length ===
                0
                  ? "No weekly tasks assigned yet"
                  : "No tasks match this filter"}
              </h3>

              <p>
                {tasks.length ===
                0
                  ? "When the KRVÉ project team assigns a task in KEOS, it will automatically appear here after refresh."
                  : "Try another status filter or clear your search."}
              </p>

              {tasks.length ===
              0 ? (
                <button
                  type="button"
                  onClick={() =>
                    refreshPortal(
                      session.credentials,
                    )
                  }
                >
                  <RefreshCcw
                    size={15}
                  />

                  Check for Tasks
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter(
                      "all",
                    );
                  }}
                >
                  <Filter
                    size={15}
                  />

                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map(
              (task) => {
                const due =
                  dueInfo(task);

                const status =
                  normalizeStatus(
                    task.status,
                  );

                const expanded =
                  expandedTaskId ===
                  task.id;

                const canSubmit =
                  projectActive &&
                  status !==
                    "approved";

                const hasSubmission =
                  Boolean(
                    task.submissionUrl,
                  );

                return (
                  <article
                    key={task.id}
                    className={`task-card ${
                      expanded
                        ? "expanded"
                        : ""
                    }`}
                  >
                    <div className="task-card-main">
                      <div className="week-box">
                        <span>
                          WEEK
                        </span>

                        <strong>
                          {
                            task.weekNumber
                          }
                        </strong>
                      </div>

                      <div className="task-copy">
                        <div className="task-title-row">
                          <h3>
                            {
                              task.title
                            }
                          </h3>

                          <span
                            className={`priority ${getPriorityClass(
                              task.priority,
                            )}`}
                          >
                            {statusLabel(
                              task.priority ||
                                "medium",
                            )}
                          </span>
                        </div>

                        <div className="task-meta">
                          <span>
                            <CalendarDays
                              size={13}
                            />

                            Due{" "}
                            {formatDate(
                              task.dueDate,
                            )}
                          </span>

                          <span
                            className={`due-badge ${due.className}`}
                          >
                            <Clock3
                              size={12}
                            />

                            {
                              due.label
                            }
                          </span>

                          <span
                            className={`status-badge ${getStatusClass(
                              task.status,
                            )}`}
                          >
                            {statusLabel(
                              task.status,
                            )}
                          </span>
                        </div>

                        {task.description && (
                          <p className="task-description-preview">
                            {
                              task.description
                            }
                          </p>
                        )}
                      </div>

                      <div className="task-actions">
                        {canSubmit && (
                          <button
                            type="button"
                            className="primary-action"
                            onClick={() =>
                              openSubmission(
                                task,
                              )
                            }
                          >
                            <Send
                              size={15}
                            />

                            {hasSubmission
                              ? "Update Work"
                              : status ===
                                "revision_requested"
                              ? "Resubmit"
                              : "Submit Work"}
                          </button>
                        )}

                        {status ===
                          "approved" && (
                          <a
                            href="/feedback"
                            className="approved-action"
                          >
                            <CheckCircle2
                              size={15}
                            />

                            View Result
                          </a>
                        )}

                        <button
                          type="button"
                          className="expand-action"
                          onClick={() =>
                            setExpandedTaskId(
                              expanded
                                ? null
                                : task.id,
                            )
                          }
                        >
                          {expanded
                            ? "Hide Details"
                            : "View Details"}

                          <ChevronDown
                            size={15}
                            className={
                              expanded
                                ? "rotate"
                                : ""
                            }
                          />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="task-details">
                        <section className="detail-section">
                          <div className="detail-heading">
                            <FileText
                              size={18}
                            />

                            <div>
                              <span>
                                TASK BRIEF
                              </span>

                              <strong>
                                Assignment
                                Instructions
                              </strong>
                            </div>
                          </div>

                          <p>
                            {task.description ||
                              "No additional task description was provided."}
                          </p>
                        </section>

                        {task.reviewerComment && (
                          <section className="detail-section reviewer-section">
                            <div className="detail-heading">
                              <MessageSquareText
                                size={18}
                              />

                              <div>
                                <span>
                                  EVALUATOR
                                  FEEDBACK
                                </span>

                                <strong>
                                  Review
                                  Comment
                                </strong>
                              </div>
                            </div>

                            <p>
                              {
                                task.reviewerComment
                              }
                            </p>
                          </section>
                        )}

                        {hasSubmission && (
                          <section className="detail-section submission-section">
                            <div className="detail-heading">
                              <FileCheck2
                                size={18}
                              />

                              <div>
                                <span>
                                  YOUR
                                  SUBMISSION
                                </span>

                                <strong>
                                  Submitted
                                  Work
                                </strong>
                              </div>
                            </div>

                            <div className="submission-info">
                              <a
                                href={
                                  task.submissionUrl ||
                                  "#"
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Link2
                                  size={15}
                                />

                                Open
                                Submitted
                                Work

                                <ExternalLink
                                  size={13}
                                />
                              </a>

                              <div>
                                <span>
                                  SUBMITTED
                                </span>

                                <strong>
                                  {formatDateTime(
                                    task.submittedAt,
                                  )}
                                </strong>
                              </div>

                              {task.score !==
                                null &&
                                task.score !==
                                  undefined && (
                                  <div>
                                    <span>
                                      SCORE
                                    </span>

                                    <strong>
                                      {
                                        task.score
                                      }
                                    </strong>
                                  </div>
                                )}
                            </div>

                            {task.submissionSummary && (
                              <div className="saved-text">
                                <span>
                                  SUBMISSION
                                  SUMMARY
                                </span>

                                <p>
                                  {
                                    task.submissionSummary
                                  }
                                </p>
                              </div>
                            )}

                            {task.studentRemarks && (
                              <div className="saved-text">
                                <span>
                                  YOUR REMARKS
                                </span>

                                <p>
                                  {
                                    task.studentRemarks
                                  }
                                </p>
                              </div>
                            )}
                          </section>
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )
          )}
        </section>

        {/* =================================================
            HELP CARD
        ================================================= */}

        <section className="submission-guide">
          <div>
            <Link2
              size={21}
            />
          </div>

          <div>
            <p>
              SUBMISSION GUIDE
            </p>

            <h3>
              Submit a reviewer-accessible
              work link.
            </h3>

            <span>
              Google Drive, Google Docs,
              Sheets, Canva, OneDrive or
              another HTTPS link can be used.
              Make sure the evaluator has
              permission to open it.
            </span>
          </div>

          <a href="/submissions">
            Submission History

            <ChevronRight
              size={15}
            />
          </a>
        </section>
      </section>

      {/* ===================================================
          SUBMISSION MODAL
      =================================================== */}

      {submitTask && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSubmission();
            }
          }}
        >
          <section
            className="submission-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Submit task work"
          >
            <header className="modal-header">
              <div>
                <p>
                  WEEK{" "}
                  {
                    submitTask.weekNumber
                  }
                </p>

                <h2>
                  {submitTask.submissionUrl
                    ? "Update Submission"
                    : "Submit Your Work"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeSubmission
                }
                disabled={
                  submitting
                }
              >
                <X size={19} />
              </button>
            </header>

            <div className="modal-task">
              <div className="modal-week">
                {
                  submitTask.weekNumber
                }
              </div>

              <div>
                <strong>
                  {
                    submitTask.title
                  }
                </strong>

                <span>
                  Due{" "}
                  {formatDate(
                    submitTask.dueDate,
                  )}
                </span>
              </div>
            </div>

            {submitTask.reviewerComment &&
              normalizeStatus(
                submitTask.status,
              ) ===
                "revision_requested" && (
                <div className="revision-callout">
                  <MessageSquareText
                    size={18}
                  />

                  <div>
                    <strong>
                      Revision
                      requested
                    </strong>

                    <p>
                      {
                        submitTask.reviewerComment
                      }
                    </p>
                  </div>
                </div>
              )}

            <form
              onSubmit={
                handleSubmit
              }
            >
              <label>
                <span>
                  SUBMISSION LINK *
                </span>

                <div className="input-with-icon">
                  <Link2
                    size={16}
                  />

                  <input
                    type="url"
                    value={
                      submitForm.submissionUrl
                    }
                    onChange={(
                      event,
                    ) =>
                      setSubmitForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          submissionUrl:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="https://drive.google.com/..."
                    required
                  />
                </div>

                <small>
                  Make sure link sharing
                  allows the evaluator to
                  open your work.
                </small>
              </label>

              <label>
                <span>
                  SUBMISSION SUMMARY
                </span>

                <textarea
                  value={
                    submitForm.submissionSummary
                  }
                  onChange={(
                    event,
                  ) =>
                    setSubmitForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        submissionSummary:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  rows={5}
                  placeholder="Briefly explain what you completed, your approach and the main outcome."
                />

                <small>
                  A clear summary helps the
                  evaluator review your work
                  faster.
                </small>
              </label>

              <label>
                <span>
                  REMARKS / NOTES
                </span>

                <textarea
                  value={
                    submitForm.studentRemarks
                  }
                  onChange={(
                    event,
                  ) =>
                    setSubmitForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        studentRemarks:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  rows={3}
                  placeholder="Optional note for the evaluator."
                />
              </label>

              {submitError && (
                <div className="submit-error">
                  <AlertCircle
                    size={16}
                  />

                  {
                    submitError
                  }
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeSubmission
                  }
                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Send
                        size={16}
                      />

                      {submitTask.submissionUrl
                        ? "Update Submission"
                        : "Submit Work"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ===================================================
          CSS
      =================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #f4f7fb;
          color: #142039;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
        }

        a {
          color: inherit;
        }

        .tasks-page {
          min-height: 100vh;
        }

        /* SIDEBAR */

        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 500;
          display: flex;
          width: 265px;
          height: 100vh;
          flex-direction: column;
          border-right:
            1px solid #dfe5ed;
          background: #fff;
        }

        .sidebar-brand {
          display: flex;
          min-height: 84px;
          align-items: center;
          gap: 12px;
          padding: 0 22px;
          border-bottom:
            1px solid #edf1f5;
        }

        .brand-logo {
          display: grid;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          place-items: center;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #07183a,
              #123b8c
            );
          color: #fff;
          font-weight: 900;
        }

        .sidebar-brand strong {
          display: block;
          font-size: 16px;
          letter-spacing: 0.08em;
        }

        .sidebar-brand span {
          display: block;
          margin-top: 3px;
          color: #939fb0;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .mobile-close {
          display: none;
          margin-left: auto;
          border: 0;
          background: transparent;
        }

        .student-mini {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 17px;
          padding: 13px;
          border:
            1px solid #e4eaf2;
          border-radius: 13px;
          background: #f8faff;
          text-decoration: none;
        }

        .avatar {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          place-items: center;
          border-radius: 10px;
          background: #0b2c71;
          color: #fff;
          font-size: 13px;
          font-weight: 900;
        }

        .student-mini strong {
          display: block;
          max-width: 155px;
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .student-mini span {
          display: block;
          margin-top: 4px;
          color: #8c98a9;
          font-size: 9px;
        }

        .nav-heading {
          padding:
            7px 27px 10px;
          color: #a4adba;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .sidebar nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding: 0 13px 15px;
        }

        .sidebar nav a {
          display: flex;
          min-height: 45px;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          border-radius: 10px;
          color: #627086;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        .sidebar nav a:hover {
          background: #f3f6fb;
        }

        .sidebar nav a.active {
          background:
            linear-gradient(
              135deg,
              #09172f,
              #102e67
            );
          color: #fff;
        }

        .sidebar-bottom {
          padding: 16px;
          border-top:
            1px solid #edf1f5;
        }

        .sidebar-bottom > span {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
        }

        .sidebar-bottom > strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #47556c;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-bottom button {
          display: flex;
          width: 100%;
          height: 40px;
          align-items: center;
          gap: 9px;
          margin-top: 13px;
          padding: 0 12px;
          border:
            1px solid #dfe5ed;
          border-radius: 9px;
          background: #fff;
          color: #66748a;
          font-size: 9px;
        }

        /* MAIN */

        .main-content {
          min-height: 100vh;
          margin-left: 265px;
          padding:
            0 36px 55px;
        }

        .page-header {
          display: flex;
          min-height: 120px;
          align-items: center;
          justify-content:
            space-between;
          gap: 20px;
          border-bottom:
            1px solid #dfe5ed;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 8px;
          color: #718096;
          font-size: 9px;
          font-weight: 700;
          text-decoration: none;
        }

        .page-header p {
          margin: 0;
          color: #2959d1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .page-header h1 {
          margin:
            6px 0 5px;
          font-size: 27px;
        }

        .page-header > div > span {
          color: #8793a4;
          font-size: 9px;
        }

        .refresh-button {
          display: flex;
          height: 40px;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border:
            1px solid #dce3ed;
          border-radius: 9px;
          background: #fff;
          color: #52637b;
          font-size: 9px;
          font-weight: 800;
        }

        /* NOTICES */

        .notice {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 17px;
          padding: 14px;
          border-radius: 11px;
        }

        .notice strong {
          display: block;
          font-size: 9px;
        }

        .notice span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
          line-height: 1.55;
        }

        .notice.error {
          border:
            1px solid #ffd1d6;
          background: #fff3f4;
          color: #b63743;
        }

        .notice.success {
          border:
            1px solid #c7ead7;
          background: #f0fbf5;
          color: #24794d;
        }

        .notice.warning {
          border:
            1px solid #f0d59f;
          background: #fff9ed;
          color: #9b671d;
        }

        /* HERO */

        .tasks-hero {
          display: flex;
          min-height: 165px;
          align-items: center;
          justify-content:
            space-between;
          gap: 28px;
          margin-top: 25px;
          padding: 30px 34px;
          border-radius: 18px;
          background:
            radial-gradient(
              circle at 88% 18%,
              rgba(
                93,
                137,
                255,
                0.43
              ),
              transparent 27%
            ),
            linear-gradient(
              135deg,
              #061936,
              #0c3279
            );
          color: #fff;
        }

        .tasks-hero > div:first-child > p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .tasks-hero h2 {
          margin:
            9px 0 7px;
          font-size: 25px;
        }

        .hero-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          color:
            rgba(
              255,
              255,
              255,
              0.63
            );
          font-size: 9px;
        }

        .hero-meta i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background:
            rgba(
              255,
              255,
              255,
              0.35
            );
        }

        .hero-summary {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(
                80px,
                1fr
              )
            );
          gap: 8px;
          min-width: 430px;
        }

        .hero-summary > div {
          padding: 13px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.13
            );
          border-radius: 11px;
          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .hero-summary span {
          display: block;
          color: #afc1e9;
          font-size: 6px;
          font-weight: 900;
        }

        .hero-summary strong {
          display: block;
          margin-top: 5px;
          font-size: 20px;
        }

        /* CONTROLS */

        .task-controls {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 15px;
          margin-top: 17px;
          padding: 13px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
        }

        .search-box {
          display: flex;
          width: 270px;
          height: 39px;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
          border:
            1px solid #dfe5ed;
          border-radius: 9px;
          color: #8190a5;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #314158;
          font-size: 9px;
        }

        .filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .filter-tabs button {
          display: flex;
          min-height: 34px;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border:
            1px solid #e1e6ee;
          border-radius: 8px;
          background: #fff;
          color: #66758b;
          font-size: 8px;
          font-weight: 800;
        }

        .filter-tabs button span {
          display: grid;
          min-width: 18px;
          height: 18px;
          place-items: center;
          border-radius: 50px;
          background: #f0f3f7;
          font-size: 7px;
        }

        .filter-tabs button.active {
          border-color: #1747a6;
          background: #123c91;
          color: #fff;
        }

        .filter-tabs button.active span {
          background:
            rgba(
              255,
              255,
              255,
              0.16
            );
        }

        /* TASK LIST */

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 17px;
        }

        .task-card {
          overflow: hidden;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow:
            0 5px 20px
            rgba(
              17,
              44,
              85,
              0.035
            );
        }

        .task-card.expanded {
          border-color: #c4d3ec;
        }

        .task-card-main {
          display: grid;
          grid-template-columns:
            58px
            minmax(
              0,
              1fr
            )
            auto;
          align-items: start;
          gap: 16px;
          padding: 20px;
        }

        .week-box {
          display: grid;
          width: 54px;
          height: 58px;
          place-items: center;
          align-content: center;
          border-radius: 12px;
          background: #edf3ff;
          color: #2c5ccc;
        }

        .week-box span {
          font-size: 6px;
          font-weight: 900;
        }

        .week-box strong {
          margin-top: 3px;
          font-size: 19px;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .task-title-row h3 {
          margin: 0;
          color: #25344b;
          font-size: 14px;
        }

        .priority,
        .status-badge,
        .due-badge {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 40px;
          font-size: 7px;
          font-weight: 900;
        }

        .priority {
          text-transform: uppercase;
        }

        .priority.high {
          background: #fff0f1;
          color: #c33d49;
        }

        .priority.medium {
          background: #fff3df;
          color: #ba7217;
        }

        .priority.low {
          background: #eaf8f0;
          color: #248254;
        }

        .task-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .task-meta > span:first-child {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #7d899c;
          font-size: 8px;
        }

        .due-badge.normal,
        .due-badge.neutral {
          background: #f1f4f8;
          color: #66778e;
        }

        .due-badge.urgent {
          background: #fff3df;
          color: #b66f17;
        }

        .due-badge.overdue {
          background: #fff0f1;
          color: #bf3c49;
        }

        .due-badge.complete {
          background: #eaf8f0;
          color: #258452;
        }

        .status-badge.pending {
          background: #f1f4f8;
          color: #68778b;
        }

        .status-badge.submitted {
          background: #edf3ff;
          color: #2d5fd5;
        }

        .status-badge.revision {
          background: #fff3df;
          color: #b46c14;
        }

        .status-badge.approved {
          background: #eaf8f0;
          color: #20804f;
        }

        .status-badge.rejected {
          background: #fff0f1;
          color: #bd3b47;
        }

        .task-description-preview {
          display: -webkit-box;
          max-width: 800px;
          margin:
            10px 0 0;
          overflow: hidden;
          color: #7a8799;
          font-size: 9px;
          line-height: 1.6;
          -webkit-box-orient:
            vertical;
          -webkit-line-clamp: 2;
        }

        .task-actions {
          display: flex;
          min-width: 150px;
          align-items: stretch;
          flex-direction: column;
          gap: 6px;
        }

        .task-actions button,
        .task-actions a {
          display: flex;
          min-height: 35px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 10px;
          border-radius: 8px;
          font-size: 8px;
          font-weight: 800;
          text-decoration: none;
        }

        .primary-action {
          border: 0;
          background: #123f9a;
          color: #fff;
        }

        .approved-action {
          border:
            1px solid #bde3cf;
          background: #eefaf3;
          color: #247c4e;
        }

        .expand-action {
          border:
            1px solid #dce3ec;
          background: #fff;
          color: #5e6f86;
        }

        .expand-action svg {
          transition:
            transform
              0.18s ease;
        }

        .expand-action svg.rotate {
          transform:
            rotate(180deg);
        }

        /* EXPANDED DETAILS */

        .task-details {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap: 12px;
          padding:
            0 20px 20px 94px;
          border-top:
            1px solid #eef1f5;
          background: #fbfcfe;
        }

        .detail-section {
          margin-top: 16px;
          padding: 16px;
          border:
            1px solid #e2e7ef;
          border-radius: 11px;
          background: #fff;
        }

        .detail-section.submission-section {
          grid-column: 1 / -1;
        }

        .reviewer-section {
          border-color: #f0d49f;
          background: #fffaf1;
        }

        .detail-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #3e65aa;
        }

        .detail-heading span {
          display: block;
          color: #8a98aa;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .detail-heading strong {
          display: block;
          margin-top: 3px;
          color: #324058;
          font-size: 9px;
        }

        .detail-section > p {
          margin:
            12px 0 0;
          color: #657389;
          font-size: 9px;
          line-height: 1.75;
          white-space: pre-line;
        }

        .submission-info {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .submission-info a {
          display: inline-flex;
          min-height: 35px;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          border-radius: 8px;
          background: #123f9a;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          text-decoration: none;
        }

        .submission-info > div {
          min-width: 120px;
          padding: 9px 11px;
          border-radius: 8px;
          background: #f5f7fa;
        }

        .submission-info span,
        .saved-text > span {
          display: block;
          color: #98a3b4;
          font-size: 6px;
          font-weight: 900;
        }

        .submission-info strong {
          display: block;
          margin-top: 4px;
          color: #4a586d;
          font-size: 8px;
        }

        .saved-text {
          margin-top: 13px;
          padding-top: 12px;
          border-top:
            1px solid #edf0f4;
        }

        .saved-text p {
          margin:
            5px 0 0;
          color: #66758a;
          font-size: 9px;
          line-height: 1.6;
          white-space: pre-line;
        }

        /* EMPTY */

        .empty-state {
          display: flex;
          min-height: 315px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 30px;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
          text-align: center;
        }

        .empty-state > div {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border-radius: 15px;
          background: #edf3ff;
          color: #4b6da9;
        }

        .empty-state h3 {
          margin:
            15px 0 6px;
          font-size: 14px;
        }

        .empty-state p {
          max-width: 500px;
          margin: 0;
          color: #8793a4;
          font-size: 9px;
          line-height: 1.65;
        }

        .empty-state button {
          display: flex;
          min-height: 37px;
          align-items: center;
          gap: 6px;
          margin-top: 15px;
          padding: 0 12px;
          border:
            1px solid #d7e0ed;
          border-radius: 8px;
          background: #fff;
          color: #426199;
          font-size: 8px;
          font-weight: 800;
        }

        /* GUIDE */

        .submission-guide {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 14px;
          margin-top: 17px;
          padding: 18px;
          border:
            1px solid #d4e1f7;
          border-radius: 14px;
          background: #f7faff;
        }

        .submission-guide > div:first-child {
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border-radius: 11px;
          background: #e9f0ff;
          color: #2b5bd2;
        }

        .submission-guide p {
          margin: 0;
          color: #2b5acf;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .submission-guide h3 {
          margin:
            5px 0 4px;
          font-size: 12px;
        }

        .submission-guide span {
          color: #748197;
          font-size: 9px;
          line-height: 1.55;
        }

        .submission-guide a {
          display: flex;
          min-height: 36px;
          align-items: center;
          gap: 4px;
          padding: 0 11px;
          border-radius: 8px;
          background: #153f97;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          text-decoration: none;
        }

        /* MODAL */

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 20px;
          background:
            rgba(
              7,
              16,
              31,
              0.62
            );
          backdrop-filter:
            blur(4px);
        }

        .submission-modal {
          width:
            min(
              620px,
              100%
            );
          max-height:
            calc(
              100vh - 40px
            );
          overflow-y: auto;
          border-radius: 18px;
          background: #fff;
          box-shadow:
            0 28px 80px
            rgba(
              0,
              0,
              0,
              0.25
            );
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 20px;
          padding: 22px 24px;
          border-bottom:
            1px solid #e8ecf2;
        }

        .modal-header p {
          margin: 0;
          color: #2b5bd2;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .modal-header h2 {
          margin:
            5px 0 0;
          font-size: 19px;
        }

        .modal-header button {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border:
            1px solid #dfe5ed;
          border-radius: 9px;
          background: #fff;
          color: #64748a;
        }

        .modal-task {
          display: flex;
          align-items: center;
          gap: 11px;
          margin:
            18px 24px 0;
          padding: 13px;
          border-radius: 11px;
          background: #f6f9ff;
        }

        .modal-week {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 9px;
          background: #123f99;
          color: #fff;
          font-size: 12px;
          font-weight: 900;
        }

        .modal-task strong {
          display: block;
          color: #344158;
          font-size: 10px;
        }

        .modal-task span {
          display: block;
          margin-top: 4px;
          color: #8995a6;
          font-size: 8px;
        }

        .revision-callout {
          display: flex;
          gap: 10px;
          margin:
            12px 24px 0;
          padding: 13px;
          border:
            1px solid #efd49f;
          border-radius: 10px;
          background: #fff9ed;
          color: #a26b1f;
        }

        .revision-callout strong {
          display: block;
          font-size: 9px;
        }

        .revision-callout p {
          margin:
            4px 0 0;
          color: #886d45;
          font-size: 9px;
          line-height: 1.55;
        }

        .submission-modal form {
          display: flex;
          flex-direction: column;
          gap: 17px;
          padding: 22px 24px 24px;
        }

        .submission-modal label > span {
          display: block;
          margin-bottom: 7px;
          color: #69788e;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .submission-modal input,
        .submission-modal textarea {
          width: 100%;
          border:
            1px solid #dce3ec;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #314057;
          font-size: 10px;
          transition:
            border-color
              0.18s ease;
        }

        .submission-modal input:focus,
        .submission-modal textarea:focus {
          border-color: #3d68c4;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon svg {
          position: absolute;
          top: 50%;
          left: 12px;
          transform:
            translateY(-50%);
          color: #7f90aa;
        }

        .submission-modal input {
          height: 44px;
          padding: 0 12px 0 38px;
        }

        .submission-modal textarea {
          min-height: 90px;
          resize: vertical;
          padding: 11px 12px;
          line-height: 1.6;
        }

        .submission-modal label small {
          display: block;
          margin-top: 6px;
          color: #9aa5b5;
          font-size: 7px;
          line-height: 1.5;
        }

        .submit-error {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          padding: 11px;
          border:
            1px solid #ffd2d7;
          border-radius: 9px;
          background: #fff3f4;
          color: #b53541;
          font-size: 8px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          justify-content:
            flex-end;
          gap: 8px;
          padding-top: 3px;
        }

        .modal-actions button {
          display: flex;
          min-height: 40px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 14px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 800;
        }

        .cancel-button {
          border:
            1px solid #dce3ec;
          background: #fff;
          color: #64748a;
        }

        .submit-button {
          border: 0;
          background: #123f99;
          color: #fff;
        }

        .submit-button:disabled,
        .cancel-button:disabled {
          opacity: 0.55;
        }

        /* MOBILE */

        .mobile-header,
        .overlay {
          display: none;
        }

        .spin {
          animation:
            spin 0.8s linear
            infinite;
        }

        @keyframes spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          max-width: 1120px
        ) {
          .tasks-hero {
            align-items: stretch;
            flex-direction: column;
          }

          .hero-summary {
            min-width: 0;
          }

          .task-controls {
            align-items: stretch;
            flex-direction: column;
          }

          .search-box {
            width: 100%;
          }
        }

        @media (
          max-width: 820px
        ) {
          .mobile-header {
            position: sticky;
            top: 0;
            z-index: 450;
            display: flex;
            height: 62px;
            align-items: center;
            justify-content:
              space-between;
            padding: 0 18px;
            border-bottom:
              1px solid #dfe5ed;
            background:
              rgba(
                255,
                255,
                255,
                0.96
              );
          }

          .mobile-header strong {
            display: block;
            color: #0a2c6e;
            font-size: 16px;
            letter-spacing: 0.1em;
          }

          .mobile-header span {
            display: block;
            margin-top: 2px;
            color: #98a3b3;
            font-size: 6px;
            font-weight: 800;
            letter-spacing: 0.13em;
          }

          .mobile-header button {
            display: grid;
            width: 38px;
            height: 38px;
            place-items: center;
            border:
              1px solid #dce3ec;
            border-radius: 9px;
            background: #fff;
          }

          .sidebar {
            z-index: 1001;
            width: 280px;
            transform:
              translateX(-100%);
            transition:
              transform
              0.25s ease;
          }

          .sidebar.open {
            transform:
              translateX(0);
          }

          .mobile-close {
            display: grid;
            place-items: center;
          }

          .overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background:
              rgba(
                7,
                16,
                31,
                0.5
              );
          }

          .main-content {
            margin-left: 0;
            padding:
              0 17px 40px;
          }

          .task-card-main {
            grid-template-columns:
              52px 1fr;
          }

          .task-actions {
            grid-column:
              1 / -1;
            min-width: 0;
            flex-direction: row;
            padding-left: 68px;
          }

          .task-details {
            grid-template-columns:
              1fr;
            padding:
              0 20px 20px;
          }

          .detail-section.submission-section {
            grid-column: auto;
          }

          .submission-guide {
            grid-template-columns:
              auto 1fr;
          }

          .submission-guide a {
            grid-column:
              1 / -1;
            width: fit-content;
          }
        }

        @media (
          max-width: 560px
        ) {
          .hero-summary {
            grid-template-columns:
              1fr 1fr;
          }

          .filter-tabs {
            display: grid;
            grid-template-columns:
              1fr 1fr;
          }

          .task-card-main {
            grid-template-columns:
              1fr;
          }

          .week-box {
            width: 50px;
          }

          .task-actions {
            grid-column: auto;
            padding-left: 0;
            flex-direction: column;
          }

          .task-title-row {
            align-items:
              flex-start;
            flex-direction: column;
          }

          .page-header > div > span {
            display: block;
            max-width: 250px;
            line-height: 1.5;
          }

          .refresh-button {
            width: 41px;
            padding: 0;
            justify-content: center;
            font-size: 0;
          }

          .submission-modal {
            border-radius: 14px;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Notice({
  tone,
  icon,
  title,
  text,
}: {
  tone:
    | "error"
    | "success"
    | "warning";
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className={`notice ${tone}`}
    >
      {icon}

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {text}
        </span>
      </div>
    </div>
  );
}
