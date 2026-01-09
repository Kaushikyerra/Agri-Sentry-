import { Button } from "@/components/ui/button";
import { Cloud, Droplets, Sprout, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import farmHero from "@/assets/farm-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={farmHero} 
          alt="Agricultural farmland" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="animate-fade-in space-y-6 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            <span className="text-gradient-earth">Smart Agriculture</span>
            <br />
            <span className="text-foreground">Advisory System</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered farming assistant providing real-time weather forecasts, crop monitoring, 
            and intelligent irrigation recommendations for optimal yields
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 shadow-glow group"
              onClick={() => navigate('/weather')}
            >
              <Cloud className="mr-2 h-5 w-5 group-hover:animate-float" />
              Check Weather
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground group"
              onClick={() => navigate('/my-fields')}
            >
              <Sprout className="mr-2 h-5 w-5 group-hover:animate-grow" />
              View Crops
            </Button>
            <Button 
              size="lg" 
              className="bg-water hover:bg-water/90 group"
              onClick={() => navigate('/advisor')}
            >
              <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Ask Advisor
            </Button>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 max-w-3xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-medium hover:shadow-glow transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-water animate-ripple" />
                <span className="text-sm font-semibold text-muted-foreground">Today's Status</span>
              </div>
              <p className="font-stats text-2xl font-bold text-primary">Optimal</p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-medium hover:shadow-glow transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Cloud className="h-5 w-5 text-accent animate-float" />
                <span className="text-sm font-semibold text-muted-foreground">Weather Alert</span>
              </div>
              <p className="font-stats text-2xl font-bold text-accent">Sunny 28°C</p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-medium hover:shadow-glow transition-shadow">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sprout className="h-5 w-5 text-primary animate-grow" />
                <span className="text-sm font-semibold text-muted-foreground">Active Crops</span>
              </div>
              <p className="font-stats text-2xl font-bold text-primary">5 Fields</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;
