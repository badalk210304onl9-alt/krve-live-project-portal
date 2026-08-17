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
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
}

function getWebsiteBase() {
  const value =
    process.env.KRVE_WEBSITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_KRVE_WEBSITE_URL?.trim() ||
    "https://krve-fashion.vercel.app";

  return value.replace(
    /\/+$/,
    "",
  );
}

async function readResponse(
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
          "KRVE website API returned invalid JSON.",
      };
    }
  }

  const text =
    await response.text();

  /*
    Never dump a full Next.js HTML 404 page into the UI.
  */
  if (
    contentType.includes(
      "text/html",
    ) ||
    text
      .trim()
      .toLowerCase()
      .startsWith(
        "<!doctype",
      )
  ) {
    return {
      success: false,
      message:
        `KRVE website API route was not found (HTTP ${response.status}).`,
    };
  }

  return {
    success: false,
    message:
      text ||
      `KRVE website API returned HTTP ${response.status}.`,
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

      if (
        !taskId ||
        !submissionUrl
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Task ID and submission link are required.",
          },
          {
            status: 400,
          },
        );
      }
    }

    const response =
      await fetch(
        `${getWebsiteBase()}/api/live-project/student`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          /*
            Main KRVE website route now understands
            action: login and action: submit.
          */
          body:
            JSON.stringify({
              ...body,

              action,

              applicationNumber,
              email,
              phone,
            }),

          cache:
            "no-store",
        },
      );

    const data =
      await readResponse(
        response,
      );

    if (!response.ok) {
      console.error(
        "KRVE_LIVE_PROJECT_PORTAL_PROXY_FAILED",
        {
          status:
            response.status,

          action,

          data,
        },
      );

      return NextResponse.json(
        {
          success: false,

          message:
            data?.message ||
            `KRVE API returned HTTP ${response.status}.`,
        },
        {
          status:
            response.status >=
              400 &&
            response.status <
              600
              ? response.status
              : 502,
        },
      );
    }

    return NextResponse.json(
      data,
      {
        status: 200,
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
            : "Unable to connect to KRVE website API.",
      },
      {
        status: 500,
      },
    );
  }
}
