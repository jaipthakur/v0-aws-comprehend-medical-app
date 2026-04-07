import type { Entity } from "@aws-sdk/client-comprehendmedical";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import JSZip from "jszip";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

type CharOrigin =
  | { kind: "wt"; el: Element; offsetInNode: number }
  | { kind: "literal" };

function isW(el: Element, local: string): boolean {
  return el.localName === local && el.namespaceURI === W_NS;
}

function childElements(parent: Element): Element[] {
  const out: Element[] = [];
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1) out.push(c as Element);
  }
  return out;
}

function isDeletedParagraph(p: Element): boolean {
  const pPr = childElements(p).find((e) => isW(e, "pPr"));
  if (!pPr) return false;
  const rPr = childElements(pPr).find((e) => isW(e, "rPr"));
  if (!rPr) return false;
  return childElements(rPr).some((e) => isW(e, "del"));
}

function isDeletedTableRow(tr: Element): boolean {
  const trPr = childElements(tr).find((e) => isW(e, "trPr"));
  if (!trPr) return false;
  return childElements(trPr).some((e) => isW(e, "del"));
}

function getWtString(wt: Element): string {
  return wt.textContent ?? "";
}

function setWtString(wt: Element, value: string): void {
  const doc = wt.ownerDocument;
  if (!doc) return;
  while (wt.firstChild) wt.removeChild(wt.firstChild);
  if (value.length > 0) wt.appendChild(doc.createTextNode(value));
  if (/^\s|\s$/.test(value)) {
    wt.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
  } else {
    wt.removeAttribute("xml:space");
  }
}

class TextBuilder {
  text = "";
  origins: CharOrigin[] = [];

  appendLiteral(s: string): void {
    for (let i = 0; i < s.length; i++) {
      this.origins.push({ kind: "literal" });
    }
    this.text += s;
  }

  appendFromWt(wt: Element): void {
    const s = getWtString(wt);
    for (let i = 0; i < s.length; i++) {
      this.origins.push({ kind: "wt", el: wt, offsetInNode: i });
    }
    this.text += s;
  }

  appendChars(s: string, asLiteral = true): void {
    if (asLiteral) this.appendLiteral(s);
  }
}

function visitRunChildren(r: Element, b: TextBuilder): void {
  for (const el of childElements(r)) {
    if (isW(el, "t")) {
      b.appendFromWt(el);
    } else if (isW(el, "tab")) {
      b.appendLiteral("\t");
    } else if (isW(el, "noBreakHyphen")) {
      b.appendLiteral("\u2011");
    } else if (isW(el, "softHyphen")) {
      b.appendLiteral("\u00AD");
    } else if (isW(el, "br")) {
      /* mammoth line/page break → empty in raw text */
    } else if (isW(el, "drawing") || isW(el, "pict") || isW(el, "object")) {
      /* images / objects → empty */
    } else if (isW(el, "footnoteReference") || isW(el, "endnoteReference")) {
      /* empty in extractRawText */
    } else if (isW(el, "sym")) {
      /* optional: dingbat; mammoth may map — skip for empty contribution */
    }
  }
}

function visitRun(r: Element, b: TextBuilder): void {
  visitRunChildren(r, b);
}

function visitParagraphInner(elements: Element[], b: TextBuilder): void {
  for (const el of elements) {
    if (isW(el, "r")) {
      visitRun(el, b);
    } else if (isW(el, "hyperlink")) {
      visitParagraphInner(childElements(el), b);
    } else if (isW(el, "sdt")) {
      const content = childElements(el).find((e) => isW(e, "sdtContent"));
      if (content) visitParagraphInner(childElements(content), b);
    } else if (isW(el, "ins") || isW(el, "smartTag")) {
      visitParagraphInner(childElements(el), b);
    } else if (isW(el, "fldSimple")) {
      visitParagraphInner(childElements(el), b);
    }
    /* fldChar / instrText: complex fields — mammoth may emit content; ignored here */
  }
}

function visitParagraph(p: Element, b: TextBuilder): void {
  visitParagraphInner(childElements(p), b);
}

function visitTable(tbl: Element, b: TextBuilder): void {
  for (const tr of childElements(tbl)) {
    if (!isW(tr, "tr")) continue;
    if (isDeletedTableRow(tr)) continue;
    for (const tc of childElements(tr)) {
      if (!isW(tc, "tc")) continue;
      visitBlockLevelContent(childElements(tc), b);
    }
  }
}

