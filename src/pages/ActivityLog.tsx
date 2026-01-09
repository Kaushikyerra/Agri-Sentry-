import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Droplets, FlaskConical, Scissors, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  activity_date: string;
  feedback_rating: number | null;
}

const ActivityLog = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "",
    description: "",
    activity_date: new Date().toISOString().split('T')[0]
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
    loadActivities();
  };

  const loadActivities = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('farmer_activities')
      .select('*')
      .eq('user_id', session.user.id)
      .order('activity_date', { ascending: false });

    if (!error && data) {
      setActivities(data);
    }
  };

  const handleAddActivity = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('farmer_activities').insert({
      user_id: session.user.id,
      activity_type: formData.activity_type,
      description: formData.description,
      activity_date: new Date(formData.activity_date).toISOString()
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Activity logged successfully"
      });
      setIsDialogOpen(false);
      setFormData({ activity_type: "", description: "", activity_date: new Date().toISOString().split('T')[0] });
      loadActivities();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return Droplets;
      case 'fertilization': return FlaskConical;
      case 'harvesting': return Scissors;
      default: return Calendar;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'irrigation': return 'text-water';
      case 'fertilization': return 'text-fertilizer';
      case 'harvesting': return 'text-primary';
      default: return 'text-secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold">Activity Log</h1>
              <p className="text-muted-foreground">Track all your farming activities</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="type">Activity Type</Label>
                    <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="irrigation">Irrigation</SelectItem>
                        <SelectItem value="fertilization">Fertilization</SelectItem>
                        <SelectItem value="planting">Planting</SelectItem>
                        <SelectItem value="harvesting">Harvesting</SelectItem>
                        <SelectItem value="pest_control">Pest Control</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the activity..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddActivity} className="w-full bg-gradient-field">
                    Log Activity
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const color = getActivityColor(activity.activity_type);
              
              return (
                <Card key={activity.id} className="border-2 hover:shadow-glow transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold capitalize">{activity.activity_type.replace('_', ' ')}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(activity.activity_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {activities.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No activities logged yet</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-field">
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Activity
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
