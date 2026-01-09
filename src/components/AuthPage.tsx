import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sprout, MapPin, Loader2 } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // New Fields
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [soilType, setSoilType] = useState("");
  const [primaryCrop, setPrimaryCrop] = useState("");
  const [season, setSeason] = useState("");

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
        );
        const data = await response.json();
        if (data.address) {
          const locString = `${data.address.county || data.address.district || ""}, ${data.address.state || ""}`;
          setLocation(locString);
          toast({ title: "Location Detected", description: locString });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to detect location", variant: "destructive" });
      } finally {
        setLocating(false);
      }
    }, () => {
      setLocating(false);
      toast({ title: "Error", description: "Unable to retrieve location", variant: "destructive" });
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully logged in to your farm dashboard.",
        });
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              location: location,
              soil_type: soilType,
              primary_crop: primaryCrop,
              season: season,
              phone: phone,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to AgroAdvisor. You can now start managing your farm.",
        });
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-earth p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-field rounded-full">
              <Sprout className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-montserrat">
            {isLogin ? "Welcome Back" : "Join AgroAdvisor"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to access your smart farming dashboard"
              : "Create an account to start smart farming"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Farmer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Soil Type</Label>
                    <Select value={soilType} onValueChange={setSoilType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Soil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alluvial">Alluvial</SelectItem>
                        <SelectItem value="Black">Black</SelectItem>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Laterite">Laterite</SelectItem>
                        <SelectItem value="Arid">Arid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Season</Label>
                    <Select value={season} onValueChange={setSeason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Season" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kharif">Kharif</SelectItem>
                        <SelectItem value="Rabi">Rabi</SelectItem>
                        <SelectItem value="Zaid">Zaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Crop</Label>
                  <Input value={primaryCrop} onChange={e => setPrimaryCrop(e.target.value)} placeholder="e.g. Wheat, Rice" />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number (Optional)</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex gap-2">
                    <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="District, State" />
                    <Button type="button" variant="outline" size="icon" onClick={handleGeolocation} disabled={locating}>
                      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-field hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
