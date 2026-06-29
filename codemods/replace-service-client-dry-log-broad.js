/**
 * Broad-Match Logging Dry-Run Codemod
 *
 * - Matches ANY import path containing "supabase/service"
 * - Matches ANY imported specifier named createSupabaseServiceClient
 * - Matches ANY call to createSupabaseServiceClient()
 * - Logs each file that WOULD be modified
 * - Makes NO changes to disk
 */

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let modified = false;

  // 1. Match ANY import path containing "supabase/service"
  root.find(j.ImportDeclaration)
    .filter(path => path.node.source.value.includes("supabase/service"))
    .forEach(path => {
      path.node.specifiers.forEach(spec => {
        if (
          spec.imported &&
          spec.imported.name === "createSupabaseServiceClient"
        ) {
          modified = true;
        }
      });
    });

  // 2. Match ANY call to createSupabaseServiceClient()
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
