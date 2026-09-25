export interface TradeOption {
  id: string;
  name: string;
  nameHi?: string;
  slug: string;
}

export const COMMON_TRADES: TradeOption[] = [
  { id: 'electrician', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', slug: 'electrical' },
  { id: 'plumber', name: 'Plumber', nameHi: 'प्लंबर', slug: 'plumbing' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'कारपेंटर / बढ़ई', slug: 'carpenter' },
  { id: 'painter', name: 'Painter', nameHi: 'पेंटर / पुताई वाला', slug: 'painting' },
  { id: 'cook', name: 'Cook', nameHi: 'कुक / रसोइया', slug: 'cook' },
  { id: 'cleaner', name: 'Cleaner', nameHi: 'क्लीनर / सफाईकर्मी', slug: 'cleaning' },
  { id: 'housekeeper', name: 'Housekeeper', nameHi: 'हाउसकीपर', slug: 'housekeeper' },
  { id: 'gardener', name: 'Gardener', nameHi: 'माली / गार्डनर', slug: 'gardener' },
  { id: 'driver', name: 'Driver', nameHi: 'ड्राइवर / चालक', slug: 'driver' },
  { id: 'mason', name: 'Mason', nameHi: 'राजमिस्त्री / मेसन', slug: 'mason' },
  { id: 'welder', name: 'Welder', nameHi: 'वेल्डर', slug: 'welder' },
  { id: 'mechanic', name: 'Mechanic', nameHi: 'मैकेनिक', slug: 'mechanic' },
  { id: 'ac-technician', name: 'AC Technician', nameHi: 'एसी तकनीशियन', slug: 'ac-technician' },
  { id: 'appliance-repair', name: 'Appliance Repair Technician', nameHi: 'एप्लायंस रिपेयर तकनीशियन', slug: 'appliance-repair' },
  { id: 'security-guard', name: 'Security Guard', nameHi: 'सुरक्षा गार्ड', slug: 'security-guard' },
  { id: 'construction-worker', name: 'Construction Worker', nameHi: 'निर्माण मजदूर', slug: 'construction-worker' },
  { id: 'tailor', name: 'Tailor', nameHi: 'दर्जी / टेलर', slug: 'tailor' },
  { id: 'beautician', name: 'Beautician', nameHi: 'ब्यूटीशियन', slug: 'beautician' },
  { id: 'delivery-worker', name: 'Delivery Worker', nameHi: 'डिलीवरी बॉय / वर्कर', slug: 'delivery-worker' },
  { id: 'office-helper', name: 'Office Helper', nameHi: 'ऑफिस हेल्पर / प्यून', slug: 'office-helper' },
  { id: 'caretaker', name: 'Caretaker', nameHi: 'केयरटेकर', slug: 'caretaker' },
];
