import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { checkUserSubscription } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { LibraryClient } from "@/components/library-client";

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_liked: boolean;
  idea_id: string;
}

interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  market_size: string;
  target_audience: string;
  revenue_streams: any[];
  validation_data: any;
  preferences: string;
  constraints: string;
  industry: string;
  created_at: string;
}

async function getSavedIdeasWithDetails(
  userEmail: string,
): Promise<(SavedIdea & { generated_idea?: GeneratedIdea })[]> {
  const supabase = await createClient();

  // Get saved ideas
  const { data: savedIdeas, error: savedError } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });

  if (savedError) {
    console.error("Error loading saved ideas:", savedError);
    return [];
  }

  if (!savedIdeas || savedIdeas.length === 0) {
    return [];
  }

  // Get the corresponding generated ideas for detailed information
  const ideaIds = savedIdeas.map((idea) => idea.idea_id);
  const { data: generatedIdeas, error: generatedError } = await supabase
    .from("generated_ideas")
    .select("*")
    .in("id", ideaIds);

  if (generatedError) {
    console.error("Error loading generated ideas:", generatedError);
    return savedIdeas;
  }

  // Merge the data
  const mergedIdeas = savedIdeas.map((savedIdea) => {
    const generatedIdea = generatedIdeas?.find(
      (gi) => gi.id === savedIdea.idea_id,
    );
    return {
      ...savedIdea,
      generated_idea: generatedIdea,
    };
  });

  return mergedIdeas;
}

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const isSubscribed = await checkUserSubscription(user.id);
  const savedIdeas = await getSavedIdeasWithDetails(user.email || "");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
      <DashboardNavbar user={user} isSubscribed={isSubscribed} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-3xl font-bold flex items-center gap-3"
                style={{ fontSize: "24px" }}
              >
                <BookOpen className="w-8 h-8 text-black" />
                <span className="md:text-3xl" style={{ fontSize: "24px" }}>
                  Your Ideas Library
                </span>
              </h1>
              <p className="text-gray-600">
                All your saved startup ideas in one place
              </p>
            </div>

            {/* Ideas Grid */}
            <LibraryClient savedIdeas={savedIdeas} />
          </div>
        </div>
      </main>
    </div>
  );
}
