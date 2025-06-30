import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/navbar";

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-50 p-3">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                Payment Successful!
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground leading-relaxed">
                Thank you for your purchase. Your payment has been processed
                successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 pb-8">
              <p className="text-center text-muted-foreground max-w-sm">
                You will receive a confirmation email shortly with your purchase
                details.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <Button asChild variant="outline" className="flex-1 h-11">
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
                <Button asChild className="flex-1 h-11">
                  <Link href="/">Return Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
