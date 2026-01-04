import React from "react";
import markdownit from "markdown-it";
import DOMPurify from "dompurify";

const md = markdownit({
  html: true,
});

// Add custom rule for timestamps
md.inline.ruler.push("timestamp", (state, silent) => {
  const regex = /\[(\d{2}:\d{2})\]/;
  const match = regex.exec(state.src.slice(state.pos));

  if (!match) return false;
  if (!silent) {
    const timestamp = match[1];
    const citationNumber = (state.env.citationCount =
      (state.env.citationCount || 0) + 1);
    const token = state.push("html_inline", "", 0);
    token.content = `<button class="relative inline-flex items-center justify-center w-5 h-5 mx-1 rounded-full bg-primary/50 hover:bg-primary/80 transition-colors text-xs font-medium text-white group" data-timestamp="${timestamp}">${citationNumber}<span class="absolute hidden group-hover:block bg-black/80 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">${timestamp}</span></button>`;
  }

  state.pos += match[0].length;
  return true;
});

type Props = {
  content: string;
  onTimestampClick?: (timestamp: string) => void;
};

const Markdown = ({ content, onTimestampClick }: Props) => {
  const html = md.render(content);
  const purifiedHtml = DOMPurify.sanitize(html);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" && target.dataset.timestamp) {
      onTimestampClick?.(target.dataset.timestamp);
    }
  };

  return (
    <div
      className="markdown-content space-y-4 text-foreground leading-relaxed
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 [&>h2]:border-b [&>h2]:pb-2
        [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
        [&>p]:mb-4
        [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-2 [&>ul]:mb-4
        [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:space-y-2 [&>ol]:mb-4
        [&_strong]:font-bold [&_strong]:text-primary"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: purifiedHtml }}
    />
  );
};

export default Markdown;
