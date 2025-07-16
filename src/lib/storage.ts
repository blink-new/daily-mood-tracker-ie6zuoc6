// Local storage utilities for mood entries
export interface MoodEntry {
  id: string
  user_id: string
  mood_rating: number
  notes?: string
  exercised: boolean
  date: string
  created_at: string
}

const STORAGE_KEY = 'mood_entries'

export const storageUtils = {
  // Get all mood entries for a user
  getMoodEntries: (userId: string): MoodEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      
      const allEntries: MoodEntry[] = JSON.parse(stored)
      return allEntries.filter(entry => entry.user_id === userId)
    } catch (error) {
      console.error('Error reading mood entries from localStorage:', error)
      return []
    }
  },

  // Save a mood entry
  saveMoodEntry: (entry: Omit<MoodEntry, 'id' | 'created_at'>): MoodEntry => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const allEntries: MoodEntry[] = stored ? JSON.parse(stored) : []
      
      const newEntry: MoodEntry = {
        ...entry,
        id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      }
      
      // Remove any existing entry for the same user and date
      const filteredEntries = allEntries.filter(
        e => !(e.user_id === entry.user_id && e.date === entry.date)
      )
      
      filteredEntries.push(newEntry)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEntries))
      
      return newEntry
    } catch (error) {
      console.error('Error saving mood entry to localStorage:', error)
      throw error
    }
  },

  // Update a mood entry
  updateMoodEntry: (id: string, updates: Partial<Pick<MoodEntry, 'mood_rating' | 'notes' | 'exercised'>>): MoodEntry | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      
      const allEntries: MoodEntry[] = JSON.parse(stored)
      const entryIndex = allEntries.findIndex(entry => entry.id === id)
      
      if (entryIndex === -1) return null
      
      allEntries[entryIndex] = {
        ...allEntries[entryIndex],
        ...updates
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allEntries))
      return allEntries[entryIndex]
    } catch (error) {
      console.error('Error updating mood entry in localStorage:', error)
      throw error
    }
  },

  // Get mood entry for a specific date
  getMoodEntryByDate: (userId: string, date: string): MoodEntry | null => {
    const entries = storageUtils.getMoodEntries(userId)
    return entries.find(entry => entry.date === date) || null
  },

  // Get recent mood entries (sorted by date desc)
  getRecentMoodEntries: (userId: string, limit: number = 7): MoodEntry[] => {
    const entries = storageUtils.getMoodEntries(userId)
    return entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }
}