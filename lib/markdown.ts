// AI Generated
// Minimal, dependency-free Markdown → HTML renderer shared by the visitor
// widget and the agent inbox. The input is HTML-escaped first and only a
// limited tag set (headings, lists, links, emphasis, code) is re-introduced
// afterwards. The escaper neutralises &, <, >, " and ' before any tag is
// reintroduced, so untrusted content cannot break out of generated attributes
// (e.g. a crafted link href) or inject executable markup.

// Private-use sentinels mark extracted code blocks so their contents are never
// run through inline formatting. They can't collide with HTML-escaped user
// text, which only ever contains printable ASCII for these characters.
const FENCE_OPEN = "\uE000";
const FENCE_CLOSE = "\uE001";

export function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Pull fenced code blocks out first so their contents aren't inline-formatted.
  const codeBlocks: string[] = [];
  let src = md.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    codeBlocks.push(esc(code.replace(/^\n/, "")));
    return `${FENCE_OPEN}${codeBlocks.length - 1}${FENCE_CLOSE}`;
  });

  src = esc(src);

  // Block-level: headings, hr, lists, paragraphs.
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  let inOrdered = false;

  const closeLists = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
    if (inOrdered) {
      out.push("</ol>");
      inOrdered = false;
    }
  };

  const fenceRe = new RegExp(`^${FENCE_OPEN}(\\d+)${FENCE_CLOSE}$`);

  for (const raw of lines) {
    const line = raw.trimEnd();
    const codeMatch = line.match(fenceRe);
    if (codeMatch) {
      closeLists();
      out.push(`<pre><code>${codeBlocks[Number(codeMatch[1])]}</code></pre>`);
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      closeLists();
      const level = line.match(/^#+/)![0].length;
      const text = inline(line.replace(/^#{1,6}\s+/, ""));
      out.push(`<h${level}>${text}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      closeLists();
      out.push("<hr/>");
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        closeLists();
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOrdered) {
        closeLists();
        out.push("<ol>");
        inOrdered = true;
      }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (line.trim() === "") {
      closeLists();
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return out.join("\n");
}

// Inline formatting: bold, italic, inline code, links.
function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      (_m, text: string, url: string) => {
        // `text`/`url` are already HTML-escaped by `esc` (quotes included), so
        // the attribute can't be broken out of. As defense in depth we also
        // percent-encode any residual attribute-breaking chars in the href.
        const safe = url.replace(
          /["<>]/g,
          (c) => ({ '"': "%22", "<": "%3C", ">": "%3E" })[c] ?? c,
        );
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      },
    );
}
