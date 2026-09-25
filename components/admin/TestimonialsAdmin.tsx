'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Save,
  Star,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export interface TestimonialSlotData {
  id?: string;
  slot: number; // 1 or 2
  customerName: string;
  profession: string;
  location: string;
  testimonialText: string;
  rating: number;
  isActive: boolean;
  imageUrl: string;
}

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<TestimonialSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ slot: number; type: 'success' | 'error'; message: string } | null>(null);

  // Preview data URLs for uploaded files before saving
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});

  const fetchAdminTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = await res.json();
      if (data.success && Array.isArray(data.testimonials)) {
        // Enforce exactly 2 slots
        const slots: TestimonialSlotData[] = [1, 2].map((slotNum) => {
          const found = data.testimonials.find((t: any) => t.slot === slotNum);
          return (
            found || {
              slot: slotNum,
              customerName: slotNum === 1 ? 'Priya Sharma' : 'Rajesh Kumar',
              profession: slotNum === 1 ? 'Homeowner' : 'Operations Manager',
              location: slotNum === 1 ? 'Surat, Gujarat' : 'Mumbai, Maharashtra',
              testimonialText: '',
              rating: 5,
              isActive: true,
              imageUrl: `/images/testimonials/testimonial-${slotNum}.jpg`,
            }
          );
        });
        setTestimonials(slots);
      }
    } catch (err: any) {
      console.error('Failed to load admin testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminTestimonials();
  }, []);

  const handleFieldChange = (slot: number, field: keyof TestimonialSlotData, value: any) => {
    setTestimonials((prev) =>
      prev.map((item) => (item.slot === slot ? { ...item, [field]: value } : item))
    );
  };

  const handleImageFileSelect = async (slot: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({
        slot,
        type: 'error',
        message: 'Invalid file format. Please upload JPG, PNG, or WEBP.',
      });
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        slot,
        type: 'error',
        message: 'File size too large. Maximum size is 5MB.',
      });
      return;
    }

    // Live local preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews((prev) => ({ ...prev, [slot]: previewUrl }));

    // Upload to server
    setUploadingSlot(slot);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slot', slot.toString());

      const res = await fetch('/api/admin/testimonials/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({
          slot,
          type: 'error',
          message: data.error || 'Failed to upload image',
        });
        return;
      }

      handleFieldChange(slot, 'imageUrl', data.imageUrl);
      setFeedback({
        slot,
        type: 'success',
        message: 'Image uploaded successfully! Click "Save Changes" to publish.',
      });
    } catch (err: any) {
      setFeedback({
        slot,
        type: 'error',
        message: 'Upload error: ' + err.message,
      });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSaveSlot = async (slot: number) => {
    const cardData = testimonials.find((t) => t.slot === slot);
    if (!cardData) return;

    if (!cardData.customerName.trim()) {
      setFeedback({
        slot,
        type: 'error',
        message: 'Customer Name is required.',
      });
      return;
    }

    setSavingSlot(slot);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({
          slot,
          type: 'error',
          message: data.error || 'Failed to save testimonial card',
        });
        return;
      }

      setFeedback({
        slot,
        type: 'success',
        message: `Card ${slot} saved! Changes are live on the website.`,
      });
      fetchAdminTestimonials();
    } catch (err: any) {
      setFeedback({
        slot,
        type: 'error',
        message: 'Save failed: ' + err.message,
      });
    } finally {
      setSavingSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        <p className="text-xs font-bold text-slate-500">Loading Testimonial Management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-navy-950 text-white p-4 sm:p-5 rounded-2xl border border-navy-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-400 text-navy-950 text-[10px] font-black rounded uppercase">
              Strict 2-Slot Enforced
            </span>
            <h3 className="font-black text-white text-base">Testimonials Management</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Edit Card 1 and Card 2 below. Replace images (3:2 ratio recommended), edit text, set ratings, or toggle active status.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdminTestimonials}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-white border-navy-800 hover:bg-navy-900 shrink-0"
        >
          Refresh
        </Button>
      </div>

      {/* Grid of EXACTLY 2 Testimonial Card Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((slotNum) => {
          const card = testimonials.find((t) => t.slot === slotNum) || {
            slot: slotNum,
            customerName: '',
            profession: '',
            location: '',
            testimonialText: '',
            rating: 5,
            isActive: true,
            imageUrl: `/images/testimonials/testimonial-${slotNum}.jpg`,
          };

          const isSaving = savingSlot === slotNum;
          const isUploading = uploadingSlot === slotNum;
          const slotFeedback = feedback?.slot === slotNum ? feedback : null;
          const currentPreview = imagePreviews[slotNum] || card.imageUrl;

          return (
            <Card key={slotNum} variant="default" padding="lg" className="space-y-5 border-2 border-slate-200 shadow-sm relative">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    #{slotNum}
                  </span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">
                      Testimonial Card {slotNum}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">Slot {slotNum} of 2</span>
                  </div>
                </div>

                {/* Active / Inactive Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleFieldChange(slotNum, 'isActive', !card.isActive)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    card.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {card.isActive ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active on Website</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Banner */}
              {slotFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    slotFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {slotFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{slotFeedback.message}</span>
                </div>
              )}

              {/* Image Preview & Upload Controls (3:2 Aspect Ratio Container) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Testimonial Image (3:2 Aspect Ratio)
                </label>

                <div className="relative w-full aspect-[3/2] rounded-2xl bg-slate-100 overflow-hidden border-2 border-dashed border-slate-300 group">
                  <Image
                    src={currentPreview}
                    alt={`Preview Slot ${slotNum}`}
                    fill
                    className="object-cover object-center"
                    unoptimized={currentPreview.startsWith('blob:')}
                  />

                  {isUploading && (
                    <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                      <span className="text-xs font-bold">Uploading new image...</span>
                    </div>
                  )}

                  {/* Upload Overlay Button */}
                  <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 z-10">
                    <label className="px-4 py-2.5 bg-white text-navy-950 rounded-xl font-black text-xs shadow-lg cursor-pointer hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-2">
                      <Upload className="w-4 h-4 text-brand-600" />
                      <span>Replace Image</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageFileSelect(slotNum, e)}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Supports JPG, PNG, WEBP (Max 5MB)</span>
                  <label className="text-brand-600 font-bold hover:underline cursor-pointer">
                    Upload File
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageFileSelect(slotNum, e)}
                    />
                  </label>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={card.customerName || ''}
                    onChange={(e) => handleFieldChange(slotNum, 'customerName', e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Profession / Designation
                    </label>
                    <input
                      type="text"
                      value={card.profession || ''}
                      onChange={(e) => handleFieldChange(slotNum, 'profession', e.target.value)}
                      placeholder="e.g. Homeowner"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={card.location || ''}
                      onChange={(e) => handleFieldChange(slotNum, 'location', e.target.value)}
                      placeholder="e.g. Surat, Gujarat"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Testimonial Text / Quote
                  </label>
                  <textarea
                    rows={3}
                    value={card.testimonialText || ''}
                    onChange={(e) => handleFieldChange(slotNum, 'testimonialText', e.target.value)}
                    placeholder="Short testimonial review text..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rating (Stars)
                  </label>
                  <select
                    value={card.rating || 5}
                    onChange={(e) => handleFieldChange(slotNum, 'rating', Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600 bg-white font-bold text-amber-600"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                    <option value={2}>★★☆☆☆ (2 Stars)</option>
                    <option value={1}>★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Save Button for Slot */}
              <div className="pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="brand"
                  size="md"
                  onClick={() => handleSaveSlot(slotNum)}
                  isLoading={isSaving}
                  icon={<Save className="w-4 h-4" />}
                  className="w-full justify-center text-xs font-bold"
                >
                  Save Testimonial Card {slotNum}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
