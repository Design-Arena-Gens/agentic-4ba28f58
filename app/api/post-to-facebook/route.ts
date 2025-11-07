import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, pageId, message } = await request.json()

    if (!accessToken || !pageId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          access_token: accessToken,
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      postId: data.id,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to post to Facebook' },
      { status: 500 }
    )
  }
}
