import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/database/config/firebase';

let expo = new Expo();

export async function POST(req) {
  try {
    const { title, body, data } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // 1. Fetch all users from Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
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

    // 3. Chunk and send the messages
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push chunk:', error);
      }
    }

    return NextResponse.json({ success: true, sentCount: messages.length, tickets });
  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
