/* eslint-disable react/no-danger -- shiki-generated HTML from server-side code highlighting */
import { codeToHtml } from "shiki";

import { Card } from "@/components/store/card";
import { cn } from "@/lib/utils";

export const CodeBlock = async ({
  code,
  lang = "xml",
  label,
  className,
  style,
}: {
  code: string;
  lang?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const html = await codeToHtml(code.trim(), {
    lang,
    theme: "github-light",
  });

  return (
    <Card className={cn("overflow-hidden bg-white", className)} style={style}>
      {label && (
        <div className="px-5 pt-4 pb-0 font-bold text-[11px] text-black/40 uppercase tracking-[0.18em]">
          {label}
        </div>
      )}
      <div
        className="[&_pre]:!bg-transparent [&_code]:!bg-transparent [&_pre]:p-5 [&_pre]:pt-3 [&_pre]:text-[13px] [&_pre]:leading-[1.55]"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki-generated HTML from server-side code highlighting
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Card>
  );
};
