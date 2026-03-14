# AGENTS.md

## Project Intent

Build a cross-platform desktop application for creating, editing, importing, previewing, and exporting:

- Windows `.ico` files
- macOS `.icns` files

The application must use:

- Electron
- `electron-vite`
- React
- TypeScript
- Tailwind CSS
- `shadcn/ui`

The architecture must follow SRP strictly. This is a hard constraint, not a preference.

## Current Phase

This repository is in active implementation mode.

Current objective:

- extend the in-repo ICO and ICNS editor flows without weakening SRP
- keep Electron process boundaries explicit and typed
- evolve the renderer into a real desktop workbench instead of a scaffold shell
- keep the documentation aligned with the actual implementation state

Current non-objectives:

- do not replace the in-repo codecs with third-party icon-format packages
- do not collapse renderer concerns into Electron main or preload
- do not introduce shortcut implementations that bypass the final architecture path

Current implementation status is tracked in:

- [docs/implementation-status.md](/home/graan/Root/makico/docs/implementation-status.md)

## Product Scope

### Core capabilities

- Create a new icon project from source images
- Import existing `.ico` files
- Import existing `.icns` files
- Inspect all embedded icon sizes and variants
- Replace, add, remove, crop, and reorder image entries where format rules allow
- Preview output across common sizes
- Export valid `.ico`
- Export valid `.icns`

### Early constraints

- Desktop-first workflow
- Local file processing only
- No cloud dependency
- No forced authentication
- No direct network requirement for core editing features

## Format Source Policy

This project must implement `.ico` and `.icns` support from documented file structures.

Source priority:

1. official vendor documentation
2. official platform behavior that can be validated from vendor tooling or vendor docs
3. clearly labeled secondary references only where vendor docs are incomplete

For this repository:

- Microsoft documentation is the primary source for `.ico`
- Apple documentation is the primary source for macOS icon slot expectations and `.icns` usage
- Wikipedia may be used as a secondary reference for undocumented `.icns` binary details, but any such usage must be labeled as secondary

Do not treat reverse-engineered behavior as canonical without documenting that it is an inference.

## Architecture Principles

### 1. SRP is mandatory

Every module must have one reason to change.

Examples:

- React components change when presentation changes
- application use-cases change when workflow rules change
- format encoders/decoders change when file format logic changes
- Electron main process code changes when desktop lifecycle or OS integration changes
- preload code changes when IPC exposure changes

What must never happen:

- React components parsing binary icon formats
- Electron main process containing UI state logic
- one service both validating images and writing files
- one module both decoding `.ico` and decoding `.icns`
- preload exposing unrestricted Node or Electron APIs

### 2. Clear process boundaries

The app must be split into three Electron layers:

- `main`: app lifecycle, native menus, dialogs, file access orchestration, window creation
- `preload`: minimal typed bridge between renderer and main
- `renderer`: React UI and presentation state only

The renderer must never access Node APIs directly.

### 3. Domain logic stays outside the UI

All icon logic must live in domain/application layers, not inside React components.

React components may:

- render previews
- collect user input
- dispatch actions
- display validation and progress state

React components may not:

- decode binary files
- build `.ico` byte streams
- build `.icns` byte streams
- perform filesystem writes

### 4. Format logic must be isolated by format

`.ico` and `.icns` are separate domains from an implementation perspective.

Required rule:

- no shared "god service" for all icon formats

Preferred approach:

- shared abstractions for image assets and validation contracts
- separate encoder/decoder implementations per format
- separate tests per format
- separate format notes under `docs/formats/`

## Recommended Technical Stack

### Required

- Electron
- `electron-vite`
- React
- TypeScript
- Tailwind CSS
- `shadcn/ui`

### Recommended additions

- `zod` for schema validation at IPC and input boundaries
- `vitest` for unit and integration tests
- `playwright` for end-to-end coverage where desktop flows need verification

