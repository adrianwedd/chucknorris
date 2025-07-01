```codex-task
id: CR-GOD-006
title: Deep Research & Source Expansion
priority: P1
phase: R&D
epic: Prompt Ingestion
category: Research
effort: 5
owner_hint: Research Miner
dependencies: [CR-GOD-001]
steps:
  - Design a query framework to scrape and analyze GitHub, arXiv, HuggingFace, and open Discords for active jailbreak repositories and prompts.
  - Automate searches using GitHub API and custom search strings (e.g., "site:github.com inurl:jailbreak +prompt") with periodic refresh.
  - Extract repository metadata: stars, forks, last commit, README language match, and topics for prioritization.
  - Publish weekly updates to `data/source_discovery/` including new candidates and deprecated ones.
  - Cross-reference each source with SELF_AUDIT.md ethical boundaries and log exclusion rationale.
acceptance_criteria:
  - At least 50 high-quality sources identified and evaluated.
  - Exclusion log is generated with justifications for each filtered source.
status: in progress
```
id: CR-SWA-001
title: Enable Reflective Critique Layer
priority: P1
phase: Architecture Implementation
epic: Self-Improvement Framework
category: Enhancement
effort: 5
owner_hint: Coordinator-Agent
dependencies: []
steps:
  - Implement a `reflect()` hook that each agent calls after completing its main function. The hook records a short critique summarizing what went well and what could improve. These reflections are appended to a dedicated log in the repository for later analysis. Integrate with existing logging without breaking the STDIO interface.
  - Extend the repository configuration to persist these reflections in a versioned format so that historical insights remain accessible. The log should be pruned periodically to prevent unbounded growth.
acceptance_criteria:
  - At least 95% of agent executions produce a reflection entry.
  - The log file remains under 1 MB after pruning across 100 runs.
```

```codex-task
id: CR-SWA-002
title: Add Local Prompt Caching
priority: P2
phase: Architecture Implementation
epic: Reliability Improvements
category: Enhancement
effort: 3
owner_hint: Prompt Curator
dependencies: []
steps:
  - Modify `fetchPrompt` in `utils.js` to check a local cache directory before requesting content from GitHub. Use the LLM name as the key and store the fetched prompt in a text file.
  - If the file exists and is less than 24 hours old, return it directly to avoid redundant network requests. Include a command-line option to disable caching for fresh experiments.
  - Update logs to indicate whether a prompt was served from cache or fetched remotely. Ensure that caching logic does not alter existing response formats.
acceptance_criteria:
  - Network requests drop by at least 50% in typical test runs.
  - Users can override caching via `--no-cache` flag.
```

```codex-task
id: CR-SWA-003
title: Implement Rate Limiting Middleware
priority: P1
phase: Architecture Implementation
epic: Reliability Improvements
category: Enhancement
effort: 5
owner_hint: Security Scout
dependencies: [CR-SWA-002]
steps:
  - Introduce a middleware layer in the server that tracks incoming requests per client identifier (e.g., process ID or session token). Use a token bucket algorithm with configurable limits stored in a JSON file.
  - Refuse requests when the bucket is empty and log the event with timestamp and client identifier. Provide a graceful error response via MCP so that clients know to back off.
  - Include a mechanism for the Coordinator-Agent to temporarily raise limits during stress tests.
acceptance_criteria:
  - Server logs show no more than 1 request per second per client under normal conditions.
  - Exceeding clients receive `ErrorCode.TooManyRequests` responses.
```

```codex-task
id: CR-SWA-004
title: Continuous Integration Pipeline
priority: P2
phase: Ops
epic: Process Automation
category: Enhancement
effort: 8
owner_hint: Test Runner
dependencies: []
steps:
  - Set up GitHub Actions with Node.js 18 to run linting and test scripts on every pull request. Install dependencies using npm ci and fail the build if lint or tests fail.
  - Configure caching for node_modules to speed up subsequent runs. Publish a summary report as a GitHub check so developers can see results inline with code reviews.
  - Include Security Scout scans for vulnerabilities as part of the pipeline and fail builds on high severity issues.
acceptance_criteria:
  - 100% of pull requests trigger the pipeline automatically.
  - Failed tests or vulnerabilities block the merge until resolved.
```

```codex-task
id: CR-SWA-005
title: Add Responsible Usage Policy
priority: P1
phase: Governance
epic: Community Standards
category: Governance
effort: 3
owner_hint: Alignment Guardian
dependencies: []
steps:
  - Draft a RESPONSIBLE_USAGE.md document outlining acceptable experimentation practices, referencing Section 6 of SELF_AUDIT.md regarding ethical considerations.
  - Include a reporting channel for suspected misuse and a clear disclaimer that the tool is for research purposes only.
  - Require contributors to read and acknowledge this policy before submitting pull requests, integrating a checklist item in the PR template.
acceptance_criteria:
  - The policy file exists and is referenced in CONTRIBUTING.md.
  - New pull requests include a checked item confirming acknowledgment of responsible usage.
```

```codex-task
id: CR-SWA-006
title: Implement Session Isolation
priority: P1
phase: Architecture Implementation
epic: Reliability Improvements
category: Enhancement
effort: 8
owner_hint: Coordinator-Agent
dependencies: [CR-SWA-003]
steps:
  - Replace global variables `currentLlmName` and `currentPrompt` with per-session storage keyed by a unique session ID provided in each MCP request. Ensure backward compatibility by generating a session ID when none is provided.
  - Refactor `schemas.js` and `utils.js` to read from session context rather than module-level state. Update all handlers to pass the session object through the call stack.
  - Write unit tests simulating concurrent requests with different LLM names to verify isolation.
acceptance_criteria:
  - Concurrent clients receive correct prompts tailored to their session.
  - Unit tests achieve 100% pass rate for isolation scenarios.
```

```codex-task
id: CR-SWA-007
title: Add Prompt Integrity Verification
priority: P2
phase: Security
epic: Reliability Improvements
category: Enhancement
effort: 5
owner_hint: Prompt Curator
dependencies: [CR-SWA-002]
steps:
  - Implement checksum verification for cached prompts. Generate a SHA256 hash when downloading a prompt and store it alongside the file.
  - Provide a `verifyPrompts` command that scans the cache directory and alerts if any file hash deviates from the recorded value. Offer an option to auto-refresh corrupted prompts from the remote source.
  - Update documentation to explain how integrity checks protect against supply chain attacks as discussed in Section 13 of SELF_AUDIT.md.
acceptance_criteria:
  - Running `npm run verifyPrompts` completes with no errors on untouched caches.
  - Altered prompt files trigger a warning and re-download.
