import Link from "next/link";
import { API_URL, type Meta } from "@/lib/api";
import { leagueLabel } from "@/lib/leagues";
import { Logo } from "./Logo";

const SOURCE = "https://github.com/elianbineder/divcards-web";
const API_SOURCE = "https://github.com/elianbineder/divcards";

export function SiteFooter({ meta }: { meta: Meta }) {
  return (
    <footer className="mt-10 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-8 py-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo icon={meta.assets.favicon} />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Path of Exile Divination Card Index, estimate drop rates and track weight changes across leagues.
            </p>
          </div>

          <div className="flex gap-16">
            <FooterColumn title="Pages">
              <Link href="/" className="hover:text-foreground">
                Index
              </Link>
              <Link href="/calculator" className="hover:text-foreground">
                Calculator
              </Link>
              <Link href="/history" className="hover:text-foreground">
                History
              </Link>
            </FooterColumn>
            <FooterColumn title="Info">
              <a href={`${API_URL}/docs`} className="hover:text-foreground">
                API docs
              </a>
              <a href={API_SOURCE} className="hover:text-foreground">
                API source
              </a>
              <a href={SOURCE} className="flex items-center gap-1.5 hover:text-foreground">
                GitHub
                <GitHubIcon />
              </a>
            </FooterColumn>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-4 text-xs leading-relaxed text-muted sm:flex-row sm:justify-between sm:gap-8">
          <p>
            <strong className="font-semibold text-foreground/80">Disclaimer:</strong> unofficial fan-made site, not
            affiliated with or endorsed by Grinding Gear Games. Path of Exile, its card names, texts and artwork are
            the property of Grinding Gear Games.
            <br />
            Game version: {meta.label}
            {meta.costs && <> · Weights: {leagueLabel(meta.costs.league)}</>}
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} DivCards</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5 text-sm text-muted">{children}</div>
    </nav>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
