"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
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

function projectProgress(
  portal: StudentPortalData,
) {
  if (
    portal.summary.assignedTasks <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (portal.summary.approvedTasks /
        portal.summary.assignedTasks) *
        100,
    ),
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProjectPage() {
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

  /* =======================================================
     SESSION
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

      refreshPortal(
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
            "Unable to refresh project data.",
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
        refreshError instanceof
          Error
          ? refreshError.message
          : "Unable to refresh project.",
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

    window.location.href =
      "/";
  }

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress =
    useMemo(() => {
      if (!session) {
        return 0;
      }

      return projectProgress(
        session.portal,
      );
    }, [session]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="project-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading project...
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

          .project-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .project-loading span {
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
    summary,
  } = session.portal;

  return (
    <main className="project-page">
      {/* MOBILE HEADER */}

      <header className="mobile-header">
        <strong>
          KRVÉ
        </strong>

        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              true,
            )
          }
        >
          <Menu size={21} />
        </button>
      </header>

      {/* SIDEBAR */}

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
          >
            <X size={19} />
          </button>
        </div>

        <div className="student-mini">
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
        </div>

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
                    "/project"
                      ? "active"
                      : ""
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

          <strong>
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
        />
      )}

      {/* MAIN */}

      <section className="main-content">
        <header className="page-header">
          <div>
            <a
              href="/dashboard"
              className="back-link"
            >
              <ChevronLeft
                size={15}
              />

              Dashboard
            </a>

            <p>
              PROJECT WORKSPACE
            </p>

            <h1>
              My Project
            </h1>

            <span>
              Official project
              allocation and
              progress details.
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

            Refresh
          </button>
        </header>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* PROJECT HERO */}

        <section className="project-hero">
          <div>
            <p>
              CURRENT PROJECT
            </p>

            <h2>
              {student.projectTitle ||
                "Project allocation pending"}
            </h2>

            <div className="hero-meta">
              <span>
                {student.assignedDepartment ||
                  "Department pending"}
              </span>

              <i />

              <span>
                {student.projectCode ||
                  "Project code pending"}
              </span>
            </div>
          </div>

          <div className="status-card">
            <span>
              PROJECT STATUS
            </span>

            <strong>
              {statusLabel(
                student.status,
              )}
            </strong>

            <small>
              {student.coordinatorName
                ? `Coordinator: ${student.coordinatorName}`
                : "Coordinator not assigned"}
            </small>
          </div>
        </section>

        {/* MAIN GRID */}

        <section className="project-grid">
          <article className="panel project-details-panel">
            <div className="panel-heading">
              <div>
                <p>
                  PROJECT DETAILS
                </p>

                <h3>
                  Allocation
                  Information
                </h3>
              </div>

              <BookOpen
                size={22}
              />
            </div>

            <div className="details-grid">
              <Info
                label="Project Code"
                value={
                  student.projectCode ||
                  "Pending"
                }
              />

              <Info
                label="Department"
                value={
                  student.assignedDepartment ||
                  "Pending"
                }
              />

              <Info
                label="Coordinator"
                value={
                  student.coordinatorName ||
                  "Not assigned"
                }
              />

              <Info
                label="Status"
                value={statusLabel(
                  student.status,
                )}
              />

              <Info
                label="Start Date"
                value={formatDate(
                  student.startDate,
                )}
              />

              <Info
                label="End Date"
                value={formatDate(
                  student.endDate,
                )}
              />

              <Info
                label="Referral Code"
                value={
                  student.referralCode ||
                  "Not assigned"
                }
              />

              <Info
                label="Institute"
                value={
                  student.college ||
                  "—"
                }
              />
            </div>
          </article>

          <article className="panel progress-panel">
            <div className="panel-heading">
              <div>
                <p>
                  PROGRESS
                </p>

                <h3>
                  Project Completion
                </h3>
              </div>

              <Target
                size={22}
              />
            </div>

            <div className="big-progress">
              <strong>
                {progress}%
              </strong>

              <span>
                task completion
              </span>
            </div>

            <div className="progress-track">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="progress-stats">
              <div>
                <span>
                  Assigned
                </span>

                <strong>
                  {
                    summary.assignedTasks
                  }
                </strong>
              </div>

              <div>
                <span>
                  Submitted
                </span>

                <strong>
                  {
                    summary.submittedTasks
                  }
                </strong>
              </div>

              <div>
                <span>
                  Approved
                </span>

                <strong>
                  {
                    summary.approvedTasks
                  }
                </strong>
              </div>
            </div>
          </article>
        </section>

        {/* TIMELINE */}

        <section className="panel timeline-panel">
          <div className="panel-heading">
            <div>
              <p>
                PROJECT TIMELINE
              </p>

              <h3>
                Duration &
                Milestones
              </h3>
            </div>

            <CalendarDays
              size={22}
            />
          </div>

          <div className="timeline">
            <div className="timeline-point active">
              <span>
                START
              </span>

              <strong>
                {formatDate(
                  student.startDate,
                )}
              </strong>
            </div>

            <div className="timeline-line">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="timeline-point">
              <span>
                COMPLETION
              </span>

              <strong>
                {formatDate(
                  student.endDate,
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* RESPONSIBILITIES */}

        <section className="two-column">
          <article className="panel info-panel">
            <div className="panel-heading">
              <div>
                <p>
                  YOUR ROLE
                </p>

                <h3>
                  Student
                  Responsibilities
                </h3>
              </div>
            </div>

            <div className="responsibility-list">
              <div>
                <span>01</span>

                <p>
                  Complete weekly
                  assignments
                  within the
                  specified
                  deadlines.
                </p>
              </div>

              <div>
                <span>02</span>

                <p>
                  Submit clear
                  evidence of
                  completed work
                  through the
                  portal.
                </p>
              </div>

              <div>
                <span>03</span>

                <p>
                  Maintain
                  professional
                  communication
                  with the project
                  coordinator.
                </p>
              </div>

              <div>
                <span>04</span>

                <p>
                  Respond to
                  revision requests
                  and evaluator
                  feedback.
                </p>
              </div>

              <div>
                <span>05</span>

                <p>
                  Contribute to
                  measurable
                  business outcomes
                  relevant to your
                  assigned field.
                </p>
              </div>
            </div>
          </article>

          <article className="panel info-panel">
            <div className="panel-heading">
              <div>
                <p>
                  EVALUATION
                </p>

                <h3>
                  Performance
                  Framework
                </h3>
              </div>
            </div>

            <div className="evaluation-list">
              <Metric
                label="Task Quality"
                max="20"
              />

              <Metric
                label="Timeliness"
                max="15"
              />

              <Metric
                label="Initiative"
                max="15"
              />

              <Metric
                label="Teamwork"
                max="15"
              />

              <Metric
                label="Business Impact"
                max="20"
              />

              <Metric
                label="Final Presentation"
                max="15"
              />
            </div>

            <a
              href="/performance"
              className="panel-link"
            >
              View Performance
              Details
            </a>
          </article>
        </section>

        {/* QUICK ACTIONS */}

        <section className="quick-actions">
          <a href="/tasks">
            <ClipboardList
              size={20}
            />

            <div>
              <strong>
                Weekly Tasks
              </strong>

              <span>
                View assignments
                and submit work
              </span>
            </div>
          </a>

          <a href="/submissions">
            <FileCheck2
              size={20}
            />

            <div>
              <strong>
                My Submissions
              </strong>

              <span>
                Track submitted
                project work
              </span>
            </div>
          </a>

          <a href="/performance">
            <BarChart3
              size={20}
            />

            <div>
              <strong>
                Performance
              </strong>

              <span>
                View evaluation
                and score
              </span>
            </div>
          </a>
        </section>
      </section>

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

        button {
          font: inherit;
          cursor: pointer;
        }

        .project-page {
          min-height: 100vh;
        }

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
          padding: 7px 27px 10px;
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

        .main-content {
          min-height: 100vh;
          margin-left: 265px;
          padding: 0 36px 50px;
        }

        .page-header {
          display: flex;
          min-height: 125px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom:
            1px solid #dfe5ed;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 10px;
          color: #728096;
          font-size: 9px;
          font-weight: 700;
          text-decoration: none;
        }

        .page-header p,
        .panel-heading p {
          margin: 0;
          color: #2959d1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .page-header h1 {
          margin: 6px 0 5px;
          font-size: 26px;
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

        .error-box {
          margin-top: 18px;
          padding: 13px;
          border:
            1px solid #ffd2d6;
          border-radius: 10px;
          background: #fff4f5;
          color: #b32d38;
          font-size: 10px;
        }

        .project-hero {
          display: flex;
          min-height: 190px;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          margin-top: 26px;
          padding: 34px 38px;
          border-radius: 19px;
          background:
            radial-gradient(
              circle at 88% 20%,
              rgba(
                91,
                137,
                255,
                0.46
              ),
              transparent 25%
            ),
            linear-gradient(
              135deg,
              #061936,
              #0c3279
            );
          color: #fff;
        }

        .project-hero p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .project-hero h2 {
          max-width: 780px;
          margin: 11px 0 8px;
          font-size: 29px;
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
          font-size: 10px;
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

        .status-card {
          min-width: 235px;
          padding: 21px;
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
        }

        .status-card span {
          color: #adc0e9;
          font-size: 7px;
          font-weight: 900;
        }

        .status-card strong {
          display: block;
          margin: 8px 0 5px;
          font-size: 18px;
        }

        .status-card small {
          color:
            rgba(
              255,
              255,
              255,
              0.52
            );
          font-size: 9px;
        }

        .project-grid {
          display: grid;
          grid-template-columns:
            1.3fr 0.7fr;
          gap: 16px;
          margin-top: 17px;
        }

        .panel {
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

        .project-details-panel,
        .progress-panel,
        .timeline-panel,
        .info-panel {
          padding: 24px;
        }

        .panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .panel-heading h3 {
          margin: 7px 0 0;
          font-size: 17px;
        }

        .details-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 11px;
          margin-top: 20px;
        }

        .info {
          padding: 13px;
          border:
            1px solid #e7ebf1;
          border-radius: 9px;
          background: #fafcff;
        }

        .info span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .info strong {
          display: block;
          margin-top: 5px;
          color: #3e4c61;
          font-size: 9px;
          word-break: break-word;
        }

        .big-progress {
          margin-top: 24px;
        }

        .big-progress strong {
          display: block;
          color: #2157d0;
          font-size: 44px;
        }

        .big-progress span {
          color: #8b97a9;
          font-size: 9px;
        }

        .progress-track {
          height: 9px;
          margin-top: 20px;
          overflow: hidden;
          border-radius: 50px;
          background: #edf1f6;
        }

        .progress-track div {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #174fd0,
              #6990ff
            );
        }

        .progress-stats {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 9px;
          margin-top: 18px;
        }

        .progress-stats div {
          padding: 12px;
          border-radius: 9px;
          background: #f7f9fc;
        }

        .progress-stats span {
          color: #929daf;
          font-size: 7px;
        }

        .progress-stats strong {
          display: block;
          margin-top: 5px;
          font-size: 16px;
        }

        .timeline-panel {
          margin-top: 17px;
        }

        .timeline {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 16px;
          margin-top: 28px;
        }

        .timeline-point {
          min-width: 140px;
        }

        .timeline-point span {
          display: block;
          color: #99a4b4;
          font-size: 7px;
          font-weight: 900;
        }

        .timeline-point strong {
          display: block;
          margin-top: 5px;
          font-size: 10px;
        }

        .timeline-line {
          height: 8px;
          overflow: hidden;
          border-radius: 50px;
          background: #e9edf3;
        }

        .timeline-line div {
          height: 100%;
          background:
            linear-gradient(
              90deg,
              #1d53cf,
              #6c91fa
            );
        }

        .two-column {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 16px;
          margin-top: 17px;
        }

        .responsibility-list,
        .evaluation-list {
          margin-top: 20px;
        }

        .responsibility-list > div {
          display: grid;
          grid-template-columns:
            32px 1fr;
          gap: 11px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
        }

        .responsibility-list span {
          color: #2b5bd2;
          font-size: 8px;
          font-weight: 900;
        }

        .responsibility-list p {
          margin: 0;
          color: #6f7d91;
          font-size: 10px;
          line-height: 1.6;
        }

        .metric {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
        }

        .metric span {
          color: #617087;
          font-size: 10px;
        }

        .metric strong {
          color: #2758ce;
          font-size: 11px;
        }

        .panel-link {
          display: inline-flex;
          margin-top: 17px;
          color: #2658ce;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .quick-actions {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .quick-actions a {
          display: flex;
          min-height: 105px;
          align-items: flex-start;
          gap: 13px;
          padding: 19px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
          color: #2558ce;
          text-decoration: none;
        }

        .quick-actions strong {
          display: block;
          color: #1d2a42;
          font-size: 11px;
        }

        .quick-actions span {
          display: block;
          margin-top: 5px;
          color: #8490a3;
          font-size: 9px;
          line-height: 1.5;
        }

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
          max-width: 1050px
        ) {
          .project-grid,
          .two-column {
            grid-template-columns:
              1fr;
          }

          .quick-actions {
            grid-template-columns:
              1fr 1fr;
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
                0.95
              );
          }

          .mobile-header strong {
            color: #0a2c6e;
            letter-spacing: 0.1em;
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
              transform 0.25s ease;
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
            padding: 0 17px 40px;
          }

          .project-hero {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .status-card {
            width: 100%;
            min-width: 0;
          }
        }

        @media (
          max-width: 560px
        ) {
          .details-grid,
          .progress-stats,
          .quick-actions {
            grid-template-columns:
              1fr;
          }

          .timeline {
            grid-template-columns:
              1fr;
          }

          .timeline-line {
            height: 60px;
            width: 8px;
          }

          .timeline-line div {
            width: 100% !important;
          }

          .project-hero,
          .project-details-panel,
          .progress-panel,
          .timeline-panel,
          .info-panel {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="info">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function Metric({
  label,
  max,
}: {
  label: string;
  max: string;
}) {
  return (
    <div className="metric">
      <span>
        {label}
      </span>

      <strong>
        {max} Points
      </strong>
    </div>
  );
}
