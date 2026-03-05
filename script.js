/**
 * 银行内部信贷利率计算器 JavaScript
 * 包含各种贷款计算逻辑和UI交互功能
 */

// 全局变量
let loanData = {
    amount: 100000,
    amountUnit: 'yuan',
    term: 12,
    termUnit: 'month',
    annualRate: 4.35,
    repaymentMethod: 'equal-principal-interest',
    firstPaymentDate: '',
    paymentFrequency: 'monthly',
    withdrawalAmount: 50000,
    withdrawalDays: 30,
    interestPaymentFrequency: 'monthly'
};

// 计算结果缓存
let calculationResults = {};

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initializePage();
    
    // 绑定事件
    bindEvents();
    
    // 初始计算
    calculateLoan();
});

/**
 * 初始化页面
 */
function initializePage() {
    // 设置当前日期时间
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // 初始化表单值
    document.getElementById('loan-amount').value = loanData.amount;
    document.getElementById('amount-unit').value = loanData.amountUnit;
    document.getElementById('loan-term').value = loanData.term;
    document.getElementById('term-unit').value = loanData.termUnit;
    document.getElementById('annual-rate').value = loanData.annualRate;
    document.getElementById('withdrawal-amount').value = loanData.withdrawalAmount;
    document.getElementById('withdrawal-days').value = loanData.withdrawalDays;
    
    // 初始化还款方式单选框
    document.querySelector(`input[name="repayment-method"][value="${loanData.repaymentMethod}"]`).checked = true;
    
    // 设置默认首次还款日期为下个月的今天
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const defaultDate = nextMonth.toISOString().split('T')[0];
    document.getElementById('first-payment-date').value = defaultDate;
    loanData.firstPaymentDate = defaultDate;
    
    // 检查是否显示按日计息特殊参数
    toggleDailyInterestParams();
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 表单输入变化事件
    document.getElementById('loan-amount').addEventListener('input', updateLoanData);
    document.getElementById('amount-unit').addEventListener('change', updateLoanData);
    document.getElementById('loan-term').addEventListener('input', updateLoanData);
    document.getElementById('term-unit').addEventListener('change', updateLoanData);
    document.getElementById('annual-rate').addEventListener('input', updateLoanData);
    document.getElementById('withdrawal-amount').addEventListener('input', updateLoanData);
    document.getElementById('withdrawal-days').addEventListener('input', updateLoanData);
    document.getElementById('interest-payment-frequency').addEventListener('input', updateLoanData);
    
    // 还款方式单选框变化事件
    document.querySelectorAll('input[name="repayment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            loanData.repaymentMethod = this.value;
            toggleSpecialMethodParams();
            calculateLoan();
        });
    });
    
    // 首次还款日期变化事件
    document.getElementById('first-payment-date').addEventListener('change', function() {
        loanData.firstPaymentDate = this.value;
        calculateLoan();
    });
    
    // 还款频率变化事件
    document.getElementById('payment-frequency').addEventListener('change', function() {
        loanData.paymentFrequency = this.value;
        calculateLoan();
    });
    
    // 利息支付频率变化事件
    document.getElementById('interest-payment-frequency').addEventListener('change', function() {
        loanData.interestPaymentFrequency = this.value;
        calculateLoan();
    });
    
    // 计算按钮点击事件
    document.getElementById('calculate-btn').addEventListener('click', function() {
        console.log('计算按钮被点击');
        calculateLoan();
    });
    
    // 重置按钮点击事件
    document.getElementById('reset-btn').addEventListener('click', resetForm);
    
    // 导出按钮点击事件
    document.getElementById('export-btn').addEventListener('click', showExportModal);
    
    // 关闭导出模态框
    document.getElementById('close-modal').addEventListener('click', hideExportModal);
    document.getElementById('cancel-export').addEventListener('click', hideExportModal);
    
    // 关闭计算方式详情模态框
    document.getElementById('close-calculation-detail').addEventListener('click', hideCalculationDetailModal);
    document.getElementById('close-calculation-detail-btn').addEventListener('click', hideCalculationDetailModal);
    
    // 确认导出
    document.getElementById('confirm-export').addEventListener('click', exportResults);
}

/**
 * 更新贷款数据
 */
function updateLoanData() {
    loanData.amount = parseFloat(document.getElementById('loan-amount').value) || 0;
    loanData.amountUnit = document.getElementById('amount-unit').value;
    loanData.term = parseInt(document.getElementById('loan-term').value) || 0;
    loanData.termUnit = document.getElementById('term-unit').value;
    loanData.annualRate = parseFloat(document.getElementById('annual-rate').value) || 0;
    loanData.firstPaymentDate = document.getElementById('first-payment-date').value;
    loanData.paymentFrequency = document.getElementById('payment-frequency').value;
    loanData.withdrawalAmount = parseFloat(document.getElementById('withdrawal-amount').value) || 0;
    loanData.withdrawalDays = parseInt(document.getElementById('withdrawal-days').value) || 0;
    
    // 利息支付频率（先息后本专用）
    const interestPaymentFrequencyElem = document.getElementById('interest-payment-frequency');
    if (interestPaymentFrequencyElem) {
        loanData.interestPaymentFrequency = interestPaymentFrequencyElem.value;
    }
    
    // 实时计算
    calculateLoan();
}

/**
 * 切换特殊还款方式参数显示
 */
function toggleSpecialMethodParams() {
    const specialMethodParams = document.getElementById('special-method-params');
    const dailyInterestParams = document.getElementById('daily-interest-params-content');
    const interestFirstParams = document.getElementById('interest-first-params-content');
    
    // 隐藏所有特殊参数
    specialMethodParams.classList.add('hidden');
    dailyInterestParams.classList.add('hidden');
    interestFirstParams.classList.add('hidden');
    
    // 根据选择的还款方式显示相应参数
    if (loanData.repaymentMethod === 'daily-interest') {
        specialMethodParams.classList.remove('hidden');
        dailyInterestParams.classList.remove('hidden');
    } else if (loanData.repaymentMethod === 'interest-first') {
        specialMethodParams.classList.remove('hidden');
        interestFirstParams.classList.remove('hidden');
    }
}

/**
 * 生成还款日期列表
 * @param {string} firstDate - 首次还款日期（YYYY-MM-DD格式）
 * @param {number} term - 还款期限
 * @param {string} frequency - 还款频率
 * @returns {Array} 还款日期列表
 */
function generatePaymentDates(firstDate, term, frequency) {
    const dates = [];
    const firstPaymentDate = new Date(firstDate);
    
    // 添加首次还款日期
    dates.push(firstPaymentDate);
    
    // 根据还款频率和期限生成后续还款日期
    for (let i = 1; i < term; i++) {
        const nextDate = new Date(firstPaymentDate);
        
        switch (frequency) {
            case 'monthly':
                nextDate.setMonth(firstPaymentDate.getMonth() + i);
                break;
            case 'quarterly':
                nextDate.setMonth(firstPaymentDate.getMonth() + i * 3);
                break;
            case 'semi-annually':
                nextDate.setMonth(firstPaymentDate.getMonth() + i * 6);
                break;
            case 'annually':
                nextDate.setFullYear(firstPaymentDate.getFullYear() + i);
                break;
            default:
                nextDate.setMonth(firstPaymentDate.getMonth() + i);
        }
        
        dates.push(nextDate);
    }
    
    return dates;
}

/**
 * 更新当前日期时间
 */
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
    };
    document.getElementById('current-date-time').textContent = now.toLocaleString('zh-CN', options);
}

/**
 * 计算贷款
 */
