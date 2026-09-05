# Khata — কাজের নিয়ম

## App-এর আসল ধারণা (এইটাই সত্য, নিচের বাকি নিয়ম এর অধীনে)
- এটা **personal simple money ledger** — lending/borrowing book (কে কত পায়, কে কত দেয়) না।
  আগে এই repo-তে Google AI Studio-এর বানানো একটা "Customer/Person" ভিত্তিক lending system
  ছিল — সেটা ইচ্ছাকৃতভাবে পুরোপুরি বাদ দেওয়া হয়েছে। কোনো পরিবর্তন করার সময় সেই পুরনো
  ধারণায় (Person entity, owesYou/youOwe, customer balance) ফিরে যাওয়া যাবে না।
- কাঠামো: **Khata (notebook)** → তার ভেতরে flat **Transaction** list (নাম, তারিখ-সময়, ±amount)।
  "Individual" ট্যাব শুধু একই খাতার transaction-গুলো নাম দিয়ে group করে দেখায় — এটা আলাদা
  entity/route না, নতুন Person system পুনরায় বানানো নয়।
- নতুন feature বা বদল করার আগে ব্যবহারকারীর (Juyel) সরাসরি নির্দেশ/প্ল্যান অনুসরণ করুন —
  এই ফাইল বা repo-র পুরনো কোড দেখে ধারণা করে scope বাড়াবেন না। দ্বিধা থাকলে জিজ্ঞাসা করুন,
  অনুমান করে এগিয়ে যাবেন না।

## চালানোর জায়গা: Vercel (GitHub থেকে)
- মূল কোড GitHub-এ (`juyel-dev/Khata`)।
- GitHub-এ push করলে Vercel নিজে `next build` করে চালু করে।
- Firebase ছাড়াও অ্যাপ সম্পূর্ণ অফলাইনে চলবে। Firebase দিলে ক্লাউড সিঙ্ক চালু হবে (personal/optional backup, বাধ্যতামূলক না)।

## কোড বদলের নিয়ম
1. **Vercel-এ চলতেই হবে:**
   - প্রতিটা বদলের পর `npm run lint` আর `npm run build`/`npx tsc --noEmit` ভুল ছাড়া পাস করতে হবে।
   - পরিষ্কার Next.js App Router কাঠামো রাখুন।
2. **গোপন তথ্য:**
   - repo-তে কোনো চাবি/token রাখা যাবে না। সব `NEXT_PUBLIC_*` মান `.env.local` / Vercel env থেকে আসবে।
   - নতুন env যোগ করলে `.env.example`-তে লিখুন। Firebase না থাকলে অ্যাপ যেন ভেঙে না যায়।
   - `firestore.rules` বদলালে `security_spec.md`-এর ১২টা হামলা (Dirty Dozen) আটকায় কিনা
     ম্যানুয়ালি re-verify করুন, এবং **rules বদলের পর `firebase deploy --only firestore:rules`
     আলাদা করে চালাতে হবে** — GitHub push শুধু Vercel build করে, rules deploy করে না।
3. **ডাটা নিয়ম:**
   - টাকা সবসময় পয়সায় (integer) রাখুন, ভগ্নাংশ নয়।
   - Dexie schema বদলালে version বাড়ান, পুরনো ডাটা মুছবেন না — migration লিখে পুরনো ফিল্ড নতুনে রূপান্তর করুন।
   - `createdAt` কখনো বদলাবেন না, `updatedAt` সার্ভার সময়ে বসান।
   - Delete মানে soft-delete (`deletedAt` tombstone) — সরাসরি hard-delete শুধু "Recently Deleted"
     থেকে permanent delete/auto-purge-এর সময়।
