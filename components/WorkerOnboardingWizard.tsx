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
  Building,
  Upload,
  Navigation,
  Loader2,
  Power,
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

  // Authenticated worker profile session
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1995-06-15');
  const [gender, setGender] = useState('Male');
  const [bio, setBio] = useState('');

  // Step 2: Professional Information
  const [primaryCategoryId, setPrimaryCategoryId] = useState(categories[0]?.id || '');
  const [experienceYears, setExperienceYears] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(350);

  // Step 3: Location
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

  // Step 6: Documents
  const [certificateName, setCertificateName] = useState('');
  const [documentStatus, setDocumentStatus] = useState<'PENDING' | 'UPLOADED' | 'VERIFIED'>('PENDING');

  // Step 7: Availability
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

  // Location Geolocation Handler
  const handleDetectLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please enter location manually.');
      return;
    }

    setLocDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
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
          }
        } catch {
          setError('Failed to resolve address from coordinates. Please enter manually.');
        } finally {
          setLocDetecting(false);
        }
      },
      (err) => {
        setLocDetecting(false);
        setError('Location access was denied. Please enter your city and area manually below.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
      setError('Worker profile session not found. Please log in.');
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

      setAadhaarRefId(data.refId);
      setSuccessMsg('Cashfree Secure ID OTP sent! (Use sandbox test code: 123456)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cashfree Aadhaar Verify
  const handleVerifyAadhaar = async () => {
    const workerId = sessionUser?.workerProfile?.id;
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

      if (onComplete) {
        onComplete();
      } else {
        router.push('/worker/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Personal', icon: <User className="w-3.5 h-3.5" /> },
    { num: 2, title: 'Profession', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { num: 3, title: 'Location', icon: <MapPin className="w-3.5 h-3.5" /> },
    { num: 4, title: 'Aadhaar KYC', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { num: 5, title: 'Bank Account', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { num: 6, title: 'Documents', icon: <FileCheck className="w-3.5 h-3.5" /> },
    { num: 7, title: 'Availability', icon: <Power className="w-3.5 h-3.5" /> },
    { num: 8, title: 'Review & Submit', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  if (sessionLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading worker profile session...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Wizard Header & Stepper */}
      <div className="bg-navy-900 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
              Worker Onboarding System
            </span>
            <h2 className="text-xl font-black text-white">
              Become a Verified Labour Professional
            </h2>
          </div>
          <span className="text-xs font-bold bg-navy-800 text-brand-400 px-3 py-1 rounded-full border border-navy-700">
            Step {currentStep} of 8
          </span>
        </div>

        {/* Stepper Dots/Icons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {stepsList.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num);
                }}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-brand-700 text-white font-bold shadow'
                    : isCompleted
                    ? 'bg-navy-800 text-brand-400 hover:bg-navy-700'
                    : 'bg-navy-950/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="text-xs mb-1">
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-brand-400" /> : st.num}
                </span>
                <span className="text-[10px] truncate max-w-full">{st.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-4 p-3.5 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 1 — Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provide your official identity details for client trust and legal compliance.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                label="Full Name (as per Aadhaar / Official ID)"
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
                label="Professional Summary / Bio"
                rows={2}
                placeholder="Briefly describe your trade experience, specialized tools owned, and years active."
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
              Save & Continue to Profession
            </Button>
          </div>
        )}

        {/* STEP 2: PROFESSION */}
        {currentStep === 2 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 2 — Trade & Profession</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your primary trade category, years of experience, and expected rate.
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
                <h3 className="text-base font-bold text-slate-900">Step 3 — Location & Service Radius</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customers in this radius can discover and book your services.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLocation}
                isLoading={locDetecting}
                icon={<Navigation className="w-3.5 h-3.5 text-brand-700" />}
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
                  label="Base Area / Landmark"
                  placeholder="e.g. Adajan"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Service Radius: <span className="text-brand-700 font-extrabold">{serviceRadiusKm} km</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                  className="w-full accent-brand-700 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>5 km (Local)</span>
                  <span>25 km (City-wide)</span>
                  <span>50 km (Regional)</span>
                </div>
              </div>

              <Input
                label="Localities / Neighborhoods Served (Comma separated)"
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
              <ShieldCheck className="w-6 h-6 text-brand-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 4 — Cashfree Secure ID Aadhaar KYC
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consent-based OTP authentication with UIDAI.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 leading-relaxed">
              <strong>Official Consent Notice:</strong> Aadhaar verification is processed via
              Cashfree Secure ID using OTP sent to your Aadhaar-linked phone. Your full Aadhaar
              number is never stored or exposed publicly.
            </div>

            {aadhaarVerified ? (
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-brand-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-brand-900 text-sm">Aadhaar Identity Verified!</h4>
                  <p className="text-xs text-brand-700 mt-0.5">
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
                    className="mt-0.5 accent-brand-700"
                  />
                  <span>
                    I voluntarily consent to Verified Labour and Cashfree authenticating my identity
                    using UIDAI Aadhaar OTP verification.
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
                    Enter 6-digit Aadhaar OTP received from UIDAI
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl font-bold py-3 rounded-xl border border-slate-300 outline-none bg-white text-slate-900"
                  />
                  <p className="text-[11px] text-brand-700 font-semibold mt-1">
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
                  Verify Aadhaar OTP with Cashfree
                </Button>
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
                Continue to Bank Account Verification
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: CASHFREE BANK VERIFICATION */}
        {currentStep === 5 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-brand-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 5 — Bank Account Verification (Cashfree)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct earnings settlement via Cashfree instant payout validation.
                </p>
              </div>
            </div>

            {bankVerified ? (
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-brand-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-brand-900 text-sm">Bank Account Verified!</h4>
                  <p className="text-xs text-brand-700 mt-0.5">
                    Account: <span className="font-mono font-bold">{maskedAccountNo}</span> • IFSC: {ifsc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Account Holder Name"
                  required
                  placeholder="Full name as printed on bank passbook"
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
                Continue to Documents
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: DOCUMENTS */}
        {currentStep === 6 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 6 — Supporting Documents</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload trade certifications, ITI diplomas, or licenses to boost profile rank.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition-colors">
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
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-brand-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{certificateName} ({documentStatus})</span>
                </div>
              )}
            </div>

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
                onClick={() => setCurrentStep(7)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Availability
              </Button>
            </div>
          </div>
        )}

        {/* STEP 7: AVAILABILITY */}
        {currentStep === 7 && (
          <div className="max-w-lg mx-auto py-2 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Step 7 — Availability Control</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control when you receive new job requests from customers.
              </p>
            </div>

            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Available for New Jobs</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When ON, customers within {serviceRadiusKm} km can request your services.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isAvailable
                      ? 'bg-brand-700 text-white shadow-xs'
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
                onClick={() => setCurrentStep(6)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="brand"
                size="lg"
                fullWidth
                onClick={() => setCurrentStep(8)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Review & Submit Profile
              </Button>
            </div>
          </div>
        )}

        {/* STEP 8: REVIEW & SUBMIT */}
        {currentStep === 8 && (
          <div className="max-w-lg mx-auto py-2 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Review & Submit Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all information before submitting for final platform activation.
              </p>
            </div>

            {/* Complete Checklist Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Personal Information</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Primary Trade</span>
                <span className="font-bold text-slate-900">
                  {categories.find((c) => c.id === primaryCategoryId)?.name || 'Specialist'} ({experienceYears} yrs)
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Location</span>
                <span className="font-bold text-slate-900">{city}, {state || 'India'} ({serviceRadiusKm} km)</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Aadhaar Status</span>
                {aadhaarVerified ? (
                  <Badge variant="brand" size="sm">
                    <CheckCircle2 className="w-3 h-3 text-brand-600" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">Pending</Badge>
                )}
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Bank Status</span>
                {bankVerified ? (
                  <Badge variant="brand" size="sm">
                    <CheckCircle2 className="w-3 h-3 text-brand-600" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">Pending</Badge>
                )}
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Documents</span>
                <span className="font-bold text-slate-900">{certificateName ? 'Uploaded' : 'None provided'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Availability</span>
                <span className="font-bold text-brand-700">{isAvailable ? 'Online (Accepting Jobs)' : 'Offline'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
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
                isLoading={loading}
                onClick={handleFinalSubmit}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit for Verification
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
