"use client";

import { freezeStoryAdmin, unfreezeStoryAdmin, hideStoryAdmin, unhideStoryAdmin, deleteStoryAdmin, republishStoryAdmin } from "../../app/admin/(protected)/stories/actions";

export default function AdminStoryToolbar({ storyId }: { storyId: string }) {
  return (
    <div className="flex gap-3 mb-6 p-3 bg-slate-100 border rounded">
      <button onClick={() => freezeStoryAdmin(storyId)} className="btn-admin">
        Freeze
      </button>
      <button onClick={() => unfreezeStoryAdmin(storyId)} className="btn-admin">
        Unfreeze
      </button>
      <button onClick={() => hideStoryAdmin(storyId)} className="btn-admin">
        Hide
      </button>
      <button onClick={() => unhideStoryAdmin(storyId)} className="btn-admin">
        Unhide
      </button>
      <button onClick={() => republishStoryAdmin(storyId)} className="btn-admin">
        Republish
      </button>
      <button onClick={() => deleteStoryAdmin(storyId)} className="btn-admin text-red-600">
        Delete
      </button>
    </div>
  );
}
