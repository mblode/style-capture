import type { CDPSession, Page } from "playwright";

const readMatches = (session: CDPSession, nodeId: number) =>
  session.send("CSS.getMatchedStylesForNode", { nodeId });
type Matches = Awaited<ReturnType<typeof readMatches>>;
type AuthorRule = NonNullable<Matches["matchedCSSRules"]>[number]["rule"];
type Style = NonNullable<Matches["inlineStyle"]>;

export interface SourceCssRule {
  kind: "rule" | "inline" | "keyframes" | "font" | "property";
  cssText: string;
  sourceURL: string;
  styleSheetId?: string;
  selector?: string;
  wrappers: string[];
  contexts: string[];
  range?: Style["range"];
}

export interface SourceCssCapture {
  css: string;
  rules: SourceCssRule[];
  stylesheets: { id: string; sourceURL: string; inline: boolean }[];
  variables: { nodeIndex: number; name: string; value: string }[];
  gaps: string[];
}

const declarations = (style: Style): string =>
  style.cssText ??
  style.cssProperties
    .filter((property) => !property.disabled && property.parsedOk !== false)
    .map(
      (property) =>
        `${property.name}: ${property.value}${property.important && !property.value.endsWith("!important") ? " !important" : ""};`
    )
    .join("\n");

/** CDP supplies each condition list from the inner rule outwards. */
const ruleWrappers = (rule: AuthorRule, gaps: Set<string>): string[] => {
  const queues: Record<string, string[]> = {
    MediaRule: (rule.media ?? []).map((item) => `@media ${item.text || "all"}`),
    SupportsRule: (rule.supports ?? []).map((item) => `@supports ${item.text}`),
    ContainerRule: (rule.containerQueries ?? []).map(
      (item) => `@container ${item.name ? `${item.name} ` : ""}${item.text}`
    ),
    LayerRule: (rule.layers ?? []).map((item) => `@layer ${item.text}`),
    ScopeRule: (rule.scopes ?? []).map((item) => `@scope ${item.text}`),
    StyleRule: [...(rule.nestingSelectors ?? [])],
    StartingStyleRule: (rule.startingStyles ?? []).map(() => "@starting-style"),
    NavigationRule: (rule.navigations ?? []).map(
      (item) => `@navigation ${item.text}`
    ),
  };
  if (rule.ruleTypes?.length) {
    return rule.ruleTypes.flatMap((type) => {
      const wrapper = queues[type]?.shift();
      if (wrapper === undefined) {
        gaps.add(`A ${type} ancestor could not be reconstructed.`);
        return [];
      }
      return [wrapper];
    });
  }
  const present = Object.values(queues).filter((items) => items.length > 0);
  if (present.length > 1) {
    gaps.add(
      "This Chromium version omits mixed condition nesting order; wrappers are approximate."
    );
  }
  return present.flat();
};

const wrap = (text: string, wrappers: string[]): string => {
  let body = text;
  for (const wrapper of wrappers) {
    body = `${wrapper} {\n${body}\n}`;
  }
  return body;
};

/**
 * Author-source evidence for the selected subtree, never a replacement for the
 * computed capture. No complete page stylesheet or unrelated DOM text is emitted.
 */
