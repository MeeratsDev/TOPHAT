(function (root, factory) {
	if (typeof module !== "undefined" && module.exports)
		module.exports = factory();
	else if (typeof define === "function" && define.amd) define(factory);
	else root.MD = factory();
})(typeof self !== "undefined" ? self : this, function () {
	// ── Utilities ────────────────────────────────────────────────────────────────

	function esc(s) {
		return s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function slug(s) {
		return s
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.trim()
			.replace(/[\s_]+/g, "-")
			.replace(/-+/g, "-");
	}

	// ── Inline parser ────────────────────────────────────────────────────────────

	function inline(src, opts) {
		src = src.replace(
			/\\([\\`*_{}\[\]()#+\-.!~])/g,
			(_, c) => `\x02${c.charCodeAt(0)}\x03`,
		);

		if (!opts.sanitize)
			src = src.replace(/<(\/?[a-zA-Z][^>]*)>/g, "\x02HTML<$1>\x03");

		const codes = [];
		src = src.replace(
			/(`+)([^`][\s\S]*?[^`])\1|(`+)(.+?)\3/g,
			(_, t1, c1, t2, c2) => {
				codes.push(`<code>${esc((c1 || c2).trim())}</code>`);
				return `\x02C${codes.length - 1}\x03`;
			},
		);

		if (opts.smart) {
			src = src
				.replace(/---/g, "&mdash;")
				.replace(/--/g, "&ndash;")
				.replace(/\.\.\./g, "&hellip;")
				.replace(/"([^"]+)"/g, "\u201C$1\u201D")
				.replace(/'([^']+)'/g, "\u2018$1\u2019");
		}

		// Images
		src = src.replace(
			/!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)/g,
			(_, a, u, t) =>
				`<img src="${u}" alt="${esc(a)}"${t ? ` title="${esc(t)}"` : ""}>`,
		);

		// Links
		src = src.replace(
			/\[([^\]]+)\]\((\S+?)(?:\s+"([^"]*)")?\)/g,
			(_, lbl, u, t) =>
				`<a href="${u}"${t ? ` title="${esc(t)}"` : ""}>${inline(lbl, opts)}</a>`,
		);

		// Footnote refs
		src = src.replace(
			/\[\^([^\]]+)\]/g,
			(_, id) =>
				`<sup><a href="#fn-${slug(id)}" id="fnref-${slug(id)}">[${esc(id)}]</a></sup>`,
		);

		src = src.replace(
			/(\*{3}|_{3})(.+?)\1/g,
			"<strong><em>$2</em></strong>",
		);
		src = src.replace(/(\*{2}|_{2})(.+?)\1/g, "<strong>$2</strong>");
		src = src.replace(/(\*|_)(?!\s)(.+?)(?<!\s)\1/g, "<em>$2</em>");
		src = src.replace(/~~(.+?)~~/g, "<del>$1</del>");

		src = src.replace(
			/<(https?:\/\/[^>]+)>/g,
			(_, u) => `<a href="${u}">${u}</a>`,
		);
		src = src.replace(
			/<([^\s@>]+@[^\s@>]+\.[^\s@>]+)>/g,
			(_, e) => `<a href="mailto:${e}">${e}</a>`,
		);

		src = src.replace(/( {2}|\\)\n/g, "<br>\n");

		src = src.replace(/\x02C(\d+)\x03/g, (_, i) => codes[i]);
		src = src.replace(/\x02(\d+)\x03/g, (_, n) =>
			esc(String.fromCharCode(+n)),
		);
		src = src.replace(/\x02HTML(<[^>]+>)\x03/g, "$1");
		return src;
	}

	// ── List parser ──────────────────────────────────────────────────────────────

	function parseList(lines, start, opts) {
		const base = lines[start].match(/^(\s*)/)[1].length;
		const ordered = /^\s*\d+\./.test(lines[start]);
		const tag = ordered ? "ol" : "ul";
		let html = `<${tag}>\n`,
			i = start;

		while (i < lines.length) {
			const ln = lines[i];
			const ind = ln.match(/^(\s*)/)[1].length;
			if (ind < base) break;

			const m = ln.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
			if (!m || ind !== base) break;

			let content = m[3];
			const task = content.match(/^\[([ xX])\]\s+(.*)/);
			let chk = "";
			if (task) {
				chk = task[1].toLowerCase() === "x" ? " checked" : "";
				content = task[2];
			}
			i++;

			const sub = [];
			while (i < lines.length) {
				const nx = lines[i];
				if (nx.trim() === "") {
					sub.push("");
					i++;
					continue;
				}
				const ni = nx.match(/^(\s*)/)[1].length;
				const isItem = /^(\s*)([-*+]|\d+\.)\s/.test(nx);
				if (isItem && ni === base) break;
				if (ni > base) {
					sub.push(nx);
					i++;
					continue;
				}
				break;
			}

			let li = task ? `<input type="checkbox" disabled${chk}> ` : "";
			li += inline(content, opts);
			if (sub.length && sub.some((l) => l.trim())) {
				li += "\n" + parseList(sub, 0, opts).html;
			}
			html += `<li>${li}</li>\n`;
		}

		return { html: `${html}</${tag}>`, next: i };
	}

	// ── Block parser ─────────────────────────────────────────────────────────────

	function blocks(lines, opts, fns) {
		const out = [];
		let i = 0;

		while (i < lines.length) {
			const ln = lines[i];

			if (!ln.trim()) {
				i++;
				continue;
			}

			// Raw HTML block
			if (!opts.sanitize && /^<([a-zA-Z][a-zA-Z0-9]*)(\s|>|$)/.test(ln)) {
				const tag = ln.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)[1];
				const chunk = [];
				while (i < lines.length) {
					chunk.push(lines[i]);
					if (lines[i].includes(`</${tag}>`)) {
						i++;
						break;
					}
					i++;
				}
				out.push(chunk.join("\n"));
				continue;
			}

			// Fenced code block
			const fence = ln.match(/^(`{3,}|~{3,})\s*(\S*)/);
			if (fence) {
				const [, mark, lang] = fence;
				i++;
				const code = [];
				while (
					i < lines.length &&
					!lines[i].startsWith(mark[0].repeat(mark.length))
				)
					code.push(lines[i++]);
				i++;
				const raw = code.join("\n");
				const hi =
					opts.highlight && lang ? opts.highlight(raw, lang) : null;
				const cls = lang ? ` class="language-${esc(lang)}"` : "";
				out.push(`<pre><code${cls}>${hi || esc(raw)}</code></pre>`);
				continue;
			}

			// Indented code block
			if (/^(?: {4}|\t)/.test(ln)) {
				const code = [];
				while (i < lines.length && /^(?: {4}|\t)/.test(lines[i]))
					code.push(lines[i++].replace(/^(?: {4}|\t)/, ""));
				out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
				continue;
			}

			// Horizontal rule
			if (/^([-*_])\s*\1\s*\1(\s*\1)*\s*$/.test(ln)) {
				out.push("<hr>");
				i++;
				continue;
			}

			// ATX heading
			const atx = ln.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
			if (atx) {
				const lv = atx[1].length;
				const txt = inline(atx[2].trim(), opts);
				const id = opts.headerIds ? ` id="${slug(atx[2].trim())}"` : "";
				out.push(`<h${lv}${id}>${txt}</h${lv}>`);
				i++;
				continue;
			}

			// Setext heading
			if (i + 1 < lines.length) {
				if (/^=+$/.test(lines[i + 1].trim())) {
					const id = opts.headerIds ? ` id="${slug(ln.trim())}"` : "";
					out.push(`<h1${id}>${inline(ln.trim(), opts)}</h1>`);
					i += 2;
					continue;
				}
				if (/^-{2,}$/.test(lines[i + 1].trim())) {
					const id = opts.headerIds ? ` id="${slug(ln.trim())}"` : "";
					out.push(`<h2${id}>${inline(ln.trim(), opts)}</h2>`);
					i += 2;
					continue;
				}
			}

			// Blockquote
			if (/^>\s?/.test(ln)) {
				const bq = [];
				while (i < lines.length && /^>\s?/.test(lines[i]))
					bq.push(lines[i++].replace(/^>\s?/, ""));
				out.push(
					`<blockquote>\n${blocks(bq, opts, fns)}\n</blockquote>`,
				);
				continue;
			}

			// Footnote definition
			const fn = ln.match(/^\[\^([^\]]+)\]:\s*(.*)/);
			if (fn) {
				fns[fn[1]] = fn[2];
				i++;
				continue;
			}

			// GFM table
			if (
				i + 1 < lines.length &&
				/^\|?[-:| ]+\|[-:| ]*$/.test(lines[i + 1])
			) {
				const hdrs = ln
					.replace(/^\||\|$/g, "")
					.split("|")
					.map((s) => s.trim());
				const aligns = lines[i + 1]
					.replace(/^\||\|$/g, "")
					.split("|")
					.map((s) => {
						s = s.trim();
						if (/^:-+:$/.test(s)) return "center";
						if (/^-+:$/.test(s)) return "right";
						if (/^:-+$/.test(s)) return "left";
						return null;
					});
				i += 2;
				const rows = [];
				while (i < lines.length && /\|/.test(lines[i]))
					rows.push(
						lines[i++]
							.replace(/^\||\|$/g, "")
							.split("|")
							.map((s) => s.trim()),
					);

				let t = "<table>\n<thead>\n<tr>";
				hdrs.forEach((h, idx) => {
					const al = aligns[idx]
						? ` style="text-align:${aligns[idx]}"`
						: "";
					t += `<th${al}>${inline(h, opts)}</th>`;
				});
				t += "</tr>\n</thead>\n<tbody>\n";
				rows.forEach((row) => {
					t += "<tr>";
					row.forEach((cell, idx) => {
						const al = aligns[idx]
							? ` style="text-align:${aligns[idx]}"`
							: "";
						t += `<td${al}>${inline(cell, opts)}</td>`;
					});
					t += "</tr>\n";
				});
				out.push(t + "</tbody>\n</table>");
				continue;
			}

			// List
			if (/^(\s*)([-*+]|\d+\.)\s/.test(ln)) {
				const res = parseList(lines, i, opts);
				out.push(res.html);
				i = res.next;
				continue;
			}

			// Paragraph
			const para = [];
			while (
				i < lines.length &&
				lines[i].trim() !== "" &&
				!/^(#{1,6}\s|>|`{3,}|~{3,}|\s*([-*+]|\d+\.)\s)/.test(
					lines[i],
				) &&
				!/^([-*_])\s*\1\s*\1/.test(lines[i]) &&
				!/^<[a-zA-Z]/.test(lines[i])
			) {
				para.push(lines[i++]);
			}

			if (para.length) out.push(`<p>${inline(para.join(" "), opts)}</p>`);
		}

		return out.join("\n");
	}

	// ── Footnote renderer ────────────────────────────────────────────────────────

	function renderFns(fns, opts) {
		const ids = Object.keys(fns);
		if (!ids.length) return "";
		let h = '<section class="footnotes">\n<hr>\n<ol>\n';
		ids.forEach((id) => {
			const s = slug(id);
			h += `<li id="fn-${s}">${inline(fns[id], opts)} <a href="#fnref-${s}">↩</a></li>\n`;
		});
		return h + "</ol>\n</section>";
	}

	// ── Front-matter ─────────────────────────────────────────────────────────────

	function frontMatter(text) {
		const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!m) return { body: text, meta: {} };
		const meta = {};
		m[1].split("\n").forEach((ln) => {
			const [k, ...v] = ln.split(":");
			if (k) meta[k.trim()] = v.join(":").trim();
		});
		return { body: m[2], meta };
	}

	// ── Meta renderer ─────────────────────────────────────────────────────────────

	// Known keys get semantic treatment; everything else renders as a generic pill.
	function renderMeta(meta) {
		if (!Object.keys(meta).length) return "";

		const known = [
			"title",
			"subtitle",
			"author",
			"date",
			"updated",
			"tags",
			"category",
			"description",
			"excerpt",
		];

		// Format a date string into something human-readable if it looks like a date.
		function fmtDate(val) {
			const d = new Date(val);
			if (isNaN(d)) return esc(val);
			return d.toLocaleDateString("en", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		}

		// Split comma- or space-separated tag lists.
		function parseTags(val) {
			return val
				.split(/[,\s]+/)
				.map((t) => t.trim())
				.filter(Boolean);
		}

		let h = '<header class="post-meta">\n';

		if (meta.title) {
			h += `<h1 class="post-meta__title">${esc(meta.title)}</h1>\n`;
		}

		if (meta.subtitle) {
			h += `<p class="post-meta__subtitle">${esc(meta.subtitle)}</p>\n`;
		}

		if (meta.description || meta.excerpt) {
			h += `<p class="post-meta__description">${esc(meta.description || meta.excerpt)}</p>\n`;
		}

		// Author + date row
		const hasByline = meta.author || meta.date || meta.updated;
		if (hasByline) {
			h += '<div class="post-meta__byline">\n';
			if (meta.author) {
				h += `<span class="post-meta__author">${esc(meta.author)}</span>\n`;
			}
			if (meta.date) {
				h += `<time class="post-meta__date" datetime="${esc(meta.date)}">${fmtDate(meta.date)}</time>\n`;
			}
			if (meta.updated) {
				h += `<span class="post-meta__updated">Updated ${fmtDate(meta.updated)}</span>\n`;
			}
			h += "</div>\n";
		}

		// Tags / category
		if (meta.tags) {
			const tags = parseTags(meta.tags);
			if (tags.length) {
				h += '<ul class="post-meta__tags">\n';
				tags.forEach((t) => {
					h += `<li class="post-meta__tag">${esc(t)}</li>\n`;
				});
				h += "</ul>\n";
			}
		}

		if (meta.category) {
			h += `<span class="post-meta__category">${esc(meta.category)}</span>\n`;
		}

		// Any unrecognised keys as generic pills
		const extra = Object.keys(meta).filter((k) => !known.includes(k));
		if (extra.length) {
			h += '<dl class="post-meta__extra">\n';
			extra.forEach((k) => {
				h +=
					`<div class="post-meta__extra-item">` +
					`<dt>${esc(k)}</dt>` +
					`<dd>${esc(meta[k])}</dd>` +
					`</div>\n`;
			});
			h += "</dl>\n";
		}

		h += "</header>\n";
		return h;
	}

	// ── Public API ───────────────────────────────────────────────────────────────

	/**
	 * Parse a Markdown string into HTML.
	 *
	 * @param {string} markdown
	 * @param {object} [options]
	 * @param {boolean} [options.smart=true]       Smart punctuation (curly quotes, em-dashes, ellipses)
	 * @param {boolean} [options.headerIds=true]   Add id="slug" attributes to headings
	 * @param {boolean} [options.sanitize=false]   Strip raw HTML passthrough
	 * @param {Function} [options.highlight]       Syntax hook: fn(code, lang) => html
	 * @returns {{ html: string, metaHtml: string, meta: object }}
	 */
	function parse(markdown, options) {
		const opts = Object.assign(
			{ smart: true, headerIds: true, sanitize: false, highlight: null },
			options,
		);
		const text = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		const { body, meta } = frontMatter(text);
		const fns = {};
		let html = blocks(body.split("\n"), opts, fns);
		const fnHtml = renderFns(fns, opts);
		if (fnHtml) html += "\n" + fnHtml;
		const metaHtml = renderMeta(meta);
		return { html, metaHtml, meta };
	}

	return { parse };
});
