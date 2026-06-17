import { createClient } from "@supabase/supabase-js";
import { evaluateTrigger } from "./evaluateTrigger";
import { executeAction } from "./executeAction";

export async function runAutoActions(flagEvent: any) {
  // Service-role client: Auto-Actions are system-level, not user-level
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch all enabled auto-actions
  const { data: actions, error: actionsError } = await supabase
    .from("auto_actions")
    .select("*")
    .eq("enabled", true);

  if (actionsError) {
    console.error("Auto-Actions: Failed to fetch actions", actionsError);
    return;
  }

  if (!actions || actions.length === 0) {
    return; // Nothing to do
  }

  // 2. Loop through each auto-action
  for (const action of actions) {
    try {
      // 3. Evaluate whether this action should fire
      const shouldFire = await evaluateTrigger(supabase, action, flagEvent);

      if (shouldFire) {
        // 4. Execute the action
        await executeAction(supabase, action, flagEvent);
      }
    } catch (err) {
      console.error("Auto-Actions: Error processing action", action.id, err);
    }
  }
}