function calculateLoan() {
    console.log('开始计算贷款');
    // 显示加载状态
    const calculateBtn = document.getElementById('calculate-btn');
    const originalText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<span class="loading mr-2"></span> 计算中...';
    calculateBtn.disabled = true;
    
    // 重置计算结果
    calculationResults = {};
    
    // 验证输入
    if (!validateInputs()) {
        console.log('输入验证失败，停止计算');
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
        return;
    }
    console.log('输入验证通过');
    
    // 转换贷款金额为元
    const principal = loanData.amountUnit === 'wan' ? loanData.amount * 10000 : loanData.amount;
    
    // 转换贷款期限
    let termInMonths = 0;
    let termInDays = 0;
    let termInYears = 0;
    
    switch (loanData.termUnit) {
        case 'day':
            termInDays = loanData.term;
            termInMonths = loanData.term / 30;
            termInYears = loanData.term / 365;
            break;
        case 'month':
            termInMonths = loanData.term;
            termInDays = loanData.term * 30;
            termInYears = loanData.term / 12;
            break;
        case 'year':
            termInYears = loanData.term;
            termInMonths = loanData.term * 12;
            termInDays = loanData.term * 365;
            break;
    }
    
    // 月利率
    const monthlyRate = loanData.annualRate / 100 / 12;
    
    // 日利率
    const dailyRate = loanData.annualRate / 100 / 365;
    
    // 年利率
    const annualRate = loanData.annualRate / 100;
    
    // 生成还款日期列表
    let paymentDates = [];
    let adjustedTerm = termInMonths;
    
    // 根据还款频率调整期限
    if (loanData.repaymentMethod !== 'daily-interest' && loanData.repaymentMethod !== 'interest-at-maturity') {
        switch (loanData.paymentFrequency) {
            case 'monthly':
                adjustedTerm = termInMonths;
                break;
            case 'quarterly':
                adjustedTerm = Math.ceil(termInMonths / 3);
                break;
            case 'semi-annually':
                adjustedTerm = Math.ceil(termInMonths / 6);
                break;
            case 'annually':
                adjustedTerm = Math.ceil(termInMonths / 12);
                break;
        }
        
        // 生成还款日期
        paymentDates = generatePaymentDates(loanData.firstPaymentDate, adjustedTerm, loanData.paymentFrequency);
    }
    
    // 根据选择的还款方式进行计算
    setTimeout(() => {
        console.log('开始执行计算逻辑，还款方式：', loanData.repaymentMethod);
        // 重置计算结果
        calculationResults = {};
        
        // 根据选择的还款方式进行计算
        switch (loanData.repaymentMethod) {
            case 'equal-principal-interest':
                calculationResults[loanData.repaymentMethod] = calculateEqualPrincipalInterest(
                    principal, 
                    adjustedTerm, 
                    monthlyRate, 
                    paymentDates,
                    loanData.paymentFrequency
                );
                break;
            case 'equal-principal':
                calculationResults[loanData.repaymentMethod] = calculateEqualPrincipal(
                    principal, 
                    adjustedTerm, 
                    monthlyRate, 
                    paymentDates,
                    loanData.paymentFrequency
                );
                break;
            case 'interest-at-maturity':
                calculationResults[loanData.repaymentMethod] = calculateInterestAtMaturity(
                    principal, 
                    termInMonths, 
                    monthlyRate,
                    loanData.firstPaymentDate
                );
                break;
            case 'daily-interest':
                calculationResults[loanData.repaymentMethod] = calculateDailyInterest(
                    principal, 
                    loanData.withdrawalAmount, 
                    loanData.withdrawalDays, 
                    dailyRate
                );
                break;
            case 'interest-first':
                console.log('计算先息后本还款方式');
                calculationResults[loanData.repaymentMethod] = calculateInterestFirst(
                    principal,
                    termInMonths,
                    monthlyRate,
                    paymentDates,
                    loanData.interestPaymentFrequency,
                    loanData.firstPaymentDate
                );
                break;
        }
        
        // 更新UI显示结果
        updateResultsUI();
        
        // 更新计算方式说明
        updateCalculationMethodExplanation();
        
        // 恢复按钮状态
        calculateBtn.innerHTML = originalText;
        calculateBtn.disabled = false;
    }, 300); // 模拟计算延迟，提升用户体验
}

/**
 * 验证输入
 * @returns {boolean} 输入是否有效
 */
function validateInputs() {
    // 验证贷款金额
    if (loanData.amount <= 0) {
        alert('贷款金额必须大于0');
        return false;
    }
    
    // 验证贷款期限
    if (loanData.term <= 0) {
        alert('贷款期限必须大于0');
        return false;
    }
    
    // 验证年利率
    if (loanData.annualRate <= 0) {
        alert('年利率必须大于0');
        return false;
    }
    
    // 验证首次还款日期
    if (!loanData.firstPaymentDate) {
        alert('请选择首次还款日期');
        return false;
    }
    
    // 验证首次还款日期不能早于今天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstPaymentDate = new Date(loanData.firstPaymentDate);
    
    if (firstPaymentDate < today) {
        alert('首次还款日期不能早于今天');
        return false;
    }
    
    // 验证按日计息参数
    if (loanData.repaymentMethod === 'daily-interest') {
        if (loanData.withdrawalAmount <= 0) {
            alert('提款金额必须大于0');
            return false;
        }
        
        if (loanData.withdrawalDays <= 0) {
            alert('提款天数必须大于0');
            return false;
        }
        
        if (loanData.withdrawalAmount > (loanData.amountUnit === 'wan' ? loanData.amount * 10000 : loanData.amount)) {
            alert('提款金额不能大于贷款金额');
            return false;
        }
    }
    
    return true;
}

/**
 * 计算等额本息还款
 * 公式：每期还款额 = 贷款本金×期利率×(1+期利率)^还款期数/[(1+期利率)^还款期数-1]
 * @param {number} principal - 贷款本金
 * @param {number} term - 还款期数
 * @param {number} monthlyRate - 月利率
 * @param {Array} paymentDates - 还款日期列表
 * @param {string} frequency - 还款频率
 * @returns {Object} 计算结果
 */
function calculateEqualPrincipalInterest(principal, term, monthlyRate, paymentDates, frequency) {
    const schedule = [];
    let remainingPrincipal = principal;
    
    // 根据还款频率调整利率
    let periodRate = monthlyRate;
    switch (frequency) {
        case 'quarterly':
            periodRate = monthlyRate * 3;
            break;
        case 'semi-annually':
            periodRate = monthlyRate * 6;
            break;
        case 'annually':
            periodRate = monthlyRate * 12;
            break;
    }
    
    // 每期还款额
    const periodPayment = principal * periodRate * Math.pow(1 + periodRate, term) / 
        (Math.pow(1 + periodRate, term) - 1);
    
    // 计算每期还款明细
    for (let i = 1; i <= term; i++) {
        const interestPayment = remainingPrincipal * periodRate;
        const principalPayment = periodPayment - interestPayment;
        remainingPrincipal -= principalPayment;
        
        // 获取还款日期
        const paymentDate = paymentDates[i - 1] ? formatDate(paymentDates[i - 1]) : '';
        
        // 计算方式说明
        const calculationExplanation = {
            payment: `每期还款额 = 贷款本金×期利率×(1+期利率)^还款期数/[(1+期利率)^还款期数-1] = ${formatCurrency(principal)}×${(periodRate * 100).toFixed(4)}%×(1+${(periodRate * 100).toFixed(4)}%)^${term}/[(1+${(periodRate * 100).toFixed(4)}%)^${term}-1] = ${formatCurrency(periodPayment)}`,
            interest: `本期利息 = 剩余本金×期利率 = ${formatCurrency(remainingPrincipal + principalPayment)}×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(interestPayment)}`,
            principal: `本期本金 = 每期还款额 - 本期利息 = ${formatCurrency(periodPayment)} - ${formatCurrency(interestPayment)} = ${formatCurrency(principalPayment)}`,
            remainingPrincipal: `剩余本金 = 上期剩余本金 - 本期本金 = ${formatCurrency(remainingPrincipal + principalPayment)} - ${formatCurrency(principalPayment)} = ${formatCurrency(remainingPrincipal)}`
        };
        
        // 最后一期调整，避免浮点数精度问题
        if (i === term) {
            const finalPrincipalPayment = remainingPrincipal + principalPayment;
            const finalInterestPayment = periodPayment - finalPrincipalPayment;
            
            schedule.push({
                period: i,
                paymentDate: paymentDate,
                payment: periodPayment,
                principal: finalPrincipalPayment,
                interest: finalInterestPayment,
                remainingPrincipal: 0,
                calculationExplanation: calculationExplanation
            });
        } else {
            schedule.push({
                period: i,
                paymentDate: paymentDate,
                payment: periodPayment,
                principal: principalPayment,
                interest: interestPayment,
                remainingPrincipal: remainingPrincipal,
                calculationExplanation: calculationExplanation
            });
        }
    }
    
    // 计算总还款额和总利息
    const totalPayment = periodPayment * term;
    const totalInterest = totalPayment - principal;
    
    return {
        method: '等额本息',
        periodPayment: periodPayment,
        totalPayment: totalPayment,
        totalInterest: totalInterest,
        schedule: schedule,
        frequency: frequency
    };
}

