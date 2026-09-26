import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EMPTY = () => ({ users: {}, reports: [] });

// Простое хранилище в JSON-файле. Запись атомарная (через временный файл),
// права 0600 — файл с хэшами паролей не должен читать никто, кроме сервера.
// Без file работает только в памяти (для тестов).
export class JsonStore {
  constructor(file = null) {
    this.file = file;
    this.data = EMPTY();
    this.pending = Promise.resolve();
  }

  async load() {
    if (!this.file) return this;
    try {
      const parsed = JSON.parse(await readFile(this.file, 'utf8'));
      this.data = { ...EMPTY(), ...parsed };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    return this;
  }

  save() {
    if (!this.file) return Promise.resolve();
    const snapshot = JSON.stringify(this.data, null, 2);
    this.pending = this.pending.then(async () => {
      await mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, snapshot, { mode: 0o600 });
      await rename(tmp, this.file);
    });
    return this.pending;
  }
}
