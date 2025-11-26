import dayjs from 'dayjs'
/**
 * 计算输入时间与今天的差距（按天/周/月分级显示）
 * @param {string|number|Date} inputTime - 输入时间（支持格式：'2025-11-01'、1761926400000、new Date()）
 * @returns {string} 差距描述（如："3 天前"、"2 周后"、"1 月前"、"今天"）
 */
export function getTimeDiffWithToday(inputTime) {
  // console.log('>>>>>>inputTime',inputTime);
  // 1. 解析输入时间（Day.js 自动兼容多种格式，失败则返回错误提示）
  const targetTime = dayjs(inputTime)
  if (!targetTime.isValid()) {
    return '无效的时间格式'
  }

  // 2. 获取今天（去除时分秒，仅比较日期）
  const today = dayjs().startOf('day')

  // 3. 计算核心差距（天数差、月数差）
  const dayDiff = targetTime.startOf('day').diff(today, 'day') // 正负表示未来/过去
  const absDayDiff = Math.abs(dayDiff) // 绝对值（仅用于判断分级）

  // 4. 分级判断逻辑
  if (absDayDiff === 0) {
    // 输入时间 = 今天
    return '今天'
  } else if (absDayDiff <= 7) {
    // ≤7 天：显示天数差
    return `${absDayDiff} 天${dayDiff > 0 ? '后' : '前'}`
  } else if (absDayDiff <= 30) {
    // 7~30 天：显示周数差（四舍五入，如 8 天≈1 周，15 天≈2 周）
    const weekDiff = Math.round(absDayDiff / 7)
    return `${weekDiff} 周${dayDiff > 0 ? '后' : '前'}`
  } else {
    // >30 天：显示月数差（Day.js 按自然月计算，更精准）
    const monthDiff = Math.round(targetTime.diff(today, 'month', true)) // true 表示返回小数
    return `${Math.abs(monthDiff)} 月${dayDiff > 0 ? '后' : '前'}`
  }
}