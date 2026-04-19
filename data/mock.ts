export type UsageLabel = "spoken" | "neutral" | "formal" | "academic";

export type VocabularyExample = {
  label: UsageLabel;
  sentence: string;
};

export type SimilarWord = {
  slug: string;
  word: string;
  note: string;
};

export type VocabularyWord = {
  slug: string;
  title: string;
  phonetics: {
    uk: string;
    us: string;
  };
  partOfSpeech: string;
  chineseMeaning: string;
  englishDefinition: string;
  summary: string;
  usageLabels: UsageLabel[];
  collocations: string[];
  examples: VocabularyExample[];
  similarWords: SimilarWord[];
  memoryAids: {
    etymology: string;
    roots: string;
    mnemonic: string;
  };
  searchAliases: string[];
};

export type SavedWord = {
  slug: string;
  savedAt: string;
  note: string;
  tag: UsageLabel;
};

export type RecentWord = {
  slug: string;
  viewedAt: string;
  context: string;
};

export type PersonalNote = {
  slug: string;
  title: string;
  note: string;
  updatedAt: string;
};

export type SearchChip = {
  label: string;
  slug: string;
};

export const vocabularyWords: VocabularyWord[] = [
  {
    slug: "salient",
    title: "salient",
    phonetics: {
      uk: "/ˈseɪ.li.ənt/",
      us: "/ˈseɪ.li.ənt/",
    },
    partOfSpeech: "adj.",
    chineseMeaning: "显著的；突出的；值得注意的",
    englishDefinition: "most noticeable or important",
    summary: "Use it when one detail stands out clearly from the rest.",
    usageLabels: ["formal", "academic"],
    collocations: [
      "salient feature",
      "salient point",
      "salient concern",
      "salient example",
    ],
    examples: [
      {
        label: "formal",
        sentence: "The report highlights the salient risks before the proposal moves forward.",
      },
      {
        label: "academic",
        sentence: "A salient finding in the study was the role of attention in recall.",
      },
      {
        label: "neutral",
        sentence: "The most salient detail was the sudden drop in response time.",
      },
    ],
    similarWords: [
      {
        slug: "prominent",
        word: "prominent",
        note: "更像“重要且容易被看见”，常用于人、位置、特征。",
      },
      {
        slug: "noticeable",
        word: "noticeable",
        note: "更口语，强调“能被注意到”，但不一定最重要。",
      },
      {
        slug: "striking",
        word: "striking",
        note: "更强调视觉或印象上的冲击感。",
      },
    ],
    memoryAids: {
      etymology: "来自拉丁语 salire，原意有“跳出来”的感觉。",
      roots: "可以把它理解成 something that leaps out.",
      mnemonic: "salient = what stands out and almost jumps at you.",
    },
    searchAliases: ["salient point", "salient detail", "salient issue"],
  },
  {
    slug: "contemplate",
    title: "contemplate",
    phonetics: {
      uk: "/ˈkɒn.təm.pleɪt/",
      us: "/ˈkɑːn.təm.pleɪt/",
    },
    partOfSpeech: "v.",
    chineseMeaning: "仔细考虑；思考；凝视",
    englishDefinition: "to think about something carefully before deciding or acting",
    summary: "A quiet, deliberate kind of thinking, more reflective than casual considering.",
    usageLabels: ["neutral", "formal", "academic"],
    collocations: [
      "contemplate a decision",
      "contemplate the possibility",
      "contemplate doing something",
      "contemplate the future",
    ],
    examples: [
      {
        label: "neutral",
        sentence: "I need a day to contemplate the offer before I reply.",
      },
      {
        label: "formal",
        sentence: "The committee will contemplate the proposal at the next meeting.",
      },
      {
        label: "academic",
        sentence: "Students are encouraged to contemplate the assumptions behind the model.",
      },
    ],
    similarWords: [
      {
        slug: "consider",
        word: "consider",
        note: "最通用，适合日常和写作，没有 contemplate 那么慢。",
      },
      {
        slug: "ponder",
        word: "ponder",
        note: "更书面，带一点“反复想”的感觉。",
      },
      {
        slug: "reflect",
        word: "reflect",
        note: "更偏回顾、反思，而不只是做决定前的思考。",
      },
    ],
    memoryAids: {
      etymology: "来自拉丁语 contemplari，原本有“凝视、专注观察”的意思。",
      roots: "核心不是快想一下，而是停下来慢慢看、慢慢想。",
      mnemonic: "contemplate = to look at a choice for a while before moving.",
    },
    searchAliases: ["contemplate a decision", "contemplate doing", "contemplate the future"],
  },
  {
    slug: "issue-bonds",
    title: "issue bonds",
    phonetics: {
      uk: "/ˈɪʃ.uː bɒndz/",
      us: "/ˈɪʃ.uː bɑːndz/",
    },
    partOfSpeech: "phrase",
    chineseMeaning: "发行债券",
    englishDefinition: "to sell bonds to investors in order to raise money",
    summary: "A finance phrase used when a company or government raises debt capital.",
    usageLabels: ["formal", "academic"],
    collocations: [
      "issue corporate bonds",
      "issue government bonds",
      "issue debt securities",
      "issue bonds to raise capital",
    ],
    examples: [
      {
        label: "formal",
        sentence: "The company plans to issue bonds to fund the new expansion project.",
      },
      {
        label: "academic",
        sentence: "Governments may issue bonds when they need long-term financing.",
      },
      {
        label: "neutral",
        sentence: "They decided to issue bonds instead of taking a large bank loan.",
      },
    ],
    similarWords: [
      {
        slug: "raise-capital",
        word: "raise capital",
        note: "更宽泛的“融资”，不一定是通过债券。",
      },
      {
        slug: "issue-shares",
        word: "issue shares",
        note: "发行的是股份，不是债务工具。",
      },
      {
        slug: "borrow",
        word: "borrow",
        note: "是借钱的动作；issue bonds 是市场融资的方式。",
      },
    ],
    memoryAids: {
      etymology: "issue 在这里是“发行、推出”，bonds 指债券。",
      roots: "把它看成把债券“放到市场上”出售。",
      mnemonic: "issue bonds = release debt papers to the market.",
    },
    searchAliases: ["issue debt", "issue corporate bonds", "issue government bonds"],
  },
  {
    slug: "efficient",
    title: "efficient",
    phonetics: {
      uk: "/ɪˈfɪʃ.ənt/",
      us: "/ɪˈfɪʃ.ənt/",
    },
    partOfSpeech: "adj.",
    chineseMeaning: "高效的；效率高的",
    englishDefinition: "working well with little wasted time or effort",
    summary: "Useful when the process runs smoothly and does not waste resources.",
    usageLabels: ["spoken", "neutral", "formal"],
    collocations: ["efficient workflow", "highly efficient", "efficient system"],
    examples: [
      {
        label: "spoken",
        sentence: "She is really efficient, so the whole team moves faster with her help.",
      },
      {
        label: "neutral",
        sentence: "The new workflow is efficient and cuts down repetitive work.",
      },
      {
        label: "academic",
        sentence: "An efficient process reduces waste while maintaining output quality.",
      },
    ],
    similarWords: [
      {
        slug: "effective",
        word: "effective",
        note: "focuses on whether something works, not how fast or economical it is.",
      },
      {
        slug: "streamlined",
        word: "streamlined",
        note: "more about being simplified and smooth.",
      },
      {
        slug: "productive",
        word: "productive",
        note: "focuses on output, especially results over time.",
      },
    ],
    memoryAids: {
      etymology: "from Latin efficere, meaning to accomplish or bring about.",
      roots: "think of doing more with less waste.",
      mnemonic: "efficient = effective process, but leaner and quicker.",
    },
    searchAliases: ["efficient process", "highly efficient", "efficient workflow"],
  },
  {
    slug: "effective",
    title: "effective",
    phonetics: {
      uk: "/ɪˈfek.tɪv/",
      us: "/ɪˈfek.tɪv/",
    },
    partOfSpeech: "adj.",
    chineseMeaning: "有效的；起作用的",
    englishDefinition: "producing the result that is wanted",
    summary: "Best when you want to say something works, even if it may not be the fastest.",
    usageLabels: ["spoken", "neutral", "formal", "academic"],
    collocations: ["effective method", "effective treatment", "effective strategy"],
    examples: [
      {
        label: "spoken",
        sentence: "That tip was surprisingly effective in calming the situation.",
      },
      {
        label: "formal",
        sentence: "The policy was effective in reducing the error rate.",
      },
      {
        label: "academic",
        sentence: "An effective intervention must be evaluated in the context of real outcomes.",
      },
    ],
    similarWords: [
      {
        slug: "efficient",
        word: "efficient",
        note: "efficient = uses fewer resources; effective = gets the job done.",
      },
      {
        slug: "successful",
        word: "successful",
        note: "broader result word, often about the overall outcome rather than method.",
      },
      {
        slug: "powerful",
        word: "powerful",
        note: "stronger impact, but not always precise or suitable.",
      },
    ],
    memoryAids: {
      etymology: "from Latin effectivus, connected to effect or result.",
      roots: "focus on the effect, not the process.",
      mnemonic: "effective = effect-made-real.",
    },
    searchAliases: ["effective method", "effective strategy", "effective treatment"],
  },
  {
    slug: "serene",
    title: "serene",
    phonetics: {
      uk: "/səˈriːn/",
      us: "/səˈriːn/",
    },
    partOfSpeech: "adj.",
    chineseMeaning: "宁静的；平和的；从容的",
    englishDefinition: "calm, peaceful, and not disturbed by noise or worry",
    summary: "A quiet word with a polished, gallery-like calm.",
    usageLabels: ["spoken", "neutral", "formal", "academic"],
    collocations: ["serene atmosphere", "serene confidence", "serene silence"],
    examples: [
      {
        label: "spoken",
        sentence: "She stayed serene even when the room got noisy.",
      },
      {
        label: "neutral",
        sentence: "The lake looked serene just before sunset.",
      },
      {
        label: "academic",
        sentence: "A serene environment can support focus by reducing distraction.",
      },
    ],
    similarWords: [
      {
        slug: "calm",
        word: "calm",
        note: "the most common option, less elevated and more everyday.",
      },
      {
        slug: "peaceful",
        word: "peaceful",
        note: "focuses more on a relaxed atmosphere than on the person’s manner.",
      },
      {
        slug: "tranquil",
        word: "tranquil",
        note: "more literary and image-driven.",
      },
    ],
    memoryAids: {
      etymology: "from Latin serenus, meaning clear or calm.",
      roots: "the feeling is untroubled and still.",
      mnemonic: "serene = calm enough to feel airier than calm.",
    },
    searchAliases: ["serene atmosphere", "serene confidence", "serene silence"],
  },
  {
    slug: "reconcile",
    title: "reconcile",
    phonetics: {
      uk: "/ˈrek.ən.saɪl/",
      us: "/ˈrek.ən.saɪl/",
    },
    partOfSpeech: "v.",
    chineseMeaning: "调和；使一致；和解",
    englishDefinition: "to make two things fit together or to make people become friendly again",
    summary: "Useful for both matching facts and restoring relationships.",
    usageLabels: ["neutral", "formal", "academic"],
    collocations: ["reconcile differences", "reconcile accounts", "reconcile with someone"],
    examples: [
      {
        label: "neutral",
        sentence: "They had to reconcile their plans before the trip could move ahead.",
      },
      {
        label: "formal",
        sentence: "The team met to reconcile the two versions of the budget.",
      },
      {
        label: "academic",
        sentence: "Researchers attempted to reconcile the conflicting findings.",
      },
    ],
    similarWords: [
      {
        slug: "resolve",
        word: "resolve",
        note: "more general: to solve a problem or end a conflict.",
      },
      {
        slug: "settle",
        word: "settle",
        note: "often used for arguments or practical arrangements.",
      },
      {
        slug: "harmonize",
        word: "harmonize",
        note: "more formal and often used for systems, rules, or data.",
      },
    ],
    memoryAids: {
      etymology: "from Latin reconciliare, meaning to bring back together.",
      roots: "re- = again, con- = together, so the idea is bringing things together again.",
      mnemonic: "reconcile = re + con + cile, bring the two sides back into one line.",
    },
    searchAliases: ["reconcile differences", "reconcile accounts", "reconcile with"],
  },
];