export const captureSourceCss = async (
  page: Page,
  selector: string
): Promise<SourceCssCapture> => {
  const gaps = new Set<string>([
    "Source CSS is evidence, not an isolated replay: selector context, cascade ordering, layout ancestors and inactive interaction states can differ. Computed capture remains the oracle.",
    "Only the main-document light DOM is traversed; iframe and shadow-tree descendants are not collected.",
  ]);
  const rules = new Map<string, SourceCssRule>();
  const sheets = new Map<
    string,
    { id: string; sourceURL: string; inline: boolean }
  >();
  const variables: SourceCssCapture["variables"] = [];
  const registrations: NonNullable<Matches["cssPropertyRules"]> = [];
  let session: CDPSession | undefined;
  try {
    const documentBaseURL = await page.evaluate(() => document.baseURI);
    session = await page.context().newCDPSession(page);
    session.on("CSS.styleSheetAdded", ({ header }) => {
      if (header.origin !== "regular" && header.origin !== "injected") {
        return;
      }
      sheets.set(header.styleSheetId, {
        id: header.styleSheetId,
        sourceURL: header.isInline
          ? documentBaseURL
          : header.sourceURL || documentBaseURL,
        inline: header.isInline,
      });
      if (header.loadingFailed) {
        gaps.add(
          `A stylesheet failed to load: ${header.sourceURL || "inline stylesheet"}`
        );
      }
    });
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const { root } = await session.send("DOM.getDocument", { depth: 0 });
    const { nodeId } = await session.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    if (nodeId) {
      const descendants = await session.send("DOM.querySelectorAll", {
        nodeId,
        selector: "*",
      });
      const ids = [nodeId, ...descendants.nodeIds];
      const add = (rule: Omit<SourceCssRule, "sourceURL">): void => {
        const sourceURL =
          (rule.styleSheetId && sheets.get(rule.styleSheetId)?.sourceURL) ||
          documentBaseURL;
        if (rule.styleSheetId && !sheets.has(rule.styleSheetId)) {
          gaps.add(
            "Some stylesheet source URLs were unavailable; relative resource resolution may be incomplete."
          );
        }
        const key = JSON.stringify([
          rule.kind,
          rule.styleSheetId,
          rule.range,
          rule.cssText,
          rule.wrappers,
        ]);
        const existing = rules.get(key);
        if (existing) {
          existing.contexts = [
            ...new Set([...existing.contexts, ...rule.contexts]),
          ];
        } else {
          rules.set(key, { ...rule, sourceURL });
        }
      };
      const addRule = (rule: AuthorRule, context: string): void => {
        if (rule.origin !== "regular" && rule.origin !== "injected") {
          return;
        }
        const wrappers = ruleWrappers(rule, gaps);
        add({
          kind: "rule",
          selector: rule.selectorList.text,
          cssText: `${rule.selectorList.text} {\n${declarations(rule.style)}\n}`,
          wrappers,
          styleSheetId: rule.styleSheetId,
          range: rule.style.range,
          contexts: [context],
        });
      };
      const addInline = (style: Style | undefined, context: string): void => {
        if (style && declarations(style).trim()) {
          add({
            kind: "inline",
            cssText: declarations(style),
            wrappers: [],
            contexts: [context],
            styleSheetId: style.styleSheetId,
            range: style.range,
          });
        }
      };
      const collectMatched = (matched: Matches, context: string): void => {
        addInline(matched.inlineStyle, context);
        for (const match of matched.matchedCSSRules ?? []) {
          addRule(match.rule, context);
        }
        for (const pseudo of matched.pseudoElements ?? []) {
          for (const match of pseudo.matches) {
            addRule(match.rule, `${context}::${pseudo.pseudoType}`);
          }
        }
        for (const [depth, ancestor] of (matched.inherited ?? []).entries()) {
          const inheritedContext = `${context}/ancestor:${depth + 1}`;
          addInline(ancestor.inlineStyle, inheritedContext);
          for (const match of ancestor.matchedCSSRules) {
            addRule(match.rule, inheritedContext);
          }
        }
      };
      const collectDependencies = (matched: Matches, context: string): void => {
        for (const animation of matched.cssKeyframesRules ?? []) {
          const frames = animation.keyframes;
          add({
            kind: "keyframes",
            cssText: `@keyframes ${animation.animationName.text} {\n${frames.map((frame) => `${frame.keyText.text} { ${declarations(frame.style)} }`).join("\n")}\n}`,
            styleSheetId: frames[0]?.styleSheetId,
            wrappers: [],
            contexts: [context],
          });
        }
        for (const font of matched.cssAtRules ?? []) {
          if (font.origin === "regular" || font.origin === "injected") {
            add({
              kind: "font",
              cssText: `@${font.type}${font.name ? ` ${font.name.text}` : ""} {\n${declarations(font.style)}\n}`,
              styleSheetId: font.styleSheetId,
              range: font.style.range,
              wrappers: [],
              contexts: [context],
            });
          }
        }
        registrations.push(...(matched.cssPropertyRules ?? []));
        if (matched.cssPropertyRegistrations?.length) {
          gaps.add(
            "JavaScript CSS.registerProperty registrations are not reproduced; computed custom-property values are retained."
          );
        }
        if (
          matched.cssFunctionRules?.length ||
          matched.cssPositionTryRules?.length
        ) {
          gaps.add(
            "CSS functions and position-try dependency rules are not reconstructed."
          );
        }
      };
      for (const [index, id] of ids.entries()) {
        let matched: Matches;
        try {
          matched = await readMatches(session, id);
        } catch {
          gaps.add(
            `Matched styles unavailable for subtree node ${index}; the DOM may have changed.`
          );
          continue;
        }
        const context = `node:${index}`;
        collectMatched(matched, context);
        collectDependencies(matched, context);
      }
      const names = new Set<string>();
      for (const rule of rules.values()) {
        for (const match of rule.cssText.matchAll(/var\(\s*(--[\w-]+)/g)) {
          names.add(match[1]);
        }
      }
      for (const registration of registrations) {
        if (names.has(registration.propertyName.text)) {
          add({
            kind: "property",
            cssText: `@property ${registration.propertyName.text} {\n${declarations(registration.style)}\n}`,
            styleSheetId: registration.styleSheetId,
            range: registration.style.range,
            contexts: ["custom-property dependency"],
            wrappers: [],
          });
        }
      }
      variables.push(
        ...(await page.evaluate(
          ({ sel, propertyNames }) => {
            const element = document.querySelector(sel);
            if (!element) {
              return [];
            }
            return [element, ...element.querySelectorAll("*")].flatMap(
              (target, nodeIndex) => {
                const style = getComputedStyle(target);
                return propertyNames.map((name) => ({
                  nodeIndex,
                  name,
                  value: style.getPropertyValue(name),
                }));
              }
            );
          },
          { sel: selector, propertyNames: [...names] }
        ))
      );
      if (![...rules.values()].some((rule) => rule.kind === "font")) {
        gaps.add(
          "CDP reported no font dependency rules. Native fonts or an older Chromium protocol may be responsible; bundled font completeness is unverified."
        );
      }
      gaps.add(
        "Inherited declarations retain ancestor selectors; inline declarations are structured evidence only. Custom-property references use identifier matching; escaped identifiers and dynamic changes may be incomplete."
      );
      gaps.add(
        "Keyframe and font dependency conditions and global layer-order statements are not reconstructed; selected matching rule conditions are preserved where CDP exposes them."
      );
    } else {
      gaps.add(
        "The selected element was not found; no author CSS was collected."
      );
    }
  } catch {
    gaps.add(
      "Author CSS collection was incomplete: Chromium CDP may be unavailable, the page may have navigated, or stylesheet access may have failed."
    );
  } finally {
    await session?.detach().catch(() => {
      gaps.add("The CSS inspection session could not be detached.");
    });
  }
  const capturedRules = [...rules.values()];
  const usedSheets = new Set(capturedRules.map((rule) => rule.styleSheetId));
  return {
    css: capturedRules
      .filter((rule) => rule.kind !== "inline")
      .map((rule) => wrap(rule.cssText, rule.wrappers))
      .join("\n\n"),
    rules: capturedRules,
    stylesheets: [...sheets.values()].filter((sheet) =>
      usedSheets.has(sheet.id)
    ),
    variables,
    gaps: [...gaps],
  };
};