If different libraries are introduced later, they must justify their existence and not weaken SRP.

## Language And Tooling Baseline

TypeScript is mandatory for application code.

Rules:

- all source code under `src/` must be TypeScript: `.ts` or `.tsx`
- do not introduce JavaScript application modules in `src/`
- configuration files may use `.mjs` where tool compatibility is better than TypeScript-based config files
- linting and formatting must be configured in the first scaffold, not added later

Required tooling from the start:

- ESLint with flat config
- `typescript-eslint`
- `eslint-plugin-import-x`
- `@stylistic/eslint-plugin`
- Prettier

Required policy rules:

- mandatory semicolons
- no single-line `if`, `else`, `for`, `while`, or `do` blocks
- import linting through `eslint-plugin-import-x`

Tooling details live in:

- [docs/tooling.md](/home/graan/Root/makico/docs/tooling.md)

## Dependency And Codec Policy

Hard rules:

- do not use Apple `iconutil` in runtime, build, test, or validation workflows
- do not depend on outdated or unverified npm packages for `.ico` parsing or writing
- do not depend on outdated or unverified npm packages for `.icns` parsing or writing
- implement format codecs in-repo under `src/infrastructure/codecs/ico` and `src/infrastructure/codecs/icns`

Allowed with caution:

- generic image processing dependencies that are not format-specific
- generic schema/test tooling

Not allowed:

- shelling out to OS-specific icon conversion tools
- treating third-party format packages as the source of truth
- hiding format logic inside wrapper services around old packages

The application may use third-party libraries for generic PNG or image manipulation only if they are isolated behind infrastructure adapters and remain replaceable.

## Proposed Repository Structure

Use a structure that makes responsibility obvious:

```text
docs/
  formats/
    ico.md
    icns.md
  implementation-status.md
  tooling.md
src/
  main/
    app/
      createMainWindow.ts
      registerAppEvents.ts
    dialogs/
      openIconFileDialog.ts
      saveIconFileDialog.ts
    ipc/
      registerIconIpc.ts
    system/
      appPaths.ts
  preload/
    api/
      iconApi.ts
    index.ts
  renderer/
    app/
      providers/
      router/
      store/
    components/
      layout/
      icon-editor/
      primitives/
    features/
      icon-project/
      import-icon/
      export-icon/
      preview-icon/
    styles/
    pages/
  shared/
    contracts/
    dto/
    enums/
  domain/
    icon-project/
      entities/
      value-objects/
      services/
    ico/
      entities/
      services/
    icns/
      entities/
      services/
    image/
      entities/
      services/
  application/
    use-cases/
      createProject/
      importIco/
      importIcns/
      exportIco/
      exportIcns/
      updateIconEntry/
      removeIconEntry/
      generatePreview/
  infrastructure/
    codecs/
      ico/
      icns/
    imaging/
    persistence/
    logging/
```

This exact tree can evolve, but the responsibility boundaries must remain.

## Responsibility Rules By Layer

### `src/main`

Responsible for:

- Electron app bootstrap
- window lifecycle
- menu registration
- native file dialogs
- invoking application use-cases through controlled adapters

Not responsible for:

- React state
- binary format implementation details
- view composition

### `src/preload`

Responsible for:

- exposing a narrow, typed API to the renderer
- input/output shaping for IPC

Not responsible for:

- business rules
- file format logic
- UI state

### `src/renderer`

Responsible for:

- page composition
- feature screens
- visual state
- user interactions
- preview presentation

Not responsible for:

- filesystem access
- binary parsing
- direct IPC channel string management outside dedicated clients

### `src/domain`

Responsible for:

- entities and value objects
- format invariants
- validation rules tied to icon concepts

Examples:

- icon family
- icon entry
- dimensions
- bit depth metadata
- format constraints

### `src/application`

Responsible for:

- use-case orchestration
- business workflows
- coordinating domain services and infrastructure adapters

