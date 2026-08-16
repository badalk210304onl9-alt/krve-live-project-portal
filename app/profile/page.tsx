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
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileCheck2,
  Hash,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Phone,
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

export default function ProfilePage() {
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
    copied,
    setCopied,
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
     REFRESH PORTAL
  ======================================================= */

  async function refreshPortal(
    credentials: StudentCredentials,
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
            "Unable to refresh profile.",
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
          : "Unable to refresh profile.",
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
     COPY
  ======================================================= */

  async function copyValue(
    value: string | null | undefined,
    key: string,
  ) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(
        key,
      );

      window.setTimeout(
        () => {
          setCopied("");
        },
        1400,
      );
    } catch {
      setError(
        "Unable to copy information.",
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="profile-loading">
        <Loader2
          size={30}
          className="spin"
        />

        <span>
          Loading student
          profile...
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

          .profile-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .profile-loading span {
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

  const finalScore =
    student.evaluation
      ?.totalScore ?? null;

  const finalGrade =
    student.evaluation?.grade ||
    "Pending";

  const certificateIssued =
    Boolean(
      student.certificateId,
    );

  return (
    <main className="profile-page">
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
                    "/profile"
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

      {/* MAIN CONTENT */}

      <section className="main-content">
        <header className="page-header">
          <div>
            <p>
              STUDENT ACCOUNT
            </p>

            <h1>
              My Profile
            </h1>

            <span>
              View your identity,
              project allocation
              and Live Project
              record.
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

        {/* PROFILE HERO */}

        <section className="profile-hero">
          <div className="profile-avatar">
            {student.fullName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-main">
            <p>
              KRVÉ LIVE PROJECT
              STUDENT
            </p>

            <h2>
              {student.fullName}
            </h2>

            <div className="hero-tags">
              <span>
                {student.assignedDepartment ||
                  "Department Pending"}
              </span>

              <span>
                {statusLabel(
                  student.status,
                )}
              </span>
            </div>
          </div>

          <div className="verified-card">
            <ShieldCheck
              size={24}
            />

            <div>
              <span>
                PORTAL PROFILE
              </span>

              <strong>
                Verified Record
              </strong>
            </div>
          </div>
        </section>

        {/* QUICK SUMMARY */}

        <section className="summary-grid">
          <SummaryCard
            label="Assigned Tasks"
            value={String(
              summary.assignedTasks,
            )}
            icon={
              <ClipboardList
                size={20}
              />
            }
          />

          <SummaryCard
            label="Approved Tasks"
            value={String(
              summary.approvedTasks,
            )}
            icon={
              <CheckCircle2
                size={20}
              />
            }
          />

          <SummaryCard
            label="Final Score"
            value={
              finalScore === null
                ? "Pending"
                : `${finalScore}/100`
            }
            icon={
              <BarChart3
                size={20}
              />
            }
          />

          <SummaryCard
            label="Certificate"
            value={
              certificateIssued
                ? "Issued"
                : "Pending"
            }
            icon={
              <Award
                size={20}
              />
            }
          />
        </section>

        {/* PERSONAL DETAILS */}

        <section className="content-grid">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  PERSONAL DETAILS
                </p>

                <h3>
                  Student
                  Information
                </h3>
              </div>

              <UserRound
                size={22}
              />
            </div>

            <div className="details-list">
              <ProfileRow
                icon={
                  <UserRound
                    size={17}
                  />
                }
                label="Full Name"
                value={
                  student.fullName
                }
              />

              <ProfileRow
                icon={
                  <Mail
                    size={17}
                  />
                }
                label="Email Address"
                value={
                  session.credentials
                    .email ||
                  "Not available"
                }
              />

              <ProfileRow
                icon={
                  <Phone
                    size={17}
                  />
                }
                label="Mobile Number"
                value={
                  session.credentials
                    .phone ||
                  "Not available"
                }
              />

              <ProfileRow
                icon={
                  <Hash
                    size={17}
                  />
                }
                label="Application ID"
                value={
                  student.applicationNumber
                }
                action={
                  <CopyButton
                    active={
                      copied ===
                      "application"
                    }
                    onClick={() =>
                      copyValue(
                        student.applicationNumber,
                        "application",
                      )
                    }
                  />
                }
              />
            </div>
          </article>

          {/* PROJECT ALLOCATION */}

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  PROJECT
                  ALLOCATION
                </p>

                <h3>
                  Assigned Project
                </h3>
              </div>

              <BriefcaseBusiness
                size={22}
              />
            </div>

            <div className="details-list">
              <ProfileRow
                icon={
                  <BookOpen
                    size={17}
                  />
                }
                label="Project Title"
                value={
                  student.projectTitle ||
                  "Not assigned"
                }
              />

              <ProfileRow
                icon={
                  <Hash
                    size={17}
                  />
                }
                label="Project Code"
                value={
                  student.projectCode ||
                  "Not assigned"
                }
                action={
                  student.projectCode ? (
                    <CopyButton
                      active={
                        copied ===
                        "project"
                      }
                      onClick={() =>
                        copyValue(
                          student.projectCode,
                          "project",
                        )
                      }
                    />
                  ) : undefined
                }
              />

              <ProfileRow
                icon={
                  <BriefcaseBusiness
                    size={17}
                  />
                }
                label="Department"
                value={
                  student.assignedDepartment ||
                  "Pending"
                }
              />

              <ProfileRow
                icon={
                  <CheckCircle2
                    size={17}
                  />
                }
                label="Project Status"
                value={statusLabel(
                  student.status,
                )}
              />
            </div>
          </article>

          {/* PROJECT TIMELINE */}

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  PROJECT TIMELINE
                </p>

                <h3>
                  Program Period
                </h3>
              </div>

              <CalendarDays
                size={22}
              />
            </div>

            <div className="timeline-box">
              <div>
                <span>
                  START DATE
                </span>

                <strong>
                  {formatDate(
                    student.startDate,
                  )}
                </strong>
              </div>

              <div className="timeline-line">
                <span />
              </div>

              <div>
                <span>
                  END DATE
                </span>

                <strong>
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
            </a>
          </article>

          {/* REFERRAL */}

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  SALES IDENTITY
                </p>

                <h3>
                  Referral Code
                </h3>
              </div>

              <BriefcaseBusiness
                size={22}
              />
            </div>

            <div className="referral-box">
              <span>
                YOUR REFERRAL CODE
              </span>

              <strong>
                {student.referralCode ||
                  "Not assigned"}
              </strong>

              {student.referralCode && (
                <button
                  type="button"
                  onClick={() =>
                    copyValue(
                      student.referralCode,
                      "referral",
                    )
                  }
                >
                  <Copy
                    size={15}
                  />

                  {copied ===
                  "referral"
                    ? "Copied"
                    : "Copy Code"}
                </button>
              )}
            </div>

            <a
              href="/sales"
              className="panel-link"
            >
              View Sales & Impact
            </a>
          </article>
        </section>

        {/* PERFORMANCE */}

        <section className="bottom-grid">
          <article className="panel performance-panel">
            <div className="panel-heading">
              <div>
                <p>
                  PERFORMANCE
                </p>

                <h3>
                  Final Evaluation
                </h3>
              </div>

              <BarChart3
                size={22}
              />
            </div>

            <div className="performance-values">
              <div>
                <span>
                  FINAL SCORE
                </span>

                <strong>
                  {finalScore ??
                    "—"}

                  {finalScore !==
                  null && (
                    <small>
                      /100
                    </small>
                  )}
                </strong>
              </div>

              <div>
                <span>
                  FINAL GRADE
                </span>

                <strong>
                  {finalGrade}
                </strong>
              </div>

              <div>
                <span>
                  BUSINESS IMPACT
                </span>

                <strong>
                  {student
                    .evaluation
                    ?.businessImpact ??
                    "—"}

                  {student
                    .evaluation
                    ?.businessImpact !==
                    null &&
                    student
                      .evaluation
                      ?.businessImpact !==
                      undefined && (
                      <small>
                        /20
                      </small>
                    )}
                </strong>
              </div>
            </div>

            <a
              href="/performance"
              className="panel-link"
            >
              View Full Performance
            </a>
          </article>

          {/* CERTIFICATE */}

          <article className="panel certificate-panel">
            <div className="panel-heading">
              <div>
                <p>
                  CERTIFICATION
                </p>

                <h3>
                  Certificate
                  Status
                </h3>
              </div>

              <Award
                size={22}
              />
            </div>

            <div
              className={`certificate-status ${
                certificateIssued
                  ? "issued"
                  : "pending"
              }`}
            >
              {certificateIssued ? (
                <CheckCircle2
                  size={26}
                />
              ) : (
                <Award
                  size={26}
                />
              )}

              <div>
                <span>
                  {certificateIssued
                    ? "CERTIFICATE ISSUED"
                    : "CERTIFICATE PENDING"}
                </span>

                <strong>
                  {certificateIssued
                    ? student.certificateId
                    : "Complete the project requirements"}
                </strong>

                {certificateIssued && (
                  <small>
                    Issued on{" "}
                    {formatDate(
                      student.certificateIssueDate,
                    )}
                  </small>
                )}
              </div>
            </div>

            <a
              href="/certificate"
              className="panel-link"
            >
              View Certificate
            </a>
          </article>
        </section>

        {/* ACCOUNT NOTICE */}

        <section className="account-notice">
          <ShieldCheck
            size={22}
          />

          <div>
            <strong>
              Student Portal
              Record
            </strong>

            <span>
              Your project,
              evaluation and
              certificate
              information is
              controlled through
              the KRVÉ Live Project
              system. If any
              profile information
              is incorrect, contact
              the project
              coordinator instead
              of creating another
              application.
            </span>
          </div>
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

        .profile-page {
          min-height: 100vh;
        }

        /* ============================
           SIDEBAR
        ============================ */

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

        /* ============================
           MAIN
        ============================ */

        .main-content {
          min-height: 100vh;
          margin-left: 265px;
          padding:
            0 36px 55px;
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

        .page-header p,
        .panel-heading p {
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

        .page-header
          > div
          > span {
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

        /* ============================
           PROFILE HERO
        ============================ */

        .profile-hero {
          display: flex;
          min-height: 190px;
          align-items: center;
          gap: 24px;
          margin-top: 26px;
          padding: 32px;
          border-radius: 19px;
          background:
            radial-gradient(
              circle at 88% 15%,
              rgba(
                87,
                137,
                255,
                0.45
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

        .profile-avatar {
          display: grid;
          width: 92px;
          height: 92px;
          flex: 0 0 92px;
          place-items: center;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.2
            );
          border-radius: 24px;
          background:
            rgba(
              255,
              255,
              255,
              0.1
            );
          font-size: 35px;
          font-weight: 900;
        }

        .profile-main {
          flex: 1;
        }

        .profile-main p {
          margin: 0;
          color: #a7bdf0;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .profile-main h2 {
          margin:
            9px 0 12px;
          font-size: 29px;
        }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .hero-tags span {
          padding:
            7px 10px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
          border-radius: 50px;
          background:
            rgba(
              255,
              255,
              255,
              0.08
            );
          color: #d9e4ff;
          font-size: 8px;
          font-weight: 700;
        }

        .verified-card {
          display: flex;
          min-width: 200px;
          align-items: center;
          gap: 11px;
          padding: 17px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.15
            );
          border-radius: 13px;
          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .verified-card span {
          display: block;
          color: #9fb4e4;
          font-size: 7px;
          font-weight: 900;
        }

        .verified-card strong {
          display: block;
          margin-top: 4px;
          font-size: 10px;
        }

        /* ============================
           SUMMARY
        ============================ */

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .summary-card {
          display: flex;
          min-height: 112px;
          align-items: center;
          gap: 13px;
          padding: 18px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
        }

        .summary-card-icon {
          display: grid;
          width: 41px;
          height: 41px;
          flex: 0 0 41px;
          place-items: center;
          border-radius: 11px;
          background: #edf3ff;
          color: #2d60dd;
        }

        .summary-card span {
          color: #8995a7;
          font-size: 8px;
        }

        .summary-card strong {
          display: block;
          margin-top: 5px;
          font-size: 18px;
        }

        /* ============================
           PANELS
        ============================ */

        .content-grid,
        .bottom-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 16px;
          margin-top: 17px;
        }

        .panel {
          padding: 24px;
          border:
            1px solid #dfe5ed;
          border-radius: 16px;
          background: #fff;
        }

        .panel-heading {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 20px;
        }

        .panel-heading svg {
          color: #4166aa;
        }

        .panel-heading h3 {
          margin:
            7px 0 0;
          font-size: 17px;
        }

        /* ============================
           PROFILE ROW
        ============================ */

        .details-list {
          margin-top: 20px;
        }

        .profile-row {
          display: grid;
          grid-template-columns:
            35px 1fr auto;
          align-items: center;
          gap: 10px;
          min-height: 63px;
          border-top:
            1px solid #edf0f5;
        }

        .row-icon {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border-radius: 8px;
          background: #f1f5fb;
          color: #5e76a2;
        }

        .profile-row label {
          display: block;
          color: #9aa4b4;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .profile-row strong {
          display: block;
          margin-top: 5px;
          color: #445269;
          font-size: 10px;
          line-height: 1.4;
        }

        .copy-small {
          display: inline-flex;
          min-width: 65px;
          height: 30px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border:
            1px solid #dde4ed;
          border-radius: 7px;
          background: #fff;
          color: #63738a;
          font-size: 8px;
        }

        /* ============================
           TIMELINE
        ============================ */

        .timeline-box {
          display: grid;
          grid-template-columns:
            1fr 90px 1fr;
          align-items: center;
          gap: 12px;
          margin-top: 27px;
          padding: 21px;
          border-radius: 12px;
          background: #f7f9fc;
        }

        .timeline-box
          > div:first-child,
        .timeline-box
          > div:last-child {
          text-align: center;
        }

        .timeline-box span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .timeline-box strong {
          display: block;
          margin-top: 6px;
          color: #435169;
          font-size: 9px;
        }

        .timeline-line {
          height: 2px;
          background: #cdd8eb;
        }

        .timeline-line span {
          display: block;
          width: 9px;
          height: 9px;
          margin:
            -4px auto 0;
          border-radius: 50%;
          background: #2b5bd2;
        }

        .panel-link {
          display: inline-flex;
          margin-top: 18px;
          color: #2859cf;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        /* ============================
           REFERRAL
        ============================ */

        .referral-box {
          margin-top: 22px;
          padding: 21px;
          border:
            1px dashed #b9c8e7;
          border-radius: 12px;
          background: #f6f9ff;
        }

        .referral-box
          > span {
          display: block;
          color: #8d99ab;
          font-size: 7px;
          font-weight: 900;
        }

        .referral-box
          > strong {
          display: block;
          margin-top: 7px;
          color: #15429e;
          font-size: 20px;
          letter-spacing: 0.06em;
        }

        .referral-box button {
          display: inline-flex;
          height: 35px;
          align-items: center;
          gap: 6px;
          margin-top: 15px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: #123e9c;
          color: #fff;
          font-size: 8px;
          font-weight: 800;
        }

        /* ============================
           PERFORMANCE
        ============================ */

        .performance-values {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
          margin-top: 22px;
        }

        .performance-values
          > div {
          padding: 15px;
          border:
            1px solid #e6ebf2;
          border-radius: 10px;
          background: #fafcff;
        }

        .performance-values span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .performance-values strong {
          display: block;
          margin-top: 6px;
          color: #2457ca;
          font-size: 20px;
        }

        .performance-values small {
          color: #98a3b4;
          font-size: 9px;
        }

        /* ============================
           CERTIFICATE
        ============================ */

        .certificate-status {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 22px;
          padding: 18px;
          border-radius: 11px;
        }

        .certificate-status.issued {
          background: #effaf4;
          color: #258252;
        }

        .certificate-status.pending {
          background: #fff7e9;
          color: #ae711e;
        }

        .certificate-status span {
          display: block;
          font-size: 7px;
          font-weight: 900;
        }

        .certificate-status strong {
          display: block;
          margin-top: 5px;
          font-size: 10px;
        }

        .certificate-status small {
          display: block;
          margin-top: 5px;
          font-size: 8px;
        }

        /* ============================
           NOTICE
        ============================ */

        .account-notice {
          display: flex;
          gap: 14px;
          margin-top: 17px;
          padding: 20px;
          border:
            1px solid #d7e4ff;
          border-radius: 14px;
          background: #f7faff;
          color: #315fae;
        }

        .account-notice strong {
          display: block;
          font-size: 10px;
        }

        .account-notice span {
          display: block;
          margin-top: 5px;
          color: #71819a;
          font-size: 9px;
          line-height: 1.65;
        }

        /* ============================
           MOBILE
        ============================ */

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
          .summary-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .profile-hero {
            flex-wrap: wrap;
          }

          .verified-card {
            width: 100%;
          }
        }

        @media (
          max-width: 900px
        ) {
          .content-grid,
          .bottom-grid {
            grid-template-columns:
              1fr;
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
        }

        @media (
          max-width: 560px
        ) {
          .summary-grid,
          .performance-values {
            grid-template-columns:
              1fr;
          }

          .profile-hero {
            align-items:
              flex-start;
            flex-direction:
              column;
            padding: 24px;
          }

          .profile-avatar {
            width: 70px;
            height: 70px;
            flex-basis: 70px;
            border-radius: 18px;
            font-size: 27px;
          }

          .profile-main h2 {
            font-size: 24px;
          }

          .verified-card {
            min-width: 0;
          }

          .panel {
            padding: 20px;
          }

          .timeline-box {
            grid-template-columns:
              1fr;
          }

          .timeline-line {
            width: 2px;
            height: 35px;
            margin: auto;
          }

          .timeline-line span {
            margin:
              13px 0 0 -3px;
          }

          .profile-row {
            grid-template-columns:
              35px 1fr;
          }

          .profile-row
            > :last-child:not(
              .row-main
            ) {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="summary-card">
      <div className="summary-card-icon">
        {icon}
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </article>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="profile-row">
      <div className="row-icon">
        {icon}
      </div>

      <div className="row-main">
        <label>
          {label}
        </label>

        <strong>
          {value}
        </strong>
      </div>

      {action}
    </div>
  );
}

function CopyButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="copy-small"
      onClick={
        onClick
      }
    >
      <Copy size={13} />

      {active
        ? "Copied"
        : "Copy"}
    </button>
  );
}
