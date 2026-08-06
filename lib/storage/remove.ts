export async function removeImage(supabase: any, bucket: string, path: string) {
  if (!path) return { error: null };

  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}
