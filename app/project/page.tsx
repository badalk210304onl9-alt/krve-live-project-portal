"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Phone,
  RefreshCcw,
  ShieldCheck,
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

/*
  These are the new fields returned by the Central API.

  Keeping this extension local means this page can work even if
  lib/portal-types.ts has not yet been expanded with the new fields.
*/
type ProjectStudent =
  StudentPortalData["student"] & {
    projectRole?:
      | string
      | null;

    projectObjective?:
      | string
      | null;

    projectDescription?:
      | string
      | null;

    projectScope?:
      | string
      | null;

    expectedOutcomes?:
      | string
      | null;

    keyDeliverables?:
      | string
      | null;

    projectGuidelines?:
      | string
      | null;

    projectResources?:
      | string
      | null;

    reportingFrequency?:
      | string
      | null;

    coordinatorEmail?:
      | string
      | null;

    coordinatorPhone?:
      | string
      | null;
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
    };
  }

  return null;
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

function formatDate(
  value?:
    | string
    | null,
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

function projectProgress(
  portal:
    StudentPortalData,
) {
  const assigned =
    Number(
      portal.summary
        .assignedTasks || 0,
    );

  const approved =
    Number(
      portal.summary
        .approvedTasks || 0,
    );

  if (
    assigned <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (approved /
          assigned) *
          100,
      ),
    ),
  );
}

function splitLines(
  value?:
    | string
    | null,
) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((item) =>
      item
        .replace(
          /^\s*[-•*]\s*/,
          "",
        )
        .replace(
          /^\s*\d+[.)]\s*/,
          "",
        )
        .trim(),
    )
    .filter(Boolean);
}

function isUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function projectStatusClass(
  value?:
    | string
    | null,
) {
  const status =
    String(value || "")
      .toLowerCase()
      .trim();

  if (
    status ===
      "active" ||
    status ===
      "completed"
  ) {
    return "success";
  }

  if (
    status ===
      "selected"
  ) {
    return "blue";
  }

  return "neutral";
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

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(
      null,
    );

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
            "Unable to refresh project details.",
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

    window.location.replace(
      "/",
    );
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
        <div className="loading-logo">
          KRVÉ
        </div>

        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading project
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

          .project-loading {
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

          .project-loading
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
    summary,
  } =
    session.portal;

  const student =
    session.portal
      .student as ProjectStudent;

  const deliverables =
    splitLines(
      student.keyDeliverables,
    );

  const guidelines =
    splitLines(
      student.projectGuidelines,
    );

  const resources =
    splitLines(
      student.projectResources,
    );

  const outcomes =
    splitLines(
      student.expectedOutcomes,
    );

  const hasExtendedProjectDetails =
    Boolean(
      student.projectRole ||
        student.projectObjective ||
        student.projectDescription ||
        student.projectScope ||
        student.expectedOutcomes ||
        student.keyDeliverables ||
        student.projectGuidelines ||
        student.projectResources ||
        student.reportingFrequency,
    );

  const approvedTasks =
    Number(
      summary.approvedTasks ||
        0,
    );

  const assignedTasks =
    Number(
      summary.assignedTasks ||
        0,
    );

  const submittedTasks =
    Number(
      summary.submittedTasks ||
        0,
    );

  return (
    <main className="project-page">
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
          aria-label="Open navigation"
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
            aria-label="Close navigation"
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
                    "/project"
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
          MAIN CONTENT
      =================================================== */}

      <section className="main-content">
        {/* PAGE HEADER */}

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

            <div className="refresh-status">
              <Clock3
                size={12}
              />

              <span>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString(
                      "en-IN",
                      {
                        hour:
                          "2-digit",
                        minute:
                          "2-digit",
                      },
                    )}`
                  : "Project information"}
              </span>
            </div>
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
          <div className="error-box">
            <AlertCircle
              size={18}
            />

            <div>
              <strong>
                Unable to refresh
                project.
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
            PROJECT HERO
        ================================================= */}

        <section className="project-hero">
          <div className="hero-main">
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

            {student.projectRole && (
              <div className="role-chip">
                <GraduationCap
                  size={15}
                />

                {
                  student.projectRole
                }
              </div>
            )}

            <div className="hero-actions">
              <a href="/tasks">
                <ClipboardList
                  size={15}
                />

                Weekly Tasks
              </a>

              <a href="/submissions">
                My Submissions

                <ArrowUpRight
                  size={14}
                />
              </a>
            </div>
          </div>

          <div className="status-card">
            <div className="status-card-top">
              <span>
                PROJECT STATUS
              </span>

              <strong
                className={projectStatusClass(
                  student.status,
                )}
              >
                {statusLabel(
                  student.status,
                )}
              </strong>
            </div>

            <div className="status-divider" />

            <div className="status-detail">
              <span>
                PROJECT PROGRESS
              </span>

              <strong>
                {progress}%
              </strong>
            </div>

            <div className="hero-progress">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <small>
              {approvedTasks} of{" "}
              {assignedTasks} assigned
              tasks approved
            </small>
          </div>
        </section>

        {/* =================================================
            CORE PROJECT DETAILS
        ================================================= */}

        <section className="project-grid">
          <article className="panel project-details-panel">
            <PanelHeading
              eyebrow="PROJECT DETAILS"
              title="Official Allocation"
              icon={
                <BookOpen
                  size={22}
                />
              }
            />

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
                label="Project Role"
                value={
                  student.projectRole ||
                  "Not specified"
                }
                wide
              />

              <Info
                label="Coordinator"
                value={
                  student.coordinatorName ||
                  "Not assigned"
                }
              />

              <Info
                label="Reporting"
                value={
                  student.reportingFrequency ||
                  "Not specified"
                }
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
                label="Project Status"
                value={statusLabel(
                  student.status,
                )}
              />

              <Info
                label="Institute"
                value={
                  student.college ||
                  "Not available"
                }
              />
            </div>
          </article>

          {/* PROGRESS */}

          <article className="panel progress-panel">
            <PanelHeading
              eyebrow="PROGRESS"
              title="Project Completion"
              icon={
                <Target
                  size={22}
                />
              }
            />

            <div className="big-progress">
              <strong>
                {progress}%
              </strong>

              <span>
                based on approved
                assignments
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
              <a href="/tasks">
                <span>
                  Assigned
                </span>

                <strong>
                  {
                    assignedTasks
                  }
                </strong>
              </a>

              <a href="/submissions">
                <span>
                  Submitted
                </span>

                <strong>
                  {
                    submittedTasks
                  }
                </strong>
              </a>

              <a href="/feedback">
                <span>
                  Approved
                </span>

                <strong>
                  {
                    approvedTasks
                  }
                </strong>
              </a>
            </div>

            <a
              href="/tasks"
              className="panel-link"
            >
              Open Weekly Tasks

              <ChevronRight
                size={14}
              />
            </a>
          </article>
        </section>

        {/* =================================================
            OBJECTIVE
        ================================================= */}

        <section className="panel objective-panel">
          <PanelHeading
            eyebrow="PROJECT OBJECTIVE"
            title="What You Are Expected to Achieve"
            icon={
              <Target
                size={22}
              />
            }
          />

          {student.projectObjective ? (
            <p className="long-copy">
              {
                student.projectObjective
              }
            </p>
          ) : (
            <EmptyDetail
              message="The project objective has not been published by the project coordinator yet."
            />
          )}
        </section>

        {/* =================================================
            DESCRIPTION + SCOPE
        ================================================= */}

        <section className="two-column">
          <article className="panel info-panel">
            <PanelHeading
              eyebrow="PROJECT BRIEF"
              title="Project Description"
              icon={
                <FileText
                  size={21}
                />
              }
            />

            {student.projectDescription ? (
              <p className="long-copy">
                {
                  student.projectDescription
                }
              </p>
            ) : (
              <EmptyDetail
                message="Project description has not been published yet."
              />
            )}
          </article>

          <article className="panel info-panel">
            <PanelHeading
              eyebrow="PROJECT BOUNDARY"
              title="Scope of Work"
              icon={
                <BriefcaseBusiness
                  size={21}
                />
              }
            />

            {student.projectScope ? (
              <p className="long-copy">
                {
                  student.projectScope
                }
              </p>
            ) : (
              <EmptyDetail
                message="Project scope has not been published yet."
              />
            )}
          </article>
        </section>

        {/* =================================================
            EXPECTED OUTCOMES
        ================================================= */}

        <section className="panel list-panel">
          <PanelHeading
            eyebrow="EXPECTED OUTCOMES"
            title="What Successful Completion Should Produce"
            icon={
              <CheckCircle2
                size={22}
              />
            }
          />

          {outcomes.length >
          0 ? (
            <div className="number-list">
              {outcomes.map(
                (
                  outcome,
                  index,
                ) => (
                  <div
                    key={`${outcome}-${index}`}
                  >
                    <span>
                      {String(
                        index +
                          1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <p>
                      {outcome}
                    </p>
                  </div>
                ),
              )}
            </div>
          ) : student.expectedOutcomes ? (
            <p className="long-copy">
              {
                student.expectedOutcomes
              }
            </p>
          ) : (
            <EmptyDetail
              message="Expected outcomes have not been published yet."
            />
          )}
        </section>

        {/* =================================================
            DELIVERABLES + GUIDELINES
        ================================================= */}

        <section className="two-column">
          <article className="panel info-panel">
            <PanelHeading
              eyebrow="KEY DELIVERABLES"
              title="Required Project Outputs"
              icon={
                <ClipboardCheck
                  size={22}
                />
              }
            />

            {deliverables.length >
            0 ? (
              <div className="check-list">
                {deliverables.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={`${item}-${index}`}
                    >
                      <CheckCircle2
                        size={16}
                      />

                      <span>
                        {item}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <EmptyDetail
                message="No key deliverables have been published yet."
              />
            )}
          </article>

          <article className="panel info-panel">
            <PanelHeading
              eyebrow="PROJECT GUIDELINES"
              title="Working Standards"
              icon={
                <ShieldCheck
                  size={22}
                />
              }
            />

            {guidelines.length >
            0 ? (
              <div className="guideline-list">
                {guidelines.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={`${item}-${index}`}
                    >
                      <span>
                        {String(
                          index +
                            1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <p>
                        {item}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <EmptyDetail
                message="Project guidelines have not been published yet."
              />
            )}
          </article>
        </section>

        {/* =================================================
            RESOURCES
        ================================================= */}

        <section className="panel resources-panel">
          <PanelHeading
            eyebrow="PROJECT RESOURCES"
            title="Documents, Tools & Important Links"
            icon={
              <Link2
                size={22}
              />
            }
          />

          {resources.length >
          0 ? (
            <div className="resource-list">
              {resources.map(
                (
                  item,
                  index,
                ) => {
                  const link =
                    isUrl(item);

                  return link ? (
                    <a
                      key={`${item}-${index}`}
                      href={
                        item
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="resource-icon">
                        <ExternalLink
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          Resource{" "}
                          {index +
                            1}
                        </strong>

                        <span>
                          {item}
                        </span>
                      </div>

                      <ArrowUpRight
                        size={16}
                      />
                    </a>
                  ) : (
                    <div
                      className="resource-text-item"
                      key={`${item}-${index}`}
                    >
                      <div className="resource-icon">
                        <FileText
                          size={17}
                        />
                      </div>

                      <div>
                        <strong>
                          Resource{" "}
                          {index +
                            1}
                        </strong>

                        <span>
                          {item}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <EmptyDetail
              message="No project resources or important links have been published yet."
            />
          )}
        </section>

        {/* =================================================
            COORDINATOR + TIMELINE
        ================================================= */}

        <section className="project-grid lower-grid">
          <article className="panel coordinator-panel">
            <PanelHeading
              eyebrow="PROJECT COORDINATOR"
              title="Your Point of Contact"
              icon={
                <UserRound
                  size={22}
                />
              }
            />

            <div className="coordinator-profile">
              <div className="coordinator-avatar">
                {student.coordinatorName
                  ? student.coordinatorName
                      .charAt(
                        0,
                      )
                      .toUpperCase()
                  : "K"}
              </div>

              <div>
                <span>
                  COORDINATOR
                </span>

                <strong>
                  {student.coordinatorName ||
                    "Not assigned"}
                </strong>

                <small>
                  {student.assignedDepartment ||
                    "Live Project"}
                </small>
              </div>
            </div>

            <div className="contact-list">
              <ContactItem
                icon={
                  <Mail
                    size={16}
                  />
                }
                label="Email"
                value={
                  student.coordinatorEmail ||
                  "Not provided"
                }
                href={
                  student.coordinatorEmail
                    ? `mailto:${student.coordinatorEmail}`
                    : undefined
                }
              />

              <ContactItem
                icon={
                  <Phone
                    size={16}
                  />
                }
                label="Phone"
                value={
                  student.coordinatorPhone ||
                  "Not provided"
                }
                href={
                  student.coordinatorPhone
                    ? `tel:${student.coordinatorPhone}`
                    : undefined
                }
              />

              <ContactItem
                icon={
                  <Clock3
                    size={16}
                  />
                }
                label="Reporting Frequency"
                value={
                  student.reportingFrequency ||
                  "Not specified"
                }
              />
            </div>
          </article>

          <article className="panel timeline-panel">
            <PanelHeading
              eyebrow="PROJECT TIMELINE"
              title="Program Duration"
              icon={
                <CalendarDays
                  size={22}
                />
              }
            />

            <div className="timeline-card">
              <div className="timeline-date">
                <span>
                  START
                </span>

                <strong>
                  {formatDate(
                    student.startDate,
                  )}
                </strong>
              </div>

              <div className="timeline-visual">
                <span className="timeline-dot active" />

                <div className="timeline-track">
                  <div
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <span className="timeline-dot" />
              </div>

              <div className="timeline-date right">
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

            <div className="timeline-progress-box">
              <div>
                <span>
                  TASK PROGRESS
                </span>

                <strong>
                  {progress}%
                </strong>
              </div>

              <div>
                <span>
                  APPROVED
                </span>

                <strong>
                  {approvedTasks}/
                  {assignedTasks}
                </strong>
              </div>
            </div>
          </article>
        </section>

        {/* =================================================
            IF KEOS DETAILS NOT YET PUBLISHED
        ================================================= */}

        {!hasExtendedProjectDetails && (
          <section className="waiting-notice">
            <div>
              <RefreshCcw
                size={21}
              />
            </div>

            <div>
              <p>
                PROJECT BRIEF
              </p>

              <h3>
                Detailed project
                brief is awaiting
                publication.
              </h3>

              <span>
                Your project
                allocation is active,
                but the detailed
                objective, scope,
                deliverables and
                resources have not
                yet been published
                through KEOS.
              </span>
            </div>

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
                size={15}
                className={
                  refreshing
                    ? "spin"
                    : ""
                }
              />

              Check for Updates
            </button>
          </section>
        )}

        {/* =================================================
            EVALUATION
        ================================================= */}

        <section className="panel evaluation-panel">
          <PanelHeading
            eyebrow="EVALUATION FRAMEWORK"
            title="How Your Project Will Be Assessed"
            icon={
              <BarChart3
                size={22}
              />
            }
          />

          <div className="evaluation-grid">
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

          <div className="evaluation-footer">
            <div>
              <span>
                TOTAL EVALUATION
              </span>

              <strong>
                100 Points
              </strong>
            </div>

            <a href="/performance">
              View My Performance

              <ChevronRight
                size={15}
              />
            </a>
          </div>
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="quick-actions">
          <a href="/tasks">
            <div className="quick-icon blue">
              <ClipboardList
                size={20}
              />
            </div>

            <div>
              <strong>
                Weekly Tasks
              </strong>

              <span>
                Open assignments,
                deadlines and submit
                project work.
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/submissions">
            <div className="quick-icon purple">
              <FileCheck2
                size={20}
              />
            </div>

            <div>
              <strong>
                My Submissions
              </strong>

              <span>
                Track submitted work
                and review status.
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/feedback">
            <div className="quick-icon orange">
              <MessageSquareText
                size={20}
              />
            </div>

            <div>
              <strong>
                Feedback
              </strong>

              <span>
                View evaluator
                comments and revision
                requests.
              </span>
            </div>

            <ChevronRight
              size={16}
            />
          </a>

          <a href="/performance">
            <div className="quick-icon green">
              <BarChart3
                size={20}
              />
            </div>

            <div>
              <strong>
                Performance
              </strong>

              <span>
                Track score, grade
                and evaluation.
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

        button {
          font: inherit;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
        }

        a {
          color: inherit;
        }

        .project-page {
          min-height: 100vh;
        }

        /* ==========================
           SIDEBAR
        ========================== */

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
          box-shadow:
            4px 0 25px
            rgba(
              21,
              44,
              82,
              0.025
            );
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

        .sidebar-brand
          strong {
          display: block;
          font-size: 16px;
          letter-spacing:
            0.08em;
        }

        .sidebar-brand
          span {
          display: block;
          margin-top: 3px;
          color: #939fb0;
          font-size: 7px;
          font-weight: 800;
          letter-spacing:
            0.16em;
        }

        .mobile-close {
          display: none;
          margin-left: auto;
          border: 0;
          background:
            transparent;
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
          transition:
            border-color
              0.18s ease,
            transform
              0.18s ease;
        }

        .student-mini:hover {
          transform:
            translateY(-1px);
          border-color:
            #cbd8ec;
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

        .student-mini
          strong {
          display: block;
          max-width: 155px;
          overflow: hidden;
          font-size: 11px;
          text-overflow:
            ellipsis;
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
          letter-spacing:
            0.16em;
        }

        .sidebar nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding:
            0 13px 15px;
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
          transition:
            background
              0.18s ease,
            color
              0.18s ease;
        }

        .sidebar nav a:hover {
          background: #f3f6fb;
          color: #244680;
        }

        .sidebar nav a.active {
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

        .sidebar-bottom
          > span {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
        }

        .sidebar-bottom
          > strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #47556c;
          font-size: 9px;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }

        .sidebar-bottom
          button {
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

        /* ==========================
           MAIN
        ========================== */

        .main-content {
          min-height: 100vh;
          margin-left: 265px;
          padding:
            0 36px 55px;
        }

        .page-header {
          display: flex;
          min-height: 112px;
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
          margin-bottom: 8px;
          color: #728096;
          font-size: 9px;
          font-weight: 700;
          text-decoration: none;
        }

        .page-header
          > div
          > p,
        .panel-heading p {
          margin: 0;
          color: #2959d1;
          font-size: 8px;
          font-weight: 900;
          letter-spacing:
            0.17em;
        }

        .page-header h1 {
          margin:
            6px 0 5px;
          font-size: 26px;
        }

        .refresh-status {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #8d99ab;
          font-size: 8px;
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

        .error-box {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          margin-top: 18px;
          padding: 13px;
          border:
            1px solid #ffd2d6;
          border-radius: 10px;
          background: #fff4f5;
          color: #b32d38;
        }

        .error-box strong {
          display: block;
          font-size: 9px;
        }

        .error-box span {
          display: block;
          margin-top: 3px;
          font-size: 9px;
        }

        .error-box button {
          height: 32px;
          padding: 0 10px;
          border:
            1px solid #efbfc5;
          border-radius: 7px;
          background: #fff;
          color: #a83b47;
          font-size: 8px;
          font-weight: 800;
        }

        /* ==========================
           HERO
        ========================== */

        .project-hero {
          display: flex;
          min-height: 235px;
          align-items: center;
          justify-content:
            space-between;
          gap: 35px;
          margin-top: 26px;
          padding:
            37px 39px;
          border-radius: 20px;
          background:
            radial-gradient(
              circle at
                88% 18%,
              rgba(
                91,
                137,
                255,
                0.48
              ),
              transparent
                26%
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

        .hero-main {
          max-width: 760px;
        }

        .hero-main > p {
          margin: 0;
          color: #9fbafd;
          font-size: 8px;
          font-weight: 900;
          letter-spacing:
            0.17em;
        }

        .hero-main h2 {
          margin:
            11px 0 8px;
          font-size: 30px;
          line-height: 1.2;
          letter-spacing:
            -0.025em;
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
              0.65
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

        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 14px;
          padding:
            8px 11px;
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
          color: #d7e3ff;
          font-size: 9px;
          font-weight: 700;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .hero-actions a {
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
              0.17
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

        .hero-actions
          a:first-child {
          background: #fff;
          color: #163e8d;
        }

        .status-card {
          width: 245px;
          flex: 0 0 245px;
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
          backdrop-filter:
            blur(10px);
        }

        .status-card-top
          > span,
        .status-detail
          > span {
          color: #a9bee9;
          font-size: 7px;
          font-weight: 900;
          letter-spacing:
            0.12em;
        }

        .status-card-top
          > strong {
          display: block;
          width: fit-content;
          margin-top: 7px;
          padding:
            6px 10px;
          border-radius: 40px;
          font-size: 9px;
        }

        .status-card-top
          > strong.success {
          background:
            rgba(
              81,
              216,
              151,
              0.15
            );
          color: #9af0c0;
        }

        .status-card-top
          > strong.blue {
          background:
            rgba(
              119,
              159,
              255,
              0.17
            );
          color: #c1d2ff;
        }

        .status-card-top
          > strong.neutral {
          background:
            rgba(
              255,
              255,
              255,
              0.11
            );
          color: #dae4fb;
        }

        .status-divider {
          height: 1px;
          margin:
            18px 0;
          background:
            rgba(
              255,
              255,
              255,
              0.13
            );
        }

        .status-detail {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
        }

        .status-detail
          strong {
          font-size: 24px;
        }

        .hero-progress {
          height: 7px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 30px;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
        }

        .hero-progress div {
          height: 100%;
          border-radius:
            inherit;
          background: #8aa9ff;
        }

        .status-card small {
          display: block;
          margin-top: 9px;
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

        /* ==========================
           GENERAL PANELS
        ========================== */

        .project-grid {
          display: grid;
          grid-template-columns:
            1.25fr
            0.75fr;
          gap: 16px;
          margin-top: 17px;
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
        .objective-panel,
        .info-panel,
        .list-panel,
        .resources-panel,
        .coordinator-panel,
        .timeline-panel,
        .evaluation-panel {
          padding: 24px;
        }

        .objective-panel,
        .list-panel,
        .resources-panel,
        .evaluation-panel {
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

        .panel-heading
          h3 {
          margin:
            7px 0 0;
          font-size: 17px;
        }

        .panel-heading
          > svg {
          color: #3d61a3;
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

        .info.wide {
          grid-column:
            1 / -1;
        }

        .info span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
          letter-spacing:
            0.05em;
          text-transform:
            uppercase;
        }

        .info strong {
          display: block;
          margin-top: 5px;
          color: #3e4c61;
          font-size: 9px;
          line-height: 1.55;
          word-break:
            break-word;
        }

        /* ==========================
           PROGRESS
        ========================== */

        .big-progress {
          margin-top: 24px;
        }

        .big-progress
          strong {
          display: block;
          color: #2157d0;
          font-size: 44px;
        }

        .big-progress
          span {
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
          border-radius:
            inherit;
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
            repeat(
              3,
              1fr
            );
          gap: 9px;
          margin-top: 18px;
        }

        .progress-stats a {
          padding: 12px;
          border-radius: 9px;
          background: #f7f9fc;
          text-decoration: none;
          transition:
            background
              0.18s ease;
        }

        .progress-stats
          a:hover {
          background: #edf3ff;
        }

        .progress-stats span {
          color: #929daf;
          font-size: 7px;
        }

        .progress-stats
          strong {
          display: block;
          margin-top: 5px;
          font-size: 16px;
        }

        .panel-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 17px;
          color: #2658ce;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        /* ==========================
           LONG CONTENT
        ========================== */

        .long-copy {
          margin:
            21px 0 0;
          color: #5f6e84;
          font-size: 10px;
          line-height: 1.85;
          white-space:
            pre-line;
        }

        .empty-detail {
          display: flex;
          min-height: 110px;
          align-items: center;
          gap: 11px;
          margin-top: 19px;
          padding: 16px;
          border:
            1px dashed #d5dce6;
          border-radius: 11px;
          background: #fafbfc;
          color: #8995a7;
        }

        .empty-detail
          svg {
          flex: 0 0 auto;
          color: #8798b3;
        }

        .empty-detail span {
          font-size: 9px;
          line-height: 1.6;
        }

        /* ==========================
           LISTS
        ========================== */

        .number-list,
        .check-list,
        .guideline-list {
          margin-top: 20px;
        }

        .number-list > div,
        .guideline-list
          > div {
          display: grid;
          grid-template-columns:
            35px 1fr;
          gap: 11px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
        }

        .number-list
          > div:first-child,
        .guideline-list
          > div:first-child {
          border-top: 0;
        }

        .number-list
          > div
          > span,
        .guideline-list
          > div
          > span {
          color: #2b5bd2;
          font-size: 8px;
          font-weight: 900;
        }

        .number-list p,
        .guideline-list p {
          margin: 0;
          color: #637087;
          font-size: 10px;
          line-height: 1.65;
        }

        .check-list > div {
          display: flex;
          align-items:
            flex-start;
          gap: 10px;
          padding: 13px 0;
          border-top:
            1px solid #edf0f5;
          color: #637087;
          font-size: 10px;
          line-height: 1.6;
        }

        .check-list
          > div:first-child {
          border-top: 0;
        }

        .check-list svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #268656;
        }

        /* ==========================
           RESOURCES
        ========================== */

        .resource-list {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              1fr
            );
          gap: 11px;
          margin-top: 20px;
        }

        .resource-list a,
        .resource-text-item {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          min-height: 78px;
          padding: 14px;
          border:
            1px solid #e3e8ef;
          border-radius: 11px;
          background: #fafcff;
          text-decoration: none;
          transition:
            border-color
              0.18s ease,
            transform
              0.18s ease;
        }

        .resource-list a:hover {
          transform:
            translateY(-1px);
          border-color:
            #bdcdea;
        }

        .resource-icon {
          display: grid;
          width: 37px;
          height: 37px;
          place-items: center;
          border-radius: 9px;
          background: #eaf1ff;
          color: #2c5bcf;
        }

        .resource-list
          strong {
          display: block;
          color: #334158;
          font-size: 9px;
        }

        .resource-list
          span {
          display: block;
          max-width: 390px;
          margin-top: 4px;
          overflow: hidden;
          color: #8490a2;
          font-size: 8px;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }

        .resource-list
          > a
          > svg {
          color: #607aa9;
        }

        /* ==========================
           COORDINATOR
        ========================== */

        .lower-grid {
          grid-template-columns:
            0.8fr 1.2fr;
        }

        .coordinator-profile {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 23px;
          padding-bottom: 18px;
          border-bottom:
            1px solid #edf0f5;
        }

        .coordinator-avatar {
          display: grid;
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          place-items: center;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              #0a2a67,
              #2158be
            );
          color: #fff;
          font-size: 18px;
          font-weight: 900;
        }

        .coordinator-profile
          span {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
        }

        .coordinator-profile
          strong {
          display: block;
          margin-top: 4px;
          color: #314058;
          font-size: 12px;
        }

        .coordinator-profile
          small {
          display: block;
          margin-top: 4px;
          color: #8a96a8;
          font-size: 8px;
        }

        .contact-list {
          margin-top: 10px;
        }

        .contact-item {
          display: grid;
          grid-template-columns:
            32px 1fr;
          align-items: center;
          gap: 10px;
          min-height: 55px;
          border-top:
            1px solid #edf0f5;
          text-decoration: none;
        }

        .contact-list
          > :first-child {
          border-top: 0;
        }

        .contact-item
          > span {
          display: grid;
          width: 31px;
          height: 31px;
          place-items: center;
          border-radius: 8px;
          background: #f1f5fb;
          color: #5772a3;
        }

        .contact-item
          label {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
        }

        .contact-item
          strong {
          display: block;
          margin-top: 4px;
          color: #46546a;
          font-size: 9px;
          word-break:
            break-word;
        }

        a.contact-item:hover
          strong {
          color: #2458cd;
        }

        /* ==========================
           TIMELINE
        ========================== */

        .timeline-card {
          display: grid;
          grid-template-columns:
            145px 1fr
            145px;
          align-items: center;
          gap: 16px;
          margin-top: 31px;
        }

        .timeline-date span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .timeline-date
          strong {
          display: block;
          margin-top: 6px;
          color: #34425a;
          font-size: 10px;
        }

        .timeline-date.right {
          text-align: right;
        }

        .timeline-visual {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 0;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border:
            3px solid #ccd6e6;
          border-radius: 50%;
          background: #fff;
        }

        .timeline-dot.active {
          border-color:
            #2459d4;
          background: #2459d4;
        }

        .timeline-track {
          height: 7px;
          overflow: hidden;
          background: #e9edf3;
        }

        .timeline-track div {
          height: 100%;
          background:
            linear-gradient(
              90deg,
              #1d53cf,
              #6c91fa
            );
        }

        .timeline-progress-box {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-top: 26px;
        }

        .timeline-progress-box
          > div {
          padding: 13px;
          border-radius: 9px;
          background: #f7f9fc;
        }

        .timeline-progress-box
          span {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
        }

        .timeline-progress-box
          strong {
          display: block;
          margin-top: 5px;
          color: #3158a7;
          font-size: 16px;
        }

        /* ==========================
           WAITING NOTICE
        ========================== */

        .waiting-notice {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 14px;
          margin-top: 17px;
          padding: 19px;
          border:
            1px solid #d4e1f7;
          border-radius: 14px;
          background: #f7faff;
        }

        .waiting-notice
          > div:first-child {
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border-radius: 11px;
          background: #e9f0ff;
          color: #2b5bd2;
        }

        .waiting-notice p {
          margin: 0;
          color: #2b5acf;
          font-size: 7px;
          font-weight: 900;
          letter-spacing:
            0.13em;
        }

        .waiting-notice h3 {
          margin:
            5px 0 4px;
          font-size: 13px;
        }

        .waiting-notice
          > div:nth-child(2)
          > span {
          color: #748197;
          font-size: 9px;
          line-height: 1.55;
        }

        .waiting-notice
          button {
          display: flex;
          min-height: 38px;
          align-items: center;
          gap: 7px;
          padding: 0 12px;
          border:
            1px solid #cbd9ef;
          border-radius: 8px;
          background: #fff;
          color: #2b58b3;
          font-size: 8px;
          font-weight: 800;
        }

        /* ==========================
           EVALUATION
        ========================== */

        .evaluation-grid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              1fr
            );
          gap: 10px;
          margin-top: 20px;
        }

        .metric {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 12px;
          min-height: 65px;
          padding: 13px;
          border:
            1px solid #e8ecf2;
          border-radius: 9px;
          background: #fafcff;
        }

        .metric span {
          color: #617087;
          font-size: 9px;
        }

        .metric strong {
          color: #2758ce;
          font-size: 10px;
        }

        .evaluation-footer {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 20px;
          margin-top: 16px;
          padding: 16px;
          border-radius: 10px;
          background: #f2f6fd;
        }

        .evaluation-footer
          span {
          display: block;
          color: #8794a7;
          font-size: 7px;
          font-weight: 900;
        }

        .evaluation-footer
          strong {
          display: block;
          margin-top: 4px;
          color: #2958bd;
          font-size: 14px;
        }

        .evaluation-footer a {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #2458cd;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        /* ==========================
           QUICK ACTIONS
        ========================== */

        .quick-actions {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              1fr
            );
          gap: 13px;
          margin-top: 17px;
        }

        .quick-actions a {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          min-height: 95px;
          padding: 17px;
          border:
            1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
          text-decoration: none;
          transition:
            border-color
              0.18s ease,
            transform
              0.18s ease;
        }

        .quick-actions a:hover {
          transform:
            translateY(-2px);
          border-color:
            #c6d3e8;
        }

        .quick-icon {
          display: grid;
          width: 39px;
          height: 39px;
          place-items: center;
          border-radius: 10px;
        }

        .quick-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .quick-icon.purple {
          background: #f3efff;
          color: #6e4bd6;
        }

        .quick-icon.orange {
          background: #fff3e6;
          color: #d87b1d;
        }

        .quick-icon.green {
          background: #ebf8f1;
          color: #258855;
        }

        .quick-actions
          strong {
          display: block;
          color: #26364d;
          font-size: 10px;
        }

        .quick-actions
          span {
          display: block;
          margin-top: 4px;
          color: #8490a3;
          font-size: 8px;
          line-height: 1.45;
        }

        .quick-actions
          > a
          > svg {
          color: #8c9bb1;
        }

        /* ==========================
           MOBILE
        ========================== */

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
          .project-grid,
          .two-column,
          .lower-grid {
            grid-template-columns:
              1fr;
          }

          .quick-actions {
            grid-template-columns:
              1fr 1fr;
          }

          .evaluation-grid {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 900px
        ) {
          .resource-list {
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
            backdrop-filter:
              blur(12px);
          }

          .mobile-header
            strong {
            display: block;
            color: #0a2c6e;
            font-size: 16px;
            letter-spacing:
              0.1em;
          }

          .mobile-header
            span {
            display: block;
            margin-top: 2px;
            color: #98a3b3;
            font-size: 6px;
            font-weight: 800;
            letter-spacing:
              0.13em;
          }

          .mobile-header
            button {
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

          .project-hero {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .status-card {
            width: 100%;
            flex-basis: auto;
          }

          .timeline-card {
            grid-template-columns:
              1fr;
          }

          .timeline-date.right {
            text-align: left;
          }

          .timeline-visual {
            width: 100%;
          }

          .waiting-notice {
            grid-template-columns:
              auto 1fr;
          }

          .waiting-notice
            button {
            grid-column:
              1 / -1;
            width: fit-content;
          }
        }

        @media (
          max-width: 560px
        ) {
          .project-hero {
            padding:
              27px 21px;
          }

          .hero-main h2 {
            font-size: 24px;
          }

          .hero-actions {
            flex-direction:
              column;
          }

          .hero-actions a {
            justify-content:
              center;
          }

          .details-grid,
          .progress-stats,
          .evaluation-grid,
          .quick-actions,
          .timeline-progress-box {
            grid-template-columns:
              1fr;
          }

          .info.wide {
            grid-column:
              auto;
          }

          .project-details-panel,
          .progress-panel,
          .objective-panel,
          .info-panel,
          .list-panel,
          .resources-panel,
          .coordinator-panel,
          .timeline-panel,
          .evaluation-panel {
            padding: 20px;
          }

          .evaluation-footer {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .error-box {
            grid-template-columns:
              auto 1fr;
          }

          .error-box button {
            grid-column:
              1 / -1;
            width: fit-content;
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

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`info ${
        wide
          ? "wide"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function EmptyDetail({
  message,
}: {
  message: string;
}) {
  return (
    <div className="empty-detail">
      <AlertCircle
        size={18}
      />

      <span>
        {message}
      </span>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span>
        {icon}
      </span>

      <div>
        <label>
          {label}
        </label>

        <strong>
          {value}
        </strong>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="contact-item"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="contact-item">
      {content}
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
