const winnerVerificationTemplate = ({ name, month, year, prize, approved }) => {
  if (approved) {
    return `
      <h2>Congratulations, ${name || 'Winner'}!</h2>
      <p>Your winner submission for the draw of ${month || ''} ${year || ''} has been approved.</p>
      <p>Your prize amount is <strong>₹${prize}</strong>.</p>
      <p>You will be notified once the payout is completed.</p>
    `
  }

  return `
    <h2>Hello, ${name || 'User'}</h2>
    <p>Your winner submission for the draw of ${month || ''} ${year || ''} was rejected.</p>
    <p>Please review your proof submission and contact support if needed.</p>
  `
}

const payoutCompletedTemplate = ({ name, month, year, prize }) => {
  return `
    <h2>Hello, ${name || 'Winner'}</h2>
    <p>Your payout for the draw of ${month || ''} ${year || ''} has been marked as completed.</p>
    <p>Prize amount: <strong>₹${prize}</strong></p>
    <p>Thank you for participating in the platform.</p>
  `
}

const drawResultTemplate = ({ name, month, year, numbers, winnerRecord }) => {
  if (winnerRecord) {
    return `
      <h2>Congratulations, ${name || 'Player'}!</h2>
      <p>The draw results for <strong>${month} ${year}</strong> are now published.</p>
      <p>Winning numbers: <strong>${numbers.join(', ')}</strong></p>
      <p>You matched <strong>${winnerRecord.match_type}</strong> numbers.</p>
      <p>Your prize amount is <strong>₹${winnerRecord.prize}</strong>.</p>
      <p>Please log in to upload proof if required and track payout status.</p>
    `
  }

  return `
    <h2>Hello, ${name || 'Player'}</h2>
    <p>The draw results for <strong>${month} ${year}</strong> are now published.</p>
    <p>Winning numbers: <strong>${numbers.join(', ')}</strong></p>
    <p>You did not win this round, but you are still supporting meaningful charitable impact.</p>
    <p>Stay active for the next draw.</p>
  `
}

module.exports = {
  winnerVerificationTemplate,
  payoutCompletedTemplate,
  drawResultTemplate
}
