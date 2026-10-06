import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-game text-3xl">Card not found</h1>
      <p className="mt-2 text-muted">
        <Link href="/" className="text-accent hover:underline">
          Back to all cards
        </Link>
      </p>
    </div>
  );
}
