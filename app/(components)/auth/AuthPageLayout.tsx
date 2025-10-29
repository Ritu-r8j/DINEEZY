import React from "react";
import Link from "next/link";

export type AuthPageLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Optional link displayed beneath the subtitle. Useful for quick toggles like switching between login/register flows.
   */
  helperLink?: {
    label: string;
    href: string;
  };
  /**
   * Optional element shown beside the brand. Defaults to the UtensilsCrossed icon.
   */
  emblem?: React.ReactNode;
  /**
   * When false, hides the hero header (brand + title) and renders the textual header inside the card instead.
   */
  showHeader?: boolean;
};

const backgroundPattern =
  "bg-[radial-gradient(circle_at_1px_1px,rgba(20,20,20,0.05)_1px,transparent_0)] bg-[length:20px_20px]";

export function AuthPageLayout({
  children,
  title,
  subtitle,
  footer,
  helperLink,
  emblem,
  showHeader = true,
}: AuthPageLayoutProps) {
  const helperLinkNode =
    helperLink && (
      <Link
        href={helperLink.href}
        className="text-sm font-semibold text-gray-900 underline-offset-4 transition hover:underline dark:text-gray-100"
      >
        {helperLink.label}
      </Link>
    );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
      <div className={`pointer-events-none absolute inset-0 opacity-40 dark:opacity-20 ${backgroundPattern}`} />

      <main className="relative z-10 flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-10">
          {showHeader && (
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg shadow-gray-900/20 transition dark:bg-gray-100 dark:text-gray-900 dark:shadow-gray-100/20">
                  {emblem ?? (
                <div className="h-6 w-6 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
                  <span className="text-white dark:text-gray-900 font-bold text-xs">D</span>
                </div>
              )}
                </div>
                <span className="text-3xl font-semibold tracking-tight">DineEase</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
                {subtitle && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
                )}
                {helperLinkNode}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-200/20 backdrop-blur-md transition dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/30">
            {!showHeader && (
              <div className="mb-8 space-y-3 text-center">
                {emblem && (
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-900 transition dark:bg-gray-700 dark:text-gray-100">
                    {emblem}
                  </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
                )}
                {helperLinkNode}
              </div>
            )}
            {children}
          </div>

          {footer && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">{footer}</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AuthPageLayout;
