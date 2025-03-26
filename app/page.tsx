import { Suspense } from "react"
import ExpenseTracker from "@/components/expense-tracker"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-50">
      <Suspense fallback={<LoadingSpinner />}>
        <ExpenseTracker />
      </Suspense>
    </main>
  )
}