/**
 * 计算等额本金还款
 * 公式：每期还款额 = (贷款本金/还款期数) + (贷款本金-已还本金累计额)×期利率
 * @param {number} principal - 贷款本金
 * @param {number} term - 还款期数
 * @param {number} monthlyRate - 月利率
 * @param {Array} paymentDates - 还款日期列表
 * @param {string} frequency - 还款频率
 * @returns {Object} 计算结果
 */
function calculateEqualPrincipal(principal, term, monthlyRate, paymentDates, frequency) {
    const schedule = [];
    let remainingPrincipal = principal;
    
    // 根据还款频率调整利率
    let periodRate = monthlyRate;
    switch (frequency) {
        case 'quarterly':
            periodRate = monthlyRate * 3;
            break;
        case 'semi-annually':
            periodRate = monthlyRate * 6;
            break;
        case 'annually':
            periodRate = monthlyRate * 12;
            break;
    }
    
    // 每期应还本金
    const periodPrincipal = principal / term;
    
    // 计算每期还款明细
    for (let i = 1; i <= term; i++) {
        const interestPayment = remainingPrincipal * periodRate;
        const payment = periodPrincipal + interestPayment;
        remainingPrincipal -= periodPrincipal;
        
        // 获取还款日期
        const paymentDate = paymentDates[i - 1] ? formatDate(paymentDates[i - 1]) : '';
        
        // 计算方式说明
        const calculationExplanation = {
            payment: `每期还款额 = (贷款本金/还款期数) + (贷款本金-已还本金累计额)×期利率 = (${formatCurrency(principal)}/${term}) + (${formatCurrency(remainingPrincipal + periodPrincipal)})×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(payment)}`,
            interest: `本期利息 = 剩余本金×期利率 = ${formatCurrency(remainingPrincipal + periodPrincipal)}×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(interestPayment)}`,
            principal: `本期本金 = 贷款本金/还款期数 = ${formatCurrency(principal)}/${term} = ${formatCurrency(periodPrincipal)}`,
            remainingPrincipal: `剩余本金 = 上期剩余本金 - 本期本金 = ${formatCurrency(remainingPrincipal + periodPrincipal)} - ${formatCurrency(periodPrincipal)} = ${formatCurrency(remainingPrincipal)}`
        };
        
        // 最后一期调整，避免浮点数精度问题
        if (i === term) {
            const finalPrincipalPayment = remainingPrincipal + periodPrincipal;
            const finalInterestPayment = payment - finalPrincipalPayment;
            
            schedule.push({
                period: i,
                paymentDate: paymentDate,
                payment: periodPrincipal + finalInterestPayment,
                principal: finalPrincipalPayment,
                interest: finalInterestPayment,
                remainingPrincipal: 0,
                calculationExplanation: calculationExplanation
            });
        } else {
            schedule.push({
                period: i,
                paymentDate: paymentDate,
                payment: payment,
                principal: periodPrincipal,
                interest: interestPayment,
                remainingPrincipal: remainingPrincipal,
                calculationExplanation: calculationExplanation
            });
        }
    }
    
    // 计算总还款额和总利息
    let totalPayment = 0;
    schedule.forEach(item => {
        totalPayment += item.payment;
    });
    const totalInterest = totalPayment - principal;
    
    // 首期还款额
    const firstPeriodPayment = schedule[0].payment;
    
    return {
        method: '等额本金',
        firstPeriodPayment: firstPeriodPayment,
        totalPayment: totalPayment,
        totalInterest: totalInterest,
        schedule: schedule,
        frequency: frequency
    };
}

/**
 * 计算到期还本付息
 * 公式：到期还款额 = 贷款本金×(1+月利率×还款月数)
 * @param {number} principal - 贷款本金
 * @param {number} termInMonths - 贷款期限（月）
 * @param {number} monthlyRate - 月利率
 * @param {string} firstPaymentDate - 首次还款日期
 * @returns {Object} 计算结果
 */
function calculateInterestAtMaturity(principal, termInMonths, monthlyRate, firstPaymentDate) {
    const schedule = [];
    
    // 到期还款额
    const maturityPayment = principal * (1 + monthlyRate * termInMonths);
    
    // 总利息
    const totalInterest = maturityPayment - principal;
    
    // 计算到期日期
    const firstDate = new Date(firstPaymentDate);
    const maturityDate = new Date(firstDate);
    maturityDate.setMonth(firstDate.getMonth() + termInMonths);
    
    // 计算方式说明
    const calculationExplanation = {
        payment: `到期还款额 = 贷款本金×(1+月利率×还款月数) = ${formatCurrency(principal)}×(1+${(monthlyRate * 100).toFixed(4)}%×${termInMonths}) = ${formatCurrency(maturityPayment)}`,
        interest: `总利息 = 贷款本金×月利率×还款月数 = ${formatCurrency(principal)}×${(monthlyRate * 100).toFixed(4)}%×${termInMonths} = ${formatCurrency(totalInterest)}`,
        principal: `本金 = 贷款本金 = ${formatCurrency(principal)}`,
        remainingPrincipal: `剩余本金 = 0`
    };
    
    // 生成还款计划（仅一期）
    schedule.push({
        period: 1,
        paymentDate: formatDate(maturityDate),
        payment: maturityPayment,
        principal: principal,
        interest: totalInterest,
        remainingPrincipal: 0,
        calculationExplanation: calculationExplanation
    });
    
    return {
        method: '到期还本付息',
        maturityPayment: maturityPayment,
        totalPayment: maturityPayment,
        totalInterest: totalInterest,
        schedule: schedule,
        maturityDate: formatDate(maturityDate)
    };
}

/**
 * 计算按日计息随借随还
 * 公式：利息 = 提款金额×日利率×提款天数
 * @param {number} principal - 贷款本金
 * @param {number} withdrawalAmount - 提款金额
 * @param {number} withdrawalDays - 提款天数
 * @param {number} dailyRate - 日利率
 * @returns {Object} 计算结果
 */
function calculateDailyInterest(principal, withdrawalAmount, withdrawalDays, dailyRate) {
    console.log('开始计算按日计息，参数:', {principal, withdrawalAmount, withdrawalDays, dailyRate});
    const schedule = [];
    
    try {
        // 计算利息
        const interest = withdrawalAmount * dailyRate * withdrawalDays;
        console.log('计算的利息:', interest);
        
        // 还款总额
        const totalPayment = withdrawalAmount + interest;
        console.log('还款总额:', totalPayment);
        
        // 计算方式说明
        const calculationExplanation = {
            payment: `还款总额 = 提款金额 + 利息 = ${formatCurrency(withdrawalAmount)} + ${formatCurrency(interest)} = ${formatCurrency(totalPayment)}`,
            interest: `利息 = 提款金额×日利率×提款天数 = ${formatCurrency(withdrawalAmount)}×${(dailyRate * 100).toFixed(6)}%×${withdrawalDays} = ${formatCurrency(interest)}`,
            principal: `本金 = 提款金额 = ${formatCurrency(withdrawalAmount)}`,
            remainingPrincipal: `剩余本金 = 贷款本金 - 提款金额 = ${formatCurrency(principal)} - ${formatCurrency(withdrawalAmount)} = ${formatCurrency(principal - withdrawalAmount)}`
        };
        
        // 生成还款计划
        schedule.push({
            period: 1,
            paymentDate: '',
            payment: totalPayment,
            principal: withdrawalAmount,
            interest: interest,
            remainingPrincipal: principal - withdrawalAmount,
            calculationExplanation: calculationExplanation
        });
        
        const result = {
            method: '按日计息随借随还',
            totalPayment: totalPayment,
            totalInterest: interest,
            schedule: schedule,
            withdrawalDays: withdrawalDays
        };
        
        console.log('按日计息计算结果:', result);
        return result;
    } catch (error) {
        console.error('按日计息计算出错:', error);
        // 返回默认结果
        return {
            method: '按日计息随借随还',
            totalPayment: withdrawalAmount,
            totalInterest: 0,
            schedule: [{
                period: 1,
                paymentDate: '',
                payment: withdrawalAmount,
                principal: withdrawalAmount,
                interest: 0,
                remainingPrincipal: principal - withdrawalAmount,
                calculationExplanation: {
                    payment: '计算出错',
                    interest: '计算出错',
                    principal: '计算出错',
                    remainingPrincipal: '计算出错'
                }
            }],
            withdrawalDays: withdrawalDays
        };
    }
}

