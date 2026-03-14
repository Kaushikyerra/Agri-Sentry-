import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    generateAIActivities();
  };

  const generateAIActivities = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      // Fetch latest sensor readings
      const sensorResponse = await fetch(`${backendUrl}/sensor-readings/latest`);
      const sensorData = await sensorResponse.json();
      
      // Fetch user profile for crop info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (sensorData.data && Array.isArray(sensorData.data)) {
        const readings = sensorData.data;
        const soilMoisture = readings.find((r: any) => r.sensor_type === 'soil_moisture')?.value;
        const temperature = readings.find((r: any) => r.sensor_type === 'temperature')?.value;
        const humidity = readings.find((r: any) => r.sensor_type === 'humidity')?.value;

        // Generate AI-based activity suggestions
        const aiActivities = [];

        if (soilMoisture !== undefined && soilMoisture < 30) {
          aiActivities.push({
            activity_type: 'irrigation',
            description: `AI Alert: Soil moisture is ${soilMoisture}%. Irrigation recommended to maintain optimal moisture levels.`,
            activity_date: new Date().toISOString()
          });
        }

        if (temperature !== undefined && temperature > 40) {
          aiActivities.push({
            activity_type: 'maintenance',
            description: `AI Alert: Temperature is ${temperature}°C. High temperature detected. Consider providing shade or increasing irrigation frequency.`,
            activity_date: new Date().toISOString()
          });
        }

        if (humidity !== undefined && humidity < 40) {
          aiActivities.push({
            activity_type: 'pest_control',
            description: `AI Alert: Humidity is ${humidity}%. Low humidity may increase pest activity. Monitor crops closely.`,
            activity_date: new Date().toISOString()
          });
        }

        // Insert AI-generated activities
        for (const activity of aiActivities) {
          const { data: existing } = await supabase
            .from('farmer_activities')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('activity_type', activity.activity_type)
            .eq('activity_date', activity.activity_date.split('T')[0])
            .single();

          if (!existing) {
            await supabase.from('farmer_activities').insert({
              user_id: session.user.id,
              ...activity
            });
          }
        }
      }
    } catch (error) {
      console.log('AI activity generation error:', error);
    }
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
        title: t('error'),
        description: t('loading'),
        variant: "destructive"
      });
    } else {
      toast({
        title: t('success'),
        description: t('loading')
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
                {t('back')}
              </Button>
              <h1 className="text-4xl font-bold">{t('activityLogTitle')}</h1>
              <p className="text-muted-foreground">{t('viewAllFarmActivities')}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('logIrrigationActivity')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="type">{t('activityType')}</Label>
                    <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectField')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="irrigation">{t('irrigation')}</SelectItem>
                        <SelectItem value="fertilization">{t('fertilization')}</SelectItem>
                        <SelectItem value="planting">{t('addField')}</SelectItem>
                        <SelectItem value="harvesting">{t('harvesting')}</SelectItem>
                        <SelectItem value="pest_control">{t('pestControl')}</SelectItem>
                        <SelectItem value="maintenance">{t('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">{t('notes')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('notesPlaceholder')}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">{t('date')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddActivity} className="w-full bg-gradient-field">
                    {t('logIrrigationButton')}
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
              <p className="text-muted-foreground mb-4">{t('noActivities')}</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-field">
                <Plus className="h-4 w-4 mr-2" />
                {t('add')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
