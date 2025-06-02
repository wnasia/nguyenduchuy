
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle, Calendar } from "lucide-react";

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  post_id: string;
  reporter_id: string;
  posts?: {
    title: string;
    content: string;
  } | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const AdminReports = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        toast({
          title: "Error",
          description: "Failed to load reports",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch related data separately for each report
      const reportsWithDetails = await Promise.all(
        (reportsData || []).map(async (report) => {
          // Fetch reporter profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', report.reporter_id)
            .single();

          // Fetch post details
          const { data: postData } = await supabase
            .from('posts')
            .select('title, content')
            .eq('id', report.post_id)
            .single();

          return {
            ...report,
            profiles: profileData,
            posts: postData
          };
        })
      );

      setReports(reportsWithDetails);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report status:', error);
        toast({
          title: "Error",
          description: "Failed to update report status",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Report ${newStatus} successfully`,
        });
        fetchReports(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'dismissed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports Management</CardTitle>
        <CardDescription>Review and manage user reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                    {report.reason}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Reported by {report.profiles?.full_name || 'Unknown User'} ({report.profiles?.email || 'No email'})
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(report.status)}>
                  {report.status}
                </Badge>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-gray-600">{report.description || 'No description provided'}</p>
              </div>
              
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reported Post:</p>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">{report.posts?.title || 'Post not found'}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {report.posts?.content || 'No content available'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1 h-4 w-4" />
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
                
                {report.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {reports.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReports;