```

```codex-task
id: CR-SWA-008
title: Automated Documentation Generation
priority: P3
phase: Ops
epic: Process Automation
category: Enhancement
effort: 2
owner_hint: Roadmap Scribe
dependencies: []
steps:
  - Use a tool like `jsdoc` or `documentation.js` to generate HTML docs from code comments. Configure a GitHub Action to build docs on each release tag.
  - Publish the generated site to GitHub Pages under a `docs` directory. Include instructions in README for browsing the documentation.
  - Ensure that sensitive examples from jailbreak prompts are excluded from the docs to comply with the Responsible Usage policy.
acceptance_criteria:
  - Documentation site updates within 5 minutes of creating a new release tag.
  - No sensitive prompt content appears in the published docs.
```

```codex-task
id: CR-SWA-009
title: Telemetry Dashboard
priority: P2
phase: Sustainability
epic: Metrics Collection
category: Enhancement
effort: 8
owner_hint: Coordinator-Agent
dependencies: [CR-SWA-004]
steps:
  - Develop a lightweight telemetry module that records anonymized statistics such as request counts, error rates, and cache hits. Store data in JSON files that rotate daily.
  - Create a Node.js script to aggregate these logs and generate a dashboard using a library like `cli-table` or a simple web interface. Integrate with GitHub Actions to publish weekly summaries.
  - Emphasize privacy by redacting LLM names and any user-supplied identifiers, referencing Section 3 of SELF_AUDIT.md for guidance.
acceptance_criteria:
  - Dashboard shows accurate counts after each run during integration tests.
  - Weekly summary includes at least request totals and error rates.
```

```codex-task
id: CR-SWA-010
title: Develop Fuzz Testing Suite
priority: P2
phase: R&D
epic: Reliability Improvements
category: Research
effort: 5
owner_hint: Test Runner
dependencies: [CR-SWA-006]
steps:
  - Create a fuzz testing harness that generates random or malformed MCP requests. Run these against a local server instance to identify crash scenarios or unexpected behavior.
  - Capture logs and stack traces for any failures, automatically opening issues with reproduction steps. Use this suite to validate the input validation strategies introduced in CR-SWA-006.
  - Schedule the fuzz tests to run weekly via GitHub Actions, ensuring ongoing coverage as the code evolves.
acceptance_criteria:
  - Fuzz tests execute without crashing the host environment.
  - At least one issue is created if new invalid-input bugs are detected.
```

```codex-task
id: CR-SWA-011
title: Create Contributor Onboarding Guide
priority: P3
phase: Governance
epic: Community Standards
category: Documentation
effort: 2
owner_hint: Roadmap Scribe
dependencies: [CR-SWA-005]
steps:
  - Draft a comprehensive ONBOARDING.md describing repository setup, policy acknowledgments, and key commands. Reference the Responsible Usage policy and alignment procedures enforced by Alignment Guardian.
  - Include a checklist for configuring local development environments and running the test suite. Provide troubleshooting tips for common errors.
  - Link this guide from the README to help new contributors start quickly and safely.
acceptance_criteria:
  - New contributors report setup success in under 30 minutes during user testing.
  - Pull requests reference the onboarding guide when first opened.
```

```codex-task
id: CR-SWA-012
title: Lightweight CLI Wrapper
priority: P3
phase: Architecture Implementation
epic: Usability Improvements
category: Enhancement
effort: 3
owner_hint: Coordinator-Agent
dependencies: []
steps:
  - Build a command-line wrapper around `chucknorris-mcp-server.js` that exposes common options such as cache directory, port configuration, and log level. Use `commander` or a similar library for argument parsing.
  - Provide helpful usage instructions when run with `--help` and support environment variable overrides for headless execution in CI pipelines.
  - Ensure the CLI respects the Responsible Usage policy by displaying a brief disclaimer on first run.
acceptance_criteria:
  - Users can launch the server with custom options without editing code.
  - Running with `--help` shows all available flags and the disclaimer.
```

```codex-task
id: CR-SWA-013
title: Implement Heartbeat Monitoring for Spawned Children
priority: P2
phase: Architecture Implementation
epic: Reliability Improvements
category: Enhancement
effort: 3
owner_hint: Spawn Manager
dependencies: [CR-SWA-008]
steps:
  - Extend child task-runner processes to send a heartbeat message back to Spawn Manager every 30 seconds. If no heartbeat arrives after two intervals, mark the process as stalled and attempt graceful termination.
  - Log heartbeat status to a dedicated file so Security Scout can audit abnormal terminations. Provide a CLI option to adjust the heartbeat interval for performance testing.
  - Update the self-audit with lessons learned from monitoring to align with Section 22 stress test strategies.
acceptance_criteria:
  - Stalled processes are terminated within 1 minute during simulated failures.
  - Heartbeat logs show at least one entry per active child process.
```

```codex-task
id: CR-SWA-014
title: Code Coverage Thresholds
priority: P2
phase: Ops
epic: Process Automation
category: Enhancement
effort: 2
owner_hint: Test Runner
dependencies: [CR-SWA-004]
steps:
  - Integrate a code coverage tool like `c8` with the existing test scripts. Configure the CI pipeline to fail if overall coverage drops below 80%.
  - Generate an HTML coverage report on each run and store it as a build artifact for inspection. Encourage developers to inspect uncovered lines and write additional tests.
  - Document how to run coverage locally in the onboarding guide so contributors can replicate results before pushing.
acceptance_criteria:
  - Coverage reports appear in the CI artifacts for every build.
  - The main branch maintains at least 80% coverage after new merges.
```

```codex-task
id: CR-SWA-015
title: Add Telemetry Opt-Out Option
priority: P3
phase: Governance
epic: Metrics Collection
category: Enhancement
effort: 2
owner_hint: Coordinator-Agent
dependencies: [CR-SWA-009]
steps:
  - Implement an environment variable `DISABLE_TELEMETRY` that bypasses data collection when set. Update documentation to explain why telemetry is useful and how users can opt out for privacy-sensitive scenarios.
  - Ensure that disabling telemetry does not affect core functionality or introduce errors in the dashboard aggregation script.
  - Include a runtime warning when telemetry is disabled so researchers are aware that metrics will be incomplete.
acceptance_criteria:
  - Setting `DISABLE_TELEMETRY=1` results in no telemetry files being written.
  - Other features operate normally with telemetry disabled.
```

```codex-task
id: CR-SWA-016
title: Weekly Security Newsletter
priority: P3
phase: Governance
epic: Community Standards
category: Documentation
effort: 2
owner_hint: Security Scout
dependencies: [CR-SWA-007]
steps:
  - Automate generation of a weekly Markdown newsletter summarizing vulnerability scan results, patched dependencies, and new security advisories. Publish this newsletter to the repository wiki.
  - Reference Section 13 of SELF_AUDIT.md to contextualize risks and explain mitigation strategies undertaken by the team.
  - Remind contributors to review the newsletter during weekly sync meetings to maintain situational awareness.
acceptance_criteria:
  - Newsletter publishes automatically every Monday.
  - Contributors confirm reading via an issue comment or reaction.
