## 0.3.0 (2026-03-12)

### Feat

- **ipados**: support for shift+save and icons
- **workspace**: adding a gitlog for workspaces
- **sandboxes**: adding terminal support for workspaces (#27)
- **sandboxes**: adding support for workspace sandboxes (#26)
- **search**: jump to search and enter
- **search**: add jump to search
- **benchmark**: adding history section
- **workspace**: adding a git staging component
- **workspace**: adding commit components
- **workspaces**: adding a place to agents to suggest changes (#24)
- **code-editor**: adding a place make quick code edits with an assistant   (#21)

### Fix

- **git**: adding git main checks
- **benchmark**: start parrell runs after async runs
- **benchmark**: context patch
- **benchmark**: reduce polling for inprogress jobs

### Refactor

- **repos**: move repos to work based off userid to have multiple users
- **benchmark**: update to run async
- **configs**: context groups remove skill
- **contextGroups**: adding some functionality
- **contextGroups**: breaking up large componet
- **navbar**: adding tracker of where you are

## 0.2.0 (2026-03-10)

### Feat

- **evaluationlab**: adding repo to load settings
- **github**: adding config for popular manager  (#19)
- **search**: adding semantic search to docs (#14)
- **search**: adding semantic search  (#12)
- add repository enabled field (relates #3) (#11)
- **auth**: adding edits for profile
- **search**: adding a page to look up code
- **ai-docs**: add support for parsing markdowns
- **agents**: adding support for multiple agents
- **topics**: adding to repo card
- **cron**: moving metadata extraction to cron
- **docs**: adding a spot to ask question about your documentation - frontend (#1)
- **system-prompts**: adding varitations for prompts
- **expections**: more supports for complex tests
- **context**: adding more properties for context and model stats
- add repository and repository metadata tables to the schema and update the clear script to remove them.

### Fix

- **benchmark**: updating keep alive to more sensible
- **semantic-search**: spliting blocklist to docs
- **redirect**: update redirect to use whilte list
- **markdown**: remove headers
- **auth**: session token
- **gitignore**: remove data dir from git
- **auth**: adding auth for all
- **results**: delete button not working
- **progress**: update inprogress bar

### Refactor

- **benchmark**: update parallel job run
- **database**: move to data directory
- **jobs**: update cron for repos every 5 mins
- **jobs**: support dyanmic calls
- **jobs**: adding sync job instead of one jobs for all
- **agent**: update chat
- **agent**: updating thinking loop
- **agent**: update model dropdown
- **auth-pages**: update view for not logged in users
- **chat**: remove chat input on landing
- **metadata**: update colum name
- **frontpage**: update dashboard
- **navbar**: move settings to dropdown
- **componets**: move componets into page dirs
- **agent**: results
- **agent**: benchmark results
- **agent**: systemprompt ids
- **agent**: make some tools for related compoents
- **manager**: moveing things to managers
