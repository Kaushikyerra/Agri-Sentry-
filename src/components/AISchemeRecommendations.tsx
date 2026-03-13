import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ExternalLink, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Scheme {
  id: string;
  name: string;
  name_hi: string;
  description: string;
  description_hi: string;
  category: string;
  benefit_amount: number;
  eligibility: string;
  official_link: string;
}

export const AISchemeRecommendations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchSchemes();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('government_schemes')
        .select('*')
        .limit(6);

      if (error) throw error;
      setSchemes(data || []);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceScore = (scheme: Scheme): number => {
    // Simple AI-like scoring based on user profile
    let score = 50; // Base score

    if (userProfile) {
      // Boost score based on crop type
      if (scheme.description.toLowerCase().includes(userProfile.primary_crop?.toLowerCase())) {
        score += 30;
      }

      // Boost subsidy schemes
      if (scheme.category === 'subsidy') {
        score += 20;
      }
    }

    return Math.min(score, 100);
  };

  const getSortedSchemes = () => {
    return schemes
      .map(scheme => ({
        ...scheme,
        relevance: getRelevanceScore(scheme)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3); // Top 3 recommendations
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      subsidy: 'bg-green-100 text-green-700',
      insurance: 'bg-blue-100 text-blue-700',
      loan: 'bg-purple-100 text-purple-700',
      service: 'bg-orange-100 text-orange-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getLocalizedField = (scheme: Scheme, field: 'name' | 'description') => {
    const langCode = i18n.language;
    
    // Map language codes to database field suffixes
    const langMap: { [key: string]: string } = {
      'hi': '_hi',
      'te': '_te',
      'ta': '_ta',
      'ml': '_ml',
      'kn': '_kn',
      'pa': '_pa',
    };

    const suffix = langMap[langCode] || '';
    const localizedField = `${field}${suffix}` as keyof Scheme;
    
    // Return localized field if it exists and has content, otherwise return English
    return (scheme[localizedField] as string) || scheme[field];
  };

  if (loading) {
    return (
      <Card className="border-2 border-purple-100">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendedSchemes = getSortedSchemes();

  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Sparkles className="w-5 h-5" />
          {t('aiRecommendedSchemes')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendedSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="p-4 bg-white rounded-lg border border-purple-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-800">
                    {getLocalizedField(scheme, 'name')}
                  </h4>
                  <Badge className={getCategoryColor(scheme.category)}>
                    {scheme.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {getLocalizedField(scheme, 'description')}
                </p>
              </div>
              <div className="flex items-center gap-1 text-purple-600 ml-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">{scheme.relevance}%</span>
              </div>
            </div>

            {scheme.benefit_amount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">
                  ₹{scheme.benefit_amount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {scheme.official_link && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => window.open(scheme.official_link, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('learnMore')}
              </Button>
            )}
          </div>
        ))}

        {recommendedSchemes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('noSchemesAvailable')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
