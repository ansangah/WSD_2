export const durationToSeconds = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return Number(value) || 900;
  }
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
      return amount * 24 * 60 * 60;
    default:
      return 900;
  }
};
