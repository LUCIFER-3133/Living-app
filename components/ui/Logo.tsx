/**
 * The Living Yoga wordmark.
 *
 * Renders as two masked layers painted with `currentColor` rather than an
 * `<img>`, because the supplied artwork is white-on-transparent and the mark
 * has to work on the ink nav pill as well as the light glass menu card. Set
 * the colour with a text utility on the parent (`text-canvas`, `text-ink`)
 * and the mark follows it — see the `.logo` rules in globals.css.
 *
 * Size it by height alone. `.logo` carries the lockup's own aspect ratio, so
 * the width is derived and the handwriting can't be stretched. Don't go
 * below `h-8`: the "YOGA" tucked into the negative space is only 8.6% of the
 * mark's height, so under about 32px it stops resolving into letters.
 *
 * The layers are decorative, so the accessible name ships with the component
 * — no caller has to remember to add one.
 */
export default function Logo({ className = 'h-9' }: { className?: string }) {
  return (
    <>
      <span className={`logo ${className}`} aria-hidden="true">
        <span className="logo-word" />
        <span className="logo-ring" />
      </span>
      <span className="sr-only">Living Yoga</span>
    </>
  );
}
