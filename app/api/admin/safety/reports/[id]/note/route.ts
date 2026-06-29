import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { email } = await getAdminContext();
  const supabase = createSupabaseServerClient();

  const flagId = params.id;

  const form = await req.formData();
  const note = form.get("note") as string;

  // 1. Load existing metadata so we can append the note
  const { data: flagEvent } = await supabase
    .from("flag_events")
    .select("metadata")
    .eq("id", flagId)
    .single();

  const existingNotes = flagEvent?.metadata?.notes ?? [];

  // 2. Append the new note
  const updatedNotes = [
    ...existingNotes,
    {
      author: email,
      note,
      created_at: new Date().toISOString(),
    },
  ];

  // 3. Update metadata.notes on the flag event
  await supabase
    .from("flag_events")
    .update({
      metadata: {
        ...flagEvent?.metadata,
        notes: updatedNotes,
      },
    })
    .eq("id", flagId);

  // 4. Write an audit log entry
  await supabase.from("audit_logs").insert({
    actor: email,
    action: "add_flag_note",
    entity: flagId,
    metadata: {
      note,
      source: "admin_action",
    },
  });

  // 5. Redirect back to the detail page
  return NextResponse.redirect(`/admin/CEO/safety/reports/${flagId}`);
}
