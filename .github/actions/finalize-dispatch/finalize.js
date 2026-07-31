/**
 * Hand the item back to the reviewer once the bot is done.
 *
 * Always assigns camilleislasse. Then, unless the bot gave up and left
 * `blocked`, swaps `in progress` for `needs review`. Runs in `always()`, so it
 * also closes the loop when the Claude step itself failed.
 */
module.exports = async ({ github, context }) => {
    const n = context.payload.issue.number

    await github.rest.issues.addAssignees({
        ...context.repo, issue_number: n, assignees: ['camilleislasse'],
    }).catch(() => {})

    const issue = await github.rest.issues.get({ ...context.repo, issue_number: n })
    const labels = issue.data.labels.map(l => l.name)
    if (!labels.includes('blocked')) {
        await github.rest.issues.removeLabel({ ...context.repo, issue_number: n, name: 'in progress' }).catch(() => {})
        await github.rest.issues.addLabels({ ...context.repo, issue_number: n, labels: ['needs review'] })
    }
}