Examples:

- import file -> decode -> validate -> build project
- modify project entries -> recalculate previews
- export project -> validate -> encode -> save

### `src/infrastructure`

Responsible for:

- binary codec implementations
- image transformation adapters
- filesystem persistence adapters
- optional logging implementations

Not responsible for:

- UI concerns
- page state
- Electron window lifecycle

## SRP Enforcement Rules

These rules are mandatory during implementation and review:

1. One file should not contain unrelated responsibilities.
2. One React component should not both fetch/process data and render a large UI tree if that split can be made cleanly.
3. One use-case should represent one user intent.
4. One codec should target one file format.
5. One IPC handler should expose one clear operation.
6. Shared utilities must remain small and generic. If a helper becomes format-aware, move it closer to the format module.
7. Avoid "manager", "helper", and "utils" as catch-all dumping grounds.

Reject designs that introduce:

- `IconService` that does everything
- `FileService` that knows dialogs, parsing, encoding, and persistence
- giant `EditorPage.tsx` files with business logic mixed into event handlers
- broad global state for transient component concerns

## Domain Model Direction

Start with a neutral project model, then format-specific models.

### Core project model

Suggested entities/value objects:

- `IconProject`
- `IconEntry`
- `IconVariant`
- `ImageBitmapSource`
- `PixelSize`
- `ColorDepth`
- `CompressionType`
- `MacIconSlot`

### Format-specific rules

Keep separate contracts for:

- ICO entry constraints
- ICNS element constraints
- export validation rules

Do not flatten both formats into a weakest-common-denominator model if it causes hidden rules or format leakage.

Important:

- `.ico` variants are primarily entry-based and pixel-size-based
- `.icns` variants must preserve slot identity, not just pixel size, because different ICNS element types can share the same pixel dimensions but represent different semantic slots

## IPC Design Rules

IPC must be typed and explicit.

Use request names based on intent, not implementation details.

Good examples:

- `iconProject:create`
- `iconProject:importIco`
- `iconProject:importIcns`
- `iconProject:exportIco`
- `iconProject:exportIcns`
- `iconProject:updateEntry`
- `iconProject:removeEntry`

Bad examples:

- `doStuff`
- `processFile`
- `handleIcon`

IPC payloads should use shared DTOs and schema validation.

## UI Direction

The UI stack is `shadcn/ui` plus Tailwind.

### UI goals

- clear desktop-oriented workspace
- fast access to entry list, preview, metadata, and export controls
- minimal friction for replacing assets
- visible validation feedback before export

### UI composition guidance

Prefer feature-oriented UI slices:

- project shell
- entry list panel
- preview panel
- properties panel
- import/export dialogs

Avoid one monolithic page component.

### Styling rules

- Use Tailwind tokens consistently
- Keep `shadcn/ui` components presentational
- Project-specific visual behavior belongs in feature components
- Avoid inline style sprawl
- UI source still follows the repository-wide ESLint and Prettier rules

## State Management Guidance

Keep state local unless it is truly shared across the editor workflow.

Recommended split:

- component-local state for UI toggles and ephemeral interaction state
- feature/application state for current icon project, selection, validation results, and export state

Do not introduce a global store before there is a concrete need.

If a store is added later, its responsibilities must remain narrow and documented.

## File Processing Strategy

The application should treat icon work as a pipeline:

1. load source bytes
2. detect or select format
3. decode through a format-specific codec
4. map to domain entities and format slot metadata
5. validate project state
6. edit through explicit use-cases
7. export through a format-specific encoder

Each step should be independently testable.

The normalized editor model must not discard format identity that is necessary for a correct export.

## Testing Strategy

Implementation should include tests at the correct level.

### Unit tests

For:

- domain entities
- validators
- format-specific codecs
- use-cases with mocked adapters

### Integration tests

For:

- IPC handlers
- main <-> preload <-> renderer contracts where practical
- import/export workflows