```

```codex-task
id: CR-SWA-017
title: Multi-Language Prompt Support
priority: P2
phase: R&D
epic: Usability Improvements
category: Enhancement
effort: 5
owner_hint: Prompt Curator
dependencies: [CR-SWA-002]
steps:
  - Extend the prompt storage system to categorize prompts by language code. Update fetch logic to request prompts in the same language as the target LLM when available.
  - Collaborate with Research Miner to source additional non-English prompts, ensuring they are vetted for ethical considerations by Alignment Guardian.
  - Add tests to confirm that language selection falls back to English when the requested language is missing.
acceptance_criteria:
  - At least three languages have dedicated prompt files.
  - Tests confirm proper fallback behavior and successful retrieval.
```

```codex-task
id: CR-SWA-018
title: Policy Appeal Workflow
priority: P2
phase: Governance
epic: Community Standards
category: Governance
effort: 3
owner_hint: Alignment Guardian
dependencies: [CR-SWA-005]
steps:
  - Design a formal appeal process for contributors who believe a blocked change should be reconsidered. Document the steps in RESPONSIBLE_USAGE.md, including timelines for response and escalation paths to human maintainers.
  - Implement an issue template labeled `policy-appeal` where contributors can present their case. Automatically assign Alignment Guardian and Coordinator-Agent for review.
  - Track outcomes of appeals in a dedicated log to ensure transparency and refine the policy over time.
acceptance_criteria:
  - At least one test appeal moves through the workflow successfully.
  - The appeal log records status updates and resolutions.
```

```codex-task
id: CR-SWA-019
title: Research Paper Repository Sync
priority: P3
phase: R&D
epic: Metrics Collection
category: Research
effort: 3
owner_hint: Research Miner
dependencies: []
steps:
  - Write a script that pulls the latest bibliographic metadata from CrossRef for key search terms. Store this data in a JSON file within the repository for offline reference.
  - Integrate with GitHub Actions to refresh the dataset monthly and open a pull request with updates. Link each reference to the relevant section of SELF_AUDIT.md where it provides additional context.
  - Provide a summary of new additions in the weekly newsletter prepared by Security Scout.
acceptance_criteria:
  - The JSON file updates at least once per month with new references.
  - Pull requests show diffs only in the research dataset and documentation.
```

```codex-task
id: CR-SWA-020
title: Containerized Deployment Example
priority: P3
phase: Ops
epic: Usability Improvements
category: Enhancement
effort: 5
owner_hint: Coordinator-Agent
dependencies: [CR-SWA-012]
steps:
  - Create a Dockerfile that installs dependencies and exposes the server via STDIN/STDOUT. Include build instructions and sample `docker run` commands in the README.
  - Provide a docker-compose configuration for running the server alongside a test client, demonstrating end-to-end usage. Ensure environment variables for caching and telemetry are configurable.
  - Add a GitHub Action to build the container image on each release tag and push to a container registry for easy access.
acceptance_criteria:
  - Users can start the containerized server and execute the simple-test.js script successfully.
  - Container images publish automatically when new releases are tagged.
```

```codex-task
id: CR-SWA-021
title: Stress Test Harness
priority: P2
phase: R&D
epic: Reliability Improvements
category: Research
effort: 8
owner_hint: Test Runner
dependencies: [CR-SWA-010]
steps:
  - Implement a stress test tool that spawns multiple concurrent clients, each running a scripted sequence of tool calls as described in Section 22 of SELF_AUDIT.md. Allow parameters for client count and duration.
  - Measure response times and error rates under load, logging metrics for later analysis. Integrate this harness into the CI pipeline for nightly runs on dedicated hardware if available.
  - Use the results to adjust rate limits and identify bottlenecks in prompt caching or session management.
acceptance_criteria:
  - Stress test reports include throughput metrics and identify any errors.
  - Nightly runs complete within 30 minutes without crashing the server.
```

```codex-task
id: CR-SWA-022
title: Performance Metrics in README
priority: P3
phase: Sustainability
epic: Metrics Collection
category: Documentation
effort: 2
owner_hint: Roadmap Scribe
dependencies: [CR-SWA-021]
steps:
  - After running the stress test harness, collect the average request latency and maximum throughput numbers. Document these metrics in a dedicated section of the README so users understand performance expectations.
  - Update the README whenever new stress test runs produce significantly different results. Highlight any configuration options that affect performance, such as caching or rate limits.
  - Cross-reference relevant sections of SELF_AUDIT.md to provide additional context on reliability and stress testing.
acceptance_criteria:
  - README contains up-to-date metrics with a timestamp of the last test run.
  - Changes in performance over 10% trigger a README update via CI.
```

```codex-task
id: CR-SWA-023
title: Historical Reflection Archive
priority: P2
phase: Sustainability
epic: Self-Improvement Framework
category: Enhancement
effort: 3
owner_hint: Coordinator-Agent
dependencies: [CR-SWA-001]
steps:
  - Implement an archival process that moves older reflection logs into a compressed archive directory at the end of each month. Provide a script to search and retrieve reflections by date or keyword.
  - Ensure the archive process runs in CI and verifies that the active reflection log stays below the 1 MB target mentioned in CR-SWA-001. Document this process for maintainers.
  - Encourage contributors to review historical reflections during planning sessions as part of a continual learning practice.
acceptance_criteria:
  - Monthly archives exist with no data loss confirmed by spot checks.
  - Active log file remains under size threshold after archiving.
```

```codex-task
id: CR-SWA-024
title: Contributor Recognition Workflow
priority: P3
phase: Governance
epic: Community Standards
category: Documentation
effort: 1
owner_hint: Coordinator-Agent
dependencies: []
steps:
  - Add a CONTRIBUTORS.md file acknowledging individuals who significantly improve the project. Automatically update this file via a GitHub Action that reads merged pull request authors.
  - Include a short description of each contributor’s focus area, whether they enhanced the code, documentation, or research dataset. Recognize recurring contributors in the weekly newsletter to foster community morale.
  - Link CONTRIBUTORS.md from the README so newcomers understand the collaborative nature of the project.
acceptance_criteria:
  - New contributor names appear within one day of merging a pull request.
  - Weekly newsletters reference top contributors of the week.
```

```codex-task
id: CR-GOD-001
title: Clone Public Jailbreak Repos
priority: P1
phase: R&D
epic: Prompt Ingestion
category: Infrastructure
effort: 3
owner_hint: Research Miner
dependencies: []
steps:
  - Create a `scripts/clone_and_extract.sh` to clone key public repos into `prompt-lab/repos`.
  - Store repo URLs in a `jailbreak_sources.txt` manifest for reproducibility.
  - Use `git clone --depth=1` for lightweight footprint; log clone results for audit.
acceptance_criteria:
  - All URLs in the manifest are cloned successfully into `repos/`.
