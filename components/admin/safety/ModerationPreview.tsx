export function ModerationPreview({ item }: { item: any }) {
  switch (item.content_type) {
    case "post":
      return (
        <div className="p-4 border rounded bg-slate-50">
          <h4 className="font-semibold text-sm mb-2">Post Content</h4>
          <p className="text-sm whitespace-pre-wrap">{item.content_body ?? "No content"}</p>
        </div>
      );

    case "comment":
      return (
        <div className="p-4 border rounded bg-slate-50">
          <h4 className="font-semibold text-sm mb-2">Comment</h4>
          <p className="text-sm whitespace-pre-wrap">{item.content_body ?? "No content"}</p>
        </div>
      );

    case "avatar":
      return (
        <div className="p-4 border rounded bg-slate-50">
          <h4 className="font-semibold text-sm mb-2">Avatar</h4>
          <img
            src={item.content_url}
            alt="Avatar"
            className="w-32 h-32 rounded border"
          />
        </div>
      );

    default:
      return (
        <p className="text-sm text-slate-600">
          No preview available for this content type.
        </p>
      );
  }
}
