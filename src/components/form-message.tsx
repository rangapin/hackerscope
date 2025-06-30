export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

import { sanitizeHtml } from "@/utils/utils";

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-green-500 border-l-2 border-green-500 px-4">
          {sanitizeHtml(message.success)}
        </div>
      )}
      {"error" in message && (
        <div className="text-red-500 border-l-2 border-red-500 px-4">
          {sanitizeHtml(message.error)}
        </div>
      )}
      {"message" in message && (
        <div className="text-foreground border-l-2 px-4">
          {sanitizeHtml(message.message)}
        </div>
      )}
    </div>
  );
}
