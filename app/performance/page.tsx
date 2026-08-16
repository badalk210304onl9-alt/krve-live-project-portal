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
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
  Star,
  Target,
  TrendingUp,
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

type PerformanceMetric = {
  label: string;
  value: number | null | undefined;
  max: number;
  description: string;
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

function getGradeFromScore(
  score: number | null | undefined,
) {
  if (
    score === null ||
    score === undefined
  ) {
    return "Pending";
  }

  if (score >= 90) {
    return "A+";
  }

  if (score >= 80) {
    return "A";
  }

  if (score >= 70) {
    return "B+";
  }

  if (score >= 60) {
    return "B";
  }

  if (score >= 50) {
    return "C";
  }

  return "Needs Improvement";
}

function getPerformanceLabel(
  score: number | null | undefined,
) {
  if (
    score === null ||
    score === undefined
  ) {
    return "Evaluation Pending";
  }

  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Strong Performance";
  }

  if (score >= 55) {
    return "Good Progress";
  }

  return "Improvement Required";
}

function percentage(
  value: number | null | undefined,
  max: number,
) {
  if (
    value === null ||
    value === undefined ||
    max <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (value / max) * 100,
    ),
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PerformancePage() {
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
     LOAD SESSION
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
            "Unable to refresh performance.",
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
          : "Unable to refresh performance.",
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
     METRICS
  ======================================================= */

  const metrics =
    useMemo<PerformanceMetric[]>(() => {
      if (!session) {
        return [];
      }

      const evaluation =
        session.portal.student.evaluation;

      return [
        {
          label: "Task Quality",
          value:
            evaluation?.taskQuality,
          max: 20,
          description:
            "Quality, accuracy and completeness of assigned work.",
        },
        {
          label: "Timeliness",
          value:
            evaluation?.timeliness,
          max: 15,
          description:
            "Ability to meet deadlines and submit work on time.",
        },
        {
          label: "Initiative",
          value:
            evaluation?.initiative,
          max: 15,
          description:
            "Ownership, problem solving and proactive contribution.",
        },
        {
          label: "Teamwork",
          value:
            evaluation?.teamwork,
          max: 15,
          description:
            "Collaboration, communication and professional conduct.",
        },
        {
          label: "Business Impact",
          value:
            evaluation?.businessImpact,
          max: 20,
          description:
            "Practical value and measurable contribution to KRVE.",
        },
        {
          label:
            "Final Presentation",
          value:
            evaluation?.finalPresentation,
          max: 15,
          description:
            "Clarity, professionalism and quality of final presentation.",
        },
      ];
    }, [session]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="performance-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading performance
          data...
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

          .performance-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .performance-loading
            span {
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

  const evaluation =
    student.evaluation;

  const totalScore =
    evaluation?.totalScore ??
    null;

  const grade =
    evaluation?.grade ||
    getGradeFromScore(
      totalScore,
    );

  const performanceLabel =
    getPerformanceLabel(
      totalScore,
    );

  return (
    <main className="performance-page">
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
              LIVE PROJECT
              PORTAL
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

        <div className="student-card">
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

        <div className="nav-title">
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
                    "/performance"
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
              PERFORMANCE &
              EVALUATION
            </p>

            <h1>
              Performance
            </h1>

            <span>
              Track your overall
              project evaluation
              and category-wise
              scores.
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

        {/* HERO */}

        <section className="performance-hero">
          <div className="score-area">
            <p>
              OVERALL SCORE
            </p>

            <h2>
              {totalScore ??
                "—"}

              <span>
                /100
              </span>
            </h2>

            <strong>
              {
                performanceLabel
              }
            </strong>
          </div>

          <div className="grade-area">
            <span>
              FINAL GRADE
            </span>

            <strong>
              {grade}
            </strong>
          </div>

          <div className="evaluator-area">
            <span>
              EVALUATED BY
            </span>

            <strong>
              {evaluation?.evaluatorName ||
                "Evaluation pending"}
            </strong>

            <p>
              {evaluation?.remarks ||
                "Final evaluator remarks will appear here once your project review is completed."}
            </p>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="summary-grid">
          <article>
            <Gauge size={21} />

            <span>
              Overall Score
            </span>

            <strong>
              {totalScore ??
                "—"}
            </strong>
          </article>

          <article>
            <Star size={21} />

            <span>
              Final Grade
            </span>

            <strong>
              {grade}
            </strong>
          </article>

          <article>
            <Target size={21} />

            <span>
              Approved Tasks
            </span>

            <strong>
              {
                summary.approvedTasks
              }
            </strong>
          </article>

          <article>
            <TrendingUp
              size={21}
            />

            <span>
              Project Status
            </span>

            <strong className="status-text">
              {statusLabel(
                student.status,
              )}
            </strong>
          </article>
        </section>

        {/* METRICS */}

        <section className="metrics-grid">
          {metrics.map(
            (metric) => {
              const value =
                metric.value;

              const scorePercent =
                percentage(
                  value,
                  metric.max,
                );

              return (
                <article
                  key={
                    metric.label
                  }
                  className="metric-card"
                >
                  <div className="metric-top">
                    <div>
                      <span>
                        EVALUATION
                        METRIC
                      </span>

                      <h3>
                        {
                          metric.label
                        }
                      </h3>
                    </div>

                    <strong>
                      {value ===
                        null ||
                      value ===
                        undefined
                        ? "—"
                        : value}

                      <small>
                        /
                        {
                          metric.max
                        }
                      </small>
                    </strong>
                  </div>

                  <p>
                    {
                      metric.description
                    }
                  </p>

                  <div className="metric-progress">
                    <div
                      style={{
                        width: `${scorePercent}%`,
                      }}
                    />
                  </div>

                  <div className="metric-bottom">
                    <span>
                      {value ===
                        null ||
                      value ===
                        undefined
                        ? "Not evaluated"
                        : `${Math.round(
                            scorePercent,
                          )}% achieved`}
                    </span>

                    <strong>
                      Max{" "}
                      {
                        metric.max
                      }
                    </strong>
                  </div>
                </article>
              );
            },
          )}
        </section>

        {/* SCORE BREAKDOWN */}

        <section className="panel score-breakdown">
          <div className="panel-heading">
            <div>
              <p>
                SCORE BREAKDOWN
              </p>

              <h3>
                100-Point
                Evaluation
                Framework
              </h3>
            </div>

            <BarChart3
              size={22}
            />
          </div>

          <div className="breakdown-list">
            {metrics.map(
              (metric) => (
                <div
                  key={
                    metric.label
                  }
                >
                  <div>
                    <span>
                      {
                        metric.label
                      }
                    </span>

                    <small>
                      {
                        metric.max
                      }{" "}
                      points
                    </small>
                  </div>

                  <strong>
                    {metric.value ===
                      null ||
                    metric.value ===
                      undefined
                      ? "—"
                      : metric.value}
                  </strong>
                </div>
              ),
            )}

            <div className="total-row">
              <div>
                <span>
                  TOTAL
                </span>

                <small>
                  Final
                  evaluation
                </small>
              </div>

              <strong>
                {totalScore ??
                  "—"}
                /100
              </strong>
            </div>
          </div>
        </section>

        {/* REMARKS */}

        <section className="two-column">
          <article className="panel remarks-panel">
            <div className="panel-heading">
              <div>
                <p>
                  FINAL REMARKS
                </p>

                <h3>
                  Evaluator
                  Comments
                </h3>
              </div>
            </div>

            <div className="remarks-box">
              {evaluation?.remarks ||
                "No final remarks have been published yet."}
            </div>
          </article>

          <article className="panel next-panel">
            <div className="panel-heading">
              <div>
                <p>
                  NEXT STEPS
                </p>

                <h3>
                  Project
                  Completion
                </h3>
              </div>
            </div>

            <div className="next-list">
              <div>
                <span>01</span>

                <p>
                  Complete all
                  remaining weekly
                  tasks.
                </p>
              </div>

              <div>
                <span>02</span>

                <p>
                  Resolve any
                  revision
                  requests from
                  evaluators.
                </p>
              </div>

              <div>
                <span>03</span>

                <p>
                  Complete the
                  final
                  presentation and
                  evaluation.
                </p>
              </div>

              <div>
                <span>04</span>

                <p>
                  Receive your
                  verified KRVÉ
                  completion
                  certificate.
                </p>
              </div>
            </div>

            <a href="/certificate">
              View Certificate
              Status
            </a>
          </article>
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

        .performance-page {
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

        .student-card {
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

        .student-card strong {
          display: block;
          max-width: 155px;
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .student-card span {
          display: block;
          margin-top: 4px;
          color: #8c98a9;
          font-size: 9px;
        }

        .nav-title {
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

        /* MAIN */

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

        /* HERO */

        .performance-hero {
          display: grid;
          grid-template-columns:
            0.75fr
            0.45fr
            1.2fr;
          gap: 24px;
          margin-top: 26px;
          padding: 34px;
          border-radius: 19px;
          background:
            radial-gradient(
              circle at 88% 18%,
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

        .score-area,
        .grade-area,
        .evaluator-area {
          display: flex;
          justify-content: center;
          flex-direction: column;
        }

        .score-area p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .score-area h2 {
          margin: 9px 0 4px;
          font-size: 54px;
          line-height: 1;
        }

        .score-area h2 span {
          color: #8fa9e7;
          font-size: 20px;
          font-weight: 500;
        }

        .score-area > strong {
          color: #aec3f5;
          font-size: 11px;
        }

        .grade-area {
          padding-left: 24px;
          border-left:
            1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
        }

        .grade-area span,
        .evaluator-area span {
          color: #9eb3df;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .grade-area strong {
          margin-top: 7px;
          font-size: 36px;
        }

        .evaluator-area {
          padding-left: 24px;
          border-left:
            1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
        }

        .evaluator-area strong {
          margin-top: 7px;
          font-size: 13px;
        }

        .evaluator-area p {
          margin: 9px 0 0;
          color:
            rgba(
              255,
              255,
              255,
              0.62
            );
          font-size: 9px;
          line-height: 1.7;
        }

        /* SUMMARY */

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .summary-grid article {
          min-height: 130px;
          padding: 20px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
        }

        .summary-grid svg {
          color: #2b5bd4;
        }

        .summary-grid span {
          display: block;
          margin-top: 15px;
          color: #808c9f;
          font-size: 9px;
        }

        .summary-grid strong {
          display: block;
          margin-top: 5px;
          font-size: 24px;
        }

        .summary-grid .status-text {
          font-size: 16px;
        }

        /* METRICS */

        .metrics-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .metric-card {
          padding: 21px;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .metric-top {
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        .metric-top span {
          color: #2b5acf;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .metric-top h3 {
          margin: 6px 0 0;
          font-size: 15px;
        }

        .metric-top > strong {
          color: #2057d0;
          font-size: 24px;
        }

        .metric-top small {
          color: #98a3b3;
          font-size: 10px;
        }

        .metric-card > p {
          min-height: 46px;
          margin: 13px 0 0;
          color: #7b8799;
          font-size: 9px;
          line-height: 1.6;
        }

        .metric-progress {
          height: 7px;
          margin-top: 17px;
          overflow: hidden;
          border-radius: 50px;
          background: #edf1f6;
        }

        .metric-progress div {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #2054d0,
              #7197ff
            );
        }

        .metric-bottom {
          display: flex;
          justify-content: space-between;
          margin-top: 9px;
        }

        .metric-bottom span,
        .metric-bottom strong {
          color: #929dae;
          font-size: 8px;
        }

        /* PANELS */

        .panel {
          border:
            1px solid #dfe5ed;
          border-radius: 16px;
          background: #fff;
        }

        .score-breakdown {
          margin-top: 17px;
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

        .breakdown-list {
          margin-top: 20px;
        }

        .breakdown-list > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px 0;
          border-top:
            1px solid #edf0f5;
        }

        .breakdown-list span {
          display: block;
          color: #53627a;
          font-size: 10px;
          font-weight: 700;
        }

        .breakdown-list small {
          display: block;
          margin-top: 4px;
          color: #9aa4b4;
          font-size: 8px;
        }

        .breakdown-list strong {
          color: #2358d0;
          font-size: 14px;
        }

        .breakdown-list .total-row {
          margin-top: 4px;
          padding: 16px 13px;
          border: 0;
          border-radius: 10px;
          background: #f4f7fd;
        }

        .breakdown-list
          .total-row
          strong {
          font-size: 20px;
        }

        /* BOTTOM */

        .two-column {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 16px;
          margin-top: 17px;
        }

        .remarks-panel,
        .next-panel {
          padding: 24px;
        }

        .remarks-box {
          min-height: 160px;
          margin-top: 19px;
          padding: 16px;
          border-radius: 10px;
          background: #f7f9fc;
          color: #6c798d;
          font-size: 10px;
          line-height: 1.8;
        }

        .next-list {
          margin-top: 19px;
        }

        .next-list > div {
          display: grid;
          grid-template-columns:
            30px 1fr;
          gap: 10px;
          padding: 12px 0;
          border-top:
            1px solid #edf0f5;
        }

        .next-list span {
          color: #295bd1;
          font-size: 8px;
          font-weight: 900;
        }

        .next-list p {
          margin: 0;
          color: #6f7c90;
          font-size: 9px;
          line-height: 1.6;
        }

        .next-panel > a {
          display: inline-flex;
          margin-top: 16px;
          color: #2658ce;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
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
          max-width: 1100px
        ) {
          .performance-hero {
            grid-template-columns:
              1fr 1fr;
          }

          .evaluator-area {
            grid-column:
              1 / -1;
            padding:
              20px 0 0;
            border-top:
              1px solid
              rgba(
                255,
                255,
                255,
                0.15
              );
            border-left: 0;
          }

          .summary-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .metrics-grid {
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
            padding:
              0 17px 40px;
          }

          .two-column {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 560px
        ) {
          .performance-hero,
          .summary-grid,
          .metrics-grid {
            grid-template-columns:
              1fr;
          }

          .grade-area {
            padding:
              18px 0 0;
            border-top:
              1px solid
              rgba(
                255,
                255,
                255,
                0.15
              );
            border-left: 0;
          }

          .performance-hero,
          .score-breakdown,
          .remarks-panel,
          .next-panel {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}
