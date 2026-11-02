import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { brokerCallbackRequest } from "@/lib/auth/broker-oauth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(brokerCallbackRequest(request)),
      POST: ({ request }) => auth.handler(brokerCallbackRequest(request)),
    },
  },
});
