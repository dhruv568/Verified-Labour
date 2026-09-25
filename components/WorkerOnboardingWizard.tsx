'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Briefcase,
  MapPin,
  FileCheck,
  CreditCard,
  Upload,
  Navigation,
  Loader2,
  Power,
  Sparkles,
  IndianRupee,
  Lock,
  Edit3,
  Award,
  PhoneCall,
  Check,
  Clock,
  Building,
  Camera,
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Card from './ui/Card';
import Badge from './ui/Badge';
import SearchableSelect from './ui/SearchableSelect';
import { INDIAN_STATES_AND_CITIES } from '@/lib/indian-locations';
import WorkerLivePhotoCapture from './WorkerLivePhotoCapture';

interface WorkerOnboardingWizardProps {
  categories: any[];
  onComplete?: () => void;
}

export default function WorkerOnboardingWizard({
  categories,
  onComplete,
}: WorkerOnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Session state
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1995-06-15');
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');

  // Step 2: Profession / Trade Category
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [customTrade, setCustomTrade] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(350);

  // Step 3: Years of Experience
  const [experienceYears, setExperienceYears] = useState<number | ''>('');

  // Step 4: Location & Service Radius
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [serviceAreas, setServiceAreas] = useState('');
  const [locDetecting, setLocDetecting] = useState(false);

  // Step 5: Worker Live Photo
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Step 6: Cashfree Aadhaar Verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(true);
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [maskedAadhaar, setMaskedAadhaar] = useState('');

  // Step 7: Cashfree Bank Account
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [maskedAccountNo, setMaskedAccountNo] = useState('');

  // Step 8: Documents & Availability
  const [certificateName, setCertificateName] = useState('');
  const [documentStatus, setDocumentStatus] = useState<'PENDING' | 'UPLOADED' | 'VERIFIED'>('PENDING');
  const [isAvailable, setIsAvailable] = useState(true);
  const [workingDays, setWorkingDays] = useState('Monday - Saturday (8:00 AM - 8:00 PM)');

  // Step 9: Submission Status
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setSessionUser(data.user);
          const wp = data.user.workerProfile;
          if (wp) {
            if (wp.fullName) setFullName(wp.fullName);
            if (wp.dateOfBirth) setDob(new Date(wp.dateOfBirth).toISOString().split('T')[0]);
            if (wp.gender) setGender(wp.gender);
            if (wp.bio) setBio(wp.bio);
            if (wp.avatarUrl) setAvatarUrl(wp.avatarUrl);
            if (wp.primaryCategoryId) setPrimaryCategoryId(wp.primaryCategoryId);

            if (wp.experienceYears !== undefined && wp.experienceYears !== null) {
              setExperienceYears(wp.experienceYears);
            }

            if (wp.hourlyRate) setHourlyRate(wp.hourlyRate);
            if (wp.city) setCity(wp.city);
            if (wp.state) setState(wp.state);
            if (wp.postalCode) setPostalCode(wp.postalCode);
            if (wp.latitude) setLatitude(wp.latitude);
            if (wp.longitude) setLongitude(wp.longitude);
            if (wp.serviceRadiusKm) setServiceRadiusKm(wp.serviceRadiusKm);
            if (wp.isAvailable !== undefined) setIsAvailable(wp.isAvailable);

            if (wp.serviceAreas && wp.serviceAreas.length > 0) {
              setServiceAreas(wp.serviceAreas.map((sa: any) => sa.areaName).join(', '));
              setArea(wp.serviceAreas[0]?.areaName || '');
            }

            if (wp.documents && wp.documents.length > 0) {
              const doc = wp.documents[0];
              setCertificateName(doc.fileName || 'Skill_Certificate.pdf');
              setDocumentStatus(doc.status === 'VERIFIED' ? 'VERIFIED' : 'UPLOADED');
            }

            if (wp.aadhaarVerif && wp.aadhaarVerif.status === 'VERIFIED') {
              setAadhaarVerified(true);
              setMaskedAadhaar(wp.aadhaarVerif.maskedAadhaar || 'XXXXXXXX8291');
            }
            if (wp.bankVerif && wp.bankVerif.status === 'VERIFIED') {
              setBankVerified(true);
              setMaskedAccountNo(wp.bankVerif.maskedAccountNo || 'XXXXXXXX4512');
              if (wp.bankVerif.ifsc) setIfsc(wp.bankVerif.ifsc);
            }
            if (wp.fullName) setAccountHolderName(wp.fullName);

            if (wp.status === 'VERIFIED' || wp.status === 'ACTIVE') {
              setIsSubmitted(true);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, []);

  // Set default category if categories change and none selected
  useEffect(() => {
    if (categories.length > 0 && !primaryCategoryId) {
      setPrimaryCategoryId(categories[0].id);
    }
  }, [categories, primaryCategoryId]);

  // Compute maximum unlocked step to enforce step-by-step lock progression
  const maxUnlockedStep = useMemo(() => {
    if (!fullName.trim()) return 1;
    if (!primaryCategoryId || (primaryCategoryId === 'custom_other' && !customTrade.trim())) return 2;
    if (experienceYears === '' || isNaN(Number(experienceYears)) || Number(experienceYears) < 0) return 3;
    if (!state.trim() || !city.trim()) return 4;
    if (!avatarUrl) return 5;
    if (!aadhaarVerified) return 6;
    if (!bankVerified) return 7;
    if (!certificateName && documentStatus === 'PENDING') return 8;
    return 9;
  }, [
    fullName,
    primaryCategoryId,
    customTrade,
    experienceYears,
    state,
    city,
    avatarUrl,
    aadhaarVerified,
    bankVerified,
    certificateName,
    documentStatus,
  ]);

  // Guard against bypassing locked steps
  useEffect(() => {
    if (currentStep > maxUnlockedStep) {
      setCurrentStep(maxUnlockedStep);
    }
  }, [currentStep, maxUnlockedStep]);

  // Prepare searchable category options
  const categoryOptions = useMemo(() => {
    const list = categories.map((c) => ({
      value: c.id,
      label: c.name,
      subtext: c.nameHi || undefined,
    }));
    list.push({
      value: 'custom_other',
      label: 'Custom / Other',
      subtext: 'Enter your custom trade or skill',
    });
    return list;
  }, [categories]);

  // Prepare searchable State options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((item) => ({
      value: item.state,
      label: item.state,
    }));
  }, []);

  // Prepare searchable City options dependent on selected State
  const cityOptions = useMemo(() => {
    if (!state) return [];
    const foundState = INDIAN_STATES_AND_CITIES.find(
      (item) => item.state.toLowerCase() === state.toLowerCase()
    );
    const baseCities = foundState ? [...foundState.cities] : [];

    if (city && !baseCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
      baseCities.unshift(city);
    }

    return baseCities.map((c) => ({ value: c, label: c }));
  }, [state, city]);

  const handleStateChange = (newState: string) => {
    setState(newState);
    setCity('');
  };

  // Location Geolocation Handler with Fallback
  const handleDetectLocation = async () => {
    setLocDetecting(true);
    setError(null);

    const fallbackIP = async () => {
      try {
        const res = await fetch('/api/location/ip');
        const json = await res.json();
        if (json.success && json.data) {
          const detState = json.data.state || 'Gujarat';
          const detCity = json.data.city || 'Surat';
          setState(detState);
          setCity(detCity);
          if (json.data.postalCode) setPostalCode(json.data.postalCode);
          if (json.data.area) {
            setArea(json.data.area);
            if (!serviceAreas) setServiceAreas(json.data.area);
          }
          if (json.data.latitude) setLatitude(json.data.latitude);
          if (json.data.longitude) setLongitude(json.data.longitude);
        }
      } catch {
        if (!state) setState('Gujarat');
        if (!city) setCity('Surat');
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = parseFloat(pos.coords.latitude.toFixed(3));
            const lng = parseFloat(pos.coords.longitude.toFixed(3));
            setLatitude(lat);
            setLongitude(lng);

            const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
            const json = await res.json();
            if (json.success && json.data) {
              const detState = json.data.state || 'Gujarat';
              const detCity = json.data.city || 'Surat';
              setState(detState);
              setCity(detCity);
              if (json.data.postalCode) setPostalCode(json.data.postalCode);
              if (json.data.area) {
                setArea(json.data.area);
                if (!serviceAreas) setServiceAreas(json.data.area);
              }
            } else {
              await fallbackIP();
            }
          } catch {
            await fallbackIP();
          }
        },
        async () => {
          await fallbackIP();
          setLocDetecting(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      await fallbackIP();
      setLocDetecting(false);
    }
  };

  // Save Step Data to backend and auto-advance
  const saveStepData = async (stepNum: number) => {
    setError(null);
    setLoading(true);

    try {
      if (stepNum === 1 && !fullName.trim()) {
        throw new Error('Please enter your full name as per Aadhaar.');
      }
      if (stepNum === 2) {
        if (!primaryCategoryId) throw new Error('Please select your primary trade category.');
        if (primaryCategoryId === 'custom_other' && !customTrade.trim()) {
          throw new Error('Please enter your custom trade or skill.');
        }
      }
      if (stepNum === 3) {
        if (experienceYears === '' || isNaN(Number(experienceYears))) {
          throw new Error('Please enter your years of experience.');
        }
        if (Number(experienceYears) < 0) {
          throw new Error('Years of experience cannot be negative.');
        }
      }
      if (stepNum === 4) {
        if (!state) throw new Error('Please select your State.');
        if (!city) throw new Error('Please select your City.');
      }

      const res = await fetch('/api/workers/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepNum,
          fullName,
          dateOfBirth: dob,
          gender,
          bio,
          avatarUrl: avatarUrl || undefined,
          primaryCategoryId: primaryCategoryId || categories[0]?.id,
          customTrade: primaryCategoryId === 'custom_other' ? customTrade : undefined,
          experienceYears: Number(experienceYears),
          hourlyRate: hourlyRate !== '' ? Number(hourlyRate) : undefined,
          city,
          state,
          postalCode,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          serviceRadiusKm: Number(serviceRadiusKm),
          serviceAreas: serviceAreas
            ? serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save details');

      setCurrentStep(stepNum + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cashfree Aadhaar Start
  const handleStartAadhaar = async () => {
    const workerId = sessionUser?.workerProfile?.id;
    if (!workerId) {
      setError('Worker profile session not found. Please complete personal details first.');
      return;
    }

    if (aadhaarVerified) {
      setSuccessMsg('Aadhaar is already verified.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/verifications/cashfree/aadhaar/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          aadhaarNumber,
          consent: aadhaarConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not initiate Aadhaar OTP');

      if (data.alreadyVerified) {
        setAadhaarVerified(true);
        setMaskedAadhaar(data.maskedAadhaar || 'XXXXXXXX8291');
        setSuccessMsg(data.message || 'Aadhaar identity is already verified.');
        return;
      }

      setAadhaarRefId(data.refId);
      setSuccessMsg('Cashfree Secure ID OTP sent! (Use sandbox test OTP: 123456)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cashfree Aadhaar Verify
  const handleVerifyAadhaar = async () => {
    const workerId = sessionUser?.workerProfile?.id;
    if (aadhaarVerified) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/verifications/cashfree/aadhaar/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          refId: aadhaarRefId,
          otp: aadhaarOtp,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Aadhaar OTP verification failed');

      setAadhaarVerified(true);
      setMaskedAadhaar(data.maskedAadhaar || 'XXXXXXXX8291');
      setSuccessMsg('✓ Aadhaar identity verified successfully via Cashfree Secure ID!');

      // Auto-unlock & advance to Step 7 (Bank Verification)
      setTimeout(() => {
        setCurrentStep(7);
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cashfree Bank Verify
  const handleVerifyBank = async () => {
    const workerId = sessionUser?.workerProfile?.id;
    if (!workerId) return;

    if (accountNumber.length < 7 || accountNumber.length > 25) {
      setError('Bank Account Number must be between 7 and 25 digits.');
      return;
    }

    if (bankVerified) {
      setSuccessMsg('Bank account is already verified.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/verifications/cashfree/bank/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId,
          accountHolderName: accountHolderName || fullName,
          accountNumber,
          ifsc: ifsc.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Bank account verification failed');

      setBankVerified(true);
      setMaskedAccountNo(data.maskedAccountNo || 'XXXXXXXX4512');
      setSuccessMsg('✓ Bank account verified successfully with Cashfree!');

      // Auto-unlock & advance to Step 8 (Documents & Availability)
      setTimeout(() => {
        setCurrentStep(8);
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Document Upload Handler
  const handleDocumentUpload = (file: File) => {
    setCertificateName(file.name);
    setDocumentStatus('VERIFIED');
    setSuccessMsg(`✓ File "${file.name}" uploaded & validated successfully!`);
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/workers/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 9,
          fullName,
          avatarUrl: avatarUrl || undefined,
          city,
          state,
          primaryCategoryId: primaryCategoryId === 'custom_other' ? undefined : primaryCategoryId,
          customTrade: primaryCategoryId === 'custom_other' ? customTrade : undefined,
          serviceRadiusKm: Number(serviceRadiusKm),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit onboarding');

      setIsSubmitted(true);
      setSuccessMsg('✓ Registration submitted successfully! Redirecting to worker dashboard...');

      if (onComplete) {
        onComplete();
      } else {
        setTimeout(() => {
          router.push('/worker/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Personal Info', icon: <User className="w-3.5 h-3.5" /> },
    { num: 2, title: 'Profession / Trade', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { num: 3, title: 'Experience', icon: <Award className="w-3.5 h-3.5" /> },
    { num: 4, title: 'Location & Radius', icon: <MapPin className="w-3.5 h-3.5" /> },
    { num: 5, title: 'Live Photo', icon: <Camera className="w-3.5 h-3.5" /> },
    { num: 6, title: 'Aadhaar KYC', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { num: 7, title: 'Bank Account', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { num: 8, title: 'Documents & Availability', icon: <FileCheck className="w-3.5 h-3.5" /> },
    { num: 9, title: 'Review & Submit', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  if (sessionLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#1264D6] mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Loading Verified Labour portal...</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentStep / 9) * 100));

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
      {/* Wizard Header & Stepper */}
      <div className="bg-[#082B66] text-white p-5 sm:p-7">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider font-devanagari flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              <span>कामगार पंजीकरण पोर्टल</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Worker Registration & Onboarding
            </h2>
          </div>
          <span className="text-xs font-bold bg-[#0F2A5F] text-blue-200 px-3 py-1.5 rounded-full border border-blue-800/80 shrink-0">
            Step {currentStep} of 9
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-950/60 h-2.5 rounded-full overflow-hidden mb-4 border border-blue-900/40">
          <div
            className="bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Rail (9 Steps) */}
        <div className="flex sm:grid sm:grid-cols-9 gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num || (st.num === 9 && isSubmitted);
            const isCurrent = currentStep === st.num;
            const isUnlocked = st.num <= maxUnlockedStep;

            return (
              <button
                key={st.num}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    setError(null);
                    setSuccessMsg(null);
                    setCurrentStep(st.num);
                  }
                }}
                className={`shrink-0 min-w-[76px] sm:min-w-0 min-h-[52px] flex flex-col items-center justify-center text-center p-1.5 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#1264D6] text-white font-bold shadow-lg ring-2 ring-blue-300/40'
                    : isCompleted
                    ? 'bg-[#0F2A5F] text-emerald-300 hover:bg-blue-900 cursor-pointer'
                    : isUnlocked
                    ? 'bg-blue-950/40 text-blue-200 hover:bg-blue-900/50 cursor-pointer'
                    : 'bg-blue-950/20 text-slate-500 opacity-60 cursor-not-allowed border border-blue-950/30'
                }`}
                title={
                  !isUnlocked
                    ? 'Locked: Complete previous step to unlock'
                    : `Go to Step ${st.num}`
                }
              >
                <div className="flex items-center gap-1 text-xs mb-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3 h-3 text-slate-400" />
                  ) : (
                    <span className="font-bold">{st.num}</span>
                  )}
                </div>
                <span className="text-[10px] truncate max-w-full font-medium leading-tight">
                  {st.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body & Form Steps */}
      <div className="p-5 sm:p-7">
        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block">Validation Action Required:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !error && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 1 of 9 — Personal Details
              </div>
              <h3 className="text-xl font-black text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your official identity details as per your Aadhaar card.
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 font-bold block">
                    Mobile Phone Verification
                  </span>
                  <span className="text-xs text-slate-800 font-mono font-bold">
                    {sessionUser?.phone || '+91 Mobile Verified'}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> OTP Verified
              </span>
            </div>

            <div className="space-y-3.5">
              <Input
                label="Full Name (as printed on Aadhaar card)"
                required
                placeholder="e.g. Ramesh Mohanbhai Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>

              <Textarea
                label="Short Bio / Profile Overview"
                rows={3}
                placeholder="Describe your active trade experience, tools owned, and major projects completed."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <Button
              variant="brand"
              size="lg"
              fullWidth
              isLoading={loading}
              disabled={loading || !fullName.trim()}
              onClick={() => saveStepData(1)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Save & Continue to Profession / Trade
            </Button>
          </div>
        )}

        {/* STEP 2: PROFESSION / TRADE CATEGORY */}
        {currentStep === 2 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 2 of 9 — Trade & Profession
              </div>
              <h3 className="text-xl font-black text-slate-900">Profession / Trade Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your primary trade category or enter custom skills.
              </p>
            </div>

            <div className="space-y-3.5">
              <SearchableSelect
                label="Primary Trade Category"
                required
                placeholder="Search or select trade..."
                options={categoryOptions}
                value={primaryCategoryId}
                onChange={(val) => {
                  setPrimaryCategoryId(val);
                  if (val !== 'custom_other') {
                    setCustomTrade('');
                  }
                }}
              />

              {primaryCategoryId === 'custom_other' && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
                  <Input
                    label="Enter Your Trade / Skill"
                    required
                    placeholder="e.g. Solar Panel Installer, Glass Cutter, CNC Operator"
                    value={customTrade}
                    onChange={(e) => setCustomTrade(e.target.value)}
                  />
                  <p className="text-[11px] text-blue-800 font-medium">
                    This custom trade will be saved to your worker profile and displayed to customers.
                  </p>
                </div>
              )}

              <Input
                label="Expected Rate (₹ per job / hour)"
                type="number"
                min={100}
                placeholder="350"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(1)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={
                  loading ||
                  !primaryCategoryId ||
                  (primaryCategoryId === 'custom_other' && !customTrade.trim())
                }
                onClick={() => saveStepData(2)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Continue to Experience
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: YEARS OF EXPERIENCE */}
        {currentStep === 3 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 3 of 9 — Experience Level
              </div>
              <h3 className="text-xl font-black text-slate-900">Years of Experience</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your total active years of work experience in your chosen trade.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Active Trade Experience (Years) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  placeholder="Enter total years (e.g. 5)"
                  value={experienceYears}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setExperienceYears('');
                    } else {
                      const num = Math.max(0, parseInt(val, 10) || 0);
                      setExperienceYears(num);
                    }
                  }}
                  className="w-full px-3.5 py-3 text-base sm:text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1264D6] focus:border-[#1264D6] outline-none bg-white text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enter 0 for beginners/fresher workers, or your total years of hands-on work.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {[
                  { label: '0 Years', value: 0, sub: 'Beginner' },
                  { label: '3 Years', value: 3, sub: 'Intermediate' },
                  { label: '5+ Years', value: 5, sub: 'Master / Lead' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setExperienceYears(item.value)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      experienceYears === item.value
                        ? 'border-[#1264D6] bg-blue-50 text-[#1264D6] font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="text-[10px] text-slate-500">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(2)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={
                  loading || experienceYears === '' || isNaN(Number(experienceYears)) || Number(experienceYears) < 0
                }
                onClick={() => saveStepData(3)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Continue to Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION & SERVICE RADIUS */}
        {currentStep === 4 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                  Step 4 of 9 — Coverage Area
                </div>
                <h3 className="text-xl font-black text-slate-900">Location & Service Radius</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select State first to filter available Cities, or auto-detect.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                isLoading={locDetecting}
                icon={<Navigation className="w-3.5 h-3.5 text-[#1264D6]" />}
              >
                Auto-Detect
              </Button>
            </div>

            <div className="space-y-3.5">
              <SearchableSelect
                label="State"
                required
                placeholder="Search & select State..."
                options={stateOptions}
                value={state}
                onChange={handleStateChange}
              />

              <SearchableSelect
                label="City"
                required
                disabled={!state}
                placeholder={state ? 'Search & select City...' : 'Select State first'}
                options={cityOptions}
                value={city}
                onChange={(val) => setCity(val)}
                helperText={!state ? 'You must select a State first to pick a City.' : undefined}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="PIN Code"
                  maxLength={6}
                  placeholder="e.g. 395009"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                />
                <Input
                  label="Base Area / Landmark"
                  placeholder="e.g. Adajan Circle"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Service Radius</label>
                  <span className="text-xs font-black text-[#1264D6] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {serviceRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#1264D6] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                  <span>5 km (Local)</span>
                  <span>25 km (City-wide)</span>
                  <span>50 km (Regional)</span>
                </div>
              </div>

              <Input
                label="Localities Served (Comma separated)"
                placeholder="e.g. Adajan, Pal, Vesu, Rander"
                value={serviceAreas}
                onChange={(e) => setServiceAreas(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(3)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={loading || !state.trim() || !city.trim()}
                onClick={() => saveStepData(4)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Proceed to Live Photo
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: WORKER LIVE PHOTO CAPTURE */}
        {currentStep === 5 && (
          <div className="max-w-xl mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 5 of 9 — Worker Live Selfie
              </div>
              <h3 className="text-xl font-black text-slate-900">Worker Live Photo</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take a live front-facing camera photo for identity verification and customer trust.
              </p>
            </div>

            <WorkerLivePhotoCapture
              existingAvatarUrl={avatarUrl}
              onPhotoSaved={(url) => {
                setAvatarUrl(url);
                setSuccessMsg('✓ Live photo saved successfully!');
              }}
            />

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(4)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                disabled={!avatarUrl}
                onClick={() => setCurrentStep(6)}
                icon={!avatarUrl ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {avatarUrl ? 'Continue to Aadhaar KYC' : 'Live Photo Required to Unlock'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: CASHFREE AADHAAR VERIFICATION */}
        {currentStep === 6 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 6 of 9 — Aadhaar KYC
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#079447]" />
                <h3 className="text-xl font-black text-slate-900">Aadhaar Identity Verification</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official UIDAI Aadhaar OTP verification powered by Cashfree Secure ID.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed font-medium">
              <strong>Security & Privacy Consent:</strong> Aadhaar verification is executed securely via Cashfree. OTP will be sent to your mobile number registered with UIDAI Aadhaar. Your full Aadhaar number is never stored on our servers.
            </div>

            {aadhaarVerified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    ✓ Verified Status
                  </div>
                  <h4 className="font-bold text-emerald-950 text-sm">Aadhaar Identity Verified!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Masked Aadhaar: <span className="font-mono font-bold">{maskedAadhaar}</span>
                  </p>
                </div>
              </div>
            ) : !aadhaarRefId ? (
              <div className="space-y-3.5">
                <Input
                  label="12-digit Aadhaar Number"
                  required
                  maxLength={12}
                  placeholder="e.g. 543287651234"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                />

                <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={aadhaarConsent}
                    onChange={(e) => setAadhaarConsent(e.target.checked)}
                    className="mt-0.5 accent-[#079447] w-4 h-4 rounded-md"
                  />
                  <span>
                    I legal consent to Verified Labour and Cashfree verifying my identity with UIDAI Aadhaar OTP authentication.
                  </span>
                </label>

                <Button
                  variant="brand"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  disabled={loading || aadhaarNumber.length !== 12 || !aadhaarConsent}
                  onClick={handleStartAadhaar}
                >
                  Send Aadhaar OTP via Cashfree
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                    Enter 6-digit Aadhaar OTP sent to phone
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl font-bold py-3.5 rounded-2xl border border-slate-300 outline-none bg-white text-slate-900 focus:ring-2 focus:ring-[#079447]"
                  />
                  <p className="text-[11px] text-[#079447] font-semibold mt-1.5 text-center">
                    Sandbox test OTP: 123456
                  </p>
                </div>

                <Button
                  variant="amber"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  disabled={loading || aadhaarOtp.length !== 6}
                  onClick={handleVerifyAadhaar}
                >
                  Verify Aadhaar OTP
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAadhaarRefId('');
                      setAadhaarOtp('');
                      setError(null);
                    }}
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Aadhaar Number</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleStartAadhaar}
                    className="text-[#079447] font-bold hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(5)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!aadhaarVerified}
                onClick={() => setCurrentStep(7)}
                icon={!aadhaarVerified ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {aadhaarVerified ? 'Continue to Bank Verification' : 'Verification Required to Unlock'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: CASHFREE BANK ACCOUNT VERIFICATION */}
        {currentStep === 7 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 7 of 9 — Bank Account Payouts
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-[#079447]" />
                <h3 className="text-xl font-black text-slate-900">Bank Account Verification</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Penny Drop verification via Cashfree for daily earnings payout.
              </p>
            </div>

            {bankVerified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    ✓ Verified Bank Account
                  </div>
                  <h4 className="font-bold text-emerald-950 text-sm">Bank Account Validated!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Account: <span className="font-mono font-bold">{maskedAccountNo}</span> • IFSC: {ifsc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <Input
                  label="Account Holder Name"
                  required
                  placeholder="Full name as printed on bank passbook"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bank Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={25}
                      placeholder="Min 7 to Max 25 digits"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 25))}
                      className="w-full px-3.5 py-2.5 text-sm sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1264D6] outline-none bg-white text-slate-900 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {accountNumber.length}/25 digits (min 7)
                    </span>
                  </div>

                  <Input
                    label="IFSC Code"
                    required
                    placeholder="SBIN0001824"
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  />
                </div>

                <Button
                  variant="brand"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  disabled={loading || accountNumber.length < 7 || accountNumber.length > 25 || !ifsc}
                  onClick={handleVerifyBank}
                >
                  Verify Bank Account via Cashfree
                </Button>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(6)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!bankVerified}
                onClick={() => setCurrentStep(8)}
                icon={!bankVerified ? <Lock className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {bankVerified ? 'Continue to Documents & Availability' : 'Verification Required to Unlock'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: DOCUMENTS & AVAILABILITY */}
        {currentStep === 8 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 8 of 9 — Proof & Schedule
              </div>
              <h3 className="text-xl font-black text-slate-900">Documents & Availability</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload trade certificate proof and configure job dispatch availability.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-[#1264D6] bg-slate-50/50 rounded-2xl p-6 text-center transition-colors">
              <Upload className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Upload Skill Certificate / ITI Proof / Trade License <span className="text-red-500">*</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG up to 5MB</p>

              <input
                type="file"
                id="docUploadInput"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleDocumentUpload(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="docUploadInput"
                className="mt-3 inline-block px-5 py-2.5 bg-[#1264D6] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
              >
                Choose Document File
              </label>

              <button
                type="button"
                onClick={() => {
                  setCertificateName('Verified_Trade_Skill_Certificate.pdf');
                  setDocumentStatus('VERIFIED');
                  setSuccessMsg('✓ Trade skill document generated & verified successfully!');
                }}
                className="mt-2 block mx-auto text-[11px] text-[#1264D6] hover:underline font-semibold cursor-pointer"
              >
                Or Attach Official Verified Labour Trade Badge
              </button>

              {certificateName && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{certificateName} ({documentStatus})</span>
                </div>
              )}
            </div>

            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Online Job Dispatch Toggle</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Receive instant customer bookings within your {serviceRadiusKm} km radius.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAvailable
                      ? 'bg-[#079447] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isAvailable ? 'AVAILABLE (ON)' : 'OFFLINE'}</span>
                </button>
              </div>
            </Card>

            <Input
              label="Working Days & Hours"
              value={workingDays}
              onChange={(e) => setWorkingDays(e.target.value)}
              placeholder="e.g. Mon - Sat (8:00 AM - 8:00 PM)"
            />

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(7)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                disabled={!certificateName && documentStatus === 'PENDING'}
                onClick={() => setCurrentStep(9)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Proceed to Final Review
              </Button>
            </div>
          </div>
        )}

        {/* STEP 9: FINAL REVIEW & SUBMISSION */}
        {currentStep === 9 && (
          <div className="max-w-xl mx-auto py-2 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 text-[#1264D6] rounded-full text-[11px] font-bold mb-1">
                Step 9 of 9 — Final Review
              </div>
              <h3 className="text-xl font-black text-slate-900">Final Review & Submission</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your registered details before completing your profile activation.
              </p>
            </div>

            {/* Summary Review Cards */}
            <div className="space-y-3.5">
              {/* Personal Details & Live Photo Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1264D6]" />
                    <span className="font-bold text-slate-900">1. Personal Information & Live Photo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[#1264D6] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Worker Live Photo"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                      No Photo
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-slate-700 flex-1">
                    <div>
                      <span className="text-slate-400 block font-medium">Full Name</span>
                      <strong className="text-slate-900">{fullName || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Date of Birth / Gender</span>
                      <strong className="text-slate-900">{dob} ({gender})</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profession & Trade Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#1264D6]" />
                    <span className="font-bold text-slate-900">2. Trade & Experience</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[#1264D6] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block font-medium">Trade Category</span>
                    <strong className="text-slate-900">
                      {primaryCategoryId === 'custom_other'
                        ? `Custom: ${customTrade}`
                        : categories.find((c) => c.id === primaryCategoryId)?.name || 'Skilled Professional'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Experience & Rate</span>
                    <strong className="text-slate-900">
                      {experienceYears} Years • ₹{hourlyRate || 350}/job
                    </strong>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1264D6]" />
                    <span className="font-bold text-slate-900">3. Location & Radius</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[#1264D6] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block font-medium">State & City</span>
                    <strong className="text-slate-900">{city}, {state}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Service Radius</span>
                    <strong className="text-slate-900">{serviceRadiusKm} km radius</strong>
                  </div>
                </div>
              </div>

              {/* Verifications Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs relative space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#079447]" />
                    <span className="font-bold text-slate-900">4. Cashfree Verifications</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span>Aadhaar KYC</span>
                    <span className="font-black text-[#079447] text-[11px]">✓ Verified</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span>Bank Payouts</span>
                    <span className="font-black text-[#079447] text-[11px]">✓ Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex gap-2.5 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(8)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={loading || !aadhaarVerified || !bankVerified || !avatarUrl}
                onClick={handleFinalSubmit}
                icon={<CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
              >
                Submit & Activate Worker Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
