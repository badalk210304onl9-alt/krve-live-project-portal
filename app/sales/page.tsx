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
  Copy,
  FileCheck2,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  RefreshCcw,
  ShoppingBag,
  Target,
  TrendingUp,
  UserRound,
  Users,
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

function impactPercentage(
  value?: number | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (value / 20) * 100,
    ),
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SalesPage() {
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
    useState(false);

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

      setSession(parsed);

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
      setLoading(false);
    }
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  async function refreshPortal(
    credentials: StudentCredentials,
    showLoader = true,
  ) {
    if (showLoader) {
      setRefreshing(true);
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
            "Unable to refresh sales data.",
        );
      }

      const portal =
        extractPortalData(data);

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
          : "Unable to refresh sales data.",
      );
    } finally {
      setRefreshing(false);
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
     COPY REFERRAL CODE
  ======================================================= */

  async function copyReferralCode() {
    const code =
      session?.portal.student.referralCode;

    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        code,
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(
            false,
          ),
        1400,
      );
    } catch {
      setError(
        "Unable to copy referral code.",
      );
    }
  }

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const approvedTasks =
    useMemo(() => {
      if (!session) {
        return 0;
      }

      return session.portal.tasks.filter(
        (task) =>
          String(
            task.status,
          ).toLowerCase() ===
          "approved",
      ).length;
    }, [session]);

  if (
    loading ||
    !session
  ) {
    return (
      <main className="sales-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading sales &
          business impact...
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

          .sales-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .sales-loading span {
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
  } = session.portal;

  const businessImpact =
    student.evaluation?.businessImpact ??
    null;

  const impactPercent =
    impactPercentage(
      businessImpact,
    );

  return (
    <main className="sales-page">
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
                    "/sales"
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
              SALES & BUSINESS
              CONTRIBUTION
            </p>

            <h1>
              Sales & Impact
            </h1>

            <span>
              Track your referral
              identity, sales
              contribution and
              business impact.
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

        <section className="impact-hero">
          <div>
            <p>
              BUSINESS
              CONTRIBUTION
            </p>

            <h2>
              Create measurable
              impact beyond task
              completion.
            </h2>

            <span>
              Sales, referrals,
              market activity and
              practical business
              contribution can be
              considered during
              your final project
              evaluation.
            </span>
          </div>

          <div className="impact-score-card">
            <span>
              BUSINESS IMPACT
              SCORE
            </span>

            <strong>
              {businessImpact ??
                "—"}
              <small>
                /20
              </small>
            </strong>

            <div className="hero-progress">
              <div
                style={{
                  width: `${impactPercent}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}

        <section className="summary-grid">
          <article>
            <div className="summary-icon blue">
              <Users size={20} />
            </div>

            <span>
              Attributed Leads
            </span>

            <strong>
              —
            </strong>

            <small>
              Not available yet
            </small>
          </article>

          <article>
            <div className="summary-icon purple">
              <ShoppingBag
                size={20}
              />
            </div>

            <span>
              Attributed Orders
            </span>

            <strong>
              —
            </strong>

            <small>
              Not available yet
            </small>
          </article>

          <article>
            <div className="summary-icon green">
              <IndianRupee
                size={20}
              />
            </div>

            <span>
              Revenue Generated
            </span>

            <strong>
              —
            </strong>

            <small>
              Not available yet
            </small>
          </article>

          <article>
            <div className="summary-icon orange">
              <Target
                size={20}
              />
            </div>

            <span>
              Business Impact
            </span>

            <strong>
              {businessImpact ??
                "—"}
            </strong>

            <small>
              Out of 20
            </small>
          </article>
        </section>

        {/* REFERRAL + IMPACT */}

        <section className="two-column">
          <article className="panel referral-panel">
            <div className="panel-heading">
              <div>
                <p>
                  REFERRAL
                  IDENTITY
                </p>

                <h3>
                  Your Referral
                  Code
                </h3>

                <span>
                  Use the code
                  assigned to your
                  project profile
                  where instructed
                  by the KRVÉ team.
                </span>
              </div>

              <BriefcaseBusiness
                size={22}
              />
            </div>

            <div className="referral-code-box">
              <div>
                <span>
                  REFERRAL CODE
                </span>

                <strong>
                  {student.referralCode ||
                    "Not assigned"}
                </strong>
              </div>

              <button
                type="button"
                onClick={
                  copyReferralCode
                }
                disabled={
                  !student.referralCode
                }
              >
                <Copy size={16} />

                {copied
                  ? "Copied"
                  : "Copy"}
              </button>
            </div>

            {!student.referralCode && (
              <div className="pending-note">
                Your referral code
                has not been
                allocated yet.
              </div>
            )}
          </article>

          <article className="panel impact-panel">
            <div className="panel-heading">
              <div>
                <p>
                  PERFORMANCE
                </p>

                <h3>
                  Business Impact
                </h3>

                <span>
                  This score forms
                  part of the
                  overall
                  100-point
                  performance
                  framework.
                </span>
              </div>

              <TrendingUp
                size={22}
              />
            </div>

            <div className="impact-score-large">
              <strong>
                {businessImpact ??
                  "—"}
              </strong>

              <span>
                /20 points
              </span>
            </div>

            <div className="impact-track">
              <div
                style={{
                  width: `${impactPercent}%`,
                }}
              />
            </div>

            <a href="/performance">
              View Full
              Performance
            </a>
          </article>
        </section>

        {/* CONTRIBUTION FRAMEWORK */}

        <section className="panel framework-panel">
          <div className="panel-heading">
            <div>
              <p>
                CONTRIBUTION
                FRAMEWORK
              </p>

              <h3>
                How Business
                Impact Can Be
                Demonstrated
              </h3>

              <span>
                Actual activity
                depends on your
                allocated
                department and
                project tasks.
              </span>
            </div>
          </div>

          <div className="framework-grid">
            <article>
              <div>
                01
              </div>

              <strong>
                Lead Generation
              </strong>

              <p>
                Identify relevant
                prospects,
                customers,
                partners or
                business
                opportunities.
              </p>
            </article>

            <article>
              <div>
                02
              </div>

              <strong>
                Sales
                Contribution
              </strong>

              <p>
                Support conversion,
                customer
                acquisition or
                attributable sales
                activity where
                assigned.
              </p>
            </article>

            <article>
              <div>
                03
              </div>

              <strong>
                Market Insights
              </strong>

              <p>
                Produce useful
                research,
                competitor
                intelligence and
                customer insights.
              </p>
            </article>

            <article>
              <div>
                04
              </div>

              <strong>
                Process
                Improvement
              </strong>

              <p>
                Improve an
                operational,
                marketing,
                finance, HR,
                design or
                technology
                process.
              </p>
            </article>

            <article>
              <div>
                05
              </div>

              <strong>
                Campaign Impact
              </strong>

              <p>
                Contribute to
                measurable reach,
                engagement,
                traffic,
                enquiries or
                conversions.
              </p>
            </article>

            <article>
              <div>
                06
              </div>

              <strong>
                Strategic Output
              </strong>

              <p>
                Deliver analysis
                or recommendations
                that can be used
                in real business
                decisions.
              </p>
            </article>
          </div>
        </section>

        {/* SALES DATA NOTICE */}

        <section className="panel data-panel">
          <div className="data-icon">
            <BarChart3
              size={24}
            />
          </div>

          <div className="data-copy">
            <p>
              SALES TRACKING
            </p>

            <h3>
              Live order and
              revenue attribution
              is not connected
              yet.
            </h3>

            <span>
              Your referral code
              and Business Impact
              score are already
              available. The next
              backend upgrade can
              connect customer
              orders to individual
              students so this
              page can show live
              leads, orders,
              revenue and
              conversion
              contribution.
            </span>
          </div>
        </section>

        {/* PROJECT CONTRIBUTION */}

        <section className="two-column bottom-section">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  PROJECT WORK
                </p>

                <h3>
                  Approved Tasks
                </h3>
              </div>
            </div>

            <div className="big-number">
              {
                approvedTasks
              }
            </div>

            <span className="supporting-text">
              Approved project
              tasks can support
              your overall
              contribution
              record.
            </span>

            <a
              href="/submissions"
              className="text-link"
            >
              View Submissions
            </a>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p>
                  CURRENT STATUS
                </p>

                <h3>
                  Project Standing
                </h3>
              </div>
            </div>

            <div className="project-status">
              {statusLabel(
                student.status,
              )}
            </div>

            <span className="supporting-text">
              Department:{" "}
              {student.assignedDepartment ||
                "Pending"}
            </span>

            <a
              href="/project"
              className="text-link"
            >
              View My Project
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

        .sales-page {
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
          padding: 0 36px 50px;
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
        .panel-heading p,
        .data-copy p {
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

        .impact-hero {
          display: flex;
          min-height: 205px;
          align-items: center;
          justify-content:
            space-between;
          gap: 35px;
          margin-top: 26px;
          padding: 36px 39px;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 88%
                15%,
              rgba(
                91,
                137,
                255,
                0.5
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

        .impact-hero > div:first-child {
          max-width: 760px;
        }

        .impact-hero p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .impact-hero h2 {
          margin: 11px 0 8px;
          font-size: 30px;
          line-height: 1.2;
        }

        .impact-hero > div:first-child > span {
          color:
            rgba(
              255,
              255,
              255,
              0.63
            );
          font-size: 10px;
          line-height: 1.7;
        }

        .impact-score-card {
          min-width: 235px;
          padding: 22px;
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.14
            );
          border-radius: 15px;
          background:
            rgba(
              255,
              255,
              255,
              0.07
            );
        }

        .impact-score-card > span {
          color: #a9bee9;
          font-size: 7px;
          font-weight: 900;
        }

        .impact-score-card > strong {
          display: block;
          margin-top: 8px;
          font-size: 34px;
        }

        .impact-score-card small {
          color: #9cb4e5;
          font-size: 12px;
        }

        .hero-progress,
        .impact-track {
          height: 7px;
          margin-top: 14px;
          overflow: hidden;
          border-radius: 50px;
          background:
            rgba(
              255,
              255,
              255,
              0.15
            );
        }

        .hero-progress div,
        .impact-track div {
          height: 100%;
          border-radius: inherit;
          background: #89a8ff;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .summary-grid article {
          min-height: 140px;
          padding: 20px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
        }

        .summary-icon {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: 11px;
        }

        .summary-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .summary-icon.purple {
          background: #f3efff;
          color: #6e4bd6;
        }

        .summary-icon.green {
          background: #ebf8f1;
          color: #258855;
        }

        .summary-icon.orange {
          background: #fff3e6;
          color: #d87b1d;
        }

        .summary-grid article > span {
          display: block;
          margin-top: 14px;
          color: #818d9f;
          font-size: 9px;
        }

        .summary-grid article > strong {
          display: block;
          margin-top: 4px;
          font-size: 25px;
        }

        .summary-grid article small {
          display: block;
          margin-top: 4px;
          color: #a0a9b7;
          font-size: 8px;
        }

        .two-column {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 16px;
          margin-top: 17px;
        }

        .panel {
          border:
            1px solid #dfe5ed;
          border-radius: 16px;
          background: #fff;
        }

        .referral-panel,
        .impact-panel,
        .framework-panel,
        .data-panel,
        .bottom-section .panel {
          padding: 24px;
        }

        .panel-heading {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 20px;
        }

        .panel-heading h3 {
          margin: 7px 0 0;
          font-size: 17px;
        }

        .panel-heading > div > span {
          display: block;
          margin-top: 6px;
          color: #8793a4;
          font-size: 9px;
          line-height: 1.6;
        }

        .referral-code-box {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 15px;
          margin-top: 22px;
          padding: 17px;
          border:
            1px dashed #b8c7e7;
          border-radius: 11px;
          background: #f6f9ff;
        }

        .referral-code-box span {
          display: block;
          color: #8a97aa;
          font-size: 7px;
          font-weight: 900;
        }

        .referral-code-box strong {
          display: block;
          margin-top: 6px;
          color: #123f9f;
          font-size: 17px;
          letter-spacing: 0.06em;
        }

        .referral-code-box button {
          display: flex;
          height: 38px;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border: 0;
          border-radius: 9px;
          background: #123e9c;
          color: #fff;
          font-size: 9px;
          font-weight: 800;
        }

        .referral-code-box button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pending-note {
          margin-top: 12px;
          color: #9b7a46;
          font-size: 9px;
        }

        .impact-score-large {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          margin-top: 22px;
        }

        .impact-score-large strong {
          color: #2057d0;
          font-size: 44px;
        }

        .impact-score-large span {
          padding-bottom: 7px;
          color: #8a96a8;
          font-size: 9px;
        }

        .impact-panel
          .impact-track {
          background: #edf1f6;
        }

        .impact-panel
          .impact-track
          div {
          background:
            linear-gradient(
              90deg,
              #2054d0,
              #7197ff
            );
        }

        .impact-panel > a,
        .text-link {
          display: inline-flex;
          margin-top: 17px;
          color: #2658ce;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .framework-panel {
          margin-top: 17px;
        }

        .framework-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 13px;
          margin-top: 21px;
        }

        .framework-grid article {
          min-height: 180px;
          padding: 18px;
          border:
            1px solid #e5eaf1;
          border-radius: 12px;
          background: #fafcff;
        }

        .framework-grid article > div {
          color: #2a5bd2;
          font-size: 9px;
          font-weight: 900;
        }

        .framework-grid strong {
          display: block;
          margin-top: 18px;
          font-size: 12px;
        }

        .framework-grid p {
          margin: 7px 0 0;
          color: #778397;
          font-size: 9px;
          line-height: 1.7;
        }

        .data-panel {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-top: 17px;
          border-color: #d7e4ff;
          background: #f7faff;
        }

        .data-icon {
          display: grid;
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          place-items: center;
          border-radius: 12px;
          background: #e9f0ff;
          color: #2b5bd2;
        }

        .data-copy h3 {
          margin: 7px 0 7px;
          font-size: 16px;
        }

        .data-copy span {
          color: #6f7e94;
          font-size: 9px;
          line-height: 1.7;
        }

        .bottom-section {
          margin-top: 17px;
        }

        .big-number {
          margin-top: 20px;
          color: #2057d0;
          font-size: 44px;
          font-weight: 900;
        }

        .supporting-text {
          display: block;
          margin-top: 7px;
          color: #7f8b9d;
          font-size: 9px;
          line-height: 1.6;
        }

        .project-status {
          margin-top: 20px;
          color: #1c6f49;
          font-size: 24px;
          font-weight: 900;
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
          .summary-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .framework-grid {
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

          .impact-hero,
          .two-column {
            align-items: flex-start;
            grid-template-columns:
              1fr;
          }

          .impact-hero {
            flex-direction: column;
          }

          .impact-score-card {
            width: 100%;
            min-width: 0;
          }
        }

        @media (
          max-width: 560px
        ) {
          .summary-grid,
          .framework-grid {
            grid-template-columns:
              1fr;
          }

          .impact-hero,
          .referral-panel,
          .impact-panel,
          .framework-panel,
          .data-panel,
          .bottom-section .panel {
            padding: 20px;
          }

          .referral-code-box {
            align-items:
              flex-start;
            flex-direction: column;
          }

          .data-panel {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
