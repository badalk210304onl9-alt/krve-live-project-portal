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
  ExternalLink,
  FileCheck2,
  FileText,
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

type SubmissionFilter =
  | "all"
  | "submitted"
  | "approved"
  | "revision";

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

function formatDateTime(
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
      hour: "2-digit",
      minute: "2-digit",
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

function isSubmittedTask(
  task: StudentTask,
) {
  return Boolean(
    task.submittedAt ||
      task.submissionUrl ||
      task.submissionSummary ||
      [
        "submitted",
        "under_review",
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

export default function SubmissionsPage() {
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
    useState<SubmissionFilter>(
      "all",
    );

  const [
    selectedSubmission,
    setSelectedSubmission,
  ] =
    useState<StudentTask | null>(
      null,
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
            "Unable to refresh submissions.",
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

      if (
        selectedSubmission
      ) {
        const updatedTask =
          portal.tasks.find(
            (task) =>
              task.id ===
              selectedSubmission.id,
          );

        if (updatedTask) {
          setSelectedSubmission(
            updatedTask,
          );
        }
      }
    } catch (refreshError) {
      setError(
        refreshError instanceof
          Error
          ? refreshError.message
          : "Unable to refresh submissions.",
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
     SUBMISSION DATA
  ======================================================= */

  const submittedTasks =
    useMemo(() => {
      if (!session) {
        return [];
      }

      return session.portal.tasks
        .filter(
          isSubmittedTask,
        )
        .sort((a, b) => {
          const first =
            a.submittedAt
              ? new Date(
                  a.submittedAt,
                ).getTime()
              : 0;

          const second =
            b.submittedAt
              ? new Date(
                  b.submittedAt,
                ).getTime()
              : 0;

          return second - first;
        });
    }, [session]);

  const filteredSubmissions =
    useMemo(() => {
      if (
        filter === "all"
      ) {
        return submittedTasks;
      }

      if (
        filter ===
        "submitted"
      ) {
        return submittedTasks.filter(
          (task) =>
            [
              "submitted",
              "under_review",
            ].includes(
              String(
                task.status,
              ).toLowerCase(),
            ),
        );
      }

      if (
        filter ===
        "approved"
      ) {
        return submittedTasks.filter(
          (task) =>
            String(
              task.status,
            ).toLowerCase() ===
            "approved",
        );
      }

      return submittedTasks.filter(
        (task) =>
          String(
            task.status,
          ).toLowerCase() ===
          "revision_requested",
      );
    }, [
      submittedTasks,
      filter,
    ]);

  const approvedCount =
    submittedTasks.filter(
      (task) =>
        String(
          task.status,
        ).toLowerCase() ===
        "approved",
    ).length;

  const reviewCount =
    submittedTasks.filter(
      (task) =>
        [
          "submitted",
          "under_review",
        ].includes(
          String(
            task.status,
          ).toLowerCase(),
        ),
    ).length;

  const revisionCount =
    submittedTasks.filter(
      (task) =>
        String(
          task.status,
        ).toLowerCase() ===
        "revision_requested",
    ).length;

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="submission-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading your
          submissions...
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

          .submission-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .submission-loading
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
  } = session.portal;

  return (
    <main className="submissions-page">
      {/* ===================================================
          MOBILE HEADER
      =================================================== */}

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
          <div className="student-avatar">
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

        <nav className="sidebar-nav">
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                item.href ===
                "/submissions";

              return (
                <a
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className={
                    active
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
          className="mobile-overlay"
          onClick={() =>
            setMobileMenuOpen(
              false,
            )
          }
        />
      )}

      {/* ===================================================
          MAIN
      =================================================== */}

      <section className="submission-main">
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
              STUDENT WORK
              RECORD
            </p>

            <h1>
              My Submissions
            </h1>

            <span>
              Track all your
              submitted work,
              evaluation status
              and reviewer
              feedback.
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
          <div className="page-error">
            <AlertCircle
              size={17}
            />

            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="summary-grid">
          <article>
            <div className="summary-icon blue">
              <FileCheck2
                size={20}
              />
            </div>

            <div>
              <span>
                TOTAL
                SUBMISSIONS
              </span>

              <strong>
                {
                  submittedTasks.length
                }
              </strong>

              <small>
                Work submitted
                for evaluation
              </small>
            </div>
          </article>

          <article>
            <div className="summary-icon purple">
              <FileText
                size={20}
              />
            </div>

            <div>
              <span>
                UNDER REVIEW
              </span>

              <strong>
                {
                  reviewCount
                }
              </strong>

              <small>
                Waiting for
                evaluation
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
                Successfully
                approved
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
                Requires updated
                submission
              </small>
            </div>
          </article>
        </section>

        {/* =================================================
            FILTER BAR
        ================================================= */}

        <section className="filter-panel">
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
              All
            </button>

            <button
              type="button"
              className={
                filter ===
                "submitted"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "submitted",
                )
              }
            >
              Under Review
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
          </div>

          <span>
            {
              filteredSubmissions.length
            }{" "}
            submission
            {filteredSubmissions.length ===
            1
              ? ""
              : "s"}
          </span>
        </section>

        {/* =================================================
            SUBMISSIONS
        ================================================= */}

        {filteredSubmissions.length ===
        0 ? (
          <section className="empty-state">
            <div>
              <FileCheck2
                size={29}
              />
            </div>

            <h2>
              No submissions
              found
            </h2>

            <p>
              Once you submit a
              weekly task, your
              submission history
              will automatically
              appear here.
            </p>

            <a href="/tasks">
              <ClipboardList
                size={15}
              />

              Go to Weekly Tasks
            </a>
          </section>
        ) : (
          <section className="submission-list">
            {filteredSubmissions.map(
              (task) => (
                <article
                  key={task.id}
                  className="submission-card"
                >
                  <div className="submission-number">
                    <span>
                      WEEK
                    </span>

                    <strong>
                      {
                        task.weekNumber
                      }
                    </strong>
                  </div>

                  <div className="submission-content">
                    <div className="submission-top">
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
                          Submitted{" "}
                          {formatDateTime(
                            task.submittedAt,
                          )}
                        </p>
                      </div>

                      {task.score !==
                        null &&
                        task.score !==
                          undefined && (
                        <div className="score-box">
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

                    <div className="submission-info">
                      <div>
                        <span>
                          DUE DATE
                        </span>

                        <strong>
                          {formatDate(
                            task.dueDate,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          SUBMITTED ON
                        </span>

                        <strong>
                          {formatDate(
                            task.submittedAt,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          STATUS
                        </span>

                        <strong>
                          {statusLabel(
                            task.status,
                          )}
                        </strong>
                      </div>
                    </div>

                    {task.submissionSummary && (
                      <div className="summary-preview">
                        <span>
                          WORK SUMMARY
                        </span>

                        <p>
                          {
                            task.submissionSummary
                          }
                        </p>
                      </div>
                    )}

                    {task.reviewerComment && (
                      <div className="feedback-preview">
                        <MessageSquareText
                          size={18}
                        />

                        <div>
                          <strong>
                            Reviewer
                            Feedback
                          </strong>

                          <p>
                            {
                              task.reviewerComment
                            }
                          </p>
                        </div>
                      </div>
                    )}

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
                            Update this
                            work from
                            Weekly Tasks
                            and resubmit
                            it for
                            evaluation.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="submission-actions">
                      {task.submissionUrl && (
                        <a
                          href={
                            task.submissionUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="work-link"
                        >
                          <ExternalLink
                            size={15}
                          />

                          Open Submitted
                          Work
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSubmission(
                            task,
                          )
                        }
                      >
                        View Details
                      </button>

                      {String(
                        task.status,
                      ).toLowerCase() ===
                        "revision_requested" && (
                        <a
                          href="/tasks"
                          className="revision-link"
                        >
                          Update Work
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

      {/* ===================================================
          DETAIL DRAWER
      =================================================== */}

      {selectedSubmission && (
        <div className="detail-layer">
          <button
            type="button"
            className="detail-backdrop"
            onClick={() =>
              setSelectedSubmission(
                null,
              )
            }
          />

          <aside className="detail-drawer">
            <header>
              <div>
                <p>
                  SUBMISSION
                  RECORD
                </p>

                <h2>
                  Week{" "}
                  {
                    selectedSubmission.weekNumber
                  }
                </h2>

                <span>
                  {
                    selectedSubmission.title
                  }
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedSubmission(
                    null,
                  )
                }
              >
                <X size={20} />
              </button>
            </header>

            <div className="detail-body">
              <div className="detail-status">
                <div>
                  <span>
                    CURRENT STATUS
                  </span>

                  <strong
                    className={`detail-status-text ${getStatusClass(
                      selectedSubmission.status,
                    )}`}
                  >
                    {statusLabel(
                      selectedSubmission.status,
                    )}
                  </strong>
                </div>

                {selectedSubmission.score !==
                  null &&
                  selectedSubmission.score !==
                    undefined && (
                  <div>
                    <span>
                      EVALUATION
                      SCORE
                    </span>

                    <strong className="detail-score">
                      {
                        selectedSubmission.score
                      }
                    </strong>
                  </div>
                )}
              </div>

              <section className="detail-section">
                <span className="section-label">
                  TASK
                </span>

                <h3>
                  {
                    selectedSubmission.title
                  }
                </h3>

                <p>
                  {selectedSubmission.description ||
                    "No task description was provided."}
                </p>
              </section>

              <section className="detail-grid">
                <div>
                  <span>
                    WEEK
                  </span>

                  <strong>
                    Week{" "}
                    {
                      selectedSubmission.weekNumber
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    DUE DATE
                  </span>

                  <strong>
                    {formatDate(
                      selectedSubmission.dueDate,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    SUBMITTED
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedSubmission.submittedAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    STATUS
                  </span>

                  <strong>
                    {statusLabel(
                      selectedSubmission.status,
                    )}
                  </strong>
                </div>
              </section>

              <section className="detail-section">
                <span className="section-label">
                  WORK SUMMARY
                </span>

                <p className="long-text">
                  {selectedSubmission.submissionSummary ||
                    "No work summary was provided."}
                </p>
              </section>

              <section className="detail-section">
                <span className="section-label">
                  STUDENT REMARKS
                </span>

                <p className="long-text">
                  {selectedSubmission.studentRemarks ||
                    "No student remarks were provided."}
                </p>
              </section>

              <section className="detail-section">
                <span className="section-label">
                  REVIEWER
                  FEEDBACK
                </span>

                {selectedSubmission.reviewerComment ? (
                  <div className="drawer-feedback">
                    <MessageSquareText
                      size={18}
                    />

                    <p>
                      {
                        selectedSubmission.reviewerComment
                      }
                    </p>
                  </div>
                ) : (
                  <div className="waiting-review">
                    <Loader2
                      size={17}
                    />

                    Evaluation
                    feedback has
                    not been
                    published yet.
                  </div>
                )}
              </section>

              {selectedSubmission.submissionUrl && (
                <a
                  href={
                    selectedSubmission.submissionUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="drawer-open-work"
                >
                  <ExternalLink
                    size={16}
                  />

                  OPEN SUBMITTED
                  WORK
                </a>
              )}

              {String(
                selectedSubmission.status,
              ).toLowerCase() ===
                "revision_requested" && (
                <a
                  href="/tasks"
                  className="drawer-revise"
                >
                  <AlertCircle
                    size={16}
                  />

                  GO TO TASK &
                  RESUBMIT
                </a>
              )}
            </div>
          </aside>
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

        .submissions-page {
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
          border-right: 1px solid #dfe5ed;
          background: #ffffff;
        }

        .sidebar-brand {
          display: flex;
          min-height: 84px;
          align-items: center;
          gap: 12px;
          padding: 0 22px;
          border-bottom: 1px solid #edf1f5;
        }

        .brand-logo {
          display: grid;
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(
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
          border: 1px solid #e4eaf2;
          border-radius: 13px;
          background: #f8faff;
        }

        .student-avatar {
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
        }

        .sidebar-nav a:hover {
          background: #f3f6fb;
        }

        .sidebar-nav a.active {
          background: linear-gradient(
            135deg,
            #09172f,
            #102e67
          );
          color: #fff;
        }

        .sidebar-bottom {
          padding: 16px;
          border-top: 1px solid #edf1f5;
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
          border: 1px solid #dfe5ed;
          border-radius: 9px;
          background: #fff;
          color: #66748a;
          font-size: 9px;
        }

        /* MAIN */

        .submission-main {
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
          border-bottom: 1px solid #dfe5ed;
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
          border: 1px solid #dce3ed;
          border-radius: 9px;
          background: #fff;
          color: #52637b;
          font-size: 9px;
          font-weight: 800;
        }

        .page-error {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding: 13px;
          border: 1px solid #ffd2d6;
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
          border: 1px solid #dfe5ed;
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

        .filter-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 18px;
          padding: 12px 14px;
          border: 1px solid #dfe5ed;
          border-radius: 13px;
          background: #fff;
        }

        .filter-panel > div {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .filter-panel button {
          min-height: 35px;
          padding: 0 13px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #718096;
          font-size: 9px;
          font-weight: 800;
        }

        .filter-panel button.active {
          background: #0c2c70;
          color: #fff;
        }

        .filter-panel > span {
          color: #929dae;
          font-size: 9px;
        }

        /* SUBMISSION LIST */

        .submission-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .submission-card {
          display: grid;
          grid-template-columns:
            100px 1fr;
          overflow: hidden;
          border: 1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .submission-number {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: #f4f7fd;
        }

        .submission-number span {
          color: #8793a5;
          font-size: 8px;
          font-weight: 900;
        }

        .submission-number strong {
          margin-top: 4px;
          color: #2558d0;
          font-size: 30px;
        }

        .submission-content {
          padding: 23px;
        }

        .submission-top {
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

        .submission-top h2 {
          margin: 11px 0 5px;
          color: #1b2941;
          font-size: 18px;
        }

        .submission-top p {
          margin: 0;
          color: #929dae;
          font-size: 9px;
        }

        .score-box {
          min-width: 70px;
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

        .submission-info {
          display: grid;
          grid-template-columns:
            repeat(3, 1fr);
          gap: 10px;
          margin-top: 18px;
        }

        .submission-info > div {
          padding: 12px;
          border: 1px solid #e8ecf2;
          border-radius: 9px;
          background: #fafcff;
        }

        .submission-info span,
        .summary-preview > span {
          display: block;
          color: #99a4b4;
          font-size: 7px;
          font-weight: 900;
        }

        .submission-info strong {
          display: block;
          margin-top: 5px;
          color: #3d4b61;
          font-size: 9px;
        }

        .summary-preview {
          margin-top: 15px;
          padding: 14px;
          border-radius: 10px;
          background: #f7f9fc;
        }

        .summary-preview p {
          margin: 7px 0 0;
          color: #69778c;
          font-size: 10px;
          line-height: 1.65;
        }

        .feedback-preview,
        .revision-box {
          display: flex;
          gap: 11px;
          margin-top: 14px;
          padding: 14px;
          border-radius: 10px;
        }

        .feedback-preview {
          background: #eef4ff;
          color: #315dba;
        }

        .feedback-preview strong,
        .revision-box strong {
          font-size: 9px;
        }

        .feedback-preview p {
          margin: 5px 0 0;
          color: #667b9f;
          font-size: 10px;
          line-height: 1.6;
        }

        .revision-box {
          border: 1px solid #ffe0b2;
          background: #fff8eb;
          color: #b66b13;
        }

        .revision-box span {
          display: block;
          margin-top: 5px;
          font-size: 9px;
          line-height: 1.5;
        }

        .submission-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 17px;
        }

        .submission-actions a,
        .submission-actions button {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 14px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .work-link {
          border: 1px solid #dce3ec;
          color: #5c6d84;
        }

        .submission-actions button {
          border: 0;
          background: #123d98;
          color: #fff;
        }

        .revision-link {
          border: 1px solid #f1c678;
          background: #fff8e9;
          color: #a96610;
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
          border: 1px solid #dfe5ed;
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
          max-width: 430px;
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

        /* DRAWER */

        .detail-layer {
          position: fixed;
          inset: 0;
          z-index: 9999;
        }

        .detail-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background:
            rgba(
              7,
              15,
              31,
              0.65
            );
          backdrop-filter:
            blur(5px);
        }

        .detail-drawer {
          position: absolute;
          inset: 0 0 0 auto;
          width: min(
            620px,
            96vw
          );
          overflow-y: auto;
          background: #fff;
          box-shadow:
            -20px 0 70px
            rgba(
              12,
              29,
              61,
              0.22
            );
        }

        .detail-drawer header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 32px;
          border-bottom: 1px solid #e4e9f0;
        }

        .detail-drawer header p {
          margin: 0;
          color: #2b59cf;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .detail-drawer header h2 {
          margin: 8px 0 4px;
          font-size: 26px;
        }

        .detail-drawer header span {
          color: #8793a5;
          font-size: 10px;
        }

        .detail-drawer header button {
          display: grid;
          width: 41px;
          height: 41px;
          place-items: center;
          border: 1px solid #dce3ec;
          border-radius: 10px;
          background: #fff;
        }

        .detail-body {
          padding: 27px 32px 45px;
        }

        .detail-status {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 12px;
        }

        .detail-status > div {
          padding: 15px;
          border: 1px solid #e4e9f0;
          border-radius: 11px;
          background: #fafcff;
        }

        .detail-status span,
        .detail-grid span,
        .section-label {
          display: block;
          color: #98a3b4;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .detail-status-text {
          display: block;
          margin-top: 7px;
          font-size: 13px;
        }

        .detail-status-text.success {
          color: #188449;
        }

        .detail-status-text.review {
          color: #2558ce;
        }

        .detail-status-text.warning {
          color: #b66d13;
        }

        .detail-status-text.danger {
          color: #c03945;
        }

        .detail-status-text.neutral {
          color: #68768a;
        }

        .detail-score {
          display: block;
          margin-top: 5px;
          color: #2258d2;
          font-size: 22px;
        }

        .detail-section {
          margin-top: 22px;
        }

        .detail-section h3 {
          margin: 7px 0 0;
          font-size: 16px;
        }

        .detail-section > p {
          margin: 8px 0 0;
          color: #718096;
          font-size: 10px;
          line-height: 1.7;
        }

        .detail-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .detail-grid > div {
          padding: 13px;
          border: 1px solid #e7ebf1;
          border-radius: 9px;
          background: #fafcff;
        }

        .detail-grid strong {
          display: block;
          margin-top: 5px;
          color: #3d4b61;
          font-size: 9px;
        }

        .long-text {
          padding: 14px;
          border-radius: 10px;
          background: #f7f9fc;
          white-space: pre-wrap;
        }

        .drawer-feedback {
          display: flex;
          gap: 10px;
          margin-top: 8px;
          padding: 14px;
          border-radius: 10px;
          background: #eef4ff;
          color: #315dba;
        }

        .drawer-feedback p {
          margin: 0;
          color: #637a9f;
          font-size: 10px;
          line-height: 1.7;
        }

        .waiting-review {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding: 14px;
          border-radius: 10px;
          background: #f5f7fa;
          color: #7c8899;
          font-size: 9px;
        }

        .drawer-open-work,
        .drawer-revise {
          display: flex;
          width: 100%;
          height: 49px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 0.05em;
        }

        .drawer-open-work {
          background: linear-gradient(
            135deg,
            #123e9c,
            #235de5
          );
          color: #fff;
        }

        .drawer-revise {
          border: 1px solid #f0c67d;
          background: #fff8e9;
          color: #a76611;
        }

        /* MOBILE */

        .mobile-header,
        .mobile-overlay {
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
            justify-content: space-between;
            padding: 0 18px;
            border-bottom: 1px solid #dfe5ed;
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
            border: 1px solid #dce3ec;
            border-radius: 9px;
            background: #fff;
          }

          .portal-sidebar {
            z-index: 1001;
            width: 280px;
            transform:
              translateX(-100%);
            transition:
              transform 0.25s ease;
          }

          .portal-sidebar.mobile-open {
            transform:
              translateX(0);
          }

          .mobile-close {
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

          .submission-main {
            margin-left: 0;
            padding: 0 17px 40px;
          }

          .submission-card {
            grid-template-columns:
              1fr;
          }

          .submission-number {
            min-height: 60px;
            flex-direction: row;
            gap: 7px;
          }

          .submission-number strong {
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

          .filter-panel {
            align-items: flex-start;
            flex-direction: column;
          }

          .submission-top {
            flex-direction: column;
          }

          .score-box {
            text-align: left;
          }

          .submission-info,
          .detail-status,
          .detail-grid {
            grid-template-columns:
              1fr;
          }

          .submission-actions {
            justify-content: flex-start;
          }

          .detail-drawer {
            width: 100%;
          }

          .detail-drawer header,
          .detail-body {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </main>
  );
}
