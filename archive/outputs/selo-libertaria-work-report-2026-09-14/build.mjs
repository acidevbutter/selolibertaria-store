import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const repo = "/Users/marcospereira/development/selolibertaria/selolibertaria-store";
const out = "/Users/marcospereira/development/selolibertaria/outputs/selo-libertaria-work-report-2026-09-14";
const since = "2026-06-01T00:00:00-03:00";
const until = "2026-09-15T00:00:00-03:00";
const author = "Marcos Pereira\\|DevButter\\|acidbutter96";
const git = (args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" });
const csv = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
const hours = (minutes) => Math.round((minutes / 60) * 10) / 10;

function difficulty(subject) {
  const s = subject.toLowerCase();
  if (/(asaas|checkout|payment|pagamento|oauth|webhook|coolify|docker|deploy|database|migration|seguran|auth)/.test(s)) return "Alta";
  if (/(feat|refactor|editorial|media|admin|design system|frete|shipping|cep|test)/.test(s)) return "Média";
  return "Baixa";
}
function technology(files) {
  const names = files.join(" ").toLowerCase();
  const result = [];
  if (/\.(tsx|ts)\b/.test(names)) result.push("TypeScript/Next.js");
  if (/dockerfile|\.dockerignore/.test(names)) result.push("Docker");
  if (/\.ya?ml\b|github\/workflows/.test(names)) result.push("CI/CD");
  if (/\.css\b/.test(names)) result.push("CSS/design system");
  if (/\.test\.(ts|tsx)\b/.test(names)) result.push("Testes");
  return result.join("; ");
}

const raw = git(["log", "--all", `--author=${author}`, `--since=${since}`, `--until=${until}`, "--date=iso-strict", "--pretty=format:%H%x1f%ad%x1f%s%x1e"]);
const commits = raw.split("\x1e").filter(Boolean).map((r) => {
  const [shaRaw, date, subject] = r.split("\x1f");
  const sha = shaRaw.trim();
  const files = git(["show", "--pretty=", "--name-only", sha]).split("\n").filter(Boolean);
  return { sha, date: new Date(date), subject, files, difficulty: difficulty(subject), technology: technology(files) };
});

const byDay = new Map();
for (const c of commits) {
  const day = c.date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  if (!byDay.has(day)) byDay.set(day, []);
  byDay.get(day).push(c);
}
const daily = [];
for (let cursor = new Date("2026-06-01T12:00:00-03:00"); cursor < new Date("2026-09-15T12:00:00-03:00"); cursor = new Date(cursor.getTime() + 86400000)) {
  const day = cursor.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const list = (byDay.get(day) ?? []).sort((a, b) => a.date - b.date);
  let sessions = 0;
  let estimatedMinutes = 0;
  let start = null;
  let last = null;
  for (const c of list) {
    if (!last || c.date - last.date > 90 * 60 * 1000) {
      if (start) estimatedMinutes += Math.max(30, (last.date - start.date) / 60000);
      sessions += 1;
      start = c;
    }
    last = c;
  }
  if (start) estimatedMinutes += Math.max(30, (last.date - start.date) / 60000);
  const tech = [...new Set(list.flatMap((x) => x.technology ? x.technology.split("; ") : []))].join("; ");
  const counts = ["Alta", "Média", "Baixa"].map((level) => list.filter((x) => x.difficulty === level).length);
  daily.push({ date: day, month: day.slice(0, 7), commits: list.length, sessions, estimated_hours: hours(estimatedMinutes), high: counts[0], medium: counts[1], low: counts[2], technologies: tech, screen_time_hours: "", screen_time_source: "Não disponível historicamente no macOS" });
}

const dailyCsv = [
  ["date", "month", "commits", "commit_sessions", "estimated_work_hours", "high_difficulty_commits", "medium_difficulty_commits", "low_difficulty_commits", "technologies_observed", "screen_time_hours", "screen_time_source"],
  ...daily.map((r) => [r.date, r.month, r.commits, r.sessions, r.estimated_hours, r.high, r.medium, r.low, r.technologies, r.screen_time_hours, r.screen_time_source]),
].map((row) => row.map(csv).join(",")).join("\n") + "\n";
await fs.writeFile(`${out}/selo_libertaria_daily_metrics.csv`, dailyCsv);

const monthKeys = [...new Set(daily.map((r) => r.month))];
const monthly = monthKeys.map((month) => {
  const rows = daily.filter((r) => r.month === month);
  const sum = (key) => rows.reduce((n, r) => n + Number(r[key]), 0);
  return { month, commits: sum("commits"), sessions: sum("sessions"), estimated_hours: sum("estimated_hours"), active_days: rows.filter((r) => r.commits > 0).length, high: sum("high"), medium: sum("medium"), low: sum("low") };
});

const wb = Workbook.create();
const dash = wb.worksheets.add("Resumo");
const monthlySheet = wb.worksheets.add("Mensal");
const dailySheet = wb.worksheets.add("Diário");
const source = wb.worksheets.add("Fonte");
for (const s of [dash, monthlySheet, dailySheet, source]) { s.showGridLines = false; s.tabColor = s === dash ? "#1F4E78" : "#7F9DB9"; }

const total = (key) => daily.reduce((n, r) => n + Number(r[key]), 0);
const activeDays = daily.filter((r) => r.commits > 0).length;
dash.getRange("A2:H2").merge();
dash.getRange("A2").values = [["Selo Libertária — atividade de desenvolvimento"]];
dash.getRange("A3:H3").merge();
dash.getRange("A3").values = [["01 jun a 14 set 2026 | commits do repositório local | horas são estimativas por sessões de commit"]];
dash.getRange("A5:D5").values = [["Commits", "Dias com atividade", "Sessões", "Horas estimadas"]];
dash.getRange("A6:D6").values = [[total("commits"), activeDays, total("sessions"), total("estimated_hours")]];
dash.getRange("A8:D8").values = [["Alta dificuldade", "Média dificuldade", "Baixa dificuldade", "Média h/dia ativo"]];
dash.getRange("A9:D9").values = [[total("high"), total("medium"), total("low"), activeDays ? total("estimated_hours") / activeDays : 0]];
dash.getRange("A11:H11").merge();
dash.getRange("A11").values = [["Tempo de Uso: a interface do macOS não disponibilizou exportação histórica; o relatório mantém este campo vazio para não atribuir tempo de tela sem evidência."]];

monthlySheet.getRange("A1:H1").values = [["Mês", "Commits", "Dias ativos", "Sessões", "Horas estimadas", "Alta", "Média", "Baixa"]];
monthlySheet.getRangeByIndexes(1, 0, monthly.length, 8).values = monthly.map((r) => [r.month, r.commits, r.active_days, r.sessions, r.estimated_hours, r.high, r.medium, r.low]);
dailySheet.getRange("A1:K1").values = [["Data", "Mês", "Commits", "Sessões", "Horas estimadas", "Alta", "Média", "Baixa", "Tecnologias", "Tempo de tela (h)", "Fonte do tempo de tela"]];
dailySheet.getRangeByIndexes(1, 0, daily.length, 11).values = daily.map((r) => [new Date(`${r.date}T12:00:00Z`), r.month, r.commits, r.sessions, r.estimated_hours, r.high, r.medium, r.low, r.technologies, r.screen_time_hours, r.screen_time_source]);
source.getRange("A1:D1").values = [["Fonte", "Escopo", "Coleta", "Limitação"]];
source.getRange("A2:D3").values = [
  ["Git local", "selolibertaria-store; autor Marcos Pereira/DevButter/acidbutter96", "Histórico local em 14 set 2026", "Não inclui PRs, issues ou repositórios ausentes deste checkout"],
  ["Tempo de Uso do macOS", "Todos os dispositivos; consulta atual", "Interface nativa em 14 set 2026", "Sem exportação histórica de junho a setembro acessível pela interface"],
];

const font = "Arial";
for (const sheet of [monthlySheet, dailySheet, source]) {
  const used = sheet.getUsedRange();
  used.format.font = { name: font, size: 10, color: "#1F2937" };
  sheet.getRangeByIndexes(0, 0, 1, used.columnCount).format = { fill: "#1F4E78", font: { name: font, size: 10, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center" };
  sheet.freezePanes.freezeRows(1);
}
dash.getRange("A2:H2").format = { font: { name: font, size: 16, bold: true, color: "#1F2937" }, verticalAlignment: "center" };
dash.getRange("A3:H3").format = { font: { name: font, size: 10, italic: true, color: "#4B5563" } };
for (const r of ["A5:D5", "A8:D8"]) dash.getRange(r).format = { fill: "#1F4E78", font: { name: font, size: 10, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center" };
for (const r of ["A6:D6", "A9:D9"]) dash.getRange(r).format = { fill: "#EAF1F8", font: { name: font, size: 14, bold: true, color: "#1F2937" }, horizontalAlignment: "center" };
dash.getRange("D6").format.numberFormat = "0.0";
dash.getRange("D9").format.numberFormat = "0.0";
dash.getRange("A11:H11").format = { font: { name: font, size: 10, italic: true, color: "#4B5563" }, wrapText: true };
monthlySheet.getRange(`E2:E${monthly.length + 1}`).format.numberFormat = "0.0";
dailySheet.getRange(`A2:A${daily.length + 1}`).format.numberFormat = "yyyy-mm-dd";
dailySheet.getRange(`E2:E${daily.length + 1}`).format.numberFormat = "0.0";

const monthlyChart = dash.charts.add("column", monthlySheet.getRange(`A1:B${monthly.length + 1}`));
monthlyChart.title = "Commits por mês";
monthlyChart.hasLegend = false;
monthlyChart.setPosition("F5", "N19");
monthlyChart.xAxis = { axisType: "textAxis", textStyle: { typeface: font, fontSize: 10 } };
monthlyChart.yAxis = { numberFormatCode: "0", numberFormatSourceLinked: false, textStyle: { typeface: font, fontSize: 10 } };
monthlyChart.series.items[0].fill = "#1F4E78";
const hoursChart = dash.charts.add("line", [monthlySheet.getRange(`A1:A${monthly.length + 1}`), monthlySheet.getRange(`E1:E${monthly.length + 1}`)]);
hoursChart.title = "Horas estimadas por mês";
hoursChart.hasLegend = false;
hoursChart.setPosition("F21", "N35");
hoursChart.xAxis = { axisType: "textAxis", textStyle: { typeface: font, fontSize: 10 } };
hoursChart.yAxis = { numberFormatCode: "0.0", numberFormatSourceLinked: false, textStyle: { typeface: font, fontSize: 10 } };
hoursChart.series.items[0].line = { fill: "#C9892B", style: "solid", width: 2 };
const difficultyChart = dash.charts.add("bar", [monthlySheet.getRange(`A1:A${monthly.length + 1}`), monthlySheet.getRange(`F1:F${monthly.length + 1}`), monthlySheet.getRange(`G1:G${monthly.length + 1}`), monthlySheet.getRange(`H1:H${monthly.length + 1}`)]);
difficultyChart.title = "Dificuldade por mês (commits)";
difficultyChart.setPosition("A14", "E30");
difficultyChart.legend = { position: "top", textStyle: { typeface: font, fontSize: 10 } };

for (const sheet of [dash, monthlySheet, dailySheet, source]) {
  const used = sheet.getUsedRange();
  used.format.autofitColumns();
  used.format.autofitRows();
}
dash.getRange("A:A").format.columnWidth = 18;
dash.getRange("B:D").format.columnWidth = 18;
dash.getRange("A11:H11").format.rowHeight = 32;
monthlySheet.getRange("A:H").format.columnWidth = 16;
dailySheet.getRange("A:A").format.columnWidth = 13;
dailySheet.getRange("B:H").format.columnWidth = 13;
dailySheet.getRange("I:I").format.columnWidth = 28;
dailySheet.getRange("J:K").format.columnWidth = 28;
source.getRange("A:A").format.columnWidth = 20;
source.getRange("B:D").format.columnWidth = 46;

wb.recalculate();
const check = await wb.inspect({ kind: "table", range: "Resumo!A2:H11", include: "values,formulas", tableMaxRows: 12, tableMaxCols: 8 });
console.log(check.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 50 }, summary: "final formula error scan" });
console.log(errors.ndjson);
const preview = await wb.render({ sheetName: "Resumo", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(`${out}/selo_libertaria_dashboard.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${out}/selo_libertaria_work_report.xlsx`);
