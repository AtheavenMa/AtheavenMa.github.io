"""Generate academic homepage data from CV.pdf before building the site."""

import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
HEADINGS = (
    "INTRODUCTION", "EDUCATION", "RESEARCH", "OPEN SOURCE", "SKILLS",
    "EXPERIENCE", "AWARDS", "PROFESSIONAL SERVICE", "TEACHING EXPERIENCE",
)
LABELS = re.compile(r"\[(paper|code|demo)\]")
VENUE = re.compile(r"^(.+?)\s+((?:19|20)\d{2})(?:\s+(.*))?$")
VENUE_DATE = re.compile(r"^(?:19|20)\d{2}(?:\s+.*)?$")
ROLE = re.compile(r"^(.*?)(?:,\s*UW–Madison)?:\s*(.+)$")
AWARD_END = re.compile(r"\b(?:19|20)\d{2}$")
SUPPLEMENTAL_PAPERS = {
    "Spatial Phenotyping Linking Single Cell Genomics to Disease Pathology through Joint Deep Representation Learning":
        "https://www.researchgate.net/publication/410657317_Spatial_phenotyping_linking_single_cell_genomics_to_disease_pathology_through_joint_deep_representation_learning_phenoSPA_phenotypic_SPatial_Association_of_single_cells_Data",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def normalize(text):
    return " ".join(text.split())


def sections(reader):
    source = "\n".join(page.extract_text(extraction_mode="layout") for page in reader.pages)
    parts = re.split(r"^(" + "|".join(HEADINGS) + r")[ \t]*$", source, flags=re.M)
    require(tuple(parts[1::2]) == HEADINGS, "CV sections are missing, duplicated, or out of order")
    return {key: [s for s in body.splitlines() if s.strip() and not s.lstrip().startswith("* ")]
            for key, body in zip(parts[1::2], parts[2::2])}


def annotated_links(reader):
    paper_links, project_links = [], {}
    for page in reader.pages:
        links = []
        for ref in page.get("/Annots", []):
            entry = ref.get_object()
            url = str((entry.get("/A") or {}).get("/URI", ""))
            parsed = urlsplit(url)
            if parsed.scheme in {"http", "https"} and parsed.hostname:
                links.append((tuple(map(float, entry["/Rect"])), url))

        def visit(text, cm, tm, *_):
            label = text.strip()
            if not label:
                return
            x = tm[4] * cm[0] + tm[5] * cm[2] + cm[4]
            y = tm[4] * cm[1] + tm[5] * cm[3] + cm[5]
            for (left, bottom, right, top), url in links:
                if left - 0.5 <= x < right and bottom <= y < top:
                    match = LABELS.fullmatch(label)
                    if match:
                        paper_links.append((match[1], url))
                    else:
                        project_links[label] = url
                    break

        page.extract_text(visitor_text=visit)
    return iter(paper_links), project_links


def grouped_lines(lines, starts):
    groups = []
    for line in lines:
        if starts(line):
            groups.append([])
        require(groups, f"Unexpected CV text before the first entry: {line.strip()}")
        groups[-1].append(line)
    require(groups, "CV section has no entries")
    return groups


def column(line):
    return re.split(r"\s{2,}", line.strip(), maxsplit=1)


def paper_blocks(lines):
    # The earlier template puts the full venue on the right. The newer one
    # puts the venue and date on separate lines on the left.
    def venue_at(index):
        if index >= len(lines):
            return False
        fields = column(lines[index])
        return len(fields) == 2 and bool(VENUE_DATE.fullmatch(fields[0]))

    starts = []
    for index, line in enumerate(lines):
        fields = column(line)
        if len(fields) == 2 and (VENUE.fullmatch(fields[1]) or venue_at(index + 1)):
            starts.append(index)
    require(starts and starts[0] == 0, "Cannot identify the first paper in a research section")
    for start, end in zip(starts, [*starts[1:], len(lines)]):
        left, right = column(lines[start])
        if venue_at(start + 1):
            date, continuation = column(lines[start + 1])
            yield right, f"{left} {date}", [continuation, *lines[start + 2:end]]
        else:
            yield left, right, lines[start + 1:end]


def publications_from(lines, links):
    groups, papers = [], []
    for group in grouped_lines(lines, lambda line: line == line.lstrip()):
        title, *entries = group
        category = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        items = []
        for first, venue, body in paper_blocks(entries):
            match = VENUE.fullmatch(venue)
            require(match, f"Cannot identify the venue for {first}")
            authors_at = next((i for i, line in enumerate(body) if "Haotian Ma" in line), -1)
            require(authors_at >= 0, f"Cannot identify the author line for {first}")
            paper_title = normalize(" ".join([first, *body[:authors_at]]))
            author_line = body[authors_at]
            labels = LABELS.findall(author_line)
            authors = normalize(LABELS.sub("", author_line))
            description = normalize(" ".join(body[authors_at + 1:]))
            require(authors and description, f"Incomplete paper entry: {paper_title}")
            paper = dict(title=html.escape(paper_title), authors=html.escape(authors),
                         venueFull=html.escape(venue), category=category, year=int(match[2]),
                         badge="submitted" if match[3] == "Submission" else match[1].lower(),
                         venueBadge=html.escape(venue), description=html.escape(description))
            for label in labels:
                linked = next(links, None)
                require(linked and linked[0] == label, f"Missing or mismatched {label} link for {paper_title}")
                paper[label] = html.escape(linked[1], quote=True)
            if "paper" not in paper and paper_title in SUPPLEMENTAL_PAPERS:
                paper["paper"] = SUPPLEMENTAL_PAPERS[paper_title]
            papers.append(paper)
            items.append(dict(title=paper["title"], aside=paper["venueFull"],
                              lines=[dict(text=paper["authors"], em=True)], points=[paper["description"]]))
        groups.append(dict(title=html.escape(title), category=category, items=items))
    require(next(links, None) is None, "Unmatched paper hyperlink in the CV")
    return groups, papers


def positions(lines):
    entries = []
    for block in grouped_lines(lines, lambda line: len(column(line)) == 2 and "," in column(line)[1]):
        title, location = column(block[0])
        require(len(block) >= 2 and len(column(block[1])) == 2, f"Missing date for {title}")
        role, date = column(block[1])
        remainder = [s.strip() for s in block[2:]]
        details = [s for s in remainder if s.startswith(("Advisor:", "Advisors:"))]
        role = normalize(" ".join([role, *(s for s in remainder if s not in details)]))
        entries.append(dict(title=html.escape(title), aside=html.escape(date),
                            lines=[dict(text=html.escape(s)) for s in (location, role)],
                            points=[html.escape(s) for s in details]))
    return entries


def labeled_entries(lines, links=None, *, list_items=False):
    entries = []
    for block in grouped_lines(lines, lambda line: ":" in line):
        label, body = normalize(" ".join(block)).split(":", 1)
        heading = html.escape(label)
        if links:
            name = label.removeprefix("Founder of ").removeprefix("Owner of ")
            if url := links.get(name):
                heading = heading.removesuffix(html.escape(name)) + (
                    f'<a href="{html.escape(url, quote=True)}">{html.escape(name)}</a>'
                )
        body = html.escape(body.strip())
        if list_items:
            entries.append(dict(title=heading, muted=body))
        else:
            entries.append(dict(html=f"<strong>{heading}:</strong> {body}"))
    return entries


def awards_from(lines):
    awards, pending = [], []
    for line in lines:
        pending.append(line)
        if AWARD_END.search(normalize(line)):
            awards.append(dict(html=html.escape(normalize(" ".join(pending)))))
            pending = []
    require(awards and not pending, "Could not read all CV awards")
    return awards


def main():
    pdf = ROOT / "CV.pdf"
    reader = PdfReader(pdf)
    data = sections(reader)
    paper_links, project_links = annotated_links(reader)
    research, papers = publications_from(data["RESEARCH"], paper_links)
    version = hashlib.sha256(pdf.read_bytes()).hexdigest()[:12]
    fields = dict(
        cvUrl=f"/CV.pdf?v={version}", education=positions(data["EDUCATION"]),
        researchExperience=research, publications=papers,
        openSource=labeled_entries(data["OPEN SOURCE"], project_links),
        skills=labeled_entries(data["SKILLS"]), workExperience=positions(data["EXPERIENCE"]),
        awards=awards_from(data["AWARDS"]), service=labeled_entries(data["PROFESSIONAL SERVICE"], list_items=True),
        teaching=labeled_entries(data["TEACHING EXPERIENCE"], list_items=True),
    )
    out = ROOT / "assets/landing/js/cv-data.js"
    out.write_text("// Generated from CV.pdf by bin/sync_cv.py.\n" + "".join(
        f"const {key} = {json.dumps(value, indent=2, ensure_ascii=False)};\n"
        for key, value in fields.items()
    ), encoding="utf-8")
    print(f"Generated {len(papers)} papers and {len(research)} research directions from CV.pdf ({version})")


if __name__ == "__main__":
    main()
