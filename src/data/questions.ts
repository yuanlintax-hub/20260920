import { QuizQuestion } from "../types";

export const TAX_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: "地價稅",
    question: "豚寶家想申請地價稅自用住宅用地優惠稅率，最晚應在幾月幾日前提出申請，當年才能適用？",
    options: ["A. 3月22日", "B. 9月22日", "C. 11月30日"],
    correctAnswer: "B. 9月22日",
    explanation: "符合條件者須在9月22日前申請，當年才能適用自用住宅用地優惠稅率千分之2。",
  },
  {
    id: 2,
    category: "地價稅",
    question: "豚寶將自住房屋的一樓改成豬排店，這塊土地的地價稅應如何課徵？",
    options: ["A. 全部仍按自用住宅用地稅率", "B. 營業部分按一般用地稅率", "C. 整筆土地都不用繳稅"],
    correctAnswer: "B. 營業部分按一般用地稅率",
    explanation: "房屋部分供營業使用時，營業部分土地按一般用地稅率課徵；符合條件的自住部分仍可申請優惠。",
  },
  {
    id: 3,
    category: "房屋稅",
    question: "豚寶想讓房屋適用房屋稅自住優惠稅率，下列哪一項是必要條件？",
    options: ["A. 房屋出租給豚肉攤商", "B. 本人、配偶或直系親屬實際居住並設立戶籍", "C. 房屋完全沒有人居住"],
    correctAnswer: "B. 本人、配偶或直系親屬實際居住並設立戶籍",
    explanation: "自住房屋須實際居住並設籍，而且不能出租或供營業使用。",
  },
  {
    id: 4,
    category: "房屋稅",
    question: "豚寶將原本的住家全部改成製作豚肉禮盒的營業場所，房屋稅還能按自住稅率課徵嗎？",
    options: ["A. 可以，房屋是自己的就行", "B. 不可以，已供營業使用", "C. 可以，只要沒有聘請員工"],
    correctAnswer: "B. 不可以，已供營業使用",
    explanation: "房屋供營業使用，就不符合自住房屋「無出租、無營業」的條件。",
  },
  {
    id: 5,
    category: "身障用車免稅",
    question: "阿公持有身心障礙證明但沒有駕照，家人用自己的車載阿公參加豚肉節。下列何者可能符合免稅條件？",
    options: [
      "A. 爸爸車輛車籍地和阿公戶籍同地址",
      "B. 和阿公不同戶籍的姑姑車輛",
      "C. 豚肉節所有工作車輛",
    ],
    correctAnswer: "A. 爸爸車輛車籍地和阿公戶籍同地址",
    explanation: "2親等親屬車輛供無駕照身障者使用，若其戶籍地或車籍地和身障者戶籍地同地址，該車輛可以申請免牌照稅。",
  },
  {
    id: 6,
    category: "身障用車免稅",
    question: "每一位符合條件的身心障礙者，最多可有幾輛車免徵使用牌照稅？",
    options: ["A. 1輛", "B. 2輛", "C. 不限輛數"],
    correctAnswer: "A. 1輛",
    explanation: "每位身心障礙者以1輛為限；免稅金額以汽缸總排氣量2,400cc車輛的稅額為限，超過部分仍須繳納差額。",
  },
  {
    id: 7,
    category: "電動車免牌照稅",
    question: "豚寶購買哪一種配送車，才符合彰化縣現行電動車免徵使用牌照稅的基本條件？",
    options: ["A. 完全以電能為動力的車輛", "B. 一般汽油車", "C. 油電混合車"],
    correctAnswer: "A. 完全以電能為動力的車輛",
    explanation: "優惠適用於完全以電能為動力的電動車輛，不包含油電混合車。",
  },
  {
    id: 8,
    category: "電動車免牌照稅",
    question: "車籍地址登記在彰化縣的純電動車，免徵使用牌照稅需要車主另外申請嗎？",
    options: ["A. 需要每年申請", "B. 不需要，由稅務局主動辦理", "C. 只有豚肉節期間免申請"],
    correctAnswer: "B. 不需要，由稅務局主動辦理",
    explanation: "彰化縣對符合條件的電動車主動辦理免稅，現行免徵期限延長至民國119年12月31日。",
  },
  {
    id: 9,
    category: "雲端發票",
    question: "小彰在豚肉節買香腸，想把發票直接存入雲端，結帳時應該怎麼做？",
    options: ["A. 出示手機條碼", "B. 出示健保卡", "C. 告訴店家住址"],
    correctAnswer: "A. 出示手機條碼",
    explanation: "結帳時出示手機條碼等載具，就能將發票儲存在雲端。",
  },
  {
    id: 10,
    category: "雲端發票",
    question: "小化想把購買爌肉飯取得的雲端發票捐給社福團體，可以使用什麼？",
    options: ["A. 捐贈碼", "B. 郵遞區號", "C. 商品編號"],
    correctAnswer: "A. 捐贈碼",
    explanation: "消費時出示或說出社福團體的捐贈碼，就能捐贈雲端發票。",
  },
  {
    id: 11,
    category: "雲端發票",
    question: "豚寶希望雲端發票中獎後，獎金可以自動匯入銀行帳戶，應先完成什麼設定？",
    options: ["A. 設定領獎帳戶", "B. 設定手機桌布", "C. 登記豚肉節會員"],
    correctAnswer: "A. 設定領獎帳戶",
    explanation: "完成領獎帳戶設定後，中獎獎金可自動匯入指定帳戶。",
  },
  {
    id: 12,
    category: "雲端發票",
    question: "豚寶逛豚肉節時，分別使用手機條碼、會員卡和悠遊卡儲存雲端發票。想把不同載具的發票集中管理，應該怎麼做？",
    options: [
      "A. 將會員卡和悠遊卡歸戶至手機條碼",
      "B. 把手機條碼截圖後刪除",
      "C. 將每張發票列印出來",
    ],
    correctAnswer: "A. 將會員卡和悠遊卡歸戶至手機條碼",
    explanation: "將會員卡、悠遊卡等載具歸戶至手機條碼，可集中管理雲端發票，並享有自動對獎的便利。",
  },
];

/**
 * Randomly selects 4 non-repeating questions, prioritizing diverse categories.
 */
export function getRandomFourQuestions(): QuizQuestion[] {
  // Shuffle all questions
  const shuffled = [...TAX_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Prioritize unique categories
  const selected: QuizQuestion[] = [];
  const usedCategories = new Set<string>();

  for (const q of shuffled) {
    if (!usedCategories.has(q.category)) {
      selected.push(q);
      usedCategories.add(q.category);
      if (selected.length === 4) break;
    }
  }

  // If still need more to reach 4, fill from remaining
  if (selected.length < 4) {
    for (const q of shuffled) {
      if (!selected.includes(q)) {
        selected.push(q);
        if (selected.length === 4) break;
      }
    }
  }

  return selected.slice(0, 4);
}

/**
 * Backward compatibility alias
 */
export function getRandomTwoQuestions(): QuizQuestion[] {
  return getRandomFourQuestions().slice(0, 2);
}
