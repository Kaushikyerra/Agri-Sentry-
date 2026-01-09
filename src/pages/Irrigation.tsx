import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Droplets, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";

interface IrrigationLog {
  id: string;
  crop_id: string;
  amount_liters: number;
  irrigation_date: string;
  notes: string | null;
}

interface Crop {
  id: string;
  name: string;
  crop_type: string;
}

const Irrigation = () => {
  const [logs, setLogs] = useState<IrrigationLog[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop_id: "",
    amount_liters: "",
    notes: "",
    irrigation_date: new Date().toISOString().split('T')[0]
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
      .from('irrigation_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('irrigation_date', { ascending: false })
      .limit(10);

    if (cropsData) setCrops(cropsData);
    if (logsData) setLogs(logsData);
  };

  const handleAddLog = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('irrigation_logs').insert({
      user_id: session.user.id,
      crop_id: formData.crop_id || null,
      amount_liters: parseFloat(formData.amount_liters),
      irrigation_date: new Date(formData.irrigation_date).toISOString(),
      notes: formData.notes || null
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log irrigation",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Irrigation logged successfully"
      });
      setIsDialogOpen(false);
      setFormData({ crop_id: "", amount_liters: "", notes: "", irrigation_date: new Date().toISOString().split('T')[0] });
      loadData();
    }
  };

  const getCropName = (cropId: string) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.name : "Unknown Field";
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
              <h1 className="text-4xl font-bold">Irrigation Management</h1>
              <p className="text-muted-foreground">Track water usage and schedule irrigation</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Irrigation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Irrigation Activity</DialogTitle>
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
                    <Label htmlFor="amount">Water Amount (liters)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount_liters}
                      onChange={(e) => setFormData({ ...formData, amount_liters: e.target.value })}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.irrigation_date}
                      onChange={(e) => setFormData({ ...formData, irrigation_date: e.target.value })}
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
                    Log Irrigation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Smart Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="border-2 border-water/30 bg-water/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-water" />
                  Smart Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-card">
                  <AlertCircle className="h-5 w-5 text-water mt-1" />
                  <div>
                    <p className="font-semibold">Soil moisture low</p>
                    <p className="text-sm text-muted-foreground">Irrigate fields in next 2 hours for optimal crop health</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Soil Moisture Level</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-muted-foreground">Target: 70-80%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Water Usage (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="font-stats text-4xl font-bold text-water">
                      {logs.slice(0, 7).reduce((sum, log) => sum + log.amount_liters, 0).toLocaleString()} L
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Total water used</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{logs.slice(0, 7).length}</p>
                      <p className="text-xs text-muted-foreground">Irrigation events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {logs.length > 0 ? Math.round(logs.slice(0, 7).reduce((sum, log) => sum + log.amount_liters, 0) / logs.slice(0, 7).length).toLocaleString() : 0} L
                      </p>
                      <p className="text-xs text-muted-foreground">Avg per event</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Irrigation History */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Recent Irrigation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-water/20">
                        <Droplets className="h-5 w-5 text-water" />
                      </div>
                      <div>
                        <p className="font-semibold">{getCropName(log.crop_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.irrigation_date).toLocaleDateString()}
                        </p>
                        {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-stats text-xl font-bold text-water">{log.amount_liters.toLocaleString()} L</p>
                    </div>
                  </div>
                ))}
              </div>
              {logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Droplets className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No irrigation logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Irrigation;
