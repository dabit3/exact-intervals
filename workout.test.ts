import { expect, test } from 'bun:test';
import { parseWorkout } from './workout';

test('supported round markers, duration units and pairings', () => {
  for (const phrase of [
    '8 rounds of 40 on 20 off', '8x 40 on, 20 rest', '8 x 40 work 20 rest',
    '40 hard, 20 easy x8', '8 times 40 fast 20 slow', '8 sets 40 sprint 20 jog',
    '8 reps 40 fast 20 walk', '8 intervals 40 with 20 rest', 'eight rounds 40 / 20',
    '8 rounds 40, 20', '8 rounds work 40 rest 20', '8 rounds 40 sprint 20 recover',
    '8 rounds 40 fast 20 recovery', '8 rounds 40 work 20 break',
    '8 ROUNDS (40 seconds ON; 20 secs OFF)!',
  ]) expect(parseWorkout(phrase)).toMatchObject({ ok: true, rounds: 8, work: 40, rest: 20 });
  for (const value of ['1.5 min', '90s', '1:30', '1.5m', '90 sec']) {
    expect(parseWorkout(`6 x ${value} on 30 off`)).toMatchObject({ ok: true, rounds: 6, work: 90, rest: 30 });
  }
  for (const ending of ['no rest', 'no break', 'straight', '']) {
    expect(parseWorkout(`5 x 2 min ${ending}`)).toMatchObject({ ok: true, rounds: 5, work: 120, rest: 0 });
  }
  expect(parseWorkout('twenty rounds half a minute on a minute off')).toMatchObject({ ok: true, rounds: 20, work: 30, rest: 60 });
  expect(parseWorkout('tabata 10 rounds')).toMatchObject({ ok: true, rounds: 10, work: 20, rest: 10 });
  expect(parseWorkout('tabata work 40')).toMatchObject({ ok: true, rounds: 8, work: 40, rest: 10 });
  expect(parseWorkout('tabata rest 0')).toMatchObject({ ok: true, rounds: 8, work: 20, rest: 0 });
  expect(parseWorkout('40 on 20 off for 7 minutes')).toMatchObject({ ok: true, rounds: 7 });
  expect(parseWorkout('40 on 20 off for 7.6666666667 minutes')).toMatchObject({ ok: true, rounds: 8 });
});

test('empty, unsupported, ambiguous and out of bounds descriptions', () => {
  for (const phrase of ['', 'go hard', '40 on 20 off', '8 rounds 40 on 20 off 10 sprint',
    '3 sets of 8 rounds 40 on 20 off', '8 rounds 40 on 20 off then rest', 'EMOM 8 x 40',
    '8 x 1:90', '8 x 0', '100 x 40', '8 x 601', '8 rounds 40 on 601 off',
    '8 rounds 40 on 20 off no rest', '8 rounds burpees 40 rest 20',
  ]) expect(parseWorkout(phrase).ok).toBe(false);
});
