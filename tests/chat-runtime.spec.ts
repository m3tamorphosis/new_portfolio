import { test, expect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

test('compiled chat endpoint starts in Node without the Vite module loader', async ({}, testInfo) => {
  const output = testInfo.outputPath('node-runtime')
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'package.json'), JSON.stringify({ type: 'module' }))
  for (const file of ['api/chat.ts', 'src/data.ts', 'src/chatHistory.ts']) {
    const target = join(output, file.replace(/\.ts$/, '.js'))
    await mkdir(dirname(target), { recursive: true })
    const compiled = ts.transpileModule(await readFile(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    await writeFile(target, compiled.outputText)
  }
  const endpoint = pathToFileURL(join(output, 'api/chat.js')).href
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import assert from 'node:assert/strict';
        import { createServer } from 'node:http';
        const { default: handler } = await import(${JSON.stringify(endpoint)});
        const server = createServer(handler);
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
          const url = 'http://127.0.0.1:' + server.address().port + '/api/chat';
          const get = await fetch(url);
          assert.equal(get.status, 405);
          assert.equal((await get.json()).error, 'Use POST for chat messages.');
          const post = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
          });
          assert.equal(post.status, 503);
          assert.match((await post.json()).error, /not connected yet/);
        } finally {
          await new Promise(resolve => server.close(resolve));
        }
      `,
    ],
    { encoding: 'utf8', timeout: 10_000, env: { ...process.env, GROQ_API_KEY: '' } },
  )
  expect(result.error).toBeUndefined()
  expect(result.status, result.stderr).toBe(0)
})
