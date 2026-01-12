import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

interface ModeSelectorProps {
  onSelectLeader: () => void;
  onSelectOperator: () => void;
}

export function ModeSelector({ onSelectLeader, onSelectOperator }: ModeSelectorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 sm:space-y-6 h-full flex flex-col">
      <div className="text-center mb-3 sm:mb-8 flex-shrink-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
          How do you want to use AI?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Two paths, both designed for leaders who need real results—not theory
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 flex-1 min-h-0">
        {/* Leader Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card 
            className="h-full cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            onClick={onSelectLeader}
          >
            <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  I'm a Leader
                </h3>
              </div>
              
              <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-6 flex-1">
                Know where you stand. See your blind spots. Get boardroom-ready frameworks in 2 minutes.
              </p>

              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-6 flex-shrink-0">
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>AI literacy diagnostic</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Strategic tension analysis</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Boardroom-ready frameworks</span>
                </div>
              </div>

              <Button 
                className="w-full mt-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLeader();
                }}
              >
                Start Leader Path
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Operator Path */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card 
            className="h-full cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg border-primary/20"
            onClick={onSelectOperator}
          >
            <CardContent className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  I'm an Operator
                </h3>
              </div>
              
              <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-6 flex-1">
                One clear decision per week. Personalized to your business mix. No fluff—just your next move.
              </p>

              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-6 flex-shrink-0">
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Weekly build prescription</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Decision advisor for "X or Y" questions</span>
                </div>
                <div className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Personalized to your business mix</span>
                </div>
              </div>

              <Button 
                className="w-full mt-auto"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOperator();
                }}
              >
                Start Operator Path
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
