import { redirect } from "next/navigation";

export default async function EditAdminUserPage({ params }: { params: { id: string } }) {
  redirect(`/admin/CEO/users/${params.id}`);
}
