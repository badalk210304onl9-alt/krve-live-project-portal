"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  FileCheck2,
  IndianRupee,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  PackageCheck,
  RefreshCcw,
  RotateCcw,
  Share2,
  ShoppingBag,
  Target,
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

type SaleRecord = {
  id: string;
  applicationId: string;
  orderId?: string | null;
  referralCode?: string | null;
  leadCount: number;
  customerContacts: number;
  ordersCount: number;
  revenue: number;
  returnsCount: number;
  cancellationsCount: number;
  note?: string | null;
  recordedAt?: string | null;
};

type SalesSummary = {
  entries: number;
  leads: number;
  customerContacts: number;
  orders: number;
  revenue: number;
  returns: number;
  cancellations: number;
};

type ExtendedPortalData =
  StudentPortalData & {
    sales?: SaleRecord[];
    salesSummary?: SalesSummary;
  };

type ExtendedStudent =
  StudentPortalData["student"] & {
    salesOrders?: number | null;
    salesRevenue?: number | null;
  };

type ApiResponse = {
  success?: boolean;
  message?: string;

  data?: ExtendedPortalData;

  student?: ExtendedStudent;
  tasks?: StudentPortalData["tasks"];
  summary?: StudentPortalData["summary"];

  sales?: SaleRecord[];
  salesSummary?: SalesSummary;
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

const emptySalesSummary: SalesSummary = {
  entries: 0,
  leads: 0,
  customerContacts: 0,
  orders: 0,
  revenue: 0,
  returns: 0,
  cancellations: 0,
};

/* =========================================================
   HELPERS
========================================================= */

function extractPortalData(
  response: ApiResponse,
): ExtendedPortalData | null {
  if (
    response.data?.student
  ) {
    return response.data;
  }

  if (
    response.student &&
    response.tasks &&
    response.summary
  ) {
    return {
      student:
        response.student,

      tasks:
        response.tasks,

      summary:
        response.summary,

      sales:
        response.sales || [],

      salesSummary:
        response.salesSummary ||
        emptySalesSummary,
    };
  }

  return null;
}

function formatMoney(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value || 0),
  );
}

