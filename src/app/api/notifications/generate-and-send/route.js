import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";

let expo = new Expo();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
  try {
    const { contentType, contentTitle, contentDetails } = await req.json();

    if (!contentType || !contentTitle) {
      return NextResponse.json({ error: 'Missing content information' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("Gemini API key is not configured");
        return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    // 1. Generate Notification using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert mobile app marketing copywriter. We just approved a new piece of content on our college platform.
      Write a short, extremely engaging push notification title and body to alert students.
      
      Content Type: ${contentType}
      Title: ${contentTitle}
      Details: ${contentDetails || 'None'}
      
      Rules:
      - Title must be under 40 characters and include an emoji.
      - Body must be under 80 characters.
      - Make it sound exciting, helpful, or urgent depending on the context.
      - Do not include hashtags.
      - Output ONLY a valid JSON object in this format, nothing else (no markdown blocks):
      {
        "title": "...",
        "body": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting
    if (responseText.startsWith('```json')) {
        responseText = responseText.substring(7);
        if (responseText.endsWith('```')) {
            responseText = responseText.substring(0, responseText.length - 3);
        }
    } else if (responseText.startsWith('```')) {
        responseText = responseText.substring(3);
        if (responseText.endsWith('```')) {
            responseText = responseText.substring(0, responseText.length - 3);
        }
    }
    
    let generatedPush;
    try {
        generatedPush = JSON.parse(responseText.trim());
    } catch (e) {
        console.error("Failed to parse Gemini output:", responseText);
        // Fallback
        generatedPush = {
            title: `📢 New ${contentType} Added`,
            body: contentTitle.substring(0, 80)
        };
    }

    // 2. Fetch all users from Firestore
    const usersSnap = await getDocs(collection(db, 'users'));
    const pushTokens = [];
    
    usersSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
        pushTokens.push(userData.expoPushToken);
      }
    });

    if (pushTokens.length === 0) {
      return NextResponse.json({ message: 'No devices registered for push notifications.', generatedPush });
    }

    // 3. Construct the messages
    const messages = [];
    for (let pushToken of pushTokens) {
      messages.push({
        to: pushToken,
        sound: 'default',
        title: generatedPush.title,
        body: generatedPush.body,
        data: { contentType, contentTitle },
      });
    }

    // 4. Chunk and send the messages
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

    return NextResponse.json({ 
        success: true, 
        sentCount: messages.length, 
        generatedNotification: generatedPush,
        tickets 
    });
  } catch (error) {
    console.error('AI Push notification error:', error);
    return NextResponse.json({ error: 'Failed to generate and send notifications' }, { status: 500 });
  }
}
