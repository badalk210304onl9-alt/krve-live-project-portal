"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
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
    return "Not available";
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
      month: "long",
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

/* =========================================================
   PAGE
========================================================= */

export default function CertificatePage() {
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
            "Unable to refresh certificate status.",
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
          : "Unable to refresh certificate status.",
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
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="certificate-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading certificate
          status...
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

          .certificate-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .certificate-loading
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

  const certificateIssued =
    Boolean(
      student.certificateId,
    );

  const finalScore =
    student.evaluation
      ?.totalScore ?? null;

  const finalGrade =
    student.evaluation?.grade ||
    "Pending";

  return (
    <main className="certificate-page">
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
                    "/certificate"
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
              PROJECT
              CERTIFICATION
            </p>

            <h1>
              Certificate
            </h1>

            <span>
              View your KRVÉ Live
              Business Project
              completion
              certificate and
              verification
              details.
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

        {certificateIssued ? (
          <>
            {/* CERTIFICATE */}

            <section className="certificate-wrap">
              <article className="certificate-card">
                <div className="certificate-border">
                  <header className="certificate-top">
                    <div>
                      <strong>
                        KRVÉ
                      </strong>

                      <span>
                        THE FASHION
                        STUDIO
                      </span>
                    </div>

                    <Award
                      size={48}
                    />
                  </header>

                  <div className="certificate-center">
                    <p>
                      CERTIFICATE OF
                      COMPLETION
                    </p>

                    <span className="certificate-intro">
                      This is to
                      certify that
                    </span>

                    <h2>
                      {
                        student.fullName
                      }
                    </h2>

                    <span className="certificate-copy">
                      has
                      successfully
                      completed the
                      KRVÉ Live
                      Business
                      Project
                      Program and
                      fulfilled the
                      project
                      requirements
                      assigned by
                      KRVÉ — The
                      Fashion
                      Studio.
                    </span>

                    <div className="project-name">
                      <span>
                        PROJECT
                      </span>

                      <strong>
                        {student.projectTitle ||
                          "KRVÉ Live Business Project"}
                      </strong>
                    </div>
                  </div>

                  <section className="certificate-details">
                    <div>
                      <span>
                        DEPARTMENT
                      </span>

                      <strong>
                        {student.assignedDepartment ||
                          "General"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        PROJECT CODE
                      </span>

                      <strong>
                        {student.projectCode ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        DURATION
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

                    <div>
                      <span>
                        FINAL GRADE
                      </span>

                      <strong>
                        {
                          finalGrade
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        FINAL SCORE
                      </span>

                      <strong>
                        {finalScore ??
                          "—"}
                        {finalScore !==
                          null
                          ? "/100"
                          : ""}
                      </strong>
                    </div>

                    <div>
                      <span>
                        ISSUE DATE
                      </span>

                      <strong>
                        {formatDate(
                          student.certificateIssueDate,
                        )}
                      </strong>
                    </div>
                  </section>

                  <footer className="certificate-footer">
                    <div>
                      <span>
                        CERTIFICATE ID
                      </span>

                      <strong>
                        {
                          student.certificateId
                        }
                      </strong>
                    </div>

                    <div className="verified">
                      <ShieldCheck
                        size={18}
                      />

                      Verified by
                      KRVÉ
                    </div>
                  </footer>
                </div>
              </article>
            </section>

            {/* VERIFICATION */}

            <section className="info-grid">
              <article className="panel">
                <div className="info-icon green">
                  <CheckCircle2
                    size={22}
                  />
                </div>

                <div>
                  <p>
                    VERIFICATION
                    STATUS
                  </p>

                  <h3>
                    Verified
                    Certificate
                  </h3>

                  <span>
                    This certificate
                    has a unique
                    Certificate ID
                    linked to the
                    student's Live
                    Project record.
                  </span>
                </div>
              </article>

              <article className="panel">
                <div className="info-icon blue">
                  <Award
                    size={22}
                  />
                </div>

                <div>
                  <p>
                    CERTIFICATE ID
                  </p>

                  <h3>
                    {
                      student.certificateId
                    }
                  </h3>

                  <span>
                    Use this ID for
                    future
                    verification
                    and reference.
                  </span>
                </div>
              </article>

              <article className="panel">
                <div className="info-icon purple">
                  <BarChart3
                    size={22}
                  />
                </div>

                <div>
                  <p>
                    FINAL
                    PERFORMANCE
                  </p>

                  <h3>
                    {finalScore ??
                      "—"}
                    {finalScore !==
                      null
                      ? "/100"
                      : ""}
                  </h3>

                  <span>
                    Final Grade:{" "}
                    {
                      finalGrade
                    }
                  </span>
                </div>
              </article>
            </section>
          </>
        ) : (
          <>
            {/* PENDING HERO */}

            <section className="pending-hero">
              <div className="pending-icon">
                <Award
                  size={37}
                />
              </div>

              <p>
                CERTIFICATE STATUS
              </p>

              <h2>
                Certificate
                Pending
              </h2>

              <span>
                Your KRVÉ Live
                Business Project
                certificate has
                not been issued
                yet. It will
                appear here after
                successful project
                completion and
                final evaluation.
              </span>

              <div className="pending-status">
                <div>
                  <span>
                    PROJECT STATUS
                  </span>

                  <strong>
                    {statusLabel(
                      student.status,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    APPROVED TASKS
                  </span>

                  <strong>
                    {
                      summary.approvedTasks
                    }
                    /
                    {
                      summary.assignedTasks
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    FINAL SCORE
                  </span>

                  <strong>
                    {finalScore ??
                      "Pending"}
                  </strong>
                </div>

                <div>
                  <span>
                    FINAL GRADE
                  </span>

                  <strong>
                    {
                      finalGrade
                    }
                  </strong>
                </div>
              </div>
            </section>

            {/* REQUIREMENTS */}

            <section className="two-column">
              <article className="panel requirement-panel">
                <div className="panel-heading">
                  <div>
                    <p>
                      COMPLETION
                      REQUIREMENTS
                    </p>

                    <h3>
                      Before
                      Certificate
                      Issuance
                    </h3>
                  </div>
                </div>

                <div className="requirement-list">
                  <Requirement
                    number="01"
                    title="Complete Assigned Tasks"
                    description="All required project tasks should be completed and submitted."
                  />

                  <Requirement
                    number="02"
                    title="Resolve Revisions"
                    description="Any revision requests from evaluators should be completed."
                  />

                  <Requirement
                    number="03"
                    title="Final Evaluation"
                    description="Your final performance assessment must be completed."
                  />

                  <Requirement
                    number="04"
                    title="Project Completion"
                    description="The project must be marked completed by the KRVÉ project team."
                  />

                  <Requirement
                    number="05"
                    title="Certificate Issuance"
                    description="After approval, a unique Certificate ID and issue date will appear here."
                  />
                </div>
              </article>

              <article className="panel status-panel">
                <div className="panel-heading">
                  <div>
                    <p>
                      YOUR PROGRESS
                    </p>

                    <h3>
                      Current
                      Certificate
                      Readiness
                    </h3>
                  </div>
                </div>

                <div className="status-list">
                  <StatusItem
                    label="Project Assigned"
                    complete={Boolean(
                      student.projectCode,
                    )}
                  />

                  <StatusItem
                    label="Tasks Assigned"
                    complete={
                      summary.assignedTasks >
                      0
                    }
                  />

                  <StatusItem
                    label="All Tasks Approved"
                    complete={
                      summary.assignedTasks >
                        0 &&
                      summary.approvedTasks ===
                        summary.assignedTasks
                    }
                  />

                  <StatusItem
                    label="Final Evaluation"
                    complete={Boolean(
                      student.evaluation,
                    )}
                  />

                  <StatusItem
                    label="Certificate Issued"
                    complete={
                      certificateIssued
                    }
                  />
                </div>

                <a href="/performance">
                  View Performance
                </a>
              </article>
            </section>
          </>
        )}
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

        .certificate-page {
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

        .main-content {
          min-height: 100vh;
          margin-left: 265px;
          padding: 0 36px 55px;
        }

        .page-header {
          display: flex;
          min-height: 125px;
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

        .certificate-wrap {
          margin-top: 28px;
        }

        .certificate-card {
          max-width: 1000px;
          margin: 0 auto;
          padding: 13px;
          border:
            1px solid #d7dde7;
          background: #f9fafc;
          box-shadow:
            0 24px 70px
            rgba(
              18,
              43,
              84,
              0.08
            );
        }

        .certificate-border {
          padding: 47px;
          border:
            2px solid #244f9c;
          background:
            linear-gradient(
              135deg,
              #ffffff,
              #fbfcff
            );
        }

        .certificate-top {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          color: #123f8e;
        }

        .certificate-top
          div
          strong {
          display: block;
          font-size: 23px;
          letter-spacing: 0.15em;
        }

        .certificate-top
          div
          span {
          display: block;
          margin-top: 3px;
          color: #7e8ba0;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.2em;
        }

        .certificate-center {
          max-width: 760px;
          margin:
            58px auto 0;
          text-align: center;
        }

        .certificate-center
          > p {
          margin: 0;
          color: #2856a8;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.25em;
        }

        .certificate-intro {
          display: block;
          margin-top: 30px;
          color: #798597;
          font-size: 11px;
        }

        .certificate-center
          h2 {
          margin:
            13px 0;
          color: #16213a;
          font-family:
            Georgia,
            "Times New Roman",
            serif;
          font-size: 48px;
          font-weight: 400;
        }

        .certificate-copy {
          display: block;
          max-width: 640px;
          margin: 0 auto;
          color: #687589;
          font-size: 11px;
          line-height: 1.8;
        }

        .project-name {
          margin-top: 30px;
          padding: 17px;
          border-top:
            1px solid #e1e6ee;
          border-bottom:
            1px solid #e1e6ee;
        }

        .project-name span {
          display: block;
          color: #8d98a9;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .project-name strong {
          display: block;
          margin-top: 7px;
          color: #264b88;
          font-size: 14px;
        }

        .certificate-details {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 11px;
          margin-top: 38px;
        }

        .certificate-details
          > div {
          padding: 13px;
          border:
            1px solid #e2e7ee;
          background: #fafcff;
        }

        .certificate-details
          span,
        .certificate-footer
          span {
          display: block;
          color: #939eae;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .certificate-details
          strong {
          display: block;
          margin-top: 5px;
          color: #3d4a5f;
          font-size: 9px;
          line-height: 1.5;
        }

        .certificate-footer {
          display: flex;
          align-items: flex-end;
          justify-content:
            space-between;
          gap: 20px;
          margin-top: 38px;
          padding-top: 22px;
          border-top:
            1px solid #e0e5ed;
        }

        .certificate-footer
          strong {
          display: block;
          margin-top: 6px;
          color: #173f86;
          font-size: 11px;
        }

        .verified {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border-radius: 30px;
          background: #eaf8f0;
          color: #227c4f;
          font-size: 9px;
          font-weight: 800;
        }

        .info-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 14px;
          max-width: 1000px;
          margin: 18px auto 0;
        }

        .panel {
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .info-grid .panel {
          display: flex;
          min-height: 145px;
          gap: 13px;
          padding: 20px;
        }

        .info-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          place-items: center;
          border-radius: 11px;
        }

        .info-icon.green {
          background: #eaf8f0;
          color: #258855;
        }

        .info-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .info-icon.purple {
          background: #f3efff;
          color: #6e4bd6;
        }

        .info-grid p {
          margin: 0;
          color: #2b59cd;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.12em;
        }

        .info-grid h3 {
          margin: 7px 0 5px;
          font-size: 14px;
        }

        .info-grid span {
          color: #7c899b;
          font-size: 9px;
          line-height: 1.6;
        }

        .pending-hero {
          max-width: 900px;
          margin:
            28px auto 0;
          padding:
            50px 40px;
          border:
            1px solid #dfe5ed;
          border-radius: 20px;
          background: #fff;
          text-align: center;
        }

        .pending-icon {
          display: grid;
          width: 70px;
          height: 70px;
          margin: 0 auto;
          place-items: center;
          border-radius: 19px;
          background: #edf3ff;
          color: #2b5bd1;
        }

        .pending-hero
          > p {
          margin:
            23px 0 0;
          color: #2959d1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .pending-hero h2 {
          margin:
            9px 0;
          font-size: 31px;
        }

        .pending-hero
          > span {
          display: block;
          max-width: 630px;
          margin: 0 auto;
          color: #7b8799;
          font-size: 10px;
          line-height: 1.75;
        }

        .pending-status {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 10px;
          margin-top: 32px;
          text-align: left;
        }

        .pending-status
          > div {
          padding: 14px;
          border:
            1px solid #e6ebf1;
          border-radius: 10px;
          background: #fafcff;
        }

        .pending-status
          span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .pending-status
          strong {
          display: block;
          margin-top: 5px;
          color: #3e4c62;
          font-size: 11px;
        }

        .two-column {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 16px;
          max-width: 1000px;
          margin: 18px auto 0;
        }

        .requirement-panel,
        .status-panel {
          padding: 24px;
        }

        .panel-heading h3 {
          margin: 7px 0 0;
          font-size: 17px;
        }

        .requirement-list,
        .status-list {
          margin-top: 20px;
        }

        .requirement-item {
          display: grid;
          grid-template-columns:
            35px 1fr;
          gap: 11px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
        }

        .requirement-item
          > span {
          color: #2b5bd2;
          font-size: 8px;
          font-weight: 900;
        }

        .requirement-item
          strong {
          display: block;
          font-size: 10px;
        }

        .requirement-item p {
          margin: 5px 0 0;
          color: #7b8799;
          font-size: 9px;
          line-height: 1.55;
        }

        .status-item {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 14px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
        }

        .status-item
          span:first-child {
          color: #607087;
          font-size: 10px;
        }

        .status-chip {
          padding: 6px 9px;
          border-radius: 40px;
          font-size: 7px;
          font-weight: 900;
        }

        .status-chip.complete {
          background: #eaf8f0;
          color: #21804f;
        }

        .status-chip.pending {
          background: #fff3df;
          color: #b66e17;
        }

        .status-panel > a {
          display: inline-flex;
          margin-top: 18px;
          color: #2759ce;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
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
          max-width: 1080px
        ) {
          .certificate-details {
            grid-template-columns:
              1fr 1fr;
          }

          .info-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .pending-status {
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
          .certificate-border {
            padding: 28px 18px;
          }

          .certificate-center
            h2 {
            font-size: 34px;
          }

          .certificate-details,
          .info-grid,
          .pending-status {
            grid-template-columns:
              1fr;
          }

          .certificate-footer {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .pending-hero {
            padding:
              35px 20px;
          }

          .requirement-panel,
          .status-panel {
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

function Requirement({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="requirement-item">
      <span>
        {number}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="status-item">
      <span>
        {label}
      </span>

      <span
        className={`status-chip ${
          complete
            ? "complete"
            : "pending"
        }`}
      >
        {complete
          ? "COMPLETE"
          : "PENDING"}
      </span>
    </div>
  );
}
