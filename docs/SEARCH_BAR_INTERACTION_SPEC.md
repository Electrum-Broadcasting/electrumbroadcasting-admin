# SEARCH_BAR_INTERACTION_SPEC.md

**Electrum — Search Bar Interaction Specification**
*Compatibility: FRONTEND_SEARCH_INTEGRATION_SPEC.md · SEARCH_WORKFLOW.md ·
AUTOCOMPLETE_UI_SPEC.md · THEME_SCHEMA.md · ARCHITECTURE.md*
*Audience: Public UI engineers, Workspace, designers*
*Last updated: 2026-10-13*

---

## 1. Purpose

The **SearchBar** is Electrum's global civic navigation entry point. It is the primary
mechanism through which users initiate search queries. It is persistent across all
city-scoped public pages and adapts its placement and size to the surface it appears on.

The SearchBar is intentionally simple: it is a text input, a submit button, and (in
future) an autocomplete dropdown. It is not a recommendation surface, a trending surface,
or a sponsored content surface.

---

## 2. Placement Rules

The SearchBar appears on every public city-scoped page. Its size and prominence vary
by surface.

| Surface | Placement | Size variant |
|---|---|---|
| City Home (`/`) | Immediately below the 360° view, above the Homepage Spotlight tile. Show the field even when no spotlight is displayed. Align it to the existing homepage content width. | Large (`search-bar--large`) |
| Story Page - desktop | At the top of the existing right-hand column, above the sponsor. Keep it visible independently of whether a sponsor is displayed. | Compact (`search-bar--compact`) |
| Story Page - mobile | Above the story text, as you selected. Leave the sponsor below the story. Only one search field is visible and keyboard-focusable at each width. | Compact (`search-bar--compact`) |
| Object Page | At the start of the description column, immediately before the description. This places it below the title’s 360° section without adding a field over the panorama or moving the title. Applies to every currently supported object type. | Compact |
| Timeline Page | Top navigation bar, right-aligned | Compact |
| Game Page | Top navigation bar, right-aligned | Compact |
| Search Results Page (`/search`) | Top of page, below navigation bar | Standard (`search-bar--standard`) |
| Atlas Page (`/atlas`) | Centre of page, above city grid | Standard (city name search only) |
| Contributor Page | Top navigation bar, right-aligned | Compact |
| Mobile (all pages) | Fixed bottom bar on scroll, or top-of-page | Mobile (`search-bar--mobile`) |

### 2.1 Size Variants

| Variant | Height | Font size | Input width |
|---|---|---|---|
| Large | 56 px | 1.125rem (18 px) | 100% of container |
| Standard | 48 px | 1rem (16 px) | 100% of container |
| Compact | 40 px | 0.875rem (14 px) | 240 px (expands to 360 px on focus) |
| Mobile | 48 px | 1rem (16 px) | 100% viewport width − 32 px margin |

### 2.2 Compact Bar Expansion

When a Compact SearchBar receives focus, it expands from 240 px to 360 px using a CSS
`transition: width 200ms ease`. When it loses focus and the query is empty, it contracts
back to 240 px. When a query is present, it remains expanded at 360 px until the query
is cleared.

---

## 3. Interaction Model

### 3.1 Typing and Debounce

- User types in the search input
- Input value is stored in local component state (not in URL)
- No API call is made on every keystroke
- API call is fired **300 ms after the user stops typing** (debounce)
- The debounce timer resets on every keystroke
- The debounce applies to autocomplete suggestions (future; AUTOCOMPLETE_UI_SPEC.md §3.2),
  not to the main search submission

The 300 ms debounce is applied only to autocomplete. The main search API call
(`useSearch`) is triggered by **explicit submission** (Enter key or submit button click),
not by the debounce timer.

### 3.2 Submission

Search is submitted by:
1. Pressing **Enter** while the input is focused
2. Clicking the **Submit button** (magnifying glass icon)
3. (Future) Selecting an autocomplete suggestion (AUTOCOMPLETE_UI_SPEC.md §4)

On submission:
1. The raw query string is captured from the input
2. The query is written to the URL: `router.push('/search?q=[encoded_query]')`
3. `useSearch.setQuery()` is called with the raw query
4. The query normalization pipeline runs (SEARCH_WORKFLOW.md §4)
5. The API call to `/api/search` fires

Submission does NOT occur when:
- The input is empty or contains only whitespace after trimming
- The input is fewer than 2 characters after tokenization (SEARCH_MODEL.md §2.3)
- A submission is already in progress (`isLoading = true`)

When submission is blocked due to empty/short query, the input border flashes with a
1-cycle pulse animation to indicate the input is required. No toast, no modal.

### 3.3 Clear Button

A **clear button** (× icon) appears inside the search input when the query is non-empty.
Clicking it:
1. Clears the input value
2. Calls `useSearch.reset()`
3. Removes the `?q=` parameter from the URL: `router.replace('/search')`
4. Returns focus to the search input

The clear button:
- Is rendered as a `<button type="button">` (not `type="submit"`)
- Has `aria-label="Clear search query"`
- Has a minimum touch target of 44 × 44 px (padding extends the hit area)
- Is not rendered when the query is empty

### 3.4 Focus Behavior

On focus:
- The input border changes to `theme.accent` color (2 px)
- The autocomplete dropdown opens if a previous query is present and autocomplete is
  available (future; AUTOCOMPLETE_UI_SPEC.md §3.3)
- The Compact variant expands to 360 px (see §2.2)

On blur:
- The input border returns to its default style
- The autocomplete dropdown closes (with a 150 ms delay to allow click events on
  dropdown items to register before the blur event dismisses them)
- The Compact variant contracts to 240 px if the query is empty

### 3.5 Query Character Limit

