# AUTOCOMPLETE_UI_SPEC.md

**Electrum — Autocomplete UI Specification**
*Compatibility: SEARCH_BAR_INTERACTION_SPEC.md · FRONTEND_SEARCH_INTEGRATION_SPEC.md ·
SEARCH_MODEL.md §2.6 · SEARCH_MODEL.md §13.1 · THEME_SCHEMA.md*
*Status: Future — not implemented in v1. This spec defines the complete implementation
contract so autocomplete can be built without architectural decisions at ship time.*
*Audience: Public UI engineers, Workspace*
*Last updated: 2026-10-13*

---

## 1. Purpose

### 1.1 What Autocomplete Does

Autocomplete is a usability enhancement that shows prefix-matched title suggestions
as the user types, before they submit the search form. Suggestions help users:
- Discover civic content they did not know existed
- Correct spelling before a full search is executed
- Navigate directly to a known result without going through the results page

Autocomplete is **not** a search results page. It shows up to 5 title matches in a
dropdown. Users may select a suggestion (navigating directly to the result) or continue
typing and submit the full search.

### 1.2 v1 Status

Autocomplete is explicitly not part of v1. The `search_index` table and its
`idx_search_index_title_trgm` GIN index (SEARCH_INDEXING_GUIDE.md §2.3) are already
in place to support it. The `rpc_autocomplete` function is defined in this spec but not
deployed in v1.

When autocomplete is ready to ship:
1. Deploy the `rpc_autocomplete` RPC (§3.1)
2. Add the `/api/autocomplete` route (§3.2)
3. Deploy the `AutocompleteDropdown` component (§5)
4. Update `SearchBar` with combobox ARIA attributes (SEARCH_BAR_INTERACTION_SPEC.md §10)

No schema change is required.

---

## 2. Combobox ARIA Pattern

Autocomplete implements the ARIA Combobox pattern (WAI-ARIA 1.2, §3.8). This is the
required pattern for accessible typeahead inputs.

### 2.1 Role Assignments

