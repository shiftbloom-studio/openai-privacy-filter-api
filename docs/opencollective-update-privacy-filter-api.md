# A Small API Integration For Easier Privacy Filtering

**Excerpt**

We put together a small open-source API and sandbox around `openai/privacy-filter`, making it easier for developers to test, self-host, and integrate privacy filtering without wiring up the model from scratch.

---

This is a small project, and intentionally so.

The **OpenAI Privacy Filter API** is a straightforward integration around `openai/privacy-filter`: a FastAPI wrapper, a simple `/v1/filter` endpoint, and a Next.js sandbox for testing requests in the browser.

The goal is practical: help developers get easier access to privacy filtering tools, especially when they want something they can run locally, containerize, inspect, or adapt for their own stack.

It is not a new model. It is not a full privacy platform. It is an API integration and testing surface that removes some setup friction around an existing open model.

## What It Does

The service exposes a minimal contract:

- `GET /health` reports service status and model readiness.
- `POST /v1/filter` accepts text and returns a filtered version plus optional detected spans.
- Three redaction modes are supported: `mask`, `remove`, and `annotate`.
- Supported labels include private names, emails, phone numbers, URLs, dates, addresses, account numbers, and secrets.

The sandbox is there so developers can quickly paste sample text, choose a mode, run the request, and inspect the returned spans. It is mainly a convenience layer for testing the API and understanding the response format.

## Why We Built It

Many AI and data workflows now pass free-form text between systems: prompts, forms, support messages, notes, logs, documents, and internal tools. Before that text moves further, developers often need a simple way to detect or remove private information.

There are different ways to solve that problem. This project focuses on one narrow part of it: making `openai/privacy-filter` easier to try and integrate through a conventional HTTP API.

A filter like this is not a guarantee, and it does not replace privacy policies, review processes, or careful architecture. But it can be a useful checkpoint in a larger system: detect likely private spans, mask or remove them, and return structured information that the application can handle.

## Built To Be Run, Changed, And Hosted

The repository is structured as a small monorepo:

- `apps/api` contains the FastAPI service, redaction logic, AWS Lambda handler, and tests.
- `apps/web` contains the Next.js App Router sandbox and server-side proxy.
- `docs` contains API and deployment notes.
- `infra/docker` contains the API container setup.

The API can run locally, in Docker, on AWS Lambda through a container image, or behind a server-side web proxy. The deployment notes cover the basic environment variables, model cache setup, and hosting considerations.

The contract is deliberately small so it is easy to inspect and replace. If a team wants to swap the model, change the deployment target, or use only the redaction logic, the project should be simple enough to modify.

## What Support Helps With

Even a small integration has ongoing work around it: dependency updates, deployment checks, documentation, tests, and fixes when upstream packages or hosting environments change.

Support through Open Collective helps fund that background work:

- keeping the API and sandbox maintained;
- improving setup and deployment notes;
- testing realistic examples and edge cases;
- keeping the project usable for developers who want a quick starting point.

This is small-scale open-source maintenance. Contributions help keep the integration available, documented, and easy to run.

## Part Of The Shiftbloom Approach

At shiftbloom studio. Open Tech & Arts, not every project needs to be large or visually expressive. Some work is simply about making useful technical pieces easier to access.

This project belongs in that category.

It is a small API integration for the global developer community: easy to set up, easy to test, and open for anyone who wants to build privacy filtering into their own tools.
