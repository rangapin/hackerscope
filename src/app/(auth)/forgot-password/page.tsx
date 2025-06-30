import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <form className="flex flex-col space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              className="text-primary font-medium hover:underline transition-all"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full"
            />
          </div>
        </div>

        <SubmitButton
          formAction={forgotPasswordAction}
          pendingText="Sending reset link..."
          className="w-full"
        >
          Reset Password
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </div>
  );
}
