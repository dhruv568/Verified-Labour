'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Save,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
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
  imageZoom: number;
  imageOffsetX: number;
  imageOffsetY: number;
}

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState<TestimonialSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ slot: number; type: 'success' | 'error'; message: string } | null>(null);

  // Dragging state for interactive positioning
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);

  // Preview data URLs for uploaded files before saving
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({});

  const fetchAdminTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/testimonials?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.testimonials)) {
        // Clear local blob previews so persisted database image URLs are displayed directly
        setImagePreviews({});
        const slots: TestimonialSlotData[] = [1, 2].map((slotNum) => {
          const found = data.testimonials.find((t: any) => t.slot === slotNum);
          return {
            slot: slotNum,
            customerName: found?.customerName || (slotNum === 1 ? 'Priya Sharma' : 'Rajesh Kumar'),
            profession: found?.profession || (slotNum === 1 ? 'Homeowner & Interior Designer' : 'Operations Manager'),
            location: found?.location || (slotNum === 1 ? 'Surat, Gujarat' : 'Mumbai, Maharashtra'),
            testimonialText: found?.testimonialText || '',
            rating: typeof found?.rating === 'number' ? found.rating : 5,
            isActive: found?.isActive !== undefined ? Boolean(found.isActive) : true,
            imageUrl: (found?.imageUrl && found.imageUrl.trim().length > 0)
              ? found.imageUrl
              : `/images/testimonials/testimonial-${slotNum}.jpg`,
            imageZoom: typeof found?.imageZoom === 'number' ? found.imageZoom : 1.0,
            imageOffsetX: typeof found?.imageOffsetX === 'number' ? found.imageOffsetX : 0.0,
            imageOffsetY: typeof found?.imageOffsetY === 'number' ? found.imageOffsetY : 0.0,
          };
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
    setTestimonials((prev) => {
      const exists = prev.some((item) => item.slot === slot);
      if (!exists) {
        const defaultCard: TestimonialSlotData = {
          slot,
          customerName: slot === 1 ? 'Priya Sharma' : 'Rajesh Kumar',
          profession: slot === 1 ? 'Homeowner & Interior Designer' : 'Operations Manager',
          location: slot === 1 ? 'Surat, Gujarat' : 'Mumbai, Maharashtra',
          testimonialText: '',
          rating: 5,
          isActive: true,
          imageUrl: `/images/testimonials/testimonial-${slot}.jpg`,
          imageZoom: 1.0,
          imageOffsetX: 0.0,
          imageOffsetY: 0.0,
          [field]: value,
        };
        return [...prev, defaultCard];
      }
      return prev.map((item) => (item.slot === slot ? { ...item, [field]: value } : item));
    });
  };

  const handleResetAdjustment = (slot: number) => {
    setTestimonials((prev) =>
      prev.map((item) =>
        item.slot === slot
          ? { ...item, imageZoom: 1.0, imageOffsetX: 0.0, imageOffsetY: 0.0 }
          : item
      )
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

      // Update state with uploaded image URL and clean up blob preview
      handleFieldChange(slot, 'imageUrl', data.imageUrl);
      setImagePreviews((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      URL.revokeObjectURL(previewUrl);

      setFeedback({
        slot,
        type: 'success',
        message: 'Image uploaded and saved to database! Adjust zoom and positioning below if needed.',
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
        message: `Card ${slot} saved! Changes are live on the website with your custom framing.`,
      });

      // Clear local preview blobs and refetch fresh database state
      setImagePreviews((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      await fetchAdminTestimonials();
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

  // Drag-to-Position logic
  const handleMouseDown = (slotNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    startDrag(slotNum, e.clientX, e.clientY, rect);
  };

  const handleTouchStart = (slotNum: number, e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    startDrag(slotNum, touch.clientX, touch.clientY, rect);
  };

  const startDrag = (slotNum: number, startClientX: number, startClientY: number, containerRect: DOMRect) => {
    const card = testimonials.find((t) => t.slot === slotNum);
    if (!card) return;

    const initialX = card.imageOffsetX ?? 0;
    const initialY = card.imageOffsetY ?? 0;
    setDraggingSlot(slotNum);

    const onMove = (moveX: number, moveY: number) => {
      const deltaX = moveX - startClientX;
      const deltaY = moveY - startClientY;

      const percentX = (deltaX / containerRect.width) * 100;
      const percentY = (deltaY / containerRect.height) * 100;

      const newX = Math.min(Math.max(Math.round((initialX + percentX) * 10) / 10, -50), 50);
      const newY = Math.min(Math.max(Math.round((initialY + percentY) * 10) / 10, -50), 50);

      handleFieldChange(slotNum, 'imageOffsetX', newX);
      handleFieldChange(slotNum, 'imageOffsetY', newY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      onMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setDraggingSlot(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setDraggingSlot(null);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
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
            Edit Card 1 and Card 2 below. Replace images (3:2 ratio), adjust zoom & drag to frame the photo, edit text, set ratings, or toggle active status.
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
            imageZoom: 1.0,
            imageOffsetX: 0.0,
            imageOffsetY: 0.0,
          };

          const isSaving = savingSlot === slotNum;
          const isUploading = uploadingSlot === slotNum;
          const isDragging = draggingSlot === slotNum;
          const slotFeedback = feedback?.slot === slotNum ? feedback : null;
          const currentPreview = imagePreviews[slotNum] || card.imageUrl;

          const zoomVal = card.imageZoom ?? 1.0;
          const offsetXVal = card.imageOffsetX ?? 0.0;
          const offsetYVal = card.imageOffsetY ?? 0.0;

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

              {/* Image Preview & Interactive Drag Positioning Box (Fixed 3:2 Aspect Ratio) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Image Framing Preview (3:2 Aspect Ratio)
                  </label>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Zoom: {zoomVal.toFixed(2)}x | X: {offsetXVal}% | Y: {offsetYVal}%
                  </span>
                </div>

                <div
                  onMouseDown={(e) => handleMouseDown(slotNum, e)}
                  onTouchStart={(e) => handleTouchStart(slotNum, e)}
                  className={`relative w-full aspect-[3/2] rounded-2xl bg-slate-900 overflow-hidden border-2 border-slate-300 select-none group transition-shadow ${
                    isDragging ? 'cursor-grabbing shadow-xl ring-2 ring-brand-500' : 'cursor-grab hover:shadow-md'
                  }`}
                >
                  <Image
                    src={currentPreview}
                    alt={`Preview Slot ${slotNum}`}
                    fill
                    className="object-cover pointer-events-none transition-transform duration-75"
                    style={{
                      transform: `scale(${zoomVal}) translate(${offsetXVal}%, ${offsetYVal}%)`,
                      transformOrigin: 'center center',
                    }}
                    unoptimized={true}
                  />

                  {isUploading && (
                    <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                      <span className="text-xs font-bold">Uploading new image...</span>
                    </div>
                  )}

                  {/* Drag positioning overlay hint */}
                  <div className="absolute top-3 left-3 pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-xl text-[10px] font-bold shadow-md border border-white/20">
                      <Move className="w-3 h-3 text-amber-400" />
                      <span>{isDragging ? 'Dragging image...' : 'Drag to position'}</span>
                    </span>
                  </div>

                  {/* Upload Overlay Button */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <label className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-navy-950 rounded-xl font-bold text-xs shadow-md cursor-pointer hover:bg-white active:scale-95 transition-all flex items-center gap-1.5 border border-white/80">
                      <Upload className="w-3.5 h-3.5 text-brand-600" />
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

                {/* IMAGE ZOOM & POSITION CONTROLS */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  {/* Zoom Controls */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-brand-600" />
                        <span>Zoom Level</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(slotNum, 'imageZoom', Math.max(1.0, Math.round((zoomVal - 0.1) * 100) / 100))
                          }
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-xs"
                          title="Zoom Out"
                        >
                          −
                        </button>
                        <span className="w-12 text-center font-mono text-xs font-black text-brand-600">
                          {zoomVal.toFixed(2)}x
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleFieldChange(slotNum, 'imageZoom', Math.min(3.0, Math.round((zoomVal + 0.1) * 100) / 100))
                          }
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 active:scale-95 flex items-center justify-center text-xs"
                          title="Zoom In"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoomVal}
                      onChange={(e) => handleFieldChange(slotNum, 'imageZoom', parseFloat(e.target.value))}
                      className="w-full accent-brand-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Position Sliders & Reset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>↔ Horizontal (X)</span>
                        <span className="font-mono text-slate-800">{offsetXVal}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={offsetXVal}
                        onChange={(e) => handleFieldChange(slotNum, 'imageOffsetX', parseFloat(e.target.value))}
                        className="w-full accent-slate-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>↕ Vertical (Y)</span>
                        <span className="font-mono text-slate-800">{offsetYVal}%</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={offsetYVal}
                        onChange={(e) => handleFieldChange(slotNum, 'imageOffsetY', parseFloat(e.target.value))}
                        className="w-full accent-slate-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Reset Adjustment Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleResetAdjustment(slotNum)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Framing</span>
                    </button>
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
