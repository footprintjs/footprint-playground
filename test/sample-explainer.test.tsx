import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SampleExplainer } from "../src/components/SampleExplainer";

describe("sample markdown's standard code rendering", () => {
  it("retains inline code without leaking renderer metadata into the DOM", () => {
    const html = renderToStaticMarkup(<SampleExplainer markdown="Use `scope.answer` here." />);
    expect(html).toContain("Use <code>scope.answer</code> here.");
    expect(html).not.toContain("node=");
    expect(html).not.toContain("inline=");
  });

  it("retains highlighted code-block language classes and escaped values", () => {
    const html = renderToStaticMarkup(<SampleExplainer markdown={'```typescript\nconst value = "<unsafe>";\n```'} />);
    expect(html).toContain("<pre style=");
    expect(html).toContain('<code class="hljs language-typescript">');
    expect(html).toContain('class="hljs-keyword"');
    expect(html).toContain("&lt;unsafe&gt;");
    expect(html).not.toContain("<unsafe>");
    expect(html).not.toContain("node=");
  });
});
