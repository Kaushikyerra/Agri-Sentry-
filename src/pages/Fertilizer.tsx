import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, FlaskConical, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface FertilizerLog {
  id: string;
  crop_id: string;
  fertilizer_type: string;
  amount_kg: number;
  application_date: string;
  notes: string | null;
}

interface Crop {
  id: string;
  name: string;
  crop_type: string;
}

const Fertilizer = () => {
  const [logs, setLogs] = useState<FertilizerLog[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop_id: "",
    fertilizer_type: "",
    amount_kg: "",
    notes: "",
    application_date: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: cropsData } = await supabase
      .from('crops')
      .select('id, name, crop_type')
      .eq('user_id', session.user.id);

    const { data: logsData } = await supabase
      .from('fertilization_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('application_date', { ascending: false })
      .limit(10);

    if (cropsData) setCrops(cropsData);
    if (logsData) setLogs(logsData);
  };

  const handleAddLog = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('fertilization_logs').insert({
      user_id: session.user.id,
      crop_id: formData.crop_id || null,
      fertilizer_type: formData.fertilizer_type,
      amount_kg: parseFloat(formData.amount_kg),
      application_date: new Date(formData.application_date).toISOString(),
      notes: formData.notes || null
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log fertilization",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Fertilization logged successfully"
      });
      setIsDialogOpen(false);
      setFormData({ crop_id: "", fertilizer_type: "", amount_kg: "", notes: "", application_date: new Date().toISOString().split('T')[0] });
      loadData();
    }
  };

  const getCropName = (cropId: string) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.name : "Unknown Field";
  };

  const getFertilizerColor = (type: string) => {
    if (type.toLowerCase().includes('nitrogen')) return 'bg-primary/20 text-primary';
    if (type.toLowerCase().includes('phosphorus')) return 'bg-fertilizer/20 text-fertilizer';
    if (type.toLowerCase().includes('potassium')) return 'bg-secondary/20 text-secondary';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold">Fertilizer Management</h1>
              <p className="text-muted-foreground">Track nutrient application and optimize crop growth</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Fertilizer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Fertilizer Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="crop">Field (Optional)</Label>
                    <Select value={formData.crop_id} onValueChange={(value) => setFormData({ ...formData, crop_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {crops.map(crop => (
                          <SelectItem key={crop.id} value={crop.id}>{crop.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Fertilizer Type</Label>
                    <Select value={formData.fertilizer_type} onValueChange={(value) => setFormData({ ...formData, fertilizer_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fertilizer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nitrogen">Nitrogen (N)</SelectItem>
                        <SelectItem value="phosphorus">Phosphorus (P)</SelectItem>
                        <SelectItem value="potassium">Potassium (K)</SelectItem>
                        <SelectItem value="npk">NPK Complex</SelectItem>
                        <SelectItem value="organic">Organic Compost</SelectItem>
                        <SelectItem value="micronutrients">Micronutrients</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (kg)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount_kg}
                      onChange={(e) => setFormData({ ...formData, amount_kg: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Application Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.application_date}
                      onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes..."
                    />
                  </div>
                  <Button onClick={handleAddLog} className="w-full bg-gradient-field">
                    Log Fertilizer Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Smart Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-2 border-fertilizer/30 bg-fertilizer/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-fertilizer" />
                  Smart Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                  <CalendarIcon className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Add Nitrogen fertilizer in 2 days</p>
                    <p className="text-sm text-muted-foreground">Your wheat crops are entering flowering stage and need nutrient boost</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                  <AlertTriangle className="h-5 w-5 text-sun mt-1" />
                  <div>
                    <p className="font-semibold">Weather alert</p>
                    <p className="text-sm text-muted-foreground">Rain forecast Wednesday - apply fertilizer before or wait until Friday</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  Recent Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="font-stats text-4xl font-bold text-fertilizer">
                      {logs.slice(0, 7).reduce((sum, log) => sum + log.amount_kg, 0)} kg
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{logs.slice(0, 7).length}</p>
                      <p className="text-xs text-muted-foreground">Applications</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {logs.length > 0 ? Math.round(logs.slice(0, 7).reduce((sum, log) => sum + log.amount_kg, 0) / logs.slice(0, 7).length) : 0} kg
                      </p>
                      <p className="text-xs text-muted-foreground">Avg per event</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fertilization History */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Application History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-fertilizer/20">
                        <FlaskConical className="h-5 w-5 text-fertilizer" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{getCropName(log.crop_id)}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getFertilizerColor(log.fertilizer_type)}`}>
                            {log.fertilizer_type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.application_date).toLocaleDateString()}
                        </p>
                        {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-stats text-xl font-bold text-fertilizer">{log.amount_kg} kg</p>
                    </div>
                  </div>
                ))}
              </div>
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No fertilization logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Fertilizer;