/**
 * 计算先息后本还款
 * 公式：每期利息 = 贷款本金×期利率，到期本金 = 贷款本金
 * @param {number} principal - 贷款本金
 * @param {number} termInMonths - 贷款期限（月）
 * @param {number} monthlyRate - 月利率
 * @param {Array} paymentDates - 还款日期列表
 * @param {string} interestFrequency - 利息支付频率
 * @param {string} firstPaymentDate - 首次还款日期
 * @returns {Object} 计算结果
 */
function calculateInterestFirst(principal, termInMonths, monthlyRate, paymentDates, interestFrequency, firstPaymentDate) {
    const schedule = [];
    let remainingPrincipal = principal;
    
    // 根据利息支付频率调整利率和期数
    let periodRate = monthlyRate;
    let interestTerms = 0;
    
    switch (interestFrequency) {
        case 'monthly':
            periodRate = monthlyRate;
            interestTerms = termInMonths;
            break;
        case 'quarterly':
            periodRate = monthlyRate * 3;
            interestTerms = Math.ceil(termInMonths / 3);
            break;
        case 'semi-annually':
            periodRate = monthlyRate * 6;
            interestTerms = Math.ceil(termInMonths / 6);
            break;
        case 'annually':
            periodRate = monthlyRate * 12;
            interestTerms = Math.ceil(termInMonths / 12);
            break;
    }
    
    // 每期利息
    const periodInterest = principal * periodRate;
    
    // 计算每期还款明细（仅支付利息）
    for (let i = 1; i <= interestTerms; i++) {
        // 获取还款日期
        const paymentDate = paymentDates[i - 1] ? formatDate(paymentDates[i - 1]) : '';
        
        // 计算方式说明
        const calculationExplanation = {
            payment: `每期还款额 = 贷款本金×期利率 = ${formatCurrency(principal)}×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(periodInterest)}`,
            interest: `本期利息 = 贷款本金×期利率 = ${formatCurrency(principal)}×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(periodInterest)}`,
            principal: `本期本金 = 0`,
            remainingPrincipal: `剩余本金 = 贷款本金 = ${formatCurrency(principal)}`
        };
        
        schedule.push({
            period: i,
            paymentDate: paymentDate,
            payment: periodInterest,
            principal: 0,
            interest: periodInterest,
            remainingPrincipal: remainingPrincipal,
            calculationExplanation: calculationExplanation
        });
    }
    
    // 到期还款（本金+最后一期利息）
    const maturityDate = new Date(firstPaymentDate);
    maturityDate.setMonth(maturityDate.getMonth() + termInMonths);
    
    // 最后一期计算方式说明
    const finalCalculationExplanation = {
        payment: `到期还款额 = 贷款本金 + 最后一期利息 = ${formatCurrency(principal)} + ${formatCurrency(periodInterest)} = ${formatCurrency(principal + periodInterest)}`,
        interest: `最后一期利息 = 贷款本金×期利率 = ${formatCurrency(principal)}×${(periodRate * 100).toFixed(4)}% = ${formatCurrency(periodInterest)}`,
        principal: `本金 = 贷款本金 = ${formatCurrency(principal)}`,
        remainingPrincipal: `剩余本金 = 0`
    };
    
    // 添加到期还款计划
    schedule.push({
        period: interestTerms + 1,
        paymentDate: formatDate(maturityDate),
        payment: principal + periodInterest,
        principal: principal,
        interest: periodInterest,
        remainingPrincipal: 0,
        calculationExplanation: finalCalculationExplanation
    });
    
    // 计算总还款额和总利息
    const totalInterest = periodInterest * (interestTerms + 1);
    const totalPayment = principal + totalInterest;
    
    return {
        method: '先息后本',
        periodInterest: periodInterest,
        maturityPayment: principal + periodInterest,
        totalPayment: totalPayment,
        totalInterest: totalInterest,
        schedule: schedule,
        interestFrequency: interestFrequency,
        maturityDate: formatDate(maturityDate)
    };
}

/**
 * 更新结果UI
 */
function updateResultsUI() {
    // 更新摘要
    updateSummary();
    
    // 更新详细还款计划
    updateDetailedResults();
}

/**
 * 更新摘要
 */
function updateSummary() {
    const summaryContainer = document.getElementById('summary-container');
    summaryContainer.innerHTML = '';
    
    // 如果没有计算结果，显示提示信息
    if (Object.keys(calculationResults).length === 0) {
        summaryContainer.innerHTML = '<div class="col-span-full text-center py-4 text-gray-500">请选择还款方式并点击计算按钮</div>';
        return;
    }
    
    // 获取当前选中的还款方式结果
    const result = Object.values(calculationResults)[0];
    
    // 创建摘要卡片
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200 col-span-full';
    
    // 还款方式标题
    const title = document.createElement('h3');
    title.className = 'font-medium text-primary mb-4 text-lg';
    title.textContent = result.method + ' - 还款计划摘要';
    card.appendChild(title);
    
    // 创建网格布局
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
    
    // 根据还款方式显示不同的摘要信息
    if (result.method === '等额本息') {
        // 每期还款额
        grid.appendChild(createSummaryItem('每期还款额', formatCurrency(result.periodPayment), getFrequencyText(result.frequency)));
        
        // 还款期数
        grid.appendChild(createSummaryItem('还款期数', result.schedule.length + ' ' + getPeriodUnitText(result.frequency)));
        
        // 总利息
        grid.appendChild(createSummaryItem('总利息', formatCurrency(result.totalInterest)));
        
        // 总还款额
        grid.appendChild(createSummaryItem('总还款额', formatCurrency(result.totalPayment)));
    } else if (result.method === '等额本金') {
        // 首期还款额
        grid.appendChild(createSummaryItem('首期还款额', formatCurrency(result.firstPeriodPayment), getFrequencyText(result.frequency)));
        
        // 末期还款额
        grid.appendChild(createSummaryItem('末期还款额', formatCurrency(result.schedule[result.schedule.length - 1].payment), getFrequencyText(result.frequency)));
        
        // 总利息
        grid.appendChild(createSummaryItem('总利息', formatCurrency(result.totalInterest)));
        
        // 总还款额
        grid.appendChild(createSummaryItem('总还款额', formatCurrency(result.totalPayment)));
    } else if (result.method === '到期还本付息') {
        // 到期还款额
        grid.appendChild(createSummaryItem('到期还款额', formatCurrency(result.maturityPayment)));
        
        // 到期日期
        grid.appendChild(createSummaryItem('到期日期', result.maturityDate));
        
        // 总利息
        grid.appendChild(createSummaryItem('总利息', formatCurrency(result.totalInterest)));
        
        // 总还款额
        grid.appendChild(createSummaryItem('总还款额', formatCurrency(result.totalPayment)));
    } else if (result.method === '按日计息随借随还') {
        // 提款金额
        grid.appendChild(createSummaryItem('提款金额', formatCurrency(loanData.withdrawalAmount)));
        
        // 提款天数
        grid.appendChild(createSummaryItem('提款天数', result.withdrawalDays + ' 天'));
        
        // 利息
        grid.appendChild(createSummaryItem('利息', formatCurrency(result.totalInterest)));
        
        // 还款总额
        grid.appendChild(createSummaryItem('还款总额', formatCurrency(result.totalPayment)));
    } else if (result.method === '先息后本') {
        // 每期利息
        grid.appendChild(createSummaryItem('每期利息', formatCurrency(result.periodInterest), getFrequencyText(result.interestFrequency)));
        
        // 到期还款额
        grid.appendChild(createSummaryItem('到期还款额', formatCurrency(result.maturityPayment)));
        
        // 到期日期
        grid.appendChild(createSummaryItem('到期日期', result.maturityDate));
        
        // 总利息
        grid.appendChild(createSummaryItem('总利息', formatCurrency(result.totalInterest)));
        
        // 总还款额
        grid.appendChild(createSummaryItem('总还款额', formatCurrency(result.totalPayment)));
    }
    
    card.appendChild(grid);
    summaryContainer.appendChild(card);
}

