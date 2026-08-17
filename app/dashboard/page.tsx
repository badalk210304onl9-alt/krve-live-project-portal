"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
  Send,
  Target,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import type {
  StudentCredentials,
  StudentPortalData,
  StudentTask,
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

type DashboardStat = {
  label: string;
  value: string | number;
  note: string;
  href: string;
  icon: LucideIcon;
  tone:
    | "blue"
    | "purple"
    | "green"
    | "orange";
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

function formatRefreshTime(
  value: Date | null,
) {
  if (!value) {
    return "Not refreshed yet";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(value);
}

function getStatusClass(
  status?: string | null,
) {
  const value =
    normalizeStatus(status);

  if (
    [
      "approved",
      "completed",
      "active",
    ].includes(value)
  ) {
    return "success";
  }

  if (
    [
      "submitted",
      "under_review",
    ].includes(value)
  ) {
    return "review";
  }

  if (
    value ===
    "revision_requested"
  ) {
    return "warning";
  }

  if (
    value ===
    "rejected"
  ) {
    return "danger";
  }

  return "neutral";
}

function getPriorityClass(
  priority?: string | null,
) {
  const value =
    normalizeStatus(priority);

  if (value === "high") {
    return "high";
  }

  if (value === "low") {
    return "low";
  }

  return "medium";
}

function calculateTaskProgress(
  portal: StudentPortalData,
) {
  const assigned =
    Number(
      portal.summary.assignedTasks ||
        0,
    );

  const approved =
    Number(
      portal.summary.approvedTasks ||
        0,
    );

  if (assigned <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (approved / assigned) *
          100,
      ),
    ),
  );
}

function dueStatus(
  task: StudentTask,
) {
  if (
    normalizeStatus(
      task.status,
    ) === "approved"
  ) {
    return "Completed";
  }

  if (!task.dueDate) {
    return "No deadline";
  }

  const due =
    new Date(task.dueDate);

  if (
    Number.isNaN(
      due.getTime(),
    )
  ) {
    return "";
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
    const overdue =
      Math.abs(days);

    return `${overdue} day${
      overdue === 1
        ? ""
        : "s"
    } overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  return `${days} day${
    days === 1
      ? ""
      : "s"
  } left`;
}

function isPendingTask(
  task: StudentTask,
) {
  const status =
    normalizeStatus(
      task.status,
    );

  return ![
    "approved",
    "submitted",
    "under_review",
  ].includes(status);
}

function isRevisionTask(
  task: StudentTask,
) {
  return (
    normalizeStatus(
      task.status,
    ) ===
    "revision_requested"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DashboardPage() {
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
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(
      null,
    );

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

      setLastUpdated(
        new Date(),
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
     REFRESH PORTAL
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
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "login",

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
            "Unable to refresh portal data.",
        );
      }

      const portal =
        extractPortalData(
          data,
        );

      if (!portal) {
        throw new Error(
          "Student portal data was not returned.",
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

      setLastUpdated(
        new Date(),
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
          : "Unable to refresh portal.",
      );
    } finally {
      setRefreshing(
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

  const taskProgress =
    useMemo(() => {
      if (!portal) {
        return 0;
      }

      return calculateTaskProgress(
        portal,
      );
    }, [portal]);

  const recentTasks =
    useMemo(() => {
      if (!portal) {
        return [];
      }

      return [
        ...portal.tasks,
      ]
        .sort(
          (a, b) =>
            Number(
              b.weekNumber || 0,
            ) -
            Number(
              a.weekNumber || 0,
            ),
        )
        .slice(
          0,
          5,
        );
    }, [portal]);

  const pendingTasks =
    useMemo(() => {
      if (!portal) {
        return [];
      }

      return portal.tasks.filter(
        isPendingTask,
      );
    }, [portal]);

  const revisionTasks =
    useMemo(() => {
      if (!portal) {
        return [];
      }

      return portal.tasks.filter(
        isRevisionTask,
      );
    }, [portal]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session ||
    !portal
  ) {
    return (
      <main className="portal-loading-screen">
        <div className="loading-brand">
          KRVÉ
        </div>

        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading student
          workspace...
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

          .portal-loading-screen {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 16px;
            color: #2455bd;
          }

          .loading-brand {
            color: #0b2c71;
            font-size: 25px;
            font-weight: 900;
            letter-spacing: 0.16em;
          }

          .portal-loading-screen
            span {
            color: #8793a5;
            font-size: 11px;
          }

          .spin {
            animation:
              portalSpin
              0.8s linear
              infinite;
          }

          @keyframes portalSpin {
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
    summary,
  } = portal;

  const stats:
    DashboardStat[] = [
    {
      label:
        "Assigned Tasks",

      value:
        summary.assignedTasks,

      note:
        "All project assignments",

      href:
        "/tasks",

      icon:
        ClipboardList,

      tone:
        "blue",
    },
    {
      label:
        "Submitted",

      value:
        summary.submittedTasks,

      note:
        "Work sent for review",

      href:
        "/submissions",

      icon:
        Send,

      tone:
        "purple",
    },
    {
      label:
        "Approved",

      value:
        summary.approvedTasks,

      note:
        "Evaluator approved",

      href:
        "/feedback",

      icon:
        CheckCircle2,

      tone:
        "green",
    },
    {
      label:
        "Overall Score",

      value:
        student.evaluation
          ?.totalScore ??
        "—",

      note:
        "Out of 100",

      href:
        "/performance",

      icon:
        Target,

      tone:
        "orange",
    },
  ];

  return (
    <main className="portal-shell">
      {/* ===================================================
          MOBILE HEADER
      =================================================== */}

      <header className="mobile-topbar">
        <div>
          <strong>
            KRVÉ
          </strong>

          <span>
            STUDENT PORTAL
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
        className={`portal-sidebar ${
          mobileMenuOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-logo-area">
          <div className="portal-logo">
            K
          </div>

          <div>
            <strong>
              KRVÉ
            </strong>

            <span>
              LIVE PROJECT
              PORTAL
            </span>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
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
          className="student-profile-mini"
        >
          <div className="student-initial">
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

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
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
                    "/dashboard"
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
                    strokeWidth={2}
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
          <div className="application-info">
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
          </div>

          <button
            type="button"
            className="logout-button"
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
          className="mobile-overlay"
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

      <section className="portal-main">
        {/* HEADER */}

        <header className="dashboard-header">
          <div>
            <p>
              KRVÉ LIVE BUSINESS
              PROJECT PROGRAM
            </p>

            <h1>
              Student Dashboard
            </h1>

            <span className="last-updated">
              <Clock3
                size={12}
              />

              Last updated:{" "}
              {formatRefreshTime(
                lastUpdated,
              )}
            </span>
          </div>

          <div className="dashboard-header-actions">
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

            <a
              href="/profile"
              className="header-user"
            >
              <div>
                <span>
                  LOGGED IN AS
                </span>

                <strong>
                  {
                    student.fullName
                  }
                </strong>
              </div>

              <div className="header-avatar">
                {student.fullName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </a>
          </div>
        </header>

        {error && (
          <div className="dashboard-error">
            <AlertCircle
              size={17}
            />

            <div>
              <strong>
                Could not refresh
                latest data.
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                refreshPortal(
                  session.credentials,
                )
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="welcome-card">
          <div className="welcome-copy">
            <p>
              STUDENT WORKSPACE
            </p>

            <h2>
              Welcome back,{" "}
              <span>
                {
                  student.fullName
                }
              </span>
            </h2>

            <div className="welcome-meta">
              <span>
                {student.assignedDepartment ||
                  "Department pending"}
              </span>

              <i />

              <span>
                {student.projectTitle ||
                  "Project allocation pending"}
              </span>
            </div>

            <div className="welcome-actions">
              <a href="/tasks">
                <ClipboardList
                  size={15}
                />

                View Tasks
              </a>

              <a href="/project">
                Project Details

                <ArrowRight
                  size={15}
                />
              </a>
            </div>
          </div>

          <a
            href="/project"
            className="welcome-status"
          >
            <span>
              PROJECT STATUS
            </span>

            <strong>
              {statusLabel(
                student.status,
              )}
            </strong>

            <small>
              {student.projectCode ||
                "Project code pending"}
            </small>

            <div>
              Open Project
              <ChevronRight
                size={14}
              />
            </div>
          </a>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="dashboard-stats">
          {stats.map(
            (stat) => {
              const Icon =
                stat.icon;

              return (
                <a
                  key={
                    stat.label
                  }
                  href={
                    stat.href
                  }
                  className="dashboard-stat-card"
                >
                  <div
                    className={`stat-icon ${stat.tone}`}
                  >
                    <Icon
                      size={20}
                    />
                  </div>

                  <div className="stat-copy">
                    <span>
                      {
                        stat.label
                      }
                    </span>

                    <strong>
                      {
                        stat.value
                      }
                    </strong>

                    <small>
                      {
                        stat.note
                      }
                    </small>
                  </div>

                  <ChevronRight
                    size={16}
                    className="stat-arrow"
                  />
                </a>
              );
            },
          )}
        </section>

        {/* =================================================
            PROGRESS + PROJECT
        ================================================= */}

        <section className="dashboard-grid">
          <article className="dashboard-panel progress-panel">
            <div className="panel-title">
              <div>
                <p>
                  PROJECT PROGRESS
                </p>

                <h3>
                  Task Completion
                </h3>

                <span>
                  Based on approved
                  project tasks.
                </span>
              </div>

              <strong>
                {taskProgress}%
              </strong>
            </div>

            <div className="large-progress-track">
              <div
                style={{
                  width: `${taskProgress}%`,
                }}
              />
            </div>

            <div className="progress-numbers">
              <a href="/feedback">
                <span>
                  Approved
                </span>

                <strong>
                  {
                    summary.approvedTasks
                  }
                </strong>
              </a>

              <a href="/submissions">
                <span>
                  Submitted
                </span>

                <strong>
                  {
                    summary.submittedTasks
                  }
                </strong>
              </a>

              <a href="/tasks">
                <span>
                  Pending
                </span>

                <strong>
                  {
                    summary.pendingTasks
                  }
                </strong>
              </a>
            </div>

            <a
              href="/performance"
              className="panel-link"
            >
              View Full Performance

              <ChevronRight
                size={15}
              />
            </a>
          </article>

          <article className="dashboard-panel project-panel">
            <div className="panel-title">
              <div>
                <p>
                  MY PROJECT
                </p>

                <h3>
                  Current Allocation
                </h3>

                <span>
                  Your official
                  project
                  information.
                </span>
              </div>

              <BookOpen
                size={22}
              />
            </div>

            <div className="project-info-grid">
              <div>
                <span>
                  Department
                </span>

                <strong>
                  {student.assignedDepartment ||
                    "Pending"}
                </strong>
              </div>

              <div>
                <span>
                  Project Code
                </span>

                <strong>
                  {student.projectCode ||
                    "Pending"}
                </strong>
              </div>

              <div className="wide">
                <span>
                  Project Title
                </span>

                <strong>
                  {student.projectTitle ||
                    "Project allocation pending"}
                </strong>
              </div>

              <div>
                <span>
                  Coordinator
                </span>

                <strong>
                  {student.coordinatorName ||
                    "Not assigned"}
                </strong>
              </div>

              <div>
                <span>
                  Duration
                </span>

                <strong>
                  {formatDate(
                    student.startDate,
                  )}{" "}
                  —{" "}
                  {formatDate(
                    student.endDate,
                  )}
                </strong>
              </div>
            </div>

            <a
              href="/project"
              className="panel-link"
            >
              View Project Details

              <ChevronRight
                size={15}
              />
            </a>
          </article>
        </section>

        {/* =================================================
            ALERTS
        ================================================= */}

        {(revisionTasks.length >
          0 ||
          pendingTasks.length >
            0) && (
          <section className="attention-panel">
            <div className="attention-icon">
              <AlertCircle
                size={22}
              />
            </div>

            <div>
              <p>
                NEEDS YOUR
                ATTENTION
              </p>

              <h3>
                {revisionTasks.length >
                0
                  ? `${revisionTasks.length} revision request${
                      revisionTasks.length ===
                      1
                        ? ""
                        : "s"
                    } pending`
                  : `${pendingTasks.length} task${
                      pendingTasks.length ===
                      1
                        ? ""
                        : "s"
                    } pending`}
              </h3>

              <span>
                {revisionTasks.length >
                0
                  ? "Open Weekly Tasks, review evaluator feedback and submit the updated work."
                  : "Review your pending assignments and complete them before their deadlines."}
              </span>
            </div>

            <a href="/tasks">
              Open Tasks

              <ChevronRight
                size={15}
              />
            </a>
          </section>
        )}

        {/* =================================================
            RECENT TASKS
        ================================================= */}

        <section className="dashboard-panel tasks-panel">
          <div className="panel-title">
            <div>
              <p>
                WEEKLY TASKS
              </p>

              <h3>
                Recent Assignments
              </h3>

              <span>
                Latest project
                assignments from
                your project team.
              </span>
            </div>

            <a
              href="/tasks"
              className="view-all-link"
            >
              View All Tasks

              <ChevronRight
                size={15}
              />
            </a>
          </div>

          {recentTasks.length ===
          0 ? (
            <div className="empty-task-state">
              <div>
                <ClipboardList
                  size={26}
                />
              </div>

              <h4>
                No tasks assigned
                yet
              </h4>

              <p>
                Once your project
                team assigns a
                weekly task, it
                will automatically
                appear here.
              </p>

              <button
                type="button"
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
                  size={14}
                />

                Check Again
              </button>
            </div>
          ) : (
            <div className="dashboard-task-table">
              <div className="task-table-head">
                <span>
                  WEEK
                </span>

                <span>
                  TASK
                </span>

                <span>
                  PRIORITY
                </span>

                <span>
                  DUE DATE
                </span>

                <span>
                  STATUS
                </span>

                <span />
              </div>

              {recentTasks.map(
                (task) => (
                  <a
                    key={
                      task.id
                    }
                    href="/tasks"
                    className="task-table-row"
                  >
                    <div className="week-number">
                      {
                        task.weekNumber
                      }
                    </div>

                    <div className="task-name">
                      <strong>
                        {
                          task.title
                        }
                      </strong>

                      <span
                        className={
                          dueStatus(
                            task,
                          ).includes(
                            "overdue",
                          )
                            ? "overdue"
                            : ""
                        }
                      >
                        {dueStatus(
                          task,
                        )}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`priority ${getPriorityClass(
                          task.priority,
                        )}`}
                      >
                        {statusLabel(
                          task.priority ||
                            "Medium",
                        )}
                      </span>
                    </div>

                    <div className="table-date">
                      {formatDate(
                        task.dueDate,
                      )}
                    </div>

                    <div>
                      <span
                        className={`task-status ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        {statusLabel(
                          task.status,
                        )}
                      </span>
                    </div>

                    <div className="task-open">
                      <ChevronRight
                        size={16}
                      />
                    </div>
                  </a>
                ),
              )}
            </div>
          )}
        </section>

        {/* =================================================
            ACTION CENTER
        ================================================= */}

        <section className="section-heading">
          <div>
            <p>
              ACTION CENTER
            </p>

            <h3>
              Continue Your
              Project
            </h3>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <a
            href="/tasks"
            className="dashboard-panel action-panel"
          >
            <div className="action-icon pending">
              <FileText
                size={21}
              />
            </div>

            <div>
              <span>
                PENDING WORK
              </span>

              <h3>
                {
                  pendingTasks.length
                }{" "}
                task
                {pendingTasks.length ===
                1
                  ? ""
                  : "s"}{" "}
                need attention
              </h3>

              <p>
                Open assignments,
                check deadlines
                and submit your
                project work.
              </p>

              <strong className="action-link">
                Go to Tasks

                <ChevronRight
                  size={14}
                />
              </strong>
            </div>
          </a>

          <a
            href="/performance"
            className="dashboard-panel action-panel"
          >
            <div className="action-icon evaluation">
              <BarChart3
                size={21}
              />
            </div>

            <div>
              <span>
                PERFORMANCE
              </span>

              <h3>
                {student.evaluation
                  ? `Grade ${
                      student
                        .evaluation
                        .grade ||
                      "Published"
                    }`
                  : "Evaluation pending"}
              </h3>

              <p>
                Track task quality,
                timeliness,
                initiative,
                teamwork,
                business impact
                and overall score.
              </p>

              <strong className="action-link">
                View Performance

                <ChevronRight
                  size={14}
                />
              </strong>
            </div>
          </a>

          <a
            href="/certificate"
            className="dashboard-panel action-panel"
          >
            <div className="action-icon certificate">
              <Award
                size={21}
              />
            </div>

            <div>
              <span>
                CERTIFICATE
              </span>

              <h3>
                {student.certificateId
                  ? "Certificate issued"
                  : "Completion pending"}
              </h3>

              <p>
                View certificate
                eligibility,
                completion status
                and Certificate ID.
              </p>

              <strong className="action-link">
                View Certificate

                <ChevronRight
                  size={14}
                />
              </strong>
            </div>
          </a>
        </section>

        {/* =================================================
            QUICK LINKS
        ================================================= */}

        <section className="quick-links">
          <a href="/project">
            <BookOpen
              size={18}
            />

            <div>
              <strong>
                Project Details
              </strong>

              <span>
                Allocation,
                coordinator &
                dates
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/submissions">
            <FileCheck2
              size={18}
            />

            <div>
              <strong>
                Submission History
              </strong>

              <span>
                Submitted work &
                status
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/feedback">
            <MessageSquareText
              size={18}
            />

            <div>
              <strong>
                Feedback
              </strong>

              <span>
                Comments &
                revisions
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/profile">
            <UserRound
              size={18}
            />

            <div>
              <strong>
                My Profile
              </strong>

              <span>
                Student &
                project record
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>
        </section>
      </section>

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

        a {
          color: inherit;
        }

        button {
          font: inherit;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
        }

        .portal-shell {
          min-height: 100vh;
        }

        /* SIDEBAR */

        .portal-sidebar {
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
          box-shadow:
            4px 0 25px
            rgba(
              21,
              44,
              82,
              0.025
            );
        }

        .sidebar-logo-area {
          display: flex;
          min-height: 84px;
          align-items: center;
          gap: 12px;
          padding: 0 22px;
          border-bottom:
            1px solid #edf1f5;
        }

        .portal-logo {
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
          font-size: 16px;
          font-weight: 900;
        }

        .sidebar-logo-area
          strong {
          display: block;
          color: #11203b;
          font-size: 16px;
          letter-spacing: 0.08em;
        }

        .sidebar-logo-area
          span {
          display: block;
          margin-top: 3px;
          color: #939fb0;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .sidebar-mobile-close {
          display: none;
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #56667e;
        }

        .student-profile-mini {
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
          transition:
            border-color
              0.18s ease,
            transform
              0.18s ease;
        }

        .student-profile-mini:hover {
          transform:
            translateY(-1px);
          border-color:
            #cbd8ec;
        }

        .student-initial,
        .header-avatar {
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

        .student-profile-mini
          strong {
          display: block;
          max-width: 155px;
          overflow: hidden;
          color: #21304a;
          font-size: 11px;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }

        .student-profile-mini
          span {
          display: block;
          margin-top: 4px;
          color: #8c98a9;
          font-size: 9px;
        }

        .sidebar-section-title {
          padding:
            7px 27px 10px;
          color: #a4adba;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .sidebar-nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding: 0 13px 15px;
        }

        .sidebar-nav a {
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
          transition:
            background
              0.18s ease,
            color
              0.18s ease;
        }

        .sidebar-nav a:hover {
          background: #f3f6fb;
          color: #244680;
        }

        .sidebar-nav a.active {
          background:
            linear-gradient(
              135deg,
              #09172f,
              #102e67
            );
          color: #fff;
          box-shadow:
            0 8px 22px
            rgba(
              8,
              35,
              84,
              0.15
            );
        }

        .sidebar-bottom {
          padding: 16px;
          border-top:
            1px solid #edf1f5;
        }

        .application-info
          span {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.11em;
        }

        .application-info
          strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #47556c;
          font-size: 9px;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }

        .logout-button {
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
          font-weight: 700;
        }

        .logout-button:hover {
          border-color:
            #f1c8cd;
          background: #fff7f7;
          color: #b43c48;
        }

        /* MAIN */

        .portal-main {
          min-height: 100vh;
          margin-left: 265px;
          padding:
            0 36px 55px;
        }

        .dashboard-header {
          display: flex;
          min-height: 105px;
          align-items: center;
          justify-content:
            space-between;
          gap: 24px;
          border-bottom:
            1px solid #dfe5ed;
        }

        .dashboard-header
          > div:first-child
          > p {
          margin: 0;
          color: #2959d1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .dashboard-header h1 {
          margin:
            7px 0 0;
          color: #132038;
          font-size: 25px;
          letter-spacing:
            -0.025em;
        }

        .last-updated {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          color: #98a3b3;
          font-size: 8px;
        }

        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
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

        .refresh-button:hover {
          border-color:
            #bdcbe0;
          background: #f9fbff;
        }

        .refresh-button:disabled {
          opacity: 0.6;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .header-user
          > div:first-child {
          text-align: right;
        }

        .header-user span {
          color: #9aa4b3;
          font-size: 7px;
          font-weight: 700;
        }

        .header-user strong {
          display: block;
          margin-top: 3px;
          color: #344158;
          font-size: 10px;
        }

        .dashboard-error {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          margin-top: 18px;
          padding: 13px 14px;
          border:
            1px solid #ffd2d6;
          border-radius: 11px;
          background: #fff4f5;
          color: #b42c38;
        }

        .dashboard-error
          strong {
          display: block;
          font-size: 9px;
        }

        .dashboard-error
          span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
        }

        .dashboard-error
          button {
          height: 32px;
          padding: 0 11px;
          border:
            1px solid #efbbc1;
          border-radius: 7px;
          background: #fff;
          color: #aa3340;
          font-size: 8px;
          font-weight: 800;
        }

        /* WELCOME */

        .welcome-card {
          display: flex;
          min-height: 205px;
          align-items: center;
          justify-content:
            space-between;
          gap: 30px;
          margin-top: 27px;
          padding: 36px 39px;
          overflow: hidden;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 88%
                18%,
              rgba(
                91,
                137,
                255,
                0.48
              ),
              transparent
                25%
            ),
            linear-gradient(
              135deg,
              #061936,
              #0c3279
            );
          color: #fff;
          box-shadow:
            0 18px 48px
            rgba(
              12,
              42,
              92,
              0.14
            );
        }

        .welcome-copy > p {
          margin: 0;
          color: #9db8fa;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.18em;
        }

        .welcome-copy h2 {
          margin:
            10px 0 9px;
          font-size: 29px;
          letter-spacing:
            -0.03em;
        }

        .welcome-copy
          h2
          span {
          color: #b4c9ff;
        }

        .welcome-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          color:
            rgba(
              255,
              255,
              255,
              0.62
            );
          font-size: 10px;
        }

        .welcome-meta i {
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

        .welcome-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .welcome-actions a {
          display: inline-flex;
          min-height: 39px;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.18
            );
          border-radius: 9px;
          background:
            rgba(
              255,
              255,
              255,
              0.08
            );
          color: #fff;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .welcome-actions
          a:first-child {
          background: #fff;
          color: #143d8e;
        }

        .welcome-status {
          min-width: 235px;
          padding: 21px 22px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );
          border-radius: 14px;
          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
          color: #fff;
          text-decoration: none;
          backdrop-filter:
            blur(10px);
          transition:
            transform
              0.18s ease,
            background
              0.18s ease;
        }

        .welcome-status:hover {
          transform:
            translateY(-2px);
          background:
            rgba(
              255,
              255,
              255,
              0.11
            );
        }

        .welcome-status
          > span {
          color: #a9bee9;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .welcome-status
          > strong {
          display: block;
          margin:
            8px 0 5px;
          font-size: 18px;
        }

        .welcome-status
          > small {
          display: block;
          color:
            rgba(
              255,
              255,
              255,
              0.5
            );
          font-size: 9px;
        }

        .welcome-status
          > div {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 20px;
          color: #c6d5f7;
          font-size: 8px;
          font-weight: 800;
        }

        /* STATS */

        .dashboard-stats {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 15px;
          margin-top: 17px;
        }

        .dashboard-stat-card {
          position: relative;
          display: flex;
          min-height: 130px;
          align-items:
            flex-start;
          gap: 14px;
          padding: 20px;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
          box-shadow:
            0 6px 21px
            rgba(
              19,
              46,
              88,
              0.04
            );
          text-decoration: none;
          transition:
            transform
              0.18s ease,
            border-color
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .dashboard-stat-card:hover {
          transform:
            translateY(-2px);
          border-color:
            #cbd7e8;
          box-shadow:
            0 11px 28px
            rgba(
              19,
              46,
              88,
              0.08
            );
        }

        .stat-icon {
          display: grid;
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          place-items: center;
          border-radius: 11px;
        }

        .stat-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .stat-icon.purple {
          background: #f3efff;
          color: #6e4bd6;
        }

        .stat-icon.green {
          background: #ebf8f1;
          color: #258855;
        }

        .stat-icon.orange {
          background: #fff3e6;
          color: #d87b1d;
        }

        .stat-copy > span {
          color: #818c9f;
          font-size: 9px;
          font-weight: 700;
        }

        .stat-copy > strong {
          display: block;
          margin-top: 5px;
          color: #142039;
          font-size: 26px;
        }

        .stat-copy > small {
          display: block;
          margin-top: 5px;
          color: #a1aab8;
          font-size: 8px;
        }

        .stat-arrow {
          position: absolute;
          right: 14px;
          bottom: 14px;
          color: #a0aec1;
        }

        /* PANELS */

        .dashboard-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 0.8fr)
            minmax(0, 1.2fr);
          gap: 16px;
          margin-top: 17px;
        }

        .dashboard-panel {
          border:
            1px solid #dfe5ed;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 6px 22px
            rgba(
              17,
              44,
              85,
              0.04
            );
        }

        .progress-panel,
        .project-panel,
        .tasks-panel {
          padding: 24px;
        }

        .panel-title {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 20px;
        }

        .panel-title p,
        .section-heading p,
        .attention-panel p {
          margin: 0;
          color: #2b5acf;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .panel-title h3,
        .section-heading h3 {
          margin:
            7px 0 0;
          color: #17243c;
          font-size: 17px;
        }

        .panel-title
          > div
          > span {
          display: block;
          margin-top: 6px;
          color: #8b96a7;
          font-size: 9px;
        }

        .panel-title
          > strong {
          color: #2258d2;
          font-size: 24px;
        }

        .large-progress-track {
          height: 9px;
          margin-top: 31px;
          overflow: hidden;
          border-radius: 50px;
          background: #edf1f6;
        }

        .large-progress-track
          div {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #174fd0,
              #6990ff
            );
          transition:
            width 0.35s ease;
        }

        .progress-numbers {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              1fr
            );
          gap: 10px;
          margin-top: 22px;
        }

        .progress-numbers a {
          padding: 13px;
          border-radius: 10px;
          background: #f7f9fc;
          text-decoration: none;
          transition:
            background
              0.18s ease;
        }

        .progress-numbers
          a:hover {
          background: #edf3ff;
        }

        .progress-numbers span {
          color: #929daf;
          font-size: 8px;
        }

        .progress-numbers
          strong {
          display: block;
          margin-top: 5px;
          color: #33425a;
          font-size: 17px;
        }

        .project-info-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-top: 19px;
        }

        .project-info-grid
          > div {
          padding: 12px;
          border:
            1px solid #e8ecf2;
          border-radius: 9px;
          background: #fafcff;
        }

        .project-info-grid
          > div.wide {
          grid-column:
            1 / -1;
        }

        .project-info-grid
          span {
          display: block;
          color: #97a2b3;
          font-size: 7px;
          font-weight: 800;
          text-transform:
            uppercase;
        }

        .project-info-grid
          strong {
          display: block;
          margin-top: 5px;
          color: #37465d;
          font-size: 9px;
          line-height: 1.5;
        }

        .panel-link,
        .view-all-link {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
          color: #2458cd;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .panel-link {
          margin-top: 17px;
        }

        /* ATTENTION */

        .attention-panel {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 15px;
          margin-top: 17px;
          padding: 18px 20px;
          border:
            1px solid #f1d29b;
          border-radius: 14px;
          background: #fffaf1;
        }

        .attention-icon {
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border-radius: 11px;
          background: #fff0d5;
          color: #b87315;
        }

        .attention-panel h3 {
          margin:
            5px 0 4px;
          color: #5b4630;
          font-size: 13px;
        }

        .attention-panel
          > div:nth-child(2)
          > span {
          color: #8d755b;
          font-size: 9px;
          line-height: 1.5;
        }

        .attention-panel a {
          display: inline-flex;
          min-height: 37px;
          align-items: center;
          gap: 5px;
          padding: 0 12px;
          border-radius: 8px;
          background: #b87518;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          text-decoration: none;
        }

        /* TASKS */

        .tasks-panel {
          margin-top: 17px;
        }

        .dashboard-task-table {
          margin-top: 21px;
          overflow-x: auto;
          border-top:
            1px solid #e9edf3;
        }

        .task-table-head,
        .task-table-row {
          display: grid;
          grid-template-columns:
            65px
            minmax(
              210px,
              1.5fr
            )
            110px
            120px
            130px
            35px;
          align-items: center;
          gap: 13px;
        }

        .task-table-head {
          min-width: 820px;
          padding: 12px 8px;
          color: #9aa4b4;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .task-table-row {
          min-width: 820px;
          min-height: 70px;
          padding: 10px 8px;
          border-top:
            1px solid #edf0f5;
          text-decoration: none;
          transition:
            background
              0.18s ease;
        }

        .task-table-row:hover {
          background: #fafcff;
        }

        .week-number {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 9px;
          background: #eff4ff;
          color: #2a5bd4;
          font-size: 11px;
          font-weight: 900;
        }

        .task-name strong {
          display: block;
          color: #26354c;
          font-size: 10px;
        }

        .task-name span {
          display: block;
          margin-top: 4px;
          color: #929dae;
          font-size: 8px;
        }

        .task-name
          span.overdue {
          color: #c44652;
          font-weight: 800;
        }

        .priority,
        .task-status {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          padding: 6px 8px;
          border-radius: 50px;
          font-size: 7px;
          font-weight: 900;
          text-transform:
            uppercase;
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

        .task-status.success {
          background: #e9f8ef;
          color: #188449;
        }

        .task-status.review {
          background: #eaf1ff;
          color: #2558ce;
        }

        .task-status.warning {
          background: #fff3dd;
          color: #b66d13;
        }

        .task-status.danger {
          background: #fff0f1;
          color: #c03945;
        }

        .task-status.neutral {
          background: #f0f3f7;
          color: #68768a;
        }

        .table-date {
          color: #657489;
          font-size: 9px;
        }

        .task-open {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border:
            1px solid #dee5ee;
          border-radius: 8px;
          color: #526a98;
        }

        .empty-task-state {
          display: flex;
          min-height: 235px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
        }

        .empty-task-state
          > div {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border-radius: 13px;
          background: #edf3fc;
          color: #5874a8;
        }

        .empty-task-state h4 {
          margin:
            14px 0 6px;
          font-size: 13px;
        }

        .empty-task-state p {
          max-width: 430px;
          margin: 0;
          color: #8a95a6;
          font-size: 9px;
          line-height: 1.6;
        }

        .empty-task-state
          button {
          display: flex;
          min-height: 36px;
          align-items: center;
          gap: 6px;
          margin-top: 15px;
          padding: 0 12px;
          border:
            1px solid #d8e0ec;
          border-radius: 8px;
          background: #fff;
          color: #526b99;
          font-size: 8px;
          font-weight: 800;
        }

        /* ACTION CENTER */

        .section-heading {
          margin-top: 24px;
        }

        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );
          gap: 15px;
          margin-top: 12px;
        }

        .action-panel {
          display: flex;
          min-height: 185px;
          gap: 14px;
          padding: 21px;
          text-decoration: none;
          transition:
            transform
              0.18s ease,
            border-color
              0.18s ease;
        }

        .action-panel:hover {
          transform:
            translateY(-2px);
          border-color:
            #cbd8ea;
        }

        .action-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          place-items: center;
          border-radius: 11px;
        }

        .action-icon.pending {
          background: #fff3e6;
          color: #d97819;
        }

        .action-icon.evaluation {
          background: #edf3ff;
          color: #2a5ed8;
        }

        .action-icon.certificate {
          background: #f1edff;
          color: #6d4fd1;
        }

        .action-panel
          > div:last-child
          > span {
          color: #2c5ace;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .action-panel h3 {
          margin:
            7px 0;
          color: #1d2a42;
          font-size: 14px;
        }

        .action-panel p {
          margin: 0;
          color: #828ea0;
          font-size: 9px;
          line-height: 1.6;
        }

        .action-link {
          display: flex;
          width: fit-content;
          align-items: center;
          gap: 4px;
          margin-top: 13px;
          color: #2758ca;
          font-size: 8px;
        }

        /* QUICK LINKS */

        .quick-links {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 12px;
          margin-top: 17px;
        }

        .quick-links a {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          min-height: 76px;
          padding: 16px;
          border:
            1px solid #dfe5ed;
          border-radius: 13px;
          background: #fff;
          color: #315999;
          text-decoration: none;
          transition:
            transform
              0.18s ease,
            border-color
              0.18s ease;
        }

        .quick-links a:hover {
          transform:
            translateY(-1px);
          border-color:
            #c5d2e6;
        }

        .quick-links strong {
          display: block;
          color: #304058;
          font-size: 9px;
        }

        .quick-links span {
          display: block;
          margin-top: 4px;
          color: #909bae;
          font-size: 7px;
          line-height: 1.4;
        }

        /* MOBILE */

        .mobile-topbar,
        .mobile-overlay {
          display: none;
        }

        .spin {
          animation:
            portalSpin
            0.8s linear
            infinite;
        }

        @keyframes portalSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          max-width: 1160px
        ) {
          .dashboard-stats {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .dashboard-grid {
            grid-template-columns:
              1fr;
          }

          .dashboard-bottom-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .quick-links {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 820px
        ) {
          .mobile-topbar {
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
            backdrop-filter:
              blur(12px);
          }

          .mobile-topbar
            strong {
            display: block;
            color: #0a2c6e;
            font-size: 16px;
            letter-spacing: 0.1em;
          }

          .mobile-topbar span {
            display: block;
            margin-top: 2px;
            color: #98a3b3;
            font-size: 6px;
            font-weight: 800;
            letter-spacing: 0.13em;
          }

          .mobile-topbar
            button {
            display: grid;
            width: 38px;
            height: 38px;
            place-items: center;
            border:
              1px solid #dce3ec;
            border-radius: 9px;
            background: #fff;
            color: #3e4f67;
          }

          .portal-sidebar {
            z-index: 1001;
            width: 280px;
            transform:
              translateX(-100%);
            transition:
              transform
              0.25s ease;
          }

          .portal-sidebar.mobile-open {
            transform:
              translateX(0);
          }

          .sidebar-mobile-close {
            display: grid;
            place-items: center;
          }

          .mobile-overlay {
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

          .portal-main {
            margin-left: 0;
            padding:
              0 17px 40px;
          }

          .dashboard-header {
            min-height: 92px;
          }

          .header-user {
            display: none;
          }

          .welcome-card {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .welcome-status {
            width: 100%;
            min-width: 0;
          }

          .dashboard-bottom-grid {
            grid-template-columns:
              1fr;
          }

          .attention-panel {
            grid-template-columns:
              auto 1fr;
          }

          .attention-panel a {
            grid-column:
              1 / -1;
            width: fit-content;
          }
        }

        @media (
          max-width: 560px
        ) {
          .dashboard-stats,
          .quick-links {
            grid-template-columns:
              1fr;
          }

          .dashboard-header-actions {
            gap: 8px;
          }

          .refresh-button {
            width: 42px;
            padding: 0;
            justify-content:
              center;
            font-size: 0;
          }

          .welcome-card {
            padding:
              27px 21px;
          }

          .welcome-copy h2 {
            font-size: 23px;
          }

          .progress-panel,
          .project-panel,
          .tasks-panel {
            padding: 19px;
          }

          .progress-numbers,
          .project-info-grid {
            grid-template-columns:
              1fr;
          }

          .project-info-grid
            > div.wide {
            grid-column: auto;
          }

          .dashboard-error {
            grid-template-columns:
              auto 1fr;
          }

          .dashboard-error
            button {
            grid-column:
              1 / -1;
            width: fit-content;
          }

          .attention-panel {
            align-items:
              flex-start;
            grid-template-columns:
              1fr;
          }

          .welcome-actions {
            flex-direction:
              column;
          }

          .welcome-actions a {
            justify-content:
              center;
          }
        }
      `}</style>
    </main>
  );
}
