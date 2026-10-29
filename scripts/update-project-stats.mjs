import { writeFile } from 'node:fs/promises';

// Every total and first commit is read from the same immutable main revision.
// A failed GitHub request fails the refresh instead of publishing invented totals.
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
async function request(path) {
  const response = await fetch(`https://api.github.com/repos/WroughtMind/${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${path}`);
  return { response, data: await response.json() };
}
async function projectStats(name) {
  const { data: repository } = await request(name);
  const branch = repository.default_branch;
  const { data: head } = await request(`${name}/commits/${encodeURIComponent(branch)}`);
  const base = `${name}/commits?sha=${head.sha}&per_page=1`;
  const { response, data: latest } = await request(base);
  const last = response.headers.get('link')?.split(',').find(link => /rel="last"/.test(link));
  const commits = last ? Number(new URL(last.match(/<([^>]+)>/)[1]).searchParams.get('page')) : latest.length;
  if (!Number.isInteger(commits) || commits < 1) throw new Error(`Invalid commit total for ${name}`);
  const { data: earliest } = await request(`${base}&page=${commits}`);
  return { branch, revision: head.sha, commits, firstCommit: earliest[0].sha, firstCommitAt: earliest[0].commit.author.date };
}
const entries = await Promise.all(['weibei', 'creditia'].map(async name => [name, await projectStats(name)]));
await writeFile(new URL('../src/project-stats.json', import.meta.url), JSON.stringify({ updatedAt: new Date().toISOString(), projects: Object.fromEntries(entries) }, null, 2) + '\n');
console.log('Verified project history for Weibei and Creditia.');