/**
 * 创建摘要项目
 * @param {string} label - 标签
 * @param {string} value - 值
 * @param {string} unit - 单位（可选）
 * @returns {HTMLElement} 摘要项目元素
 */
function createSummaryItem(label, value, unit = '') {
    const item = document.createElement('div');
    item.className = 'space-y-1';
    
    const labelElement = document.createElement('div');
    labelElement.className = 'text-xs text-gray-500';
    labelElement.textContent = label;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'text-lg font-semibold';
    valueElement.textContent = value;
    
    if (unit) {
        const unitElement = document.createElement('span');
        unitElement.className = 'text-sm font-normal text-gray-500 ml-1';
        unitElement.textContent = unit;
        valueElement.appendChild(unitElement);
    }
    
    item.appendChild(labelElement);
    item.appendChild(valueElement);
    
    return item;
}

/**
 * 获取频率文本
 * @param {string} frequency - 频率
 * @returns {string} 频率文本
 */
function getFrequencyText(frequency) {
    switch (frequency) {
        case 'monthly':
            return '每月';
        case 'quarterly':
            return '每季度';
        case 'semi-annually':
            return '每半年';
        case 'annually':
            return '每年';
        default:
            return '';
    }
}

/**
 * 获取期数单位文本
 * @param {string} frequency - 频率
 * @returns {string} 期数单位文本
 */
function getPeriodUnitText(frequency) {
    switch (frequency) {
        case 'monthly':
            return '期';
        case 'quarterly':
            return '季度';
        case 'semi-annually':
            return '半年';
        case 'annually':
            return '年';
        default:
            return '期';
    }
}

/**
 * 更新计算方式说明
 */
function updateCalculationMethodExplanation() {
    const explanationContainer = document.getElementById('calculation-method-explanation');
    explanationContainer.innerHTML = '';
    
    // 如果没有计算结果，显示提示信息
    if (Object.keys(calculationResults).length === 0) {
        explanationContainer.innerHTML = '<p class="text-center text-gray-500">请选择还款方式并点击计算按钮查看计算方式说明</p>';
        return;
    }
    
    // 获取当前选中的还款方式结果
    const result = Object.values(calculationResults)[0];
    
    // 创建说明标题
    const title = document.createElement('h3');
    title.className = 'font-medium text-primary mb-2 text-lg';
    title.textContent = result.method + ' - 计算方式说明';
    explanationContainer.appendChild(title);
    
    // 创建说明内容
    const content = document.createElement('div');
    content.className = 'space-y-4';
    
    // 根据还款方式显示不同的计算方式说明
    if (result.method === '等额本息') {
        content.innerHTML = `
            <p>等额本息是指每期还款金额相同，前期还款中利息占比较大，本金占比较小，适合收入稳定的借款人。</p>
            <div class="bg-gray-50 p-4 rounded-md">
                <h4 class="font-medium mb-2">计算公式：</h4>
                <p class="mb-2">每期还款额 = 贷款本金×期利率×(1+期利率)^还款期数/[(1+期利率)^还款期数-1]</p>
                <p class="mb-2">本期利息 = 剩余本金×期利率</p>
                <p>本期本金 = 每期还款额 - 本期利息</p>
            </div>
            <p>在等额本息还款方式下，每期还款金额相同，但每期还款中本金和利息的比例不同。初期还款中，利息占比较大，本金占比较小；随着还款期数增加，利息占比逐渐减少，本金占比逐渐增加。</p>
        `;
    } else if (result.method === '等额本金') {
        content.innerHTML = `
            <p>等额本金是指每期还款本金相同，利息逐月递减，总利息较等额本息少，但前期还款压力较大。</p>
            <div class="bg-gray-50 p-4 rounded-md">
                <h4 class="font-medium mb-2">计算公式：</h4>
                <p class="mb-2">每期还款额 = (贷款本金/还款期数) + (贷款本金-已还本金累计额)×期利率</p>
                <p class="mb-2">本期利息 = 剩余本金×期利率</p>
                <p>本期本金 = 贷款本金/还款期数</p>
            </div>
            <p>在等额本金还款方式下，每期还款本金相同，利息逐月递减，因此每期还款总额呈递减趋势。相比等额本息，等额本金的总利息较少，但前期还款压力较大。</p>
        `;
    } else if (result.method === '到期还本付息') {
        content.innerHTML = `
            <p>到期还本付息是指贷款期满后一次性归还本金和利息，适合短期贷款或有一次性还款能力的客户。</p>
            <div class="bg-gray-50 p-4 rounded-md">
                <h4 class="font-medium mb-2">计算公式：</h4>
                <p class="mb-2">到期还款额 = 贷款本金×(1+月利率×还款月数)</p>
                <p>总利息 = 贷款本金×月利率×还款月数</p>
            </div>
            <p>到期还本付息方式下，借款人在贷款期间不需要还款，到期时一次性归还全部本金和利息。这种方式适合短期贷款或有一次性还款能力的客户。</p>
        `;
    } else if (result.method === '按日计息随借随还') {
        content.innerHTML = `
            <p>按日计息随借随还是指根据实际使用天数计算利息，可随时还款，适合资金使用灵活的客户。</p>
            <div class="bg-gray-50 p-4 rounded-md">
                <h4 class="font-medium mb-2">计算公式：</h4>
                <p class="mb-2">利息 = 提款金额×日利率×提款天数</p>
                <p>还款总额 = 提款金额 + 利息</p>
            </div>
            <p>按日计息随借随还方式下，利息按实际使用天数计算，不使用不产生利息，适合资金使用灵活的客户。</p>
        `;
    } else if (result.method === '先息后本') {
        content.innerHTML = `
            <p>先息后本是指每期仅支付利息，到期一次性归还本金，适合短期贷款或有特定还款计划的客户。</p>
            <div class="bg-gray-50 p-4 rounded-md">
                <h4 class="font-medium mb-2">计算公式：</h4>
                <p class="mb-2">每期利息 = 贷款本金×期利率</p>
                <p class="mb-2">到期还款额 = 贷款本金 + 最后一期利息</p>
                <p>总利息 = 每期利息×支付期数</p>
            </div>
            <p>先息后本方式下，每期仅需支付利息，到期时一次性归还本金，前期还款压力较小，但到期时需要一次性归还较大金额的本金。</p>
        `;
    }
    
    // 添加查看详情按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'mt-4 text-center';
    
    const detailButton = document.createElement('button');
    detailButton.className = 'bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md inline-flex items-center';
    detailButton.innerHTML = '<i class="fa fa-info-circle mr-2"></i> 查看计算详情';
    detailButton.addEventListener('click', function() {
        showCalculationDetailModal(result);
    });
    
    buttonContainer.appendChild(detailButton);
    content.appendChild(buttonContainer);
    
    explanationContainer.appendChild(content);
}

/**
 * 显示计算方式详情模态框
 * @param {Object} result - 计算结果
 */
