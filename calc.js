// 純計算邏輯,不碰 DOM。
(function (root) {
  function n(v) { v = Number(v); return isFinite(v) && v > 0 ? v : 0; }

  function bracketTax(net, P) {
    var tax = 0, lo = 0;
    for (var i = 0; i < P.brackets.length; i++) {
      var b = P.brackets[i];
      if (net > lo) tax += (Math.min(net, b.upTo) - lo) * b.rate;
      lo = b.upTo;
    }
    return tax;
  }
  function bracketOf(net, P) {
    for (var i = 0; i < P.brackets.length; i++) if (net <= P.brackets[i].upTo) return i;
    return P.brackets.length - 1;
  }

  // mode: 'std' | 'item';  div: 'combined' | 'separate'
  function scenario(inp, P, mode, div) {
    var married = !!inp.married;
    var dep70 = n(inp.dep70), depU = n(inp.depU);
    var members = 1 + (married ? 1 : 0) + dep70 + depU;
    var exemption =
      (inp.selfOld ? P.exemptionOld : P.exemption) +
      (married ? (inp.spouseOld ? P.exemptionOld : P.exemption) : 0) +
      dep70 * P.exemptionOld + depU * P.exemption;

    var salary = n(inp.salarySelf) + (married ? n(inp.salarySpouse) : 0);
    var interest = n(inp.interest);
    var dividend = n(inp.dividend);
    var rentNet = inp.rentalActual > 0 ? Math.max(0, n(inp.rentalIncome) - n(inp.rentalActual))
                                      : n(inp.rentalIncome) * (1 - P.rentalExpenseRate);
    var divIn = div === 'combined' ? dividend : 0;
    // 執行業務(9A):預設扣20%成本費用,可關閉(practiceCost === false)則全額計入
    var costRate = inp.practiceCost === false ? 0 : P.practiceCostRate;
    var practiceNet = n(inp.practice) + n(inp.practiceGross) * (1 - costRate);
    var gross = salary + interest + divIn + rentNet + practiceNet + n(inp.other);
    var mortgageYear = n(inp.mortgage) + n(inp.mortgageM) * 12;

    // 扣除額
    var deduction, detail = {};
    if (mode === 'std') {
      deduction = married ? P.standardMarried : P.standardSingle;
    } else {
      detail.donation = Math.min(n(inp.donation), gross * P.donationRatio);
      detail.insurance = Math.min(n(inp.lifeInsurance), P.lifeInsurancePerPerson * members) + n(inp.healthInsurance);
      detail.medical = n(inp.medical);
      detail.disaster = n(inp.disaster);
      // 實付利息先減除儲蓄投資特別扣除額,餘額才可列舉,上限30萬
      detail.mortgage = Math.min(P.mortgageLimit, Math.max(0, mortgageYear - Math.min(P.savingsDeduction, interest + divIn)));
      deduction = detail.donation + detail.insurance + detail.medical + detail.disaster + detail.mortgage;
    }

    // 特別扣除額
    var sp = {};
    sp.salary = Math.min(n(inp.salarySelf), P.salaryDeduction) +
                (married ? Math.min(n(inp.salarySpouse), P.salaryDeduction) : 0);
    sp.savings = Math.min(P.savingsDeduction, interest + divIn);
    sp.disability = n(inp.disabled) * P.disabilityDeduction;
    // 未填學費時,以每位大專子女的扣除上限計算
    sp.tuition = inp.tuition === undefined ? n(inp.students) * P.tuitionPerStudent
                                           : Math.min(n(inp.tuition), n(inp.students) * P.tuitionPerStudent);
    sp.rent = inp.noHome ? Math.min(n(inp.rent), P.rentLimit) : 0;
    sp.longTerm = n(inp.longTerm) * P.longTermCarePerPerson;
    // 幼兒學前:第1名15萬,第2名起每人22.5萬,無稅率限制
    var cnt = n(inp.preschool);
    var kids = cnt > 0 ? P.preschoolFirst + (cnt - 1) * P.preschoolNext : 0;
    sp.preschool = kids;
    // 長照、租金:扣除後適用稅率 ≥20%,或選擇股利分開計稅,不得扣除
    var coreSp = sp.salary + sp.savings + sp.disability + sp.tuition + kids;
    var probe = Math.max(0, gross - exemption - deduction - coreSp - sp.rent - sp.longTerm);
    if (P.brackets[bracketOf(probe, P)].rate >= 0.20 || (div === 'separate' && dividend > 0)) {
      sp.rent = 0; sp.longTerm = 0;
    }
    var spBase = sp.salary + sp.savings + sp.disability + sp.tuition + sp.rent + sp.longTerm;
    function netWith(k, bl) { return Math.max(0, gross - exemption - deduction - spBase - k - bl); }
    // 基本生活費差額(簡化:比較免稅額+扣除額+特別扣除額)
    var blTotal = P.basicLivingPerPerson * members;
    var used = exemption + deduction + spBase + kids;
    var blDiff = Math.max(0, blTotal - used);
    // 差額只能扣到淨所得為0
    blDiff = Math.min(blDiff, Math.max(0, gross - used));

    var net = netWith(kids, blDiff);
    var tax = bracketTax(net, P);
    var credit = 0, separateTax = 0;
    if (div === 'combined') credit = Math.min(dividend * P.dividendCreditRate, P.dividendCreditCap);
    else separateTax = dividend * P.dividendSeparateRate;
    var totalTax = tax - credit + separateTax;
    var withheld = n(inp.withheld);
    var bi = bracketOf(net, P);

    return {
      mode: mode, div: div, members: members, gross: gross, exemption: exemption,
      deduction: deduction, itemDetail: detail, special: sp, basicLivingDiff: blDiff,
      net: net, progressiveTax: tax, dividendCredit: credit, separateTax: separateTax,
      totalTax: totalTax, withheld: withheld, payable: totalTax - withheld,
      marginalRate: P.brackets[bi].rate,
      headroom: isFinite(P.brackets[bi].upTo) ? P.brackets[bi].upTo - net : null,
      incomeTotal: gross + (div === 'separate' ? dividend : 0),
      effectiveRate: (gross + (div === 'separate' ? dividend : 0)) > 0
        ? totalTax / (gross + (div === 'separate' ? dividend : 0)) : 0
    };
  }

  function compute(inp, P) {
    var all = {};
    ['std', 'item'].forEach(function (m) {
      ['combined', 'separate'].forEach(function (d) { all[m + '-' + d] = scenario(inp, P, m, d); });
    });
    var keys = Object.keys(all);
    // 無股利時兩種股利方式相同;以 totalTax 最小者為最佳,平手取標準+合併
    var best = keys.reduce(function (a, k) { return all[k].totalTax < all[a].totalTax - 0.5 ? k : a; }, 'std-combined');
    return { all: all, best: best, result: all[best] };
  }

  root.TaxCalc = { compute: compute, scenario: scenario, bracketTax: bracketTax };
  if (typeof module !== 'undefined') module.exports = root.TaxCalc;
})(typeof window !== 'undefined' ? window : globalThis);
