import type { Answer, Result, Sources, Storage } from './app.contract.d.ts';

const FILE = 'app:/data/history.json';
export const grants = `fs.read ${FILE}\nfs.write ${FILE}`;

type Session = Result<'loadHistory'>['sessions'][number];

const load = (storage: Storage): Promise<Session[]> => storage.fs.readFile(FILE).then(
  (bytes) => JSON.parse(new TextDecoder().decode(bytes)),
  (e) => { if (e.code === 'ENOENT') return []; throw e; });

// The module has no clock: the view passes the instant a workout ended.
const sources: Sources = {
  loadHistory: async (_args, _store, storage) => {
    const all = await load(storage);
    return {
      count: all.length,
      seconds: all.reduce((sum, s) => sum + s.seconds, 0),
      sessions: all.slice(-10).reverse(),
    };
  },
  logSession: async ([name, rounds, work, rest, seconds, at], _store, storage): Promise<Result<'logSession'>> => {
    const all = await load(storage);
    const id = String(Math.max(0, ...all.map((s) => Number(s.id))) + 1);
    const next = [...all, { id, name, rounds, work, rest, seconds, at }];
    await storage.fs.atomicWriteFile(FILE, new TextEncoder().encode(JSON.stringify(next)));
    return { ok: true, error: '' };
  },
};

export const answer: Answer = (source, args, store, storage, native) => sources[source](args, store, storage, native);
