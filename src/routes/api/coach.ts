import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      GET: async () => {
        const { coachService } = await import("@/lib/server/coach.server");
        return coachService.availability();
      },
      POST: async ({ request }) => {
        const { coachService } = await import("@/lib/server/coach.server");
        return coachService.respond(request);
      },
    },
  },
});
