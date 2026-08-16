"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
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
  Send,
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

type FeedbackFilter =
  | "all"
  | "approved"
  | "revision"
  | "reviewed";

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
    icon: Send,
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

function getStatusClass(
  value?: string | null,
) {
  const status =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    status === "approved" ||
    status === "completed"
  ) {
    return "success";
  }

  if (
    status === "submitted" ||
    status === "under_review"
  ) {
    return "review";
  }

  if (
    status ===
    "revision_requested"
  ) {
    return "warning";
  }

  if (
    status === "rejected"
  ) {
    return "danger";
  }

  return "neutral";
}

function hasFeedback(
  task: StudentTask,
) {
  return Boolean(
    task.reviewerComment ||
      task.score !== null &&
        task.score !== undefined ||
      [
        "approved",
        "revision_requested",
        "rejected",
      ].includes(
        String(
          task.status,
        ).toLowerCase(),
      ),
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function FeedbackPage() {
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
    filter,
    setFilter,
  ] =
    useState<FeedbackFilter>(
      "all",
    );

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
            "Unable to refresh feedback.",
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
          : "Unable to refresh feedback.",
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
     FEEDBACK DATA
  ======================================================= */

  const feedbackTasks =
    useMemo(() => {
      if (!session) {
        return [];
      }

      return session.portal.tasks
        .filter(
          hasFeedback,
        )
        .sort(
          (a, b) =>
            Number(
              b.weekNumber || 0,
            ) -
            Number(
              a.weekNumber || 0,
            ),
        );
    }, [session]);

  const filteredFeedback =
    useMemo(() => {
      if (
        filter === "all"
      ) {
        return feedbackTasks;
      }

      if (
        filter ===
        "approved"
      ) {
        return feedbackTasks.filter(
          (task) =>
            String(
              task.status,
            ).toLowerCase() ===
            "approved",
        );
      }

      if (
        filter ===
        "revision"
      ) {
        return feedbackTasks.filter(
          (task) =>
            String(
              task.status,
            ).toLowerCase() ===
            "revision_requested",
        );
      }

      return feedbackTasks.filter(
        (task) =>
          task.score !== null &&
          task.score !== undefined,
      );
    }, [
      feedbackTasks,
      filter,
    ]);

  const approvedCount =
    feedbackTasks.filter(
      (task) =>
        String(
          task.status,
        ).toLowerCase() ===
        "approved",
    ).length;

  const revisionCount =
    feedbackTasks.filter(
      (task) =>
        String(
          task.status,
        ).toLowerCase() ===
        "revision_requested",
    ).length;

  const scoredTasks =
    feedbackTasks.filter(
      (task) =>
        task.score !== null &&
        task.score !== undefined,
    );

  const averageScore =
    scoredTasks.length > 0
      ? Math.round(
          scoredTasks.reduce(
            (
              total,
              task,
            ) =>
              total +
              Number(
                task.score || 0,
              ),
            0,
          ) /
            scoredTasks.length,
        )
      : null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="feedback-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading evaluator
          feedback...
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

          .feedback-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .feedback-loading span {
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

  return (
    <main className="feedback-page">
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
                    "/feedback"
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
              EVALUATION &
              REVIEW
            </p>

            <h1>
              Feedback
            </h1>

            <span>
              View task-wise
              evaluator comments,
              scores and revision
              requests.
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
            <AlertCircle
              size={17}
            />

            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="summary-grid">
          <article>
            <div className="summary-icon blue">
              <MessageSquareText
                size={20}
              />
            </div>

            <div>
              <span>
                FEEDBACK ITEMS
              </span>

              <strong>
                {
                  feedbackTasks.length
                }
              </strong>

              <small>
                Reviewed tasks
              </small>
            </div>
          </article>

          <article>
            <div className="summary-icon green">
              <CheckCircle2
                size={20}
              />
            </div>

            <div>
              <span>
                APPROVED
              </span>

              <strong>
                {
                  approvedCount
                }
              </strong>

              <small>
                Work approved
              </small>
            </div>
          </article>

          <article>
            <div className="summary-icon orange">
              <AlertCircle
                size={20}
              />
            </div>

            <div>
              <span>
                REVISION
              </span>

              <strong>
                {
                  revisionCount
                }
              </strong>

              <small>
                Needs update
              </small>
            </div>
          </article>

          <article>
            <div className="summary-icon purple">
              <BarChart3
                size={20}
              />
            </div>

            <div>
              <span>
                AVG. TASK SCORE
              </span>

              <strong>
                {averageScore ??
                  "—"}
              </strong>

              <small>
                Reviewed tasks
              </small>
            </div>
          </article>
        </section>

        {/* FILTERS */}

        <section className="filter-bar">
          <div>
            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All Feedback
            </button>

            <button
              type="button"
              className={
                filter ===
                "approved"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "approved",
                )
              }
            >
              Approved
            </button>

            <button
              type="button"
              className={
                filter ===
                "revision"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "revision",
                )
              }
            >
              Revision
            </button>

            <button
              type="button"
              className={
                filter ===
                "reviewed"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "reviewed",
                )
              }
            >
              Scored
            </button>
          </div>

          <span>
            {
              filteredFeedback.length
            }{" "}
            record
            {filteredFeedback.length ===
            1
              ? ""
              : "s"}
          </span>
        </section>

        {/* FEEDBACK LIST */}

        {filteredFeedback.length ===
        0 ? (
          <section className="empty-state">
            <div>
              <MessageSquareText
                size={29}
              />
            </div>

            <h2>
              No feedback yet
            </h2>

            <p>
              Evaluator comments,
              scores and revision
              requests will appear
              here after your
              submissions are
              reviewed.
            </p>

            <a href="/submissions">
              <FileCheck2
                size={15}
              />

              View My
              Submissions
            </a>
          </section>
        ) : (
          <section className="feedback-list">
            {filteredFeedback.map(
              (task) => (
                <article
                  key={task.id}
                  className="feedback-card"
                >
                  <div className="week-column">
                    <span>
                      WEEK
                    </span>

                    <strong>
                      {
                        task.weekNumber
                      }
                    </strong>
                  </div>

                  <div className="feedback-content">
                    <div className="feedback-top">
                      <div>
                        <span
                          className={`status-pill ${getStatusClass(
                            task.status,
                          )}`}
                        >
                          {statusLabel(
                            task.status,
                          )}
                        </span>

                        <h2>
                          {
                            task.title
                          }
                        </h2>

                        <p>
                          Due{" "}
                          {formatDate(
                            task.dueDate,
                          )}
                        </p>
                      </div>

                      <div className="score-box">
                        <span>
                          TASK SCORE
                        </span>

                        <strong>
                          {task.score ??
                            "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="feedback-message">
                      <div className="message-icon">
                        <MessageSquareText
                          size={18}
                        />
                      </div>

                      <div>
                        <span>
                          EVALUATOR
                          FEEDBACK
                        </span>

                        <p>
                          {task.reviewerComment ||
                            "No written feedback was provided for this task."}
                        </p>
                      </div>
                    </div>

                    {String(
                      task.status,
                    ).toLowerCase() ===
                      "revision_requested" && (
                      <div className="revision-box">
                        <AlertCircle
                          size={18}
                        />

                        <div>
                          <strong>
                            Revision
                            Required
                          </strong>

                          <span>
                            Review the
                            evaluator
                            comments,
                            update your
                            work and
                            submit the
                            revised
                            version from
                            Weekly
                            Tasks.
                          </span>
                        </div>
                      </div>
                    )}

                    {String(
                      task.status,
                    ).toLowerCase() ===
                      "approved" && (
                      <div className="approved-box">
                        <CheckCircle2
                          size={18}
                        />

                        <div>
                          <strong>
                            Task
                            Approved
                          </strong>

                          <span>
                            This task has
                            successfully
                            passed the
                            evaluator's
                            review.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="feedback-meta">
                      <div>
                        <span>
                          SUBMITTED
                        </span>

                        <strong>
                          {formatDate(
                            task.submittedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          CURRENT STATUS
                        </span>

                        <strong>
                          {statusLabel(
                            task.status,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          WEEK
                        </span>

                        <strong>
                          Week{" "}
                          {
                            task.weekNumber
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="feedback-actions">
                      {task.submissionUrl && (
                        <a
                          href={
                            task.submissionUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Submitted
                          Work
                        </a>
                      )}

                      <a href="/submissions">
                        View Submission
                      </a>

                      {String(
                        task.status,
                      ).toLowerCase() ===
                        "revision_requested" && (
                        <a
                          href="/tasks"
                          className="revision-action"
                        >
                          Go to Task &
                          Resubmit
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ),
            )}
          </section>
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

        .feedback-page {
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

        .page-header p {
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
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 13px;
          border:
            1px solid #ffd2d6;
          border-radius: 10px;
          background: #fff4f5;
          color: #b32d38;
          font-size: 10px;
        }

        /* SUMMARY */

        .summary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 14px;
          margin-top: 24px;
        }

        .summary-grid article {
          display: flex;
          min-height: 125px;
          align-items: flex-start;
          gap: 13px;
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
          flex: 0 0 40px;
          place-items: center;
          border-radius: 11px;
        }

        .summary-icon.blue {
          background: #edf3ff;
          color: #2d60dd;
        }

        .summary-icon.green {
          background: #ebf8f1;
          color: #258855;
        }

        .summary-icon.orange {
          background: #fff3e6;
          color: #d87b1d;
        }

        .summary-icon.purple {
          background: #f3efff;
          color: #6e4bd6;
        }

        .summary-grid article span {
          color: #8d98a9;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.07em;
        }

        .summary-grid article strong {
          display: block;
          margin-top: 5px;
          font-size: 25px;
        }

        .summary-grid article small {
          display: block;
          margin-top: 5px;
          color: #a0a9b7;
          font-size: 8px;
        }

        /* FILTER */

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 18px;
          padding: 12px 14px;
          border:
            1px solid #dfe5ed;
          border-radius: 13px;
          background: #fff;
        }

        .filter-bar > div {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .filter-bar button {
          min-height: 35px;
          padding: 0 13px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #718096;
          font-size: 9px;
          font-weight: 800;
        }

        .filter-bar button.active {
          background: #0c2c70;
          color: #fff;
        }

        .filter-bar > span {
          color: #929dae;
          font-size: 9px;
        }

        /* FEEDBACK CARDS */

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .feedback-card {
          display: grid;
          grid-template-columns:
            100px 1fr;
          overflow: hidden;
          border:
            1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .week-column {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: #f4f7fd;
        }

        .week-column span {
          color: #8793a5;
          font-size: 8px;
          font-weight: 900;
        }

        .week-column strong {
          margin-top: 4px;
          color: #2558d0;
          font-size: 30px;
        }

        .feedback-content {
          padding: 23px;
        }

        .feedback-top {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .status-pill {
          display: inline-flex;
          width: fit-content;
          padding: 6px 9px;
          border-radius: 50px;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .status-pill.success {
          background: #e9f8ef;
          color: #188449;
        }

        .status-pill.review {
          background: #eaf1ff;
          color: #2558ce;
        }

        .status-pill.warning {
          background: #fff3dd;
          color: #b66d13;
        }

        .status-pill.danger {
          background: #fff0f1;
          color: #c03945;
        }

        .status-pill.neutral {
          background: #f0f3f7;
          color: #68768a;
        }

        .feedback-top h2 {
          margin: 11px 0 5px;
          font-size: 18px;
        }

        .feedback-top p {
          margin: 0;
          color: #929dae;
          font-size: 9px;
        }

        .score-box {
          min-width: 80px;
          text-align: right;
        }

        .score-box span {
          color: #99a3b3;
          font-size: 7px;
          font-weight: 900;
        }

        .score-box strong {
          display: block;
          margin-top: 4px;
          color: #2058d3;
          font-size: 26px;
        }

        .feedback-message {
          display: flex;
          gap: 12px;
          margin-top: 18px;
          padding: 16px;
          border-radius: 11px;
          background: #f4f7fc;
        }

        .message-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          place-items: center;
          border-radius: 10px;
          background: #e9f0ff;
          color: #2b59cf;
        }

        .feedback-message span {
          display: block;
          color: #6881b2;
          font-size: 7px;
          font-weight: 900;
        }

        .feedback-message p {
          margin: 7px 0 0;
          color: #66758a;
          font-size: 10px;
          line-height: 1.7;
        }

        .revision-box,
        .approved-box {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          padding: 14px;
          border-radius: 10px;
        }

        .revision-box {
          border:
            1px solid #ffe0b2;
          background: #fff8eb;
          color: #b66b13;
        }

        .approved-box {
          border:
            1px solid #ccebd8;
          background: #effbf4;
          color: #227a4c;
        }

        .revision-box strong,
        .approved-box strong {
          font-size: 9px;
        }

        .revision-box span,
        .approved-box span {
          display: block;
          margin-top: 4px;
          font-size: 9px;
          line-height: 1.5;
        }

        .feedback-meta {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }

        .feedback-meta > div {
          padding: 12px;
          border:
            1px solid #e8ecf2;
          border-radius: 9px;
          background: #fafcff;
        }

        .feedback-meta span {
          display: block;
          color: #99a4b4;
          font-size: 7px;
          font-weight: 900;
        }

        .feedback-meta strong {
          display: block;
          margin-top: 5px;
          color: #3d4b61;
          font-size: 9px;
        }

        .feedback-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 17px;
        }

        .feedback-actions a {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border:
            1px solid #dce3ec;
          border-radius: 9px;
          color: #5c6d84;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .feedback-actions .revision-action {
          border-color: #f0c77d;
          background: #fff8e9;
          color: #a86710;
        }

        /* EMPTY */

        .empty-state {
          display: flex;
          min-height: 330px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          margin-top: 18px;
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
          background: #edf3fc;
          color: #5474aa;
        }

        .empty-state h2 {
          margin: 15px 0 6px;
          font-size: 16px;
        }

        .empty-state p {
          max-width: 460px;
          margin: 0;
          color: #8793a4;
          font-size: 10px;
          line-height: 1.6;
        }

        .empty-state a {
          display: inline-flex;
          height: 40px;
          align-items: center;
          gap: 7px;
          margin-top: 17px;
          padding: 0 14px;
          border-radius: 9px;
          background: #123e9c;
          color: #fff;
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
          max-width: 1080px
        ) {
          .summary-grid {
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

          .feedback-card {
            grid-template-columns:
              1fr;
          }

          .week-column {
            min-height: 60px;
            flex-direction: row;
            gap: 7px;
          }

          .week-column strong {
            font-size: 19px;
          }
        }

        @media (
          max-width: 560px
        ) {
          .summary-grid {
            grid-template-columns:
              1fr;
          }

          .filter-bar {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .feedback-top {
            flex-direction:
              column;
          }

          .score-box {
            text-align: left;
          }

          .feedback-meta {
            grid-template-columns:
              1fr;
          }

          .feedback-actions {
            justify-content:
              flex-start;
          }
        }
      `}</style>
    </main>
  );
}