function showCalculationDetailModal(result) {
    const modal = document.getElementById('calculation-detail-modal');
    const title = document.getElementById('calculation-detail-title');
    const content = document.getElementById('calculation-detail-content');
    
    // 设置标题
    title.textContent = result.method + ' - 计算详情';
    
    // 清空内容
    content.innerHTML = '';
    
    // 根据还款方式显示不同的计算详情
    if (result.method === '等额本息' || result.method === '等额本金') {
        // 显示前几期的详细计算过程
        const schedulePreview = result.schedule.slice(0, 3);
        
        schedulePreview.forEach((item, index) => {
            const periodContainer = document.createElement('div');
            periodContainer.className = 'mb-6';
            
            const periodTitle = document.createElement('h4');
            periodTitle.className = 'font-medium text-primary mb-2';
            periodTitle.textContent = `${getFrequencyText(result.frequency)}第${item.period}期 (${item.paymentDate})`;
            periodContainer.appendChild(periodTitle);
            
            const calculationTable = document.createElement('table');
            calculationTable.className = 'w-full text-sm';
            
            const thead = document.createElement('thead');
            thead.className = 'bg-gray-50';
            thead.innerHTML = `
                <tr>
                    <th class="px-4 py-2 text-left">项目</th>
                    <th class="px-4 py-2 text-right">金额</th>
                    <th class="px-4 py-2 text-left">计算过程</th>
                </tr>
            `;
            calculationTable.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            
            // 还款总额
            const paymentRow = document.createElement('tr');
            paymentRow.className = 'border-b';
            paymentRow.innerHTML = `
                <td class="px-4 py-2">还款总额</td>
                <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
            `;
            tbody.appendChild(paymentRow);
            
            // 本金
            const principalRow = document.createElement('tr');
            principalRow.className = 'border-b';
            principalRow.innerHTML = `
                <td class="px-4 py-2">本金</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
            `;
            tbody.appendChild(principalRow);
            
            // 利息
            const interestRow = document.createElement('tr');
            interestRow.className = 'border-b';
            interestRow.innerHTML = `
                <td class="px-4 py-2">利息</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
            `;
            tbody.appendChild(interestRow);
            
            // 剩余本金
            const remainingRow = document.createElement('tr');
            remainingRow.innerHTML = `
                <td class="px-4 py-2">剩余本金</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
            `;
            tbody.appendChild(remainingRow);
            
            calculationTable.appendChild(tbody);
            periodContainer.appendChild(calculationTable);
            
            content.appendChild(periodContainer);
        });
        
        // 如果期数超过3期，显示省略提示
        if (result.schedule.length > 3) {
            const ellipsis = document.createElement('div');
            ellipsis.className = 'text-center text-gray-500 my-4';
            ellipsis.textContent = `... 省略中间${result.schedule.length - 6}期 ...`;
            content.appendChild(ellipsis);
            
            // 显示最后几期
            const lastSchedule = result.schedule.slice(-3);
            lastSchedule.forEach((item, index) => {
                const periodContainer = document.createElement('div');
                periodContainer.className = 'mb-6';
                
                const periodTitle = document.createElement('h4');
                periodTitle.className = 'font-medium text-primary mb-2';
                periodTitle.textContent = `${getFrequencyText(result.frequency)}第${item.period}期 (${item.paymentDate})`;
                periodContainer.appendChild(periodTitle);
                
                const calculationTable = document.createElement('table');
                calculationTable.className = 'w-full text-sm';
                
                const thead = document.createElement('thead');
                thead.className = 'bg-gray-50';
                thead.innerHTML = `
                    <tr>
                        <th class="px-4 py-2 text-left">项目</th>
                        <th class="px-4 py-2 text-right">金额</th>
                        <th class="px-4 py-2 text-left">计算过程</th>
                    </tr>
                `;
                calculationTable.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                
                // 还款总额
                const paymentRow = document.createElement('tr');
                paymentRow.className = 'border-b';
                paymentRow.innerHTML = `
                    <td class="px-4 py-2">还款总额</td>
                    <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
                `;
                tbody.appendChild(paymentRow);
                
                // 本金
                const principalRow = document.createElement('tr');
                principalRow.className = 'border-b';
                principalRow.innerHTML = `
                    <td class="px-4 py-2">本金</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
                `;
                tbody.appendChild(principalRow);
                
                // 利息
                const interestRow = document.createElement('tr');
                interestRow.className = 'border-b';
                interestRow.innerHTML = `
                    <td class="px-4 py-2">利息</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
                `;
                tbody.appendChild(interestRow);
                
                // 剩余本金
                const remainingRow = document.createElement('tr');
                remainingRow.innerHTML = `
                    <td class="px-4 py-2">剩余本金</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
                `;
                tbody.appendChild(remainingRow);
                
                calculationTable.appendChild(tbody);
                periodContainer.appendChild(calculationTable);
                
                content.appendChild(periodContainer);
            });
        }
    } else if (result.method === '到期还本付息' || result.method === '按日计息随借随还') {
        // 只有一期的还款方式
        const item = result.schedule[0];
        
        const calculationTable = document.createElement('table');
        calculationTable.className = 'w-full text-sm';
        
        const thead = document.createElement('thead');
        thead.className = 'bg-gray-50';
        thead.innerHTML = `
            <tr>
                <th class="px-4 py-2 text-left">项目</th>
                <th class="px-4 py-2 text-right">金额</th>
                <th class="px-4 py-2 text-left">计算过程</th>
            </tr>
        `;
        calculationTable.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        // 还款总额
        const paymentRow = document.createElement('tr');
        paymentRow.className = 'border-b';
        paymentRow.innerHTML = `
            <td class="px-4 py-2">还款总额</td>
            <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
            <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
        `;
        tbody.appendChild(paymentRow);
        
        // 本金
        const principalRow = document.createElement('tr');
        principalRow.className = 'border-b';
        principalRow.innerHTML = `
            <td class="px-4 py-2">本金</td>
            <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
            <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
        `;
        tbody.appendChild(principalRow);
        
        // 利息
        const interestRow = document.createElement('tr');
        interestRow.className = 'border-b';
        interestRow.innerHTML = `
            <td class="px-4 py-2">利息</td>
            <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
            <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
        `;
        tbody.appendChild(interestRow);
        
        // 剩余本金
        const remainingRow = document.createElement('tr');
        remainingRow.innerHTML = `
            <td class="px-4 py-2">剩余本金</td>
            <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
            <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
        `;
        tbody.appendChild(remainingRow);
        
        calculationTable.appendChild(tbody);
        content.appendChild(calculationTable);
    } else if (result.method === '先息后本') {
        // 显示前几期的利息支付
        const interestSchedule = result.schedule.slice(0, -1); // 不包括最后一期
        const lastItem = result.schedule[result.schedule.length - 1]; // 最后一期（本金+利息）
        
        // 显示前几期利息支付
        interestSchedule.slice(0, 2).forEach((item, index) => {
            const periodContainer = document.createElement('div');
            periodContainer.className = 'mb-6';
            
            const periodTitle = document.createElement('h4');
            periodTitle.className = 'font-medium text-primary mb-2';
            periodTitle.textContent = `利息支付第${item.period}期 (${item.paymentDate})`;
            periodContainer.appendChild(periodTitle);
            
            const calculationTable = document.createElement('table');
            calculationTable.className = 'w-full text-sm';
            
            const thead = document.createElement('thead');
            thead.className = 'bg-gray-50';
            thead.innerHTML = `
                <tr>
                    <th class="px-4 py-2 text-left">项目</th>
                    <th class="px-4 py-2 text-right">金额</th>
                    <th class="px-4 py-2 text-left">计算过程</th>
                </tr>
            `;
            calculationTable.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            
            // 还款总额
            const paymentRow = document.createElement('tr');
            paymentRow.className = 'border-b';
            paymentRow.innerHTML = `
                <td class="px-4 py-2">还款总额</td>
                <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
            `;
            tbody.appendChild(paymentRow);
            
            // 本金
            const principalRow = document.createElement('tr');
            principalRow.className = 'border-b';
            principalRow.innerHTML = `
                <td class="px-4 py-2">本金</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
            `;
            tbody.appendChild(principalRow);
            
            // 利息
            const interestRow = document.createElement('tr');
            interestRow.className = 'border-b';
            interestRow.innerHTML = `
                <td class="px-4 py-2">利息</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
            `;
            tbody.appendChild(interestRow);
            
            // 剩余本金
            const remainingRow = document.createElement('tr');
            remainingRow.innerHTML = `
                <td class="px-4 py-2">剩余本金</td>
                <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
                <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
            `;
            tbody.appendChild(remainingRow);
            
            calculationTable.appendChild(tbody);
            periodContainer.appendChild(calculationTable);
            
            content.appendChild(periodContainer);
        });
        
        // 如果利息支付期数超过2期，显示省略提示
        if (interestSchedule.length > 2) {
            const ellipsis = document.createElement('div');
            ellipsis.className = 'text-center text-gray-500 my-4';
            ellipsis.textContent = `... 省略中间${interestSchedule.length - 4}期利息支付 ...`;
            content.appendChild(ellipsis);
            
            // 显示最后几期利息支付
            interestSchedule.slice(-2).forEach((item, index) => {
                const periodContainer = document.createElement('div');
                periodContainer.className = 'mb-6';
                
                const periodTitle = document.createElement('h4');
                periodTitle.className = 'font-medium text-primary mb-2';
                periodTitle.textContent = `利息支付第${item.period}期 (${item.paymentDate})`;
                periodContainer.appendChild(periodTitle);
                
                const calculationTable = document.createElement('table');
                calculationTable.className = 'w-full text-sm';
                
                const thead = document.createElement('thead');
                thead.className = 'bg-gray-50';
                thead.innerHTML = `
                    <tr>
                        <th class="px-4 py-2 text-left">项目</th>
                        <th class="px-4 py-2 text-right">金额</th>
                        <th class="px-4 py-2 text-left">计算过程</th>
                    </tr>
                `;
                calculationTable.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                
                // 还款总额
                const paymentRow = document.createElement('tr');
                paymentRow.className = 'border-b';
                paymentRow.innerHTML = `
                    <td class="px-4 py-2">还款总额</td>
                    <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
                `;
                tbody.appendChild(paymentRow);
                
                // 本金
                const principalRow = document.createElement('tr');
                principalRow.className = 'border-b';
                principalRow.innerHTML = `
                    <td class="px-4 py-2">本金</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
                `;
                tbody.appendChild(principalRow);
                
                // 利息
                const interestRow = document.createElement('tr');
                interestRow.className = 'border-b';
                interestRow.innerHTML = `
                    <td class="px-4 py-2">利息</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
                `;
                tbody.appendChild(interestRow);
                
                // 剩余本金
                const remainingRow = document.createElement('tr');
                remainingRow.innerHTML = `
                    <td class="px-4 py-2">剩余本金</td>
                    <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
                    <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
                `;
                tbody.appendChild(remainingRow);
                
                calculationTable.appendChild(tbody);
                periodContainer.appendChild(calculationTable);
                
                content.appendChild(periodContainer);
            });
        }
        
        // 显示到期还款（本金+利息）
        const maturityContainer = document.createElement('div');
        maturityContainer.className = 'mb-6';
        
        const maturityTitle = document.createElement('h4');
        maturityTitle.className = 'font-medium text-primary mb-2';
        maturityTitle.textContent = `到期还款 (${lastItem.paymentDate})`;
        maturityContainer.appendChild(maturityTitle);
        
        const maturityTable = document.createElement('table');
        maturityTable.className = 'w-full text-sm';
        
        const maturityThead = document.createElement('thead');
        maturityThead.className = 'bg-gray-50';
        maturityThead.innerHTML = `
            <tr>
                <th class="px-4 py-2 text-left">项目</th>
                <th class="px-4 py-2 text-right">金额</th>
                <th class="px-4 py-2 text-left">计算过程</th>
            </tr>
        `;
        maturityTable.appendChild(maturityThead);
        
        const maturityTbody = document.createElement('tbody');
        
        // 还款总额
        const maturityPaymentRow = document.createElement('tr');
        maturityPaymentRow.className = 'border-b';
        maturityPaymentRow.innerHTML = `
            <td class="px-4 py-2">还款总额</td>
            <td class="px-4 py-2 text-right font-medium">${formatCurrency(lastItem.payment)}</td>
            <td class="px-4 py-2 text-gray-600">${lastItem.calculationExplanation.payment}</td>
        `;
        maturityTbody.appendChild(maturityPaymentRow);
        
        // 本金
        const maturityPrincipalRow = document.createElement('tr');
        maturityPrincipalRow.className = 'border-b';
        maturityPrincipalRow.innerHTML = `
            <td class="px-4 py-2">本金</td>
            <td class="px-4 py-2 text-right">${formatCurrency(lastItem.principal)}</td>
            <td class="px-4 py-2 text-gray-600">${lastItem.calculationExplanation.principal}</td>
        `;
        maturityTbody.appendChild(maturityPrincipalRow);
        
        // 利息
        const maturityInterestRow = document.createElement('tr');
        maturityInterestRow.className = 'border-b';
        maturityInterestRow.innerHTML = `
            <td class="px-4 py-2">利息</td>
            <td class="px-4 py-2 text-right">${formatCurrency(lastItem.interest)}</td>
            <td class="px-4 py-2 text-gray-600">${lastItem.calculationExplanation.interest}</td>
        `;
        maturityTbody.appendChild(maturityInterestRow);
        
        // 剩余本金
        const maturityRemainingRow = document.createElement('tr');
        maturityRemainingRow.innerHTML = `
            <td class="px-4 py-2">剩余本金</td>
            <td class="px-4 py-2 text-right">${formatCurrency(lastItem.remainingPrincipal)}</td>
            <td class="px-4 py-2 text-gray-600">${lastItem.calculationExplanation.remainingPrincipal}</td>
        `;
        maturityTbody.appendChild(maturityRemainingRow);
        
        maturityTable.appendChild(maturityTbody);
        maturityContainer.appendChild(maturityTable);
        
        content.appendChild(maturityContainer);
    }
    
    // 显示模态框
    modal.classList.remove('hidden');
}

