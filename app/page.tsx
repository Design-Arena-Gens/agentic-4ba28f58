'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface ScheduledPost {
  id: string
  content: string
  scheduledTime: string
  status: 'pending' | 'posted' | 'failed'
}

export default function Home() {
  const [accessToken, setAccessToken] = useState('')
  const [pageId, setPageId] = useState('')
  const [postContent, setPostContent] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [message, setMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    loadSettings()
    loadScheduledPosts()
  }, [])

  const loadSettings = () => {
    const token = localStorage.getItem('fbAccessToken')
    const page = localStorage.getItem('fbPageId')
    if (token && page) {
      setAccessToken(token)
      setPageId(page)
      setIsConnected(true)
    }
  }

  const loadScheduledPosts = () => {
    const posts = localStorage.getItem('scheduledPosts')
    if (posts) {
      setScheduledPosts(JSON.parse(posts))
    }
  }

  const saveSettings = () => {
    localStorage.setItem('fbAccessToken', accessToken)
    localStorage.setItem('fbPageId', pageId)
    setIsConnected(true)
    setMessage('Settings saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const schedulePost = async () => {
    if (!postContent || !scheduledTime) {
      setMessage('Please enter post content and scheduled time')
      return
    }

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      content: postContent,
      scheduledTime: scheduledTime,
      status: 'pending'
    }

    const updatedPosts = [...scheduledPosts, newPost]
    setScheduledPosts(updatedPosts)
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts))

    setPostContent('')
    setScheduledTime('')
    setMessage('Post scheduled successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const postNow = async () => {
    if (!postContent) {
      setMessage('Please enter post content')
      return
    }

    try {
      const response = await fetch('/api/post-to-facebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          pageId,
          message: postContent,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Posted to Facebook successfully!')
        setPostContent('')
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Failed to post to Facebook')
    }
    setTimeout(() => setMessage(''), 5000)
  }

  const deletePost = (id: string) => {
    const updatedPosts = scheduledPosts.filter(post => post.id !== id)
    setScheduledPosts(updatedPosts)
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts))
  }

  const checkAndPostScheduled = async () => {
    const now = new Date()
    const updatedPosts = [...scheduledPosts]

    for (let i = 0; i < updatedPosts.length; i++) {
      const post = updatedPosts[i]
      const scheduledDate = new Date(post.scheduledTime)

      if (post.status === 'pending' && scheduledDate <= now) {
        try {
          const response = await fetch('/api/post-to-facebook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken,
              pageId,
              message: post.content,
            }),
          })

          const data = await response.json()
          updatedPosts[i].status = data.success ? 'posted' : 'failed'
        } catch (error) {
          updatedPosts[i].status = 'failed'
        }
      }
    }

    setScheduledPosts(updatedPosts)
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts))
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        checkAndPostScheduled()
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [scheduledPosts, isConnected, accessToken, pageId])

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Facebook Auto Poster Agent</h1>

      {message && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Facebook Connection</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Facebook Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Facebook Page Access Token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Facebook Page ID
            </label>
            <input
              type="text"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Facebook Page ID"
            />
          </div>
          <button
            onClick={saveSettings}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isConnected ? 'Update Connection' : 'Connect to Facebook'}
          </button>
          {isConnected && (
            <p className="text-green-600 text-center">✓ Connected to Facebook</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Create Post</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-32"
              placeholder="What's on your mind?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={postNow}
              disabled={!isConnected}
              className="flex-1 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
            >
              Post Now
            </button>
            <button
              onClick={schedulePost}
              disabled={!isConnected}
              className="flex-1 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition disabled:bg-gray-400"
            >
              Schedule Post
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Scheduled Posts</h2>
        {scheduledPosts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No scheduled posts yet</p>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      {format(new Date(post.scheduledTime), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    <p className="text-gray-800">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        post.status === 'posted'
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {post.status}
                    </span>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Go to <a href="https://developers.facebook.com/" target="_blank" className="text-blue-600 hover:underline">Facebook Developers</a></li>
          <li>Create an app and add Facebook Login and Pages API</li>
          <li>Generate a Page Access Token with <code className="bg-gray-100 px-1">pages_manage_posts</code> permission</li>
          <li>Get your Page ID from your Facebook Page settings</li>
          <li>Enter both credentials above to connect</li>
        </ol>
      </div>
    </main>
  )
}
