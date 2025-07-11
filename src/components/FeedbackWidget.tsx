"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@formspree/react";
import { MessageCircle, X, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";

interface FeedbackWidgetProps {
  formId?: string;
}

export default function FeedbackWidget({
  formId = "xldnqpvl",
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, handleSubmit] = useForm(formId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<
    "forward" | "backward"
  >("forward");
  const [formData, setFormData] = useState({
    email: "",
    message: "",
    ideaQuality: "",
    upgradeBarriers: [] as string[],
    improvementSuggestions: "",
    additionalComments: "",
  });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [ideaQuality, setIdeaQuality] = useState("");
  const [upgradeBarriers, setUpgradeBarriers] = useState<string[]>([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form state when modal closes
  const resetFormState = () => {
    setCurrentStep(0);
    setIsTransitioning(false);
    setTransitionDirection("forward");
    setFormData({
      email: "",
      message: "",
      ideaQuality: "",
      upgradeBarriers: [],
      improvementSuggestions: "",
      additionalComments: "",
    });
    setEmail("");
    setMessage("");
    setIdeaQuality("");
    setUpgradeBarriers([]);
    setImprovementSuggestions("");
    setAdditionalComments("");
    setErrors({});
  };

  // Handle modal close with form reset
  const handleModalClose = () => {
    setIsOpen(false);
    resetFormState();
  };

  // Auto-close modal after successful submission
  useEffect(() => {
    if (state.succeeded) {
      const timer = setTimeout(() => {
        handleModalClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.succeeded]);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setIsTransitioning(true);
      setTransitionDirection("forward");
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 0:
        return !formData.ideaQuality;
      case 1:
        return formData.upgradeBarriers.length === 0;
      case 2:
        return !formData.improvementSuggestions.trim();
      case 3:
        return false; // Both fields are optional
      default:
        return false;
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTransitionDirection("backward");
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Also update individual state for backward compatibility
    switch (field) {
      case "ideaQuality":
        setIdeaQuality(value as string);
        break;
      case "upgradeBarriers":
        setUpgradeBarriers(value as string[]);
        break;
      case "improvementSuggestions":
        setImprovementSuggestions(value as string);
        break;
      case "additionalComments":
        setAdditionalComments(value as string);
        break;
      case "message":
        setMessage(value as string);
        break;
      case "email":
        setEmail(value as string);
        break;
    }
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentSelections = formData.upgradeBarriers;
    let newSelections: string[];

    if (checked) {
      newSelections = [...currentSelections, option];
    } else {
      newSelections = currentSelections.filter((item) => item !== option);
    }

    updateFormData("upgradeBarriers", newSelections);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // No validation needed since all fields are optional

    await handleSubmit(e);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Did the free idea you received meet your expectations?
            </label>
            <div className="space-y-0.5">
              {[
                "Yes, it was exactly what I was looking for",
                "It was okay, but not super actionable",
                "No, it didn't feel useful",
                "I didn't get a free idea yet",
              ].map((option) => (
                <label
                  key={option}
                  className="flex items-center p-0.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="idea_quality"
                    value={option}
                    checked={formData.ideaQuality === option}
                    onChange={(e) =>
                      updateFormData("ideaQuality", e.target.value)
                    }
                    className="w-4 h-4 accent-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 ml-2">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              What's stopping you from upgrading to unlimited ideas?
            </label>
            <div className="space-y-0.5">
              {[
                "I want to see more free ideas first",
                "The price is too high for me right now",
                "I don't understand what I get with premium",
                "The first idea didn't feel valuable",
                "I'm just browsing for inspiration",
                "I might upgrade later, just not now",
              ].map((option) => (
                <label
                  key={option}
                  className="flex items-center p-0.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    name="upgrade_barriers[]"
                    value={option}
                    checked={formData.upgradeBarriers.includes(option)}
                    onChange={(e) =>
                      handleCheckboxChange(option, e.target.checked)
                    }
                    className="w-4 h-4 accent-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 ml-2">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <label
              htmlFor="improvement_suggestions"
              className="block text-sm font-medium text-gray-900 mb-3"
            >
              What would make HackerScope more useful to you?
            </label>
            <Textarea
              id="improvement_suggestions"
              name="improvement_suggestions"
              value={formData.improvementSuggestions}
              onChange={(e) =>
                updateFormData("improvementSuggestions", e.target.value)
              }
              placeholder="e.g. more niche ideas, MVP guides, trends, monetization tips…"
              rows={3}
              className="w-full resize-none"
            />
          </div>
        );
      case 3:
        return (
          <div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email (optional)
              </label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="your@email.com"
                className="w-full"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white hover:bg-gray-800 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Sidebar Widget */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 max-h-[400px] bg-white shadow-2xl rounded-lg border border-gray-200 z-40 animate-in slide-in-from-right duration-300 pb-3">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              {state.succeeded ? "Thank you" : "Help us improve HackerScope AI"}
            </h2>
            <Button
              onClick={handleModalClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Container */}
          <div className="px-3">
            {state.succeeded ? (
              <div className="text-center py-12 px-6 bg-white">
                <div className="text-lg font-medium text-gray-900">
                  We've received your feedback and will use it to make
                  HackerScope AI even better
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress Indicator */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1 mt-3">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-0.5">
                    <div
                      className="bg-black h-0.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentStep + 1) / totalSteps) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-3">
                  {/* Hidden inputs for previous step data */}
                  {currentStep === 3 && (
                    <>
                      <input
                        type="hidden"
                        name="idea_quality"
                        value={formData.ideaQuality}
                      />
                      {formData.upgradeBarriers.map((barrier, index) => (
                        <input
                          key={index}
                          type="hidden"
                          name="upgrade_barriers[]"
                          value={barrier}
                        />
                      ))}
                      <input
                        type="hidden"
                        name="improvement_suggestions"
                        value={formData.improvementSuggestions}
                      />
                    </>
                  )}

                  {/* Current Step Content */}
                  <div className="min-h-[100px] relative">
                    <div
                      key={currentStep}
                      className={`transition-all duration-300 ease-in-out ${
                        isTransitioning
                          ? transitionDirection === "forward"
                            ? "transform translate-x-full opacity-0"
                            : "transform -translate-x-full opacity-0"
                          : "transform translate-x-0 opacity-100"
                      }`}
                    >
                      {renderCurrentStep()}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleModalClose}
                        className="text-gray-500 hover:text-gray-700 bg-transparent text-sm px-3 py-2"
                      >
                        Cancel
                      </Button>

                      {currentStep < totalSteps - 1 ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={isNextDisabled()}
                          className="bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={state.submitting}
                          className="bg-black text-white px-3 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                          {state.submitting ? "Sending..." : "Send Feedback"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {state.errors && state.errors.length > 0 && (
                    <div className="text-red-600 text-sm mt-2">
                      There was an error sending your feedback. Please try
                      again.
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
