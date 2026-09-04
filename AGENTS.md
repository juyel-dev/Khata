# Khata — কাজের নিয়ম

## চালানোর জায়গা: Vercel (GitHub থেকে)
- মূল কোড GitHub-এ (`juyel-dev/Khata`)।
- GitHub-এ push করলে Vercel নিজে `next build` করে চালু করে।
- Firebase ছাড়াও অ্যাপ সম্পূর্ণ অফলাইনে চলবে। Firebase দিলে ক্লাউড সিঙ্ক চালু হবে।

## কোড বদলের নিয়ম
1. **Vercel-এ চলতেই হবে:**
   - প্রতিটা বদলের পর `npm run lint` আর `npm run build` ভুল ছাড়া পাস করতে হবে।
   - পরিষ্কার Next.js 15 App Router কাঠামো রাখুন।
2. **গোপন তথ্য:**
   - repo-তে কোনো চাবি রাখা যাবে না। সব `NEXT_PUBLIC_*` মান `.env.local` / Vercel env থেকে আসবে।
   - নতুন env যোগ করলে `.env.example`-তে লিখুন। Firebase না থাকলে অ্যাপ যেন ভেঙে না যায়।
   - Firestore নিয়ম (`firestore.rules`) বদলালে `security_spec.md`-এর ১২টা হামলা আটকায় কিনা দেখুন।
3. **ডাটা নিয়ম:**
   - টাকা সবসময় পয়সায় (integer) রাখুন, ভগ্নাংশ নয়।
   - Dexie schema বদলালে version বাড়ান, পুরনো ডাটা মুছবেন না।
   - `createdAt` কখনো বদলাবেন না, `updatedAt` সার্ভার সময়ে বসান।