/**
 * 隐藏计算方式详情模态框
 */
function hideCalculationDetailModal() {
    document.getElementById('calculation-detail-modal').classList.add('hidden');
}

/**
 * 更新详细还款计划
 */
function updateDetailedResults() {
    console.log('开始更新详细还款计划');
    const detailedResultsContainer = document.getElementById('detailed-results');
    if (!detailedResultsContainer) {
        console.error('未找到detailed-results元素');
        return;
    }
    detailedResultsContainer.innerHTML = '';
    
    // 如果没有计算结果，显示提示信息
    if (Object.keys(calculationResults).length === 0) {
        detailedResultsContainer.innerHTML = '<div class="text-center py-8 text-gray-500">请选择还款方式并点击计算按钮</div>';
        return;
    }
    
    // 获取当前选中的还款方式结果
    const result = Object.values(calculationResults)[0];
    
    // 创建还款计划卡片
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-card overflow-hidden';
    
    // 卡片头部
    const cardHeader = document.createElement('div');
    cardHeader.className = 'bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer';
    cardHeader.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 flex items-center">
            <i class="fa fa-table mr-2 text-primary"></i>
            ${result.method} - 详细还款计划
        </h3>
        <button class="toggle-table text-primary hover:text-primary/80">
            <i class="fa fa-chevron-down"></i>
        </button>
    `;
    
    // 表格容器
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container overflow-x-auto';
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'w-full text-sm text-left text-gray-700';
    
    // 表头
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50 text-xs uppercase tracking-wider';
    
    // 根据还款方式调整表头
    let theadHTML = `
        <tr>
            <th class="px-4 py-3">期数</th>
            <th class="px-4 py-3">还款日期</th>
            <th class="px-4 py-3">还款金额</th>
            <th class="px-4 py-3">本金</th>
            <th class="px-4 py-3">利息</th>
            <th class="px-4 py-3">剩余本金</th>
            <th class="px-4 py-3">操作</th>
        </tr>
    `;
    thead.innerHTML = theadHTML;
    table.appendChild(thead);
    
    // 表体
    const tbody = document.createElement('tbody');
    
    // 添加还款计划数据
    result.schedule.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        
        // 还款日期显示
        let paymentDateDisplay = item.paymentDate || '-';
        
        // 为到期还本付息和先息后本的最后一期添加特殊标记
        let rowClass = '';
        if ((result.method === '到期还本付息' && item.period === result.schedule.length) ||
            (result.method === '先息后本' && item.period === result.schedule.length)) {
            rowClass = 'bg-blue-50';
        }
        
        row.className = `border-b hover:bg-gray-50 ${rowClass}`;
        
        row.innerHTML = `
            <td class="px-4 py-3">${item.period}</td>
            <td class="px-4 py-3">${paymentDateDisplay}</td>
            <td class="px-4 py-3 font-medium">${formatCurrency(item.payment)}</td>
            <td class="px-4 py-3">${formatCurrency(item.principal)}</td>
            <td class="px-4 py-3">${formatCurrency(item.interest)}</td>
            <td class="px-4 py-3">${formatCurrency(item.remainingPrincipal)}</td>
            <td class="px-4 py-3">
                <button class="text-primary hover:text-primary/80 text-sm view-calculation" data-period="${item.period}">
                    <i class="fa fa-calculator mr-1"></i> 查看计算
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // 将头部和表格添加到卡片
    card.appendChild(cardHeader);
    card.appendChild(tableContainer);
    
    // 添加到容器
    detailedResultsContainer.appendChild(card);
    
    // 绑定表格展开/折叠事件
    cardHeader.addEventListener('click', function() {
        tableContainer.classList.toggle('expanded');
        const icon = this.querySelector('.toggle-table i');
        if (tableContainer.classList.contains('expanded')) {
            icon.className = 'fa fa-chevron-up';
        } else {
            icon.className = 'fa fa-chevron-down';
        }
    });
    
    // 绑定查看计算按钮事件
    table.querySelectorAll('.view-calculation').forEach(button => {
        button.addEventListener('click', function() {
            const period = parseInt(this.getAttribute('data-period'));
            const item = result.schedule.find(s => s.period === period);
            
            if (item) {
                showPeriodCalculationDetail(item, result.method);
            }
        });
    });
    
    // 默认展开表格
    tableContainer.classList.add('expanded');
    cardHeader.querySelector('.toggle-table i').className = 'fa fa-chevron-up';
}

