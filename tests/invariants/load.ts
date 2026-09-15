// Re-exported from src/lib/load-content.ts, which astro.config.mjs's
// sitemap filter (§5.10) also needs — see that file's header comment for
// why the implementation moved out of tests/.
export {
  WRITING_DIR,
  PROJECTS_DIR,
  loadCollection,
  type LoadedEntry,
} from '../../src/lib/load-content.ts';
