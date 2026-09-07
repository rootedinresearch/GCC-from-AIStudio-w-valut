/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  Leaf, 
  MapPin, 
  Mail, 
  ChevronRight, 
  Quote, 
  BookOpen, 
  CheckCircle2,
  ArrowRight,
  Sun,
  Droplets,
  Zap,
  ThermometerSun,
  Lock,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Beaker,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  PlayCircle,
  X,
  Globe,
  Eye,
  EyeOff,
  ChevronDown,
  Star,
  Check,
  Sparkles,
  Award
} from 'lucide-react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { GRANDMA_BEATRICE, DR_GREG, ALL_CHEAT_CODES } from './constants';
import { UserProfile, LabNote, CheatCode } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-paper p-8">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border-2 border-red-100 max-w-2xl text-center">
            <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-8" />
            <h2 className="text-4xl font-bold mb-4 text-ink">Oops! A Garden Glitch.</h2>
            <p className="text-xl text-ink/80 mb-8 font-sans">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-8 py-4 rounded-full font-bold font-sans uppercase tracking-widest"
            >
              Refresh the Patch
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type View = 'public' | 'members' | 'lab' | 'tomato-codes' | 'opt-in' | 'email-sent';

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-accent/20 rounded-lg ${className}`} />
);

const CheatCodeSkeleton = () => (
  <div className="py-8 md:py-16 px-4 md:px-8 max-w-6xl mx-auto">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-6 md:gap-8">
      <div className="space-y-4 w-full md:w-1/2">
        <Skeleton className="h-12 md:h-16 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </div>
      <Skeleton className="h-16 w-full md:w-48 rounded-2xl" />
    </div>
    
    <div className="flex gap-4 mb-8">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>

    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
      </div>
      <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[32px] border border-accent space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 md:h-12 w-3/4" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<View>('public');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [activeCode, setActiveCode] = useState(0);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [localCheatCodes, setLocalCheatCodes] = useState<CheatCode[]>(ALL_CHEAT_CODES);
  
  // Temporary Bypass Mode: permits inspecting all locked codes and vault views without login
  const [isBypassMode, setIsBypassMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('gcc_preview_bypass') === 'true' || 
           window.location.search.includes('preview=bypass') || 
           window.location.search.includes('bypass=true');
  });

  const toggleBypassMode = () => {
    setIsBypassMode(prev => {
      const next = !prev;
      localStorage.setItem('gcc_preview_bypass', String(next));
      return next;
    });
  };

  // Modular Microclimate: 'dfw' for Texas Zone 8a/8b, 'national' for nationwide expansion
  const [microclimateMode, setMicroclimateMode] = useState<'dfw' | 'national'>('dfw');
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');

  // Lead Funnel Modal State
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadZip, setLeadZip] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const groupedCodes = localCheatCodes.reduce((acc, code) => {
    if (!acc[code.vegetable]) acc[code.vegetable] = [];
    acc[code.vegetable].push(code);
    return acc;
  }, {} as Record<string, CheatCode[]>);

  const vegetables = Object.keys(groupedCodes);
  const [activeVeg, setActiveVeg] = useState(vegetables[0]);

  const switchCode = (index: number) => {
    setIsSwitching(true);
    setActiveCode(index);
    setTimeout(() => setIsSwitching(false), 300);
  };

  const switchVeg = (veg: string) => {
    setIsSwitching(true);
    setActiveVeg(veg);
    setActiveCode(0);
    setTimeout(() => setIsSwitching(false), 300);
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              zipCode: '',
              isSubscribed: false,
              savedCodes: [],
              triedCodes: [],
              createdAt: Date.now()
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Check for Stripe payment redirect success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if ((paymentStatus === 'success' || paymentStatus === 'mock_success') && user) {
      const upgradeUser = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, { isSubscribed: true }, { merge: true });
          setProfile(prev => prev ? { ...prev, isSubscribed: true } : null);
          setActiveVeg('Tomato');
          setActiveCode(0);
          setView('members');
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error("Error unlocking vault:", error);
        }
      };
      upgradeUser();
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Regular sign-in doesn't force the opt-in flow unless we want to,
      // but let's keep it simple and just sign them in.
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const handleUnlockVault = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setView('members');
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const handleLeadGen = () => {
    setShowLeadModal(true);
  };

  const handleLeadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!leadEmail || !leadEmail.includes('@')) return;
    setLeadSubmitting(true);

    try {
      // 1. Post to /api/subscribe (Beehiiv / serverless integration)
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, zipCode: leadZip })
      });

      // 2. Also persist to Firestore 'subscribers' collection if available
      try {
        await addDoc(collection(db, 'subscribers'), {
          email: leadEmail,
          zipCode: leadZip,
          createdAt: Date.now(),
          source: 'tomato-cheat-codes-lead-magnet'
        });
      } catch (fsErr) {
        console.warn("Firestore subscriber store optional notice:", fsErr);
      }

      // 3. Save to localStorage
      localStorage.setItem('gcc_subscriber_email', leadEmail);
      if (leadZip) localStorage.setItem('gcc_subscriber_zip', leadZip);

      setShowLeadModal(false);
      setView('email-sent');
    } catch (err) {
      console.error("Lead submission error:", err);
      setShowLeadModal(false);
      setView('email-sent');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const toggleSaveCode = async (codeId: string) => {
    if (!user || !profile) return;
    const isSaved = profile?.savedCodes?.includes(codeId);
    const newSaved = isSaved 
      ? profile?.savedCodes?.filter(id => id !== codeId) || []
      : [...(profile?.savedCodes || []), codeId];
    
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { savedCodes: newSaved });
      setProfile({ ...profile, savedCodes: newSaved });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const toggleTriedCode = async (codeId: string) => {
    if (!user || !profile) return;
    const hasTried = profile?.triedCodes?.includes(codeId);
    if (hasTried) return; // Only allow marking as tried once

    const newTried = [...(profile?.triedCodes || []), codeId];
    const path = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { triedCodes: newTried });
      setProfile({ ...profile, triedCodes: newTried });
      
      // Increment global count (mock for now as we don't have a shared cheat_codes collection, 
      // but let's update local state to show immediate feedback)
      setLocalCheatCodes(prev => prev.map(c => c.id === codeId ? { ...c, triedCount: c.triedCount + 1 } : c));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSubscribe = async () => {
    let currentUser = user;
    if (!currentUser) {
      try {
        currentUser = await signInWithGoogle();
      } catch (error) {
        console.error("Auth error:", error);
        return;
      }
    }
    
    if (currentUser) {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error("No checkout URL returned");
        }
      } catch (error) {
        console.error("Failed to start checkout:", error);
      }
    }
  };

  const handleLabSubmit = async (trialId: string, result: string) => {
    if (!user || !result) return;
    const path = `lab_notes/${trialId}`;
    try {
      const docRef = doc(db, 'lab_notes', trialId);
      await updateDoc(docRef, {
        userResults: arrayUnion({ userId: user.uid, result: result })
      });
      alert("Result logged in the Laboratory Notebook!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (loading) return <div className="min-h-screen bg-paper"><CheatCodeSkeleton /></div>;

  const Navigation = () => (
    <nav aria-label="Main Navigation" className="border-b border-accent py-4 px-4 md:px-8 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <button 
        className="flex items-center gap-2" 
        onClick={() => setView('public')}
        
      >
        <Sprout className="text-primary w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
        <span className="text-lg md:text-2xl font-bold tracking-tight text-ink">GardenCheatCodes.org</span>
      </button>
      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden lg:flex gap-6 text-xs uppercase tracking-widest font-sans font-semibold text-primary">
          <button onClick={() => setView('public')} className="hover:text-ink transition-colors">Public</button>
          <button onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('tomato-codes'); }} className="hover:text-ink transition-colors">Free Tomato Codes</button>
          {(profile?.isSubscribed || isBypassMode) && (
            <button onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('members'); }} className="hover:text-ink transition-colors flex items-center gap-1.5">
              <span>The Vault</span>
              {isBypassMode && !profile?.isSubscribed && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">Bypass</span>}
            </button>
          )}
          <button onClick={() => setView('lab')} className="hover:text-ink transition-colors">Lab Notebook</button>
        </div>
        
        {/* Temporary Preview Bypass Mode Button */}
        <button
          onClick={toggleBypassMode}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            isBypassMode 
              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm' 
              : 'bg-accent/40 text-primary border border-accent hover:bg-accent'
          }`}
          title="Toggle Preview Bypass Mode (Inspect all locked codes without logging in)"
        >
          {isBypassMode ? (
            <>
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span>Bypass: ON</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 opacity-60" />
              <span>Bypass: OFF</span>
            </>
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm font-sans font-bold text-ink/80 hidden sm:block">{user.email}</span>
            <button 
              onClick={() => logout()} 
              className="p-2 hover:bg-accent rounded-full transition-colors"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 text-primary" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button onClick={handleSignIn} className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold font-sans uppercase tracking-widest">Sign In</button>
        )}
      </div>
    </nav>
  );

  const MobileNav = () => (
    <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-accent px-6 py-3 flex justify-between items-center z-50 pb-safe">
      <button 
        onClick={() => setView('public')}
        className={`flex flex-col items-center gap-1 ${view === 'public' ? 'text-primary' : 'text-ink/70'}`}
        aria-current={view === 'public' ? 'page' : undefined}
      >
        <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-tighter">Home</span>
      </button>
      <button 
        onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('tomato-codes'); }}
        className={`flex flex-col items-center gap-1 ${view === 'tomato-codes' ? 'text-primary' : 'text-ink/70'}`}
        aria-current={view === 'tomato-codes' ? 'page' : undefined}
      >
        <BookOpen className="w-5 h-5" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-tighter">Free</span>
      </button>
      {(profile?.isSubscribed || isBypassMode) && (
        <button 
          onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('members'); }}
          className={`flex flex-col items-center gap-1 ${view === 'members' ? 'text-primary' : 'text-ink/70'}`}
          aria-current={view === 'members' ? 'page' : undefined}
        >
          <Lock className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-tighter">Vault</span>
        </button>
      )}
      <button 
        onClick={() => setView('lab')}
        className={`flex flex-col items-center gap-1 ${view === 'lab' ? 'text-primary' : 'text-ink/70'}`}
        
        aria-current={view === 'lab' ? 'page' : undefined}
      >
        <Beaker className="w-5 h-5" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-tighter">Lab</span>
      </button>
    </nav>
  );

  const handleConsent = async () => {
    await handleLeadSubmit();
  };

  const OptInView = () => (
    <div className="py-16 md:py-24 px-4 max-w-md mx-auto text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-3xl md:text-4xl font-light mb-4 text-ink">Get The Free Tomato Codes</h2>
      <p className="text-base text-ink/80 mb-8 font-sans leading-relaxed">
        Enter your email to receive our field-tested Tomato Cheat Codes, plus seasonal frost and heat alerts.
      </p>
      
      <form onSubmit={handleLeadSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1 font-sans">
            Email Address *
          </label>
          <input 
            type="email" 
            required
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-3.5 rounded-xl border border-accent bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1 font-sans">
            ZIP Code (Optional)
          </label>
          <input 
            type="text" 
            value={leadZip}
            onChange={(e) => setLeadZip(e.target.value)}
            placeholder="e.g. 76102 for microclimate timing"
            className="w-full px-4 py-3.5 rounded-xl border border-accent bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans text-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={leadSubmitting || !leadEmail}
          className="w-full bg-primary text-white py-4 rounded-full font-bold font-sans text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] disabled:opacity-50"
        >
          {leadSubmitting ? 'Subscribing...' : '📩 Send Me the Codes'}
        </button>
      </form>

      <button
        onClick={() => setView('public')}
        className="text-xs text-ink/60 hover:text-ink font-sans underline mt-6 inline-block"
      >
        No thanks, take me back
      </button>
    </div>
  );

  const EmailSentView = () => {
    const subscriberEmail = leadEmail || user?.email || (typeof window !== 'undefined' ? localStorage.getItem('gcc_subscriber_email') : '') || 'your email';

    return (
      <div className="py-16 md:py-24 px-4 max-w-2xl mx-auto text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-ink leading-tight">Codes Are In Your Inbox!</h2>
        <p className="text-base md:text-lg text-ink/80 mb-8 font-sans leading-relaxed">
          We've just sent the free Tomato Cheat Codes to <strong>{subscriberEmail}</strong>. 
          Your email has been added to our subscriber database.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button 
            onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('tomato-codes'); }}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-bold font-sans text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            🍅 Read Free Tomato Codes Now <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setView('members')}
            className="w-full sm:w-auto px-6 py-4 bg-white border border-accent text-ink/80 rounded-full font-bold font-sans text-sm hover:border-primary transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Preview Locked Vault Catalog</span>
          </button>
        </div>

        <div className="bg-[#131628] text-white p-6 md:p-8 rounded-[32px] border border-amber-400/30 relative overflow-hidden text-left shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Lock className="w-32 h-32 text-amber-400" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3 border border-amber-400/30">
            <Lock className="w-3 h-3" />
            <span>Exclusive Member Vault (Locked)</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white mb-2 relative z-10">
            Want All 480+ Cheat Codes Across All Crops?
          </h3>
          <p className="text-sm text-slate-300 mb-6 font-sans relative z-10 leading-relaxed max-w-xl">
            The free guide includes the 8 Tomato Codes. The Full Vault unlocks 480+ peer-reviewed dossiers for sweet corn, okra, peppers, squash, soil biology, and Texas Zone 8a heat-bypass timing.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <button 
              onClick={handleSubscribe}
              className="w-full sm:w-auto px-8 py-4 bg-[#F6D234] hover:bg-[#E0BD18] text-[#131628] rounded-full font-black font-sans text-sm uppercase tracking-wider transition-all shadow-lg hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Unlock Lifetime Vault Pass ($37)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('members')}
              className="text-xs text-slate-400 hover:text-white underline font-sans py-2"
            >
              Inspect locked code list →
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FaqAccordionItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border border-slate-700/60 rounded-2xl bg-[#191D34] overflow-hidden transition-all">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-5 sm:p-6 flex justify-between items-center gap-4 hover:bg-[#202542] transition-colors"
        >
          <span className="font-bold text-base sm:text-lg text-white font-sans">{question}</span>
          <ChevronDown className={`w-5 h-5 text-amber-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-slate-300 font-sans leading-relaxed border-t border-slate-700/40 pt-4">
            {answer}
          </div>
        )}
      </div>
    );
  };

  const PublicView = () => (
    <div className="animate-in fade-in duration-700 bg-paper">
      {/* Top Urgency Announcement Bar */}
      <div className="bg-[#131628] border-b border-amber-400/20 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-sans font-bold tracking-wide flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-300 uppercase tracking-wider font-mono">2026 Growing Season:</span>
        <span>Texas Zone 8a &amp; Nationwide Microclimate Editions Live</span>
      </div>

      {/* Hero Section (Hormozi Dark Navy & Gold Style) */}
      <section className="bg-[#131628] text-white py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-0" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 font-sans">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generational Field Secrets × 328+ Peer-Reviewed Studies</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] uppercase mb-6 font-sans text-white">
              Stop Guessing. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6D234] via-amber-200 to-amber-400">
                Harvest 300% More Food
              </span> <br />
              Without Wasting Years On Bad Advice.
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-sans leading-relaxed mb-8 max-w-3xl mx-auto">
              We took 80 years of inherited backyard secrets and pressure-tested every single trick against 328+ university agronomic studies. No chemical sales pitches. Just the battle-tested cheat codes to grow bigger, sweeter, and more resilient crops—even in 105°F heat and heavy clay.
            </p>

            {/* Trust Pill */}
            <div className="flex items-center justify-center gap-2 mb-8 text-amber-300 text-sm font-sans font-bold">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-white">4.9/5 Rating</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">1,400+ Backyard Growers &amp; Master Gardeners</span>
            </div>

            {/* Hormozi High-Impact Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto mb-4">
              <button 
                onClick={handleLeadGen}
                className="w-full sm:w-auto px-8 py-5 rounded-full bg-[#F6D234] hover:bg-[#E0BD18] text-[#131628] font-sans font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_0_35px_rgba(246,210,52,0.45)] hover:scale-[1.03] transition-all flex items-center justify-center gap-2"
              >
                <span>Get Free Tomato Codes (Instant)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  const el = document.getElementById('vault-offer');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setView('members');
                }}
                className="w-full sm:w-auto px-6 py-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans font-bold text-base sm:text-lg uppercase tracking-wider transition-all"
              >
                <span>Unlock Full Vault ($37)</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-400 font-sans">
              Instant access • 8 field-tested tomato codes • No credit card required
            </p>
          </div>

          {/* Hero Visual Preview with Floating Verification Cards */}
          <div className="relative max-w-4xl mx-auto mt-6">
            <div className="relative rounded-[32px] overflow-hidden border border-slate-700 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=1400" 
                alt="Thriving backyard vegetable garden with raised beds and heavy tomato yields"
                className="w-full aspect-[16/9] object-cover contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131628] via-transparent to-transparent opacity-90" />
            </div>

            {/* Floating Proof Cards */}
            <div className="absolute -top-4 -left-4 sm:top-6 sm:-left-8 bg-[#191D34]/95 border border-amber-400/40 p-3 sm:p-4 rounded-2xl shadow-xl hidden md:block max-w-[220px]">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Code #108 Verified</span>
              </div>
              <p className="text-xs text-white font-serif italic">"Bury 2/3 of the stem for +300% root mass in dry spells."</p>
              <span className="text-[10px] text-slate-400 font-sans block mt-1">Confirmed by Texas A&amp;M Trials</span>
            </div>

            <div className="absolute -top-4 -right-4 sm:top-6 sm:-right-8 bg-[#191D34]/95 border border-amber-400/40 p-3 sm:p-4 rounded-2xl shadow-xl hidden md:block max-w-[220px]">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1 font-sans">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Code #42 Verified</span>
              </div>
              <p className="text-xs text-white font-serif italic">"Aspirin spray SAR trigger prevents heat-induced blossom drop."</p>
              <span className="text-[10px] text-slate-400 font-sans block mt-1">Confirmed by USDA Hort. Lab</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Verified Social Proof / Reviews Grid */}
      <section className="py-16 sm:py-24 bg-white border-b border-accent">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">
              Field-Tested Results
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-ink">
              What Backyard Growers Are Saying
            </h2>
            <p className="text-base sm:text-lg text-ink/75 font-sans mt-3">
              Real gardeners growing in real soil—from Texas Zone 8a heat to backyard plots nationwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                quote: "The aspirin spray protocol alone saved my entire July tomato crop from blossom drop when it hit 104°F in Fort Worth. Paid for itself 10x over.",
                name: "Michael R.",
                badge: "Verified Grower • Fort Worth, TX",
                crop: "Tomatoes"
              },
              {
                quote: "I spent 4 years reading generic gardening blogs and losing cucumber vines to bacterial wilt. Code #42 changed everything in 2 weeks.",
                name: "Sarah T.",
                badge: "Zone 8a Grower • Tyler, TX",
                crop: "Cucumbers"
              },
              {
                quote: "Having the actual scientific study citations alongside the heritage trick gave me complete confidence. My sweet corn yield doubled this season.",
                name: "David K.",
                badge: "Home Gardener • Plano, TX",
                crop: "Sweet Corn"
              },
              {
                quote: "Ancestral intuition meets university research. This is the only gardening resource I keep open on my phone while out in the dirt.",
                name: "Brenda M.",
                badge: "Master Gardener • Dallas, TX",
                crop: "All Crops"
              }
            ].map((review, i) => (
              <div key={i} className="p-6 rounded-3xl bg-paper border border-accent flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div>
                  <div className="flex gap-1 text-amber-500 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base italic text-ink font-serif leading-relaxed mb-6">
                    "{review.quote}"
                  </p>
                </div>
                <div className="border-t border-accent pt-4">
                  <p className="font-bold text-sm text-ink font-sans">{review.name}</p>
                  <p className="text-xs text-primary font-bold font-sans uppercase tracking-wider mt-0.5">{review.badge}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Callout (The Brutal Truth: Why Gardens Fail) */}
      <section className="py-16 sm:py-24 bg-[#131628] text-white px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-sans block mb-3">
              The Root Cause
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans leading-tight">
              Your Garden Isn't Failing Because You Lack a "Green Thumb".
            </h2>
            <p className="text-base sm:text-xl text-slate-300 font-sans mt-4 leading-relaxed">
              It's a process problem. You've been following generic internet advice written by content farms that has never been tested in actual summer conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-red-500/30">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xl mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">1. Generic Internet Advice</h3>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Most gardening blogs rehash advice written for cool northern climates. Follow that in Texas or the South and your vines will bake to a crisp by July 4th.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-red-500/30">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xl mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">2. Untested Folk Myths</h3>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Spreading baking soda, eggshells, or epsom salts blindly without knowing the soil chemistry causes osmotic shock and suffocates root hair development.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-red-500/30">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-black text-xl mb-4">
                ✕
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-sans">3. The Big-Box Chemical Trap</h3>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Nurseries sell you high-nitrogen synthetic fertilizers that give rapid green growth but destroy native soil mycorrhizae, leaving plants defenseless to heat.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/40 text-center">
            <p className="text-lg sm:text-xl font-bold text-white font-sans">
              The Antidote: 80 years of generational field lore verified by 328+ empirical agronomic trials.
            </p>
          </div>
        </div>
      </section>

      {/* The 3 Core Pillars (Hormozi Grand Slam System) */}
      <section className="py-16 sm:py-24 bg-paper px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">
              The Grand Slam Framework
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-ink">
              How The Cheat Code System Works
            </h2>
            <p className="text-base sm:text-lg text-ink/75 font-sans mt-3">
              We eliminated the guesswork by uniting ancestral field experience with empirical lab data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-accent shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary mb-6">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">Pillar 01 · The What</span>
                <h3 className="text-2xl font-bold text-ink mb-3">Ancestral Field Lore</h3>
                <p className="text-sm text-ink/75 font-sans leading-relaxed">
                  Decades of inherited planting techniques, morning pollinator shakes, and sucker pruning secrets handed down through generations of master growers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-accent text-xs font-bold text-ink/60 font-sans uppercase tracking-wider">
                500+ Documented Field Secrets
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-accent shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Beaker className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">Pillar 02 · The Why &amp; How</span>
                <h3 className="text-2xl font-bold text-ink mb-3">Agronomic Science</h3>
                <p className="text-sm text-ink/75 font-sans leading-relaxed">
                  328+ peer-reviewed agronomic papers from Texas A&amp;M, UC Davis, and USDA labs proving the exact cellular mechanisms, root growth, and SAR triggers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-accent text-xs font-bold text-ink/60 font-sans uppercase tracking-wider">
                328+ Peer-Reviewed Study Dossiers
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-accent shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary mb-6">
                  <ThermometerSun className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">Pillar 03 · The When</span>
                <h3 className="text-2xl font-bold text-ink mb-3">Microclimate Timing</h3>
                <p className="text-sm text-ink/75 font-sans leading-relaxed">
                  Precision planting calendars, heat-stress survival schedules, and two-season reset protocols engineered specifically for Texas Zone 8a and nationwide expansion.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-accent text-xs font-bold text-ink/60 font-sans uppercase tracking-wider">
                Texas Zone 8a &amp; USDA Zones 4–10
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vegetable Vault Directory Preview */}
      <section className="py-16 sm:py-24 bg-white border-y border-accent px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans block mb-2">
              Complete Harvest Coverage
            </span>
            <h2 className="text-3xl sm:text-5xl font-light text-ink">
              Inside The 480+ Cheat Code Catalog
            </h2>
            <p className="text-base sm:text-lg text-ink/75 font-sans mt-3">
              Not just tomatoes. The Vault covers every essential crop in your backyard garden.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {[
              { name: "Tomatoes", count: "50+ Codes", sample: "Deep Stem Root Explosion" },
              { name: "Sweet Corn", count: "35+ Codes", sample: "Double-Row Pollination Block" },
              { name: "Peppers", count: "38+ Codes", sample: "Epsom Foliar Blossom Boost" },
              { name: "Cucumbers", count: "40+ Codes", sample: "Vertical Trellis Mildew Defense" },
              { name: "Squash & Zucchini", count: "30+ Codes", sample: "Vine Borer Stem Shield" },
              { name: "Okra", count: "25+ Codes", sample: "105°F Heat Harvest Multiplier" },
              { name: "Carrots", count: "28+ Codes", sample: "Board Germination Moisture Lock" },
              { name: "Soil & Sprays", count: "50+ Codes", sample: "Aspirin SAR Foliar Drench" }
            ].map((veg, i) => (
              <div key={i} className="p-5 sm:p-6 rounded-2xl bg-paper border border-accent flex flex-col justify-between hover:border-primary transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary font-sans">{veg.count}</span>
                    <Lock className="w-3.5 h-3.5 text-ink/40" />
                  </div>
                  <h4 className="font-bold text-lg sm:text-xl text-ink mb-1">{veg.name}</h4>
                  <p className="text-xs text-ink/70 font-sans italic">"{veg.sample}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('tomato-codes'); }}
              className="text-primary font-bold font-sans uppercase tracking-widest inline-flex items-center gap-2 hover:gap-3 transition-all text-sm"
            >
              <span>Explore The 8 Free Tomato Codes First</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* The Grand Slam Value Stack & Pricing Card ($37 Lifetime Access) */}
      <section id="vault-offer" className="py-16 sm:py-24 bg-[#131628] text-white px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-b from-[#1C203C] to-[#14172B] border-2 border-amber-400/40 rounded-[36px] sm:rounded-[48px] p-6 sm:p-12 md:p-16 shadow-[0_0_60px_rgba(246,210,52,0.15)] relative overflow-hidden">
            {/* Background badge */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 font-sans">
                <Award className="w-4 h-4 text-amber-400" />
                <span>The Grand Slam Offer · Lifetime Access</span>
              </div>
              
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white font-sans leading-tight">
                Unlock The Full 480+ Cheat Code Vault
              </h2>
              <p className="text-base sm:text-lg text-slate-300 font-sans mt-3 max-w-2xl mx-auto">
                One payment. Lifetime access. Zero recurring subscriptions. All 10 vegetables, university study dossiers, and regional calendars included.
              </p>
            </div>

            {/* The Itemized Value Stack */}
            <div className="space-y-4 mb-10 max-w-2xl mx-auto">
              {[
                { title: "Complete 480+ Vegetable Cheat Code Library", desc: "Every code unlocked across all 10 vegetable categories", val: "$197 Value" },
                { title: "328+ Peer-Reviewed Research Dossiers", desc: "Direct university citations, biochemical breakdowns & exact ratios", val: "$147 Value" },
                { title: "Texas Zone 8a & Nationwide Seasonal Calendars", desc: "Never miss a spring planting or fall reset window again", val: "$97 Value" },
                { title: "Backyard Laboratory Notebook & Active Trials", desc: "Access to ongoing community soil and foliar experiments", val: "$47 Value" },
                { title: "Free Lifetime Updates & 2026 Revision Pack", desc: "All newly verified codes and study additions added automatically", val: "$97 Value" }
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base font-sans">{item.title}</h4>
                      <p className="text-xs text-slate-400 font-sans">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-300/80 font-sans shrink-0 uppercase tracking-wider">{item.val}</span>
                </div>
              ))}
            </div>

            {/* Price Box */}
            <div className="text-center p-6 sm:p-8 rounded-3xl bg-black/40 border border-amber-400/30 max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 font-sans block mb-1">
                Total Combined Retail Value: <span className="line-through text-slate-500">$585</span>
              </span>
              <div className="flex items-baseline justify-center gap-3 my-2">
                <span className="text-5xl sm:text-7xl font-black text-white font-sans">$37</span>
                <span className="text-lg text-slate-400 line-through font-sans">$197</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-bold font-sans">Save 81% Today</span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                One-time payment • Instant digital access • Works on phone, tablet &amp; desktop
              </p>

              <button 
                onClick={handleSubscribe}
                className="w-full mt-6 py-5 px-8 rounded-full bg-[#F6D234] hover:bg-[#E0BD18] text-[#131628] font-sans font-black text-lg sm:text-xl uppercase tracking-wider shadow-[0_0_40px_rgba(246,210,52,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>Unlock The Full Vault ($37)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Hormozi 100% "More Food In Your Basket" Double Guarantee */}
            <div className="p-6 sm:p-8 rounded-3xl bg-amber-400/10 border border-amber-400/30 max-w-2xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-amber-300 font-sans uppercase tracking-wider mb-2">
                  The Hormozi 100% "More Food In Your Basket" Double Guarantee
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  Put the Cheat Codes to work in your garden for an entire growing season. Test the deep planting root hack, the aspirin foliar drench, and the morning pollination shake. If you don't harvest noticeably more food with fewer plant losses, email us anytime within 30 days for an immediate 100% refund. You keep all the codes and field guides anyway. Zero risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Accordion) */}
      <section className="py-16 sm:py-24 bg-[#131628] text-white border-t border-slate-800 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-sans block mb-2">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <FaqAccordionItem 
              question="Will these cheat codes work in my climate and soil type?" 
              answer="Yes. The cheat codes are organized by root physics and biochemical triggers that apply to all soil types. Furthermore, our microclimate toggle allows you to view exact planting dates and heat-stress bypass formulas tailored for both Texas Zone 8a/8b and nationwide USDA Zones 4 through 10."
            />
            <FaqAccordionItem 
              question="What is the difference between the Free Tomato Codes and The Vault?" 
              answer="The Free Tomato Codes give you immediate access to 8 foundational tomato field codes. The Full Vault unlocks all 480+ codes across 10 crops (sweet corn, peppers, squash, okra, cucumbers, carrots, and soil biology), complete 328+ university study dossiers, and active laboratory protocols."
            />
            <FaqAccordionItem 
              question="Is this a recurring subscription or a one-time purchase?" 
              answer="The $37 Lifetime Pass is a strictly one-time payment. There are no recurring monthly or annual charges. All future cheat code additions and research updates are included free."
            />
            <FaqAccordionItem 
              question="I'm a beginner gardener. Is this too scientific for me?" 
              answer="Not at all. Each cheat code is written in plain English with simple, actionable step-by-step instructions (e.g. exactly how many tablespoons of epsom salt or aspirin to mix per gallon of water). We include the peer-reviewed citations so you know it's backed by science, but the instructions themselves take 30 seconds to read and execute."
            />
            <FaqAccordionItem 
              question="How do I access The Vault after purchasing?" 
              answer="Immediately after completing your secure checkout, your account is automatically upgraded and unlocked. You can access the entire Vault library instantly on your phone, tablet, or laptop anytime."
            />
            <FaqAccordionItem 
              question="What if the cheat codes don't work for my garden?" 
              answer="You are protected by our 100% 'More Food In Your Basket' Double Guarantee. If you test the codes and don't see a noticeable improvement in your harvest, simply email us and we'll refund your $37 immediately. You keep the guides and access anyway."
            />
          </div>
        </div>
      </section>

      {/* Final Urgency Call-to-Action Bar */}
      <section className="py-16 sm:py-20 bg-white border-t border-accent px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-light text-ink mb-4">
            Don't Waste Another Season On Guesswork.
          </h2>
          <p className="text-base sm:text-lg text-ink/75 font-sans mb-8">
            Get the free tomato codes today or unlock the full 480+ cheat code vault for lifetime access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleLeadGen}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-bold font-sans text-base hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Get Free Tomato Codes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSubscribe}
              className="w-full sm:w-auto px-8 py-4 bg-[#131628] hover:bg-black text-white rounded-full font-bold font-sans text-base transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Unlock Full Vault ($37)</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  const TomatoCheatCodesView = () => {
    const tomatoCodes = groupedCodes['Tomato'] || [];
    const freeCodesLimit = 8;
    
    const currentCodes = groupedCodes[activeVeg] || [];
    const isTomato = activeVeg === 'Tomato';
    
    const sidebarCodes = isTomato ? tomatoCodes : currentCodes;
    const activeCheat = sidebarCodes[activeCode] || sidebarCodes[0] || ALL_CHEAT_CODES[0];
    const isLocked = !isBypassMode && (!isTomato || activeCode >= freeCodesLimit);

    return (
      <div className="py-8 md:py-16 px-4 md:px-8 max-w-6xl mx-auto animate-in slide-in-from-bottom duration-500">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-primary text-white text-xs md:text-sm font-bold uppercase tracking-widest mb-4 md:mb-6">
            Member Preview
          </div>
          <h2 className="text-4xl md:text-6xl font-light mb-4 md:mb-6">Free <span className="italic text-primary">Tomato Cheat Codes</span></h2>
          <p className="text-lg md:text-xl text-ink/80 mb-8 md:mb-12 font-sans max-w-2xl mx-auto">
            You've unlocked the first 8 codes. These are the foundation of a legendary harvest. To see the remaining 42+ tomato secrets and the full 500+ code Vault, upgrade below.
          </p>
        </div>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar">
          {vegetables.map(veg => (
            <button 
              key={veg}
              onClick={() => switchVeg(veg)}
              className={`px-4 md:px-6 py-2 rounded-full font-sans font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeVeg === veg ? 'bg-primary text-white' : 'bg-white border border-accent text-ink/70 hover:border-primary'}`}
            >
              {veg} {!isBypassMode && veg !== 'Tomato' && <Lock className="w-3 h-3 inline ml-1 opacity-60" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16 md:mb-24">
          <div className="lg:col-span-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
            {sidebarCodes.map((code, i) => {
              const codeLocked = !isBypassMode && (!isTomato || i >= freeCodesLimit);
              return (
                <button 
                  key={i}
                  onClick={() => switchCode(i)}
                  className={`shrink-0 w-64 lg:w-full text-left p-4 md:p-6 rounded-2xl border transition-all flex justify-between items-center ${activeCode === i ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-accent hover:border-primary'}`}
                  aria-label={`${code.topic}${codeLocked ? ' (Locked)' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {codeLocked && <Lock className={`w-4 h-4 ${activeCode === i ? 'text-white/60' : 'text-primary'}`} aria-hidden="true" />}
                    <span className="font-bold text-sm md:text-base">{code.topic}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 md:w-5 h-5 ${activeCode === i ? 'text-white' : 'text-primary'}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {isSwitching ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 md:p-10 rounded-[32px] border border-accent shadow-sm space-y-8"
                >
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-10 md:h-12 w-3/4" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-full" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </motion.div>
              ) : isLocked ? (
                <motion.div 
                  key="locked"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-6 md:p-10 rounded-[32px] border border-accent shadow-sm relative overflow-hidden"
                >
                  <div className="py-12 md:py-20 text-center space-y-6 md:space-y-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
                      <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold">This Code is Locked</h3>
                    <p className="text-lg md:text-xl text-ink/80 font-sans max-w-md mx-auto">
                      {isTomato 
                        ? "You've reached the end of the free preview. Unlock the remaining 42+ tomato secrets by joining the Vault."
                        : `The full ${activeVeg} library is reserved for our members. Join today to unlock 500+ codes for all vegetables.`}
                    </p>
                    <button 
                      onClick={() => {
                        const element = document.getElementById('upgrade-section');
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-primary text-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold font-sans uppercase tracking-widest hover:scale-105 transition-transform text-xs md:text-sm"
                    >
                      Unlock the Full Vault
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key={`${activeVeg}-${activeCode}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-10 rounded-[32px] border border-accent shadow-sm relative overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 md:mb-8">
                      <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        activeCheat.consensus === 'supported' ? 'bg-green-100 text-green-700' :
                        activeCheat.consensus === 'disagreement' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {activeCheat.consensus.replace('-', ' ')}
                      </span>
                      <h3 className="text-3xl md:text-4xl font-bold leading-tight">{activeCheat.topic}</h3>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8">
                      <button 
                        onClick={() => toggleSaveCode(activeCheat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
                          profile?.savedCodes?.includes(activeCheat.id) ? 'bg-primary text-white border-primary' : 'bg-white border-accent text-ink/70 hover:border-primary'
                        }`}
                      >
                        {profile?.savedCodes?.includes(activeCheat.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {profile?.savedCodes?.includes(activeCheat.id) ? 'Saved' : 'Save'}
                      </button>
                      <button 
                        onClick={() => toggleTriedCode(activeCheat.id)}
                        disabled={profile?.triedCodes?.includes(activeCheat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
                          profile?.triedCodes?.includes(activeCheat.id) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-accent text-primary hover:border-primary'
                        }`}
                      >
                        <PlayCircle className="w-4 h-4" />
                        {profile?.triedCodes?.includes(activeCheat.id) ? 'Tried It' : 'Try This'}
                      </button>
                      <div className="flex items-center gap-2 text-xs md:text-sm font-sans text-ink/70 ml-auto">
                        <Users className="w-4 h-4" />
                        <span>{activeCheat.triedCount} tried this</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/60 flex items-center justify-center text-primary border border-accent">
                            <Leaf className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-sans font-bold uppercase tracking-widest text-primary">The Old Ways</p>
                            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider">Generational Lore &amp; Inherited Secrets</p>
                          </div>
                        </div>
                        <p className="text-lg md:text-xl italic text-ink leading-relaxed">"{activeCheat.beatrice}"</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Beaker className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-sans font-bold uppercase tracking-widest text-ink/80">Horticultural Science</p>
                            <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider">Peer-Reviewed Research Findings</p>
                          </div>
                        </div>
                        <p className="text-base md:text-lg text-ink/70 font-sans leading-relaxed">{activeCheat.greg}</p>
                      </div>
                    </div>

                    {activeCheat.study && (
                      <div className="bg-accent/20 p-6 md:p-8 rounded-2xl border border-accent/50 space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Beaker className="w-5 h-5" aria-hidden="true" />
                          <h4 className="font-sans font-bold uppercase tracking-widest text-xs">Scientific Citation</h4>
                        </div>
                        <div>
                          <p className="font-bold text-ink text-sm md:text-base">{activeCheat.study?.title}</p>
                          <p className="text-xs md:text-sm text-ink/70 font-sans mb-4">{activeCheat.study?.source}</p>
                          <div className="grid sm:grid-cols-2 gap-6 text-xs md:text-sm">
                            <div>
                              <p className="font-bold text-primary mb-1">The Outcome</p>
                              <p className="text-ink/70 font-sans">{activeCheat.study?.outcome}</p>
                            </div>
                            <div>
                              <p className="font-bold text-primary mb-1">Backyard Application</p>
                              <p className="text-ink/70 font-sans">{activeCheat.study?.application}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sales Funnel */}
        <div id="upgrade-section" className="bg-ink text-white p-8 md:p-16 rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <ShieldCheck className="w-48 md:w-64 h-48 md:h-64 rotate-12" />
          </div>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-5xl font-light mb-6 md:mb-8 leading-tight">
                Unlock the <span className="italic text-primary">Full Vault</span> & Join the Trials.
              </h3>
              <ul className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                {[
                  "Access to 50+ additional Tomato Cheat Codes",
                  "The complete 500+ code Vault for all vegetables",
                  "7-Day 'No-Questions-Asked' Refund Policy",
                  "Full access to the Laboratory Notebook & Trials",
                  "Early Access to the DFW Master Class Road Show"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 md:gap-4 items-center text-white/80 font-sans text-sm md:text-base">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={handleSubscribe}
                className="w-full sm:w-auto bg-primary text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-sans font-bold text-lg md:text-2xl shadow-xl hover:scale-105 transition-transform"
              >
                Upgrade to Full Access
              </button>
              <p className="mt-6 text-white/80 text-xs md:text-sm font-sans">
                Join 1,200+ master gardeners in the DFW area.
              </p>
            </div>
            <div className="bg-white/5 p-6 md:p-10 rounded-2xl md:rounded-[32px] border border-white/10 backdrop-blur-sm">
              <h4 className="text-lg md:text-2xl font-bold mb-6 italic leading-relaxed">"The best $37 I've ever spent on my garden. The aspirin trick alone saved my entire crop last July."</h4>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent" />
                <div>
                  <p className="font-bold text-sm md:text-base">Michael R.</p>
                  <p className="text-xs md:text-sm text-white/80 uppercase tracking-widest font-sans">Verified Member • Fort Worth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MembersView = () => {
    const isUnlocked = Boolean(profile?.isSubscribed || isBypassMode);
    const rawCodes = groupedCodes[activeVeg] || [];
    const currentCodes = vaultSearchQuery.trim()
      ? rawCodes.filter(c => 
          c.topic.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
          c.beatrice.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
          c.greg.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
          (c.study?.title && c.study.title.toLowerCase().includes(vaultSearchQuery.toLowerCase()))
        )
      : rawCodes;
    const activeCheat = currentCodes[activeCode] || currentCodes[0] || ALL_CHEAT_CODES[0];

    return (
      <div className="py-8 md:py-16 px-4 md:px-8 max-w-6xl mx-auto animate-in slide-in-from-bottom duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6 md:gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              {microclimateMode === 'dfw' ? 'Texas & Gulf South Zone 8a Edition' : 'National USDA Zones 4–10 Edition'}
              {!isUnlocked && (
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-300">
                  🔒 Locked Preview
                </span>
              )}
            </div>
            <h2 className="text-4xl md:text-6xl font-light mb-4">The Vault</h2>
            <p className="text-base md:text-xl text-ink/80 font-sans max-w-xl">
              {isUnlocked 
                ? `Welcome, Member. Here are the verified Cheat Codes for ${microclimateMode === 'dfw' ? 'your Texas microclimate' : 'backyard food growers nationwide'}. Validating generations of inherited folk wisdom against empirical horticultural research.`
                : `You are previewing the Member Vault directory. Free accounts include the 8 Tomato Codes. Upgrade to unlock all 480+ codes across all crops and research dossiers.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="bg-white p-3 md:p-4 rounded-2xl border border-accent shadow-sm flex items-center justify-between gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <div className="bg-accent p-2 rounded-lg">
                  {microclimateMode === 'dfw' ? (
                    <MapPin className="text-primary w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                  ) : (
                    <Globe className="text-primary w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm uppercase tracking-widest font-bold text-primary">
                    {microclimateMode === 'dfw' ? 'Regional Targeting' : 'Nationwide Edition'}
                  </p>
                  <p className="text-xs md:text-sm font-sans font-bold">
                    {microclimateMode === 'dfw' ? 'Dallas-Fort Worth (8a/8b)' : 'All USDA Zones (4–10)'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMicroclimateMode(prev => prev === 'dfw' ? 'national' : 'dfw')}
                className="text-xs font-sans font-bold text-primary hover:text-ink underline ml-2 px-2.5 py-1.5 bg-accent/40 rounded-lg whitespace-nowrap transition-colors"
                title="Toggle between Regional Texas Microclimate and Nationwide Edition"
              >
                Switch to {microclimateMode === 'dfw' ? 'Nationwide' : 'Zone 8a'} ⇄
              </button>
            </div>
          </div>
        </div>

        {/* Vault Search Input */}
        <div className="mb-8 relative max-w-xl">
          <input
            type="text"
            value={vaultSearchQuery}
            onChange={(e) => {
              setVaultSearchQuery(e.target.value);
              setActiveCode(0);
            }}
            placeholder={`Search ${activeVeg} codes, remedies, citations, or symptoms...`}
            className="w-full pl-5 pr-10 py-3 rounded-full border border-accent bg-white text-sm font-sans text-ink focus:ring-2 focus:ring-primary outline-none shadow-sm"
          />
          {vaultSearchQuery ? (
            <button 
              onClick={() => setVaultSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink/40">🔍</span>
          )}
        </div>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar">
          {vegetables.map(veg => (
            <button 
              key={veg}
              onClick={() => switchVeg(veg)}
              className={`px-4 md:px-6 py-2 rounded-full font-sans font-bold text-xs md:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${activeVeg === veg ? 'bg-primary text-white' : 'bg-white border border-accent text-ink/70 hover:border-primary'}`}
            >
              <span>{veg}</span>
              {!isUnlocked && <Lock className="w-3 h-3 opacity-60" />}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar">
            {currentCodes.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-accent text-center text-xs font-sans text-ink/60">
                No codes found matching "{vaultSearchQuery}".
              </div>
            ) : (
              currentCodes.map((code, i) => (
                <button 
                  key={i}
                  onClick={() => switchCode(i)}
                  className={`shrink-0 w-64 lg:w-full text-left p-4 md:p-6 rounded-2xl border transition-all flex justify-between items-center ${activeCode === i ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white border-accent hover:border-primary'}`}
                  aria-label={code.topic}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {!isUnlocked && <Lock className={`w-3.5 h-3.5 shrink-0 ${activeCode === i ? 'text-amber-300' : 'text-amber-600'}`} />}
                    <span className="font-bold text-sm md:text-base truncate">{code.topic}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 md:w-5 h-5 shrink-0 ${activeCode === i ? 'text-white' : 'text-primary'}`} aria-hidden="true" />
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            {!isUnlocked ? (
              /* Locked Member Paywall Card */
              <div className="bg-[#131628] text-white p-6 sm:p-10 md:p-12 rounded-[32px] border border-amber-400/30 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Lock className="w-48 h-48 text-amber-400" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6 border border-amber-400/30">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Member Vault Locked · Paid Pass Required</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4 leading-tight">
                    Unlock All 480+ Cheat Codes & Agronomic Dossiers
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed mb-8 max-w-2xl">
                    You are viewing the catalog for <strong>{activeVeg} — {activeCheat.topic}</strong>. Free accounts receive the 8 Tomato Codes. To unlock the complete field guide across all 10 vegetables, university study dossiers, and regional heat-stress calendars, activate your Lifetime Pass below.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-8 text-xs sm:text-sm font-sans">
                    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>480+ Tested Codes Across All 10 Crops</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>328+ University Agronomic Citations</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Texas Zone 8a & Nationwide Frost Calendars</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 p-3 rounded-xl">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>100% "More Food In Your Basket" Guarantee</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-amber-400/40 rounded-2xl p-6 md:p-8 mb-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-300 font-sans">Lifetime Access · One-Time Payment</span>
                        <div className="flex items-baseline gap-3 mt-1">
                          <span className="text-4xl md:text-5xl font-black text-white font-sans">$37</span>
                          <span className="text-lg text-slate-400 line-through font-sans">$197</span>
                          <span className="text-xs bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full font-bold font-sans">Save 81%</span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans mt-1">Instant digital access • Zero recurring fees</p>
                      </div>
                      <button
                        onClick={handleSubscribe}
                        className="w-full sm:w-auto px-8 py-5 rounded-full bg-[#F6D234] hover:bg-[#E0BD18] text-[#131628] font-sans font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(246,210,52,0.4)] transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>Unlock Lifetime Vault Pass ($37)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-xs font-sans text-amber-100">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 uppercase tracking-wider">Hormozi Double Guarantee:</span> Put the codes to work in your soil for a full season. If you don't harvest noticeably more food, email us for a 100% refund. You keep all the guides anyway.
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => { setActiveVeg('Tomato'); setActiveCode(0); setView('tomato-codes'); }}
                      className="text-xs text-slate-400 hover:text-white underline font-sans"
                    >
                      ← Back to My Free Tomato Codes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
              {isSwitching ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-6 md:p-10 rounded-[32px] border border-accent shadow-sm space-y-8"
                >
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-10 md:h-12 w-3/4" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-full" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key={`${activeVeg}-${activeCode}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-10 rounded-[32px] border border-accent shadow-sm"
                >
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 md:mb-8">
                  <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    activeCheat.consensus === 'supported' ? 'bg-green-100 text-green-700' :
                    activeCheat.consensus === 'disagreement' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {activeCheat.consensus.replace('-', ' ')}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold leading-tight">{activeCheat.topic}</h3>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  <button 
                    onClick={() => toggleSaveCode(activeCheat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
                      profile?.savedCodes?.includes(activeCheat.id) ? 'bg-primary text-white border-primary' : 'bg-white border-accent text-ink/70 hover:border-primary'
                    }`}
                  >
                    {profile?.savedCodes?.includes(activeCheat.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {profile?.savedCodes?.includes(activeCheat.id) ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={() => toggleTriedCode(activeCheat.id)}
                    disabled={profile?.triedCodes?.includes(activeCheat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${
                      profile?.triedCodes?.includes(activeCheat.id) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-accent text-primary hover:border-primary'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    {profile?.triedCodes?.includes(activeCheat.id) ? 'Tried It' : 'Try This'}
                  </button>
                  <div className="flex items-center gap-2 text-xs md:text-sm font-sans text-ink/70 ml-auto">
                    <Users className="w-4 h-4" />
                    <span>{activeCheat.triedCount} tried this</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-8 md:mb-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/60 flex items-center justify-center text-primary border border-accent">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-bold uppercase tracking-widest text-primary">The Old Ways</p>
                        <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider">Generational Lore &amp; Inherited Secrets</p>
                      </div>
                    </div>
                    <p className="text-lg md:text-xl italic text-ink leading-relaxed">"{activeCheat.beatrice}"</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Beaker className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-bold uppercase tracking-widest text-ink/80">Horticultural Science</p>
                        <p className="text-[11px] font-sans text-ink/60 uppercase tracking-wider">Peer-Reviewed Research Findings</p>
                      </div>
                    </div>
                    <p className="text-base md:text-lg text-ink/70 font-sans leading-relaxed">{activeCheat.greg}</p>
                  </div>
                </div>

                {activeCheat.study && (
                  <div className="bg-accent/20 p-6 md:p-8 rounded-2xl border border-accent/50 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Beaker className="w-5 h-5" aria-hidden="true" />
                      <h4 className="font-sans font-bold uppercase tracking-widest text-xs">Scientific Citation</h4>
                    </div>
                    <div>
                      <p className="font-bold text-ink text-sm md:text-base">{activeCheat.study?.title}</p>
                      <p className="text-xs md:text-sm text-ink/70 font-sans mb-4">{activeCheat.study?.source}</p>
                      <div className="grid sm:grid-cols-2 gap-6 text-xs md:text-sm">
                        <div>
                          <p className="font-bold text-primary mb-1">The Outcome</p>
                          <p className="text-ink/70 font-sans">{activeCheat.study?.outcome}</p>
                        </div>
                        <div>
                          <p className="font-bold text-primary mb-1">Backyard Application</p>
                          <p className="text-ink/70 font-sans">{activeCheat.study?.application}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeCheat.consensus === 'trial-needed' && (
                  <div className="mt-8 p-6 md:p-8 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-blue-900 mb-2">Laboratory Notebook Entry Needed</h4>
                      <p className="text-sm text-blue-800/70 font-sans mb-4">
                        The evidence here is anecdotal. We need your data to settle the debate. Log your results below to help the community.
                      </p>
                      <button onClick={() => setView('lab')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
                        Open Lab Notebook <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {activeCheat.extensionSupport && (
                  <div className="mt-8 flex items-center gap-3 text-xs md:text-sm font-sans text-ink/70">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Aligned with {activeCheat.extensionSupport}</span>
                  </div>
                )}

                <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-accent">
                  <div className="bg-primary/5 p-6 md:p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Lock className="w-12 md:w-16 h-12 md:h-16 -rotate-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h4 className="text-lg md:text-xl font-bold italic">The DFW Road Show: Master Class</h4>
                    </div>
                    <p className="text-xs md:text-sm text-ink/70 font-sans mb-6 max-w-lg">
                      A strictly invite-only, underground master class for those who want to master the 'Cheat Codes' in person. The location is revealed only to the waitlist.
                    </p>
                    <button 
                      onClick={() => setWaitlistJoined(true)}
                      className={`px-6 py-2 rounded-full font-sans font-bold text-xs md:text-sm transition-all shadow-md ${waitlistJoined ? 'bg-green-500 text-white' : 'bg-primary text-white hover:scale-105'}`}
                    >
                      {waitlistJoined ? 'Joined Waitlist' : 'Join Waitlist'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
      </div>
    );
  };



  const LabView = () => {
    const [recentResults, setRecentResults] = useState<{userId: string, result: string}[]>([]);
    const [localLabResult, setLocalLabResult] = useState("");

    useEffect(() => {
      const path = 'lab_notes/epsom-salts';
      const docRef = doc(db, 'lab_notes', 'epsom-salts');
      
      const initNote = async () => {
        try {
          const snap = await getDoc(docRef);
          if (!snap.exists()) {
            await setDoc(docRef, {
              id: 'epsom-salts',
              topic: 'Epsom Salts',
              hypothesis: 'Magnesium improves sweetness',
              userResults: []
            });
          }
        } catch (e) {
          console.error("Failed to init lab note:", e);
        }
      };
      initNote();

      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as LabNote;
          setRecentResults(data.userResults || []);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return unsubscribe;
    }, []);

    const dummyEntries = [
      { userId: "user_123", result: "My Celebrity tomatoes are noticeably sweeter this year. I used 1 tbsp per gal." },
      { userId: "user_456", result: "Didn't see much difference in the clay soil here in Plano. Maybe soil type matters?" },
      { userId: "user_789", result: "Control group (no salts) actually had more blossom end rot. Interesting." },
      { userId: "user_abc", result: "The foliage is much greener on the test plants. Chlorophyll boost is real." },
      { userId: "user_xyz", result: "Harvested 5 lbs more from the Epsom row. I'm a believer now." }
    ];

    const allResults = [...dummyEntries, ...recentResults];

    return (
      <div className="py-8 md:py-24 px-4 md:px-8 max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="text-center mb-12 md:mb-16">
          <Beaker className="w-16 h-16 md:w-20 md:h-20 text-primary mx-auto mb-6 md:mb-8" />
          <h2 className="text-4xl md:text-6xl font-light mb-4 md:mb-6">The Laboratory Notebook</h2>
          <p className="text-lg md:text-xl text-ink/80 mb-8 md:mb-12 font-sans">
            Where the community settles the science. Share your results, help us refine the Cheat Codes.
          </p>
        </div>

        <div className="bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-accent shadow-sm mb-12 md:mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Beaker className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="bg-primary/10 p-2 md:p-3 rounded-xl md:rounded-2xl">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold">Scientific Study Protocol</h3>
              <p className="text-xs md:text-sm font-sans font-bold uppercase tracking-widest text-primary">Trial ID: EPSOM-2026-DFW</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 font-sans">
            <div className="space-y-6 md:space-y-8">
              <div className="relative pl-8 border-l-2 border-accent">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />
                <h4 className="font-bold text-ink mb-2 uppercase tracking-wide text-xs md:text-sm">Step 1: The Setup (Test vs Control)</h4>
                <p className="text-xs md:text-sm text-ink/70 leading-relaxed">
                  Choose two identical tomato plants of the same variety. Label one <span className="font-bold text-primary">'TEST'</span> and one <span className="font-bold text-ink/70">'CONTROL'</span>. They must be in the same soil type and receive the same sunlight.
                </p>
              </div>
              
              <div className="relative pl-8 border-l-2 border-accent">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />
                <h4 className="font-bold text-ink mb-2 uppercase tracking-wide text-xs md:text-sm">Step 2: Log Starting Point</h4>
                <div className="text-xs md:text-sm text-ink/70 leading-relaxed">
                  Before applying anything, measure:
                  <ul className="mt-2 space-y-1 list-disc list-inside opacity-80 text-xs md:text-sm">
                    <li>Plant height (cm)</li>
                    <li>Leaf color (1-10 scale)</li>
                    <li>Number of flower clusters</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="relative pl-8 border-l-2 border-accent">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />
                <h4 className="font-bold text-ink mb-2 uppercase tracking-wide text-xs md:text-sm">Step 3: The Application</h4>
                <p className="text-xs md:text-sm text-ink/70 leading-relaxed">
                  Apply 1 tablespoon of Epsom Salts (Magnesium Sulfate) to the base of the <span className="font-bold text-primary">'TEST'</span> plant only, once every 3 weeks. Water in thoroughly.
                </p>
              </div>
              
              <div className="relative pl-8 border-l-2 border-accent">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white" />
                <h4 className="font-bold text-ink mb-2 uppercase tracking-wide text-xs md:text-sm">Step 4: The Final Analysis</h4>
                <p className="text-xs md:text-sm text-ink/70 leading-relaxed">
                  At harvest, weigh the total fruit from each plant. Note the sweetness (Brix) and overall vine health. We will compare your anecdotal evidence against the control group.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 text-left mb-12 md:mb-16">
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-accent shadow-sm">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Active Trial: Epsom Salts</h3>
            <p className="text-xs md:text-sm text-ink/80 font-sans mb-6">Does Magnesium Sulfate actually improve fruit sweetness in DFW clay? We have {42 + recentResults.length} active participants.</p>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white bg-accent" />)}
              </div>
              <span className="text-xs md:text-sm font-sans font-bold text-primary">+{38 + recentResults.length} others</span>
            </div>
            
            {user ? (
              <div className="space-y-4">
                <label htmlFor="lab-result" className="sr-only">Describe your results</label>
                <textarea 
                  id="lab-result"
                  value={localLabResult}
                  onChange={(e) => setLocalLabResult(e.target.value)}
                  placeholder="Describe your results (e.g., 'Fruit was noticeably sweeter after 3 weeks')"
                  className="w-full p-4 rounded-xl border border-accent font-sans text-xs md:text-sm focus:ring-2 focus:ring-primary outline-none h-24 md:h-32"
                />
                <button 
                  onClick={async () => {
                    await handleLabSubmit('epsom-salts', localLabResult);
                    setLocalLabResult("");
                  }}
                  className="w-full bg-primary text-white py-3 rounded-full font-sans font-bold hover:scale-105 transition-transform text-xs md:text-sm"
                >
                  Log My Result
                </button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="w-full border-2 border-primary text-primary py-3 rounded-full font-sans font-bold hover:bg-primary hover:text-white transition-all text-xs md:text-sm">Sign In to Join Trial</button>
            )}
          </div>

          <div className="bg-ink text-white p-6 md:p-10 rounded-3xl border border-accent shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <CheckCircle2 className="w-16 h-16 md:w-24 md:h-24" />
            </div>
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                Closed Trial: 2025 Results
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4">Deep Stem Planting</h3>
              <p className="text-xs md:text-sm text-white/60 font-sans mb-6 leading-relaxed">
                Our largest study to date. 1,200+ participants tested the "Bury 2/3" method across 14 soil types.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs md:text-sm font-sans text-white/80 uppercase tracking-widest">Drought Tolerance</span>
                  <span className="text-lg md:text-xl font-bold text-primary">+85%</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="text-xs md:text-sm font-sans text-white/80 uppercase tracking-widest">Stem Diameter</span>
                  <span className="text-lg md:text-xl font-bold text-primary">+42%</span>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <p className="text-xs font-sans italic text-white/70">
                  "The consensus is clear: Beatrice was right. Adventitious root mass is the primary driver for summer survival in Texas." — Dr. Greg
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 md:mb-24">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Upcoming Research Pipeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { title: "Coffee Grounds", date: "April", desc: "Soil pH & Nitrogen impact." },
              { title: "Banana Peel Tea", date: "May", desc: "Potassium for flowering." },
              { title: "Aspirin Spray", date: "June", desc: "SAR immune response." },
              { title: "Eggshell Vinegar", date: "July", desc: "Rapid calcium uptake." },
              { title: "Molasses Drench", date: "August", desc: "Microbial activity boost." },
              { title: "Cinnamon Dust", date: "Sept", desc: "Fungal prevention." },
              { title: "H2O2 Roots", date: "Oct", desc: "Clay soil oxygenation." },
              { title: "Rice Water", date: "Nov", desc: "Starch growth trials." }
            ].map((trial, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-accent shadow-sm opacity-60 hover:opacity-100 transition-opacity group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-accent p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                    <Lock className="w-4 h-4 text-ink/70 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">{trial.date}</span>
                </div>
                <h4 className="font-bold mb-2 text-sm md:text-base">{trial.title}</h4>
                <p className="text-xs md:text-sm text-ink/80 font-sans leading-relaxed">{trial.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8">Community Activity Feed</h3>
          <div className="relative overflow-hidden h-[300px] md:h-[400px]">
            <div className="absolute inset-0 bg-gradient-to-b from-paper via-transparent to-paper z-10 pointer-events-none" />
            <div className="animate-marquee-vertical space-y-4">
              {[...allResults, ...allResults].map((res, i) => (
                <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-accent shadow-sm flex gap-3 md:gap-4 items-start">
                  <Quote className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm text-ink/70 font-sans italic">"{res.result}"</p>
                    <p className="text-xs md:text-sm uppercase tracking-widest font-bold text-primary mt-2">User ID: {res.userId.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-paper text-ink font-serif selection:bg-accent pb-20 lg:pb-0">
        <Navigation />
        
        <main className="pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {view === 'public' && <PublicView />}
              {view === 'members' && <MembersView />}
              {view === 'tomato-codes' && <TomatoCheatCodesView />}
              {view === 'lab' && <LabView />}
              {view === 'opt-in' && <OptInView />}
              {view === 'email-sent' && <EmailSentView />}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNav />

        {/* Lead Capture Modal */}
        <AnimatePresence>
          {showLeadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-[32px] p-6 sm:p-10 max-w-md w-full shadow-2xl border border-accent relative"
              >
                <button 
                  onClick={() => setShowLeadModal(false)}
                  className="absolute top-6 right-6 text-ink/40 hover:text-ink w-8 h-8 rounded-full flex items-center justify-center bg-paper hover:bg-accent transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Free Field Guide</span>
                    <h3 className="text-xl sm:text-2xl font-serif font-light text-ink">Get Tomato Cheat Codes</h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-sans text-ink/75 leading-relaxed mb-6">
                  Enter your email below. We'll send you the Tomato Cheat Codes guide immediately and save your spot in the member trials.
                </p>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5 font-sans">
                      Your Email Address *
                    </label>
                    <input 
                      type="email" 
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-accent bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink/70 mb-1.5 font-sans">
                      ZIP Code or USDA Zone (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={leadZip}
                      onChange={(e) => setLeadZip(e.target.value)}
                      placeholder="e.g. 76102 or Zone 8a (for frost alerts)"
                      className="w-full px-4 py-3 rounded-xl border border-accent bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 font-sans text-sm"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={leadSubmitting || !leadEmail}
                    className="w-full py-3.5 bg-primary text-white rounded-full font-sans font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {leadSubmitting ? (
                      <span>Saving your subscription...</span>
                    ) : (
                      <>
                        <span>📩 Send Me The Tomato Codes</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-ink/50 font-sans pt-1">
                    Zero spam. Unsubscribe anytime. Your details are saved directly to our subscriber database.
                  </p>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="py-12 px-8 border-t border-accent bg-white text-center hidden lg:block">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sprout className="text-primary w-6 h-6" aria-hidden="true" />
            <span className="text-xl font-bold tracking-tight">Garden Cheat Codes</span>
          </div>
          <p className="text-xs text-ink/80 font-sans uppercase tracking-widest">
            © 2026 Garden Cheat Codes. All rights reserved. <br />
            Ancestral Wisdom + Data Strategy.
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
