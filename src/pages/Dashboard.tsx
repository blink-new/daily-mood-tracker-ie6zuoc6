import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@blinkdotnew/sdk'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PlusCircle, TrendingUp, Calendar, Flame } from 'lucide-react'
import { format, isToday, subDays } from 'date-fns'
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

export default function Dashboard() {
  const [recentEntries, setRecentEntries] = useState<MoodEntry[]>([])
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null)
  const [streak, setStreak] = useState(0)
  const [averageMood, setAverageMood] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      
      // Get recent entries from localStorage
      const entries = storageUtils.getRecentMoodEntries(user.id, 7)
      setRecentEntries(entries)

      // Check if today's entry exists
      const today = format(new Date(), 'yyyy-MM-dd')
      const todaysMood = storageUtils.getMoodEntryByDate(user.id, today)
      setTodayEntry(todaysMood)

      // Calculate streak
      calculateStreak(entries)

      // Calculate average mood for last 7 days
      if (entries.length > 0) {
        const avg = entries.reduce((sum, entry) => sum + entry.mood_rating, 0) / entries.length
        setAverageMood(Math.round(avg * 10) / 10)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const calculateStreak = (entries: MoodEntry[]) => {
    let currentStreak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd')
      const hasEntry = entries.some(entry => entry.date === checkDate)
      
      if (hasEntry) {
        currentStreak++
      } else {
        break
      }
    }
    
    setStreak(currentStreak)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {!todayEntry && (
          <Link to="/entry">
            <Button className="flex items-center space-x-2">
              <PlusCircle className="h-4 w-4" />
              <span>Log Today's Mood</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up! 🔥
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center space-x-2">
              <span>{averageMood}/10</span>
              <span className="text-lg">{moodEmojis[Math.round(averageMood) as keyof typeof moodEmojis]}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {averageMood >= 7 ? 'Feeling great!' : averageMood >= 5 ? 'Doing well' : 'Take care of yourself'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Mood */}
      {todayEntry ? (
        <Card>
          <CardHeader>
            <CardTitle>Today's Mood</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{moodEmojis[todayEntry.mood_rating as keyof typeof moodEmojis]}</div>
              <div>
                <Badge className={moodColors[todayEntry.mood_rating as keyof typeof moodColors]}>
                  {todayEntry.mood_rating}/10
                </Badge>
                {todayEntry.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{todayEntry.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg font-semibold mb-2">How are you feeling today?</h3>
            <p className="text-muted-foreground text-center mb-4">
              Take a moment to reflect on your mood and log your daily entry.
            </p>
            <Link to="/entry">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Log Today's Mood
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{moodEmojis[entry.mood_rating as keyof typeof moodEmojis]}</div>
                    <div>
                      <div className="font-medium">
                        {isToday(new Date(entry.date)) ? 'Today' : format(new Date(entry.date), 'MMM d')}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={moodColors[entry.mood_rating as keyof typeof moodColors]}>
                    {entry.mood_rating}/10
                  </Badge>
                </div>
              ))}
            </div>
            {recentEntries.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/history">
                  <Button variant="outline">View All Entries</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}