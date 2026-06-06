/**
 * Default state of the @modal parallel-route slot: no overlay.
 *
 * Next.js requires every parallel route slot to have a `default` export so
 * unmatched route segments (i.e. plain `/`) don't 404 the slot. Returning
 * null here means the frame renders without any modal until something
 * intercepts a sub-route (see `(.)work/[slug]/page.tsx`).
 */
export default function Default() {
  return null;
}
