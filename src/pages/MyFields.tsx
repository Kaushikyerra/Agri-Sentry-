import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        title: t('error'),
        description: t('fieldAddError'),
        variant: "destructive"
      });
    } else {
      toast({
        title: t('success'),
        description: t('fieldAddedSuccess')
      });
      setIsDialogOpen(false);
      setFormData({ name: "", crop_type: "", field_area: "", planting_date: new Date().toISOString().split('T')[0] });
      loadFields();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('crops').delete().eq('id', id);
    if (!error) {
      toast({ title: t('fieldDeletedSuccess') });
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
                {t('backToDashboard')}
              </Button>
              <h1 className="text-4xl font-bold">{t('myFieldsTitle')}</h1>
              <p className="text-muted-foreground">{t('manageFieldsDescription')}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-field">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addField')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('addNewField')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">{t('fieldName')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('fieldNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="crop_type">{t('cropType')}</Label>
                    <Select value={formData.crop_type} onValueChange={(value) => setFormData({ ...formData, crop_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCropType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wheat">{t('wheat')}</SelectItem>
                        <SelectItem value="corn">{t('corn')}</SelectItem>
                        <SelectItem value="rice">{t('rice')}</SelectItem>
                        <SelectItem value="soybean">{t('soybean')}</SelectItem>
                        <SelectItem value="tomato">{t('tomato')}</SelectItem>
                        <SelectItem value="potato">{t('potato')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area">{t('area')}</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.field_area}
                      onChange={(e) => setFormData({ ...formData, field_area: e.target.value })}
                      placeholder={t('areaPlaceholder')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">{t('plantingDate')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.planting_date}
                      onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddField} className="w-full bg-gradient-field">
                    {t('addFieldButton')}
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
                      <p className="text-muted-foreground">{t('area')}</p>
                      <p className="font-semibold">{field.field_area} ha</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('stage')}</p>
                      <p className="font-semibold capitalize">{field.growth_stage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-water/10">
                    <Droplets className="h-5 w-5 text-water" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('nextIrrigation')}</p>
                      <p className="text-sm font-semibold">{t('nextIrrigationIn')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-2" />
                      {t('edit')}
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
              <p className="text-muted-foreground mb-4">{t('noFieldsAdded')}</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-field">
                <Plus className="h-4 w-4 mr-2" />
                {t('addYourFirstField')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFields;
