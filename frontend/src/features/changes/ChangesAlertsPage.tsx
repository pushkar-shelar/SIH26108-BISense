import { useState, useMemo } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { Mono, Body, Meta } from '../../components/ui/Typography';
import { useChanges } from '../../hooks/useChanges';
import { useI18n } from '../../i18n/index';
import type { StandardChange } from '../../types/api';

const CHANGE_TYPE_FILTERS = ['ALL', 'VERSION', 'AMENDMENT', 'REGULATORY', 'OTHER'] as const;

type ChangeTypeFilter = typeof CHANGE_TYPE_FILTERS[number];

function getChangeBadgeVariant(changeType: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const t = changeType?.toUpperCase();
  if (t === 'VERSION') return 'success';
  if (t === 'AMENDMENT') return 'warning';
  if (t === 'REGULATORY') return 'danger';
  return 'neutral';
}

function ChangeCard({ change }: { change: StandardChange }) {
  return (
    <div className="flex flex-col gap-4 p-6 border border-border bg-surface rounded-sm hover:border-text-muted transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <Mono className="text-base font-bold text-text-primary">{change.standard_id}</Mono>
          {change.previous_version && change.current_version && (
            <div className="flex items-center gap-2">
              <Mono className="text-xs text-text-muted line-through">{change.previous_version}</Mono>
              <span className="text-text-muted text-xs">→</span>
              <Mono className="text-xs text-accent font-bold">{change.current_version}</Mono>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={getChangeBadgeVariant(change.change_type)}>
            {change.change_type || 'CHANGE'}
          </Badge>
          {change.date && (
            <Mono className="text-xs text-text-muted">{change.date}</Mono>
          )}
        </div>
      </div>

      {change.impact && (
        <div className="flex flex-col gap-1">
          <Meta>IMPACT</Meta>
          <Body className="text-sm">{change.impact}</Body>
        </div>
      )}

      {change.affected_procurements && change.affected_procurements.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <Meta>AFFECTED PROCUREMENTS</Meta>
          <div className="flex flex-wrap gap-2">
            {change.affected_procurements.map((proc, i) => (
              <Mono key={i} className="text-xs text-text-secondary border border-border px-2 py-0.5 rounded-sm">
                {typeof proc === 'string' ? proc : JSON.stringify(proc)}
              </Mono>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChangesAlertsPage() {
  const { t } = useI18n();
  const { data: changesData, isLoading, error } = useChanges();
  const [activeFilter, setActiveFilter] = useState<ChangeTypeFilter>('ALL');

  const allChanges = changesData?.changes || [];

  const filteredChanges = useMemo(() => {
    if (activeFilter === 'ALL') return allChanges;
    return allChanges.filter(c => {
      const ct = (c.change_type || '').toUpperCase();
      if (activeFilter === 'OTHER') {
        return !['VERSION', 'AMENDMENT', 'REGULATORY'].includes(ct);
      }
      return ct === activeFilter;
    });
  }, [allChanges, activeFilter]);

  // Count per type
  const counts = useMemo(() => {
    const map: Record<ChangeTypeFilter, number> = { ALL: allChanges.length, VERSION: 0, AMENDMENT: 0, REGULATORY: 0, OTHER: 0 };
    allChanges.forEach(c => {
      const ct = (c.change_type || '').toUpperCase() as ChangeTypeFilter;
      if (ct === 'VERSION') map.VERSION++;
      else if (ct === 'AMENDMENT') map.AMENDMENT++;
      else if (ct === 'REGULATORY') map.REGULATORY++;
      else map.OTHER++;
    });
    return map;
  }, [allChanges]);

  if (isLoading) return <LoadingState message={t('state.loading')} />;
  if (error) return <PageContainer><ErrorState title={t('state.error')} description="Failed to load changes from backend." /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="CHANGES & ALERTS"
        title="STANDARD CHANGE MONITOR"
        description="Track new editions, amendments, reaffirmations, superseded standards and withdrawals."
      />

      <div className="flex flex-col gap-12 pb-24 mt-12">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap border-b border-border pb-4">
          {CHANGE_TYPE_FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`mono text-xs px-3 py-1.5 border rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent
                ${activeFilter === filter
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary'
                }`}
            >
              {filter} ({counts[filter]})
            </button>
          ))}
        </div>

        <section className="flex flex-col gap-6">
          <SectionHeader number="01" title={`${activeFilter === 'ALL' ? 'ALL CHANGES' : `${activeFilter} CHANGES`} (${filteredChanges.length})`} />

          {filteredChanges.length === 0 ? (
            <EmptyState
              title={t('state.noChanges')}
              description={allChanges.length === 0
                ? "No standard changes are currently tracked in the database."
                : `No changes of type "${activeFilter}" found.`
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {filteredChanges.map(change => (
                <ChangeCard key={change.id} change={change} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
