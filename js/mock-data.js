/* Mock interviews — five versions, five sections each, twenty questions apiece.
 *
 * The five versions are five different kinds of employer, because the same job
 * title is interviewed very differently by a two-person boutique and a mall
 * chain with daily targets. Working through all five means very little can come
 * up on the day that she has not already said out loud once.
 *
 * Sections are the same shape everywhere so the run feels like a real interview:
 *   1 welcome and small talk      2 experience and skills
 *   3 this role and this store    4 on the shop floor (situational)
 *   5 closing — hours, money, her questions
 *
 * `q` is what gets read aloud. `tip` is what the interviewer is actually
 * listening for — short, plain, and never a script to memorise.
 */
window.MockInterviews = [
  /* ====================================================== 1. BOUTIQUE ===== */
  {
    id: "boutique",
    name: "Small boutique",
    tone: "Warm and personal",
    blurb: "A two- or three-person independent jewelry shop. The owner is probably interviewing you. They care most about whether customers will like you and whether you will stay.",
    sections: [
      {
        title: "Welcome",
        questions: [
          { q: "Come in, have a seat. Did you find us okay?",
            tip: "Small talk, not a test. One warm sentence, then thank them for the time. Do not tell the whole story of your journey." },
          { q: "So, tell me a little about yourself.",
            tip: "Under a minute. Two years in retail, most recently jewelry, you like helping people choose. Work only — not family or visa history." },
          { q: "What kind of work have you enjoyed the most so far?",
            tip: "Pick something real and say why. Helping someone choose a gift is a good answer here because it is what this shop does all day." },
          { q: "What made you want to work in a small shop instead of a big store?",
            tip: "You get to know the regulars and learn the whole job, not one small part. Do not criticise big stores." },
        ],
      },
      {
        title: "Experience and skills",
        questions: [
          { q: "Walk me through your last job. What did a normal day look like?",
            tip: "Open, tidy the cases, serve customers, check stock, close. Concrete beats impressive." },
          { q: "You have sold jewelry before. What kind, and who was buying it?",
            tip: "Say what you actually sold and who for — gifts, weddings, everyday pieces. It shows you remember your customers." },
          { q: "How comfortable are you with the till, stock counts and paperwork?",
            tip: "Say yes and give one example — you checked stock and expiry dates in the pharmacy, you counted stock weekly in the jewelry shop." },
          { q: "What is something a customer taught you?",
            tip: "A small, human answer works: that people need time, or that the quiet ones often buy. Shows you pay attention." },
        ],
      },
      {
        title: "This role and this store",
        questions: [
          { q: "What do you know about our shop?",
            tip: "Name one specific thing — a collection, that pieces are made in the shop, something you saw when you visited. Visit before the interview." },
          { q: "Why do you want this job in particular?",
            tip: "One honest reason about the shop, one about the work. Not 'I need a job'." },
          { q: "This is mostly selling, but everyone also cleans cases and packs orders. How do you feel about that?",
            tip: "Say plainly that you expect it and have done it. In a small shop this question is really 'are you going to be difficult?'" },
          { q: "Where would you like to be in two years?",
            tip: "Still here, knowing the products well, trusted with more. Do not describe a plan that obviously leads away from them." },
        ],
      },
      {
        title: "On the shop floor",
        questions: [
          { q: "A customer walks in and says, I'm just looking. What do you do?",
            tip: "Say hello, tell them to take their time, mention one thing that is new, then step back and stay visible. Never hover." },
          { q: "A man wants an engagement ring, has no idea what he wants, and his budget is small. Take me through it.",
            tip: "Ask about her first — her style, what she already wears. Then show three options inside his budget. Never make him say the budget twice." },
          { q: "A customer comes back angry because a chain broke after two weeks. What do you say?",
            tip: "Let them finish. Apologise for the trouble, not for the shop. Look at it, say what you can do, get help if it is above you." },
          { q: "It is quiet and there are no customers. What do you do?",
            tip: "Clean the cases, tidy stock, learn the pieces you cannot describe yet. Owners of small shops watch for this answer." },
        ],
      },
      {
        title: "Closing",
        questions: [
          { q: "What days and hours can you work? Are weekends okay?",
            tip: "Know your real answer before you walk in. Say it clearly. Weekends matter in retail — be honest, not vague." },
          { q: "What are you hoping to earn?",
            tip: "Give a range you have checked for this area, and say you are open. Never say 'whatever you offer'." },
          { q: "Is there anything on your resume you would like to explain?",
            tip: "A calm, short answer about the gap or the move. No apologising and no long story." },
          { q: "What questions do you have for me?",
            tip: "Always have two. What does a good first three months look like? Who would I be working with day to day?" },
        ],
      },
    ],
  },

  /* ======================================================= 2. LUXURY ====== */
  {
    id: "luxury",
    name: "Luxury flagship",
    tone: "Formal and polished",
    blurb: "A high-end brand with a trained interviewer and a scorecard. Slower, more formal, and they will ask you to give examples. Speak a little more carefully than usual.",
    sections: [
      {
        title: "Welcome",
        questions: [
          { q: "Thank you for coming in today. How was your journey here?",
            tip: "One short polite sentence. In a formal interview the opening sets your tone — calm, not chatty." },
          { q: "Please introduce yourself, and tell me why you applied for this position.",
            tip: "Two parts, so answer both. Who you are in three sentences, then one clear reason for this brand." },
          { q: "How would a former manager describe you?",
            tip: "Pick two words and give the evidence — 'reliable, because I opened the shop alone', not just adjectives." },
          { q: "What does luxury service mean to you?",
            tip: "Time and attention. The customer is never rushed and never made to feel small for asking the price." },
        ],
      },
      {
        title: "Experience and skills",
        questions: [
          { q: "Tell me about your experience selling something expensive — a purchase people think about before they buy.",
            tip: "Jewelry is exactly this. Describe how you gave them time, asked questions, and let them come back." },
          { q: "How do you build a relationship so a client comes back and asks for you by name?",
            tip: "Remember what they bought and who it was for, follow up after, do not push. Say what you actually did." },
          { q: "What do you know about diamonds and precious metals?",
            tip: "The four Cs — cut, color, clarity, carat — and the difference between gold karats, plated and solid. Say honestly what you still want to learn." },
          { q: "Tell me about a time you were trusted with something valuable or confidential.",
            tip: "Handling stock, cash, or a customer's private reason for buying. Show you understand discretion." },
        ],
      },
      {
        title: "This role and this store",
        questions: [
          { q: "Why this brand and not another one?",
            tip: "One concrete thing about them — how they make pieces, their service reputation, something you saw in store. Generic praise is obvious." },
          { q: "This role includes clienteling — keeping a client book and following up. Are you comfortable with that?",
            tip: "Yes, and say what following up looks like: a note when something arrives that suits them, not chasing." },
          { q: "Our clients sometimes spend several thousand dollars. How would you handle that pressure?",
            tip: "Say it plainly — the amount does not change the job, which is listening and being accurate. Nerves are fine, panic is not." },
          { q: "If we hired you, what would your first month look like?",
            tip: "Learn the collections, watch the experienced staff, ask questions, start serving. Humble and specific." },
        ],
      },
      {
        title: "On the shop floor",
        questions: [
          { q: "A client is disappointed because a repair came back late. They are calm but unhappy. What do you do?",
            tip: "Apologise once, properly. Find out exactly where it is. Give them a real date, not a hopeful one. Then follow up yourself." },
          { q: "Two clients need you at the same time, and one is clearly ready to buy. How do you handle it?",
            tip: "Acknowledge both out loud. Never leave someone standing without a word. Get a colleague if there is one." },
          { q: "A client asks about a stone and you do not know the answer. What do you say?",
            tip: "Say you do not know and that you will find out — then do. Guessing in a jewelry shop is how you lose a sale and a client." },
          { q: "A client asks for a discount the brand does not give. How do you keep the sale?",
            tip: "Be straight that the price is the price, then move to value — the making, the guarantee, the service. Do not apologise repeatedly." },
        ],
      },
      {
        title: "Closing",
        questions: [
          { q: "What is your availability, including holidays?",
            tip: "Luxury retail is busiest in December. If you can work it, say so clearly — it is worth a lot here." },
          { q: "What salary range are you looking for?",
            tip: "Give a researched range and say it once, calmly. Then stop talking." },
          { q: "We are seeing several candidates this week. Why should it be you?",
            tip: "Do not oversell. Two real strengths and one sentence about wanting to stay and grow. Confidence, not a speech." },
          { q: "What would you like to ask me?",
            tip: "Ask about training and about how success is measured in the first six months. Both show you plan to be good at it." },
        ],
      },
    ],
  },

  /* ==================================================== 3. MALL CHAIN ===== */
  {
    id: "chain",
    name: "Mall chain",
    tone: "Fast and target-driven",
    blurb: "A busy chain store — think a jewelry or accessories brand in a shopping centre. Quick questions, and they will ask directly about targets, hours and add-ons.",
    sections: [
      {
        title: "Welcome",
        questions: [
          { q: "Hi, thanks for coming in. Have you shopped with us before?",
            tip: "If yes, say what you bought or looked at. If no, say what you noticed about the store today. Never just 'no'." },
          { q: "Tell me about yourself in about a minute.",
            tip: "They mean it about the minute. Retail experience, jewelry experience, what you are looking for. Stop when you are done." },
          { q: "What do you like about working in retail?",
            tip: "Something honest about people or pace. Avoid 'I like fashion' on its own — everyone says it." },
          { q: "It is a long shift on your feet. How do you keep your energy up?",
            tip: "They are checking stamina, politely. Say you are used to it and mention how you actually manage it." },
        ],
      },
      {
        title: "Experience and skills",
        questions: [
          { q: "Have you worked with sales targets before? Tell me about that.",
            tip: "If yes, say the shape of it and how you did. If no, say you understand why they exist and that you like something to aim at." },
          { q: "What is the busiest shop floor you have worked on?",
            tip: "Describe one genuinely busy day and what you did to keep it moving. Busy is the whole job here." },
          { q: "There is a queue and you are alone at the till. What do you do?",
            tip: "Acknowledge the queue out loud, keep moving, stay friendly with each person. Calling for help is a good answer, not a weak one." },
          { q: "Tell me about a time you sold something extra — a cleaning kit, a warranty, a second piece.",
            tip: "This is the add-on question. Describe suggesting something that genuinely suited what they were buying." },
        ],
      },
      {
        title: "This role and this store",
        questions: [
          { q: "This job has a daily target and a weekly one. How does that sound to you?",
            tip: "Say it plainly: you are fine with it, and targets are easier when you actually help people. Hesitating here costs the job." },
          { q: "You would also be asked to sign customers up for our rewards program. How would you ask for that?",
            tip: "Show you would fit it into the sale naturally, at the till, with the reason for the customer — not read from a card." },
          { q: "Why do you want to work here and not the shop next door?",
            tip: "One specific thing about this brand or this store. Even 'the staff here were friendly when I came in' beats nothing." },
          { q: "How many hours a week are you looking for?",
            tip: "Have a number ready, and a range. Chains build rotas around this answer." },
        ],
      },
      {
        title: "On the shop floor",
        questions: [
          { q: "It is Saturday, the store is full, and one customer wants to try on six rings. What do you do?",
            tip: "Serve them properly but keep your eyes up — greet others as they come in so nobody feels ignored." },
          { q: "A customer wants to return something outside the policy. What do you say?",
            tip: "Be kind and clear about the policy, offer what you can — exchange, credit — and get a manager rather than inventing an exception." },
          { q: "You think someone might be stealing. What do you do?",
            tip: "Never accuse and never follow them out. Stay near, offer help out loud, tell a manager. Safety first — this is the answer they want." },
          { q: "A coworker is not pulling their weight on a busy day. What do you do?",
            tip: "Handle it yourself first and kindly. Escalate only if it keeps happening. Do not sound like someone who enjoys reporting people." },
        ],
      },
      {
        title: "Closing",
        questions: [
          { q: "Which days can you work? Can you do evenings and Sundays?",
            tip: "Be specific and honest. A clear 'no' on one day is better than a yes you cannot keep." },
          { q: "Do you have any holidays already booked?",
            tip: "Say it now, not after they offer. It is normal and they plan around it." },
          { q: "What pay are you expecting?",
            tip: "Chains usually have a fixed rate. Give your range, then ask what the rate is for this role." },
          { q: "Any questions for me?",
            tip: "Ask about training, and about how many hours the role really is. Practical questions suit this interview." },
        ],
      },
    ],
  },

  /* ============================================ 4. FASHION / ACCESSORIES = */
  {
    id: "fashion",
    name: "Fashion and accessories",
    tone: "Relaxed and style-led",
    blurb: "A clothing or accessories store where the conversation is friendlier and more about taste. They are checking whether customers would take your advice.",
    sections: [
      {
        title: "Welcome",
        questions: [
          { q: "Hey, welcome in. How are you doing today?",
            tip: "Match their energy — friendly and relaxed. A stiff answer here reads as nervous in this kind of store." },
          { q: "Tell me about yourself and how you got into retail.",
            tip: "Tell it like a short story rather than a list. Where you started, what you liked, what you are doing now." },
          { q: "How would you describe your own style?",
            tip: "Any honest answer works. What they are really asking is whether you can talk about clothes without freezing." },
          { q: "Which brand are you into right now, and why?",
            tip: "Name one and give a reason — the fit, the price, the fabric. The reason matters more than the brand." },
        ],
      },
      {
        title: "Experience and skills",
        questions: [
          { q: "Tell me about helping someone put a look together.",
            tip: "One real example. What they came in for, what you suggested, why it worked." },
          { q: "How do you help someone who does not know what suits them?",
            tip: "Ask what they are wearing it for, bring two very different options, let them react. Never say 'that looks great' about everything." },
          { q: "What have you learned about fit and sizing?",
            tip: "That sizes differ between brands and that you fetch the other size without making a comment about it." },
          { q: "Tell me about a time you made someone feel good about themselves at work.",
            tip: "This is the real question in fashion retail. Keep it small and true — a customer who left happier than they arrived." },
        ],
      },
      {
        title: "This role and this store",
        questions: [
          { q: "What do you like about our brand?",
            tip: "One specific thing you can point at. Look at the store and the website first — this question is asked every time." },
          { q: "The job includes styling, but also folding, steaming and stockroom. Are you okay with that?",
            tip: "Yes, without hesitating, and mention you have done stock work before. Hesitation here is what loses the job." },
          { q: "How do you feel about being on the floor greeting people all day?",
            tip: "Say you prefer it to standing at a till. If greeting strangers is hard for you, say what you do to make it easier." },
          { q: "What would you want to learn here?",
            tip: "Something real — the product range, styling for different body shapes, how the buying works. Shows you plan to stay." },
        ],
      },
      {
        title: "On the shop floor",
        questions: [
          { q: "A customer says the price is too high. What do you say?",
            tip: "Do not argue and do not apologise for the price. Talk about what makes it worth it, or show something else in their range." },
          { q: "Someone is trying things on and clearly does not like how they look. How do you help?",
            tip: "Do not flatter. Ask what is not working, then fix that one thing — a different size, a different cut. Practical, not gushing." },
          { q: "A customer wants a size you do not have. What now?",
            tip: "Check the back, check another store, offer to order it. Never let them leave with just 'sorry, we don't'." },
          { q: "Two friends are shopping together and one is rushing the other. What do you do?",
            tip: "Give the slower one a job — hold something up, try one more thing — so they get their moment without anyone feeling awkward." },
        ],
      },
      {
        title: "Closing",
        questions: [
          { q: "What is your availability like?",
            tip: "Clear days and hours. Say if you can do a late night or a weekend, because that is what they are short of." },
          { q: "Have you got any questions about the role?",
            tip: "Ask what the team is like and what a normal shift looks like. It fits the friendly tone." },
          { q: "What are you looking for in terms of pay?",
            tip: "A researched range, said once. Then ask what they pay for this role." },
          { q: "Anything else you want us to know about you?",
            tip: "One sentence you have prepared. Usually: you are reliable, you like the work, and you want to stay." },
        ],
      },
    ],
  },

  /* ============================================ 5. SECOND INTERVIEW ====== */
  {
    id: "second",
    name: "Second interview",
    tone: "Deeper and behavioural",
    blurb: "You got past the first round. This is usually the store or area manager, and the questions go further. They will ask for real examples and follow up on your answers.",
    sections: [
      {
        title: "Welcome",
        questions: [
          { q: "Good to see you again. What have you been thinking about since we last spoke?",
            tip: "Have something ready. Mention something from the first interview — it shows you were listening." },
          { q: "Remind me what drew you to this role.",
            tip: "Say the same reason as last time, in different words. Contradicting your first answer is what they are checking for." },
          { q: "You have had a look around the store. What did you notice?",
            tip: "One genuine observation, said kindly. A small, useful noticing is impressive here." },
          { q: "Tell me something about you that is not on your resume.",
            tip: "Something real and short, ideally connected to working with people or being patient. Not a life story." },
        ],
      },
      {
        title: "Experience and skills",
        questions: [
          { q: "Give me an example of turning an unhappy customer into a happy one. What did you actually say?",
            tip: "They want the words. Situation, what you said, what happened. Practise this one out loud — it is the most common second-round question." },
          { q: "Tell me about a mistake you made at work and what you did next.",
            tip: "Pick a real, small mistake. Most of the answer should be what you did about it, not the mistake itself. Never say you have not made one." },
          { q: "Describe a time you had to learn something quickly.",
            tip: "A new till system, a new product range, a new language at work. Show the method, not just the result." },
          { q: "What part of this job do you find hardest?",
            tip: "Answer honestly and say how you handle it. 'Nothing' is not believable and they will push on it." },
        ],
      },
      {
        title: "This role and this store",
        questions: [
          { q: "If we hired you, what would you need from me in your first two weeks?",
            tip: "A real answer: product knowledge, someone to ask, feedback early. Shows you have thought past the interview." },
          { q: "How do you like to be managed?",
            tip: "Clear expectations and honest feedback. Avoid anything that sounds like you need a lot of attention." },
          { q: "This is a small team. What kind of colleague are you on a bad day?",
            tip: "A rare, good question. Be honest — quieter, but still doing the work — and say what you do to keep it off the floor." },
          { q: "What would make you leave a job?",
            tip: "Answer about growth or being treated unfairly, calmly. Do not list complaints about past employers." },
        ],
      },
      {
        title: "On the shop floor",
        questions: [
          { q: "You are closing alone and a customer walks in two minutes before closing. What do you do?",
            tip: "Serve them properly. Say what you would do about locking up and cash so it is clear you thought about the practical side." },
          { q: "A regular asks you to hold a piece for a week with no deposit. What do you say?",
            tip: "Be warm and still say what the policy allows. Offer the version you can do. They are testing whether you bend rules for people you like." },
          { q: "You disagree with a decision I have made. How do you raise it?",
            tip: "Privately, not on the floor, and with a reason rather than a complaint. Then accept the answer." },
          { q: "You see a colleague giving a friend a discount they should not have. What do you do?",
            tip: "Say it plainly: that is the shop's money, so you would tell a manager. Kind about the person, clear about the rule." },
        ],
      },
      {
        title: "Closing",
        questions: [
          { q: "When could you start?",
            tip: "Give a real date. If you need to give notice somewhere, say so — it makes you look reliable, not difficult." },
          { q: "The rate starts at what we discussed, with a review at six months. How does that sit with you?",
            tip: "If it works, accept clearly. If it does not, say so politely now — this is the moment, and they expect a grown-up answer." },
          { q: "Is there anything that would stop you accepting an offer?",
            tip: "Be honest about hours, travel, or another interview in progress. Surprises after an offer damage the start." },
          { q: "What questions do you have that we have not covered?",
            tip: "Have one saved for this. A good closer: what would make you glad you hired me in six months?" },
        ],
      },
    ],
  },
];
