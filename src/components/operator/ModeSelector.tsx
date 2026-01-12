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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Choose your path
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Select the experience that matches your role
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
            <CardContent className="p-6 sm:p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  I'm a Leader
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-6 flex-1">
                Senior executive or C-suite leader building AI literacy and decision frameworks for your organization.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>AI literacy diagnostic</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Strategic tension analysis</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
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
            <CardContent className="p-6 sm:p-8 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  I'm an Operator
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-6 flex-1">
                Solopreneur or small business owner running multiple revenue streams. Get one clear AI decision per week.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Weekly build prescription</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Decision advisor for "X or Y" questions</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
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
