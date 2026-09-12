# Projects page: create card + table

## Problem

The projects screen treats each existing project as an always-editable input row. The create form sits below that list, so it sinks as rows grow. The sidebar hides the project switcher until there are two projects, so a single “デフォルト” is invisible.

## Goals

- Create is a card at the top (name, personal/team, create). One-shot, no dialog.
- Created projects are a table below (name, workspace, created date, actions). Newest first.
- Rename is a dialog (name only now; more fields later). Pencil icon.
- Delete is a confirm dialog. Trash icon.
- Sidebar always shows the current project, even when there is only one.

## Non-goals

- Creating from the sidebar.
- A shared data-table framework.
- Putting create in the same dialog as edit.
- Changing default-project auto-creation or “cannot delete a project that still has prompts”.

## UI

**Create card:** title uses existing create label. Fields: name, kind (個人 / チーム). Team picker only when kind is team. If the user has no teams, omit kind and create as personal. Success clears the name and inserts the row at the top of the table.

**Table:** columns 名前, 所属, 作成日, 操作. Name is text. 所属 is 個人 or team name. Date is `YYYY/MM/DD` in local time. Actions: icon buttons with accessible names 名前を変更 / 削除.

**Rename dialog:** heading 名前を変更, name field, キャンセル / 保存. Save calls the existing rename API.

**Delete dialog:** confirm, then existing delete API. Non-empty project error surfaces on the page, not inside a half-closed dialog.

**Sidebar:** drop the `length > 1` gate. Show `SidebarSelect` whenever the current workspace has at least one project. No create control in the sidebar. Workspace switcher still only appears when there are two or more workspaces.

## Data

- Expose `createdAt` (ISO string) on `Project` and list/create/rename JSON.
- `listProjects` orders by `createdAt` desc, then `id` desc.

## Tests

- Repository: list includes `createdAt`; newer project sorts first.
- e2e: create still uses the name placeholder; assert the new name in a table cell, not `input[value=…]`. Sidebar project combobox is present with a single project.
