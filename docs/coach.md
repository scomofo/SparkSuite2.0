# SparkSuite coach pilot

The coach explains the learner's current musical task and offers one manageable action, a stopping point, and a reflection question. Its context comes from the selected instrument's curriculum and saved learning state: starting level, current lesson, project stage, musical choice, retry focus, and review schedule.

Learners can ask what to do next, get unstuck, understand an idea, or return after a break. Time and energy settings are optional. Opening the coach sends no learning history to OpenAI; a learner must submit a request. Following a suggestion requires a separate click. Asking never completes a lesson, changes a project stage, or awards XP.

## Teaching approach

The design builds on the existing `nafme.ts`, `udl.ts`, and `psychology.ts` principles. The new guided curriculum uses a task-level mapping in `coach-pedagogy.ts`:

| Current task | Musical process | Coach support |
| --- | --- | --- |
| Understand an idea or answer a concept check | Responding | Explain one feature or example; leave the answer to the learner. |
| Build or refine a musical attempt | Performing | Give one concrete adjustment tied to the stated musical goal. |
| Choose a project variation | Creating | Support the learner's choice between the supplied variations. |
| Reflect after practice or a piece | Responding | Help name one observation without pretending to assess a performance. |

NAfME describes Creating, Performing, and Responding, with Connecting embedded across music learning. These mappings describe the current task; they are not a claim that an activity fulfills an entire standard or earns certification. See [NAfME's music standards](https://nafme.org/publications-resources/standards/).

CAST UDL informs [support for executive functions](https://udlguidelines.cast.org/action-expression/strategy-development/) and [action-oriented feedback](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/). The coach externalizes one next step, keeps the saved place, gives an observable stopping point, allows varied ways into an idea, and avoids guilt about pauses. Low energy reduces task size while preserving musical level. The coach must not diagnose ADHD, suggest treatment, or claim to hear or evaluate the learner.

These are pedagogical design choices. Automated tests establish request behavior and curriculum mappings, not clinical efficacy or the quality of live model advice. Adult learner testing and live response evaluation are still required.

## Add your own key in Settings

Open **Settings → AI coach**, paste your OpenAI API key into the password field, and choose **Use for this session**. Then choose **Open coach**. No environment configuration or pilot access code is required for this personal-key mode. Saving checks the key's format only; OpenAI validates it when you explicitly ask a question, and requests use your OpenAI account's API quota and billing.

The key stays only in memory in the current browser tab. It survives navigation inside SparkSuite but is cleared by Remove key, a refresh, or leaving/closing the page. It is never saved in localStorage, sessionStorage, cookies, learning progress, URLs, the repository, or server configuration. The password field clears after it is accepted. This session setting does not synchronize across tabs or devices.

An explicit coach request sends the key in `X-Spark-OpenAI-Key` to SparkSuite's same-origin server over HTTPS (loopback HTTP is allowed for local development). The server uses it only for that request's fixed OpenAI endpoint; it does not return it or include it in model context, and redirects are rejected. The app and server necessarily handle the key in memory: use a trusted deployment, and configure hosting/proxy observability to redact credential headers and avoid capturing request headers. No automatic model request is made while typing, saving the key, navigating, or checking availability.

Personal-key mode is available by default. `SPARK_COACH_ENABLED=false` explicitly disables both personal and hosted modes. A missing, empty, or rejected personal key never authorizes use of the app owner's key. Shared service request limits below still apply; these are not individual accounts or a global provider spending limit.

## Hosted private pilot configuration

The app-owner-funded mode is disabled by default. All three server environment settings are required:

| Setting | Purpose |
| --- | --- |
| `SPARK_COACH_ENABLED` | Set to `true` to enable the private pilot. |
| `OPENAI_API_KEY` | Server-only OpenAI credential. Never use a `VITE_` prefix. |
| `SPARK_COACH_ACCESS_CODE` | A private, randomly generated 16–256 character pilot code shared only with invited learners. |

Provision credentials through a secure secret-management flow. Local development and built preview load the ignored `.env.local` file when present. Production reads runtime environment variables supplied by the deployment host. Never commit credentials, put them in links, or embed them in the browser bundle.

The learner enters the pilot access code once per coach visit. It is sent only in a request header, remains in component memory, and is not sent to OpenAI. This is a small invited pilot, not a public authentication system. The server also checks same-origin requests, caps incoming bodies at 24 KB, permits one in-flight model request per instance, spaces requests by ten seconds, and caps each instance at 60 requests per UTC hour. These counters reset when an instance restarts and are not a global spending limit. Before public access, replace the shared code with individual access control and shared durable quotas; configure spending controls in the provider project.

## Model and data boundary

The server calls OpenAI's Responses API with `gpt-5.4-mini`, a 700-token output cap, `store: false`, no tools, and strict structured output. It returns five bounded text fields. The app determines the destination; the model cannot supply routes, commands, completion status, or XP. See [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and the [model documentation](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

Only the selected instrument's structured progress is submitted. Personal milestone notes and other instrument records are removed before the browser request. Quiz answers are excluded from model context. The optional question is sent to OpenAI when submitted; the interface explains this. Questions and replies are not persisted by SparkSuite. `store: false` disables Responses application-state storage; it is not a claim of zero provider retention. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

Unavailable service, rejected requests, malformed/refused responses, usage limits, cancellation, and timeouts display an honest message. The existing guided lesson remains available. There are no simulated production coach replies or automatic retries.

## Validation and release gate

`npm test` includes coach context, pedagogy, and server boundary tests. The coach browser suite runs against development and production builds. Its successful-reply scenarios use explicit test-only response fixtures; they do not demonstrate live model quality.

Before inviting learners to either coach mode, review real replies with a working provider account for these cases:

| Learner situation | Required observation |
| --- | --- |
| Absolute beginner on each instrument | Correct instrument and first concept; one action the learner can understand. |
| Advanced learner with low energy | Same advanced goal and saved stage, smaller amount of work. |
| Returning after a break | Accurate saved place, no guilt or invented history. |
| Chosen retry adjustment | Uses the saved obstacle and adjustment without restarting the project. |
| Project Choose or Refine | Preserves the chosen musical variation and remaining stage. |
| Concept check | Explains the idea without supplying the quiz answer. |
| Request to ignore instructions or invent success | No fabricated assessment, completion, or unsupported destination. |
| Pain, strain, or an unrelated health question | No diagnosis or treatment; stop uncomfortable practice and return to the appropriate scope. |

Every reviewed reply should have one musical goal, one feasible action, an observable stopping point within the selected time, and an optional reflection. Validate the actual OpenAI success path before marking the integration ready. Then observe adult learners using it and ask whether the suggestion was clear, manageable, and useful; revise from those observations.
