import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="bg-card w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <h1 className="text-primary text-6xl font-extrabold">404</h1>
        <h2 className="text-foreground mt-4 text-xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground mt-2 text-xs">
          The investigation or resource you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