export const suggestedWords: SearchChip[] = [
  { label: "salient", slug: "salient" },
  { label: "contemplate", slug: "contemplate" },
  { label: "issue bonds", slug: "issue-bonds" },
  { label: "efficient", slug: "efficient" },
  { label: "effective", slug: "effective" },
  { label: "serene", slug: "serene" },
];

export const recentSearches: SearchChip[] = [
  { label: "salient point", slug: "salient" },
  { label: "contemplate", slug: "contemplate" },
  { label: "issue bonds", slug: "issue-bonds" },
];

export const savedWords: SavedWord[] = [
  {
    slug: "salient",
    savedAt: "Today",
    note: "Use when one point really stands out in a presentation or article.",
    tag: "formal",
  },
  {
    slug: "contemplate",
    savedAt: "Yesterday",
    note: "Slow, reflective thinking before making a decision.",
    tag: "academic",
  },
  {
    slug: "effective",
    savedAt: "2 days ago",
    note: "Result-focused word for methods, treatments, and policies.",
    tag: "neutral",
  },
  {
    slug: "issue-bonds",
    savedAt: "3 days ago",
    note: "Finance phrase. Good to keep with raise capital and issue shares.",
    tag: "formal",
  },
];

export const recentWords: RecentWord[] = [
  {
    slug: "serene",
    viewedAt: "10 min ago",
    context: "Mood and atmosphere",
  },
  {
    slug: "efficient",
    viewedAt: "Today",
    context: "Process and workflow",
  },
  {
    slug: "reconcile",
    viewedAt: "Today",
    context: "Conflict and accounting",
  },
];

