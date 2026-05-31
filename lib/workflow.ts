import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient, resend } from "@upstash/qstash";
import config from "@/lib/config";

export const workflowClient = config.features.hasQstash
  ? new WorkflowClient({
      baseUrl: config.env.upstash.qstashUrl,
      token: config.env.upstash.qstashToken,
    })
  : {
      trigger: async () => ({ skipped: true }),
    };

const qstashClient = config.features.hasQstash
  ? new QStashClient({
      token: config.env.upstash.qstashToken,
    })
  : null;

export const sendEmail = async ({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) => {
  if (!qstashClient || !config.features.hasResend) {
    console.log("Skipping email send in local mode", { email, subject });
    return;
  }

  await qstashClient.publishJSON({
    api: {
      name: "email",
      provider: resend({ token: config.env.resendToken }),
    },
    body: {
      from: "JS Mastery <contact@adrianjsmastery.com>",
      to: [email],
      subject,
      html: message,
    },
  });
};
