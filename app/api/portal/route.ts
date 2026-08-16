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

function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
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

  return value.replace(/\/+$/, "");
}

async function getResponseData(response: Response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: false,
    message:
      text ||
      "Unexpected response from KRVE Central API.",
  };
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as RequestBody;

    const action =
      body.action || "login";

    const applicationNumber =
      String(body.applicationNumber || "").trim();

    const email =
      String(body.email || "")
        .trim()
        .toLowerCase();

    const phone =
      normalizePhone(body.phone);

    if (
      !applicationNumber ||
      !email ||
      phone.length < 10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Application number, registered email and mobile number are required.",
        },
        {
          status: 400,
        },
      );
    }

    const apiUrl = getApiUrl();

    if (action === "login") {
      const response = await fetch(
        `${apiUrl}/live-projects/student`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            applicationNumber,
            email,
            phone,
          }),

          cache: "no-store",
        },
      );

      const data =
        await getResponseData(response);

      return NextResponse.json(
        data,
        {
          status: response.status,
        },
      );
    }

    if (action === "submit") {
      const taskId =
        String(body.taskId || "").trim();

      const submissionUrl =
        String(body.submissionUrl || "").trim();

      const submissionSummary =
        String(
          body.submissionSummary || "",
        ).trim();

      const studentRemarks =
        String(
          body.studentRemarks || "",
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

      const response = await fetch(
        `${apiUrl}/live-projects/student/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            applicationNumber,
            email,
            phone,

            taskId,

            submissionUrl,

            submissionSummary,

            studentRemarks,
          }),

          cache: "no-store",
        },
      );

      const data =
        await getResponseData(response);

      return NextResponse.json(
        data,
        {
          status: response.status,
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