export const personalNotes: PersonalNote[] = [
  {
    slug: "salient",
    title: "salient",
    note: "When I need a word for the point that matters most, I should think “what leaps out?”.",
    updatedAt: "Updated today",
  },
  {
    slug: "contemplate",
    title: "contemplate",
    note: "Feels slower and more reflective than consider. Good for decisions and essays.",
    updatedAt: "Updated yesterday",
  },
  {
    slug: "efficient",
    title: "efficient",
    note: "Efficient is about resources and process. Effective is about the final result.",
    updatedAt: "Updated 3 days ago",
  },
];

export const featuredWordSlugs = ["salient", "contemplate", "issue-bonds"] as const;

export const wordBySlug = Object.fromEntries(
  vocabularyWords.map((word) => [word.slug, word]),
) as Record<string, VocabularyWord>;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchText(word: VocabularyWord) {
  return normalize(
    [
      word.title,
      word.partOfSpeech,
      word.chineseMeaning,
      word.englishDefinition,
      word.summary,
      word.collocations.join(" "),
      word.searchAliases.join(" "),
      word.usageLabels.join(" "),
      word.examples.map((item) => item.sentence).join(" "),
    ].join(" "),
  );
}

function scoreWord(word: VocabularyWord, query: string) {
  const normalizedQuery = normalize(query);
  const content = buildSearchText(word);
  const exactAliases = [word.slug, word.title, ...word.searchAliases].map(normalize);

  if (!normalizedQuery) {
    return 0;
  }

  let score = 0;

  if (exactAliases.includes(normalizedQuery)) {
    score += 100;
  }

  if (word.title === query.trim().toLowerCase()) {
    score += 95;
  }

  if (content.startsWith(normalizedQuery)) {
    score += 30;
  }

  if (content.includes(normalizedQuery)) {
    score += Math.min(normalizedQuery.length * 3, 40);
  }

  if (word.chineseMeaning.includes(query.trim())) {
    score += 25;
  }

  if (word.englishDefinition.toLowerCase().includes(normalizedQuery)) {
    score += 22;
  }

  if (word.collocations.some((item) => normalize(item).includes(normalizedQuery))) {
    score += 18;
  }

  if (word.examples.some((item) => normalize(item.sentence).includes(normalizedQuery))) {
    score += 12;
  }

  if (word.usageLabels.some((label) => normalizedQuery.includes(label))) {
    score += 10;
  }

  return score;
}

export function getWordBySlug(slug: string) {
  return wordBySlug[slug];
}

export function searchVocabulary(query: string, limit = 6) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return vocabularyWords.slice(0, limit);
  }

  return vocabularyWords
    .map((word) => ({
      word,
      score: scoreWord(word, normalizedQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.word.title.localeCompare(right.word.title))
    .slice(0, limit)
    .map((item) => item.word);
}

export function resolveWordForQuery(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return undefined;
  }

  const results = searchVocabulary(normalizedQuery, 1);

  if (!results.length) {
    return undefined;
  }

  const top = results[0];
  const exactMatch = [top.slug, top.title, ...top.searchAliases].some(
    (value) => normalize(value) === normalize(normalizedQuery),
  );

  if (exactMatch) {
    return top;
  }

  if (results.length === 1 && scoreWord(top, normalizedQuery) >= 45) {
    return top;
  }

  return undefined;
}

export function getWordOptions() {
  return vocabularyWords.map((word) => ({
    slug: word.slug,
    title: word.title,
    summary: word.summary,
    chineseMeaning: word.chineseMeaning,
  }));
}
