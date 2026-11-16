export type Workout = { ok: boolean; message: string; work: number; rest: number; rounds: number };

const words = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
const duration = '(?:\\d+:\\d{2}|\\d+(?:\\.\\d+)?\\s*(?:seconds?|secs?|s|minutes?|mins?|m)?)(?![\\w.])';
const workLabel = '(?:on|work|hard|fast|sprint)';
const restLabel = '(?:off|rest|easy|slow|jog|walk|recover|recovery|break)';
const hint = 'Didn\'t catch that — try "10 x 1 min hard, 30s easy"';

function seconds(text: string): number {
  if (text.includes(':')) {
    const [minutes, seconds] = text.split(':').map(Number);
    return seconds < 60 ? minutes * 60 + seconds : NaN;
  }
  return Number.parseFloat(text) * (/m/.test(text) ? 60 : 1);
}

export function parseWorkout(input: string): Workout {
  const fail = (message = hint): Workout => ({ ok: false, message, work: 0, rest: 0, rounds: 0 });
  let text = input.toLowerCase().trim();
  if (!text) return fail('Try "8 rounds of 40 on 20 off"');
  if (/\b(?:emom|amrap|ladder|pyramid|between|then)\b/.test(text)) return fail();
  text = text.replace(/\bhalf a minute\b/g, '30s').replace(/\ba minute\b/g, '60s');
  text = text.replace(new RegExp(`\\b(${words.join('|')})\\b`, 'g'), word => String(words.indexOf(word) + 1));
  const tabata = /\btabata\b/.test(text);
  text = text.replace(/\btabata\b/g, '');
  let rounds = tabata ? 8 : 0;
  let work = tabata ? 20 : 0;
  let rest = tabata ? 10 : 0;
  let total: number | undefined;
  let roundMentions = 0;
  text = text.replace(/\bfor\s+(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)\b/g, (_all, n) => {
    total = Number(n) * 60;
    return '';
  });
  text = text.replace(/\b(\d+)\s*(?:rounds?|times|sets?|reps?|intervals?)\b|\b(\d+)\s*x\b|\bx\s*(\d+)\b/g, (_all, a, b, c) => {
    rounds = Number(a ?? b ?? c);
    roundMentions++;
    return '';
  });
  if (roundMentions > 1) return fail();
  const noRest = /\b(?:no rest|no break|straight)\b/.test(text);
  text = text.replace(/\b(?:no rest|no break|straight)\b/g, '').replace(/\bof\b/g, '').trim();
  text = text.replace(/[,;!()—–]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
  if (text) {
    const pair = text.match(new RegExp(`^(${duration})\\s*${workLabel}?\\s*(?:with|/)?\\s*(${duration})\\s*${restLabel}?$`));
    const prefixed = text.match(new RegExp(`^${workLabel}\\s*(${duration})\\s*${restLabel}\\s*(${duration})$`));
    const single = text.match(new RegExp(`^(?:${workLabel}\\s*)?(${duration})(?:\\s*${workLabel})?$`));
    const restOnly = tabata && text.match(new RegExp(`^(?:${restLabel}\\s*(${duration})|(${duration})\\s*${restLabel})$`));
    if (pair || prefixed) {
      const values = pair || prefixed!;
      work = seconds(values[1]);
      rest = seconds(values[2]);
      if (noRest && rest !== 0) return fail();
    } else if (single) {
      work = seconds(single[1]);
      rest = tabata && !noRest ? 10 : 0;
    } else if (restOnly) {
      rest = seconds(restOnly[1] || restOnly[2]);
    } else return fail();
  } else if (!tabata) return fail();
  if (noRest) rest = 0;
  if (!roundMentions && total !== undefined) rounds = Math.floor((total + rest) / (work + rest));
  if (!rounds && total === undefined && !roundMentions) return fail();
  for (const [name, value, low, high, unit] of [
    ['Work', work, 1, 600, 'seconds'], ['Rest', rest, 0, 600, 'seconds'], ['Rounds', rounds, 1, 99, 'rounds'],
  ] as const) {
    if (!Number.isFinite(value) || value < low || value > high || !Number.isInteger(value)) {
      return fail(`${name} must be a whole number from ${low} to ${high} ${unit}.`);
    }
  }
  return { ok: true, message: '', work, rest, rounds };
}
