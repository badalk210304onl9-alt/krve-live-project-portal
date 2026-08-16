"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import type {
  StudentCredentials,
  StudentPortalData,
} from "@/lib/portal-types";

const SESSION_KEY =
  "krve-live-project-student-session";

type PortalResponse = {
  success?: boolean;

  message?: string;

  data?: StudentPortalData;

  student?: StudentPortalData["student"];

  tasks?: StudentPortalData["tasks"];

  summary?: StudentPortalData["summary"];
};

function extractPortalData(
  response: PortalResponse,
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

export default function LoginPage() {
  const [
    credentials,
    setCredentials,
  ] =
    useState<StudentCredentials>({
      applicationNumber: "",
      email: "",
      phone: "",
    });

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    restoring,
    setRestoring,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    const existing =
      window.localStorage.getItem(
        SESSION_KEY,
      );

    if (existing) {
      window.location.replace(
        "/dashboard",
      );

      return;
    }

    setRestoring(false);
  }, []);

  async function handleLogin(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);

    setError("");

    try {
      const response = await fetch(
        "/api/portal",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "login",

            ...credentials,
          }),

          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as PortalResponse;

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to sign in.",
        );
      }

      const portalData =
        extractPortalData(data);

      if (!portalData) {
        throw new Error(
          "Student record was verified but portal data was not returned.",
        );
      }

      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          credentials,

          portal:
            portalData,
        }),
      );

      window.location.href =
        "/dashboard";
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (restoring) {
    return (
      <main className="loading-screen">
        <Loader2
          size={30}
          className="spin"
        />

        <span>
          Preparing portal...
        </span>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <header className="brand-header">
          <div className="logo-box">
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
        </header>

        <div className="hero-copy">
          <p>
            KRVÉ LIVE BUSINESS
            PROJECT PROGRAM
          </p>

          <h1>
            Build.
            <br />

            Perform.
            <br />

            <em>
              Create impact.
            </em>
          </h1>

          <span>
            Your dedicated
            workspace for real
            business projects,
            weekly assignments,
            submissions,
            evaluations,
            performance and
            certification.
          </span>
        </div>

        <div className="features">
          <article>
            <ClipboardCheck
              size={22}
            />

            <strong>
              Real Assignments
            </strong>

            <span>
              Receive practical
              work directly from
              the KRVÉ project
              team.
            </span>
          </article>

          <article>
            <BarChart3
              size={22}
            />

            <strong>
              Performance
              Tracking
            </strong>

            <span>
              Monitor evaluation,
              task scores and
              project progress.
            </span>
          </article>

          <article>
            <BriefcaseBusiness
              size={22}
            />

            <strong>
              Career Outcomes
            </strong>

            <span>
              Strong performers
              may be considered
              for further
              opportunities.
            </span>
          </article>
        </div>

        <footer>
          KRVÉ — The Fashion
          Studio
        </footer>
      </section>

      <section className="login-panel">
        <form
          className="login-card"
          onSubmit={
            handleLogin
          }
        >
          <div className="login-icon">
            <GraduationCap
              size={25}
            />
          </div>

          <p className="small-heading">
            STUDENT ACCESS
          </p>

          <h2>
            Welcome to your
            workspace.
          </h2>

          <p className="description">
            Enter the same
            details used while
            submitting your KRVÉ
            Live Project
            application.
          </p>

          <label>
            APPLICATION NUMBER
          </label>

          <input
            type="text"
            value={
              credentials.applicationNumber
            }
            onChange={(
              event,
            ) =>
              setCredentials(
                (
                  current,
                ) => ({
                  ...current,

                  applicationNumber:
                    event.target
                      .value,
                }),
              )
            }
            placeholder="KRVE-LP-APP-..."
            autoComplete="off"
            required
          />

          <label>
            REGISTERED EMAIL
          </label>

          <input
            type="email"
            value={
              credentials.email
            }
            onChange={(
              event,
            ) =>
              setCredentials(
                (
                  current,
                ) => ({
                  ...current,

                  email:
                    event.target
                      .value,
                }),
              )
            }
            placeholder="student@example.com"
            required
          />

          <label>
            REGISTERED MOBILE
            NUMBER
          </label>

          <input
            type="tel"
            value={
              credentials.phone
            }
            onChange={(
              event,
            ) =>
              setCredentials(
                (
                  current,
                ) => ({
                  ...current,

                  phone:
                    event.target
                      .value,
                }),
              )
            }
            placeholder="+91"
            required
          />

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="spin"
                />

                VERIFYING
              </>
            ) : (
              <>
                ENTER PORTAL

                <ArrowRight
                  size={18}
                />
              </>
            )}
          </button>

          <div className="security-message">
            <ShieldCheck
              size={17}
            />

            <span>
              Secure student
              access powered by
              the KRVÉ Central
              Platform.
            </span>
          </div>

          <div className="verified-program">
            <CheckCircle2
              size={16}
            />

            KRVÉ Live Business
            Project Program
          </div>
        </form>
      </section>
    </main>
  );
}
