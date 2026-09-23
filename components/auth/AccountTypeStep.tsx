'use client';

import React, { useState } from 'react';
import { Users, HardHat, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AccountTypeStepProps {
  onSelectRole: (role: 'CUSTOMER' | 'WORKER', fullName: string) => void;
  loading: boolean;
  defaultRole?: 'CUSTOMER' | 'WORKER';
}

export default function AccountTypeStep({
  onSelectRole,
  loading,
  defaultRole = 'CUSTOMER',
}: AccountTypeStepProps) {
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'WORKER'>(defaultRole);
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectRole(selectedRole, fullName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h3 className="text-base font-black text-slate-900">
          How do you want to use Verified Labour?
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Select an account type to personalize your experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Customer */}
        <div
          onClick={() => setSelectedRole('CUSTOMER')}
          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            selectedRole === 'CUSTOMER'
              ? 'border-brand-600 bg-brand-50/40 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          {selectedRole === 'CUSTOMER' && (
            <div className="absolute top-3 right-3 text-brand-700">
              <CheckCircle2 className="w-5 h-5 fill-brand-100" />
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Hire Workers</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Find verified professionals for your work.
            </p>
          </div>
        </div>

        {/* Card 2: Worker */}
        <div
          onClick={() => setSelectedRole('WORKER')}
          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            selectedRole === 'WORKER'
              ? 'border-brand-600 bg-brand-50/40 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          {selectedRole === 'WORKER' && (
            <div className="absolute top-3 right-3 text-brand-700">
              <CheckCircle2 className="w-5 h-5 fill-brand-100" />
            </div>
          )}
          <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-800 flex items-center justify-center mb-3">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Become a Worker</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Offer your services and receive jobs.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Input
          label={selectedRole === 'WORKER' ? 'Full Name (as per official ID)' : 'Your Name (Optional)'}
          placeholder="e.g. Ramesh Patel"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required={selectedRole === 'WORKER'}
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        fullWidth
        isLoading={loading}
        icon={<ArrowRight className="w-4 h-4" />}
      >
        {selectedRole === 'WORKER' ? 'Continue to Worker Onboarding' : 'Continue to Dashboard'}
      </Button>
    </form>
  );
}
