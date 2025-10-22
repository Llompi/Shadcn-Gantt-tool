import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Gantt Project Manager
        </h1>
        <p className="text-center text-lg mb-8">
          Visual project management tool powered by Baserow
        </p>
        <div className="flex justify-center">
          <Link
            href="/gantt"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Open Gantt Chart
          </Link>
        </div>
      </div>
    </main>
  )
}
