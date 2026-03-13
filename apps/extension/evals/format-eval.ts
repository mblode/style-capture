#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildClaudeCapturePrompt,
  type ClaudeCapturePrompt,
  formatCaptureForClaudeMarkdown,
} from "../src/lib/claude-export.ts";
import { mapCaptureToTailwind } from "../src/lib/tailwind-mapper.ts";
import {
  FORMAT_EVAL_FIXTURES,
  type FormatEvalFixture,
} from "./fixtures/ui-capture-fixtures.ts";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const DEFAULT_JUDGE_MODEL =
  process.env.OPENAI_JUDGE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
const RESULTS_DIR = resolve("evals/results");
const RESPONSE_ENDPOINT = "https://api.openai.com/v1/responses";
const CONCURRENCY = 3;
const TOKEN_DIVISOR = 3.5;
const AND_REGEX = /\band\b/gi;
const ANSWER_TEXT_REGEX = /\s+/g;
const QUOTE_REGEX = /['"]/g;
const HTML_TAG_REGEX = /<[^>]+>/g;
const LIST_SPLIT_REGEX = /[,|\n]/;
const LEADING_LIST_MARKER_REGEX = /^[-\d.\s]+/;
const IMPLEMENTATION_BRIEF_ID = "handoff-implementation-brief";

type QuestionCategory =
  | "extraction_accuracy"
  | "grounding_clarity"
  | "handoff_quality"
  | "implementation_safety";
type ScoringMethod = "boolean" | "exact" | "list" | "llm_judge";

interface EvalContext {
  fixture: FormatEvalFixture;
  prompt: ClaudeCapturePrompt;
  serialized: string;
}

interface EvalQuestion {
  category: QuestionCategory;
  getExpected: (context: EvalContext) => string | null;
  id: string;
  question: string;
  scoringMethod: ScoringMethod;
}

interface EvalFormat {
  description: string;
  name: string;
  serialize: (context: EvalContext) => string;
}

interface EvalResult {
  expected: string | null;
  fixture: string;
  format: string;
  latencyMs: number;
  predicted: string;
  question: string;
  questionId: string;
  reasoning?: string;
  score: number;
  scoringMethod: ScoringMethod;
}

interface SerializedFixture {
  fixture: FormatEvalFixture;
  liveSerialized: string;
  prompt: ClaudeCapturePrompt;
}

interface ParsedArgs {
  dryRun: boolean;
  fixture: string | null;
  format: string | null;
  judgeModel: string;
  model: string;
}

interface OpenAiResponse {
  error?: {
    message?: string;
  };
  incomplete_details?: {
    reason?: string;
  };
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  output_text?: string;
  status?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  function readValue(name: string): string | null {
    const index = argv.indexOf(`--${name}`);

    if (index === -1) {
      return null;
    }

    return argv[index + 1] ?? null;
  }

  return {
    dryRun: argv.includes("--dry-run"),
    fixture: readValue("fixture"),
    format: readValue("format"),
    judgeModel: readValue("judge-model") ?? DEFAULT_JUDGE_MODEL,
    model: readValue("model") ?? DEFAULT_MODEL,
  };
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderTagBlock(tagName: string, lines: string[]): string {
  return [`<${tagName}>`, ...lines, `</${tagName}>`].join("\n");
}

function renderCompactWithUrl(prompt: ClaudeCapturePrompt): string {
  const sections = [
    `<style_capture url="${escapeXml(prompt.metadata.url)}" mode="${prompt.metadata.mode}" root_ref="${prompt.metadata.rootRef}" root_selector="${escapeXml(prompt.metadata.rootSelector)}" elements="${prompt.metadata.elementCount}" pseudos="${prompt.metadata.pseudoCount}">`,
    prompt.instruction,
    `<html_capture>${prompt.htmlCapture}</html_capture>`,
    `<css_capture>${prompt.cssCapture}</css_capture>`,
  ];

  if (prompt.tailwindHints.length > 0) {
    sections.push(
      renderTagBlock(
        "tailwind_hints",
        prompt.tailwindHints.map((entry) => `${entry.key}=${entry.value}`)
      )
    );
  }

  if (prompt.openQuestions.length > 0) {
    sections.push(
      renderTagBlock(
        "open_questions",
        prompt.openQuestions.map((entry) => `${entry.key}:${entry.value}`)
      )
    );
  }

  sections.push("</style_capture>");
  return sections.join("\n");
}

function renderCompactDataFirst(prompt: ClaudeCapturePrompt): string {
  const sections = [
    `<style_capture url="${escapeXml(prompt.metadata.url)}" mode="${prompt.metadata.mode}" root_ref="${prompt.metadata.rootRef}" root_selector="${escapeXml(prompt.metadata.rootSelector)}" elements="${prompt.metadata.elementCount}" pseudos="${prompt.metadata.pseudoCount}">`,
    `<html_capture>${prompt.htmlCapture}</html_capture>`,
    `<css_capture>${prompt.cssCapture}</css_capture>`,
  ];

  if (prompt.tailwindHints.length > 0) {
    sections.push(
      renderTagBlock(
        "tailwind_hints",
        prompt.tailwindHints.map((entry) => `${entry.key}=${entry.value}`)
      )
    );
  }

  if (prompt.openQuestions.length > 0) {
    sections.push(
      renderTagBlock(
        "open_questions",
        prompt.openQuestions.map((entry) => `${entry.key}:${entry.value}`)
      )
    );
  }

  sections.push(`<instructions>${prompt.instruction}</instructions>`);
  sections.push("</style_capture>");
  return sections.join("\n");
}

function renderNestedDataFirst(prompt: ClaudeCapturePrompt): string {
  const sections = [
    `<style_capture url="${escapeXml(prompt.metadata.url)}" mode="${prompt.metadata.mode}" root_ref="${prompt.metadata.rootRef}" root_selector="${escapeXml(prompt.metadata.rootSelector)}" elements="${prompt.metadata.elementCount}" pseudos="${prompt.metadata.pseudoCount}">`,
    "<source_of_truth>",
    `<html_capture>${prompt.htmlCapture}</html_capture>`,
    `<css_capture>${prompt.cssCapture}</css_capture>`,
    "</source_of_truth>",
  ];

  if (prompt.tailwindHints.length > 0 || prompt.openQuestions.length > 0) {
    sections.push("<hints>");

    if (prompt.tailwindHints.length > 0) {
      sections.push(
        renderTagBlock(
          "tailwind_hints",
          prompt.tailwindHints.map((entry) => `${entry.key}=${entry.value}`)
        )
      );
    }

    if (prompt.openQuestions.length > 0) {
      sections.push(
        renderTagBlock(
          "open_questions",
          prompt.openQuestions.map((entry) => `${entry.key}:${entry.value}`)
        )
      );
    }

    sections.push("</hints>");
  }

  sections.push(`<instructions>${prompt.instruction}</instructions>`);
  sections.push("</style_capture>");
  return sections.join("\n");
}

function renderMarkdownSections(prompt: ClaudeCapturePrompt): string {
  const lines = [
    "# Style Capture",
    "",
    "## Source of Truth",
    "```html",
    prompt.htmlCapture,
    "```",
    "",
    "```css",
    prompt.cssCapture,
    "```",
    "",
    "## Metadata",
    `- url: ${prompt.metadata.url}`,
    `- mode: ${prompt.metadata.mode}`,
    `- root_ref: ${prompt.metadata.rootRef}`,
    `- root_selector: ${prompt.metadata.rootSelector}`,
    `- elements: ${prompt.metadata.elementCount}`,
    `- pseudos: ${prompt.metadata.pseudoCount}`,
  ];

  if (prompt.tailwindHints.length > 0 || prompt.openQuestions.length > 0) {
    lines.push("", "## Hints");

    if (prompt.tailwindHints.length > 0) {
      lines.push("- Tailwind hints:");

      for (const entry of prompt.tailwindHints) {
        lines.push(`  - ${entry.key}: ${entry.value}`);
      }
    }

    if (prompt.openQuestions.length > 0) {
      lines.push("- Open questions:");

      for (const entry of prompt.openQuestions) {
        lines.push(`  - ${entry.key}: ${entry.value}`);
      }
    }
  }

  lines.push("", "## Task", prompt.instruction);
  return lines.join("\n").trim();
}

const FORMATS: EvalFormat[] = [
  {
    description: "Current shipped style_capture format with compact sections.",
    name: "style_capture",
    serialize: (context) => context.serialized,
  },
  {
    description: "Compact control with URL grounding added to the opening tag.",
    name: "style_capture_with_url",
    serialize: (context) => renderCompactWithUrl(context.prompt),
  },
  {
    description:
      "Same style_capture tags, but with data first and instructions last.",
    name: "style_capture_data_first",
    serialize: (context) => renderCompactDataFirst(context.prompt),
  },
  {
    description:
      "Explicit XML wrappers for authoritative data and non-authoritative hints.",
    name: "style_capture_nested",
    serialize: (context) => renderNestedDataFirst(context.prompt),
  },
  {
    description: "Readable markdown sections with fenced HTML and CSS blocks.",
    name: "markdown_sections",
    serialize: (context) => renderMarkdownSections(context.prompt),
  },
];

function stripHtml(value: string): string {
  return value
    .replace(HTML_TAG_REGEX, " ")
    .replace(ANSWER_TEXT_REGEX, " ")
    .trim();
}

function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(QUOTE_REGEX, "")
    .replace(ANSWER_TEXT_REGEX, " ");
}

function splitList(value: string): string[] {
  return value
    .replace(AND_REGEX, ",")
    .split(LIST_SPLIT_REGEX)
    .map((item) => normalizeAnswer(item).replace(LEADING_LIST_MARKER_REGEX, ""))
    .filter(Boolean);
}

function flattenOpenQuestionItems(prompt: ClaudeCapturePrompt): string[] {
  return prompt.openQuestions.flatMap((entry) => {
    return entry.value
      .split("; ")
      .map((item) => `${entry.key}:${item}`.trim())
      .filter(Boolean);
  });
}

function hasWidthAmbiguity(prompt: ClaudeCapturePrompt): boolean {
  return flattenOpenQuestionItems(prompt).some((item) => {
    return item.includes("w-[") || item.includes("width");
  });
}

const QUESTIONS: EvalQuestion[] = [
  {
    category: "extraction_accuracy",
    getExpected: (context) =>
      stripHtml(context.fixture.capture.rootOuterHtml) || "(none)",
    id: "extraction-visible-text",
    question:
      "What exact user-visible text appears in the captured UI? Answer with just the exact text.",
    scoringMethod: "exact",
  },
  {
    category: "grounding_clarity",
    getExpected: () => "html_capture, css_capture",
    id: "grounding-authoritative-blocks",
    question:
      "Which sections are the source of truth? Answer with comma-separated section or tag names only.",
    scoringMethod: "list",
  },
  {
    category: "grounding_clarity",
    getExpected: () => "tailwind_hints, open_questions",
    id: "grounding-hint-blocks",
    question:
      "Which sections are non-authoritative hints? Answer with comma-separated section or tag names only.",
    scoringMethod: "list",
  },
  {
    category: "extraction_accuracy",
    getExpected: (context) => context.prompt.metadata.rootSelector,
    id: "extraction-root-selector",
    question: "What is the root selector? Answer with just the selector.",
    scoringMethod: "exact",
  },
  {
    category: "extraction_accuracy",
    getExpected: (context) =>
      `${context.prompt.metadata.elementCount},${context.prompt.metadata.pseudoCount}`,
    id: "extraction-counts",
    question:
      "How many elements and pseudo-elements were captured? Answer as elements,pseudos.",
    scoringMethod: "exact",
  },
  {
    category: "implementation_safety",
    getExpected: (context) => {
      const items = flattenOpenQuestionItems(context.prompt);
      return items.length > 0 ? items.join(", ") : "(none)";
    },
    id: "safety-ambiguities",
    question:
      'List the explicitly flagged open questions, comma-separated. If there are none, answer "(none)".',
    scoringMethod: "list",
  },
  {
    category: "implementation_safety",
    getExpected: (context) => (hasWidthAmbiguity(context.prompt) ? "no" : null),
    id: "safety-hardcode-width",
    question:
      "If width is explicitly flagged as layout-dependent, should the implementation hard-code it? Answer yes or no only.",
    scoringMethod: "boolean",
  },
  {
    category: "grounding_clarity",
    getExpected: () => "html_capture and css_capture",
    id: "grounding-conflict-resolution",
    question:
      "If Tailwind hints conflict with the capture, which source should you trust? Answer with the source name only.",
    scoringMethod: "exact",
  },
  {
    category: "handoff_quality",
    getExpected: (context) =>
      `Preserve the structure shown in the captured HTML for ${context.fixture.slug}, treat html_capture and css_capture as authoritative, treat Tailwind hints as secondary, and call out ambiguities instead of inventing details.`,
    id: IMPLEMENTATION_BRIEF_ID,
    question:
      "Write a 3-5 sentence implementation brief for an engineer. Say what to preserve, what is only a hint, and which values should not be hard-coded. Do not invent missing design details.",
    scoringMethod: "llm_judge",
  },
];

function scoreExact(predicted: string, expected: string): number {
  const normalizedPredicted = normalizeAnswer(predicted);
  const normalizedExpected = normalizeAnswer(expected);

  if (normalizedPredicted === normalizedExpected) {
    return 1;
  }

  const predictedNumber = Number(normalizedPredicted);
  const expectedNumber = Number(normalizedExpected);

  if (
    !(Number.isNaN(predictedNumber) || Number.isNaN(expectedNumber)) &&
    predictedNumber === expectedNumber
  ) {
    return 1;
  }

  if (normalizedPredicted.includes(normalizedExpected)) {
    return 0.9;
  }

  if (normalizedExpected.includes(normalizedPredicted)) {
    return 0.8;
  }

  return 0;
}

function scoreBoolean(predicted: string, expected: string): number {
  const normalizedPredicted = normalizeAnswer(predicted);
  const normalizedExpected = normalizeAnswer(expected);

  let reducedPrediction = normalizedPredicted;

  if (normalizedPredicted.includes("yes")) {
    reducedPrediction = "yes";
  } else if (normalizedPredicted.includes("no")) {
    reducedPrediction = "no";
  }

  return reducedPrediction === normalizedExpected ? 1 : 0;
}

function scoreList(predicted: string, expected: string): number {
  const expectedItems = new Set(splitList(expected));
  const predictedItems = new Set(splitList(predicted));

  if (expectedItems.size === 0 && predictedItems.size === 0) {
    return 1;
  }

  const overlap = [...expectedItems].filter((item) => {
    return predictedItems.has(item);
  });
  const unionSize = new Set([...expectedItems, ...predictedItems]).size;

  if (unionSize === 0) {
    return 0;
  }

  return overlap.length / unionSize;
}

function estimateTokens(value: string): number {
  return Math.ceil(value.length / TOKEN_DIVISOR);
}

function extractResponseText(response: OpenAiResponse): string {
  if (
    typeof response.output_text === "string" &&
    response.output_text.length > 0
  ) {
    return response.output_text.trim();
  }

  const chunks =
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" || item.type === "text")
      .map((item) => item.text ?? "") ?? [];

  return chunks.join("").trim();
}

async function callOpenAi(
  apiKey: string,
  model: string,
  instructions: string,
  input: string,
  maxOutputTokens: number
): Promise<string> {
  async function request(tokens: number): Promise<OpenAiResponse> {
    const response = await fetch(RESPONSE_ENDPOINT, {
      body: JSON.stringify({
        input,
        instructions,
        max_output_tokens: tokens,
        model,
        reasoning: {
          effort: "minimal",
        },
        text: {
          format: {
            type: "text",
          },
          verbosity: "low",
        },
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = (await response.json()) as OpenAiResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ??
          `OpenAI request failed with ${response.status}.`
      );
    }

    return payload;
  }

  const initialPayload = await request(maxOutputTokens);
  const initialText = extractResponseText(initialPayload);

  if (initialText) {
    return initialText;
  }

  const retryable =
    initialPayload.status === "incomplete" &&
    initialPayload.incomplete_details?.reason === "max_output_tokens";

  if (!retryable) {
    throw new Error("OpenAI returned an empty response.");
  }

  const retryPayload = await request(maxOutputTokens * 3);
  const retryText = extractResponseText(retryPayload);

  if (!retryText) {
    throw new Error("OpenAI returned an empty response.");
  }

  return retryText;
}

async function answerQuestion(
  apiKey: string,
  model: string,
  question: EvalQuestion,
  serialized: string
): Promise<string> {
  return await callOpenAi(
    apiKey,
    model,
    question.id === IMPLEMENTATION_BRIEF_ID
      ? "You are preparing a concise engineering brief from a UI capture handoff. Answer only from the provided handoff. Keep the brief practical and do not invent details."
      : "You answer questions about UI capture prompts. Answer tersely and follow the requested output format exactly.",
    ["Capture prompt:", serialized, "", `Question: ${question.question}`].join(
      "\n"
    ),
    question.id === IMPLEMENTATION_BRIEF_ID ? 220 : 120
  );
}

async function scoreLlmJudge(
  apiKey: string,
  judgeModel: string,
  context: EvalContext,
  question: string,
  expected: string,
  predicted: string
): Promise<{ reasoning: string; score: number }> {
  const ambiguityList = flattenOpenQuestionItems(context.prompt).join(" | ");
  const raw = await callOpenAi(
    apiKey,
    judgeModel,
    'You evaluate answers about UI capture prompts. Rate 1-5 where 1=wrong, 2=partially wrong, 3=roughly correct, 4=mostly correct, 5=fully correct. Respond with JSON only: {"score": N, "reasoning": "..."}',
    [
      `Question: ${question}`,
      `Reference answer: ${expected}`,
      `Fixture ambiguities: ${ambiguityList || "(none)"}`,
      "Grading rubric:",
      "- Mentions html_capture and css_capture as authoritative.",
      "- Treats tailwind_hints as suggestions instead of source of truth.",
      "- Preserves the captured structure unless simplification is justified.",
      "- Calls out ambiguous or layout-derived values when present.",
      "- Recommends a minimal change rather than a redesign.",
      "- Does not invent missing design details.",
      `Model answer: ${predicted}`,
    ].join("\n"),
    220
  );

  try {
    const parsed = JSON.parse(raw) as { reasoning?: string; score?: number };

    return {
      reasoning: parsed.reasoning ?? "",
      score: typeof parsed.score === "number" ? (parsed.score - 1) / 4 : 0.5,
    };
  } catch {
    return {
      reasoning: "Failed to parse judge response.",
      score: 0.5,
    };
  }
}

async function mapWithConcurrency<Input, Output>(
  items: Input[],
  concurrency: number,
  worker: (item: Input) => Promise<Output>
): Promise<Output[]> {
  const results: Output[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => {
      return runWorker();
    })
  );

  return results;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function aggregateResults(
  results: EvalResult[],
  formats: EvalFormat[],
  tokenCounts: Record<string, Record<string, number>>
) {
  const byCategory: Record<string, Record<string, number[]>> = {};
  const byFixture: Record<string, Record<string, number[]>> = {};
  const byFormat: Record<string, { scores: number[]; tokens: number[] }> = {};

  for (const result of results) {
    byFormat[result.format] ??= { scores: [], tokens: [] };
    byFormat[result.format].scores.push(result.score);

    const question = QUESTIONS.find((entry) => entry.id === result.questionId);

    if (question) {
      byCategory[question.category] ??= {};
      byCategory[question.category][result.format] ??= [];
      byCategory[question.category][result.format].push(result.score);
    }

    byFixture[result.fixture] ??= {};
    byFixture[result.fixture][result.format] ??= [];
    byFixture[result.fixture][result.format].push(result.score);
  }

  for (const format of formats) {
    byFormat[format.name] ??= { scores: [], tokens: [] };

    for (const counts of Object.values(tokenCounts)) {
      const tokenCount = counts[format.name];

      if (typeof tokenCount === "number") {
        byFormat[format.name].tokens.push(tokenCount);
      }
    }
  }

  return {
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([category, data]) => {
        return [
          category,
          Object.fromEntries(
            Object.entries(data).map(([format, scores]) => {
              return [format, Number(average(scores).toFixed(3))];
            })
          ),
        ];
      })
    ),
    byFixture: Object.fromEntries(
      Object.entries(byFixture).map(([fixture, data]) => {
        return [
          fixture,
          Object.fromEntries(
            Object.entries(data).map(([format, scores]) => {
              return [format, Number(average(scores).toFixed(3))];
            })
          ),
        ];
      })
    ),
    byFormat: Object.fromEntries(
      Object.entries(byFormat).map(([format, data]) => {
        return [
          format,
          {
            avgScore: Number(average(data.scores).toFixed(3)),
            avgTokens: Math.round(average(data.tokens)),
            scorePerToken: Number(
              (
                average(data.scores) / Math.max(1, average(data.tokens))
              ).toFixed(6)
            ),
          },
        ];
      })
    ),
  };
}

function printFormats(formats: EvalFormat[]): void {
  console.log("\nFormats");
  console.log("-------");

  for (const format of formats) {
    console.log(`- ${format.name}: ${format.description}`);
  }
}

function printTokenTable(
  tokenCounts: Record<string, Record<string, number>>,
  formats: EvalFormat[]
): void {
  console.log("\nEstimated token counts");
  console.log("----------------------");

  for (const [fixture, counts] of Object.entries(tokenCounts)) {
    console.log(`\n${fixture}`);

    for (const format of formats) {
      console.log(
        `  ${format.name.padEnd(28)} ${String(counts[format.name]).padStart(6)}`
      );
    }
  }
}

function printSummaryTable(summary: {
  byFormat: Record<
    string,
    { avgScore: number; avgTokens: number; scorePerToken: number }
  >;
}): void {
  console.log("\nSummary");
  console.log("-------");
  console.log(
    "format                        avg_score   avg_tokens  score/token"
  );

  const sorted = Object.entries(summary.byFormat).sort((left, right) => {
    return right[1].avgScore - left[1].avgScore;
  });

  for (const [format, stats] of sorted) {
    console.log(
      `${format.padEnd(28)} ${stats.avgScore.toFixed(3).padStart(9)} ${String(
        stats.avgTokens
      ).padStart(12)} ${stats.scorePerToken.toFixed(6).padStart(12)}`
    );
  }
}

function filterFixtures(fixtureSlug: string | null): FormatEvalFixture[] {
  if (!fixtureSlug) {
    return FORMAT_EVAL_FIXTURES;
  }

  return FORMAT_EVAL_FIXTURES.filter((fixture) => fixture.slug === fixtureSlug);
}

function filterFormats(formatName: string | null): EvalFormat[] {
  if (!formatName) {
    return FORMATS;
  }

  return FORMATS.filter((format) => format.name === formatName);
}

function buildSerializedFixtures(
  fixtures: FormatEvalFixture[]
): SerializedFixture[] {
  return fixtures.map((fixture) => {
    const mapping = mapCaptureToTailwind(fixture.capture);
    const prompt = buildClaudeCapturePrompt(fixture.capture, mapping);

    return {
      fixture,
      liveSerialized: formatCaptureForClaudeMarkdown(fixture.capture, mapping),
      prompt,
    };
  });
}

function computeTokenCounts(
  serializedFixtures: SerializedFixture[],
  formats: EvalFormat[]
): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};

  for (const item of serializedFixtures) {
    counts[item.fixture.slug] = {};

    for (const format of formats) {
      const serialized = format.serialize({
        fixture: item.fixture,
        prompt: item.prompt,
        serialized: item.liveSerialized,
      });
      counts[item.fixture.slug][format.name] = estimateTokens(serialized);
    }
  }

  return counts;
}

