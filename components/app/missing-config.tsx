import Image from "next/image";

export function MissingConfig() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-md border border-border bg-background p-8">
        <Image
          src="/mnwhl-main.png"
          alt="mnwhl"
          width={120}
          height={44}
          className="mb-8 h-auto w-28 dark:invert"
          priority
        />
        <h1 className="text-xl font-medium lowercase tracking-normal">
          configuration needed
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          add Convex and Clerk environment variables, then restart the app. the
          required keys are listed in <code>.env.example</code>.
        </p>
      </section>
    </main>
  );
}
