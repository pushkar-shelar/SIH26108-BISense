import { useState } from "react";
import PageContainer from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { Mono, Body, Meta } from "../../components/ui/Typography";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/Loading";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTenderDiff } from "../../hooks/useTenderDiff";
import { useI18n } from "../../i18n/index";
import type { TenderDiffChange } from "../../types/api";

function getSeverityVariant(severity: string): "danger" | "warning" | "neutral" | "success" {
  const s = (severity || "").toUpperCase();
  if (s === "HIGH" || s === "CRITICAL") return "danger";
  if (s === "MEDIUM") return "warning";
  if (s === "LOW") return "neutral";
  return "neutral";
}

interface LineChange {
  type: "added" | "removed" | "unchanged" | "modified";
  content: string;
  lineNum?: number;
}

function generateLineDiff(original: string, recommended: string): LineChange[] {
  const origLines = original.split("\n");
  const recLines = recommended.split("\n");
  const result: LineChange[] = [];
  const maxLen = Math.max(origLines.length, recLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const r = recLines[i];
    if (o === undefined) {
      result.push({ type: "added", content: r });
    } else if (r === undefined) {
      result.push({ type: "removed", content: o });
    } else if (o === r) {
      result.push({ type: "unchanged", content: o });
    } else {
      result.push({ type: "removed", content: o });
      result.push({ type: "added", content: r });
    }
  }
  return result;
}

function DiffLine({ line }: { line: LineChange }) {
  if (line.type === "added") {
    return (
      <div className="flex gap-3 bg-success/8 border-l-2 border-success px-3 py-0.5">
        <Mono className="text-[11px] text-success select-none w-4">+</Mono>
        <Mono className="text-[11px] text-success whitespace-pre-wrap break-all">{line.content}</Mono>
      </div>
    );
  }
  if (line.type === "removed") {
    return (
      <div className="flex gap-3 bg-error/8 border-l-2 border-error px-3 py-0.5">
        <Mono className="text-[11px] text-error select-none w-4">−</Mono>
        <Mono className="text-[11px] text-error line-through opacity-70 whitespace-pre-wrap break-all">{line.content}</Mono>
      </div>
    );
  }
  return (
    <div className="flex gap-3 px-3 py-0.5">
      <Mono className="text-[11px] text-text-muted select-none w-4"> </Mono>
      <Mono className="text-[11px] text-text-secondary whitespace-pre-wrap break-all">{line.content}</Mono>
    </div>
  );
}

