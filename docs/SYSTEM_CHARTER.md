# System Charter

## Intent

Make a simple starter I can reuse for interactive projects.

## Constraints

1. Use only scroll input and one main parameter: fracture intensity.
2. Keep one visual form: the ring and its pieces.
3. Use HTML, CSS, and JavaScript without libraries. Keep the existing file structure.

## Tensions

1. Control vs. chaos: small scrolls feel calm; strong scrolls feel wild.
2. Surprise vs. clarity: rare corner hits add fun without taking over.

## Taste Vow

I will keep it simple and make the interaction work before polishing it.

## Signal

Trackpad or mouse-wheel scrolling. Up increases intensity; down lowers it.

## Parameter

Stored fracture intensity from 0 to 1. It slowly returns to zero when scrolling stops.

## Behavior

Higher intensity sends more, larger ring pieces moving faster and farther. Pieces stay inside the window and return as intensity drops.

## Readability Test

Can someone scroll up and down and understand how the ring responds within five seconds?
