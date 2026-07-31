const fs = require('fs')

/**
 * Append a token/cost line to the run's track_progress comment.
 *
 * The execution file is a JSON array of events; the final `result` event carries
 * Claude Code's own authoritative usage totals + cost (per-message usage is
 * streaming-stale, so we never sum those).
 *
 * The action exposes no tracking-comment id, so we locate it heuristically: the
 * most recent bot comment that links the job ("View job"). If it can't be found
 * (e.g. the action changes its comment format), we fall back to a standalone
 * comment rather than failing.
 */
module.exports = async ({ github, context }) => {
    const file = process.env.EXEC_FILE
    if (!file || !fs.existsSync(file)) return

    const events = JSON.parse(fs.readFileSync(file, 'utf8'))
    const result = [...events].reverse().find(e => e.type === 'result')
    const u = result?.usage
    if (!u) return

    const fmt = n => (n ?? 0).toLocaleString('en-US')
    const c = result.total_cost_usd
    const cost = c == null ? 'n/a' : `~$${c < 0.01 ? c.toFixed(4) : c.toFixed(2)}`
    const line = [
        '**Token usage**',
        '',
        '| in | out | cache read | cache create | cost |',
        '|---:|---:|---:|---:|---:|',
        `| ${fmt(u.input_tokens)} | ${fmt(u.output_tokens)} | ${fmt(u.cache_read_input_tokens)} | ${fmt(u.cache_creation_input_tokens)} | ${cost} |`,
    ].join('\n')

    const issue_number = context.payload.issue.number
    const { data: comments } = await github.rest.issues.listComments({
        ...context.repo, issue_number, per_page: 100,
    })
    const tracking = [...comments].reverse().find(c => c.user.type === 'Bot' && /View job/.test(c.body))

    if (tracking) {
        await github.rest.issues.updateComment({ ...context.repo, comment_id: tracking.id, body: `${tracking.body}\n\n${line}` })
    } else {
        await github.rest.issues.createComment({ ...context.repo, issue_number, body: line })
    }
}