function ChangeCard({ change }: { change: TenderDiffChange }) {
  const [expanded, setExpanded] = useState(false);
  const hasContext = change.original_text || change.recommended_text;
  return (
    <div className="border border-border bg-surface rounded-sm">
      <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getSeverityVariant(change.severity)}>{change.severity || "MEDIUM"}</Badge>
            <Badge variant="neutral">{change.change_type?.replace(/_/g, " ") || "CHANGE"}</Badge>
            {change.clause && <Mono className="text-xs text-text-muted">CLAUSE {change.clause}</Mono>}
          </div>
          <Body className="text-sm font-medium text-text-primary">{change.description || change.message || "Change detected"}</Body>
          {change.recommended_action && <Body className="text-xs text-text-secondary">→ {change.recommended_action}</Body>}
        </div>
        {hasContext && (
          <button onClick={() => setExpanded(e => !e)} className="mono text-xs px-3 py-1 border border-border rounded-sm text-text-muted hover:border-text-muted transition-colors flex-shrink-0">
            {expanded ? "HIDE DIFF" : "SHOW DIFF"}
          </button>
        )}
      </div>
      {expanded && hasContext && (
        <div className="border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div>
              <div className="px-4 py-2 bg-error/5 border-b border-border"><Meta className="text-error text-xs">ORIGINAL</Meta></div>
              <div className="font-mono">
                {(change.original_text || "").split("\n").map((line, i) => (
                  <div key={i} className="px-4 py-0.5 bg-error/5 border-l-2 border-error">
                    <Mono className="text-[11px] text-error line-through opacity-70">{line}</Mono>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="px-4 py-2 bg-success/5 border-b border-border"><Meta className="text-success text-xs">RECOMMENDED</Meta></div>
              <div className="font-mono">
                {(change.recommended_text || "").split("\n").map((line, i) => (
                  <div key={i} className="px-4 py-0.5 bg-success/5 border-l-2 border-success">
                    <Mono className="text-[11px] text-success">{line}</Mono>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenderDiffPage() {
  const { t } = useI18n();
  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");
  const [showAutoFixPreview, setShowAutoFixPreview] = useState(false);
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);

  const { mutate: runDiff, data: diffResult, isPending: isRunning, error } = useTenderDiff();

  const handleRunDiff = () => {
    if (!versionA.trim() || !versionB.trim()) return;
    runDiff({ version_a_text: versionA, version_b_text: versionB });
    setShowAutoFixPreview(false);
    setAcceptedVersion(null);
  };

  const autoFixText = diffResult?.corrected_version_b || versionB;
  const lineDiff = versionA && autoFixText ? generateLineDiff(versionA, autoFixText) : [];
  const changeCount = diffResult?.changes?.length || 0;
  const criticalCount = diffResult?.changes?.filter(c => (c.severity || "").toUpperCase() === "CRITICAL" || (c.severity || "").toUpperCase() === "HIGH").length || 0;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="TENDER DIFF"
        title="TENDER CLAUSE DIFF + AUTO-FIX"
        description="Compare two versions of a tender specification against BIS standards. Apply 1-click recommended standard corrections."
      />

      <div className="flex flex-col gap-12 pb-24 mt-8">

        {/* INPUT */}
        <section className="flex flex-col gap-6">
          <SectionHeader number="01" title="INPUT TENDER SPECIFICATIONS" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Meta className="text-xs">{t("tender.original")} (VERSION A)</Meta>
              <Textarea
                label=""
                placeholder="Paste or type the original tender specification text..."
                value={versionA}
                onChange={e => setVersionA(e.target.value)}
                rows={10}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Meta className="text-xs">{t("tender.recommended")} (VERSION B / CURRENT DRAFT)</Meta>
              <Textarea
                label=""
                placeholder="Paste or type the revised or current draft specification..."
                value={versionB}
                onChange={e => setVersionB(e.target.value)}
                rows={10}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleRunDiff} disabled={isRunning || !versionA.trim() || !versionB.trim()}>
              {isRunning ? "RUNNING DIFF ENGINE..." : "RUN STANDARD DIFF ANALYSIS"}
            </Button>
            {diffResult && (
              <Button
                variant="secondary"
                onClick={() => { setShowAutoFixPreview(true); }}
              >
                {t("btn.applyCorrections")}
              </Button>
            )}
          </div>
          {error && <ErrorState title={t("state.error")} description="Failed to run tender diff analysis." />}
        </section>

        {/* LOADING */}
        {isRunning && <div className="flex justify-center"><LoadingState message="Analysing tender specification against BIS standards..." /></div>}

        {/* RESULTS */}
        {diffResult && (
          <>
            {/* SUMMARY */}
            <section className="flex flex-col gap-4">
              <SectionHeader number="02" title="ANALYSIS SUMMARY" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-border p-6 bg-surface rounded-sm">
                <div className="flex flex-col gap-1"><Meta>TOTAL CHANGES</Meta><Mono className="text-2xl font-bold text-text-primary">{changeCount.toString().padStart(2, "0")}</Mono></div>
                <div className="flex flex-col gap-1"><Meta>CRITICAL / HIGH</Meta><Mono className={`text-2xl font-bold ${criticalCount > 0 ? "text-error" : "text-success"}`}>{criticalCount.toString().padStart(2, "0")}</Mono></div>
                <div className="flex flex-col gap-1"><Meta>COMPLIANCE SCORE</Meta><Mono className="text-2xl font-bold text-text-primary">{diffResult.compliance_score ? `${(diffResult.compliance_score * 100).toFixed(0)}%` : "N/A"}</Mono></div>
                <div className="flex flex-col gap-1"><Meta>STATUS</Meta><Badge variant={diffResult.status === "COMPLIANT" ? "success" : "warning"}>{diffResult.status || "REVIEW"}</Badge></div>
              </div>
            </section>

            {/* CHANGE LIST */}
            {diffResult.changes && diffResult.changes.length > 0 ? (
              <section className="flex flex-col gap-4">
                <SectionHeader number="03" title={`CHANGE DETAILS (${changeCount})`} />
                <div className="flex flex-col gap-3">
                  {diffResult.changes.map((change, i) => (
                    <ChangeCard key={i} change={change} />
                  ))}
                </div>
              </section>
            ) : (
              <EmptyState title={t("state.noFindings")} description="No specific changes identified in the analysis." />
            )}

            {/* AUTO-FIX PREVIEW */}
            {showAutoFixPreview && (
              <section className="flex flex-col gap-4">
                <SectionHeader number="04" title={t("tender.preview")} />

                {acceptedVersion ? (
                  <div className="p-6 border border-success/40 bg-success/5 rounded-sm">
                    <Meta className="text-success mb-2">CORRECTED VERSION ACCEPTED</Meta>
                    <Body className="text-sm font-medium text-text-secondary mb-4">The corrected specification has been applied. Copy the text below.</Body>
                    <div className="font-mono bg-surface border border-border p-4 rounded-sm text-sm text-text-primary whitespace-pre-wrap">{acceptedVersion}</div>
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(acceptedVersion); }}>COPY TO CLIPBOARD</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAcceptedVersion(null)}>RESET</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border border-border bg-surface rounded-sm mb-2">
                      <Meta className="mb-3 text-text-muted">SIDE-BY-SIDE DIFF — ORIGINAL vs CORRECTED</Meta>
                      <div className="font-mono text-[11px] max-h-96 overflow-y-auto flex flex-col gap-0 border border-border rounded-sm">
                        {lineDiff.map((line, i) => <DiffLine key={i} line={line} />)}
                      </div>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <Button onClick={() => setAcceptedVersion(autoFixText)}>
                        {t("tender.accept")}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAutoFixPreview(false)}>CANCEL</Button>
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}

        {/* EMPTY */}
        {!diffResult && !isRunning && (
          <EmptyState
            title={t("state.noData")}
            description="Enter both specification versions above and click &quot;Run Standard Diff Analysis&quot; to compare them against BIS standards."
          />
        )}
      </div>
    </PageContainer>
  );
}
