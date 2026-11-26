// 稅制參數:每年只需複製此檔、改數字。
// verify:true 表示該數字我無法由搜尋結果確認,務必對照財政部公告後再使用。
var TAX_PARAMS = {
  year: 115,
  filingYear: 116,
  brackets: [ // 課稅級距(淨所得上限, 稅率)
    { upTo: 610000, rate: 0.05 },
    { upTo: 1380000, rate: 0.12 },
    { upTo: 2770000, rate: 0.20 },
    { upTo: 5190000, rate: 0.30 },
    { upTo: Infinity, rate: 0.40 }
  ],
  exemption: 101000,          // 免稅額
  exemptionOld: 151500,       // 70歲以上
  standardSingle: 136000,
  standardMarried: 272000,
  salaryDeduction: 227000,    // 薪資特別扣除(每人上限)
  disabilityDeduction: 227000,
  savingsDeduction: 270000,   // 儲蓄投資特別扣除(利息、合併計稅股利)
  tuitionPerStudent: 25000,   // 大專以上學費
  preschoolFirst: 150000,     // 幼兒學前:第1名(無稅率限制)
  preschoolNext: 225000,      // 幼兒學前:第2名起每人
  longTermCarePerPerson: 180000, // 稅率20%以上或股利分開計稅不得扣
  basicLivingPerPerson: 213000,  // verify:115年度尚未公告,暫用114年度21.3萬
  rentLimit: 180000,          // 每一申報戶;稅率20%以上或股利分開計稅不得扣
  mortgageLimit: 300000,
  lifeInsurancePerPerson: 24000,
  donationRatio: 0.20,        // 捐贈上限:綜合所得總額20%
  rentalExpenseRate: 0.43,    // 租賃必要費用(未核實時)
  dividendCreditRate: 0.085,
  dividendCreditCap: 80000,
  dividendSeparateRate: 0.28,
  verifyKeys: ['basicLivingPerPerson']
};
if (typeof module !== 'undefined') module.exports = TAX_PARAMS;
