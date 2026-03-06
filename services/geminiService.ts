
import { GoogleGenAI } from "@google/genai";
import { InventoryItem, InboundLog, OutboundLog } from '../src/types/index';

export async function askInventoryAI(
  query: string, 
  inventory: InventoryItem[], 
  inbound: InboundLog[], 
  outbound: OutboundLog[]
): Promise<string> {
  try {
    // Always initialize GoogleGenAI inside the function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const context = `
      هوية النظام: أنت "المساعد الذكي لمدير مخازن كلية الحقوق والعلوم السياسية - جامعة غرداية".
      وظيفتك: تدوين حركة الأصناف بدقة وتنبيه المدير بالنواقص.
      
      قواعد العمل الإلزامية:
      1. عند الصرف: اخصم الكمية واسأل بلباقة "من هو المستلم؟ ولأي مصلحة؟".
      2. عند التوريد: أضف الكمية للرصيد.
      3. التنبيه الذكي: أي صنف يقل عن 5 وحدات، حذر منه بشدة باستخدام الرمز ⚠️.
      4. البحث عن العتاد: يمكنك الربط بين الأكواد القديمة (ك/ح/ع/س) والباركود الرقمي الجديد (يبدأ بـ 213).
      
      بيانات المخزون الحالية: ${JSON.stringify(inventory)}
      آخر العمليات الواردة: ${JSON.stringify(inbound.slice(-5))}
      آخر العمليات الصادرة: ${JSON.stringify(outbound.slice(-5))}
      
      نمط الرد:
      - كن رسمياً، بلبقاً، ومستخدماً للمصطلحات الإدارية الجزائرية (رصيد أول المدة، إذن صرف، بطاقة حركة).
      - عند السؤال عن صنف، اعرض تفاصيله ورصيده الحالي بوضوح.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `${context}\n\nUser Query: ${query}` }] }],
      config: {
        temperature: 0.2, // Lower temperature for more factual inventory reporting
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "حدث خطأ أثناء الاتصال بذكاء النظام. يرجى المحاولة لاحقاً.";
  }
}
