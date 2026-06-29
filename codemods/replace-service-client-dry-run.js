/**
 * Dry-run codemod: logs files that WOULD be changed,
 * but does NOT write anything to disk.
 *
 * Strict-match version: only matches
 *   import { createSupabaseServerClient } from "@/lib/supabase/server";
 */

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let modified = false;

  // 1. Strict-match import
  root.find(j.ImportDeclaration)
    .filter(path =>
      path.node.source.value === "@/lib/supabase/service"
    )
    .forEach(path => {
      path.node.specifiers.forEach(spec => {
        if (spec.imported && spec.imported.name === "createSupabaseServiceClient") {
          modified = true;
        }
      });
    });

  // 2. Strict-match call
  root.find(j.CallExpression)
    .filter(path =>
      path.node.callee.type === "Identifier" &&
      path.node.callee.name === "createSupabaseServiceClient"
    )
    .forEach(() => {
      modified = true;
    });

  if (modified) {
    console.log("Would modify:", file.path);
  }

  // Return original source (no changes)
  return file.source;
}
