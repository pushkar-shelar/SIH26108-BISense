import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { SectionHeader } from "../../components/layout/SectionHeader";
import { Metric } from "../../components/ui/Metric";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Dialog } from "../../components/ui/Dialog";
import { Textarea } from "../../components/ui/Textarea";
import { Mono, Body, Meta } from "../../components/ui/Typography";
import { VerificationStatus as EvidenceVerificationStatus } from "../../components/product/Evidence";
import { mockChecklist } from "./review.data";
import { useVerifyClause } from "../../hooks/useVerification";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/Loading";
import { EmptyState } from "../../components/ui/EmptyState";
import { useGetSession } from "../../hooks/useProcurement";
import { useI18n } from "../../i18n/index";
import type { TenderHealthFinding } from "../../types/api";

type VerificationState = "VERIFIED" | "REJECTED" | "NEEDS REVIEW" | "UNVERIFIED";

interface ReviewItemLocal {
  id: string;
  clause: string;
  message: string;
  severity: string;
  category: string;
  suggested_action: string;
  status: VerificationState;
}

export default function ReviewVerifyPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  const { data: sessionData, isLoading, error } = useGetSession(sessionId || null);

  const rawFindings: TenderHealthFinding[] = sessionData?.tender_findings || [];

  const [queue, setQueue] = useState<ReviewItemLocal[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewItemLocal | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<Set<string>>(new Set(["c1", "c2", "c3"]));

  const { mutate: verifyClause, isPending: isVerifying, data: verificationResult, error: verifyError } = useVerifyClause();

  if (!initialized && rawFindings.length > 0) {
    const items: ReviewItemLocal[] = rawFindings.map((f, idx) => ({
      id: `finding-${idx}`,
      clause: f.clause,
      message: f.message,
      severity: f.severity,
      category: f.category,
      suggested_action: f.suggested_action,
      status: "UNVERIFIED" as VerificationState,
    }));
    setQueue(items);
    setInitialized(true);
  }

  const handleStatusChange = (id: string, newStatus: VerificationState) => {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: newStatus } : item));
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleVerifyBackend = () => {
    if (!selectedItem) return;
    const clause = notes[selectedItem.id] || selectedItem.clause || "No clause provided.";
    verifyClause(
      { tender_clause: clause, evidence_pack: { evidence: [] } },
      {
        onSuccess: (data) => {
          handleStatusChange(selectedItem.id, data.verification_status === "VERIFIED" ? "VERIFIED" : "REJECTED");
        }
      }
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const toggleChecklist = (id: string) => {
    const newSet = new Set(checklist);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setChecklist(newSet);
  };

  const statusCounts = queue.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading && sessionId) return <LoadingState message={t("state.loading")} />;
  if (error && sessionId) return <PageContainer><ErrorState title={t("state.error")} description="Could not load the procurement session." /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="REVIEW & VERIFY"
        title="EVIDENCE-BACKED STANDARD REVIEW"
        description="Verify recommended standards, supporting evidence, versions, applicability and certification requirements."
      />
      <div className="flex gap-4 items-center mb-12 flex-wrap">
        <Meta>SESSION</Meta>
        <Body className="text-sm font-medium">{sessionData?.title || (sessionId ? sessionId : "No session selected")}</Body>
        <span className="text-border">|</span>
        <Meta>FINDINGS</Meta>
        <Mono className="text-sm">{queue.length.toString().padStart(2, "0")}</Mono>
      </div>

      <div className="flex flex-col gap-12 pb-24">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-border p-6 bg-surface rounded-sm">
          <Metric value={queue.length.toString().padStart(2, "0")} label="TOTAL FINDINGS" />
          <Metric value={(statusCounts["VERIFIED"] || 0).toString().padStart(2, "0")} label="VERIFIED" />
          <Metric value={(statusCounts["NEEDS REVIEW"] || 0).toString().padStart(2, "0")} label="NEEDS REVIEW" />
          <Metric value={(statusCounts["REJECTED"] || 0).toString().padStart(2, "0")} label="REJECTED" />
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader number="01" title="TENDER FINDINGS" />
          {queue.length === 0 ? (
            <EmptyState
              title={sessionId ? t("state.noFindings") : t("state.noSession")}
              description={sessionId ? "No tender findings found in the active session." : "Provide a session_id parameter to load findings."}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {queue.map(item => (
                <div key={item.id} className="flex flex-col gap-3 p-6 border border-border bg-surface rounded-sm hover:border-text-muted transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={item.severity === "CRITICAL" ? "danger" : item.severity === "HIGH" ? "warning" : "neutral"}>{item.severity}</Badge>
                        <Badge variant="neutral">{item.category}</Badge>
                        <Mono className="text-xs text-text-muted">CLAUSE: {item.clause}</Mono>
                      </div>
                      <Body className="text-sm font-medium text-text-primary mt-1">{item.message}</Body>
                      {item.suggested_action && <Body className="text-xs text-text-secondary">→ {item.suggested_action}</Body>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={item.status === "VERIFIED" ? "success" : item.status === "REJECTED" ? "danger" : item.status === "UNVERIFIED" ? "neutral" : "warning"}>{item.status}</Badge>
                      <Button className="uppercase" size="sm" onClick={() => setSelectedItem(item)}>REVIEW</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <section className="flex flex-col gap-6">
            <SectionHeader number="02" title="VERIFICATION CHECKLIST" />
            <div className="flex flex-col border border-border bg-surface rounded-sm">
              {mockChecklist.map(check => (
                <label key={check.id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 cursor-pointer hover:bg-surface-elevated transition-colors">
                  <input type="checkbox" checked={checklist.has(check.id)} onChange={() => toggleChecklist(check.id)} className="w-4 h-4 rounded-sm border-border bg-background checked:bg-text-primary focus:ring-0 cursor-pointer" />
                  <Mono className={`text-sm ${checklist.has(check.id) ? "text-text-primary" : "text-text-muted"}`}>
                    [{checklist.has(check.id) ? "✓" : " "}] {check.label}
                  </Mono>
                </label>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 p-6 border-l-2 border-warning bg-surface rounded-r-sm h-full justify-center">
              <Meta className="text-warning">REVIEW REQUIRED</Meta>
              <Body className="text-sm">{sessionId ? "Review each finding against the recommended corrections before proceeding." : "No session selected. Add ?session_id=... to the URL to load findings."}</Body>
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-6 mt-8">
          <SectionHeader number="03" title="REVIEW SUMMARY" />
          <div className="p-6 border border-border bg-surface-elevated rounded-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex gap-4 items-center flex-wrap">
              <Mono className="text-sm"><span className="text-text-primary font-bold">{statusCounts["VERIFIED"] || 0}</span> VERIFIED</Mono>
              <Mono className="text-sm"><span className="text-text-primary font-bold">{statusCounts["NEEDS REVIEW"] || 0}</span> NEEDS REVIEW</Mono>
              <Mono className="text-sm"><span className="text-text-primary font-bold">{statusCounts["REJECTED"] || 0}</span> REJECTED</Mono>
              <Mono className="text-sm"><span className="text-text-primary font-bold">{statusCounts["UNVERIFIED"] || 0}</span> NOT REVIEWED</Mono>
            </div>
            <Button onClick={() => navigate(sessionId ? `/basket?session_id=${sessionId}` : "/basket")} className="shrink-0 w-full sm:w-auto">
              CONTINUE TO STANDARDS BASKET →
            </Button>
          </div>
        </section>
      </div>

      <Dialog isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="FINDING REVIEW" className="max-w-3xl" footer={<Button onClick={() => setSelectedItem(null)}>{t("btn.close")}</Button>}>
        {selectedItem && (
          <div className="flex flex-col gap-8 py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={selectedItem.severity === "CRITICAL" ? "danger" : selectedItem.severity === "HIGH" ? "warning" : "neutral"}>{selectedItem.severity}</Badge>
                <Badge variant="neutral">{selectedItem.category}</Badge>
              </div>
              <Body className="font-medium text-text-secondary mt-2">{selectedItem.message}</Body>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-border py-6">
              <div className="flex flex-col gap-2"><Meta>CLAUSE</Meta><Mono className="text-sm">{selectedItem.clause}</Mono></div>
              <div className="flex flex-col gap-2"><Meta>SUGGESTED ACTION</Meta><Body className="text-sm text-text-secondary">{selectedItem.suggested_action}</Body></div>
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-6">
              <Textarea label="TENDER CLAUSE TO VERIFY" placeholder="Enter tender clause to verify against evidence..." value={notes[selectedItem.id] || ""} onChange={(e) => handleNoteChange(selectedItem.id, e.target.value)} rows={3} />
              <Button variant="secondary" onClick={handleVerifyBackend} disabled={isVerifying}>{isVerifying ? "VERIFYING WITH ENGINE..." : "RUN BACKEND VERIFICATION"}</Button>
              {verifyError && <ErrorState title="VERIFICATION ERROR" description="Failed to run backend verification." />}
              {verificationResult && (
                <div className="p-4 border border-border bg-surface-elevated flex flex-col gap-2 mt-4">
                  <Meta>BACKEND VERIFICATION RESULT</Meta>
                  <EvidenceVerificationStatus status={verificationResult.verification_status as any} />
                  <Body className="text-sm font-medium mt-2">REASON:</Body>
                  <Body className="text-sm text-text-secondary">{verificationResult.reason}</Body>
                  <div className="flex gap-4 mt-2"><Meta>CONFIDENCE: {(verificationResult.confidence * 100).toFixed(0)}%</Meta></div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 border-t border-border pt-6 bg-surface-elevated p-4 -mx-6 -mb-6 mt-4 rounded-b-sm items-center justify-between">
              <Meta>REVIEW DECISION</Meta>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => handleStatusChange(selectedItem.id, "VERIFIED")}>VERIFY FINDING</Button>
                <Button variant="destructive" onClick={() => handleStatusChange(selectedItem.id, "REJECTED")}>REJECT FINDING</Button>
                <Button variant="ghost" onClick={() => handleStatusChange(selectedItem.id, "NEEDS REVIEW")}>KEEP FOR FURTHER REVIEW</Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
}
