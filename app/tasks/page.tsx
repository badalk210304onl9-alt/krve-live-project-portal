"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Loader2,
  LogOut,
  Menu,
  RefreshCcw,
  Send,
  X,
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

type TaskFilter =
  | "all"
  | "pending"
  | "submitted"
  | "approved"
  | "revision";

/* =========================================================
   CONSTANTS
========================================================= */

const SESSION_KEY =
  "krve-live-project-student-session";

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

function getStatusClass(
  value?: string | null,
) {
  const status =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    [
      "approved",
      "completed",
      "active",
    ].includes(status)
  ) {
    return "success";
  }

  if (
    [
      "submitted",
      "under_review",
    ].includes(status)
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
    status ===
    "rejected"
  ) {
    return "danger";
  }

  return "neutral";
}

function getPriorityClass(
  value?: string | null,
) {
  const priority =
    String(value || "")
      .trim()
      .toLowerCase();

  if (priority === "high") {
    return "high";
  }

  if (priority === "low") {
    return "low";
  }

  return "medium";
}

function getDueText(
  task: StudentTask,
) {
  if (
    task.status ===
    "approved"
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

  const now =
    new Date();

  const days =
    Math.ceil(
      (due.getTime() -
        now.getTime()) /
        86400000,
    );

  if (days < 0) {
    return `${Math.abs(
      days,
    )} day${
      Math.abs(days) === 1
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

/* =========================================================
   PAGE
========================================================= */

export default function TasksPage() {
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
    filter,
    setFilter,
  ] =
    useState<TaskFilter>(
      "all",
    );

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<StudentTask | null>(
      null,
    );

  const [
    submissionUrl,
    setSubmissionUrl,
  ] =
    useState("");

  const [
    submissionSummary,
    setSubmissionSummary,
  ] =
    useState("");

  const [
    studentRemarks,
    setStudentRemarks,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  /* =======================================================
     RESTORE SESSION
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
            "Unable to refresh tasks.",
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
          : "Unable to refresh tasks.",
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
     OPEN SUBMISSION
  ======================================================= */

  function openSubmission(
    task: StudentTask,
  ) {
    setSelectedTask(
      task,
    );

    setSubmissionUrl(
      task.submissionUrl ||
        "",
    );

    setSubmissionSummary(
      task.submissionSummary ||
        "",
    );

    setStudentRemarks(
      task.studentRemarks ||
        "",
    );

    setError("");
    setSuccess("");
  }

  /* =======================================================
     SUBMIT TASK
  ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedTask ||
      !session
    ) {
      return;
    }

    setSubmitting(
      true,
    );

    setError("");
    setSuccess("");

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
                  "submit",

                applicationNumber:
                  session.credentials.applicationNumber,

                email:
                  session.credentials.email,

                phone:
                  session.credentials.phone,

                taskId:
                  selectedTask.id,

                submissionUrl,

                submissionSummary,

                studentRemarks,
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
            "Unable to submit task.",
        );
      }

      setSuccess(
        "Your work has been submitted successfully and is now waiting for evaluation.",
      );

      await refreshPortal(
        session.credentials,
        false,
      );

      window.setTimeout(
        () => {
          setSelectedTask(
            null,
          );

          setSuccess("");
        },
        1500,
      );
    } catch (submitError) {
      setError(
        submitError instanceof
          Error
          ? submitError.message
          : "Unable to submit work.",
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  /* =======================================================
     FILTERED TASKS
  ======================================================= */

  const filteredTasks =
    useMemo(() => {
      if (!session) {
        return [];
      }

      const tasks =
        session.portal.tasks;

      if (filter === "all") {
        return tasks;
      }

      if (
        filter ===
        "pending"
      ) {
        return tasks.filter(
          (task) =>
            ![
              "submitted",
              "under_review",
              "approved",
              "revision_requested",
            ].includes(
              String(
                task.status,
              ).toLowerCase(),
            ),
        );
      }

      if (
        filter ===
        "submitted"
      ) {
        return tasks.filter(
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
        return tasks.filter(
          (task) =>
            String(
              task.status,
            ).toLowerCase() ===
            "approved",
        );
      }

      return tasks.filter(
        (task) =>
          String(
            task.status,
          ).toLowerCase() ===
          "revision_requested",
      );
    }, [
      session,
      filter,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    !session
  ) {
    return (
      <main className="tasks-loading">
        <Loader2
          size={29}
          className="spin"
        />

        <span>
          Loading weekly
          tasks...
        </span>

        <style jsx global>{`
          html,
          body {
            margin: 0;
            background: #f5f7fb;
            font-family:
              Arial,
              sans-serif;
          }

          .tasks-loading {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 14px;
            color: #31578f;
          }

          .tasks-loading
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="tasks-page">
      {/* MOBILE HEADER */}

      <header className="tasks-mobile-header">
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
        className={`tasks-sidebar ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
      >
        <div className="tasks-sidebar-brand">
          <div className="tasks-logo">
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
            className="tasks-mobile-close"
            onClick={() =>
              setMobileMenuOpen(
                false,
              )
            }
          >
            <X size={19} />
          </button>
        </div>

        <div className="tasks-student-mini">
          <div className="tasks-avatar">
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

        <nav>
          <a href="/dashboard">
            Dashboard
          </a>

          <a href="/project">
            My Project
          </a>

          <a
            href="/tasks"
            className="active"
          >
            Weekly Tasks
          </a>

          <a href="/submissions">
            My Submissions
          </a>

          <a href="/feedback">
            Feedback
          </a>

          <a href="/performance">
            Performance
          </a>

          <a href="/sales">
            Sales & Impact
          </a>

          <a href="/certificate">
            Certificate
          </a>

          <a href="/profile">
            Profile
          </a>
        </nav>

        <div className="tasks-sidebar-bottom">
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
          className="tasks-overlay"
          onClick={() =>
            setMobileMenuOpen(
              false,
            )
          }
        />
      )}

      {/* MAIN */}

      <section className="tasks-main">
        <header className="tasks-header">
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
              WEEKLY PROJECT
              WORK
            </p>

            <h1>
              My Tasks
            </h1>
          </div>

          <button
            type="button"
            className="refresh-tasks"
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

        {error &&
          !selectedTask && (
          <div className="page-error">
            <AlertCircle
              size={17}
            />

            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="task-summary">
          <article>
            <span>
              TOTAL ASSIGNED
            </span>

            <strong>
              {
                summary.assignedTasks
              }
            </strong>
          </article>

          <article>
            <span>
              SUBMITTED
            </span>

            <strong>
              {
                summary.submittedTasks
              }
            </strong>
          </article>

          <article>
            <span>
              APPROVED
            </span>

            <strong>
              {
                summary.approvedTasks
              }
            </strong>
          </article>

          <article>
            <span>
              PENDING
            </span>

            <strong>
              {
                summary.pendingTasks
              }
            </strong>
          </article>
        </section>

        {/* FILTER */}

        <section className="task-filter-bar">
          <div>
            <button
              type="button"
              className={
                filter ===
                "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "all",
                )
              }
            >
              All Tasks
            </button>

            <button
              type="button"
              className={
                filter ===
                "pending"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter(
                  "pending",
                )
              }
            >
              Pending
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
              Submitted
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
              filteredTasks.length
            }{" "}
            task
            {filteredTasks.length ===
            1
              ? ""
              : "s"}
          </span>
        </section>

        {/* TASK LIST */}

        {filteredTasks.length ===
        0 ? (
          <section className="no-tasks">
            <div>
              <ClipboardList
                size={27}
              />
            </div>

            <h3>
              No tasks found
            </h3>

            <p>
              There are no tasks
              matching this
              filter.
            </p>
          </section>
        ) : (
          <section className="task-card-list">
            {filteredTasks.map(
              (task) => (
                <article
                  key={task.id}
                  className="portal-task-card"
                >
                  <div className="task-week-column">
                    <span>
                      WEEK
                    </span>

                    <strong>
                      {
                        task.weekNumber
                      }
                    </strong>
                  </div>

                  <div className="task-card-content">
                    <div className="task-card-top">
                      <div>
                        <div className="task-badges">
                          <span
                            className={`status ${getStatusClass(
                              task.status,
                            )}`}
                          >
                            {statusLabel(
                              task.status,
                            )}
                          </span>

                          <span
                            className={`priority ${getPriorityClass(
                              task.priority,
                            )}`}
                          >
                            {statusLabel(
                              task.priority ||
                                "Medium",
                            )}{" "}
                            Priority
                          </span>
                        </div>

                        <h2>
                          {
                            task.title
                          }
                        </h2>
                      </div>

                      {task.score !==
                        null &&
                        task.score !==
                          undefined && (
                        <div className="task-score">
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

                    {task.description && (
                      <p className="task-copy">
                        {
                          task.description
                        }
                      </p>
                    )}

                    <div className="task-information">
                      <div>
                        <span>
                          DUE DATE
                        </span>

                        <strong>
                          {formatDate(
                            task.dueDate,
                          )}
                        </strong>

                        <small>
                          {getDueText(
                            task,
                          )}
                        </small>
                      </div>

                      <div>
                        <span>
                          SUBMISSION
                        </span>

                        <strong>
                          {task.submittedAt
                            ? formatDate(
                                task.submittedAt,
                              )
                            : "Not submitted"}
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

                    {task.reviewerComment && (
                      <div className="task-feedback">
                        <div>
                          <FileText
                            size={17}
                          />
                        </div>

                        <div>
                          <strong>
                            Evaluator
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

                    {task.status ===
                      "revision_requested" && (
                      <div className="revision-warning">
                        <AlertCircle
                          size={17}
                        />

                        <div>
                          <strong>
                            Revision
                            Required
                          </strong>

                          <span>
                            Review the
                            evaluator
                            feedback and
                            submit an
                            updated
                            version of
                            your work.
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="task-actions">
                      {task.submissionUrl && (
                        <a
                          href={
                            task.submissionUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink
                            size={15}
                          />

                          View Submitted
                          Work
                        </a>
                      )}

                      {task.status ===
                      "approved" ? (
                        <span className="approved-action">
                          <Check
                            size={15}
                          />

                          Approved
                        </span>
                      ) : student.status ===
                        "active" ? (
                        <button
                          type="button"
                          onClick={() =>
                            openSubmission(
                              task,
                            )
                          }
                        >
                          <Send
                            size={15}
                          />

                          {task.submissionUrl
                            ? "Update Submission"
                            : "Submit Work"}
                        </button>
                      ) : (
                        <span className="inactive-action">
                          Project not
                          active
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ),
            )}
          </section>
        )}
      </section>

      {/* SUBMISSION DRAWER */}

      {selectedTask && (
        <div className="submission-layer">
          <button
            type="button"
            className="submission-backdrop"
            onClick={() =>
              setSelectedTask(
                null,
              )
            }
          />

          <aside className="submission-drawer">
            <header>
              <div>
                <p>
                  WEEK{" "}
                  {
                    selectedTask.weekNumber
                  }
                </p>

                <h2>
                  Submit Your
                  Work
                </h2>

                <span>
                  {
                    selectedTask.title
                  }
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTask(
                    null,
                  )
                }
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="drawer-task-instructions">
                <ClipboardList
                  size={19}
                />

                <div>
                  <strong>
                    Task
                    Instructions
                  </strong>

                  <p>
                    {selectedTask.description ||
                      "Complete the assigned task and submit your work evidence below."}
                  </p>
                </div>
              </div>

              <div className="submission-field">
                <label>
                  WORK /
                  SUBMISSION LINK *
                </label>

                <input
                  type="url"
                  value={
                    submissionUrl
                  }
                  onChange={(
                    event,
                  ) =>
                    setSubmissionUrl(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Google Drive / Docs / Canva / GitHub / OneDrive link"
                  required
                />

                <small>
                  Make sure your
                  evaluator can
                  access the link.
                </small>
              </div>

              <div className="submission-field">
                <label>
                  WORK SUMMARY
                </label>

                <textarea
                  rows={7}
                  value={
                    submissionSummary
                  }
                  onChange={(
                    event,
                  ) =>
                    setSubmissionSummary(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Describe what you completed, your approach, findings, analysis and business outcome..."
                />
              </div>

              <div className="submission-field">
                <label>
                  STUDENT REMARKS
                </label>

                <textarea
                  rows={4}
                  value={
                    studentRemarks
                  }
                  onChange={(
                    event,
                  ) =>
                    setStudentRemarks(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional notes for your evaluator..."
                />
              </div>

              {error && (
                <div className="drawer-error">
                  <AlertCircle
                    size={17}
                  />

                  {error}
                </div>
              )}

              {success && (
                <div className="drawer-success">
                  <CheckCircle2
                    size={17}
                  />

                  {success}
                </div>
              )}

              <button
                type="submit"
                className="final-submit"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={17}
                      className="spin"
                    />

                    SUBMITTING...
                  </>
                ) : (
                  <>
                    <Send
                      size={17}
                    />

                    {selectedTask.submissionUrl
                      ? "UPDATE SUBMISSION"
                      : "SUBMIT FOR EVALUATION"}
                  </>
                )}
              </button>
            </form>
          </aside>
        </div>
      )}

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

        .tasks-page {
          min-height: 100vh;
        }

        .tasks-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 500;
          display: flex;
          width: 265px;
          height: 100vh;
          flex-direction: column;
          border-right: 1px solid #dfe5ed;
          background: #fff;
        }

        .tasks-sidebar-brand {
          display: flex;
          min-height: 84px;
          align-items: center;
          gap: 12px;
          padding: 0 22px;
          border-bottom: 1px solid #edf1f5;
        }

        .tasks-logo {
          display: grid;
          width: 44px;
          height: 44px;
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

        .tasks-sidebar-brand strong {
          display: block;
          font-size: 16px;
          letter-spacing: 0.08em;
        }

        .tasks-sidebar-brand span {
          display: block;
          margin-top: 3px;
          color: #939fb0;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .tasks-mobile-close {
          display: none;
          margin-left: auto;
          border: 0;
          background: transparent;
        }

        .tasks-student-mini {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 17px;
          padding: 13px;
          border: 1px solid #e4eaf2;
          border-radius: 13px;
          background: #f8faff;
        }

        .tasks-avatar {
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

        .tasks-student-mini strong {
          display: block;
          max-width: 155px;
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tasks-student-mini span {
          display: block;
          margin-top: 4px;
          color: #8b97a9;
          font-size: 9px;
        }

        .tasks-sidebar nav {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding: 5px 13px 15px;
        }

        .tasks-sidebar nav a {
          display: flex;
          min-height: 44px;
          align-items: center;
          padding: 0 14px;
          border-radius: 10px;
          color: #647187;
          font-size: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        .tasks-sidebar nav a:hover {
          background: #f3f6fb;
        }

        .tasks-sidebar nav a.active {
          background: linear-gradient(
            135deg,
            #09172f,
            #102e67
          );
          color: #fff;
        }

        .tasks-sidebar-bottom {
          padding: 16px;
          border-top: 1px solid #edf1f5;
        }

        .tasks-sidebar-bottom > span {
          display: block;
          color: #9ba5b4;
          font-size: 7px;
          font-weight: 900;
        }

        .tasks-sidebar-bottom > strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #47556c;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tasks-sidebar-bottom button {
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

        .tasks-main {
          min-height: 100vh;
          margin-left: 265px;
          padding: 0 36px 50px;
        }

        .tasks-header {
          display: flex;
          min-height: 112px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #dfe5ed;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 12px;
          color: #728096;
          font-size: 9px;
          font-weight: 700;
          text-decoration: none;
        }

        .tasks-header p {
          margin: 0;
          color: #2a5ad0;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .tasks-header h1 {
          margin: 6px 0 0;
          font-size: 26px;
        }

        .refresh-tasks {
          display: flex;
          height: 40px;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border: 1px solid #dce3ed;
          border-radius: 9px;
          background: #fff;
          color: #536278;
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

        .task-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-top: 24px;
        }

        .task-summary article {
          padding: 20px;
          border: 1px solid #dfe5ed;
          border-radius: 14px;
          background: #fff;
        }

        .task-summary span {
          color: #8d98a9;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .task-summary strong {
          display: block;
          margin-top: 8px;
          font-size: 26px;
        }

        .task-filter-bar {
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

        .task-filter-bar > div {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .task-filter-bar button {
          min-height: 35px;
          padding: 0 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #718096;
          font-size: 9px;
          font-weight: 800;
        }

        .task-filter-bar button.active {
          background: #0c2c70;
          color: #fff;
        }

        .task-filter-bar > span {
          color: #929dae;
          font-size: 9px;
        }

        .task-card-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .portal-task-card {
          display: grid;
          grid-template-columns: 100px 1fr;
          overflow: hidden;
          border: 1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
        }

        .task-week-column {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          background: #f4f7fd;
        }

        .task-week-column span {
          color: #8793a5;
          font-size: 8px;
          font-weight: 900;
        }

        .task-week-column strong {
          margin-top: 4px;
          color: #2558d0;
          font-size: 30px;
        }

        .task-card-content {
          padding: 23px;
        }

        .task-card-top {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .task-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .status,
        .priority {
          display: inline-flex;
          width: fit-content;
          padding: 6px 9px;
          border-radius: 50px;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .status.success {
          background: #e9f8ef;
          color: #188449;
        }

        .status.review {
          background: #eaf1ff;
          color: #2558ce;
        }

        .status.warning {
          background: #fff3dd;
          color: #b66d13;
        }

        .status.danger {
          background: #fff0f1;
          color: #c03945;
        }

        .status.neutral {
          background: #f0f3f7;
          color: #68768a;
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

        .task-card-top h2 {
          margin: 12px 0 0;
          font-size: 18px;
        }

        .task-score {
          text-align: right;
        }

        .task-score span {
          color: #99a3b3;
          font-size: 8px;
        }

        .task-score strong {
          display: block;
          margin-top: 4px;
          color: #2058d3;
          font-size: 25px;
        }

        .task-copy {
          max-width: 900px;
          margin: 14px 0 0;
          color: #768397;
          font-size: 11px;
          line-height: 1.75;
        }

        .task-information {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .task-information > div {
          padding: 13px;
          border: 1px solid #e8ecf2;
          border-radius: 10px;
          background: #fafcff;
        }

        .task-information span {
          display: block;
          color: #99a4b4;
          font-size: 7px;
          font-weight: 900;
        }

        .task-information strong {
          display: block;
          margin-top: 5px;
          color: #3d4b61;
          font-size: 10px;
        }

        .task-information small {
          display: block;
          margin-top: 5px;
          color: #9aa5b4;
          font-size: 8px;
        }

        .task-feedback,
        .revision-warning {
          display: flex;
          gap: 11px;
          margin-top: 16px;
          padding: 14px;
          border-radius: 11px;
        }

        .task-feedback {
          background: #f4f7fc;
          color: #456186;
        }

        .revision-warning {
          border: 1px solid #ffe0b2;
          background: #fff8eb;
          color: #b66b13;
        }

        .task-feedback strong,
        .revision-warning strong {
          font-size: 9px;
        }

        .task-feedback p,
        .revision-warning span {
          display: block;
          margin: 5px 0 0;
          font-size: 10px;
          line-height: 1.6;
        }

        .task-feedback p {
          color: #718096;
        }

        .task-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 17px;
        }

        .task-actions a,
        .task-actions button,
        .approved-action,
        .inactive-action {
          display: inline-flex;
          min-height: 38px;
          align-items: center;
          gap: 7px;
          padding: 0 14px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 800;
          text-decoration: none;
        }

        .task-actions a {
          border: 1px solid #dce3ec;
          color: #5c6d84;
        }

        .task-actions button {
          border: 0;
          background: #174ec3;
          color: #fff;
        }

        .approved-action {
          background: #eaf8f0;
          color: #1f7e50;
        }

        .inactive-action {
          background: #f1f3f7;
          color: #798596;
        }

        .no-tasks {
          display: flex;
          min-height: 300px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          margin-top: 18px;
          border: 1px solid #dfe5ed;
          border-radius: 15px;
          background: #fff;
          text-align: center;
        }

        .no-tasks > div {
          display: grid;
          width: 55px;
          height: 55px;
          place-items: center;
          border-radius: 14px;
          background: #eef3fc;
          color: #5875aa;
        }

        .no-tasks h3 {
          margin: 14px 0 6px;
        }

        .no-tasks p {
          margin: 0;
          color: #8793a4;
          font-size: 10px;
        }

        .submission-layer {
          position: fixed;
          inset: 0;
          z-index: 9999;
        }

        .submission-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: rgba(
            7,
            15,
            31,
            0.65
          );
          backdrop-filter: blur(5px);
        }

        .submission-drawer {
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

        .submission-drawer header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 33px;
          border-bottom: 1px solid #e4e9f0;
        }

        .submission-drawer header p {
          margin: 0;
          color: #2b59cf;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .submission-drawer header h2 {
          margin: 8px 0 5px;
          font-size: 26px;
        }

        .submission-drawer header span {
          color: #8793a5;
          font-size: 10px;
        }

        .submission-drawer header button {
          display: grid;
          width: 41px;
          height: 41px;
          place-items: center;
          border: 1px solid #dce3ec;
          border-radius: 10px;
          background: #fff;
        }

        .submission-drawer form {
          padding: 28px 33px 45px;
        }

        .drawer-task-instructions {
          display: flex;
          gap: 11px;
          padding: 15px;
          border: 1px solid #dbe6ff;
          border-radius: 11px;
          background: #f4f7ff;
          color: #2553bf;
        }

        .drawer-task-instructions strong {
          font-size: 10px;
        }

        .drawer-task-instructions p {
          margin: 5px 0 0;
          color: #6a80ae;
          font-size: 10px;
          line-height: 1.6;
        }

        .submission-field {
          margin-top: 21px;
        }

        .submission-field label {
          display: block;
          margin-bottom: 7px;
          color: #526078;
          font-size: 9px;
          font-weight: 900;
        }

        .submission-field input,
        .submission-field textarea {
          width: 100%;
          padding: 14px;
          border: 1px solid #dbe2ec;
          border-radius: 10px;
          outline: none;
          background: #fbfcfe;
          resize: vertical;
        }

        .submission-field input {
          height: 50px;
        }

        .submission-field small {
          display: block;
          margin-top: 6px;
          color: #98a3b4;
          font-size: 8px;
        }

        .drawer-error,
        .drawer-success {
          display: flex;
          gap: 8px;
          margin-top: 18px;
          padding: 12px;
          border-radius: 9px;
          font-size: 10px;
          line-height: 1.5;
        }

        .drawer-error {
          background: #fff3f4;
          color: #b42b37;
        }

        .drawer-success {
          background: #effbf4;
          color: #22794c;
        }

        .final-submit {
          display: flex;
          width: 100%;
          height: 53px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 23px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            #123e9c,
            #235de5
          );
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .final-submit:disabled {
          opacity: 0.7;
        }

        .tasks-mobile-header,
        .tasks-overlay {
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
          .task-summary {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 820px
        ) {
          .tasks-mobile-header {
            position: sticky;
            top: 0;
            z-index: 450;
            display: flex;
            height: 62px;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            border-bottom: 1px solid #dfe5ed;
            background: rgba(
              255,
              255,
              255,
              0.95
            );
          }

          .tasks-mobile-header strong {
            color: #0a2c6e;
            letter-spacing: 0.1em;
          }

          .tasks-mobile-header button {
            display: grid;
            width: 38px;
            height: 38px;
            place-items: center;
            border: 1px solid #dce3ec;
            border-radius: 9px;
            background: #fff;
          }

          .tasks-sidebar {
            z-index: 1001;
            width: 280px;
            transform:
              translateX(-100%);
            transition:
              transform 0.25s ease;
          }

          .tasks-sidebar.open {
            transform:
              translateX(0);
          }

          .tasks-mobile-close {
            display: grid;
            place-items: center;
          }

          .tasks-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
            background: rgba(
              7,
              16,
              31,
              0.5
            );
          }

          .tasks-main {
            margin-left: 0;
            padding: 0 17px 40px;
          }

          .portal-task-card {
            grid-template-columns:
              1fr;
          }

          .task-week-column {
            min-height: 60px;
            flex-direction: row;
            gap: 7px;
          }

          .task-week-column strong {
            font-size: 19px;
          }

          .task-information {
            grid-template-columns:
              1fr 1fr;
          }
        }

        @media (
          max-width: 560px
        ) {
          .task-summary {
            grid-template-columns:
              1fr;
          }

          .task-filter-bar {
            align-items:
              flex-start;
            flex-direction: column;
          }

          .task-card-top {
            flex-direction: column;
          }

          .task-score {
            text-align: left;
          }

          .task-information {
            grid-template-columns:
              1fr;
          }

          .task-actions {
            justify-content:
              flex-start;
          }

          .submission-drawer {
            width: 100%;
          }

          .submission-drawer header,
          .submission-drawer form {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>
    </main>
  );
}
