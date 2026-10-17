// Snapshot the public Hermes contribution record into the build.
// Every Hermes number on the site comes from this file.
import { writeFile } from "node:fs/promises";

const url = "https://mohamadkanso.github.io/hermes-contributions/data/contributions.json";
const d = await (await fetch(url)).json();
const out = {
  source: "https://mohamadkanso.github.io/hermes-contributions/",
  checkedAt: d.checkedAt,
  metrics: {
    landed: d.metrics.landed,
    authoredMain: d.metrics.authoredMain,
    coauthoredMain: d.metrics.coauthoredMain,
    prs: d.metrics.prs,
    directMerges: d.metrics.directMerges,
  },
  paths: d.integrations
    .map((i) => ({
      original: i.original,
      via: i.via,
      kind: i.kind,
      direct: i.direct,
      title: i.title,
      date: i.date.slice(0, 10),
      url: i.url,
      originalUrl: `https://github.com/NousResearch/hermes-agent/pull/${i.original}`,
    }))
    .sort((a, b) => a.date.localeCompare(b.date)),
};
if (out.paths.length !== out.metrics.landed) throw new Error("path count mismatch");
await writeFile("src/data/hermes.json", JSON.stringify(out, null, 2) + "\n");
console.log(out.metrics, out.paths.length, "paths");
