/**
 * components/dashboard/coming-soon-page.tsx
 *
 * Shared shell for "Coming soon" pages. Renders a PageHeader with a Coming soon
 * badge and a feature-preview card listing what the page will offer. No data
 * fetching and no interactive state — purely a placeholder so users can see
 * what is planned without a dead link.
 *
 * All display strings are passed as props so this component works equally in
 * server components (next-intl getTranslations) and client components
 * (next-intl useTranslations). It must NOT call getTranslations itself, since
 * some consumers render it from a 'use client' page.
 */
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ComingSoonFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface ComingSoonPageProps {
  title: string;
  description: string;
  /** Hero icon shown large next to the header. */
  icon: LucideIcon;
  /** Short tagline shown under the header, e.g. the elevator pitch. */
  tagline: string;
  /** Preview list of what the page will offer once shipped. */
  features: ComingSoonFeature[];
  /** Coming-soon badge label (e.g. "Coming soon"). */
  badgeLabel: string;
  /** Hero body copy. */
  body: string;
  /** Footer disclaimer copy. */
  footerNote: string;
}

export function ComingSoonPage({
  title,
  description,
  icon: Icon,
  tagline,
  features,
  badgeLabel,
  body,
  footerNote,
}: ComingSoonPageProps) {
  return (
    <main className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="secondary" className="bg-ios-orange/10 text-ios-orange">
            <Sparkles data-icon="inline-start" />
            {badgeLabel}
          </Badge>
        }
      />

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-ios-indigo/10 via-ios-blue/5 to-transparent p-5 md:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-ios-indigo/10 text-ios-indigo">
              <Icon className="size-6" />
            </span>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold md:text-xl">{tagline}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature previews */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-ios-blue/10 text-ios-blue">
                  <f.icon className="size-4" />
                </span>
                <CardTitle className="text-base">{f.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{f.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
    </main>
  );
}
