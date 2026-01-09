import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Droplets, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  field_area: number;
  health_status: string;
  planting_date: string;
  growth_stage: string;
}

const MyFields = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    crop_type: "",
    field_area: "",
    planting_date: new Date().toISOString().split('T')[0]
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
    loadFields();
  };

  const loadFields = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFields(data);
    }
  };

  const handleAddField = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('crops').insert({
      user_id: session.user.id,
      name: formData.name,
      crop_type: formData.crop_type,
      field_area: parseFloat(formData.field_area),
      planting_date: formData.planting_date,
      health_status: 'healthy',
      growth_stage: 'seedling'
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add field",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Field added successfully"
      });
      setIsDialogOpen(false);
      setFormData({ name: "", crop_type: "", field_area: "", planting_date: new Date().toISOString().split('T')[0] });
      loadFields();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('crops').delete().eq('id', id);
    if (!error) {
      toast({ title: "Field deleted successfully" });
      loadFields();
    }
  };

  const getHealthBadge = (status: string) => {
    const styles = {
      healthy: "bg-primary/20 text-primary",
      warning: "bg-sun/20 text-sun-foreground",
      critical: "bg-destructive/20 text-destructive"
    };
    return <Badge className={styles[status as keyof typeof styles] || styles.healthy}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold">My Fields</h1>
              <p className="text-muted-foreground">Manage all your crops and fields</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Field</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Field Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., North Field A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop_type">Crop Type</Label>
                    <Select value={formData.crop_type} onValueChange={(value) => setFormData({ ...formData, crop_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="corn">Corn</SelectItem>
                        <SelectItem value="rice">Rice</SelectItem>
                        <SelectItem value="soybean">Soybean</SelectItem>
                        <SelectItem value="tomato">Tomato</SelectItem>
                        <SelectItem value="potato">Potato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area">Area (hectares)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.field_area}
                      onChange={(e) => setFormData({ ...formData, field_area: e.target.value })}
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Planting Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.planting_date}
                      onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddField} className="w-full bg-gradient-field">
                    Add Field
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <Card key={field.id} className="border-2 hover:shadow-glow transition-all hover-scale">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{field.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{field.crop_type}</p>
                    </div>
                    {getHealthBadge(field.health_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Area</p>
                      <p className="font-semibold">{field.field_area} ha</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stage</p>
                      <p className="font-semibold capitalize">{field.growth_stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-water/10">
                    <Droplets className="h-5 w-5 text-water" />
                    <div>
                      <p className="text-xs text-muted-foreground">Next Irrigation</p>
                      <p className="text-sm font-semibold">In 4 hours</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No fields added yet</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-field">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Field
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFields;