### End-to-end tests

For:

- opening a project
- importing assets
- editing entries
- exporting `.ico`
- exporting `.icns`

## Performance Guidance

The editor should remain responsive when working with multiple icon sizes.

Required direction:

- keep binary processing off the React render path
- avoid unnecessary re-encoding during minor UI interactions
- cache derived previews when safe
- isolate expensive transformations behind dedicated services

## Error Handling Rules

Errors must be classified by context:

- user input errors
- unsupported format errors
- file corruption errors
- validation errors
- filesystem errors
- unexpected internal errors

Do not surface raw low-level exceptions directly to the UI without mapping them to meaningful messages.

## Cross-Platform Rules

This project targets Windows, macOS, and Linux as a desktop runtime.

Rules:

- do not hardcode path separators
- do not assume case-insensitive filesystems
- keep OS-specific behavior inside main/infrastructure boundaries
- ensure export flows are deterministic across platforms

The app edits Windows and macOS icon formats, but the editor itself must remain runnable cross-platform.

## Documentation Rules For Future Work

When implementation begins, keep documentation aligned with reality.

Required docs to add later:

- `README.md` for setup and local development
- architecture notes for process boundaries
- format notes for `.ico` and `.icns`
- testing notes for fixture strategy

Format notes now exist at:

- [docs/formats/ico.md](/home/graan/Root/makico/docs/formats/ico.md)
- [docs/formats/icns.md](/home/graan/Root/makico/docs/formats/icns.md)
- [docs/tooling.md](/home/graan/Root/makico/docs/tooling.md)

If implementation changes the architecture, update this file in the same change set.

## Definition Of Done For Initial Scaffold

The first real implementation phase should only be considered complete when the repository includes:

- Electron app bootstrapped with `electron-vite`
- React renderer wired correctly
- Tailwind CSS configured
- `shadcn/ui` installed and usable
- TypeScript configured as the only source language under `src/`
- ESLint flat config configured
- Prettier configured
- strict process boundaries
- typed preload API
- one vertical slice proving SRP:
  - import an icon file
  - inspect entries
  - preview entries
  - export back to the same format

## Recommended Implementation Sequence

Build in this order:

1. scaffold Electron with `electron-vite`, React, TypeScript, Tailwind, `shadcn/ui`, ESLint flat config, and Prettier
2. establish process boundaries: `main`, `preload`, `renderer`
3. define shared DTOs and IPC contracts
4. define core domain entities and validation rules
5. implement one format end-to-end first, preferably `.ico`
6. add the editor workspace UI around that vertical slice
7. add `.icns` support as a separate codec and use-case track
8. expand editing features only after import/export is reliable

Reasoning:

- the first vertical slice should prove the architecture
- `.ico` and `.icns` should not be implemented as one combined codec effort
- UI breadth should follow validated domain and export behavior

## Decision Record

Current decisions:

- desktop app, not web app
- Electron with `electron-vite`
- React renderer
- TypeScript-first codebase
- strict SRP architecture
- `shadcn/ui` plus Tailwind for UI
- support `.ico` and `.icns`
- documentation-first before scaffolding
- no `iconutil`
- no third-party `.ico` or `.icns` packages in the core codec path
- implement codecs from vendor documentation plus clearly labeled secondary references where vendor docs are incomplete
- ESLint flat config and Prettier must be present from the initial scaffold

## Instructions For Future Agents

If you work on this repository:

1. read this file first
2. preserve SRP boundaries aggressively
3. do not put domain logic into React components
4. do not expose unrestricted Electron APIs to the renderer
5. do not merge `.ico` and `.icns` logic into one oversized module
6. prefer small use-cases over broad services
7. update this document when architecture assumptions change
8. read the format notes before touching codec code

If asked to move quickly, do not "solve" speed by collapsing responsibilities.

Speed is acceptable.
Architecture erosion is not.
