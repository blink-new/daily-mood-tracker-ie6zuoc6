import { useState, useEffect } from 'react'
import { createClient } from '@blinkdotnew/sdk'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Calendar } from '../components/ui/calendar'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { storageUtils, type MoodEntry } from '../lib/storage'

const blink = createClient({
  projectId: 'daily-mood-tracker-ie6zuoc6',
  authRequired: true
})

const moodEmojis = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '😊',
  6: '😄', 7: '😁', 8: '😍', 9: '🤩', 10: '🥳'
}

const moodColors = {
  1: 'bg-red-100 text-red-800', 2: 'bg-red-50 text-red-700', 3: 'bg-orange-100 text-orange-800',
  4: 'bg-yellow-100 text-yellow-800', 5: 'bg-blue-100 text-blue-800', 6: 'bg-green-100 text-green-800',
  7: 'bg-green-200 text-green-900', 8: 'bg-emerald-100 text-emerald-800',
  9: 'bg-purple-100 text-purple-800', 10: 'bg-pink-100 text-pink-800'
}

export default function MoodHistory() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    try {
      const user = await blink.auth.me()
      
      // Get all entries from localStorage (already sorted by date desc)
      const allEntries = storageUtils.getRecentMoodEntries(user.id, 100)
      setEntries(allEntries)
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return entries.find(entry => entry.date === dateStr)
  }

  const getDateDisplayName = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM d, yyyy')
  }

  const getTrendIcon = (currentRating: number, previousRating?: number) => {
    if (!previousRating) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (currentRating > previousRating) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (currentRating < previousRating) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const modifiers = {
    hasEntry: (date: Date) => !!getEntryForDate(date),
    highMood: (date: Date) => {
      const entry = getEntryForDate(date)
      return entry && entry.mood_rating >= 8
    },
    lowMood: (date: Date) => {
      const entry = getEntryForDate(date)
      return entry && entry.mood_rating <= 3
    }
  }

  const modifiersStyles = {
    hasEntry: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '50%'
    },
    highMood: {
      backgroundColor: '#22c55e',
      color: 'white'
    },
    lowMood: {
      backgroundColor: '#ef4444',
      color: 'white'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mood History</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border"
              />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Days with entries</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>High mood days (8-10)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Low mood days (1-3)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate && (() => {
                const entry = getEntryForDate(selectedDate)
                if (entry) {
                  return (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-6xl mb-2">
                          {moodEmojis[entry.mood_rating as keyof typeof moodEmojis]}
                        </div>
                        <Badge className={moodColors[entry.mood_rating as keyof typeof moodColors]}>
                          {entry.mood_rating}/10
                        </Badge>
                      </div>
                      {entry.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Notes:</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {entry.notes}
                          </p>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Logged at {format(parseISO(entry.created_at), 'h:mm a')}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📅</div>
                      <p className="text-muted-foreground">
                        No mood entry for this date
                      </p>
                    </div>
                  )
                }
              })()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Entries ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
                <p className="text-muted-foreground">
                  Start tracking your mood to see your history here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => {
                  const previousEntry = entries[index + 1]
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">
                          {moodEmojis[entry.mood_rating as keyof typeof moodEmojis]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {getDateDisplayName(entry.date)}
                            </span>
                            {getTrendIcon(entry.mood_rating, previousEntry?.mood_rating)}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {entry.notes}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(entry.created_at), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                      <Badge className={moodColors[entry.mood_rating as keyof typeof moodColors]}>
                        {entry.mood_rating}/10
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}