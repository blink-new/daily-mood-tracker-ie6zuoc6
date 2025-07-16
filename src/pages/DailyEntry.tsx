import { useState, useEffect } from 'react'
import { createClient } from '@blinkdotnew/sdk'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Slider } from '../components/ui/slider'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { format } from 'date-fns'
import { Save, ArrowLeft } from 'lucide-react'
import { storageUtils, type MoodEntry } from '../lib/storage'

const blink = createClient({
  projectId: 'daily-mood-tracker-ie6zuoc6',
  authRequired: true
})

const moodEmojis = {
  1: '😢', 2: '😞', 3: '😕', 4: '😐', 5: '😊',
  6: '😄', 7: '😁', 8: '😍', 9: '🤩', 10: '🥳'
}

const moodLabels = {
  1: 'Terrible', 2: 'Very Bad', 3: 'Bad', 4: 'Poor', 5: 'Okay',
  6: 'Good', 7: 'Great', 8: 'Excellent', 9: 'Amazing', 10: 'Perfect'
}

const moodColors = {
  1: 'bg-red-100 text-red-800', 2: 'bg-red-50 text-red-700', 3: 'bg-orange-100 text-orange-800',
  4: 'bg-yellow-100 text-yellow-800', 5: 'bg-blue-100 text-blue-800', 6: 'bg-green-100 text-green-800',
  7: 'bg-green-200 text-green-900', 8: 'bg-emerald-100 text-emerald-800',
  9: 'bg-purple-100 text-purple-800', 10: 'bg-pink-100 text-pink-800'
}

export default function DailyEntry() {
  const [moodRating, setMoodRating] = useState([5])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingEntry, setExistingEntry] = useState<MoodEntry | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    checkExistingEntry()
  }, [])

  const checkExistingEntry = async () => {
    try {
      const user = await blink.auth.me()
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const entry = storageUtils.getMoodEntryByDate(user.id, today)
      
      if (entry) {
        setExistingEntry(entry)
        setMoodRating([entry.mood_rating])
        setNotes(entry.notes || '')
      }
    } catch (error) {
      console.error('Error checking existing entry:', error)
    }
  }

  const handleSubmit = async () => {
    if (moodRating[0] < 1 || moodRating[0] > 10) {
      toast({
        title: 'Invalid Rating',
        description: 'Please select a mood rating between 1 and 10.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const user = await blink.auth.me()
      const today = format(new Date(), 'yyyy-MM-dd')

      if (existingEntry) {
        // Update existing entry
        const updatedEntry = storageUtils.updateMoodEntry(existingEntry.id, {
          mood_rating: moodRating[0],
          notes: notes.trim() || undefined
        })
        
        if (updatedEntry) {
          setExistingEntry(updatedEntry)
          toast({
            title: 'Entry Updated!',
            description: `Your mood for today has been updated to ${moodRating[0]}/10.`
          })
        }
      } else {
        // Create new entry
        const newEntry = storageUtils.saveMoodEntry({
          user_id: user.id,
          mood_rating: moodRating[0],
          notes: notes.trim() || undefined,
          date: today
        })
        
        setExistingEntry(newEntry)
        toast({
          title: 'Entry Saved!',
          description: `Your mood for today (${moodRating[0]}/10) has been recorded.`
        })
      }

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/')
      }, 1500)

    } catch (error) {
      console.error('Error saving entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to save your mood entry. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const currentMood = moodRating[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          {existingEntry ? 'Update Today\'s Mood' : 'How are you feeling today?'}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Rate Your Mood</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Mood Display */}
          <div className="text-center space-y-4">
            <div className="text-8xl">
              {moodEmojis[currentMood as keyof typeof moodEmojis]}
            </div>
            <div className="space-y-2">
              <Badge 
                className={`text-lg px-4 py-2 ${moodColors[currentMood as keyof typeof moodColors]}`}
              >
                {currentMood}/10 - {moodLabels[currentMood as keyof typeof moodLabels]}
              </Badge>
            </div>
          </div>

          {/* Mood Slider */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>😢 Terrible</span>
              <span>🥳 Perfect</span>
            </div>
            <Slider
              value={moodRating}
              onValueChange={setMoodRating}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i + 1} className="text-center">
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Mood Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(moodEmojis).map(([rating, emoji]) => (
              <Button
                key={rating}
                variant={currentMood === parseInt(rating) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMoodRating([parseInt(rating)])}
                className="flex flex-col space-y-1 h-auto py-3"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs">{rating}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Reflections</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind today? How are you feeling? What happened that influenced your mood? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {notes.length}/500 characters
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="flex items-center space-x-2 px-8"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{existingEntry ? 'Update Entry' : 'Save Entry'}</span>
            </>
          )}
        </Button>
      </div>

      {existingEntry && (
        <div className="text-center text-sm text-muted-foreground">
          You already logged your mood today. You can update it anytime.
        </div>
      )}
    </div>
  )
}