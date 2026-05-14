import { BrandMark } from "@/components/auth/brand-mark";
import { Wordmark } from "@/components/auth/wordmark";

export type AuthSplitBrand = {
  /** Small uppercase label under the wordmark (both panels). */
  eyebrow: string;
  headline: string;
  body: string;
  footnote: string;
};

type AuthSplitLayoutProps = {
  brand: AuthSplitBrand;
  children: React.ReactNode;
};

/**
 * Two-column auth shell: Forest brand panel + light form column (lg+).
 * Same grid and breakpoints as login; mobile stacks with brand strip above the form.
 */
export function AuthSplitLayout({ brand, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(20rem,28rem)]">
      <aside className="auth-brand-panel relative hidden flex-col justify-between px-10 py-12 text-white lg:flex xl:px-16">
        <div>
          <div className="flex items-center gap-4">
            <BrandMark size={52} priority />
            <div>
              <Wordmark variant="hero" />
              <p className="mt-1 text-label font-semibold uppercase tracking-wider text-white/55">
                {brand.eyebrow}
              </p>
            </div>
          </div>
          <h1 className="mt-14 max-w-md text-title1 font-semibold leading-snug text-white">
            {brand.headline}
          </h1>
          <p className="mt-4 max-w-sm text-body text-white/78">{brand.body}</p>
        </div>
        <p className="text-body-sm text-white/45">{brand.footnote}</p>
      </aside>

      <div className="flex flex-col justify-center bg-white px-4 py-10 sm:px-8 lg:bg-[linear-gradient(180deg,#ffffff_0%,rgb(217_217_217/0.18)_100%)] lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={44} priority />
            <div>
              <Wordmark />
              <p className="text-label font-semibold uppercase tracking-wider text-[var(--color-forest)]/50">
                {brand.eyebrow}
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
