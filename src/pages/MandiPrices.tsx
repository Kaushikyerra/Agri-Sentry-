import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, TrendingUp, IndianRupee, MapPin } from "lucide-react";
import { api, MandiPrice, PredictionResult } from "@/services/api";

const MandiPrices = () => {
    const [prices, setPrices] = useState<MandiPrice[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchState, setSearchState] = useState("");
    const [searchDistrict, setSearchDistrict] = useState("");
    const { toast } = useToast();

    // Prediction Form State
    const [predState, setPredState] = useState("");
    const [predDistrict, setPredDistrict] = useState("");
    const [predMarket, setPredMarket] = useState("");
    const [predCommodity, setPredCommodity] = useState("");
    const [predVariety, setPredVariety] = useState("");
    const [predGrade, setPredGrade] = useState("FAQ");
    const [predSoil, setPredSoil] = useState(""); // New field
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [locating, setLocating] = useState(false);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const data = await api.getMandiPrices(searchState, searchDistrict);
            setPrices(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch market prices. Make sure the backend is running.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();

        // Try to pre-fill from user profile
        const fetchProfile = async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("location")
                    .eq("id", user.id)
                    .single();

                if (profile?.location) {
                    // Assuming location might be "District, State" or just "State"
                    // This is a simple heuristic
                    const parts = profile.location.split(",").map(s => s.trim());
                    if (parts.length === 2) {
                        setPredDistrict(parts[0]);
                        setPredState(parts[1]);
                        setSearchDistrict(parts[0]);
                        setSearchState(parts[1]);
                    } else {
                        setPredState(profile.location);
                        setSearchState(profile.location);
                    }
                }
            }
        };
        fetchProfile();
    }, []);

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        setPredictionLoading(true);
        try {
            const data = await api.predictPrice({
                state: predState,
                district: predDistrict,
                market: predMarket,
                commodity: predCommodity,
                variety: predVariety,
                grade: predGrade
            });
            setPredictions(data.predictions);
            toast({
                title: "Success",
                description: `Prediction generated for ${data.commodity} in ${data.market}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not generate prediction. Check input details.",
                variant: "destructive",
            });
        } finally {
            setPredictionLoading(false);
        }
    };

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
                // Reverse geocoding using OpenStreetMap Nominatim API (Free)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                );
                const data = await response.json();

                if (data.address) {
                    setPredState(data.address.state || "");
                    setPredDistrict(data.address.county || data.address.district || "");
                    // Also update search fields
                    setSearchState(data.address.state || "");
                    setSearchDistrict(data.address.county || data.address.district || "");

                    toast({
                        title: "Location Detected",
                        description: `Detected: ${data.address.county || data.address.district}, ${data.address.state}`,
                    });
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to detect location details",
                    variant: "destructive",
                });
            } finally {
                setLocating(false);
            }
        }, () => {
            toast({
                title: "Error",
                description: "Unable to retrieve your location",
                variant: "destructive",
            });
            setLocating(false);
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20 px-4 pb-8 container mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                        <IndianRupee className="h-8 w-8 text-primary" />
                        Mandi Prices & Prediction
                    </h1>
                    <p className="text-muted-foreground">Real-time market rates and AI-powered price forecasts.</p>
                </div>

                <Tabs defaultValue="prices" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="prices">Live Market Prices</TabsTrigger>
                        <TabsTrigger value="predict">Price Prediction</TabsTrigger>
                    </TabsList>

                    <TabsContent value="prices">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Market Prices</CardTitle>
                                <CardDescription>Latest arrivals and modal prices from mandis across India.</CardDescription>
                                <div className="flex gap-4 mt-4 flex-wrap">
                                    <Input
                                        placeholder="Filter by State"
                                        value={searchState}
                                        onChange={(e) => setSearchState(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Input
                                        placeholder="Filter by District"
                                        value={searchDistrict}
                                        onChange={(e) => setSearchDistrict(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Button onClick={fetchPrices} disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                        Filter
                                    </Button>
                                    <Button variant="outline" onClick={handleGeolocation} disabled={locating}>
                                        {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                        Use My Location
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>State</TableHead>
                                                <TableHead>District</TableHead>
                                                <TableHead>Market</TableHead>
                                                <TableHead>Commodity</TableHead>
                                                <TableHead>Variety</TableHead>
                                                <TableHead className="text-right">Price (₹/Qtl)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {prices.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        {loading ? "Loading data..." : "No data found. Try adjusting filters or check backend connection."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                prices.map((price, idx) => (
                                                    <TableRow key={`${price.id}-${idx}`}>
                                                        <TableCell>{price.arrival_date}</TableCell>
                                                        <TableCell>{price.state}</TableCell>
                                                        <TableCell>{price.district}</TableCell>
                                                        <TableCell>{price.market}</TableCell>
                                                        <TableCell className="font-medium">{price.commodity}</TableCell>
                                                        <TableCell>{price.variety}</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">₹{price.modal_price}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="predict">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Predict Future Prices</CardTitle>
                                    <CardDescription>Enter crop details to get a 7-day price forecast.</CardDescription>
                                    <Button variant="outline" size="sm" onClick={handleGeolocation} disabled={locating} className="w-fit mt-2">
                                        {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                        Auto-Detect Location
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handlePredict} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>State</Label>
                                                <Input required placeholder="e.g. Assam" value={predState} onChange={e => setPredState(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>District</Label>
                                                <Input required placeholder="e.g. Nagaon" value={predDistrict} onChange={e => setPredDistrict(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Soil Type</Label>
                                                <Input placeholder="e.g. Alluvial" value={predSoil} onChange={e => setPredSoil(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Market</Label>
                                                <Input required placeholder="e.g. Dhing APMC" value={predMarket} onChange={e => setPredMarket(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Commodity</Label>
                                                <Input required placeholder="e.g. Jute" value={predCommodity} onChange={e => setPredCommodity(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Variety</Label>
                                                <Input required placeholder="e.g. TD-5" value={predVariety} onChange={e => setPredVariety(e.target.value)} />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={predictionLoading}>
                                            {predictionLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Analyzing Trends...
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    Predict Prices
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Forecast Results</CardTitle>
                                    <CardDescription>Expected modal prices for the next 7 days.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {predictions.length > 0 ? (
                                        <div className="space-y-4">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead className="text-right">Predicted Price</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {predictions.map((pred, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{pred.date}</TableCell>
                                                            <TableCell className="text-right font-bold text-green-600">₹{pred.predicted_price}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <p className="text-xs text-muted-foreground text-center mt-4">
                                                *Predictions are based on historical data and current market trends.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-lg">
                                            <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                                            <p>Enter details to view predictions</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default MandiPrices;
