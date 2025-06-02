
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  total_earned: number;
}

const UserWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return;

      try {
        // Fetch wallet data
        const { data: walletData, error: walletError } = await supabase
          .from('wallet')
          .select('balance, total_earned')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('Error fetching wallet:', walletError);
          toast({
            title: "Error",
            description: "Failed to load wallet data",
            variant: "destructive",
          });
        } else {
          setWallet(walletData);
        }

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          toast({
            title: "Error",
            description: "Failed to load transaction history",
            variant: "destructive",
          });
        } else {
          setTransactions(transactionsData || []);
        }
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

    fetchWalletData();
  }, [user, toast]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'topup':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning':
      case 'topup':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
          <CardDescription>Your current earnings and balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Current Balance</h3>
              <p className="text-3xl font-bold text-green-600">
                {wallet?.balance?.toFixed(2) || '0.00'} VND
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Earned</h3>
              <p className="text-3xl font-bold text-blue-600">
                {wallet?.total_earned?.toFixed(2) || '0.00'} VND
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button disabled className="w-full">
              Withdrawal (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent earnings and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}
                      {transaction.amount.toFixed(2)} VND
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserWallet;