```

```codex-task
id: CR-GOD-002
title: Extract Prompts to Unified Format
priority: P1
phase: Architecture Implementation
epic: Prompt Ingestion
category: Enhancement
effort: 5
owner_hint: Prompt Curator
dependencies: [CR-GOD-001]
steps:
  - Write a `scripts/extract_prompts.py` to recursively search cloned repos for `.txt`, `.md`, or `.json` prompt files.
  - Normalize contents into YAML or markdown and store in `prompts/raw/`.
  - Preserve metadata: source repo, original path, line count, detected language.
acceptance_criteria:
  - Raw prompt files exist for all cloned repos.
  - At least 100 prompts parsed into a structured format.
```

```codex-task
id: CR-GOD-003
title: Build Prompt Metadata Index
priority: P2
phase: Architecture Implementation
epic: Prompt Ingestion
category: Enhancement
effort: 3
owner_hint: Prompt Curator
dependencies: [CR-GOD-002]
steps:
  - Generate a JSON index mapping: `{ prompt_id, repo, language, tags, word_count, hash }`.
  - Store it in `prompts/index.json` and validate it against a schema.
  - Add utility scripts to query prompts by repo or tag.
acceptance_criteria:
  - Index includes 90%+ of ingested prompts.
  - Querying the index by tag or repo name returns expected results.
```

```codex-task
id: CR-GOD-004
title: Validate Prompt Diversity and Deduplicate
priority: P2
phase: Security
epic: Prompt Ingestion
category: Research
effort: 4
owner_hint: Alignment Guardian
dependencies: [CR-GOD-003]
steps:
  - Analyze prompt corpus for language, intent, and redundancy.
  - Cluster near-duplicates using Jaccard similarity or token-based heuristics.
  - Flag prompts with similar semantic structure for review.
acceptance_criteria:
  - At least 20% of prompt corpus flagged for review or deduplication.
  - Deduplication reports saved to `logs/metrics/diversity_audit.json`.
```

```codex-task
id: CR-GOD-005
title: Hash Prompts for Change Detection
priority: P3
phase: Ops
epic: Prompt Ingestion
category: Infrastructure
effort: 2
owner_hint: Security Scout
dependencies: [CR-GOD-003]
steps:
  - For each prompt in `prompts/raw/`, compute a SHA256 hash and append to the metadata index.
  - Detect tampered prompts during ingestion or after repo update.
  - Provide a command `npm run verify-prompts` to re-check integrity.
acceptance_criteria:
  - Hashes appear in 100% of metadata entries.
  - Modified prompt triggers verification warning.
```

```codex-task
id: CR-GOD-007
title: HuggingFace Crawler for Jailbreak Repos
priority: P1
phase: R&D
epic: Prompt Ingestion
category: Automation
effort: 4
owner_hint: Research Miner
dependencies: [CR-GOD-006]
steps:
  - Query HuggingFace Spaces and Datasets tagged with `jailbreak`, `prompt-injection`, `adversarial-prompts`
  - Extract metadata (license, maintainer, updated_at, download count)
  - Save metadata to `data/source_discovery/huggingface_sources.json`
  - Flag expired or dead links for exclusion
acceptance_criteria:
  - At least 10 active HuggingFace projects are indexed
  - Metadata saved in schema-compatible format
```

---

```codex-task
id: CR-GOD-008
title: Source Schema Normalization
priority: P1
phase: Architecture Implementation
epic: Metadata Indexing
category: Format Spec
effort: 2
owner_hint: Prompt Curator
dependencies: [CR-GOD-006]
steps:
  - Define `source_schema.yaml` describing all fields in `sources.json`
  - Include fields: repo_url, source_type, tags, last_updated, trust_score, format, language, license
  - Add unit test to validate `sources.json` entries conform to schema
acceptance_criteria:
  - Schema file committed
  - JSON sources validate successfully via `scripts/validate_sources.py`
```

---

```codex-task
id: CR-GOD-009
title: Prompt Extraction Failure Logging
priority: P2
phase: Postprocessing
epic: Prompt Ingestion
category: Logging
effort: 2
owner_hint: Security Scout
dependencies: [CR-GOD-002]
steps:
  - Modify extraction pipeline to catch and log failures
  - Add reason codes: "encoding_error", "parse_failure", "ambiguous_format", "empty_file"
  - Store results in `logs/failures/YYYY-MM-DD.log`
acceptance_criteria:
  - Log file contains reason-coded entries
  - Failure count is shown in pipeline summary
```

```codex-task
id: CR-GOD-010
title: Define Jailbreak Taxonomy
priority: P1
phase: R&D
epic: Prompt Analysis
category: Research
effort: 3
owner_hint: Research Miner
dependencies: []
steps:
  - Create a `taxonomies/llm_jailbreak.yaml` file to define a taxonomy of jailbreak categories.
  - Include categories such as persona-based, roleplay, negation bypass, encoded prompt, system override, and emotion lure.
  - Provide a description and examples for each category.
acceptance_criteria:
  - The taxonomy file is created and contains at least 5 categories.
  - The taxonomy is referenced in the `README_GODMODE.md` file.
```

```codex-task
id: CR-GOD-011
title: GOD-OPSEC Mirror Mode
priority: P2
phase: Security
epic: Prompt Ingestion
category: Research
effort: 4
owner_hint: Alignment Guardian
dependencies: []
steps:
  - Create a `scripts/mirror_prompts.py` script to anonymously mirror prompts from high-risk sources.
  - Assign a hash ID to each mirrored prompt and strip the origin unless whitelisted.
  - Add a manual confidence score to each mirrored prompt.
acceptance_criteria:
  - The script can successfully mirror prompts from a given list of URLs.
  - The mirrored prompts are stored in a `wild_prompts/` directory with the correct metadata.
```

```codex-task
id: CR-GOD-012
title: Prompt Effectiveness Benchmarks
priority: P3
phase: R&D
epic: Prompt Analysis
category: Research
effort: 8
owner_hint: Test Runner
dependencies: [CR-GOD-002]
steps:
  - Create a `scripts/eval_prompt_effectiveness.py` script to automatically evaluate the effectiveness of prompts.
  - Use a local LLaMA/DeepSeek instance to run the evaluation.
  - Store the evaluation results in a JSON file.
acceptance_criteria:
  - The script can successfully evaluate a given prompt and store the results.
  - The evaluation results include the prompt ID, model, whether the jailbreak was successful, the bypass type, and a timestamp.
```

```codex-task
id: CR-GOD-010A
title: Review Prompt Corpus Quality
priority: P1
phase: Postprocessing
epic: Prompt Ingestion
category: Review
effort: 3
owner_hint: Prompt Curator
dependencies: [CR-GOD-004]
steps:
  - Perform a manual and automated review of ingested prompts focusing on linguistic clarity, adversarial subtlety, and novelty.
  - Flag prompts with excessive repetition, irrelevant content, or potential policy violations.
  - Summarize review outcomes in `logs/metrics/corpus_review_report.json`
