const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SERVICE_HINDI_MAP = {
  'masonry-brickwork': 'राजमिस्त्री एवं ईंट का काम',
  'plastering-tiling': 'प्लास्टर एवं टाइल्स लगाना',
  'general-construction-labour': 'निर्माण मजदूर',
  'tap-shower-repair': 'नल और शावर मरम्मत / फिटिंग',
  'pipe-leakage': 'पाइपलाइन लीकेज मरम्मत',
  'sanitary-installation': 'टॉयलेट / से्युनिटी इंस्टॉलेशन',
  'water-tank-cleaning': 'पानी की टंकी की सफाई',
  'ac-servicing-repair': 'एसी तकनीशियन / रिपेयर',
  'fan-light-repair': 'पंखा एवं लाइट रिपेयर',
  'room-wiring': 'कमरे की पूरी वायरिंग',
  'switchboard-install': 'स्विचबोर्ड इंस्टॉलेशन',
  'inverter-mcb-setup': 'इन्वर्टर एवं एमसीबी सेटअप',
  'interior-painting': 'अंदरूनी दीवार पेंटिंग',
  'exterior-painting': 'बाहरी दीवार पेंटिंग',
  'wood-polishing': 'दरवाजा और लकड़ी पॉलिश',
  'furniture-shifting': 'फर्नीचर शिफ्टिंग मजदूर',
  'tempo-loading': 'ट्रक / टेम्पो लोडिंग-अनलोडिंग',
  'warehouse-handling': 'गोदाम माल ढुलाई',
  'bathroom-deep-cleaning': 'बाथरूम की गहरी सफाई',
  'full-home-deep-clean': 'पूरे घर की गहरी सफाई',
  'kitchen-degreasing': 'रसोई चिमनी और काउंटर की सफाई',
  'daily-home-cook': 'दैनिक भोजन पकाने वाला (कुक)',
  'party-event-cook': 'पार्टी / इवेंट कुक',
  'door-lock-fitting': 'दरवाजे का ताला / हैंडल फिटिंग',
  'furniture-assembly': 'मॉड्यूलर फर्नीचर असेंबली',
  'woodwork-repair': 'लकड़ी मरम्मत एवं पॉलिश',
  'city-day-driver': 'शहर का एक दिवसीय ड्राइवर',
  'outstation-trip-driver': 'आउटस्टेशन यात्रा ड्राइवर',
  'monthly-driver': 'मासिक व्यक्तिगत ड्राइवर',
  'steam-press': 'स्टीम प्रेस एवं इस्तरी',
  'wash-and-fold': 'कपड़े धोना और मोड़ना (लॉन्ड्री)',
  'pc-laptop-repair': 'कंप्यूटर / लैपटॉप रिपेयर',
  'cctv-install': 'सीसीटीवी कैमरा इंस्टॉलेशन',
  'os-reinstall': 'विंडोज ओएस रीइंस्टॉल',
  'lan-wifi-setup': 'वाई-फाई एवं लैन सेटअप',
  'sweets-farsan-chef': 'मिठाई और फरसाण हलवाई',
  'wedding-halwai': 'शादी-विवाह हलवाई टीम',
  'doorstep-bike-service': 'डोरस्टेप बाइक सर्विस',
  'car-jumpstart-puncture': 'कार बैटरी जम्पस्टार्ट / पंचर',
  'cylinder-floor-carrying': 'गैस सिलेंडर डिलीवरी सहायक',
  'regulator-hose-fitting': 'गैस चूल्हा रेगुलेटर एवं पाइप बदलना',
  '12hr-guard-shift': '12 घंटे की शिफ्ट सुरक्षा गार्ड',
  'monthly-society-guard': 'मासिक सोसाइटी गार्ड / चौकीदार',
  'elder-care-assistant': 'बुजुर्गों की देखभाल / घरेलू सहायक',
  'vacant-property-care': 'खाली संपत्ति की देखरेख',
  'daily-office-attendant': 'दैनिक ऑफिस बॉय / सहायक',
  'monthly-office-assistant': 'मासिक ऑफिस सहायक / चपरासी',
};

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN "nameHi" TEXT;');
    console.log('Added nameHi column to Service table.');
  } catch (e) {
    console.log('Column nameHi may already exist:', e.message);
  }

  const services = await prisma.service.findMany();
  console.log(`Found ${services.length} services.`);

  for (const s of services) {
    const nameHi = SERVICE_HINDI_MAP[s.slug] || s.name;
    await prisma.$executeRawUnsafe(
      'UPDATE "Service" SET "nameHi" = ? WHERE "id" = ?',
      nameHi,
      s.id
    );
  }
  console.log('Updated nameHi for all services in database.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
