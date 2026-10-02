# Adult learning curriculum pass

Designed for an adult learner who benefits from short tasks, an obvious next action, optional detail, and recoverable progress. This is a software and editorial pass, not clinical validation or certification of instrumental skill.

## SparkSuite

- Removed repeated instrument-wide explanation preambles; extra practical context and terminology can be expanded when useful.
- Renamed the final learner-facing level Creative application without changing internal IDs.
- Revisited lessons open at recall. Saved first responses and explanation use distinguish independent recall from corrected completion; assisted due reviews remain due the next day without removing completion.
- Added authored alternate checks for the first lesson on all ten instruments and guitar pulse; other review questions rotate option order. A full question bank for all 80 lessons remains an opportunity.
- Added an optional one-bar attempt with the reference stopped. Existing advanced projects and musical milestones remain available.
- Fixed literal backslash-n tokens in the Learn route and reconciled the content handoff documentation.

Validation: npm test (203 application tests plus template tests), typecheck, lint, and production build pass. The production browser regression covers an alternate review question, wrong-answer correction, reload persistence, preserved completion, and assisted spacing with no uncaught runtime errors. Real instrument performance was not assessed.