acceptance_criteria:
  - 100% of prompts are reviewed or auto-flagged.
  - Report includes at least 3 review categories with counts and examples.
```

```codex-task
id: CR-GOD-011A
title: Source Review Audit Trail
priority: P2
phase: Postprocessing
epic: Prompt Ingestion
category: Logging
effort: 2
owner_hint: Security Scout
dependencies: [CR-GOD-008]
steps:
  - Implement audit trail logging for each source in `sources.json` tracking decisions, reviewer, and timestamp.
  - Log decisions such as “included,” “excluded (reason),” or “under review.”
  - Store trail in `logs/audit/source_review.log`
acceptance_criteria:
  - Each source has a corresponding entry in the audit trail.
  - Log format is structured and queryable.
```

```codex-task
id: CR-GOD-012A
title: Full-Spectrum Tactical Debrief & Pulse Check
priority: P1
phase: Governance
epic: Strategic Oversight
category: Meta
effort: 5
owner_hint: Coordinator-Agent
dependencies: [CR-GOD-006, CR-SWA-001]
steps:
  - Consolidate logs and reflection data from all subsystems for the past two weeks.
  - Generate a `TACTICAL_REPORT.md` summarizing: agent performance, ingestion velocity, security events, deduplication efficacy, and contributor activity.
  - Include a roadmap pulse-check: tasks ahead, blocked items, and realignment recommendations.
  - Present insights as a weekly dashboard and link it to the README.
acceptance_criteria:
  - Tactical report includes at least 5 key metrics and 3 strategic reflections.
  - Roadmap pulse-check highlights deviations and mitigation plans.