```html
<!-- SearchBar input becomes a combobox -->
<input
  id="search-input"
  type="search"
  role="combobox"
  aria-haspopup="listbox"
  aria-expanded="false | true"      <!-- toggled when dropdown opens/closes -->
  aria-controls="autocomplete-listbox"
  aria-activedescendant=""          <!-- set to id of focused option -->
  aria-autocomplete="list"
  autocomplete="off"
/>

<!-- Autocomplete dropdown -->
<ul
  id="autocomplete-listbox"
  role="listbox"
  aria-label="Search suggestions"
>
  <li
    id="autocomplete-option-0"
    role="option"
    aria-selected="false | true"
  >
    [Suggestion content]
  </li>
  <!-- ...up to 4 more options -->
</ul>

### 2.2 State Machine

CLOSED
  │  user types ≥ 2 chars (after 300 ms debounce)
  ▼
LOADING (spinner in input or dropdown)
  │  rpc_autocomplete returns ≥ 1 result
  ▼
OPEN
  │  user presses Escape                → CLOSED (input retains value)
  │  user presses Arrow Down            → OPTION_FOCUSED (first option)
  │  user clicks outside dropdown       → CLOSED
  │  user submits (Enter without option)→ CLOSED → search results page
  │  rpc_autocomplete returns 0 results → CLOSED
  ▼
OPTION_FOCUSED
  │  user presses Arrow Down     → focus next option (wraps to first)
  │  user presses Arrow Up       → focus previous option (wraps to last)
  │  user presses Enter/Tab      → SELECTED
  │  user presses Escape         → CLOSED (focus returns to input)
  │  user types                  → OPEN (focus returns to input)
  ▼
SELECTED
  │  navigate to option.route    → page navigation

### 2.3 aria-activedescendant Management
When an option receives keyboard focus, aria-activedescendant on the combobox input
is set to the id of the focused option element. The option itself does NOT receive DOM
focus — focus remains on the input element at all times. This is the correct ARIA
combobox pattern.

const [activeDescendant, setActiveDescendant] = useState('');

// When Arrow Down is pressed:
const nextIndex = (currentIndex + 1) % suggestions.length;
setActiveDescendant(`autocomplete-option-${nextIndex}`);

// When Escape is pressed:
setActiveDescendant('');


## 3. RPC Integration
### 3.1 rpc_autocomplete (Definition)

CREATE OR REPLACE FUNCTION rpc_autocomplete(
  p_query      text,
  p_city_id    uuid,
  p_limit      integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
BEGIN
  -- Minimum query length: 2 characters
  IF length(trim(p_query)) < 2 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT jsonb_agg(r)
  INTO   v_results
  FROM (
    SELECT
      entity_id    AS result_id,
      entity_type  AS result_type,
      title,
      subtitle,
      route
    FROM search_index
    WHERE city_id      = p_city_id
      AND is_published = true
      AND title ILIKE (trim(p_query) || '%')
    ORDER BY
      entity_weight DESC,
      source_updated_at DESC,
      title ASC
    LIMIT LEAST(p_limit, 5)
  ) r;

  RETURN COALESCE(v_results, '[]'::jsonb);
END;
$$;
Notes:

Uses ILIKE with a trailing % wildcard for prefix matching — backed by
idx_search_index_title_trgm (GIN trigram index).

ILIKE is accent-sensitive in v1. Accent-insensitive matching (via the unaccent
extension) is a future improvement (SEARCH_INDEXING_GUIDE.md §8).

Maximum 5 suggestions enforced server-side regardless of p_limit.

Never queries sponsorship tables. Never returns sponsor content.

SECURITY DEFINER allows the anon role to call it without direct table access.

### 3.2 /api/autocomplete Route

GET /api/autocomplete

Query parameters:
  citySlug   string   required
  q          string   required   min 2 chars; max 200 chars
  limit      number   optional   default 5; max 5

Response: AutocompleteSuggestion[]
[
  {
    result_id:    string,
    result_type:  EntityType,
    title:        string,
    subtitle:     string | null,
    route:        string
  }
]

Empty result: []  (never an error; 0 suggestions closes the dropdown)

### 3.3 useAutocomplete Hook

// Location: electrumbroadcasting-city/src/lib/public/useAutocomplete.ts

interface UseAutocompleteReturn {
  suggestions:        AutocompleteSuggestion[];
  isOpen:             boolean;
  isLoading:          boolean;
  activeIndex:        number;   // -1 = no option focused
  setQuery:           (q: string) => void;
  selectSuggestion:   (suggestion: AutocompleteSuggestion) => void;
  close:              () => void;
  moveUp:             () => void;
  moveDown:           () => void;
}
setQuery triggers a 300 ms debounced call to /api/autocomplete

selectSuggestion calls router.push(suggestion.route) and closes the dropdown

close clears suggestions and sets isOpen = false

moveUp / moveDown update activeIndex with wrap-around

## 4. Suggestion Result Shape
The normalized suggestion shape consumed by the AutocompleteDropdown component:

interface AutocompleteSuggestion {
  result_id:   string;      // entity_id from search_index
  result_type: EntityType;  // entity_type from search_index
  typeLabel:   string;      // human-readable (ENTITY_TYPE_LABELS lookup)
  title:       string;      // exact title from search_index
  subtitle:    string;      // subtitle ?? typeLabel fallback
  route:       string;      // pre-computed route from search_index
}
Normalization is identical to the pattern in FRONTEND_SEARCH_INTEGRATION_SPEC.md §3.3,
applied to the narrower autocomplete result shape.

### 4.1 No Fuzzy Matching in Autocomplete
Autocomplete uses prefix matching only (ILIKE 'query%'). Fuzzy matching
(trigram similarity) is not applied to autocomplete suggestions. If the prefix returns
no results, the dropdown closes — no fuzzy supplement is shown. This is intentional:
autocomplete surfaces known, exact-prefix matches; rpc_search handles fuzzy results
when the full search is submitted.

## 5. Dropdown Component
### 5.1 Structure

// AutocompleteDropdown.tsx

<div
  className="autocomplete-dropdown"
  role="presentation"
>
  <ul
    id="autocomplete-listbox"
    role="listbox"
    aria-label="Search suggestions"
  >
    {suggestions.map((suggestion, index) => (
      <li
        key={suggestion.result_id}
        id={`autocomplete-option-${index}`}
        role="option"
        aria-selected={activeIndex === index}
        onMouseDown={(e) => {
          e.preventDefault();  // prevent blur before click registers
          selectSuggestion(suggestion);
        }}
        onMouseEnter={() => setActiveIndex(index)}
      >
        <span className="suggestion-type" aria-hidden="true">
          {suggestion.typeLabel}
        </span>
        <span className="suggestion-title">
          {highlightMatch(suggestion.title, query)}
        </span>
        <span className="suggestion-subtitle" aria-hidden="true">
          {suggestion.subtitle}
        </span>
      </li>
    ))}
  </ul>
</div>
The onMouseDown handler uses e.preventDefault() to prevent the input's blur event
from firing before the click registers. Without this, the dropdown closes (on blur)
before the click is processed and navigation never occurs.

### 5.2 Title Match Highlighting
The matched prefix characters in the suggestion title are wrapped in <mark> elements:

function highlightMatch(title: string, query: string): React.ReactNode {
  const normalizedTitle = title.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const matchEnd = normalizedQuery.length;

  if (!normalizedTitle.startsWith(normalizedQuery)) {
    return title;  // no highlight if prefix doesn't match (edge case)
  }
  return (
    <>
      <mark>{title.slice(0, matchEnd)}</mark>
      {title.slice(matchEnd)}
    </>
  );
}

.autocomplete-dropdown mark {
  background: transparent;
  color: inherit;
  font-weight: 700;  /* bold the matched prefix */
  text-decoration: none;
}
<mark> is the semantically correct element for highlighted match text. Screen readers
announce it differently per reader (some say "highlight start/end"), which is acceptable
here because the full title is also announced via aria-label on the parent listitem.

## 6. Styling Requirements
### 6.1 Theme Tokens
Element	Token
Dropdown background	theme.background
Dropdown border	theme.colors.foreground at 15% opacity
Dropdown shadow	0 4px 12px rgba(0,0,0,0.12) (fixed; not themed)
Option text (title)	theme.colors.foreground
Option type label	theme.colors.foreground at 50% opacity
Option subtitle	theme.colors.foreground at 50% opacity
Highlighted prefix	theme.colors.foreground; font-weight 700
Option hover background	theme.colors.foreground at 6% opacity
Option focused background (aria-selected)	theme.accent at 12% opacity
Option focused text	theme.colors.foreground (unchanged — do not invert)


### 6.2 Dimensions
Property	Value
Dropdown width	Same as the search input (matches input width)
Dropdown max-height	300 px; overflow-y: auto
Dropdown border-radius	0 0 8px 8px (top edge flush with input)
Option min-height	44 px (minimum touch target)
Option padding	10 px 16 px
Type label font-size	0.75rem (12 px)
Title font-size	0.875rem (14 px)
Subtitle font-size	0.75rem (12 px)


### 6.3 Positioning
The dropdown is positioned absolutely, directly below the search input, with zero gap.
It uses position: absolute; top: 100%; left: 0; width: 100% relative to the
search bar's containing position: relative wrapper.

On mobile, if the dropdown would extend below the viewport, it flips to appear above
the input. Detect this with getBoundingClientRect() on open.

### 6.4 High-Contrast Mode

@media (forced-colors: active) {
  .autocomplete-dropdown {
    border: 1px solid ButtonText;
    background: Canvas;
  }
  .autocomplete-dropdown li[aria-selected="true"] {
    background: Highlight;
    color: HighlightText;
  }
  .autocomplete-dropdown mark {
    font-weight: 700;
    text-decoration: underline;
  }
}

## 7. Mobile Behavior
On mobile (< 768 px), the autocomplete dropdown renders as a full-width bottom sheet
rather than a floating dropdown. This prevents the keyboard from obscuring the dropdown
when it appears.

Property	Desktop	Mobile
Presentation	Floating dropdown below input	Bottom sheet (slides up from bottom of viewport)
Width	Matches input width	100% viewport width
Max-height	300 px	50% viewport height
Border radius	0 0 8px 8px	12px 12px 0 0 (top corners rounded)
Backdrop	None	Semi-transparent overlay (theme.foreground at 20%)
Close gesture	Click outside	Swipe down or tap backdrop


The bottom sheet uses role="dialog" and aria-label="Search suggestions" on mobile,
replacing the role="listbox" pattern used on desktop. This is because the sheet occupies
more of the screen and benefits from dialog semant

