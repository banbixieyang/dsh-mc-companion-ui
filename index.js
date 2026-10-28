/**
 * dsh-mc-companion-ui — Host row for the browser half.
 *
 * The client module is discovered from this package because it is a real Host
 * plugin row (with a main entry), not only a bundle patch. It has no tools and
 * no timers: the panel data/actions come from `/api/mc-companion/*` published
 * by the companion plugin inside the MC preset.
 */

export const name = 'dsh-mc-companion-ui'

export function apply() {
  // Nothing to do on the Host. The UI is a browser module; the companion's
  // dashboard route is owned by the preset-scoped main plugin.
}