function visitBlockLevelContent(elements: Element[], b: TextBuilder): void {
  for (const el of elements) {
    if (isW(el, "p")) {
      if (!isDeletedParagraph(el)) {
        visitParagraph(el, b);
      }
      b.appendLiteral("\n\n");
    } else if (isW(el, "tbl")) {
      visitTable(el, b);
    }
  }
}

function buildTextAndOriginsFromBody(body: Element): { text: string; origins: CharOrigin[] } {
  const b = new TextBuilder();
  visitBlockLevelContent(childElements(body), b);
  return { text: b.text, origins: b.origins };
}

function collectWtSpans(
  origins: CharOrigin[],
  start: number,
  end: number
): { el: Element; start: number; end: number }[] {
  const spans: { el: Element; start: number; end: number }[] = [];
  let i = start;
  while (i < end) {
    const o = origins[i];
    if (!o || o.kind !== "wt") {
      i++;
      continue;
    }
    const el = o.el;
    const startOff = o.offsetInNode;
    let j = i;
    let endOff = startOff;
    while (j < end) {
      const oj = origins[j];
      if (!oj || oj.kind !== "wt" || oj.el !== el) break;
      endOff = oj.offsetInNode + 1;
      j++;
    }
    spans.push({ el, start: startOff, end: endOff });
    i = j;
  }
  return spans;
}

function applyWtSpanRedaction(
  spans: { el: Element; start: number; end: number }[],
  label: string
): void {
  if (spans.length === 0) return;
  const first = spans[0];
  const last = spans[spans.length - 1];
  const tFirst = getWtString(first.el);
  if (first.el === last.el) {
    setWtString(
      first.el,
      tFirst.slice(0, first.start) + label + tFirst.slice(last.end)
    );
    return;
  }
  setWtString(first.el, tFirst.slice(0, first.start) + label);
  for (let k = 1; k < spans.length - 1; k++) {
    setWtString(spans[k].el, "");
  }
  const tLast = getWtString(last.el);
  setWtString(last.el, tLast.slice(0, last.start) + tLast.slice(last.end));
}

function applyEntitiesInPlace(origins: CharOrigin[], entities: Entity[]): void {
  const valid = entities.filter(
    (e) =>
      typeof e.BeginOffset === "number" &&
      typeof e.EndOffset === "number" &&
      e.BeginOffset >= 0 &&
      e.EndOffset <= origins.length &&
      e.EndOffset > e.BeginOffset
  );
  const sorted = [...valid].sort((a, b) => b.BeginOffset! - a.BeginOffset!);
  for (const e of sorted) {
    const start = e.BeginOffset!;
    const end = e.EndOffset!;
    const label = `[${e.Type || "PHI"}]`;
    const spans = collectWtSpans(origins, start, end);
    applyWtSpanRedaction(spans, label);
  }
}

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n");
}

/**
 * If the walker’s plain text matches Mammoth’s extractRawText (same string
 * Comprehend saw), apply PHI spans to w:t nodes and return a new .docx buffer.
 */
export async function tryRedactDocxPreservingFormatting(
  docxBuffer: Buffer,
  entities: Entity[],
  mammothPlainText: string
): Promise<{ ok: true; buffer: Buffer } | { ok: false; reason: string }> {
  const zip = await JSZip.loadAsync(docxBuffer);
  const entry = zip.file("word/document.xml");
  if (!entry) {
    return { ok: false, reason: "Missing word/document.xml" };
  }
  const xml = await entry.async("string");
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(xml, "application/xml");
  const body = domDoc.getElementsByTagNameNS(W_NS, "body").item(0);
  if (!body) {
    return { ok: false, reason: "Could not find w:body" };
  }

  const { text, origins } = buildTextAndOriginsFromBody(body);
  const a = normalizeNewlines(text);
  const b = normalizeNewlines(mammothPlainText);
  if (a !== b) {
    return {
      ok: false,
      reason:
        "Document structure is not fully supported for in-place redaction (extracted XML text did not match Mammoth). Use the plain .docx download or simplify the document.",
    };
  }

  applyEntitiesInPlace(origins, entities);

  const serializer = new XMLSerializer();
  const newXml = serializer.serializeToString(domDoc);
  zip.file("word/document.xml", newXml);
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return { ok: true, buffer: Buffer.from(out) };
}
