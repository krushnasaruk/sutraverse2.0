import React from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  uploads: number;
  points: number;
  college: string;
  branch: string;
  year: 'FE' | 'SE' | 'TE' | 'BE';
  role: 'student' | 'teacher' | 'admin';
  profileComplete: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string, profile?: Partial<UserProfile>) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getToken: () => Promise<string | null>;
}

export declare const AuthProvider: React.FC<{ children: React.ReactNode }>;
export declare const useAuth: () => AuthContextType;
