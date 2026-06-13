import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
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
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 py-4 sm:py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 sm:p-6 shadow-sm">
          <form className="flex flex-col space-y-4 sm:space-y-6">
            <div className="space-y-1 sm:space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Reset password
              </h1>
              <p className="text-sm text-muted-foreground">
                Please enter your new password below.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="New password"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  required
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton
              formAction={resetPasswordAction}
              pendingText="Resetting password..."
              className="w-full mt-4 sm:mt-6"
            >
              Reset password
            </SubmitButton>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </>
  );
}
