import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface SampleResultsDialogProps {
  onStartQuiz: () => void;
  onStartVoice: () => void;
}

export function SampleResultsDialog({ onStartQuiz, onStartVoice }: SampleResultsDialogProps) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const sampleImages = [
    {
      src: "/sample-results/sample-result-1.png",
      alt: "Sample assessment results showing personalized AI leadership insights and dimension scores",
    },
    {
      src: "/sample-results/sample-result-2.png",
      alt: "Sample peer comparison showing how you rank among 102+ AI leaders",
    },
  ];

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5 group-hover:text-primary transition-colors" />
        Sample
      </Button>

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="text-lg font-bold">
              Real Results in Under 5 Minutes
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              See the personalized insights you'll receive
            </DialogDescription>
          </div>

          {/* Carousel */}
          <div className="p-4">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {sampleImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-auto object-contain bg-background"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Arrows */}
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>

            {/* Purple-Themed Dot Indicators */}
            <div className="flex gap-2 justify-center mt-4">
              {sampleImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === current
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-primary/50 w-2"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-4 pb-4 pt-2 border-t bg-muted/30 flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => {
                setOpen(false);
                onStartQuiz();
              }}
              className="flex-1"
            >
              Get Your Results Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onStartVoice();
              }}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              🎙️ Use Voice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
