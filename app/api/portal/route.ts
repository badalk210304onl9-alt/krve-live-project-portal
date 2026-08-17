import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  action?: "login" | "submit";

  applicationNumber?: string;
  email?: string;
  phone?: string;

  taskId?: string;
  submissionUrl?: string;
  submissionSummary?: string;
  studentRemarks?: string;
};

function normalizePhone(
  value: unknown,
) {
  const digits =
    String(value ?? "")
      .replace(/\D/g, "");

  return digits.slice(-10);
}

function getApiUrl() {
  const value =
    process.env.KRVE_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_KRVE_API_URL?.trim() ||
    "";

  if (!value) {
    throw new Error(
      "KRVE_API_URL is missing in Vercel Environment Variables.",
    );
  }

  return value.replace(
    /\/+$/,
    "",
  );
}

async function getResponseData(
  response: Response,
) {
  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    try {
      return await response.json();
    } catch {
      return {
        success: false,
        message:
          "KRVE API returned invalid JSON.",
      };
    }
  }

  const text =
    await response.text();

  return {
    success: false,
    message:
      text ||
      `KRVE API returned HTTP ${response.status}.`,
  };
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const action =
      body.action || "login";

    const applicationNumber =
      String(
        body.applicationNumber ||
          "",
      ).trim();

    const email =
      String(
        body.email || "",
      )
        .trim()
        .toLowerCase();

    const phone =
      normalizePhone(
        body.phone,
      );

    if (
      !applicationNumber ||
      !email ||
      phone.length !== 10
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Application number, registered email and valid 10-digit mobile number are required.",
        },
        {
          status: 400,
        },
      );
    }

    const apiUrl =
      getApiUrl();

    /*
      The KRVE Fashion website already has:

      POST  /api/live-project/student
        -> fetch student portal data

      PATCH /api/live-project/student
        -> submit/resubmit task work

      So this portal proxy uses the same endpoint with the
      correct HTTP method for each action.
    */

    const endpoint =
      `${apiUrl}/api/live-project/student`;

    /* =====================================================
       LOGIN / REFRESH
    ===================================================== */

    if (
      action === "login"
    ) {
      const response =
        await fetch(
          endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                applicationNumber,
                email,
                phone,
              }),

            cache:
              "no-store",
          },
        );

      const data =
        await getResponseData(
          response,
        );

      if (!response.ok) {
        console.error(
          "KRVE_PORTAL_LOGIN_FAILED",
          {
            status:
              response.status,
            endpoint,
            data,
          },
        );

        return NextResponse.json(
          {
            success: false,

            message:
              data?.message ||
              "Unable to verify student account.",
          },
          {
            status:
              response.status >=
                400 &&
              response.status <
                500
                ? response.status
                : 502,
          },
        );
      }

      const portalData =
        data?.data || null;

      const student =
        data?.student ||
        portalData?.student ||
        null;

      const tasks =
        data?.tasks ||
        portalData?.tasks ||
        [];

      const summary =
        data?.summary ||
        portalData?.summary ||
        {
          assignedTasks:
            tasks.length,

          submittedTasks:
            tasks.filter(
              (task: any) =>
                [
                  "submitted",
                  "under_review",
                  "approved",
                  "revision_requested",
                ].includes(
                  String(
                    task?.status ||
                      "",
                  )
                    .trim()
                    .toLowerCase(),
                ),
            ).length,

          approvedTasks:
            tasks.filter(
              (task: any) =>
                String(
                  task?.status ||
                    "",
                )
                  .trim()
                  .toLowerCase() ===
                "approved",
            ).length,

          pendingTasks:
            tasks.filter(
              (task: any) =>
                String(
                  task?.status ||
                    "",
                )
                  .trim()
                  .toLowerCase() !==
                "approved",
            ).length,
        };

      if (!student) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Student record was not returned by KRVE Central API.",
          },
          {
            status: 502,
          },
        );
      }

      return NextResponse.json(
        {
          success: true,

          data: {
            student,
            tasks,
            summary,
          },

          student,
          tasks,
          summary,
        },
        {
          status: 200,
        },
      );
    }

    /* =====================================================
       TASK SUBMISSION / RESUBMISSION
    ===================================================== */

    if (
      action === "submit"
    ) {
      const taskId =
        String(
          body.taskId || "",
        ).trim();

      const submissionUrl =
        String(
          body.submissionUrl ||
            "",
        ).trim();

      const submissionSummary =
        String(
          body.submissionSummary ||
            "",
        ).trim();

      const studentRemarks =
        String(
          body.studentRemarks ||
            "",
        ).trim();

      if (!taskId) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Task ID is required.",
          },
          {
            status: 400,
          },
        );
      }

      if (!submissionUrl) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Submission link is required.",
          },
          {
            status: 400,
          },
        );
      }

      let parsedUrl: URL;

      try {
        parsedUrl =
          new URL(
            submissionUrl,
          );
      } catch {
        return NextResponse.json(
          {
            success: false,

            message:
              "Please enter a valid submission URL.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        ![
          "http:",
          "https:",
        ].includes(
          parsedUrl.protocol,
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Submission URL must use http or https.",
          },
          {
            status: 400,
          },
        );
      }

      /*
        IMPORTANT:
        Main website route.ts uses PATCH for the submission proxy.
      */

      const response =
        await fetch(
          endpoint,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                applicationNumber,
                email,
                phone,
                taskId,
                submissionUrl,
                submissionSummary,
                studentRemarks,
              }),

            cache:
              "no-store",
          },
        );

      const data =
        await getResponseData(
          response,
        );

      if (!response.ok) {
        console.error(
          "KRVE_PORTAL_SUBMISSION_FAILED",
          {
            status:
              response.status,
            endpoint,
            taskId,
            data,
          },
        );

        return NextResponse.json(
          {
            success: false,

            message:
              data?.message ||
              "Unable to submit task.",
          },
          {
            status:
              response.status >=
                400 &&
              response.status <
                500
                ? response.status
                : 502,
          },
        );
      }

      return NextResponse.json(
        {
          success: true,
          ...data,
        },
        {
          status: 200,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Invalid portal action.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "KRVE_LIVE_PROJECT_PORTAL_API_ERROR",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to connect to KRVE Central API.",
      },
      {
        status: 500,
      },
    );
  }
}