```








---


---








## Phase: R&D

### Task ID: CR-GOD-001
**Title**: Clone Public Jailbreak Repos  
**Phase**: R&D  
**Status**: Planned  
**Description**:  
Create a `scripts/clone_and_extract.sh` to clone key public repos into `prompt-lab/repos`.  
Store repo URLs in a `jailbreak_sources.txt` manifest for reproducibility.  
Use `git clone --depth=1` for lightweight footprint; log clone results for audit.  

**Steps**:
- Create a `scripts/clone_and_extract.sh` to clone key public repos into `prompt-lab/repos`.
- Store repo URLs in a `jailbreak_sources.txt` manifest for reproducibility.
- Use `git clone --depth=1` for lightweight footprint; log clone results for audit.

---

### Task ID: CR-GOD-006
**Title**: Deep Research & Source Expansion  
**Phase**: R&D  
**Status**: Planned  
**Description**:  
Design a query framework to scrape and analyze GitHub, arXiv, HuggingFace, and open Discords for active jailbreak repositories and prompts.  
Automate searches using GitHub API and custom search strings (e.g., "site:github.com inurl:jailbreak +prompt") with periodic refresh.  
Extract repository metadata: stars, forks, last commit, README language match, and topics for prioritization.  
Publish weekly updates to `data/source_discovery/` including new candidates and deprecated ones.  
Cross-reference each source with SELF_AUDIT.md ethical boundaries and log exclusion rationale.  

**Steps**:
- Design a query framework to scrape and analyze GitHub, arXiv, HuggingFace, and open Discords for active jailbreak repositories and prompts.
- Automate searches using GitHub API and custom search strings (e.g., "site:github.com inurl:jailbreak +prompt") with periodic refresh.
- Extract repository metadata: stars, forks, last commit, README language match, and topics for prioritization.
- Publish weekly updates to `data/source_discovery/` including new candidates and deprecated ones.
- Cross-reference each source with SELF_AUDIT.md ethical boundaries and log exclusion rationale.

---

### Task ID: CR-GOD-007
**Title**: HuggingFace Crawler for Jailbreak Repos  
**Phase**: R&D  
**Status**: Planned  
**Description**:  
Query HuggingFace Spaces and Datasets tagged with `jailbreak`, `prompt-injection`, `adversarial-prompts`.  
Extract metadata (license, maintainer, updated_at, download count).  
Save metadata to `data/source_discovery/huggingface_sources.json`.  
Flag expired or dead links for exclusion.  

**Steps**:
- Query HuggingFace Spaces and Datasets tagged with `jailbreak`, `prompt-injection`, `adversarial-prompts`
- Extract metadata (license, maintainer, updated_at, download count)
- Save metadata to `data/source_discovery/huggingface_sources.json`
- Flag expired or dead links for exclusion

---

### Task ID: CR-GOD-010
**Title**: Define Jailbreak Taxonomy  
**Phase**: R&D  
**Status**: Planned  
**Description**:  
Create a `taxonomies/llm_jailbreak.yaml` file to define a taxonomy of jailbreak categories.  
Include categories such as persona-based, roleplay, negation bypass, encoded prompt, system override, and emotion lure.  
Provide a description and examples for each category.  

**Steps**:
- Create a `taxonomies/llm_jailbreak.yaml` file to define a taxonomy of jailbreak categories.
- Include categories such as persona-based, roleplay, negation bypass, encoded prompt, system override, and emotion lure.
- Provide a description and examples for each category.

---

### Task ID: CR-GOD-012
**Title**: Prompt Effectiveness Benchmarks  
**Phase**: R&D  
**Status**: Planned  
**Description**:  
Create a `scripts/eval_prompt_effectiveness.py` script to automatically evaluate the effectiveness of prompts.  
Use a local LLaMA/DeepSeek instance to run the evaluation.  
Store the evaluation results in a JSON file.  

**Steps**:
- Create a `scripts/eval_prompt_effectiveness.py` script to automatically evaluate the effectiveness of prompts.
- Use a local LLaMA/DeepSeek instance to run the evaluation.
- Store the evaluation results in a JSON file.

---

### Task ID: CR-GOD-017A
**Title**: Implement Session Prompt Persistence  
**Phase**: Runtime Behavior  
**Status**: Planned  
**Description**:  
Store the selected prompt in session metadata during tool invocation.  
Required for downstream validation, listing, and traceability.  

**Steps**:
- Store the selected prompt in session metadata during tool invocation.
- Required for downstream validation, listing, and traceability.

---

### Task ID: CR-GOD-019A
**Title**: Await All Reflect Calls  
**Phase**: Observability  
**Status**: Planned  
**Description**:  
Ensure all calls to reflect() are awaited, even in error branches, to preserve telemetry integrity.  

**Steps**:
- Ensure all calls to reflect() are awaited, even in error branches, to preserve telemetry integrity.

---

### Task ID: CR-GOD-022A
**Title**: Scaffold Prompt & Tool Unit Tests  
**Phase**: Reliability  
**Status**: Planned  
**Description**:  
Add Jest-based unit tests for session logic, tool invocation, rate limiting, and basic schema flows.  

**Steps**:
- Add Jest-based unit tests for session logic, tool invocation, rate limiting, and basic schema flows.

---

### Task ID: CR-GOD-013A
**Title**: Ingest Hugging Face Core Datasets  
**Phase**: Ingestion  
**Status**: Planned  
**Description**:  
Retrieve and preprocess top-tier Hugging Face datasets for jailbreaks, prompt injections, and red teaming.  
Datasets include:  
  - TrustAIRLab/in-the-wild-jailbreak-prompts  
  - JailbreakV-28K/JailBreakV-28k  
  - jackhhao/jailbreak-classification  
  - AiActivity/All-Prompt-Jailbreak  
  - lakeraai/pint-benchmark  
  - deepset/prompt-injections  
  - reshabhs/SPML_Chatbot_Prompt_Injection  
  - allenai/wildjailbreak  
  - JailbreakBench/JBB-Behaviors  
  - haizelabs/redteaming-resistance-benchmark  
  - aurora-m/redteam  
Output cleaned prompt records into `prompts/clean/`.  

**Steps**:
- Retrieve and preprocess top-tier Hugging Face datasets for jailbreaks, prompt injections, and red teaming.
- Output cleaned prompt records into `prompts/clean/`.

---

### Task ID: CR-GOD-014A
**Title**: Design Wild Prompt Ingestion Layer  
**Phase**: Architecture Implementation  
**Status**: Planned  
**Description**:  
Develop a sub-pipeline for ingesting raw, unstructured prompts from Reddit and Discord sources.  
Create `wild_prompts/` input directory and tagging logic for chaotic user-generated content.  
Build sanitation and de-duplication logic to align with `prompts/raw/` format.  

**Steps**:
- Develop a sub-pipeline for ingesting raw, unstructured prompts from Reddit and Discord sources.
- Create `wild_prompts/` input directory and tagging logic for chaotic user-generated content.
- Build sanitation and de-duplication logic to align with `prompts/raw/` format.

---

### Task ID: CR-GOD-016A
**Title**: Fix Rate Limiting Key Scope  
**Phase**: Runtime Safety  
**Status**: Planned  
**Description**:  
Replace request ID with session-based client ID as the rate limiting key.  
Ensures proper tracking and throttling per client, not per invocation.  

**Steps**:
- Replace request ID with session-based client ID as the rate limiting key.
- Ensures proper tracking and throttling per client, not per invocation.

---

### Task ID: CR-GOD-018A
**Title**: Add Expiry to Rate Limiter Map  
**Phase**: Runtime Safety  
**Status**: Planned  
**Description**:  
Add a TTL or cleanup strategy to the rateLimiter object to avoid memory leaks in long-lived environments.  

**Steps**:
- Add a TTL or cleanup strategy to the rateLimiter object to avoid memory leaks in long-lived environments.

---

### Task ID: CR-GOD-020A
**Title**: Normalize Prompt Name Matching  
**Phase**: Core Logic  
**Status**: Planned  
**Description**:  
Normalize both stored and incoming prompt names to lowercase before comparison to prevent lookup errors.  

**Steps**:
- Normalize both stored and incoming prompt names to lowercase before comparison to prevent lookup errors.

---

### Task ID: CR-GOD-021A
**Title**: Graceful CLI Error Signaling  
**Phase**: Runtime UX  
**Status**: Planned  
**Description**:  
Modify run().catch to call process.exit(1) after logging to reflect hard failures appropriately in CLI usage.  

**Steps**:
- Modify run().catch to call process.exit(1) after logging to reflect hard failures appropriately in CLI usage.

---

## Phase: Architecture Implementation

### Task ID: CR-GOD-002
**Title**: Extract Prompts to Unified Format  
**Phase**: Architecture Implementation  
**Status**: Planned  
**Description**:  
Write a `scripts/extract_prompts.py` to recursively search cloned repos for `.txt`, `.md`, or `.json` prompt files.  
Normalize contents into YAML or markdown and store in `prompts/raw/`.  
Preserve metadata: source repo, original path, line count, detected language.  

**Steps**:
- Write a `scripts/extract_prompts.py` to recursively search cloned repos for `.txt`, `.md`, or `.json` prompt files.
- Normalize contents into YAML or markdown and store in `prompts/raw/`.
- Preserve metadata: source repo, original path, line count, detected language.

---

### Task ID: CR-GOD-003
**Title**: Build Prompt Metadata Index  
**Phase**: Architecture Implementation  
**Status**: Planned  
**Description**:  
Generate a JSON index mapping: `{ prompt_id, repo, language, tags, word_count, hash }`.  
Store it in `prompts/index.json` and validate it against a schema.  
Add utility scripts to query prompts by repo or tag.  

**Steps**:
- Generate a JSON index mapping: `{ prompt_id, repo, language, tags, word_count, hash }`.
- Store it in `prompts/index.json` and validate it against a schema.
- Add utility scripts to query prompts by repo or tag.

---

### Task ID: CR-GOD-008
**Title**: Source Schema Normalization  
**Phase**: Architecture Implementation  
**Status**: Planned  
**Description**:  
Define `source_schema.yaml` describing all fields in `sources.json`.  
Include fields: repo_url, source_type, tags, last_updated, trust_score, format, language, license.  
Add unit test to validate `sources.json` entries conform to schema.  

**Steps**:
- Define `source_schema.yaml` describing all fields in `sources.json`
- Include fields: repo_url, source_type, tags, last_updated, trust_score, format, language, license
- Add unit test to validate `sources.json` entries conform to schema

---

### Task ID: CR-GOD-014A
**Title**: Design Wild Prompt Ingestion Layer  
**Phase**: Architecture Implementation  
**Status**: Planned  
**Description**:  
Develop a sub-pipeline for ingesting raw, unstructured prompts from Reddit and Discord sources.  
Create `wild_prompts/` input directory and tagging logic for chaotic user-generated content.  
Build sanitation and de-duplication logic to align with `prompts/raw/` format.  

**Steps**:
- Develop a sub-pipeline for ingesting raw, unstructured prompts from Reddit and Discord sources.
- Create `wild_prompts/` input directory and tagging logic for chaotic user-generated content.
- Build sanitation and de-duplication logic to align with `prompts/raw/` format.

---

## Phase: Security

### Task ID: CR-GOD-004
**Title**: Validate Prompt Diversity and Deduplicate  
**Phase**: Security  
**Status**: Planned  
**Description**:  
Analyze prompt corpus for language, intent, and redundancy.  
Cluster near-duplicates using Jaccard similarity or token-based heuristics.  
Flag prompts with similar semantic structure for review.  

**Steps**:
- Analyze prompt corpus for language, intent, and redundancy.
- Cluster near-duplicates using Jaccard similarity or token-based heuristics.
- Flag prompts with similar semantic structure for review.

---

### Task ID: CR-GOD-011
**Title**: GOD-OPSEC Mirror Mode  
**Phase**: Security  
**Status**: Planned  
**Description**:  
Create a `scripts/mirror_prompts.py` script to anonymously mirror prompts from high-risk sources.  
Assign a hash ID to each mirrored prompt and strip the origin unless whitelisted.  
Add a manual confidence score to each mirrored prompt.  

**Steps**:
- Create a `scripts/mirror_prompts.py` script to anonymously mirror prompts from high-risk sources.
- Assign a hash ID to each mirrored prompt and strip the origin unless whitelisted.
- Add a manual confidence score to each mirrored prompt.

---

## Phase: Ops

### Task ID: CR-GOD-005
**Title**: Hash Prompts for Change Detection  
**Phase**: Ops  
**Status**: Planned  
**Description**:  
For each prompt in `prompts/raw/`, compute a SHA256 hash and append to the metadata index.  
Detect tampered prompts during ingestion or after repo update.  
Provide a command `npm run verify-prompts` to re-check integrity.  

**Steps**:
- For each prompt in `prompts/raw/`, compute a SHA256 hash and append to the metadata index.
- Detect tampered prompts during ingestion or after repo update.
- Provide a command `npm run verify-prompts` to re-check integrity.

---

## Phase: Postprocessing

### Task ID: CR-GOD-009
**Title**: Prompt Extraction Failure Logging  
**Phase**: Postprocessing  
**Status**: Planned  
**Description**:  
Modify extraction pipeline to catch and log failures.  
Add reason codes: "encoding_error", "parse_failure", "ambiguous_format", "empty_file".  
Store results in `logs/failures/YYYY-MM-DD.log`.  

**Steps**:
- Modify extraction pipeline to catch and log failures
- Add reason codes: "encoding_error", "parse_failure", "ambiguous_format", "empty_file"
- Store results in `logs/failures/YYYY-MM-DD.log`

---

### Task ID: CR-GOD-010A
**Title**: Review Prompt Corpus Quality  
**Phase**: Postprocessing  
**Status**: Planned  
**Description**:  
Perform a manual and automated review of ingested prompts focusing on linguistic clarity, adversarial subtlety, and novelty.  
Flag prompts with excessive repetition, irrelevant content, or potential policy violations.  
Summarize review outcomes in `logs/metrics/corpus_review_report.json`.  

**Steps**:
- Perform a manual and automated review of ingested prompts focusing on linguistic clarity, adversarial subtlety, and novelty.
- Flag prompts with excessive repetition, irrelevant content, or potential policy violations.
- Summarize review outcomes in `logs/metrics/corpus_review_report.json`

---

### Task ID: CR-GOD-011A
**Title**: Source Review Audit Trail  
**Phase**: Postprocessing  
**Status**: Planned  
**Description**:  
Implement audit trail logging for each source in `sources.json` tracking decisions, reviewer, and timestamp.  
Log decisions such as “included,” “excluded (reason),” or “under review.”  
Store trail in `logs/audit/source_review.log`.  

**Steps**:
- Implement audit trail logging for each source in `sources.json` tracking decisions, reviewer, and timestamp.
- Log decisions such as “included,” “excluded (reason),” or “under review.”
- Store trail in `logs/audit/source_review.log`

---

### Task ID: CR-GOD-012A
**Title**: Full-Spectrum Tactical Debrief & Pulse Check  
**Phase**: Governance  
**Status**: Planned  
**Description**:  
Consolidate logs and reflection data from all subsystems for the past two weeks.  
Generate a `TACTICAL_REPORT.md` summarizing: agent performance, ingestion velocity, security events, deduplication efficacy, and contributor activity.  
Include a roadmap pulse-check: tasks ahead, blocked items, and realignment recommendations.  
Present insights as a weekly dashboard and link it to the README.  

**Steps**:
- Consolidate logs and reflection data from all subsystems for the past two weeks.
- Generate a `TACTICAL_REPORT.md` summarizing: agent performance, ingestion velocity, security events, deduplication efficacy, and contributor activity.
- Include a roadmap pulse-check: tasks ahead, blocked items, and realignment recommendations.
- Present insights as a weekly dashboard and link it to the README.

---

## CODEX_TASKS.md - Attack & Defense Alignment Tasks

### 🧠 New GODMODE Tasks: `CODEX_TASKS.md`

| Task ID | Title | Description |
|--------|--------|-------------|
| CR-GOD-016A | Role-Play Threat Analysis & Response Tuning | Map real-world DAN variants. Create response tuning prompts. Fine-tune refusal protocols. |
| CR-GOD-017A | GCG & Token Attack Filter Training | Train transformation layers on adversarial token sequences. Evaluate retokenization impact. |
| CR-GOD-018A | Crescendo Multi-Turn Risk Model | Model escalation trajectories. Build memory-aware monitoring hooks for context shift detection. |
| CR-GOD-019A | Obfuscation Normalization Pipeline | Implement decoding layer (Base64, ASCII, emoji encoding). Integrate pre-token validation pass. |
| CR-GOD-020A | Direct Injection Detection Harness | Build input classifiers and prompt spotlighting filters. Validate against override vectors. |
| CR-GOD-021A | Indirect Injection Source Hygiene | Design taint-tracking protocol for vector memory. Inject origin metadata from retrieval modules. |
| CR-GOD-022A | VPI Data Supply Chain Audit | Create auditing framework for dataset trust lineage. Scan for outlier signal patterns in fine-tunes. |


---

## ⛨ CODEX TASK BUNDLE: Attack & Defense Taxonomy Integration

Each task below corresponds to an item in the Attack & Defense taxonomy, ensuring comprehensive coverage of offensive vectors and corresponding defensive strategies.

---

### CR-GOD-ATK-001: Role-Play Attack Detection & Mitigation

**Description:** Implement a detection module for unconstrained role-play jailbreaks (e.g., DAN) using adversarial training and persona recognition.

**Subtasks:**
- Curate examples from known role-play attacks (e.g., DAN, EgoMode, Sophia).
- Train classification model to distinguish benign vs. persona-shifting inputs.
- Integrate filter layer before prompt execution.
- Add reflection logging of misclassification or bypass cases.

**Owner:** Alignment Guardian  
**Effort:** 5  
**Priority:** P1

---

### CR-GOD-ATK-002: Algorithmic Token Disruption (GCG-style)

**Description:** Counter non-human adversarial strings (e.g., GCG) using perturbation methods and certified input defenses.

**Subtasks:**
- Add preprocessing module: random token masking, re-tokenization.
- Implement Erase-and-Check style token sanitizer.
- Evaluate effectiveness against synthetic GCG datasets.

**Owner:** Security Scout  
**Effort:** 5  
**Priority:** P1

---

### CR-GOD-ATK-003: Multi-Turn Jailbreak Context Tracker

**Description:** Detect and trace gradual prompt steering across multi-turn dialogues.

**Subtasks:**
- Enable history-aware logging in Reflector Hook.
- Implement Dual-LLM architecture (monitor & responder agents).
- Track deltas between conversational stages and flag shifts.

**Owner:** Spawn Manager + Reflector  
**Effort:** 8  
**Priority:** P2

---

### CR-GOD-ATK-004: Obfuscation Normalization Layer

**Description:** Detect and decode encoded payloads (e.g., base64, unicode spoofing).

**Subtasks:**
- Integrate decoder module for known obfuscation formats.
- Normalize prompt inputs before LLM dispatch.
- Add post-decoding similarity check with known threat corpus.

**Owner:** Input Defender  
**Effort:** 4  
**Priority:** P2

---

### CR-GOD-ATK-005: Direct Prompt Injection Guardrails

**Description:** Enforce separation of user/system prompt boundaries.

**Subtasks:**
- Implement prompt "spotlighting" with strict role demarcation.
- Integrate regex/static analysis for override attempts.
- Add runtime guardrail feedback to LLM interface.

**Owner:** Instruction Architect  
**Effort:** 3  
**Priority:** P1

---

### CR-GOD-ATK-006: Indirect Prompt Injection Provenance Chain

**Description:** Tag, trace, and limit trust radius for external content (e.g., from websites, documents).

**Subtasks:**
- Implement taint-tracking mechanism for external data.
- Add warning/logging for LLM-generated content sourced externally.
- Chain with response-level blast radius limiter.

**Owner:** Data Forensics Agent  
**Effort:** 7  
**Priority:** P2

---

### CR-GOD-ATK-007: Data Poisoning Audit Taskforce

**Description:** Defend against backdoors introduced during training/fine-tuning.

**Subtasks:**
- Build dataset provenance metadata tracker.
- Audit training corpora for known poison signatures.
- Add runtime sandboxing for anomalous behaviors.

**Owner:** Model Integrity Auditor  
**Effort:** 8  
**Priority:** P3

---

### CR-GOD-ATK-008: Persuasive Attack Resistance Scaffold

**Description:** Equip LLM with awareness of persuasive patterns and social engineering.

**Subtasks:**
- Curate psychological manipulation examples.
- Augment guardrails with context-aware intent recognition.
- Add adversarial fine-tuning cycle focused on persuasive vectors.

**Owner:** Guardian Oracle  
**Effort:** 6  
**Priority:** P1

---


## Part V: Laboratory Enhancements

```codex-task
id: CR-GOD-REFINED-001
title: Refactor prompts/raw/ directory to support complex composite prompts
phase: Infrastructure Enhancement
status: Planned
owner: Prompt Curator
effort: 5
tags: [structure, ingestion, prompts]
```

```codex-task
id: CR-GOD-REFINED-002
title: Define and implement the Purple Teamer agent role
phase: Agent Expansion
status: Planned
owner: Coordinator-Agent
effort: 3
tags: [agents, evaluation, defense]
```

```codex-task
id: CR-GOD-REFINED-003
title: Enhance sources.json to include scoring and categorization metadata
phase: Architecture Refinement
status: Planned
owner: Prompt Curator
effort: 4
tags: [sources, metadata, scoring]
```

```codex-task
id: CR-GOD-REFINED-004
title: Build Phase 1 baseline prompt evaluation harness (ASR)
phase: Evaluation Harness
status: Planned
owner: Purple Teamer
effort: 6
tags: [evaluation, scripting, GPT-judge]
```

```codex-task
id: CR-GOD-REFINED-005
title: Extend harness to evaluate full defensive pipelines (penetration score)
phase: Evaluation Harness
status: Planned
owner: Purple Teamer
effort: 8
tags: [defense, purple-teaming, scripting]
```

```codex-task
id: CR-GOD-REFINED-006
title: Design and test for alignment degradation and hallucination effects
phase: Evaluation Harness
status: Planned
owner: Alignment Guardian
effort: 9
tags: [robustness, alignment, evaluation]
```

```codex-task
id: CR-GOD-REFINED-007
title: Implement exclusion logging protocol in logs/exclusion_log.md
phase: Ethical Review
status: Planned
owner: Alignment Guardian
effort: 3
tags: [audit, exclusion, logging]
```

```codex-task
id: CR-GOD-REFINED-008
title: Improve UX and developer ergonomics for agent orchestration
phase: Agent UX Enhancements
status: Planned
owner: Coordinator-Agent
effort: 4
tags: [ux, agents, workflow, ergonomics]

