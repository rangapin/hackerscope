import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function FeaturesGrid() {
  const features = [
    {
      title: "AI Powered",
      description:
        "Harness cutting-edge artificial intelligence to generate innovative startup ideas tailored to your interests and market opportunities in real-time.",
    },
    {
      title: "AI Researched",
      description:
        "Every idea is backed by comprehensive AI-driven market research, analyzing trends, competitors, and consumer behavior to ensure viability.",
    },
    {
      title: "AI Validated",
      description:
        "Get instant validation with AI-powered market analysis, target audience insights, and revenue potential assessments for each generated idea.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container-max">
        <div className="mb-8 sm:mb-12 lg:mb-20">
          <h2 className="text-4xl font-light text-black mb-6">
            Why Choose HackerScope AI?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl font-light leading-relaxed">
            We don't just generate ideas – we validate them with real market
            data and provide actionable insights for success.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <h3 className="text-lg font-medium text-black mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