/**
 * 显示单期计算详情
 * @param {Object} item - 还款计划项
 * @param {string} method - 还款方式
 */
function showPeriodCalculationDetail(item, method) {
    const modal = document.getElementById('calculation-detail-modal');
    const title = document.getElementById('calculation-detail-title');
    const content = document.getElementById('calculation-detail-content');
    
    // 设置标题
    title.textContent = `${method} - 第${item.period}期计算详情`;
    
    // 清空内容
    content.innerHTML = '';
    
    // 创建计算详情表格
    const calculationTable = document.createElement('table');
    calculationTable.className = 'w-full text-sm';
    
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    thead.innerHTML = `
        <tr>
            <th class="px-4 py-2 text-left">项目</th>
            <th class="px-4 py-2 text-right">金额</th>
            <th class="px-4 py-2 text-left">计算过程</th>
        </tr>
    `;
    calculationTable.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    // 还款总额
    const paymentRow = document.createElement('tr');
    paymentRow.className = 'border-b';
    paymentRow.innerHTML = `
        <td class="px-4 py-2">还款总额</td>
        <td class="px-4 py-2 text-right font-medium">${formatCurrency(item.payment)}</td>
        <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.payment}</td>
    `;
    tbody.appendChild(paymentRow);
    
    // 本金
    const principalRow = document.createElement('tr');
    principalRow.className = 'border-b';
    principalRow.innerHTML = `
        <td class="px-4 py-2">本金</td>
        <td class="px-4 py-2 text-right">${formatCurrency(item.principal)}</td>
        <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.principal}</td>
    `;
    tbody.appendChild(principalRow);
    
    // 利息
    const interestRow = document.createElement('tr');
    interestRow.className = 'border-b';
    interestRow.innerHTML = `
        <td class="px-4 py-2">利息</td>
        <td class="px-4 py-2 text-right">${formatCurrency(item.interest)}</td>
        <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.interest}</td>
    `;
    tbody.appendChild(interestRow);
    
    // 剩余本金
    const remainingRow = document.createElement('tr');
    remainingRow.innerHTML = `
        <td class="px-4 py-2">剩余本金</td>
        <td class="px-4 py-2 text-right">${formatCurrency(item.remainingPrincipal)}</td>
        <td class="px-4 py-2 text-gray-600">${item.calculationExplanation.remainingPrincipal}</td>
    `;
    tbody.appendChild(remainingRow);
    
    calculationTable.appendChild(tbody);
    content.appendChild(calculationTable);
    
    // 显示模态框
    modal.classList.remove('hidden');
}

/**
 * 重置表单
 */
function resetForm() {
    // 重置表单值
    document.getElementById('loan-amount').value = 100000;
    document.getElementById('amount-unit').value = 'yuan';
    document.getElementById('loan-term').value = 12;
    document.getElementById('term-unit').value = 'month';
    document.getElementById('annual-rate').value = 4.35;
    document.getElementById('withdrawal-amount').value = 50000;
    document.getElementById('withdrawal-days').value = 30;
    
    // 重置单选框
    document.querySelector('input[name="repayment-method"][value="equal-principal-interest"]').checked = true;
    loanData.repaymentMethod = 'equal-principal-interest';
    
    // 重置首次还款日期为下个月的今天
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const defaultDate = nextMonth.toISOString().split('T')[0];
    document.getElementById('first-payment-date').value = defaultDate;
    
    // 重置还款频率
    document.getElementById('payment-frequency').value = 'monthly';
    
    // 重置利息支付频率
    const interestPaymentFrequencyElem = document.getElementById('interest-payment-frequency');
    if (interestPaymentFrequencyElem) {
        interestPaymentFrequencyElem.value = 'monthly';
    }
    
    // 更新贷款数据
    updateLoanData();
    
    // 切换特殊参数显示
    toggleSpecialMethodParams();
    
    // 重新计算
    calculateLoan();
}

/**
 * 显示导出模态框
 */
function showExportModal() {
    document.getElementById('export-modal').classList.remove('hidden');
}

/**
 * 隐藏导出模态框
 */
function hideExportModal() {
    document.getElementById('export-modal').classList.add('hidden');
}

/**
 * 导出结果
 */
function exportResults() {
    // 获取选中的导出格式
    const format = document.querySelector('input[name="export-format"]:checked').value;
    
    // 获取选中的导出内容
    const contentOptions = [];
    document.querySelectorAll('input[name="export-content"]:checked').forEach(checkbox => {
        contentOptions.push(checkbox.value);
    });
    
    // 显示加载状态
    const confirmExportBtn = document.getElementById('confirm-export');
    const originalText = confirmExportBtn.innerHTML;
    confirmExportBtn.innerHTML = '<span class="loading mr-2"></span> 导出中...';
    confirmExportBtn.disabled = true;
    
    // 模拟导出延迟
    setTimeout(() => {
        // 根据选择的格式执行不同的导出逻辑
        if (format === 'excel') {
            alert('Excel导出功能正在开发中，敬请期待！');
        } else if (format === 'pdf') {
            alert('PDF导出功能正在开发中，敬请期待！');
        }
        
        // 恢复按钮状态
        confirmExportBtn.innerHTML = originalText;
        confirmExportBtn.disabled = false;
        
        // 隐藏模态框
        hideExportModal();
    }, 1000);
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串（YYYY-MM-DD）
 */
function formatDate(date) {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 格式化货币
 * @param {number} value - 金额
 * @returns {string} 格式化后的金额
 */
function formatCurrency(value) {
    return '¥ ' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * 格式化货币（简短形式）
 * @param {number} value - 金额
 * @returns {string} 格式化后的金额
 */
function formatCurrencyShort(value) {
    if (value >= 10000) {
        return '¥ ' + (value / 10000).toFixed(1) + '万';
    }
    return '¥ ' + value.toFixed(0);
}