function formatDate(
  value?:
    | string
    | null,
) {
  if (!value) {
    return "—";
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
  value?:
    | string
    | null,
) {
  const normalized =
    String(value || "")
      .replace(
        /_/g,
        " ",
      )
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

function getStoreBase() {
  const value =
    process.env
      .NEXT_PUBLIC_KRVE_STORE_URL ||
    "https://krvefashionstudio.in";

  return value.replace(
    /\/+$/,
    "",
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function SalesImpactPage() {
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
                  credentials
                    .applicationNumber,

                email:
                  credentials
                    .email,

                phone:
                  credentials
                    .phone,
              }),

            cache:
              "no-store",
          },
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
            "Unable to refresh Sales & Impact data.",
        );
      }

      const portal =
        extractPortalData(
          data,
        );

      if (!portal) {
        throw new Error(
          "Sales & Impact data was not returned.",
        );
      }

      const nextSession:
        SessionData = {
        credentials,
        portal:
          portal as StudentPortalData,
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
          : "Unable to refresh Sales & Impact.",
      );
    } finally {
      setRefreshing(
        false,
      );
    }
  }

  /* =======================================================
     COPY / SHARE
  ======================================================= */

  async function copyText(
    value: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(false),
        1800,
      );
    } catch {
      setError(
        "Could not copy to clipboard.",
      );
    }
  }

  async function shareReferral(
    link: string,
  ) {
    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "KRVÉ — The Fashion Studio",
          text:
            "Explore KRVÉ using my Live Project referral link.",
          url: link,
        });

        return;
      }

      await copyText(
        link,
      );
    } catch {
      // User cancellation should not show an error.
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
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="sales-loading">
        <div className="loading-logo">
          KRVÉ
        </div>

        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading Sales &
          Impact...
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

          .loading-logo {
            color: #0b2c71;
            font-size: 23px;
            font-weight: 900;
            letter-spacing: 0.16em;
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

  const portal =
    session.portal as ExtendedPortalData;

  const student =
    portal.student as ExtendedStudent;

  const sales =
    portal.sales || [];

  const salesSummary =
    portal.salesSummary ||
    emptySalesSummary;

  const referralCode =
    student.referralCode ||
    student.projectCode ||
    "";

  const referralLink =
    referralCode
      ? `${getStoreBase()}/?ref=${encodeURIComponent(
          referralCode,
        )}`
      : "";

  const businessImpactScore =
    student.evaluation
      ?.businessImpact ??
    null;

  const approvedTasks =
    Number(
      portal.summary
        .approvedTasks || 0,
    );

  const conversionRate =
    salesSummary.leads > 0
      ? Math.round(
          (salesSummary.orders /
            salesSummary.leads) *
            1000,
        ) / 10
      : 0;

  const netOrders =
    Math.max(
      0,
      salesSummary.orders -
        salesSummary.returns -
        salesSummary.cancellations,
    );

  const activity =
    [...sales].sort(
      (a, b) =>
        new Date(
          b.recordedAt || 0,
        ).getTime() -
        new Date(
          a.recordedAt || 0,
        ).getTime(),
    );

  return (
    <main className="sales-page">
      {/* MOBILE HEADER */}

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
          aria-label="Open navigation"
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
                    "/sales"
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
              <ArrowLeft
                size={14}
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
              Live contribution
              records from KEOS,
              referral identity and
              your Business Impact
              evaluation.
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
          <div className="notice error">
            <AlertCircle
              size={18}
            />

            <div>
              <strong>
                Unable to refresh
                impact data
              </strong>

              <span>
                {error}
              </span>
            </div>
          </div>
        )}

        {copied && (
          <div className="notice success">
            <CheckCircle2
              size={18}
            />

            <div>
              <strong>
                Copied
              </strong>

              <span>
                Referral information
                copied to your
                clipboard.
              </span>
            </div>
          </div>
        )}

        {/* HERO */}

        <section className="impact-hero">
          <div className="hero-copy">
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
              Leads, customer
              contacts, attributable
              orders, revenue,
              research insights and
              operational outcomes
              can support your final
              project evaluation.
            </span>
          </div>

          <div className="impact-score">
            <span>
              BUSINESS IMPACT
              SCORE
            </span>

            <div>
              <strong>
                {businessImpactScore ===
                null
                  ? "—"
                  : businessImpactScore}
              </strong>

              <small>
                /20
              </small>
            </div>

            <div className="score-track">
              <div
                style={{
                  width: `${
                    businessImpactScore ===
                    null
                      ? 0
                      : Math.min(
                          100,
                          (Number(
                            businessImpactScore,
                          ) /
                            20) *
                            100,
                        )
                  }%`,
                }}
              />
            </div>

            <p>
              Set through the final
              KEOS performance
              evaluation.
            </p>
          </div>
        </section>

        {/* KPI CARDS */}

        <section className="metric-grid">
          <MetricCard
            icon={
              <Users size={21} />
            }
            label="Attributed Leads"
            value={String(
              salesSummary.leads,
            )}
            helper={`${salesSummary.customerContacts} customer contacts`}
            tone="blue"
          />

          <MetricCard
            icon={
              <ShoppingBag
                size={21}
              />
            }
            label="Attributed Orders"
            value={String(
              salesSummary.orders,
            )}
            helper={`${netOrders} net effective orders`}
            tone="purple"
          />

          <MetricCard
            icon={
              <IndianRupee
                size={21}
              />
            }
            label="Revenue Generated"
            value={formatMoney(
              salesSummary.revenue,
            )}
            helper={`${salesSummary.entries} attribution record${
              salesSummary.entries ===
              1
                ? ""
                : "s"
            }`}
            tone="green"
          />

          <MetricCard
            icon={
              <Target size={21} />
            }
            label="Lead Conversion"
            value={`${conversionRate}%`}
            helper={`${salesSummary.returns} returns • ${salesSummary.cancellations} cancellations`}
            tone="orange"
          />
        </section>

        {/* REFERRAL + PERFORMANCE */}

        <section className="two-column">
          <article className="panel">
            <PanelHeading
              eyebrow="REFERRAL IDENTITY"
              title="Your Referral Code"
              icon={
                <BriefcaseBusiness
                  size={22}
                />
              }
            />

            {referralCode ? (
              <>
                <div className="referral-code">
                  <div>
                    <span>
                      REFERRAL CODE
                    </span>

                    <strong>
                      {referralCode}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        referralCode,
                      )
                    }
                  >
                    <Copy size={15} />

                    Copy
                  </button>
                </div>

                <div className="referral-link-box">
                  <span>
                    SHAREABLE STORE
                    LINK
                  </span>

                  <p>
                    {referralLink}
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          referralLink,
                        )
                      }
                    >
                      <Link2
                        size={15}
                      />

                      Copy Link
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        shareReferral(
                          referralLink,
                        )
                      }
                    >
                      <Share2
                        size={15}
                      />

                      Share
                    </button>

                    <a
                      href={
                        referralLink
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink
                        size={15}
                      />

                      Open Store
                    </a>
                  </div>
                </div>

                <p className="helper-copy">
                  Use this code/link only
                  for KRVE-authorized
                  project activity.
                  Attribution records are
                  reviewed in KEOS.
                </p>
              </>
            ) : (
              <EmptyState
                title="Referral code not assigned"
                text="Once your project referral code is activated in KEOS, it will appear here."
              />
            )}
          </article>

          <article className="panel">
            <PanelHeading
              eyebrow="PERFORMANCE"
              title="Business Impact"
              icon={
                <BarChart3
                  size={22}
                />
              }
            />

            <div className="performance-score">
              <div>
                <span>
                  CURRENT SCORE
                </span>

                <strong>
                  {businessImpactScore ===
                  null
                    ? "—"
                    : businessImpactScore}
                  <small>
                    /20
                  </small>
                </strong>
              </div>

              <div className="large-track">
                <div
                  style={{
                    width: `${
                      businessImpactScore ===
                      null
                        ? 0
                        : Math.min(
                            100,
                            (Number(
                              businessImpactScore,
                            ) /
                              20) *
                              100,
                          )
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="performance-facts">
              <div>
                <span>
                  APPROVED TASKS
                </span>

                <strong>
                  {approvedTasks}
                </strong>
              </div>

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
        </section>

        {/* CONTRIBUTION FRAMEWORK */}

        <section className="panel framework-panel">
          <PanelHeading
            eyebrow="CONTRIBUTION FRAMEWORK"
            title="How Business Impact Can Be Demonstrated"
            icon={
              <Target size={22} />
            }
          />

          <div className="framework-grid">
            <FrameworkItem
              number="01"
              title="Lead Generation"
              text="Identify relevant prospects, customers, partners or business opportunities."
            />

            <FrameworkItem
              number="02"
              title="Sales Contribution"
              text="Support conversion, customer acquisition or attributable sales activity where assigned."
            />

            <FrameworkItem
              number="03"
              title="Market Insights"
              text="Produce useful research, competitor intelligence and customer insights."
            />

            <FrameworkItem
              number="04"
              title="Process Improvement"
              text="Improve an operational, marketing, finance, HR, design or technology process."
            />

            <FrameworkItem
              number="05"
              title="Campaign Impact"
              text="Contribute to measurable reach, engagement, traffic, enquiries or conversions."
            />

            <FrameworkItem
              number="06"
              title="Strategic Output"
              text="Deliver analysis or recommendations that can be used in real business decisions."
            />
          </div>
        </section>

        {/* LIVE ATTRIBUTION */}

        <section className="panel attribution-panel">
          <div className="section-top">
            <PanelHeading
              eyebrow="LIVE ATTRIBUTION"
              title="Recorded Contribution Activity"
              icon={
                <PackageCheck
                  size={22}
                />
              }
            />

            <span className="live-badge">
              KEOS SYNC
            </span>
          </div>

          {activity.length >
          0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Date
                    </th>

                    <th>
                      Order /
                      Reference
                    </th>

                    <th>
                      Leads
                    </th>

                    <th>
                      Contacts
                    </th>

                    <th>
                      Orders
                    </th>

                    <th>
                      Revenue
                    </th>

                    <th>
                      Returns
                    </th>

                    <th>
                      Cancelled
                    </th>

                    <th>
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {activity.map(
                    (sale) => (
                      <tr
                        key={
                          sale.id
                        }
                      >
                        <td>
                          {formatDate(
                            sale.recordedAt,
                          )}
                        </td>

                        <td>
                          <strong>
                            {sale.orderId ||
                              "Manual activity"}
                          </strong>

                          <span>
                            {sale.referralCode ||
                              referralCode ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          {
                            sale.leadCount
                          }
                        </td>

                        <td>
                          {
                            sale.customerContacts
                          }
                        </td>

                        <td>
                          {
                            sale.ordersCount
                          }
                        </td>

                        <td className="money">
                          {formatMoney(
                            sale.revenue,
                          )}
                        </td>

                        <td>
                          {
                            sale.returnsCount
                          }
                        </td>

                        <td>
                          {
                            sale.cancellationsCount
                          }
                        </td>

                        <td className="note-cell">
                          {sale.note ||
                            "—"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No contribution records yet"
              text="When the KRVE team records verified leads, orders or revenue in KEOS, those entries will appear here after refresh."
            />
          )}
        </section>

        {/* SUMMARY */}

        <section className="summary-grid">
          <article className="panel mini-panel">
            <RotateCcw
              size={23}
            />

            <p>
              RETURNS &
              CANCELLATIONS
            </p>

            <h3>
              {salesSummary.returns +
                salesSummary.cancellations}
            </h3>

            <span>
              {salesSummary.returns}{" "}
              returns •{" "}
              {
                salesSummary.cancellations
              }{" "}
              cancellations
            </span>
          </article>

          <article className="panel mini-panel">
            <CheckCircle2
              size={23}
            />

            <p>
              APPROVED PROJECT WORK
            </p>

            <h3>
              {approvedTasks}
            </h3>

            <span>
              Approved task output
              supports your overall
              contribution record.
            </span>

            <a href="/submissions">
              View Submissions

              <ChevronRight
                size={14}
              />
            </a>
          </article>

          <article className="panel mini-panel">
            <BriefcaseBusiness
              size={23}
            />

            <p>
              PROJECT STANDING
            </p>

            <h3 className="status-text">
              {statusLabel(
                student.status,
              )}
            </h3>

            <span>
              Department:{" "}
              {student.assignedDepartment ||
                "Not assigned"}
            </span>

            <a href="/project">
              View My Project

              <ChevronRight
                size={14}
              />
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

        a {
          color: inherit;
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

        .notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 17px;
          padding: 13px;
          border-radius: 10px;
        }

        .notice strong {
          display: block;
          font-size: 9px;
        }

        .notice span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
        }

        .notice.error {
          border:
            1px solid #ffd2d6;
          background: #fff4f5;
          color: #b32d38;
        }

        .notice.success {
          border:
            1px solid #c5ead5;
          background: #f0fbf5;
          color: #24794d;
        }

        .impact-hero {
          display: flex;
          min-height: 245px;
          align-items: center;
          justify-content:
            space-between;
          gap: 30px;
          margin-top: 26px;
          padding: 38px 42px;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at 88% 18%,
              rgba(
                91,
                137,
                255,
                0.48
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

        .hero-copy {
          max-width: 780px;
        }

        .hero-copy p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .hero-copy h2 {
          max-width: 750px;
          margin:
            14px 0 12px;
          font-size: 31px;
          line-height: 1.25;
        }

        .hero-copy span {
          color:
            rgba(
              255,
              255,
              255,
              0.68
            );
          font-size: 10px;
          line-height: 1.7;
        }

        .impact-score {
          width: 250px;
          flex: 0 0 250px;
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
              0.08
            );
        }

        .impact-score > span {
          color: #afc1e9;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .impact-score > div:nth-child(2) {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 17px;
        }

        .impact-score strong {
          font-size: 39px;
        }

        .impact-score small {
          color: #b8c8e9;
          font-size: 12px;
        }

        .score-track,
        .large-track {
          height: 8px;
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

        .score-track {
          margin-top: 15px;
        }

        .score-track div,
        .large-track div {
          height: 100%;
          border-radius: inherit;
          background: #7fa3ff;
        }

        .impact-score p {
          margin:
            11px 0 0;
          color:
            rgba(
              255,
              255,
              255,
              0.52
            );
          font-size: 8px;
          line-height: 1.5;
        }

        .metric-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 17px;
        }

        .metric-card {
          min-height: 155px;
          padding: 21px;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .metric-icon {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 11px;
        }

        .metric-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .metric-icon.purple {
          background: #f3efff;
          color: #704bd6;
        }

        .metric-icon.green {
          background: #eaf8f0;
          color: #258855;
        }

        .metric-icon.orange {
          background: #fff3e6;
          color: #d87a1d;
        }

        .metric-card > span {
          display: block;
          margin-top: 15px;
          color: #8290a4;
          font-size: 9px;
        }

        .metric-card strong {
          display: block;
          margin-top: 8px;
          color: #26364d;
          font-size: 24px;
        }

        .metric-card small {
          display: block;
          margin-top: 6px;
          color: #9aa5b4;
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
          box-shadow:
            0 5px 20px
            rgba(
              17,
              44,
              85,
              0.035
            );
        }

        .two-column .panel,
        .framework-panel,
        .attribution-panel,
        .mini-panel {
          padding: 24px;
        }

        .framework-panel,
        .attribution-panel {
          margin-top: 17px;
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
          margin:
            7px 0 0;
          font-size: 17px;
        }

        .panel-heading > svg {
          color: #3d61a3;
        }

        .referral-code {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 15px;
          margin-top: 21px;
          padding: 18px;
          border:
            1px dashed #bcd0ef;
          border-radius: 12px;
          background: #f7faff;
        }

        .referral-code span,
        .referral-link-box > span,
        .performance-score span,
        .performance-facts span,
        .mini-panel p {
          display: block;
          color: #8b98aa;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .referral-code strong {
          display: block;
          margin-top: 5px;
          color: #2250ae;
          font-size: 17px;
          word-break:
            break-all;
        }

        .referral-code button,
        .referral-link-box button,
        .referral-link-box a {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 11px;
          border:
            1px solid #dce3ec;
          border-radius: 8px;
          background: #fff;
          color: #4e6385;
          font-size: 8px;
          font-weight: 800;
          text-decoration: none;
        }

        .referral-code button {
          border: 0;
          background: #163f97;
          color: #fff;
        }

        .referral-link-box {
          margin-top: 14px;
          padding: 15px;
          border-radius: 11px;
          background: #f8fafc;
        }

        .referral-link-box p {
          margin:
            6px 0 11px;
          overflow-wrap:
            anywhere;
          color: #43536c;
          font-size: 9px;
          line-height: 1.6;
        }

        .referral-link-box > div {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .helper-copy {
          margin:
            13px 0 0;
          color: #8a96a7;
          font-size: 8px;
          line-height: 1.6;
        }

        .performance-score {
          margin-top: 24px;
        }

        .performance-score strong {
          display: block;
          margin-top: 5px;
          color: #2458cd;
          font-size: 30px;
        }

        .performance-score small {
          margin-left: 4px;
          color: #8c9aaf;
          font-size: 11px;
        }

        .large-track {
          margin-top: 15px;
          background: #e9edf4;
        }

        .large-track div {
          background:
            linear-gradient(
              90deg,
              #1c54cf,
              #6c92fa
            );
        }

        .performance-facts {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .performance-facts > div {
          padding: 13px;
          border-radius: 9px;
          background: #f7f9fc;
        }

        .performance-facts strong {
          display: block;
          margin-top: 5px;
          color: #32445f;
          font-size: 12px;
        }

        .panel-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 18px;
          color: #2458cd;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .framework-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 12px;
          margin-top: 21px;
        }

        .framework-item {
          min-height: 165px;
          padding: 18px;
          border:
            1px solid #e2e7ef;
          border-radius: 12px;
          background: #fafcff;
        }

        .framework-item > span {
          color: #2858ce;
          font-size: 8px;
          font-weight: 900;
        }

        .framework-item h4 {
          margin:
            17px 0 7px;
          color: #2a374c;
          font-size: 12px;
        }

        .framework-item p {
          margin: 0;
          color: #79869a;
          font-size: 9px;
          line-height: 1.65;
        }

        .section-top {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 15px;
        }

        .live-badge {
          padding:
            6px 9px;
          border-radius: 40px;
          background: #eaf8f0;
          color: #247f51;
          font-size: 7px;
          font-weight: 900;
        }

        .table-wrap {
          margin-top: 21px;
          overflow-x: auto;
          border:
            1px solid #e5e9ef;
          border-radius: 12px;
        }

        table {
          width: 100%;
          min-width: 1000px;
          border-collapse:
            collapse;
          font-size: 9px;
        }

        th {
          padding:
            12px 13px;
          background: #f7f9fc;
          color: #78869b;
          font-size: 7px;
          text-align: left;
          text-transform:
            uppercase;
          letter-spacing:
            0.06em;
        }

        td {
          padding:
            13px;
          border-top:
            1px solid #edf0f4;
          color: #59687e;
          vertical-align: top;
        }

        td strong {
          display: block;
          color: #334158;
          font-size: 9px;
        }

        td span {
          display: block;
          margin-top: 3px;
          color: #929dad;
          font-size: 7px;
        }

        td.money {
          color: #227c4c;
          font-weight: 900;
        }

        .note-cell {
          max-width: 250px;
          line-height: 1.5;
        }

        .empty-state {
          display: flex;
          min-height: 170px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          margin-top: 20px;
          padding: 22px;
          border:
            1px dashed #d5dce6;
          border-radius: 12px;
          background: #fafbfc;
          text-align: center;
        }

        .empty-state > div {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 11px;
          background: #edf3ff;
          color: #4c6fae;
        }

        .empty-state strong {
          display: block;
          margin-top: 12px;
          font-size: 11px;
        }

        .empty-state p {
          max-width: 450px;
          margin:
            6px 0 0;
          color: #8995a6;
          font-size: 8px;
          line-height: 1.6;
        }

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 15px;
          margin-top: 17px;
        }

        .mini-panel > svg {
          color: #2e5dbe;
        }

        .mini-panel p {
          margin:
            16px 0 0;
          color: #2b5acf;
        }

        .mini-panel h3 {
          margin:
            8px 0 7px;
          color: #2559d0;
          font-size: 30px;
        }

        .mini-panel h3.status-text {
          color: #23804f;
          font-size: 24px;
        }

        .mini-panel > span {
          color: #8591a3;
          font-size: 8px;
          line-height: 1.55;
        }

        .mini-panel a {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 14px;
          color: #2458cd;
          font-size: 8px;
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
          max-width: 1120px
        ) {
          .metric-grid {
            grid-template-columns:
              1fr 1fr;
          }

          .framework-grid {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 900px
        ) {
          .two-column,
          .summary-grid {
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

          .impact-hero {
            align-items:
              stretch;
            flex-direction:
              column;
          }

          .impact-score {
            width: 100%;
            flex-basis: auto;
          }
        }

        @media (
          max-width: 560px
        ) {
          .metric-grid,
          .framework-grid {
            grid-template-columns:
              1fr;
          }

          .impact-hero {
            padding:
              28px 22px;
          }

          .hero-copy h2 {
            font-size: 24px;
          }

          .performance-facts {
            grid-template-columns:
              1fr;
          }

          .page-header > div > span {
            display: block;
            max-width: 260px;
            line-height: 1.5;
          }

          .refresh-button {
            width: 41px;
            padding: 0;
            justify-content:
              center;
            font-size: 0;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function PanelHeading({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div>
        <p>
          {eyebrow}
        </p>

        <h3>
          {title}
        </h3>
      </div>

      {icon}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone:
    | "blue"
    | "purple"
    | "green"
    | "orange";
}) {
  return (
    <article className="metric-card">
      <div
        className={`metric-icon ${tone}`}
      >
        {icon}
      </div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {helper}
      </small>
    </article>
  );
}

function FrameworkItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="framework-item">
      <span>
        {number}
      </span>

      <h4>
        {title}
      </h4>

      <p>
        {text}
      </p>
    </article>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <div>
        <PackageCheck
          size={20}
        />
      </div>

      <strong>
        {title}
      </strong>

      <p>
        {text}
      </p>
    </div>
  );
}
