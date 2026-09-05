export const categories = [
  "Sports",
  "Technology",
  "Entertainment",
  "India",
  "World",
  "Automobile",
  "Quotes",
  "Other",
] as const;
export type Category = (typeof categories)[number];
export type TrendSource = "google" | "x";
export interface Trend {
  id: string;
  title: string;
  slug: string;
  source: TrendSource;
  category: Category;
  region: string;
  searchVolume?: string;
  growth?: string;
  status: "active" | "cooling" | "ended";
  relatedCount?: number;
  shortDescription: string;
  overview: string;
  whyTrending: string;
  keyPoints: string[];
  relatedKeywords: string[];
  publishedAt: string;
  updatedAt: string;
  sourceUrl?: string;
  indexable?: boolean;
  faqs?: { question: string; answer: string }[];
}
// Editorial publication date, not the unknown original source capture time.
// Set indexable: true only after verifying context and reviewing useful content.
export const trends: Trend[] = [
  {
    id: "2026-09-05-real-betis-vs-real-madrid",
    title: "Real Betis vs Real Madrid",
    slug: "real-betis-vs-real-madrid",
    source: "google",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "A guide to interpreting searches for this football fixture, from team news to match context.",
    overview:
      "This query pairs Real Betis and Real Madrid. People looking up a fixture may need the competition, kickoff time, lineups or the result; the keyword alone does not establish which match they mean.",
    whyTrending:
      "The supplied Google snapshot records elevated interest in this pairing. It does not include the fixture date or the event behind that interest.",
    keyPoints: [
      "Check the competition and season before reading a result.",
      "Use official club or competition pages for confirmed lineups and kickoff information.",
    ],
    relatedKeywords: [
      "Real Betis vs Real Madrid Standings",
      "Real Madrid",
      "Real Betis",
    ],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "200K+",
    growth: "1,000%",
    relatedCount: 20,
  },
  {
    id: "2026-09-05-teachers-day-quotes",
    title: "Teachers Day Quotes",
    slug: "teachers-day-quotes",
    source: "google",
    category: "Quotes",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Thoughtful ways to write an original Teachers Day message for a teacher or mentor.",
    overview:
      "A useful thank-you message names something a teacher actually helped you learn. Choose a short personal note for a card, or a more reflective message when writing to a former mentor.",
    whyTrending:
      "Teachers Day Quotes appears in the supplied search snapshot. The record does not establish the country, occasion date or a specific cause for the increase.",
    keyPoints: [
      "Original example: Thank you for making difficult questions feel worth asking.",
      "Original example: Your patience helped me find the confidence to keep learning.",
      "Avoid attributing an original message to a famous person.",
    ],
    relatedKeywords: [
      "Teachers Day wishes",
      "teacher appreciation",
      "thank you teacher",
    ],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "200K+",
    growth: "1,000%",
    relatedCount: 34,
  },
  {
    id: "2026-09-05-south-africa-vs-namibia",
    title: "South Africa vs Namibia",
    slug: "south-africa-vs-namibia",
    source: "google",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "How to identify the sport and event behind a South Africa versus Namibia search.",
    overview:
      "Country-name matchups can refer to different sports, age groups and competitions. Start by identifying the sport and the teams before using any score or fixture information.",
    whyTrending:
      "The owner supplied this matchup as a Google trend. No sport, tournament or match result was supplied, so a specific sporting event cannot be confirmed here.",
    keyPoints: [
      "Search with the sport and competition to narrow the result.",
      "Check whether the fixture involves senior, youth or other representative teams.",
    ],
    relatedKeywords: ["South Africa", "Namibia", "fixture information"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "200K+",
    growth: "1,000%",
    relatedCount: 8,
  },
  {
    id: "2026-09-05-kia-sorento",
    title: "Kia Sorento",
    slug: "kia-sorento",
    source: "google",
    category: "Automobile",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "What to check when researching Kia Sorento specifications, ownership and availability.",
    overview:
      "A vehicle search is most useful when tied to a model year and market. Compare seating, dimensions, powertrain choices and ownership costs using the specification sheet for the exact version you are considering.",
    whyTrending:
      "Kia Sorento is included in the supplied Google snapshot. The data does not identify a launch, price change or other confirmed reason for the search activity.",
    keyPoints: [
      "Specifications and availability can differ between countries and model years.",
      "Separate the listed purchase price from insurance, servicing and other ownership costs.",
    ],
    relatedKeywords: [
      "Kia Sorento specifications",
      "Kia Sorento model year",
      "SUV comparison",
    ],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "50K+",
    growth: "1,000%",
    relatedCount: 3,
  },
  {
    id: "2026-09-05-psg-vs-monaco",
    title: "PSG vs Monaco",
    slug: "psg-vs-monaco",
    source: "google",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Find the right context for a PSG versus Monaco football search without assuming a result.",
    overview:
      "This pairing can lead to fixture previews, team comparisons or past match reports. Confirm the season and competition first, especially when older reports appear beside newer search results.",
    whyTrending:
      "The supplied snapshot lists increased Google interest in this pairing but does not specify the match or a verified trigger.",
    keyPoints: [
      "Confirm whether a page is a preview or a completed-match report.",
      "Use the competition website to verify the fixture before relying on a score.",
    ],
    relatedKeywords: ["PSG", "Monaco", "football fixtures"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "50K+",
    growth: "1,000%",
  },
  {
    id: "2026-09-05-ipswich-town-vs-liverpool",
    title: "Ipswich Town vs Liverpool",
    slug: "ipswich-town-vs-liverpool",
    source: "google",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "A practical checklist for finding the relevant Ipswich Town and Liverpool fixture.",
    overview:
      "Searches combining these clubs may seek ticket details, a broadcast listing or match coverage. Those answers depend on the particular fixture and the reader’s location.",
    whyTrending:
      "The pairing appears in the supplied Google data. No kickoff, result or broadcast information was included with the snapshot.",
    keyPoints: [
      "Check club ticket pages for the exact fixture and sales conditions.",
      "Broadcast availability is region-specific; verify with an authorized provider.",
    ],
    relatedKeywords: ["Ipswich Town", "Liverpool", "match coverage"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "50K+",
    growth: "1,000%",
    relatedCount: 9,
  },
  {
    id: "2026-09-05-real-betis-vs-real-madrid-standings",
    title: "Real Betis vs Real Madrid Standings",
    slug: "real-betis-vs-real-madrid-standings",
    source: "google",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Understand the difference between a league table, a match score and a head-to-head record.",
    overview:
      "A standings query usually asks where teams sit in a competition table. A single match result and a historical head-to-head record answer different questions; neither substitutes for a dated league table.",
    whyTrending:
      "This more specific query is a separate entry in the owner’s Google snapshot. The underlying standings and table date were not supplied.",
    keyPoints: [
      "Use a table for the correct competition and season.",
      "Compare matches played as well as points when reading positions.",
    ],
    relatedKeywords: [
      "Real Betis vs Real Madrid",
      "league table",
      "football standings",
    ],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "20K+",
    growth: "1,000%",
    relatedCount: 1,
  },
  {
    id: "2026-09-05-himalayan-440",
    title: "Himalayan 440",
    slug: "himalayan-440",
    source: "google",
    category: "Automobile",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "How to check an ambiguous motorcycle search term before treating it as an official model name.",
    overview:
      "The phrase Himalayan 440 is reproduced as supplied. A trending query is not proof of an official product name or engine specification; it may reflect a comparison, an informal label or a mistaken search.",
    whyTrending:
      "The owner’s snapshot includes this exact query with search interest. It provides no manufacturer announcement confirming what the phrase refers to.",
    keyPoints: [
      "Confirm the exact model name on the manufacturer’s website.",
      "Do not infer engine capacity, launch timing or pricing from a search phrase.",
    ],
    relatedKeywords: ["Himalayan motorcycle", "motorcycle model comparison"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    searchVolume: "20K+",
    growth: "400%",
    relatedCount: 1,
  },
  {
    id: "2026-09-05-machhli",
    title: "मछली",
    slug: "machhli",
    source: "google",
    category: "Other",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Understand the Hindi word मछली and narrow a broad fish-related search by intent.",
    overview:
      "मछली is the Hindi word for fish. The query can lead to language learning, aquatic life, cooking or aquarium care, so an additional descriptive word makes results more useful.",
    whyTrending:
      "This word was supplied as a Google example without a search volume, growth figure or explanation of the interest.",
    keyPoints: [
      "For language learning, search for meaning, pronunciation or an example sentence.",
      "For aquarium research, identify the species before looking up care information.",
    ],
    relatedKeywords: ["मछली का अर्थ", "fish", "aquatic life"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-fresno-state",
    title: "Fresno State",
    slug: "fresno-state",
    source: "x",
    category: "Sports",
    region: "United States",
    status: "active",
    shortDescription:
      "Ways to narrow a Fresno State sports search to the team, season and story you need.",
    overview:
      "Fresno State is a broad school-related sports query. Add the sport, season or opponent to separate schedule information from commentary and historical coverage.",
    whyTrending:
      "The supplied X snapshot groups this topic with Trent Mosley and Gary Patterson. Their co-occurrence does not establish a specific announcement or connection.",
    keyPoints: [
      "Verify any roster or coaching claim against official athletics information.",
      "Related names are snapshot associations, not confirmed news.",
    ],
    relatedKeywords: ["Trent Mosley", "Gary Patterson"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-boots",
    title: "Boots",
    slug: "boots",
    source: "x",
    category: "Other",
    region: "United States",
    status: "active",
    shortDescription:
      "Disambiguate a broad word that can refer to footwear, a name or a brand.",
    overview:
      "Boots is too broad to identify one subject from the supplied snapshot. Footwear searches benefit from an intended use, while a name or brand search needs additional context.",
    whyTrending:
      "The X example lists Boots in the United States but supplies no posts or explanation of the topic.",
    keyPoints: [
      "Add a use such as hiking if you mean footwear.",
      "Check the surrounding discussion before assuming a person or brand is involved.",
    ],
    relatedKeywords: ["Boots meaning", "footwear"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-mason-miller",
    title: "Mason Miller",
    slug: "mason-miller",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Read a Mason Miller sports discussion with attention to dates and reliable player context.",
    overview:
      "A player-name query may surface profiles, statistics, clips or opinions. Check the season and the source of a claim before treating a circulating clip as a new event.",
    whyTrending:
      "Mason Miller is in the owner’s X sports snapshot; no specific performance, transaction or injury is established by the supplied data.",
    keyPoints: [
      "Use dated player records when comparing statistics.",
      "Distinguish official team updates from fan commentary.",
    ],
    relatedKeywords: ["Mason Miller player profile", "baseball statistics"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-scalability",
    title: "#Scalability",
    slug: "scalability",
    source: "x",
    category: "Technology",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "A practical introduction to scaling systems and the tradeoffs behind the discussion.",
    overview:
      "Scalability describes how a system handles growing demand. Vertical scaling adds capacity to a machine; horizontal scaling adds machines. Either approach still depends on bottlenecks such as database access and shared state.",
    whyTrending:
      "The supplied X snapshot associates #Scalability with #CloudNative and #SystemDesign. It does not identify a particular release or incident.",
    keyPoints: [
      "Measure latency, throughput and error rates before changing capacity.",
      "Caching helps repeated reads, while partitioning changes how data is distributed.",
      "Scaling introduces coordination and cost tradeoffs as well as capacity.",
    ],
    relatedKeywords: ["#CloudNative", "#SystemDesign"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
    faqs: [
      {
        question:
          "What is the difference between vertical and horizontal scaling?",
        answer:
          "Vertical scaling increases the resources of one machine. Horizontal scaling distributes work across more machines, which also requires coordination between them.",
      },
    ],
  },
  {
    id: "2026-09-05-campy",
    title: "Campy",
    slug: "campy",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "How to resolve the identity behind an informal sports nickname.",
    overview:
      "Campy can be a nickname or an informal reference. The supplied category is Sports, but that alone is not enough to identify a particular person.",
    whyTrending:
      "Campy appears in the X example list without an accompanying post, full name or confirmed event.",
    keyPoints: [
      "Find a full name and team before connecting the term to a player.",
      "Do not transfer statistics from a similarly named person.",
    ],
    relatedKeywords: ["Campy nickname", "sports nicknames"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-spencer-jones",
    title: "Spencer Jones",
    slug: "spencer-jones",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "A guide to checking player identity and context in Spencer Jones discussions.",
    overview:
      "Names can be shared by athletes in different leagues. A team, sport and dated profile help establish who is being discussed before comparing reports or statistics.",
    whyTrending:
      "The supplied X snapshot places Spencer Jones in Sports but does not specify a team or the cause of the discussion.",
    keyPoints: [
      "Match the person using both team and sport.",
      "Separate prospect projections from recorded performance.",
    ],
    relatedKeywords: ["Spencer Jones profile", "player development"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-luis-campusano",
    title: "Luis Campusano",
    slug: "luis-campusano",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "What to verify when reading Luis Campusano player news and statistics.",
    overview:
      "Player discussions often combine season totals, individual games and roster speculation. Those are distinct types of information and should be checked against dated records.",
    whyTrending:
      "Luis Campusano appears in the supplied X sports topics. No game result or roster move was supplied.",
    keyPoints: [
      "Check whether a statistic is for one game or an entire season.",
      "Confirm roster news with an official team announcement.",
    ],
    relatedKeywords: ["Luis Campusano profile", "player statistics"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-bednar",
    title: "Bednar",
    slug: "bednar",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Identify the athlete and distinguish related discussion from a confirmed story.",
    overview:
      "A surname-only query needs more context before it can support a reliable player summary. Pair Bednar with a first name, team or sport when checking results.",
    whyTrending:
      "The owner’s X snapshot associates Bednar with Blackburn. This is a supplied related keyword, not evidence of a transaction or matchup.",
    keyPoints: [
      "Confirm full names before comparing player records.",
      "A related keyword does not by itself establish a causal link.",
    ],
    relatedKeywords: ["Blackburn", "Bednar sports"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-fighton",
    title: "#FightOn",
    slug: "fighton",
    source: "x",
    category: "Sports",
    region: "United States",
    status: "active",
    shortDescription:
      "How a supporter hashtag can connect different posts without identifying one event.",
    overview:
      "A rallying hashtag can be used for multiple teams, games and supporter messages. Look at the account and date to understand what an individual use refers to.",
    whyTrending:
      "The supplied United States X snapshot includes #FightOn without posts or an event description.",
    keyPoints: [
      "Use the post’s context to identify the team or organization.",
      "Avoid treating all uses of a hashtag as one breaking story.",
    ],
    relatedKeywords: ["FightOn supporters", "college sports"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-ben-shelton",
    title: "Ben Shelton",
    slug: "ben-shelton",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Make sense of tennis searches by checking tournament, draw and round.",
    overview:
      "A tennis player’s name can lead to rankings, schedules or match clips. Identify the tournament and round before interpreting a result, and check whether coverage concerns singles or doubles.",
    whyTrending:
      "Ben Shelton appears with Shapovalov in the supplied X snapshot. The pairing does not confirm a scheduled match or a result.",
    keyPoints: [
      "Check the official tournament draw for match context.",
      "Rankings need a publication date to be compared meaningfully.",
    ],
    relatedKeywords: ["Shapovalov", "tennis draw"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-logan-gilbert",
    title: "Logan Gilbert",
    slug: "logan-gilbert",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Read pitching discussions with the right game and statistical context.",
    overview:
      "Pitching commentary may emphasize strikeouts, innings or individual pitches. A complete comparison needs the timeframe and the type of statistic being discussed.",
    whyTrending:
      "Logan Gilbert is a supplied X sports example. No performance line or recent event accompanies the entry.",
    keyPoints: [
      "Distinguish single-game numbers from season averages.",
      "Confirm the game date before treating a clip as current.",
    ],
    relatedKeywords: ["Logan Gilbert profile", "pitching statistics"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-davis-warren",
    title: "Davis Warren",
    slug: "davis-warren",
    source: "x",
    category: "Sports",
    region: "United States",
    status: "active",
    shortDescription: "Find clear context for a Davis Warren sports search.",
    overview:
      "When researching an athlete, begin with an official profile and then look for dated reporting. This helps separate established background from predictions about future playing time.",
    whyTrending:
      "Davis Warren is listed in the United States X snapshot without a stated reason for the discussion.",
    keyPoints: [
      "Treat lineup predictions as predictions until confirmed.",
      "Check the publication date on reused interviews and clips.",
    ],
    relatedKeywords: ["Davis Warren profile", "college football"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-wendy-choo",
    title: "Wendy Choo",
    slug: "wendy-choo",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Understand the distinction between wrestling character stories and verified event information.",
    overview:
      "Wrestling discussions may cover a character, a televised storyline or an event appearance. Keep the presentation of a storyline separate from claims about the performer’s personal life.",
    whyTrending:
      "Wendy Choo appears in the supplied X sports list, with no particular segment or result identified.",
    keyPoints: [
      "Check the promotion’s event listing for confirmed appearances.",
      "Describe storyline developments as part of the show’s narrative.",
    ],
    relatedKeywords: ["Wendy Choo wrestling", "wrestling events"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-jeremiah-smith",
    title: "Jeremiah Smith",
    slug: "jeremiah-smith",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Check season and competition context when researching Jeremiah Smith.",
    overview:
      "Athlete searches often mix recruiting coverage, highlights and current competition. Date and season labels help readers avoid treating older evaluations as new updates.",
    whyTrending:
      "The owner’s X example includes Jeremiah Smith in Sports but supplies no event or performance details.",
    keyPoints: [
      "Separate recruiting assessments from competition statistics.",
      "Confirm the season when comparing highlight clips.",
    ],
    relatedKeywords: ["Jeremiah Smith profile", "football highlights"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-hays",
    title: "Hays",
    slug: "hays",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Narrow a surname search before connecting it to sports news.",
    overview:
      "Hays alone can refer to more than one person or place. The Sports category offers a starting point, but the supplied term does not identify a full name or team.",
    whyTrending:
      "Hays is included in the supplied X snapshot without additional context explaining its appearance.",
    keyPoints: [
      "Add a first name or team to disambiguate the query.",
      "Do not attach a transaction or injury report to a surname alone.",
    ],
    relatedKeywords: ["Hays sports", "player lookup"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-blake-snell",
    title: "Blake Snell",
    slug: "blake-snell",
    source: "x",
    category: "Sports",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Evaluate a baseball discussion without assuming what related player names imply.",
    overview:
      "Player comparisons can involve performance, matchups or roster speculation. Establish which question a discussion addresses before drawing conclusions from two names appearing together.",
    whyTrending:
      "The supplied X snapshot links Blake Snell with Kyle Tucker as related topics. It does not explain the relationship or establish a game event.",
    keyPoints: [
      "Use the same statistical period for a comparison.",
      "Verify any trade or contract claim through a dated primary announcement.",
    ],
    relatedKeywords: ["Kyle Tucker", "baseball analysis"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-bruce-campbell",
    title: "Bruce Campbell",
    slug: "bruce-campbell",
    source: "x",
    category: "Entertainment",
    region: "Not supplied",
    status: "active",
    shortDescription:
      "Find the right film, appearance or interview behind a Bruce Campbell search.",
    overview:
      "Entertainment searches can resurface older clips and film discussions. Identify the title or event and its original date before reading an item as a new announcement.",
    whyTrending:
      "Bruce Campbell appears in the supplied X entertainment snapshot. No new film, appearance or personal news was supplied.",
    keyPoints: [
      "Check a release or event listing for confirmed dates.",
      "Distinguish a retrospective interview from a new announcement.",
    ],
    relatedKeywords: ["Bruce Campbell films", "film interviews"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-iahsfb",
    title: "#iahsfb",
    slug: "iahsfb",
    source: "x",
    category: "Sports",
    region: "United States",
    status: "active",
    shortDescription:
      "How to verify local football discussion collected under a regional hashtag.",
    overview:
      "Local-sports hashtags can collect posts from many schools and games. A school name, opponent and game date are needed before a score can be interpreted reliably.",
    whyTrending:
      "The supplied United States X list includes #iahsfb but does not define the hashtag or identify a game.",
    keyPoints: [
      "Verify the tag’s meaning from context rather than assuming an expansion.",
      "Check a school or competition source before repeating a score.",
    ],
    relatedKeywords: ["high school football", "local sports"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-vito",
    title: "Vito",
    slug: "vito",
    source: "x",
    category: "Other",
    region: "United States",
    status: "active",
    shortDescription:
      "Resolve a short name before drawing conclusions from a related topic.",
    overview:
      "Vito is not a complete identity. A surname, organization or event is needed to distinguish the intended person from others who share the name.",
    whyTrending:
      "The United States X example includes Vito with Ammo Williams as a related keyword. The data does not confirm who Vito is or why the terms appear together.",
    keyPoints: [
      "Seek a full name in a reliable source.",
      "Do not infer an event result from a related name.",
    ],
    relatedKeywords: ["Ammo Williams", "Vito identity"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-yash",
    title: "Yash",
    slug: "yash",
    source: "x",
    category: "Other",
    region: "United States",
    status: "active",
    shortDescription:
      "Disambiguate a common name before choosing a person or news story.",
    overview:
      "Yash may identify different people. Add a surname, profession or work title to make the search useful, especially when a regional trend list contains no explanatory text.",
    whyTrending:
      "Yash appears in the supplied United States X snapshot. No category or person-specific context was provided.",
    keyPoints: [
      "Check identity using more than the given name.",
      "A trend region describes the supplied listing, not a person’s nationality.",
    ],
    relatedKeywords: ["Yash name", "Yash context"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
  {
    id: "2026-09-05-txhsfb",
    title: "#txhsfb",
    slug: "txhsfb",
    source: "x",
    category: "Sports",
    region: "United States",
    status: "active",
    shortDescription:
      "Follow local football topics with school, date and source context.",
    overview:
      "A regional football discussion may include schedules, highlights and fan reports from multiple games. Keep each item tied to its school and event date.",
    whyTrending:
      "The United States X snapshot lists #txhsfb without a definition, posts or confirmed match information.",
    keyPoints: [
      "Verify the hashtag’s intended meaning in the relevant discussion.",
      "Treat an unconfirmed fan score as unverified until an official source supports it.",
    ],
    relatedKeywords: ["high school sports", "football schedules"],
    publishedAt: "2026-09-05T00:00:00Z",
    updatedAt: "2026-09-05T00:00:00Z",
    indexable: false,
  },
];
