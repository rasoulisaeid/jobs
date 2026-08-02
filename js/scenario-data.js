/* Ten conversations on the shop floor, start to finish.
 *
 * Five customers buy, easiest first. Five walk out without buying, each for a
 * different reason — and each of those is still a good visit if it is handled
 * well. Interviewers ask "what would you do if…" precisely because the answer
 * shows what you would actually say, so these are written as real dialogue
 * rather than as advice.
 *
 * Shape of a scenario:
 *   id        stable, used for the practised tick in localStorage
 *   outcome   "buy" | "walk"
 *   hardness  1..5 within its group, for the dots
 *   title     what happens, in her words
 *   reason    walk-outs only: why this one leaves
 *   setup     the situation before anyone speaks
 *   turns     [{ who: "customer" | "you" | "stage", text, note? }]
 *             stage lines are never spoken aloud
 *   after     how it ended
 *   lessons   what a manager is listening for
 *
 * Prices are real numbers, not placeholders, so the lines can be read aloud
 * without a voice saying "open bracket price".
 */
window.SCENARIOS = [
  /* ═══════════════════════════════════════════════════ 1 — she decided ═══ */
  {
    id: "sc1",
    outcome: "buy",
    hardness: 1,
    title: "She already decided before she came in",
    setup:
      "Saturday afternoon. A woman walks straight past the displays to the counter. " +
      "She is not browsing. The only way to lose this sale is to slow it down.",
    turns: [
      { who: "customer", text: "Hi. Can I see that gold chain? The thin one, in the middle." },
      {
        who: "you",
        text: "Good afternoon. Of course — this one here?",
        note: "Greet her even though she skipped the greeting. It costs two seconds and it sets the tone.",
      },
      { who: "customer", text: "Yes, that one. I saw it last week. I'll take it." },
      { who: "you", text: "Lovely choice. Let me take it out for you." },
      { who: "stage", text: "You unlock the case and lay the chain on the pad, not in her hand." },
      { who: "customer", text: "Is it real gold?" },
      {
        who: "you",
        text: "Yes. It's fourteen karat, and it's eighteen inches. Would you like to try it on, or is it a gift?",
        note: "One factual answer, then one question. Do not start a lecture about karats.",
      },
      { who: "customer", text: "It's for me. I don't need to try it." },
      { who: "you", text: "Perfect. Would you like it in a gift box, or is a pouch fine?" },
      { who: "customer", text: "A box, please." },
      {
        who: "you",
        text: "I'll put a polishing cloth in as well — it keeps the shine, and it's free. That's one hundred and eighty-five dollars with tax. Card or cash?",
        note: "One small extra. Not three. A decided customer who gets sold to feels trapped.",
      },
      { who: "customer", text: "Card." },
      { who: "stage", text: "You take the payment." },
      {
        who: "you",
        text: "Thank you. Here's your receipt. The warranty card is inside the box — if the clasp ever feels loose, bring it in and we'll fix it for free.",
      },
      { who: "customer", text: "Oh, good to know. Thank you." },
      { who: "you", text: "Enjoy it. Have a lovely weekend." },
      { who: "stage", text: "She's out of the door in under five minutes." },
    ],
    after:
      "She got exactly what she came for, fast, and she now knows she can come back for the clasp. " +
      "That is the whole job on an easy day.",
    lessons: [
      "When somebody has decided, your job is speed, not selling.",
      "Add one useful thing — box, cloth, gift receipt. Never three.",
      "Mention the free repair. It is the reason she comes back instead of buying online.",
    ],
  },

  /* ═══════════════════════════════════════════════════ 2 — a gift ════════ */
  {
    id: "sc2",
    outcome: "buy",
    hardness: 2,
    title: "He needs a gift and has no idea what",
    setup:
      "A man in his thirties walks in slowly and stands in the middle of the store, " +
      "looking at nothing in particular. He looks like he would rather be anywhere else.",
    turns: [
      { who: "customer", text: "Hi. Um… I need a gift. For my wife. Her birthday's on Saturday." },
      {
        who: "you",
        text: "Happy to help. Let's find something she'll love. Do you know if she wears gold or silver?",
        note: "Start with one easy question, not five. He is already nervous.",
      },
      { who: "customer", text: "Gold, I think. Yeah, gold." },
      { who: "you", text: "Yellow gold, or the pink one — rose gold?" },
      { who: "customer", text: "Yellow." },
      { who: "you", text: "Good. And does she wear earrings more, or necklaces and bracelets?" },
      { who: "customer", text: "Earrings. Always. Small ones." },
      {
        who: "you",
        text: "Then let me show you two things.",
        note: "Two. Eight options is how a nervous buyer leaves with nothing.",
      },
      { who: "stage", text: "You put two trays on the pad and turn them to face him." },
      {
        who: "you",
        text: "These are small gold hoops — she can wear them every day, even to sleep. And these are studs with a small diamond, a little more special for a birthday.",
      },
      { who: "customer", text: "How much are the diamond ones?" },
      { who: "you", text: "The studs are two hundred and forty. The hoops are ninety-five. Both are fourteen karat." },
      { who: "customer", text: "Hmm. The diamond ones are nice." },
      {
        who: "you",
        text: "They are. Can I ask one thing first — does she have pierced ears?",
        note: "The question that turns a sale into a keeper instead of a return. Ask it every time.",
      },
      { who: "customer", text: "Yes. Definitely." },
      { who: "you", text: "Then these will work. Shall I put them in a gift box with a ribbon?" },
      { who: "customer", text: "Yes please. That would help me a lot." },
      {
        who: "you",
        text: "I'll add a gift receipt too. It doesn't show the price, and it means she can exchange them for the hoops if she prefers.",
        note: "The gift receipt takes away the fear of choosing wrong. It closes gift sales.",
      },
      { who: "customer", text: "Perfect. Thank you so much." },
      { who: "you", text: "You're welcome. I hope she loves them. Happy birthday to her." },
      { who: "stage", text: "He leaves holding the bag like it might explode." },
    ],
    after:
      "He came in with no idea and left in eight minutes with something she will actually wear. " +
      "He will come back next December and ask for you by name.",
    lessons: [
      "Two or three questions, then two options. Never a whole case.",
      "\"Does she have pierced ears?\" — ask it before he pays, not after.",
      "The gift receipt is not paperwork. It is what makes him brave enough to buy.",
    ],
  },

  /* ═══════════════════════════════════════════════ 3 — cannot decide ═════ */
  {
    id: "sc3",
    outcome: "buy",
    hardness: 3,
    title: "She likes two and cannot choose",
    setup:
      "Both bracelets have been on the counter for ten minutes. She keeps picking one up, " +
      "putting it down, and picking up the other. She is close, and she is stuck.",
    turns: [
      { who: "customer", text: "I like both of them. I really can't decide." },
      {
        who: "you",
        text: "That's a good problem to have. Can I ask where you'd wear it — every day, or for special occasions?",
        note: "Never answer \"they're both lovely, it's up to you.\" That leaves her exactly where she was.",
      },
      { who: "customer", text: "Every day, probably. Work, and then dinner sometimes." },
      {
        who: "you",
        text: "Then let's look at them that way. This one is thinner, so it sits under a sleeve and won't catch on anything. This one is heavier — it's beautiful, but it moves a lot when you're typing.",
      },
      { who: "customer", text: "I type all day." },
      {
        who: "you",
        text: "Try them both again, one on each wrist. And look in the mirror, not at me.",
        note: "Let the mirror decide. If you choose for her, she will doubt it in the car.",
      },
      { who: "stage", text: "She turns her wrists under the light for a while." },
      { who: "customer", text: "…The thin one. It feels more like me." },
      { who: "you", text: "I think so too. And it's the one you'll actually wear." },
      { who: "customer", text: "Okay. The thin one. Now I feel bad about the other one." },
      {
        who: "you",
        text: "Don't. It isn't going anywhere. If you ever need it for a wedding, come in and ask for me.",
        note: "This is a real second visit, not a line. Say it because you mean it.",
      },
      { who: "customer", text: "Ha. Okay. Let's do it." },
      { who: "you", text: "Wonderful. Would you like to wear it out, or shall I box it?" },
      { who: "customer", text: "I'll wear it." },
      { who: "you", text: "Let me give it a quick clean first, then I'll put it on for you." },
      { who: "stage", text: "She pays and leaves wearing it, looking at her wrist." },
    ],
    after:
      "She did not need more options. She needed one question that told her which one fits her life.",
    lessons: [
      "Ask how she lives, not which one she likes. The answer chooses the piece.",
      "Give her the mirror and stay quiet. Silence is not an emergency.",
      "When she picks, agree once and stop selling.",
    ],
  },

  /* ═══════════════════════════════════════════ 4 — cheaper online ════════ */
  {
    id: "sc4",
    outcome: "buy",
    hardness: 4,
    title: "\"I saw this cheaper online\"",
    setup:
      "A man in his forties, phone already out, screen turned towards you before he says hello. " +
      "He is not being rude. He is expecting you to argue with him.",
    turns: [
      { who: "customer", text: "This exact ring is two hundred dollars less on this website. Can you match it?" },
      {
        who: "you",
        text: "May I see? … Thank you.",
        note: "Take the phone. Read it properly. Never argue with something you have not looked at.",
      },
      { who: "stage", text: "You actually read the listing, including the small print." },
      { who: "customer", text: "Same brand. Same size." },
      {
        who: "you",
        text: "It does look very close. Can I show you two things on ours? Ours is stamped fourteen K just here, and the stone sits in four prongs, so it's harder to knock loose. And on the website, down here, it says gold plated.",
      },
      { who: "customer", text: "…Huh. I didn't see that." },
      {
        who: "you",
        text: "It's easy to miss. Plated means a thin layer of gold over another metal. It looks the same on day one, but after a year of wearing it every day it can go dull at the edges.",
        note: "Explain the difference. Do not say the website is a scam, and never insult his research.",
      },
      { who: "customer", text: "Okay. But it's still two hundred dollars." },
      {
        who: "you",
        text: "It is, and that's a real difference. Let me tell you what's inside that two hundred here — resizing is free, cleaning is free any time you walk in, and if a stone comes loose in the first year we repair it. With the website you post it back and wait.",
        note: "Don't defend the price. Say what the price contains.",
      },
      { who: "customer", text: "Do you have anything in between? Something a bit less?" },
      {
        who: "you",
        text: "I do. This one is the same setting with a slightly smaller stone — six hundred and fifty. Put them side by side.",
      },
      { who: "stage", text: "You lay both on the pad and let him look for as long as he wants." },
      { who: "customer", text: "…On the hand you honestly can't tell." },
      { who: "you", text: "No, you can't. Would you like to try it?" },
      { who: "customer", text: "Yeah. Okay, I'll take this one." },
      {
        who: "you",
        text: "Good choice. I'll size it for you — that's included, and it takes about a week. Can I take your number so I can call you the moment it's back?",
      },
      { who: "stage", text: "He pays and leaves, and he does not check his phone again." },
    ],
    after:
      "He did not want the cheaper ring. He wanted to know he was not being overcharged. " +
      "Once he could see the difference himself, the price stopped being the argument.",
    lessons: [
      "Ask to see the phone. Reading it beats arguing about it.",
      "Plated versus solid, prongs, the stamp — know the three facts that show real value.",
      "If the budget genuinely will not stretch, offer a middle option instead of losing him.",
      "Sell the free sizing and free cleaning. That is the part a website cannot copy.",
    ],
  },

  /* ═══════════════════════════════════════════ 5 — engagement ring ═══════ */
  {
    id: "sc5",
    outcome: "buy",
    hardness: 5,
    title: "A first engagement ring, and he is terrified",
    setup:
      "A young man, alone, on a Tuesday evening. He has never bought jewelry in his life and " +
      "this is the most money he has ever spent at once. Handle this badly and he leaves. " +
      "Handle it well and he tells everyone he knows.",
    turns: [
      { who: "customer", text: "Hi. I'm… looking at engagement rings. I don't really know anything about this." },
      {
        who: "you",
        text: "You've come to the right place, and you don't need to know anything — that's my job. Congratulations.",
        note: "Say congratulations. Almost nobody does, and it is the biggest thing in his year.",
      },
      { who: "customer", text: "Thanks. Ha. I'm nervous." },
      { who: "you", text: "Everyone is. We'll go slowly. Do you know her ring size?" },
      { who: "customer", text: "No. Is that bad?" },
      {
        who: "you",
        text: "Not at all, hardly anybody does. We size it afterwards and that's free. Does she wear a ring now that you could borrow for one day?",
      },
      { who: "customer", text: "Maybe. There's one she wears on that hand." },
      {
        who: "you",
        text: "Bring it in and I'll measure it in two minutes. Now — has she ever shown you something she liked? A photo, a friend's ring, anything?",
      },
      { who: "customer", text: "She sent me a picture once. It was like… a square stone?" },
      { who: "you", text: "That could be a princess cut or an emerald cut. Let me show you both." },
      { who: "stage", text: "You put one of each on the pad." },
      { who: "customer", text: "That one. The second one." },
      {
        who: "you",
        text: "Emerald cut. Good eye — it looks larger for the weight, and it's the more classic of the two.",
      },
      { who: "customer", text: "How much is something like that?" },
      {
        who: "you",
        text: "It depends on four things: how big the stone is, how clear it is, its colour, and how well it's cut. Can I ask what you had in mind to spend? I promise I won't push you past it — it just means I show you the right tray instead of wasting your evening.",
        note: "Ask for the budget. Once, politely, with the reason attached. Then believe the number.",
      },
      { who: "customer", text: "I was thinking around three thousand. Is that… okay?" },
      {
        who: "you",
        text: "That's a good budget and I can show you three beautiful rings inside it. Give me one moment.",
        note: "Never let a number hang in the air. He is asking whether he should be embarrassed.",
      },
      { who: "stage", text: "You bring three, and only three." },
      {
        who: "you",
        text: "This one is the biggest stone for the money. This one is slightly smaller but it sparkles more, because of the cut. And this one has small stones along the band, so it looks wider on the hand.",
      },
      { who: "customer", text: "The middle one. That's it. That's the one." },
      {
        who: "you",
        text: "It's my favourite of the three as well. Would you like to take a photo and sit with it overnight? I'm happy to put it aside for you.",
        note: "Offering him the exit is what proves you are not pushing. It usually closes the sale on the spot.",
      },
      { who: "customer", text: "No. No, I'll take it." },
      {
        who: "you",
        text: "Then here's what happens next. You leave a deposit today, you bring me her ring this week, we size it, and it's ready in about ten days in the box. The certificate for the stone comes with it.",
      },
      { who: "customer", text: "Thank you. Really. You made this easy." },
      { who: "you", text: "That's what I'm here for. Good luck — and come and tell me what she said." },
      { who: "stage", text: "He shakes your hand on the way out. He does that to nobody, ever." },
    ],
    after:
      "The largest sale of the day, from the most frightened person in it. He was never buying a " +
      "diamond. He was buying somebody to tell him he was not making a mistake.",
    lessons: [
      "Congratulate him first. It changes the whole conversation.",
      "Ask permission before asking the budget, then respect the answer completely.",
      "Three rings, never ten. Describe what makes each one different in one sentence.",
      "Offer him the night to think. Trust closes big sales; pressure kills them.",
      "Tell him exactly what happens next — deposit, sizing, dates. Fear of the unknown is the last obstacle.",
    ],
  },

  /* ═══════════════════════════════════════════ 6 — just looking ══════════ */
  {
    id: "sc6",
    outcome: "walk",
    hardness: 1,
    reason: "She is not shopping today, and being followed would make sure she never came back.",
    title: "\"I'm just looking\"",
    setup:
      "A woman comes in on a weekday morning, drifts to the far case and does not look up. " +
      "Her body language is doing all the talking.",
    turns: [
      {
        who: "you",
        text: "Good morning. Take your time — I'm right here if you'd like to see anything.",
        note: "Greet, offer, then step back. Never open with \"can I help you?\" — the answer is always no.",
      },
      { who: "customer", text: "Thanks. I'm just looking." },
      { who: "you", text: "Of course." },
      { who: "stage", text: "You go back behind the counter and tidy something. You do not hover. Two minutes pass. She stops at one case." },
      {
        who: "you",
        text: "That case is our new spring pieces, if you want a closer look at anything.",
        note: "One piece of information, from where you are. Not a walk over and a pitch.",
      },
      { who: "customer", text: "Oh — no, I'm fine for now. I'm killing time before an appointment." },
      { who: "you", text: "Then you picked a nice place to do it." },
      { who: "stage", text: "She smiles and carries on looking. A few minutes later she heads for the door." },
      { who: "customer", text: "Thank you." },
      {
        who: "you",
        text: "You're welcome. If you come back, ask for Sahar — I'll show you the pieces at the back too.",
        note: "Your name at the door is the whole point of the visit. It is how she returns to a person, not a shop.",
      },
      { who: "customer", text: "I might. Thanks." },
      { who: "stage", text: "She leaves with nothing, and with a good feeling about the place." },
    ],
    after:
      "Nothing sold, nothing wasted. \"Just looking\" usually means \"please don't trap me.\" " +
      "Respect it once and she comes back on the day she is actually buying.",
    lessons: [
      "Greet, offer, step back. Then let her breathe.",
      "One useful comment after a couple of minutes — never a follow-around.",
      "Give your name as she leaves. It costs nothing and it is the only thing she'll remember.",
      "If a manager asks about this at interview: today's browser is next month's customer.",
    ],
  },

  /* ═══════════════════════════════════════════ 7 — too expensive ═════════ */
  {
    id: "sc7",
    outcome: "walk",
    hardness: 2,
    reason: "It genuinely costs more than she has, and no amount of selling changes that.",
    title: "It is honestly out of her budget",
    setup:
      "She has been looking at one necklace for a while. Then she asks the price, " +
      "and you watch her face change.",
    turns: [
      { who: "customer", text: "How much is this necklace?" },
      { who: "you", text: "That one is eight hundred and ninety." },
      { who: "customer", text: "Oh. Wow. Okay." },
      {
        who: "you",
        text: "It's one of our heavier pieces — that's most of the price. Can I show you something with the same look?",
        note: "Do not apologise for the price, and do not let the silence sit. Move straight to a way forward.",
      },
      { who: "customer", text: "Um… honestly, I have about two hundred." },
      {
        who: "you",
        text: "That's completely fine, and it's a good number to work with. Let me show you two things.",
        note: "\"That's completely fine\" — said warmly and immediately. She just told you something embarrassing.",
      },
      { who: "stage", text: "You bring two pieces and put them next to the first one, not instead of it." },
      {
        who: "you",
        text: "This one's the same style, a little thinner — one hundred and sixty. And this one is silver with gold plating. From across a room you can't tell the difference, and it's ninety.",
      },
      { who: "customer", text: "They're nice. But honestly… I love the first one." },
      { who: "you", text: "I know. It is beautiful." },
      { who: "customer", text: "I think I'd rather wait and save for the one I actually want." },
      {
        who: "you",
        text: "I think that's a good decision. If you took the other one home you'd only be thinking about this one.",
        note: "Agree with her, and mean it. Talking her into second best loses the customer, not just the sale.",
      },
      { who: "customer", text: "Yeah. Exactly." },
      {
        who: "you",
        text: "Let me write down the name and the item number so you don't have to remember it. We also do layaway if you ever want to pay it in parts — no interest, and we hold the piece.",
      },
      { who: "customer", text: "Really? I didn't know that." },
      {
        who: "you",
        text: "It's on the card. And if you leave me a number I'll call you if it goes into a sale — I won't call you for anything else.",
        note: "Say what you will not use the number for. That is why she gives it to you.",
      },
      { who: "customer", text: "Okay, yes. Here." },
      { who: "you", text: "Thank you for coming in. I hope I see you again." },
      { who: "stage", text: "She leaves with a card in her hand instead of a bag." },
    ],
    after:
      "No sale today, a phone number, and a woman who was not made to feel poor in a jewelry store. " +
      "That one is worth more than the necklace.",
    lessons: [
      "Never let her feel small about a budget. Answer the number warmly and instantly.",
      "Show a lower option once. If she still wants the first one, stop.",
      "Layaway, item number, phone number — leave her three ways to come back.",
      "Agreeing with \"I'll wait and save\" is not losing. It is why she returns to you.",
    ],
  },

  /* ═══════════════════════════════════════════ 8 — ask the partner ═══════ */
  {
    id: "sc8",
    outcome: "walk",
    hardness: 3,
    reason: "The decision is not hers alone, and pushing her would only embarrass her.",
    title: "\"I need to ask my husband\"",
    setup:
      "She has tried the earrings on three times. She wants them. Then she puts them down.",
    turns: [
      { who: "customer", text: "I love these. But I should ask my husband first." },
      {
        who: "you",
        text: "Of course. Can I ask — is it a question about the price, or about the style?",
        note: "The most useful question in retail. Those two answers need completely different help.",
      },
      { who: "customer", text: "The price, mostly. We agreed we'd talk before spending this much." },
      { who: "you", text: "That's a sensible rule. Let me make that conversation easy for you." },
      { who: "customer", text: "Okay…" },
      {
        who: "you",
        text: "May I take two photos on your phone? One with them on, and one on the counter next to my hand, so he can see the real size.",
        note: "Photographs on her phone. Not yours. She is going to show him tonight.",
      },
      { who: "customer", text: "Oh, that's a good idea." },
      { who: "stage", text: "You take the photos, then write on the back of a store card." },
      {
        who: "you",
        text: "Here's the item number and the price on the back of my card, so nobody has to remember it.",
      },
      { who: "customer", text: "Thank you. That's really helpful." },
      {
        who: "you",
        text: "One more thing — we can hold them for forty-eight hours with no deposit. There's no obligation at all. If you don't come back they just go into the case again.",
        note: "\"No obligation\" out loud. A hold that feels like a trap is worse than no hold.",
      },
      { who: "customer", text: "Yes, let's do that. Just in case." },
      {
        who: "you",
        text: "Done, under your name. We're open until seven every day, and Sunday until five, so bring him in if he'd like to see them.",
      },
      { who: "customer", text: "Great. Thank you so much." },
      { who: "you", text: "Thank you. I hope to see you both." },
      { who: "stage", text: "She leaves with a card, a hold, and two photos on her phone." },
    ],
    after:
      "She came in alone and left with everything she needs to say yes tomorrow. " +
      "About half of these come back — and none of them come back if they left with nothing in their hand.",
    lessons: [
      "Ask whether it's the price or the style. Then help with the real problem.",
      "Photos on her phone, item number in writing, and a 48-hour hold.",
      "Say \"no obligation\" and mean it. Pressure here is how you lose both of them.",
      "Never joke about needing permission. It is not funny from behind a counter.",
    ],
  },

  /* ═══════════════════════════════════════════ 9 — a repair ══════════════ */
  {
    id: "sc9",
    outcome: "walk",
    hardness: 4,
    reason: "He came in for a service, not to shop — and turning that into a hard sell would ruin it.",
    title: "He came in for a battery, not a purchase",
    setup:
      "Midweek, quiet. A man comes to the counter with a watch in his hand and " +
      "an appointment to get to. There is no sale in this visit. There is something better.",
    turns: [
      { who: "customer", text: "Hi — my watch stopped. I think it just needs a battery." },
      { who: "you", text: "Let's have a look. May I?" },
      { who: "customer", text: "Sure." },
      { who: "stage", text: "You open the back at the bench where he can see you working." },
      {
        who: "you",
        text: "You're right, it's the battery. We can do it here — about fifteen minutes, and it's twelve dollars.",
      },
      { who: "customer", text: "Oh, great. I thought I'd have to leave it for a week." },
      {
        who: "you",
        text: "No need. While it's open I'll test the seal and clean the case as well, at no charge.",
        note: "The free small thing. It costs the store nothing and it is why he comes back here forever.",
      },
      { who: "customer", text: "Thank you." },
      { who: "stage", text: "Fifteen minutes later." },
      {
        who: "you",
        text: "All done, and I've set it to the right time. One thing I noticed — see this crack in the strap, near the pin? That'll break in the next few months. I'm not saying buy one today. I just didn't want it to snap in a parking lot.",
        note: "Mention it once, with a reason, and say out loud that you are not selling. Then stop.",
      },
      { who: "customer", text: "Ah — good to know. How much are the straps?" },
      { who: "you", text: "They start at twenty-five. I can show you, or you can think about it." },
      { who: "customer", text: "I'll think about it. I'm in a rush today." },
      {
        who: "you",
        text: "Absolutely. So that's twelve dollars. Here's your receipt — the battery's guaranteed for a year.",
        note: "\"Absolutely\", instantly. The second he feels a second push, the visit is spoiled.",
      },
      { who: "customer", text: "Perfect. Thanks for your help." },
      { who: "you", text: "Any time. Come back for the strap when you're ready, or just come in and I'll check it for you." },
      { who: "stage", text: "He leaves having spent twelve dollars, and he will be back." },
    ],
    after:
      "A repair customer is the cheapest new customer a store will ever get. He walked in with a " +
      "problem, walked out with it solved, and now there is a shop he trusts.",
    lessons: [
      "Do the free small thing — the clean, the seal, setting the time.",
      "Mention what you noticed once, say you are not selling, and let it go.",
      "Take a no instantly and warmly. Two pushes and you lose the repair customer too.",
      "In an interview, say this out loud: repairs build the regulars that carry a slow month.",
    ],
  },

  /* ═══════════════════════════════════════════ 10 — the complaint ════════ */
  {
    id: "sc10",
    outcome: "walk",
    hardness: 5,
    reason: "She is not here to buy. She is here because something went wrong, and she is angry.",
    title: "She comes in angry, and other customers can hear",
    setup:
      "Saturday, the store is busy. A woman comes in fast and starts talking before she " +
      "reaches the counter. Two other customers look up. This is the one interviewers want to see.",
    turns: [
      { who: "customer", text: "I bought this here three weeks ago and the stone has fallen out. Three weeks!" },
      {
        who: "you",
        text: "I'm so sorry — that shouldn't happen. Let's get it sorted. Tell me what happened.",
        note: "Apologise for the situation, not for guilt. Then stop talking and let her finish.",
      },
      { who: "customer", text: "I wore it twice. Twice! And look at it. For four hundred dollars that's not okay." },
      { who: "stage", text: "You let her finish completely. You do not interrupt, and you do not look at the other customers." },
      { who: "you", text: "You're right, it's not. Twice is nothing." },
      { who: "customer", text: "I want my money back." },
      {
        who: "you",
        text: "I understand. May I look at it for one moment, so I can tell you exactly what your options are?",
        note: "Get the facts before you offer anything. Guessing a policy is worse than taking thirty seconds.",
      },
      { who: "customer", text: "Fine." },
      { who: "stage", text: "You take it under the lamp." },
      {
        who: "you",
        text: "Thank you. I can see the prong is bent — something caught it. That's a manufacturing fault, not anything you did. Do you have the receipt with you?",
      },
      { who: "customer", text: "It's on my phone. Somewhere." },
      { who: "you", text: "Take your time." },
      { who: "stage", text: "She finds it." },
      {
        who: "you",
        text: "Perfect — three weeks ago, so that's well inside our thirty days. You have three choices. We repair it and it comes back like new in about a week. We exchange it today for anything in the store. Or we refund you. Which would you like?",
        note: "Say the refund out loud, without flinching. Hiding it is what turns an angry customer into a review.",
      },
      { who: "customer", text: "…I don't know. I did really like it." },
      {
        who: "you",
        text: "You did. How about this — I send it to the workshop and ask them to check every other prong at the same time. If it comes back and you're still not happy, we refund you then. Nothing changes.",
      },
      { who: "customer", text: "…Okay. Yes. Do that." },
      {
        who: "you",
        text: "Thank you for being patient with me. Here's your ticket. I'll call you the moment it's back, and I'll ask them to prioritise it.",
      },
      { who: "customer", text: "Sorry for shouting. It's been a day." },
      { who: "you", text: "Please don't apologise. I'd have been upset too." },
      { who: "stage", text: "She leaves calm, with a ticket, and the store goes quiet again." },
    ],
    after:
      "No sale. A customer kept, a scene defused in front of a full shop, and a repair booked. " +
      "This is the single most valuable thing you can show an interviewer you can do.",
    lessons: [
      "Let her finish. Every word. Interrupting an angry customer doubles the length of it.",
      "Apologise for the situation immediately — \"I'm sorry, let's sort it out\" — not for fault.",
      "Facts first, options second. Never open with \"that's our policy.\"",
      "Offer the refund honestly, including it in the list without hesitating.",
      "If the policy isn't clear or she won't settle, get the manager. Never invent a rule.",
    ],
  },
];