- Maximum accepted input: **200 characters** (enforced by `maxLength={200}` on the input)
- A character counter is optionally shown on the Standard and Large variants when the
  user has typed ≥ 180 characters: "180/200"
- Character counter uses `aria-live="polite"` to announce changes to screen readers

---

## 4. Keyboard Navigation

| Key | Behavior |
|---|---|
| `Tab` | Focus moves to the search input |
| Type | Updates input value |
| `Enter` | Submits query if valid; does nothing if query is empty/too short |
| `Escape` | Clears input and closes autocomplete dropdown (future); returns focus to input |
| `Arrow Down` | (When autocomplete is open) Moves focus to first autocomplete suggestion |
| `Arrow Up` | (When autocomplete is open) Moves focus to last suggestion if on first, or up one |
| `Tab` (with autocomplete open) | Closes autocomplete and moves focus to next focusable element |

On the search results page, after results are rendered:
| Key | Behavior |
|---|---|
| `Tab` (from submit button) | Focus moves to the first result card |
| `Tab` (from last result card) | Focus moves to "Load more" button |
| `Shift+Tab` (from first card) | Focus returns to the search input |

---

## 5. ARIA Specification

```tsx
<form
  role="search"
  aria-label="Search [City Name] civic content"
  onSubmit={handleSubmit}
>
  <label htmlFor="search-input" className="sr-only">
    Search {cityName}
  </label>
  <input
    id="search-input"
    type="search"
    name="q"
    value={query}
    onChange={handleChange}
    maxLength={200}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
    aria-label="Search query"
    aria-controls="search-results"      // id of SearchResultList
    aria-activedescendant={activeOptionId}  // when autocomplete open (future)
    placeholder="Search civic stories, places, events…"
  />
  {query.length > 0 && (
    <button
      type="button"
      aria-label="Clear search query"
      onClick={handleClear}
    >
      <XIcon aria-hidden="true" />
    </button>
  )}
  <button
    type="submit"
    aria-label="Submit search"
    disabled={isLoading}
  >
    <SearchIcon aria-hidden="true" />
  </button>
</form>
The <label> is visually hidden with .sr-only but present in the DOM. Do not use
aria-label on the <input> as a replacement for a real <label> — both are present
for maximum screen reader compatibility.

### 5.1 Live Region for Results

<div
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
  id="search-status"
>
  {isLoading && 'Searching…'}
  {!isLoading && results.length > 0 && `${total} results for ${query}`}
  {!isLoading && results.length === 0 && query && `No results for ${query}`}
</div>
This live region is visually hidden but announces state changes to screen readers.
aria-atomic="true" ensures the entire message is read, not just the changed portion.

## 6. Styling Requirements
### 6.1 Theme Tokens
Element	Token
Input background	theme.background
Input border (default)	theme.colors.foreground at 20% opacity
Input border (focused)	theme.accent at 100% opacity; 2 px
Input text	theme.colors.foreground
Placeholder text	theme.colors.foreground at 40% opacity
Submit button icon	theme.colors.foreground at 60%
Submit button icon (hover)	theme.accent
Clear button icon	theme.colors.foreground at 40%
Clear button icon (hover)	theme.colors.foreground at 80%
Focus ring	theme.accent; 2 px solid; 2 px offset


### 6.2 High-Contrast Mode

@media (forced-colors: active) {
  .search-bar input {
    border: 2px solid ButtonText;
    background: Field;
    color: FieldText;
  }
  .search-bar input:focus {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
  .search-bar button {
    forced-color-adjust: auto;
  }
}

### 6.3 Atlas Page — City Search Mode
On the /atlas page, the SearchBar operates in city search mode:

placeholder: "Find a city…"

Entity type filter is not rendered (only 'city' type is searched)

aria-label: "Search for a city"

The type=city parameter is hardcoded into the API call; the user cannot change it

## 7. RPC Integration
The SearchBar does not call RPCs directly. It is a controlled input component that
calls useSearch.setQuery() and useSearch calls /api/search.

// SearchBar component prop interface
interface SearchBarProps {
  citySlug:    string;
  cityName:    string;
  variant:     'large' | 'standard' | 'compact' | 'mobile';
  onSearch?:   (query: string) => void;  // optional callback for parent page
  initialQuery?: string;                 // pre-populate from URL on page load
}
The SearchBar is stateless with respect to search results. It owns only:

The raw input value (controlled state)

The loading indicator (derived from useSearch.isLoading)

The autocomplete dropdown visibility (future)

## 8. Sponsorship Independence
Rule	Enforcement
SearchBar must never display a sponsored suggestion	Autocomplete results come from rpc_autocomplete, which queries search_index only
SearchBar must never render a sponsor logo or banner adjacent to the input	No sponsor slot is defined in the SearchBar template
The placeholder text must not reference sponsor names or campaigns	Placeholder is hardcoded per surface (see §6.3)
Pressing Enter must not trigger a sponsor tracking event	Submit handler calls router.push and useSearch.setQuery only; no analytics call with sponsor context


## 9. Component File Location

electrum-ui/components/public/search/SearchBar.tsx
electrum-ui/components/public/search/SearchBar.module.css
The SearchBar must be importable by any city-scoped page layout component. It receives
citySlug and cityName as props and derives the API context from these values.

## 10. Future: Autocomplete
When autocomplete ships (AUTOCOMPLETE_UI_SPEC.md), the SearchBar gains:

An aria-haspopup="listbox" attribute on the input

An aria-expanded attribute toggled when the dropdown opens/closes

An aria-controls attribute pointing to the autocomplete listbox id

Arrow key navigation between input and listbox

No structural change to the SearchBar is required. The autocomplete component is added
as a sibling of the submit button inside the <form>, not as a replacement for any
existing element.

