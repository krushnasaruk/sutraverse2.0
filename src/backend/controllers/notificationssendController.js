import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import { adminDb } from '@/database/config/firebaseAdmin';
import { requireUser } from '@/backend/middlewares/requireUser';






var expo = new Expo();

export const handlePost_notificationssend = async (request) => {
  try {
    // ── Admin-Only Auth Gate ────────────────────────────────────────
    const { user, error: authError } = await requireUser(request, { admin: true });
    if (authError) return authError;

    const { title, body, data } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Save to Firestore notifications collection
    try {
        await adminDb.collection('notifications').add({
            title,
            body,
            type: 'alert',
            targetRoute: '/news',
            recipientId: 'global',
            timestamp: new Date()
        });
    } catch (dbErr) {
        console.error('Failed to save notification to Firestore:', dbErr);
    }

    // 1. Fetch all users from Firestore using Admin SDK for high performance
    const usersSnap = await adminDb.collection('users').get();
    const pushTokens = [];
    
    usersSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
        pushTokens.push(userData.expoPushToken);
      }
    });

    if (pushTokens.length === 0) {
      return NextResponse.json({ message: 'No devices registered for push notifications.' });
    }

    // 2. Construct the messages
    const messages = [];
    for (let pushToken of pushTokens) {
      messages.push({
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
      });
    }

    // 3. Chunk and send the messages in parallel to avoid blocking
    const chunks = expo.chunkPushNotifications(messages);
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending push chunk:', error);
          return [];
        }
      })
    );
    const tickets = results.flat();

    return NextResponse.json({ success: true, sentCount: messages.length, tickets });
  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