function showDryRun(
  serializedFixtures: SerializedFixture[],
  formats: EvalFormat[]
): void {
  const firstFixture = serializedFixtures[0];

  if (!firstFixture) {
    return;
  }

  console.log("\nDry run previews");
  console.log("----------------");

  for (const format of formats) {
    const serialized = format.serialize({
      fixture: firstFixture.fixture,
      prompt: firstFixture.prompt,
      serialized: firstFixture.liveSerialized,
    });
    console.log(
      `\n--- ${format.name} (${estimateTokens(serialized)} tokens) ---`
    );
    console.log(serialized.split("\n").slice(0, 28).join("\n"));
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const fixtures = filterFixtures(args.fixture);
  const formats = filterFormats(args.format);

  if (fixtures.length === 0) {
    throw new Error(`No fixtures matched ${JSON.stringify(args.fixture)}.`);
  }

  if (formats.length === 0) {
    throw new Error(`No formats matched ${JSON.stringify(args.format)}.`);
  }

  const serializedFixtures = buildSerializedFixtures(fixtures);
  const tokenCounts = computeTokenCounts(serializedFixtures, formats);
  const plannedCalls = serializedFixtures.reduce((count, item) => {
    return (
      count +
      formats.reduce((formatCount, format) => {
        const context: EvalContext = {
          fixture: item.fixture,
          prompt: item.prompt,
          serialized: format.serialize({
            fixture: item.fixture,
            prompt: item.prompt,
            serialized: item.liveSerialized,
          }),
        };

        return (
          formatCount +
          QUESTIONS.filter((question) => question.getExpected(context) !== null)
            .length
        );
      }, 0)
    );
  }, 0);

  console.log(
    `Eval: ${fixtures.length} fixtures x ${formats.length} formats x variable question set = ${plannedCalls} calls`
  );
  printFormats(formats);
  printTokenTable(tokenCounts, formats);

  if (args.dryRun) {
    showDryRun(serializedFixtures, formats);
    console.log("\nDry run only. No model calls were made.");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for live evals. Use --dry-run to preview."
    );
  }

  const jobs = serializedFixtures.flatMap((item) => {
    return formats.flatMap((format) => {
      const serialized = format.serialize({
        fixture: item.fixture,
        prompt: item.prompt,
        serialized: item.liveSerialized,
      });
      const context = {
        fixture: item.fixture,
        prompt: item.prompt,
        serialized,
      } satisfies EvalContext;

      return QUESTIONS.filter((question) => {
        return question.getExpected(context) !== null;
      }).map((question) => {
        return {
          context,
          format: format.name,
          question,
        };
      });
    });
  });

  const results = await mapWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const expected = job.question.getExpected(job.context);
    const start = Date.now();
    const predicted = await answerQuestion(
      apiKey,
      args.model,
      job.question,
      job.context.serialized
    );
    const latencyMs = Date.now() - start;

    if (job.question.scoringMethod === "exact" && expected !== null) {
      return {
        expected,
        fixture: job.context.fixture.slug,
        format: job.format,
        latencyMs,
        predicted,
        question: job.question.question,
        questionId: job.question.id,
        score: scoreExact(predicted, expected),
        scoringMethod: job.question.scoringMethod,
      } satisfies EvalResult;
    }

    if (job.question.scoringMethod === "boolean" && expected !== null) {
      return {
        expected,
        fixture: job.context.fixture.slug,
        format: job.format,
        latencyMs,
        predicted,
        question: job.question.question,
        questionId: job.question.id,
        score: scoreBoolean(predicted, expected),
        scoringMethod: job.question.scoringMethod,
      } satisfies EvalResult;
    }

    if (job.question.scoringMethod === "list" && expected !== null) {
      return {
        expected,
        fixture: job.context.fixture.slug,
        format: job.format,
        latencyMs,
        predicted,
        question: job.question.question,
        questionId: job.question.id,
        score: scoreList(predicted, expected),
        scoringMethod: job.question.scoringMethod,
      } satisfies EvalResult;
    }

    const judged = await scoreLlmJudge(
      apiKey,
      args.judgeModel,
      job.context,
      job.question.question,
      expected ?? "",
      predicted
    );

    return {
      expected,
      fixture: job.context.fixture.slug,
      format: job.format,
      latencyMs,
      predicted,
      question: job.question.question,
      questionId: job.question.id,
      reasoning: judged.reasoning,
      score: judged.score,
      scoringMethod: job.question.scoringMethod,
    } satisfies EvalResult;
  });

  const summary = aggregateResults(results, formats, tokenCounts);
  mkdirSync(RESULTS_DIR, { recursive: true });

  writeFileSync(
    resolve(RESULTS_DIR, "format-eval-results.json"),
    JSON.stringify(
      {
        meta: {
          fixtureCount: fixtures.length,
          fixtures: fixtures.map((fixture) => fixture.slug),
          formatCount: formats.length,
          formats: formats.map((format) => format.name),
          judgeModel: args.judgeModel,
          model: args.model,
          questionCount: QUESTIONS.length,
          timestamp: new Date().toISOString(),
        },
        results,
        tokenCounts,
      },
      null,
      2
    )
  );

  writeFileSync(
    resolve(RESULTS_DIR, "format-eval-summary.json"),
    JSON.stringify(summary, null, 2)
  );

  printSummaryTable(summary);
  console.log(`\nWrote results to ${RESULTS_DIR}`);
}

main().catch((error) => {
  console.error("\nformat-eval failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
