import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // Redirect to dashboard since profile is now a modal
  return redirect("/dashboard");
}
