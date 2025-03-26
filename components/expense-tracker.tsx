"use client"

import { useState, useEffect } from "react"
import {
  Users,
  DollarSign,
  FolderOpen,
  ArrowRight,
  PlusCircle,
  Receipt,
  PieChart,
  Calendar,
  Clock,
  Trash2,
  Map,
  AlertTriangle,
  Award,
  Ban,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

// Types
interface Trip {
  id: string
  name: string
  description?: string
  startDate?: Date
  endDate?: Date
}

interface Person {
  id: string
  name: string
  tripId: string
}

interface Expense {
  id: string
  tripId: string
  payerId: string
  item: string
  amount: number
  participants: string[]
  date: Date
  category: string
  notes?: string
}

interface CategoryTotal {
  category: string
  amount: number
  percentage: number
}

// Sample categories with icons
const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "🍔" },
  { id: "transport", name: "Transportation", icon: "🚕" },
  { id: "accommodation", name: "Accommodation", icon: "🏨" },
  { id: "activities", name: "Activities", icon: "🎭" },
  { id: "shopping", name: "Shopping", icon: "🛍️" },
  { id: "other", name: "Other", icon: "📦" },
]

export default function ExpenseTracker() {
  // State
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: "1",
      name: "Manali Trip",
      description: "Weekend getaway to the mountains",
      startDate: new Date(2025, 2, 15),
      endDate: new Date(2025, 2, 18),
    },
  ])
  const [activeTrip, setActiveTrip] = useState<string>("1")
  const [people, setPeople] = useState<Person[]>([
    { id: "1", name: "Raghav", tripId: "1" },
    { id: "2", name: "Harsh", tripId: "1" },
    { id: "3", name: "Hemant", tripId: "1" },
  ])
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      tripId: "1",
      payerId: "1",
      item: "Shoes",
      amount: 20000,
      participants: ["1", "2", "3"],
      date: new Date(),
      category: "shopping",
    },
  ])
  const [newPersonName, setNewPersonName] = useState("")
  const [activeTab, setActiveTab] = useState("people")
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    tripId: activeTrip,
    payerId: "",
    item: "",
    amount: 0,
    participants: [],
    date: new Date(),
    category: "other",
  })
  const [newTrip, setNewTrip] = useState<Partial<Trip>>({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
  })
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  const [isAddTripOpen, setIsAddTripOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false)
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null)
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null)
  const [isDeletePersonDialogOpen, setIsDeletePersonDialogOpen] = useState(false)
  const [isDeleteTripDialogOpen, setIsDeleteTripDialogOpen] = useState(false)

  // Update new expense tripId when active trip changes
  useEffect(() => {
    setNewExpense((prev) => ({ ...prev, tripId: activeTrip }))
  }, [activeTrip])

  // Filter people and expenses by active trip
  const filteredPeople = people.filter((person) => person.tripId === activeTrip)
  const filteredExpenses = expenses.filter((expense) => expense.tripId === activeTrip)

  // Calculate balances
  const calculateBalances = () => {
    const balances: Record<string, number> = {}

    // Initialize balances to 0
    filteredPeople.forEach((person) => {
      balances[person.id] = 0
    })

    // Calculate what each person paid
    filteredExpenses.forEach((expense) => {
      // Add the amount to the payer
      balances[expense.payerId] += expense.amount

      // Calculate each person's share
      const perPersonShare = expense.amount / expense.participants.length

      // Subtract the share from each participant
      expense.participants.forEach((participantId) => {
        balances[participantId] -= perPersonShare
      })
    })

    return balances
  }

  // Calculate settlement plan
  const calculateSettlement = () => {
    const balances = calculateBalances()
    const settlement: { from: string; to: string; amount: number }[] = []

    // Create arrays of debtors and creditors
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < 0)
      .map(([id, balance]) => ({ id, balance: Math.abs(balance) }))
      .sort((a, b) => b.balance - a.balance)

    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([id, balance]) => ({ id, balance }))
      .sort((a, b) => b.balance - a.balance)

    // Match debtors with creditors
    debtors.forEach((debtor) => {
      let remainingDebt = debtor.balance

      while (remainingDebt > 0.01 && creditors.length > 0) {
        const creditor = creditors[0]

        if (creditor.balance <= remainingDebt) {
          // Creditor's balance is less than or equal to the remaining debt
          settlement.push({
            from: debtor.id,
            to: creditor.id,
            amount: Number(creditor.balance.toFixed(2)),
          })

          remainingDebt -= creditor.balance
          creditors.shift() // Remove the creditor as they've been fully paid
        } else {
          // Creditor's balance is more than the remaining debt
          settlement.push({
            from: debtor.id,
            to: creditor.id,
            amount: Number(remainingDebt.toFixed(2)),
          })

          creditors[0].balance -= remainingDebt
          remainingDebt = 0
        }
      }
    })

    return settlement
  }

  // Calculate category totals
  const calculateCategoryTotals = (): CategoryTotal[] => {
    const categoryTotals: Record<string, number> = {}
    let totalAmount = 0

    // Sum expenses by category
    filteredExpenses.forEach((expense) => {
      const category = expense.category || "other"
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
      totalAmount += expense.amount
    })

    // Convert to array with percentages
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Calculate payment frequency
  const calculatePaymentFrequency = () => {
    const frequency: Record<string, number> = {}

    // Initialize frequency to 0
    filteredPeople.forEach((person) => {
      frequency[person.id] = 0
    })

    // Count how many times each person paid
    filteredExpenses.forEach((expense) => {
      frequency[expense.payerId] = (frequency[expense.payerId] || 0) + 1
    })

    return frequency
  }

  // Find people who haven't paid yet
  const findNonPayers = () => {
    const payers = new Set(filteredExpenses.map((expense) => expense.payerId))
    return filteredPeople.filter((person) => !payers.has(person.id))
  }

  // Add a new person
  const addPerson = () => {
    if (newPersonName.trim()) {
      setPeople([
        ...people,
        {
          id: Date.now().toString(),
          name: newPersonName.trim(),
          tripId: activeTrip,
        },
      ])
      setNewPersonName("")
      setIsAddPersonOpen(false)
    }
  }

  // Delete a person
  const deletePerson = (person: Person) => {
    setPersonToDelete(person)
    setIsDeletePersonDialogOpen(true)
  }

  // Confirm person deletion
  const confirmDeletePerson = () => {
    if (personToDelete) {
      // Remove the person
      setPeople(people.filter((p) => p.id !== personToDelete.id))

      // Remove the person from expense participants
      setExpenses(
        expenses.map((expense) => {
          if (expense.participants.includes(personToDelete.id)) {
            return {
              ...expense,
              participants: expense.participants.filter((id) => id !== personToDelete.id),
            }
          }
          return expense
        }),
      )

      // If the person is a payer, reassign or delete those expenses
      const personExpenses = expenses.filter((e) => e.payerId === personToDelete.id)
      if (personExpenses.length > 0) {
        // For simplicity, we'll delete these expenses
        setExpenses(expenses.filter((e) => e.payerId !== personToDelete.id))
      }

      setIsDeletePersonDialogOpen(false)
      setPersonToDelete(null)
    }
  }

  // Add a new trip
  const addTrip = () => {
    if (newTrip.name?.trim()) {
      const tripId = Date.now().toString()
      setTrips([
        ...trips,
        {
          id: tripId,
          name: newTrip.name.trim(),
          description: newTrip.description,
          startDate: newTrip.startDate,
          endDate: newTrip.endDate,
        },
      ])
      setNewTrip({
        name: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
      })
      setActiveTrip(tripId)
      setIsAddTripOpen(false)
    }
  }

  // Delete a trip
  const deleteTrip = (trip: Trip) => {
    setTripToDelete(trip)
    setIsDeleteTripDialogOpen(true)
  }

  // Confirm trip deletion
  const confirmDeleteTrip = () => {
    if (tripToDelete) {
      // Remove the trip
      setTrips(trips.filter((t) => t.id !== tripToDelete.id))

      // Remove all people and expenses associated with this trip
      setPeople(people.filter((p) => p.tripId !== tripToDelete.id))
      setExpenses(expenses.filter((e) => e.tripId !== tripToDelete.id))

      // If this was the active trip, switch to another trip
      if (activeTrip === tripToDelete.id) {
        const remainingTrips = trips.filter((t) => t.id !== tripToDelete.id)
        if (remainingTrips.length > 0) {
          setActiveTrip(remainingTrips[0].id)
        } else {
          // Create a new default trip if no trips remain
          const newTripId = Date.now().toString()
          setTrips([
            {
              id: newTripId,
              name: "New Trip",
            },
          ])
          setActiveTrip(newTripId)
        }
      }

      setIsDeleteTripDialogOpen(false)
      setTripToDelete(null)
    }
  }

  // Add a new expense
  const addExpense = () => {
    if (
      newExpense.payerId &&
      newExpense.item &&
      newExpense.amount &&
      newExpense.participants &&
      newExpense.participants.length > 0
    ) {
      const expense: Expense = {
        id: Date.now().toString(),
        tripId: activeTrip,
        payerId: newExpense.payerId,
        item: newExpense.item,
        amount: Number(newExpense.amount),
        participants: newExpense.participants,
        date: newExpense.date || new Date(),
        category: newExpense.category || "other",
        notes: newExpense.notes,
      }

      setExpenses([...expenses, expense])
      setNewExpense({
        tripId: activeTrip,
        payerId: "",
        item: "",
        amount: 0,
        participants: [],
        date: new Date(),
        category: "other",
      })
      setIsAddExpenseOpen(false)
    }
  }

  // Delete an expense
  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
    setIsExpenseDetailsOpen(false)
  }

  // Handle participant selection
  const toggleParticipant = (personId: string) => {
    setNewExpense((prev) => {
      const participants = prev.participants || []

      if (participants.includes(personId)) {
        return { ...prev, participants: participants.filter((id) => id !== personId) }
      } else {
        return { ...prev, participants: [...participants, personId] }
      }
    })
  }

  // View expense details
  const viewExpenseDetails = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsExpenseDetailsOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Get person name by ID
  const getPersonName = (id: string) => {
    return people.find((person) => person.id === id)?.name || "Unknown"
  }

  // Get category details
  const getCategoryDetails = (categoryId: string) => {
    return CATEGORIES.find((cat) => cat.id === categoryId) || { id: "other", name: "Other", icon: "📦" }
  }

  // Calculate total trip expenses
  const totalTripExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Balances for display
  const balances = calculateBalances()
  const maxAbsBalance = Math.max(...Object.values(balances).map(Math.abs))

  // Payment frequency
  const paymentFrequency = calculatePaymentFrequency()
  const maxFrequency = Math.max(...Object.values(paymentFrequency))

  // Non-payers
  const nonPayers = findNonPayers()

  return (
    <div className="container mx-auto py-6 px-4 max-w-md">
      <div className="flex flex-col space-y-4">
        <header className="text-center mb-4">
          <h1 className="text-4xl font-bold text-blue-800">Trip Expense Tracker</h1>
          <p className="text-gray-600 mt-1">Split expenses easily with friends</p>
        </header>

        {/* Trip Selector */}
        <div className="flex items-center justify-between">
          <Select value={activeTrip} onValueChange={setActiveTrip}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Trip" />
            </SelectTrigger>
            <SelectContent>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex space-x-2">
            <Dialog open={isAddTripOpen} onOpenChange={setIsAddTripOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New Trip
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Trip</DialogTitle>
                  <DialogDescription>Add details for your new trip</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tripName">Trip Name</Label>
                    <Input
                      id="tripName"
                      placeholder="e.g., Manali Trip"
                      value={newTrip.name}
                      onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tripDescription">Description (Optional)</Label>
                    <Textarea
                      id="tripDescription"
                      placeholder="Brief description of the trip"
                      value={newTrip.description}
                      onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <DatePicker
                        date={newTrip.startDate}
                        setDate={(date) => setNewTrip({ ...newTrip, startDate: date })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <DatePicker
                        date={newTrip.endDate}
                        setDate={(date) => setNewTrip({ ...newTrip, endDate: date })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addTrip}>Create Trip</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {trips.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => deleteTrip(trips.find((t) => t.id === activeTrip)!)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Trip Details Card */}
        {trips.find((t) => t.id === activeTrip)?.description && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Map className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="font-medium">{trips.find((t) => t.id === activeTrip)?.name}</h3>
                  <p className="text-sm text-gray-500">{trips.find((t) => t.id === activeTrip)?.description}</p>
                  {trips.find((t) => t.id === activeTrip)?.startDate &&
                    trips.find((t) => t.id === activeTrip)?.endDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(trips.find((t) => t.id === activeTrip)?.startDate!), "MMM d")} -
                        {format(new Date(trips.find((t) => t.id === activeTrip)?.endDate!), "MMM d, yyyy")}
                      </p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="people" className="flex flex-col items-center py-2">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">People</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex flex-col items-center py-2">
              <Receipt className="h-5 w-5 mb-1" />
              <span className="text-xs">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex flex-col items-center py-2">
              <FolderOpen className="h-5 w-5 mb-1" />
              <span className="text-xs">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col items-center py-2">
              <PieChart className="h-5 w-5 mb-1" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Users className="h-6 w-6 text-blue-600 mr-2" />
                  Add People
                </CardTitle>
                <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-auto">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Person</DialogTitle>
                      <DialogDescription>Add a new person to split expenses with</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter name"
                          className="col-span-3"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addPerson}>Add Person</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      placeholder="Enter Name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={addPerson} size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filteredPeople.map((person) => (
                      <div key={person.id} className="flex items-center">
                        <Badge variant="secondary" className="px-3 py-1 text-sm">
                          {person.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1"
                          onClick={() => deletePerson(person)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600 mr-2" />
                  Current Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPeople.map((person) => {
                    const balance = balances[person.id] || 0
                    const isPositive = balance >= 0
                    const progressPercentage = maxAbsBalance ? (Math.abs(balance) / maxAbsBalance) * 100 : 0

                    return (
                      <div key={person.id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{person.name}</span>
                          <span className={isPositive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {isPositive ? formatCurrency(balance) : formatCurrency(balance)}
                          </span>
                        </div>
                        <Progress
                          value={progressPercentage}
                          className={cn("h-2", isPositive ? "bg-gray-200" : "bg-gray-200")}
                          indicatorClassName={isPositive ? "bg-green-500" : "bg-red-500"}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center pb-2">
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600 mr-2" />
                  Add Expense
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Expense</DialogTitle>
                      <DialogDescription>Enter the details of the expense</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="payer">Who paid?</Label>
                        <Select
                          value={newExpense.payerId}
                          onValueChange={(value) => setNewExpense({ ...newExpense, payerId: value })}
                        >
                          <SelectTrigger id="payer">
                            <SelectValue placeholder="Select Payer" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPeople.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="item">What was it for?</Label>
                        <Input
                          id="item"
                          placeholder="Enter Item"
                          value={newExpense.item}
                          onChange={(e) => setNewExpense({ ...newExpense, item: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="amount">How much?</Label>
                        <Input
                          id="amount"
                          placeholder="Enter Amount"
                          type="number"
                          value={newExpense.amount || ""}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: Number.parseFloat(e.target.value) })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <span className="flex items-center">
                                  <span className="mr-2">{category.icon}</span>
                                  {category.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <DatePicker date={newExpense.date} setDate={(date) => setNewExpense({ ...newExpense, date })} />
                      </div>

                      <div className="grid gap-2">
                        <Label>Split with</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredPeople.map((person) => (
                            <div key={person.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`person-${person.id}`}
                                checked={(newExpense.participants || []).includes(person.id)}
                                onCheckedChange={() => toggleParticipant(person.id)}
                              />
                              <Label htmlFor={`person-${person.id}`}>{person.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Add notes"
                          value={newExpense.notes || ""}
                          onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={addExpense}>Add Expense</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Receipt className="h-6 w-6 text-yellow-600 mr-2" />
                  Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {filteredExpenses.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No expenses yet</p>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => viewExpenseDetails(expense)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{expense.item}</h3>
                              <p className="text-sm text-gray-500">Paid by {getPersonName(expense.payerId)}</p>
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(expense.date), "MMM d, yyyy")}
                                <span className="mx-1">•</span>
                                <span className="flex items-center">
                                  {getCategoryDetails(expense.category).icon}
                                  <span className="ml-1">{getCategoryDetails(expense.category).name}</span>
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold">{formatCurrency(expense.amount)}</span>
                              <p className="text-xs text-gray-500">{expense.participants.length} people</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Expense Details Dialog */}
            <Dialog open={isExpenseDetailsOpen} onOpenChange={setIsExpenseDetailsOpen}>
              <DialogContent>
                {selectedExpense && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Expense Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">{selectedExpense.item}</h3>
                        <Badge variant="outline" className="flex items-center">
                          <span className="mr-1">{getCategoryDetails(selectedExpense.category).icon}</span>
                          {getCategoryDetails(selectedExpense.category).name}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedExpense.amount)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Paid by</span>
                        <span>{getPersonName(selectedExpense.payerId)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Date</span>
                        <span>{format(new Date(selectedExpense.date), "MMMM d, yyyy")}</span>
                      </div>

                      <div className="py-2 border-b">
                        <p className="text-gray-600 mb-2">Split between</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedExpense.participants.map((participantId) => (
                            <Badge key={participantId} variant="secondary">
                              {getPersonName(participantId)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="py-2 border-b">
                        <p className="text-gray-600 mb-2">Each person pays</p>
                        <p className="font-medium">
                          {formatCurrency(selectedExpense.amount / selectedExpense.participants.length)}
                        </p>
                      </div>

                      {selectedExpense.notes && (
                        <div className="py-2 border-b">
                          <p className="text-gray-600 mb-1">Notes</p>
                          <p>{selectedExpense.notes}</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" onClick={() => deleteExpense(selectedExpense.id)}>
                        Delete Expense
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <FolderOpen className="h-6 w-6 text-purple-600 mr-2" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPeople.map((person) => {
                    const balance = balances[person.id] || 0
                    const isPositive = balance >= 0
                    const progressPercentage = maxAbsBalance ? (Math.abs(balance) / maxAbsBalance) * 100 : 0

                    return (
                      <div key={person.id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{person.name}</span>
                          <span className={isPositive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {formatCurrency(balance)}
                          </span>
                        </div>
                        <Progress
                          value={progressPercentage}
                          className={cn("h-2", isPositive ? "bg-gray-200" : "bg-gray-200")}
                          indicatorClassName={isPositive ? "bg-green-500" : "bg-red-500"}
                        />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <DollarSign className="h-6 w-6 text-yellow-600 mr-2" />
                  Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100 p-3">
                    <div className="font-medium">Payer</div>
                    <div className="font-medium">Item</div>
                    <div className="font-medium text-right">Amount</div>
                  </div>
                  <div className="divide-y">
                    {filteredExpenses.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No expenses yet</p>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <div key={expense.id} className="p-3 hover:bg-gray-50 group">
                          <div className="grid grid-cols-3">
                            <div>{getPersonName(expense.payerId)}</div>
                            <div>{expense.item}</div>
                            <div className="text-right font-medium flex items-center justify-end">
                              {formatCurrency(expense.amount)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteExpense(expense.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <ArrowRight className="h-6 w-6 text-orange-600 mr-2" />
                  Settlement Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {calculateSettlement().length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Everyone is settled up!</p>
                  ) : (
                    calculateSettlement().map((settlement, index) => (
                      <div
                        key={index}
                        className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{getPersonName(settlement.from)}</span>
                          <ArrowRight className="h-4 w-4 mx-2" />
                          <span className="font-medium">{getPersonName(settlement.to)}</span>
                        </div>
                        <span className="font-bold text-orange-600">{formatCurrency(settlement.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <PieChart className="h-6 w-6 text-indigo-600 mr-2" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <h3 className="text-sm text-gray-500">Total Trip Expenses</h3>
                  <p className="text-3xl font-bold">{formatCurrency(totalTripExpenses)}</p>
                </div>

                <div className="space-y-4">
                  {calculateCategoryTotals().map((category) => (
                    <div key={category.category} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="mr-2">{getCategoryDetails(category.category).icon}</span>
                          <span>{getCategoryDetails(category.category).name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(category.amount)}</span>
                          <span className="text-gray-500 text-sm ml-2">({category.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Award className="h-6 w-6 text-yellow-600 mr-2" />
                  Payment Champions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPeople.map((person) => {
                    // Calculate how much this person has paid in total
                    const totalPaid = filteredExpenses
                      .filter((expense) => expense.payerId === person.id)
                      .reduce((sum, expense) => sum + expense.amount, 0)

                    // Calculate percentage of total expenses
                    const percentage = totalTripExpenses > 0 ? (totalPaid / totalTripExpenses) * 100 : 0

                    // Calculate payment frequency
                    const frequency = paymentFrequency[person.id] || 0
                    const frequencyPercentage = maxFrequency > 0 ? (frequency / maxFrequency) * 100 : 0

                    return (
                      <div key={person.id} className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">{person.name}</span>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(totalPaid)}</span>
                            <span className="text-gray-500 text-sm ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Payment Frequency</span>
                          <span className="text-gray-500">{frequency} times</span>
                        </div>
                        <Progress value={frequencyPercentage} className="h-1" indicatorClassName="bg-blue-400" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Ban className="h-6 w-6 text-red-600 mr-2" />
                  Non-Payers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nonPayers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Everyone has contributed!</p>
                ) : (
                  <div className="space-y-2">
                    {nonPayers.map((person) => (
                      <div
                        key={person.id}
                        className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <span>{person.name} hasn't paid for anything yet</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center">
                  <Clock className="h-6 w-6 text-green-600 mr-2" />
                  Expense Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="relative pl-6 border-l border-gray-200">
                    {filteredExpenses.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No expenses yet</p>
                    ) : (
                      filteredExpenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <div key={expense.id} className="mb-6 relative">
                            <div className="absolute -left-3 mt-1.5 h-5 w-5 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                              <span className="text-xs">{getCategoryDetails(expense.category).icon}</span>
                            </div>
                            <div className="border rounded-lg p-3 ml-4 group">
                              <p className="text-sm text-gray-500">{format(new Date(expense.date), "MMMM d, yyyy")}</p>
                              <div className="flex justify-between items-center mt-1">
                                <h3 className="font-medium">{expense.item}</h3>
                                <div className="flex items-center">
                                  <span className="font-bold">{formatCurrency(expense.amount)}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100"
                                    onClick={() => deleteExpense(expense.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">Paid by {getPersonName(expense.payerId)}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Person Confirmation Dialog */}
      <AlertDialog open={isDeletePersonDialogOpen} onOpenChange={setIsDeletePersonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {personToDelete?.name} from the trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePerson}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Trip Confirmation Dialog */}
      <AlertDialog open={isDeleteTripDialogOpen} onOpenChange={setIsDeleteTripDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the trip "{tripToDelete?.name}" and all associated people and expenses. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTrip}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

