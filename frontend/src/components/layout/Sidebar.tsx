import { NavLink } from 'react-router-dom';
import { Label } from '../ui/Label';
import { GlobalSearch } from '../search/GlobalSearch';
import { ThemeToggle } from '../ThemeToggle';
import { useI18n } from '../../i18n/index';
import type { Language } from '../../i18n/index';

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard' as const, num: '01' },
  { path: '/procurements', labelKey: 'nav.procurements' as const, num: '02' },
  { path: '/standards', labelKey: 'nav.standards' as const, num: '03' },
  { path: '/tender-health', labelKey: 'nav.tenderHealth' as const, num: '04' },
  { path: '/graph', labelKey: 'nav.knowledgeGraph' as const, num: '05' },
  { path: '/review', labelKey: 'nav.review' as const, num: '06' },
  { path: '/basket', labelKey: 'nav.basket' as const, num: '07' },
  { path: '/specification-builder', labelKey: 'nav.specBuilder' as const, num: '08' },
  { path: '/approval', labelKey: 'nav.approval' as const, num: '09' },
  { path: '/export', labelKey: 'nav.export' as const, num: '10' },
  { path: '/changes', labelKey: 'nav.changes' as const, num: '11' },
  { path: '/settings', labelKey: 'nav.settings' as const, num: '12' },
];

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
];

export function Sidebar() {
  const { t, language, setLanguage } = useI18n();

  return (
    <aside className="w-full md:w-64 border-r border-border bg-background flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-border flex flex-col gap-4">
        <div>
          <Label className="text-text-primary">PROCUREMENT INTEL</Label>
          <span className="metadata block mt-1">SYSTEM WORKBENCH</span>
        </div>
        <GlobalSearch 
          triggerButton={
            <div className="flex items-center justify-between p-2 border border-border bg-surface rounded-sm cursor-text hover:border-text-muted transition-colors">
              <span className="mono text-xs text-text-muted">{t('search.placeholder')}</span>
              <span className="mono text-[10px] text-text-muted border border-border px-1 rounded-sm bg-background">⌘K</span>
            </div>
          }
        />
      </div>
      <nav className="flex flex-col flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-6 py-2.5 flex items-center gap-3 text-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:bg-surface ${
                isActive ? 'text-text-primary bg-surface' : 'text-text-secondary'
              }`
            }
          >
            <span className="mono text-text-muted">{item.num}</span>
            <span className="font-medium">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border mt-auto flex flex-col gap-3">
        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] text-text-muted uppercase tracking-wider">{t('lang.label')}</span>
          <div className="flex gap-1 ml-auto" role="group" aria-label="Language selector">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
                aria-label={code === 'en' ? 'English' : code === 'hi' ? 'Hindi' : 'Marathi'}
                className={`mono text-[11px] px-2 py-1 border rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent
                  ${language === code
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-border text-text-muted hover:border-text-muted hover:text-text-secondary bg-transparent'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="mono text-xs text-text-muted">v1.0.0 — ONLINE</div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
