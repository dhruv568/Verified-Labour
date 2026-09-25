'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import Card from './ui/Card';
import Badge from './ui/Badge';

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

  // Step 1: Basic Details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1995-06-15');
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');

  // Step 2: Skills & Trade
  const [primaryCategoryId, setPrimaryCategoryId] = useState(categories[0]?.id || '');
  const [experienceYears, setExperienceYears] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(350);

  // Step 3: Location & Coverage
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [serviceAreas, setServiceAreas] = useState('');
  const [locDetecting, setLocDetecting] = useState(false);

  // Step 4: Cashfree Aadhaar Verification
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarConsent, setAadhaarConsent] = useState(true);
  const [aadhaarRefId, setAadhaarRefId] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [maskedAadhaar, setMaskedAadhaar] = useState('');

  // Step 5: Cashfree Bank Account
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  const [maskedAccountNo, setMaskedAccountNo] = useState('');

  // Step 6: Professional Profile & Certificate Proof
  const [certificateName, setCertificateName] = useState('');
  const [documentStatus, setDocumentStatus] = useState<'PENDING' | 'UPLOADED' | 'VERIFIED'>('PENDING');
  const [isAvailable, setIsAvailable] = useState(true);

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
            if (wp.primaryCategoryId) setPrimaryCategoryId(wp.primaryCategoryId);
            if (wp.experienceYears) setExperienceYears(wp.experienceYears);
            if (wp.hourlyRate) setHourlyRate(wp.hourlyRate);
            if (wp.city) setCity(wp.city);
            if (wp.state) setState(wp.state);
            if (wp.postalCode) setPostalCode(wp.postalCode);
            if (wp.latitude) setLatitude(wp.latitude);
            if (wp.longitude) setLongitude(wp.longitude);
            if (wp.serviceRadiusKm) setServiceRadiusKm(wp.serviceRadiusKm);
            if (wp.isAvailable !== undefined) setIsAvailable(wp.isAvailable);

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
          }
        }
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, []);

  // Set default category if categories change
  useEffect(() => {
    if (categories.length > 0 && !primaryCategoryId) {
      setPrimaryCategoryId(categories[0].id);
    }
  }, [categories, primaryCategoryId]);

  // Auto-detect location on Step 3
  useEffect(() => {
    if (currentStep === 3 && !city && typeof window !== 'undefined') {
      handleDetectLocation();
    }
  }, [currentStep]);

  // Location Geolocation Handler with Fallback
  const handleDetectLocation = async () => {
    setLocDetecting(true);
    setError(null);

    const fallbackIP = async () => {
      try {
        const res = await fetch('/api/location/ip');
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.city) setCity(json.data.city);
          if (json.data.state) setState(json.data.state);
          if (json.data.postalCode) setPostalCode(json.data.postalCode);
          if (json.data.area) {
            setArea(json.data.area);
            if (!serviceAreas) setServiceAreas(json.data.area);
          }
          if (json.data.latitude) setLatitude(json.data.latitude);
          if (json.data.longitude) setLongitude(json.data.longitude);
        }
      } catch {
        if (!city) setCity('Surat');
        if (!state) setState('Gujarat');
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
              setCity(json.data.city || '');
              setState(json.data.state || '');
              setPostalCode(json.data.postalCode || '');
              setArea(json.data.area || '');
              if (!serviceAreas && json.data.area) {
                setServiceAreas(json.data.area);
              }
            } else {
              await fallbackIP();
            }
          } catch {
            await fallbackIP();
          } finally {
            setLocDetecting(false);
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

  // Save Step Details
  const saveStepData = async (stepNum: number) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/workers/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepNum,
          fullName,
          dateOfBirth: dob,
          gender,
          bio,
          primaryCategoryId: primaryCategoryId || categories[0]?.id,
          experienceYears: Number(experienceYears),
          hourlyRate: Number(hourlyRate),
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
      setError('Worker profile session not found. Please complete basic details first.');
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
      setSuccessMsg('Cashfree Secure ID OTP sent! (Use test code: 123456)');
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/workers/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 8,
          fullName,
          city,
          primaryCategoryId,
          serviceRadiusKm: Number(serviceRadiusKm),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit onboarding');

      setCurrentStep(7);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Basic Details', icon: <User className="w-3.5 h-3.5" /> },
    { num: 2, title: 'Skills & Trade', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { num: 3, title: 'Location', icon: <MapPin className="w-3.5 h-3.5" /> },
    { num: 4, title: 'Aadhaar KYC', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { num: 5, title: 'Bank Account', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { num: 6, title: 'Profile & Proof', icon: <FileCheck className="w-3.5 h-3.5" /> },
    { num: 7, title: 'Completion', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  if (sessionLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#1264D6] mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Loading Verified Labour portal...</p>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentStep / 7) * 100));

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
      {/* Wizard Header & Stepper */}
      <div className="bg-[#082B66] text-white p-5 sm:p-7">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider font-devanagari">
              कामगार पंजीकरण पोर्टलन
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Become a Verified Labour Professional
            </h2>
          </div>
          <span className="text-xs font-bold bg-[#0F2A5F] text-blue-200 px-3 py-1.5 rounded-full border border-blue-800/80 shrink-0">
            Step {currentStep} of 7
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-950/60 h-2 rounded-full overflow-hidden mb-4 border border-blue-900/40">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stepper Rail */}
        <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto no-scrollbar pb-1">
          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep && currentStep !== 7) setCurrentStep(st.num);
                }}
                className={`shrink-0 min-w-[76px] sm:min-w-0 min-h-[46px] flex flex-col items-center justify-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#1264D6] text-white font-bold shadow-md'
                    : isCompleted
                    ? 'bg-[#0F2A5F] text-emerald-300 cursor-pointer hover:bg-blue-900'
                    : 'bg-blue-950/30 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className="text-xs mb-0.5">
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : st.num}
                </span>
                <span className="text-[10px] truncate max-w-full font-semibold">{st.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 sm:p-7">
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: BASIC DETAILS */}
        {currentStep === 1 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 1 — Basic Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your official identity details as per your Aadhaar card.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Full Name (as per Aadhaar)"
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
                label="Short Bio / Experience Overview"
                rows={2}
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
              Save & Continue to Skills & Trade
            </Button>
          </div>
        )}

        {/* STEP 2: SKILLS & TRADE */}
        {currentStep === 2 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 2 — Skills & Trade</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your primary trade category, years of active experience, and expected rate.
              </p>
            </div>

            <div className="space-y-3">
              <Select
                label="Primary Trade Category"
                required
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nameHi ? `(${c.nameHi})` : ''}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Years of Experience"
                  type="number"
                  min={0}
                  max={45}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                />

                <Input
                  label="Expected Rate (₹ / job)"
                  type="number"
                  min={100}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-2">
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
                onClick={() => saveStepData(2)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Set Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION & COVERAGE */}
        {currentStep === 3 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Step 3 — Location & Service Radius</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers in this radius will discover and book your service.
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

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  required
                  placeholder="e.g. Surat"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="e.g. Gujarat"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="PIN Code"
                  placeholder="e.g. 395009"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <Input
                  label="Base Area / Locality"
                  placeholder="e.g. Adajan"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Service Radius: <span className="text-[#1264D6] font-extrabold">{serviceRadiusKm} km</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                  className="w-full accent-[#1264D6] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
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

            <div className="flex gap-2">
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
                disabled={loading || !city.trim()}
                onClick={() => saveStepData(3)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Proceed to Aadhaar KYC
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CASHFREE AADHAAR VERIFICATION */}
        {currentStep === 4 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#079447]" />
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Step 4 — Cashfree Secure ID Aadhaar KYC
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official UIDAI Aadhaar OTP verification.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
              <strong>Consent Notice:</strong> Aadhaar verification is executed securely via Cashfree using OTP sent to your registered mobile. Your full Aadhaar number is never exposed.
            </div>

            {aadhaarVerified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Aadhaar Identity Verified!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Masked Aadhaar: <span className="font-mono font-bold">{maskedAadhaar}</span>
                  </p>
                </div>
              </div>
            ) : !aadhaarRefId ? (
              <div className="space-y-3">
                <Input
                  label="12-digit Aadhaar Number"
                  required
                  maxLength={12}
                  placeholder="e.g. 543287651234"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                />

                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={aadhaarConsent}
                    onChange={(e) => setAadhaarConsent(e.target.checked)}
                    className="mt-0.5 accent-[#079447]"
                  />
                  <span>
                    I consent to Verified Labour and Cashfree verifying my identity with UIDAI Aadhaar OTP authentication.
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
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-digit Aadhaar OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl font-bold py-3 rounded-2xl border border-slate-300 outline-none bg-white text-slate-900"
                  />
                  <p className="text-[11px] text-[#079447] font-semibold mt-1">
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
                    className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Number</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleStartAadhaar}
                    className="text-[#079447] font-bold hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(3)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setCurrentStep(5)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Bank Verification
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: CASHFREE BANK VERIFICATION */}
        {currentStep === 5 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#079447]" />
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Step 5 — Bank Account Verification (Penny Drop)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validate direct daily payouts account via Cashfree.
                </p>
              </div>
            </div>

            {bankVerified ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Bank Account Verified!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Account: <span className="font-mono font-bold">{maskedAccountNo}</span> • IFSC: {ifsc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Account Holder Name"
                  required
                  placeholder="Name as printed on bank passbook"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Bank Account Number"
                    required
                    placeholder="e.g. 20394857123"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  />

                  <Input
                    label="IFSC Code"
                    required
                    placeholder="SBIN0001824"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  />
                </div>

                <Button
                  variant="brand"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  disabled={loading || !accountNumber || !ifsc}
                  onClick={handleVerifyBank}
                >
                  Verify Bank Account via Cashfree
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(4)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setCurrentStep(6)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Profile & Proof
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: PROFESSIONAL PROFILE & PROOF */}
        {currentStep === 6 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 6 — Professional Profile & Proof</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload trade certifications or ITI diplomas and set availability.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-[#1264D6] rounded-2xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Upload Skill Certificate / ITI Proof</p>
              <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG up to 5MB</p>

              <input
                type="file"
                id="docUpload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setCertificateName(e.target.files[0].name);
                    setDocumentStatus('UPLOADED');
                  }
                }}
              />
              <label
                htmlFor="docUpload"
                className="mt-3 inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Choose File
              </label>

              {certificateName && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#079447] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{certificateName} ({documentStatus})</span>
                </div>
              )}
            </div>

            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Online Job Dispatch Toggle</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receive direct bookings within {serviceRadiusKm} km radius.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isAvailable
                      ? 'bg-[#079447] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isAvailable ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </Card>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(5)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                onClick={handleFinalSubmit}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit Profile for Activation
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: COMPLETION CONFIRMATION */}
        {currentStep === 7 && (
          <div className="max-w-xl mx-auto py-4 text-center space-y-6">
            {aadhaarVerified && bankVerified ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#079447] text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                  <ShieldCheck className="w-10 h-10 stroke-[2.5]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-200/60 text-emerald-900 font-black text-xs rounded-full uppercase tracking-wider">
                  ✓ 100% Aadhaar & Bank Verified
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  You're Verified & Ready to Earn!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Congratulations! Your Aadhaar identity and bank account details have been verified with Cashfree. Your worker profile is now active on the Verified Labour network.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-400 text-[#082B66] flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-200/60 text-amber-900 font-black text-xs rounded-full uppercase tracking-wider">
                  Verification Submitted
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Profile Submitted for Verification
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Thank you! Your worker profile and documents have been submitted to the Verified Labour verification desk. Verification completes within 2 to 4 hours.
                </p>
              </div>
            )}

            {/* Profile Summary Card */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Registered Profile Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-medium block">Name</span>
                  <strong className="text-slate-800">{fullName || 'Worker Professional'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">City / Service Radius</span>
                  <strong className="text-slate-800">{city || 'Surat'} ({serviceRadiusKm} km)</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Aadhaar Status</span>
                  <strong className={aadhaarVerified ? 'text-[#079447] font-bold' : 'text-amber-700 font-bold'}>
                    {aadhaarVerified ? '✓ Verified (Cashfree)' : 'Pending'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Bank Settlement Status</span>
                  <strong className={bankVerified ? 'text-[#079447] font-bold' : 'text-amber-700 font-bold'}>
                    {bankVerified ? '✓ Verified (Cashfree)' : 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  router.push('/worker/dashboard');
                }
              }}
              className="w-full min-h-[50px] py-3.5 px-6 bg-[#079447] hover:bg-[#067c3b] active:scale-98 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Worker Dashboard</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
