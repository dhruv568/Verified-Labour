/**
 * Centralized service Hindi translations mapping & helper
 */

export const SERVICE_HINDI_MAP: Record<string, string> = {
  'masonry-brickwork': 'राजमिस्त्री एवं ईंट का काम',
  'plastering-tiling': 'प्लास्टर एवं टाइल्स लगाना',
  'general-construction-labour': 'निर्माण मजदूर',
  'tap-shower-repair': 'नल और शावर मरम्मत व फिटिंग',
  'pipe-leakage': 'पाइपलाइन लीकेज मरम्मत',
  'sanitary-installation': 'टॉयलेट व सेनेटरी इंस्टॉलेशन',
  'water-tank-cleaning': 'पानी की टंकी की सफाई',
  'ac-servicing-repair': 'एसी तकनीशियन व रिपेयर',
  'fan-light-repair': 'पंखा एवं लाइट रिपेयर',
  'fan-capacitor-replacement': 'पंखे का कैपेसिटर बदलना',
  'fan-repair': 'पंखे की मरम्मत',
  'wiring-repair': 'वायरिंग की मरम्मत',
  'switch-replacement': 'स्विच बदलना',
  'socket-replacement': 'सॉकेट बदलना',
  'light-installation': 'लाइट लगाना',
  'fan-installation': 'पंखा लगाना',
  'mcb-installation': 'एमसीबी लगाना',
  'short-circuit-repair': 'शॉर्ट सर्किट की मरम्मत',
  'new-wiring': 'नई वायरिंग',
  'room-wiring': 'कमरे की पूरी वायरिंग',
  'switchboard-install': 'स्विचबोर्ड इंस्टॉलेशन',
  'inverter-mcb-setup': 'इन्वर्टर एवं एमसीबी सेटअप',
  'interior-painting': 'अंदरूनी दीवार पेंटिंग',
  'exterior-painting': 'बाहरी दीवार पेंटिंग',
  'wood-polishing': 'दरवाजा और लकड़ी पॉलिश',
  'furniture-shifting': 'फर्नीचर शिफ्टिंग मजदूर',
  'tempo-loading': 'टेम्पो व ट्रक लोडिंग-अनलोडिंग',
  'warehouse-handling': 'गोदाम माल ढुलाई',
  'bathroom-deep-cleaning': 'बाथरूम की गहरी सफाई',
  'full-home-deep-clean': 'पूरे घर की गहरी सफाई',
  'kitchen-degreasing': 'रसोई चिमनी और काउंटर की सफाई',
  'daily-home-cook': 'दैनिक भोजन पकाने वाला',
  'party-event-cook': 'पार्टी व इवेंट कुक',
  'door-lock-fitting': 'दरवाजे का ताला व हैंडल फिटिंग',
  'furniture-assembly': 'मॉड्यूलर फर्नीचर असेंबली',
  'woodwork-repair': 'लकड़ी मरम्मत एवं पॉलिश',
  'city-day-driver': 'शहर का एक दिवसीय ड्राइवर',
  'outstation-trip-driver': 'आउटस्टेशन यात्रा ड्राइवर',
  'monthly-driver': 'मासिक व्यक्तिगत ड्राइवर',
  'steam-press': 'स्टीम प्रेस एवं इस्तरी',
  'wash-and-fold': 'कपड़े धोना और मोड़ना (लॉन्ड्री)',
  'pc-laptop-repair': 'कंप्यूटर व लैपटॉप रिपेयर',
  'cctv-install': 'सीसीटीवी कैमरा इंस्टॉलेशन',
  'os-reinstall': 'विंडोज ओएस रीइंस्टॉल',
  'lan-wifi-setup': 'वाई-फाई एवं लैन सेटअप',
  'doorstep-bike-service': 'डोरस्टेप बाइक सर्विस',
  'car-jumpstart-puncture': 'कार बैटरी जम्पस्टार्ट व पंचर',
  'cylinder-floor-carrying': 'गैस सिलेंडर डिलीवरी सहायक',
  'regulator-hose-fitting': 'गैस चूल्हा रेगुलेटर एवं पाइप बदलना',
  '12hr-guard-shift': '12 घंटे की शिफ्ट सुरक्षा गार्ड',
  'monthly-society-guard': 'मासिक सोसाइटी गार्ड',
  'daily-office-attendant': 'दैनिक ऑफिस बॉय सहायक',
  'monthly-office-assistant': 'मासिक ऑफिस सहायक',
};

export type ServiceInput = string | { name: string; nameHi?: string | null; slug?: string };

export function getServiceHindiName(service: ServiceInput): string {
  if (typeof service === 'string') {
    const parts = service.split(' / ');
    return parts.length > 1 ? parts[1].trim() : parts[0].trim();
  }
  if (service.nameHi && service.nameHi.trim() && service.nameHi !== service.name) {
    return service.nameHi.trim().replace(/\s*\/\s*/g, ' व ');
  }
  if (service.slug && SERVICE_HINDI_MAP[service.slug]) {
    return SERVICE_HINDI_MAP[service.slug];
  }
  return service.name ? (service.name.split(' / ')[1]?.trim() || service.name.split(' / ')[0].trim()) : '';
}

export function getServiceDisplayName(
  service: ServiceInput,
  isHindi: boolean
): string {
  if (typeof service === 'string') {
    if (isHindi) {
      const parts = service.split(' / ');
      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    }
    return service.split(' / ')[0].trim();
  }
  if (isHindi) {
    return getServiceHindiName(service);
  }
  return service.name ? service.name.split(' / ')[0].trim() : '';
}

export function isExcludedServiceOrCategory(item?: {
  name?: string | null;
  slug?: string | null;
  title?: string | null;
  nameHi?: string | null;
  hindiTitle?: string | null;
}): boolean {
  if (!item) return false;
  const fields = [item.name, item.slug, item.title, item.nameHi, item.hindiTitle];
  for (const f of fields) {
    if (!f) continue;
    const lower = String(f).toLowerCase().replace(/[\s\-_]/g, '');
    if (lower.includes('pagadhi') || lower.includes('childcare')) {
      return true;
    }
  }
  return false;
}


