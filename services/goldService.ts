
import { GoogleGenAI } from "@google/genai";
import { loadGoldCache, saveGoldCache, GoldCache } from "./storageService";

export interface GoldPriceResponse {
  price: number;
  sourceUrl?: string;
  lastUpdated?: string;
  isFromCache: boolean;
}

export const fetchCurrentGoldPrice = async (forceRefresh: boolean = false): Promise<GoldPriceResponse> => {
  const now = new Date();
  const cached = loadGoldCache();

  // تحديد "بداية دورة السعر" الحالية
  // الدورة تبدأ يومياً الساعة 1 صباحاً
  const currentDay1AM = new Date(now);
  currentDay1AM.setHours(1, 0, 0, 0);

  let cycleStartTime: Date;
  // إذا كنا الآن قبل الساعة 1 صباحاً، فالدورة الحالية بدأت الساعة 1 صباحاً بالأمس
  if (now < currentDay1AM) {
    cycleStartTime = new Date(currentDay1AM);
    cycleStartTime.setDate(cycleStartTime.getDate() - 1);
  } else {
    // إذا تجاوزنا الواحدة صباحاً، فالدورة بدأت اليوم الساعة 1 صباحاً
    cycleStartTime = currentDay1AM;
  }

  let needsUpdate = false;
  if (!cached) {
    needsUpdate = true;
  } else {
    const cacheDate = new Date(cached.timestamp);
    // إذا كان السعر المخزن تم جلبه قبل بداية الدورة الحالية، نحتاج تحديثاً واحداً فقط
    if (cacheDate < cycleStartTime) {
      needsUpdate = true;
    }
  }

  // إذا وجدنا سعراً صالحاً للدورة الحالية، لا نبحث أبداً ونرجع السعر فوراً
  if (!needsUpdate && cached && !forceRefresh) {
    return {
      price: cached.price,
      sourceUrl: cached.sourceUrl,
      lastUpdated: new Date(cached.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isFromCache: true
    };
  }

  // فقط في حالة عدم وجود سعر للدورة الحالية (يحدث مرة واحدة فقط في اليوم عند أول فتح للتطبيق)
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ما هو سعر شراء جرام الذهب عيار 24 الآن في مصر من موقع egypt.gold-era.com؟ أريد الرقم فقط.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const priceMatch = text.replace(/,/g, '').match(/\d{4,}(\.\d+)?/);
    const price = priceMatch ? parseFloat(priceMatch[0]) : (cached?.price || 4000);
    
    const sourceUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri 
                   || "https://egypt.gold-era.com/ar/%D8%B3%D8%B9%D8%B1-%D8%A7%D9%84%D8%B0%D9%87%D8%A8/";

    const newCache: GoldCache = {
      price,
      sourceUrl,
      timestamp: now.toISOString()
    };

    saveGoldCache(newCache);

    return { 
      price, 
      sourceUrl,
      lastUpdated: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isFromCache: false
    };
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return { 
      price: cached?.price || 4000, 
      sourceUrl: cached?.sourceUrl || "https://egypt.gold-era.com/ar/%D8%B3%D8%B9%D8%B1-%D8%A7%D9%84%D8%B0%D9%87%D8%A8/",
      lastUpdated: cached ? `مستخدم سعر الدورة السابقة` : "خطأ في الاتصال",
      isFromCache: true
    };
  }
};
