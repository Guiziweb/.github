/**
 * Acknowledge the trigger comment and classify the item.
 *
 * Sets two outputs consumed by the workflow:
 *   - is_pr   : "true" / "false"
 *   - head_ref: the PR head branch (so the workflow checks out and boots the
 *               app on the right code), empty for an issue.
 *
 * On an `issue_comment` the payload carries `issue`, not `pull_request`, so the
 * head ref must be resolved through the pulls API.
 */
module.exports = async ({ github, context, core }) => {
    const n = context.payload.issue.number
    const isPr = !!context.payload.issue.pull_request

    let headRef = ''
    if (isPr) {
        const pr = await github.rest.pulls.get({ ...context.repo, pull_number: n })
        headRef = pr.data.head.ref
    }
    core.setOutput('is_pr', isPr ? 'true' : 'false')
    core.setOutput('head_ref', headRef)

    await github.rest.reactions.createForIssueComment({
        ...context.repo, comment_id: context.payload.comment.id, content: 'eyes',
    })
    for (const name of ['blocked', 'needs review']) {
        await github.rest.issues.removeLabel({ ...context.repo, issue_number: n, name }).catch(() => {})
    }
    await github.rest.issues.addLabels({ ...context.repo, issue_number: n, labels: ['in progress'] })
}