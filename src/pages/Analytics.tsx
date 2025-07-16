import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@blinkdotnew/sdk'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, subDays, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react'
import { storageUtils, type MoodEntry } from '../lib/storage'

const blink = createClient({
  projectId: 'daily-mood-tracker-ie6zuoc6',
  authRequired: true
})

interface ChartData {
  date: string
  mood: number
  label: string
}

const moodEmojis = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '😊',
  6: '😄', 7: '😁', 8: '😍', 9: '🤩', 10: '🥳'
}

export default function Analytics() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([])
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 0,
    trend: 0,
    totalEntries: 0,
    streakDays: 0
  })

  const loadAnalytics = useCallback(async () => {
    const processAnalytics = (entries: MoodEntry[]) => {
      if (entries.length === 0) return

      // Sort entries by date (oldest first for chart)
      const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date))

      // Create chart data for last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const entry = sortedEntries.find(e => e.date === dateStr)
        
        return {
          date: dateStr,
          mood: entry ? entry.mood_rating : null,
          label: format(date, 'MMM d')
        }
      }).filter(item => item.mood !== null) as ChartData[]

      setChartData(last30Days)

      // Create weekly data
      const weeklyStats = processWeeklyData(sortedEntries)
      setWeeklyData(weeklyStats)

      // Calculate statistics
      const ratings = entries.map(e => e.mood_rating)
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      const highest = Math.max(...ratings)
      const lowest = Math.min(...ratings)
      
      // Calculate trend (last 7 days vs previous 7 days)
      const recent7 = entries.slice(0, 7)
      const previous7 = entries.slice(7, 14)
      const recentAvg = recent7.length > 0 ? recent7.reduce((sum, e) => sum + e.mood_rating, 0) / recent7.length : 0
      const previousAvg = previous7.length > 0 ? previous7.reduce((sum, e) => sum + e.mood_rating, 0) / previous7.length : 0
      const trend = recentAvg - previousAvg

      // Calculate streak
      const streak = calculateStreak(entries)

      setStats({
        average: Math.round(average * 10) / 10,
        highest,
        lowest,
        trend: Math.round(trend * 10) / 10,
        totalEntries: entries.length,
        streakDays: streak
      })
    }

    try {
      const user = await blink.auth.me()
      
      // Get all entries from localStorage (already sorted by date desc)
      const allEntries = storageUtils.getRecentMoodEntries(user.id, 100)
      setEntries(allEntries)
      processAnalytics(allEntries)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])



  const processWeeklyData = (entries: MoodEntry[]) => {
    const weeklyMap = new Map<string, { total: number; count: number }>()

    entries.forEach(entry => {
      const date = parseISO(entry.date)
      const weekStart = startOfWeek(date)
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { total: 0, count: 0 })
      }
      
      const week = weeklyMap.get(weekKey)!
      week.total += entry.mood_rating
      week.count += 1
    })

    return Array.from(weeklyMap.entries())
      .map(([weekStart, data]) => ({
        date: weekStart,
        mood: Math.round((data.total / data.count) * 10) / 10,
        label: format(parseISO(weekStart), 'MMM d')
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8) // Last 8 weeks
  }

  const calculateStreak = (entries: MoodEntry[]) => {
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd')
      const hasEntry = entries.some(entry => entry.date === checkDate)
      
      if (hasEntry) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const getMoodDistribution = () => {
    const distribution = Array.from({ length: 10 }, (_, i) => ({
      rating: i + 1,
      count: 0,
      emoji: moodEmojis[(i + 1) as keyof typeof moodEmojis]
    }))

    entries.forEach(entry => {
      distribution[entry.mood_rating - 1].count++
    })

    return distribution.filter(item => item.count > 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No data to analyze yet</h3>
            <p className="text-muted-foreground text-center">
              Start tracking your mood daily to see insights and trends here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const moodDistribution = getMoodDistribution()

  return (
    <div className="space-y-6 page-transition">
      <h1 className="text-3xl font-bold">Analytics & Insights</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
            <div className="text-2xl">{moodEmojis[Math.round(stats.average) as keyof typeof moodEmojis]}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average}/10</div>
            <p className="text-xs text-muted-foreground">
              {stats.average >= 7 ? 'Feeling great!' : stats.average >= 5 ? 'Doing well' : 'Take care'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mood Trend</CardTitle>
            {stats.trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : stats.trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.trend > 0 ? '+' : ''}{stats.trend}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.trend > 0 ? 'Improving' : stats.trend < 0 ? 'Declining' : 'Stable'} (7-day avg)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streakDays} days</div>
            <p className="text-xs text-muted-foreground">
              Keep logging daily! 🔥
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              Range: {stats.lowest}-{stats.highest}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Mood Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[1, 10]}
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}/10`, 'Mood']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Average Mood</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[1, 10]}
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}/10`, 'Average Mood']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Bar 
                  dataKey="mood" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Mood Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {moodDistribution.map((item) => (
              <div key={item.rating} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-3xl mb-2">{item.emoji}</div>
                <div className="font-semibold">{item.rating}/10</div>
                <div className="text-sm text-muted-foreground">
                  {item.count} {item.count === 1 ? 'day' : 'days'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((item.count / entries.length) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.average >= 8 && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">🌟 Excellent Mood Pattern!</h4>
                <p className="text-green-700 text-sm">
                  Your average mood is {stats.average}/10. You're doing great! Keep up whatever you're doing.
                </p>
              </div>
            )}
            
            {stats.trend > 1 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📈 Positive Trend</h4>
                <p className="text-blue-700 text-sm">
                  Your mood has improved by {stats.trend} points over the last week. Great progress!
                </p>
              </div>
            )}
            
            {stats.trend < -1 && (
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">⚠️ Declining Trend</h4>
                <p className="text-orange-700 text-sm">
                  Your mood has declined by {Math.abs(stats.trend)} points recently. Consider self-care activities or talking to someone.
                </p>
              </div>
            )}
            
            {stats.streakDays >= 7 && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🔥 Great Consistency!</h4>
                <p className="text-purple-700 text-sm">
                  You've been tracking for {stats.streakDays} days straight. Consistency is key to understanding your patterns!
                </p>
              </div>
            )}
            
            {stats.average < 5 && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">💙 Self-Care Reminder</h4>
                <p className="text-red-700 text-sm">
                  Your average mood is {stats.average}/10. Remember to prioritize self-care and consider reaching out for support if needed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}