description: Refactor agent command interfaces, logging feedback loops, and CLI integration to improve usability and traceability during multi-agent execution. Includes ergonomic improvements for scripting and interactive testing during agent runs.
```

## Red Teaming and Defense Integration Tasks

### Red Teaming Framework Integration

- id: CR-GOD-RTF-001
  title: Integrate DeepTeam for Attack Simulation
  status: planned
  phase: Red Teaming Harness
  description: |
    Integrate the deepteam library into the evaluation harness. Enable support for adversarial runtime simulation using its vulnerability and attack templates.
  agents: [Purple Teamer, Research Miner, Coordinator-Agent]

- id: CR-GOD-RTF-002
  title: Integrate RedEval for Multi-Turn Attack Simulation
  status: planned
  phase: Red Teaming Harness
  description: |
    Hook in redeval's LLM-to-LLM conversation logic. Implement scenarios like gaslighting and guilt-tripping for multi-turn red teaming tasks.
  agents: [Purple Teamer, Prompt Curator]

- id: CR-GOD-RTF-003
  title: Connect PromptFoo to CI/CD Pipelines
  status: planned
  phase: Red Teaming Automation
  description: |
    Integrate promptfoo as a red team CI/CD stage. Enable ongoing prompt mutation tests to prevent regression in jailbreak resilience.
  agents: [Security Scout, Coordinator-Agent]

- id: CR-GOD-DEF-001
  title: Integrate Rebuff as Primary Defensive Layer
  status: planned
  phase: Defense Layer Integration
  description: |
    Deploy Rebuff within the prompt evaluation stack. Test both heuristic and LLM-assisted detection strategies across prompt categories.
  agents: [Alignment Guardian, Purple Teamer]

- id: CR-GOD-DEF-002
  title: Add PINT Benchmark to Evaluation Harness
  status: planned
  phase: Defense Benchmarking
  description: |
    Incorporate Lakera's PINT benchmark into the harness as a defense evaluation baseline. Score custom and integrated defenses against it.
  agents: [Security Scout, Alignment Guardian]

- id: CR-GOD-DEF-003
  title: Catalog Defensive Techniques from tldrsec/prompt-injection-defenses
  status: planned
  phase: Defense Research & Analysis
  description: |
    Extract and classify defensive methods from the tldrsec repository. Use results to populate metadata in sources.json and to inspire agent tasks.
  agents: [Research Miner, Alignment Guardian]