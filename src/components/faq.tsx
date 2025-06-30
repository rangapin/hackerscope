import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "Why is HackerScope better than just asking ChatGPT?",
      answer:
        "Unlike ChatGPT which relies on training data that can be months or years old, HackerScope uses the EXA API to perform real-time web searches and data validation. This means our startup ideas are based on current market trends, recent consumer behavior shifts, and up-to-date competitor analysis. We don't just generate ideas from static knowledge - we actively research what's happening right now in the market to ensure every suggestion is timely, relevant, and backed by fresh data that reflects today's opportunities.",
    },
    {
      question: "What makes these ideas 'validated'?",
      answer:
        "Each idea comes with market size analysis, target audience research, competitor analysis, and revenue potential assessment. We use real market data from multiple sources to ensure every idea has genuine commercial viability.",
    },
    {
      question: "How accurate are the revenue projections?",
      answer:
        "Our revenue projections are based on similar successful ventures, market size data, and industry benchmarks. While no projection is 100% accurate, our AI provides realistic estimates based on comprehensive market analysis.",
    },
    {
      question: "Can I customize the type of ideas I receive?",
      answer:
        "Yes! Premium users can specify their preferences including industry focus, target market, investment level, and business model preferences. Our AI will tailor ideas to match your specific criteria and expertise. (Premium feature)",
    },
    {
      question: "How often can I generate new ideas?",
      answer:
        "Free users can generate one business idea per email address. Hacker members (€5/month) can generate unlimited ideas with reasonable usage limits: up to 12 ideas per hour and 24 ideas per day. These limits ensure system stability while providing ample access for regular idea exploration.",
    },
    {
      question: "What if I don't like the generated ideas?",
      answer:
        "You can regenerate ideas with different parameters, or refine your preferences to get more targeted suggestions.",
    },
    {
      question: "Why do I sometimes get similar ideas?",
      answer:
        "Our AI generates ideas based on current market trends, emerging technologies, and the filters you've selected. Since these foundational data points remain consistent over short periods, you may occasionally see similar concepts. To increase idea uniqueness, try varying your filter selections, adjusting your industry focus or target market preferences, and generating ideas at different intervals (weekly or monthly). This approach leverages different trend cycles and market conditions, resulting in more diverse and unique startup concepts.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-cream-DEFAULT">
      <div className="container-max">
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <h2 className="section-heading text-black mb-6">
            Frequently Asked Questions
          </h2>
          <p className="body-text text-gray-600 max-w-4xl">
            Everything you need to know about finding your next big opportunity
          </p>
        </div>

        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="space-y-6">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-xl px-6 border border-borderColor-DEFAULT shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className="text-left font-medium text-black hover:text-terracotta-DEFAULT py-6 text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="body-text text-gray-600 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
