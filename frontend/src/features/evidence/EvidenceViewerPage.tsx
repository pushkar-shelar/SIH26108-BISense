import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SplitPane } from "../../components/layout/SplitPane";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Mono, Body, Meta } from "../../components/ui/Typography";
import { VerificationStatus, ConfidenceIndicator } from "../../components/product/Evidence";
import { LoadingState } from "../../components/ui/Loading";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useGetSession } from "../../hooks/useProcurement";
import { useI18n } from "../../i18n/index";

// Normalize an evidence record from the session payload
interface EvidenceRecord {
  id: string;
  standardId: string;
  clause: string;
  page: string | number;
  evidenceType: string;
  verificationStatus: string;
  confidence: string;
  excerpt: string;
  requirement?: string;
}

function normalizeEvidence(ev: Record<string, any>, idx: number): EvidenceRecord {
  return {
    id: ev.id || ev.evidence_id || `ev-${idx}`,
    standardId: ev.standard_id || ev.standardId || ev.source || "UNKNOWN",
    clause: ev.clause || ev.source_clause || "-",
    page: ev.page || ev.source_location || "-",
    evidenceType: (ev.type || ev.evidenceType || ev.evidence_type || "EVIDENCE").toUpperCase(),
    verificationStatus: (ev.verification_status || ev.verificationStatus || "UNVERIFIED").toUpperCase(),
    confidence: (ev.confidence || ev.confidence_level || "MEDIUM").toString().toUpperCase(),
    excerpt: ev.text || ev.excerpt || ev.passage || "No excerpt available.",
    requirement: ev.requirement || ev.query_text || undefined,
  };
}

export default function EvidenceViewerPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: sessionData, isLoading, error } = useGetSession(sessionId || null);

  const rawEvidence: Record<string, any>[] = sessionData?.evidence || [];
  const evidence: EvidenceRecord[] = rawEvidence.map(normalizeEvidence);

  const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const handleNext = () => setSelectedIndex(i => Math.min(evidence.length - 1, i + 1));

  if (isLoading && sessionId) return <LoadingState message={t("state.loading")} />;
  if (error && sessionId) return <PageContainer><ErrorState title={t("state.error")} description="Could not load the procurement session." /></PageContainer>;

  const selectedEvidence = evidence[selectedIndex];

  return (
    <PageContainer>
      <div className="mb-6">
        <Button variant="ghost" className="px-0 text-text-muted hover:text-text-primary uppercase text-xs tracking-wider" onClick={() => navigate(sessionId ? `/review?session_id=${sessionId}` : "/review")}>
          ← {t("page.review")} / {t("page.evidence")}
        </Button>
      </div>

      <PageHeader
        eyebrow="EVIDENCE"
        title="EVIDENCE VIEWER"
        description="Inspect source passages supporting standards, requirements and recommendation decisions."
      />

      {!sessionId ? (
        <EmptyState title={t("state.noSession")} description="Add ?session_id=... to the URL to load evidence from a procurement session." />
      ) : evidence.length === 0 ? (
        <EmptyState title={t("state.noEvidence")} description="No evidence records found in the active procurement session." />
      ) : (
        <SplitPane
          primary={
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center bg-surface p-2 border border-border rounded-sm">
                <Button variant="ghost" size="sm" onClick={handlePrev} disabled={selectedIndex === 0}>← PREVIOUS</Button>
                <Mono className="text-sm">EVIDENCE {selectedIndex + 1} OF {evidence.length}</Mono>
                <Button variant="ghost" size="sm" onClick={handleNext} disabled={selectedIndex === evidence.length - 1}>NEXT →</Button>
              </div>

              <div className="flex flex-col gap-4">
                {evidence.map((ev, idx) => (
                  <div
                    key={ev.id}
                    className={`p-4 border rounded-sm cursor-pointer transition-colors ${idx === selectedIndex ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-surface-elevated"}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Mono className="text-sm font-bold text-text-primary">{ev.standardId}</Mono>
                      <Badge variant={ev.verificationStatus === "VERIFIED" ? "success" : ev.verificationStatus === "REVIEW" ? "warning" : ev.verificationStatus === "REJECTED" ? "danger" : "neutral"}>
                        {ev.verificationStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      {ev.clause !== "-" && <Mono>CLAUSE {ev.clause}</Mono>}
                      {ev.page !== "-" && <Mono>PAGE {ev.page}</Mono>}
                      <Badge variant="neutral" className="py-0">{ev.evidenceType.replace("_", " ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }
          secondary={
            selectedEvidence ? (
              <div className="flex flex-col gap-8 sticky top-8">
                <div className="border border-border bg-surface flex flex-col p-6 rounded-sm min-h-[200px] gap-4">
                  <div className="bg-background border border-border px-2 py-1 self-start">
                    <Mono className="text-xs">SOURCE: {selectedEvidence.standardId} | {selectedEvidence.page !== "-" ? `PAGE ${selectedEvidence.page}` : "NO PAGE"}</Mono>
                  </div>
                  <div className="flex-1 p-4 border-l-2 border-accent bg-surface-elevated rounded-r-sm">
                    <Body className="text-sm italic">{selectedEvidence.excerpt}</Body>
                  </div>
                </div>

                <div className="flex flex-col gap-6 p-6 border border-border bg-surface rounded-sm">
                  <SectionHeader number="01" title="SOURCE" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Meta>STANDARD</Meta><Mono className="text-sm font-bold text-text-primary">{selectedEvidence.standardId}</Mono></div>
                    <div className="flex flex-col gap-1"><Meta>CLAUSE</Meta><Mono className="text-sm">{selectedEvidence.clause}</Mono></div>
                    {selectedEvidence.page !== "-" && <div className="flex flex-col gap-1"><Meta>PAGE</Meta><Mono className="text-sm">{selectedEvidence.page}</Mono></div>}
                    <div className="flex flex-col gap-1"><Meta>TYPE</Meta><Mono className="text-sm">{selectedEvidence.evidenceType.replace("_", " ")}</Mono></div>
                  </div>

                  <div className="mt-4 border-t border-border pt-6">
                    <SectionHeader number="02" title="VERIFICATION" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1"><Meta>STATUS</Meta><VerificationStatus status={selectedEvidence.verificationStatus as any} /></div>
                    <div className="flex flex-col gap-1">
                      <Meta>CONFIDENCE</Meta>
                      <ConfidenceIndicator
                        level={selectedEvidence.confidence as any}
                        score={selectedEvidence.confidence === "HIGH" ? 0.92 : selectedEvidence.confidence === "MEDIUM" ? 0.72 : 0.45}
                      />
                    </div>
                  </div>

                  {selectedEvidence.requirement && (
                    <>
                      <div className="mt-4 border-t border-border pt-6"><SectionHeader number="03" title="REQUIREMENT CONTEXT" /></div>
                      <div className="flex flex-col gap-1"><Meta>ASSOCIATED REQUIREMENT</Meta><Body className="text-sm text-text-secondary">{selectedEvidence.requirement}</Body></div>
                    </>
                  )}
                </div>
              </div>
            ) : null
          }
        />
      )}
    </PageContainer>
  );
}
