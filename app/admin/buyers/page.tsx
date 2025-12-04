'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, AlertCircle, Clock, Users,
  FileText, DollarSign, TrendingUp, Edit, Eye, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  getBuyers, createBuyer, updateBuyer, activateBuyer, suspendBuyer,
  getRateCards, type BuyerWithStats, type CreateBuyerInput, type RateCard
} from '@/lib/actions/buyers';

export default function BuyersPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // State
  const [buyers, setBuyers] = useState<BuyerWithStats[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerWithStats | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateBuyerInput>>({
    industry_sector: 'mining',
    risk_tier: 'B',
    min_invoice_amount: 1000,
    max_invoice_amount: 5000000,
    min_days_to_maturity: 7,
    max_days_to_maturity: 90,
    active_status: 'draft'
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [statusFilter, riskFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [buyersResult, rateCardsResult] = await Promise.all([
        getBuyers({
          status: statusFilter !== 'all' ? statusFilter as any : undefined,
          risk_tier: riskFilter !== 'all' ? riskFilter as any : undefined,
          search: searchTerm || undefined
        }),
        getRateCards()
      ]);

      if (buyersResult.success && buyersResult.data) {
        setBuyers(buyersResult.data);
      }
      if (rateCardsResult.success && rateCardsResult.data) {
        setRateCards(rateCardsResult.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Create buyer
  async function handleCreate() {
    if (!formData.name || !formData.code || !formData.contact_email) {
      toast.error('Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      const result = await createBuyer(formData as CreateBuyerInput);
      if (result.success) {
        toast.success('Buyer created successfully');
        setShowCreateDialog(false);
        resetForm();
        loadData();
      } else {
        toast.error(result.message || 'Failed to create buyer');
      }
    });
  }

  // Update buyer
  async function handleUpdate() {
    if (!selectedBuyer) return;

    startTransition(async () => {
      const result = await updateBuyer({
        buyer_id: selectedBuyer.buyer_id,
        ...formData
      });
      if (result.success) {
        toast.success('Buyer updated successfully');
        setShowEditDialog(false);
        setSelectedBuyer(null);
        loadData();
      } else {
        toast.error(result.message || 'Failed to update buyer');
      }
    });
  }

  // Activate buyer
  async function handleActivate(buyer: BuyerWithStats) {
    startTransition(async () => {
      const result = await activateBuyer(buyer.buyer_id);
      if (result.success) {
        toast.success('Buyer activated successfully');
        loadData();
      } else {
        toast.error(result.message || 'Failed to activate buyer');
      }
    });
  }

  // Suspend buyer
  async function handleSuspend() {
    if (!selectedBuyer || !suspendReason) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    startTransition(async () => {
      const result = await suspendBuyer(selectedBuyer.buyer_id, suspendReason);
      if (result.success) {
        toast.success('Buyer suspended');
        setShowSuspendDialog(false);
        setSelectedBuyer(null);
        setSuspendReason('');
        loadData();
      } else {
        toast.error(result.message || 'Failed to suspend buyer');
      }
    });
  }

  function resetForm() {
    setFormData({
      industry_sector: 'mining',
      risk_tier: 'B',
      min_invoice_amount: 1000,
      max_invoice_amount: 5000000,
      min_days_to_maturity: 7,
      max_days_to_maturity: 90,
      active_status: 'draft'
    });
  }

  function openEditDialog(buyer: BuyerWithStats) {
    setSelectedBuyer(buyer);
    setFormData({
      name: buyer.name,
      trading_name: buyer.trading_name || undefined,
      code: buyer.code,
      registration_no: buyer.registration_no || undefined,
      tax_id: buyer.tax_id || undefined,
      industry_sector: buyer.industry_sector,
      risk_tier: buyer.risk_tier,
      physical_address_street: buyer.physical_address_street || undefined,
      physical_address_city: buyer.physical_address_city || undefined,
      physical_address_province: buyer.physical_address_province || undefined,
      physical_address_postal: buyer.physical_address_postal || undefined,
      primary_contact_name: buyer.primary_contact_name || undefined,
      contact_email: buyer.contact_email,
      contact_phone: buyer.contact_phone || undefined,
      financial_contact_name: buyer.financial_contact_name || undefined,
      financial_contact_email: buyer.financial_contact_email || undefined,
      min_invoice_amount: Number(buyer.min_invoice_amount),
      max_invoice_amount: Number(buyer.max_invoice_amount),
      min_days_to_maturity: buyer.min_days_to_maturity,
      max_days_to_maturity: buyer.max_days_to_maturity,
      credit_limit: buyer.credit_limit ? Number(buyer.credit_limit) : undefined,
      rate_card_id: buyer.rate_card_id || undefined
    });
    setShowEditDialog(true);
  }

  // Status badge helper
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 w-3 h-3" />Active</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="mr-1 w-3 h-3" />Draft</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><Pause className="mr-1 w-3 h-3" />Suspended</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800"><XCircle className="mr-1 w-3 h-3" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Risk tier badge helper
  function getRiskBadge(tier: string) {
    switch (tier) {
      case 'A':
        return <Badge className="bg-blue-100 text-blue-800">Tier A</Badge>;
      case 'B':
        return <Badge className="bg-purple-100 text-purple-800">Tier B</Badge>;
      case 'C':
        return <Badge className="bg-orange-100 text-orange-800">Tier C</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  }

  // Calculate summary stats
  const stats = {
    total: buyers.length,
    active: buyers.filter(b => b.active_status === 'active').length,
    draft: buyers.filter(b => b.active_status === 'draft').length,
    suspended: buyers.filter(b => b.active_status === 'suspended').length,
    totalFinanced: buyers.reduce((sum, b) => sum + Number(b.total_financed || 0), 0)
  };

  return (
    <div className="space-y-6 mx-auto p-6 container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-3xl">
            <Building2 className="w-8 h-8" />
            Buyer Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage buyer profiles, eligibility criteria, and rate cards
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="mr-2 w-4 h-4" />
          Add Buyer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600 text-2xl">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-gray-600 text-2xl">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-red-600 text-2xl">{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Financed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">R{stats.totalFinanced.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-muted-foreground -translate-y-1/2 transform" />
          <Input
            placeholder="Search buyers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Risk Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="A">Tier A</SelectItem>
            <SelectItem value="B">Tier B</SelectItem>
            <SelectItem value="C">Tier C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Buyers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-center">AP Users</TableHead>
                <TableHead className="text-center">Suppliers</TableHead>
                <TableHead className="text-right">Total Financed</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="border-primary border-b-2 rounded-full w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : buyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-muted-foreground text-center">
                    No buyers found
                  </TableCell>
                </TableRow>
              ) : (
                buyers.map((buyer) => (
                  <TableRow key={buyer.buyer_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{buyer.name}</div>
                        <div className="text-muted-foreground text-sm">{buyer.contact_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{buyer.code}</TableCell>
                    <TableCell>{getStatusBadge(buyer.active_status)}</TableCell>
                    <TableCell>{getRiskBadge(buyer.risk_tier)}</TableCell>
                    <TableCell className="capitalize">{buyer.industry_sector}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {buyer.ap_user_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{buyer.supplier_count}</TableCell>
                    <TableCell className="font-medium text-right">
                      R{Number(buyer.total_financed || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/buyers/${buyer.buyer_id}`)}>
                            <Eye className="mr-2 w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(buyer)}>
                            <Edit className="mr-2 w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {buyer.active_status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleActivate(buyer)}>
                              <CheckCircle2 className="mr-2 w-4 h-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {buyer.active_status === 'active' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => { setSelectedBuyer(buyer); setShowSuspendDialog(true); }}
                            >
                              <Pause className="mr-2 w-4 h-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Buyer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Buyer</DialogTitle>
            <DialogDescription>
              Create a new buyer profile. Required fields are marked with *.
            </DialogDescription>
          </DialogHeader>
          
          <div className="gap-4 grid py-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Legal Business Name *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Anglo American Platinum Ltd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trading_name">Trading Name</Label>
                    <Input
                      id="trading_name"
                      value={formData.trading_name || ''}
                      onChange={(e) => setFormData({...formData, trading_name: e.target.value})}
                      placeholder="If different from legal name"
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Buyer Code / Mine Code *</Label>
                    <Input
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., AAP001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_no">Company Registration No</Label>
                    <Input
                      id="registration_no"
                      value={formData.registration_no || ''}
                      onChange={(e) => setFormData({...formData, registration_no: e.target.value})}
                      placeholder="e.g., 2000/012345/06"
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id || ''}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      placeholder="e.g., 4123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry Sector</Label>
                    <Select 
                      value={formData.industry_sector} 
                      onValueChange={(v: any) => setFormData({...formData, industry_sector: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mining">Mining</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk_tier">Risk Tier</Label>
                    <Select 
                      value={formData.risk_tier} 
                      onValueChange={(v: any) => setFormData({...formData, risk_tier: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Tier A (Premium)</SelectItem>
                        <SelectItem value="B">Tier B (Standard)</SelectItem>
                        <SelectItem value="C">Tier C (Higher Risk)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
                    <Input
                      id="primary_contact_name"
                      value={formData.primary_contact_name || ''}
                      onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Primary Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Primary Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone || ''}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="mb-4 font-medium">Financial Contact (for repayment tracking)</h4>
                  <div className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="financial_contact_name">Financial Contact Name</Label>
                      <Input
                        id="financial_contact_name"
                        value={formData.financial_contact_name || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="financial_contact_email">Financial Contact Email</Label>
                      <Input
                        id="financial_contact_email"
                        type="email"
                        value={formData.financial_contact_email || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.physical_address_street || ''}
                    onChange={(e) => setFormData({...formData, physical_address_street: e.target.value})}
                  />
                </div>
                <div className="gap-4 grid grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.physical_address_city || ''}
                      onChange={(e) => setFormData({...formData, physical_address_city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      value={formData.physical_address_province || ''}
                      onChange={(e) => setFormData({...formData, physical_address_province: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal">Postal Code</Label>
                    <Input
                      id="postal"
                      value={formData.physical_address_postal || ''}
                      onChange={(e) => setFormData({...formData, physical_address_postal: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <h4 className="font-medium">Invoice Eligibility Criteria</h4>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min_amount">Min Invoice Amount (R)</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      value={formData.min_invoice_amount || 1000}
                      onChange={(e) => setFormData({...formData, min_invoice_amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_amount">Max Invoice Amount (R)</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      value={formData.max_invoice_amount || 5000000}
                      onChange={(e) => setFormData({...formData, max_invoice_amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min_days">Min Days to Maturity</Label>
                    <Input
                      id="min_days"
                      type="number"
                      value={formData.min_days_to_maturity || 7}
                      onChange={(e) => setFormData({...formData, min_days_to_maturity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_days">Max Days to Maturity</Label>
                    <Input
                      id="max_days"
                      type="number"
                      value={formData.max_days_to_maturity || 90}
                      onChange={(e) => setFormData({...formData, max_days_to_maturity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="mb-4 font-medium">Financial Configuration</h4>
                  <div className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="credit_limit">Credit Limit (R)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        value={formData.credit_limit || ''}
                        onChange={(e) => setFormData({...formData, credit_limit: e.target.value ? Number(e.target.value) : undefined})}
                        placeholder="Leave blank for no limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rate_card">Rate Card</Label>
                      <Select 
                        value={formData.rate_card_id?.toString() || ''} 
                        onValueChange={(v) => setFormData({...formData, rate_card_id: v ? Number(v) : undefined})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate card" />
                        </SelectTrigger>
                        <SelectContent>
                          {rateCards.map((rc) => (
                            <SelectItem key={rc.rate_card_id} value={rc.rate_card_id.toString()}>
                              {rc.name} ({rc.base_annual_rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Buyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Buyer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Buyer: {selectedBuyer?.name}</DialogTitle>
            <DialogDescription>
              Update buyer profile information.
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form content as create dialog */}
          <div className="gap-4 grid py-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">Legal Business Name *</Label>
                    <Input
                      id="edit_name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_trading_name">Trading Name</Label>
                    <Input
                      id="edit_trading_name"
                      value={formData.trading_name || ''}
                      onChange={(e) => setFormData({...formData, trading_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit_code">Buyer Code *</Label>
                    <Input
                      id="edit_code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_registration_no">Company Registration No</Label>
                    <Input
                      id="edit_registration_no"
                      value={formData.registration_no || ''}
                      onChange={(e) => setFormData({...formData, registration_no: e.target.value})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit_tax_id">Tax ID</Label>
                    <Input
                      id="edit_tax_id"
                      value={formData.tax_id || ''}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry Sector</Label>
                    <Select 
                      value={formData.industry_sector} 
                      onValueChange={(v: any) => setFormData({...formData, industry_sector: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mining">Mining</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Tier</Label>
                    <Select 
                      value={formData.risk_tier} 
                      onValueChange={(v: any) => setFormData({...formData, risk_tier: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Tier A (Premium)</SelectItem>
                        <SelectItem value="B">Tier B (Standard)</SelectItem>
                        <SelectItem value="C">Tier C (Higher Risk)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Contact Name</Label>
                    <Input
                      value={formData.primary_contact_name || ''}
                      onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Contact Email *</Label>
                    <Input
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Contact Phone</Label>
                    <Input
                      value={formData.contact_phone || ''}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="mb-4 font-medium">Financial Contact</h4>
                  <div className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label>Financial Contact Name</Label>
                      <Input
                        value={formData.financial_contact_name || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Financial Contact Email</Label>
                      <Input
                        type="email"
                        value={formData.financial_contact_email || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input
                    value={formData.physical_address_street || ''}
                    onChange={(e) => setFormData({...formData, physical_address_street: e.target.value})}
                  />
                </div>
                <div className="gap-4 grid grid-cols-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.physical_address_city || ''}
                      onChange={(e) => setFormData({...formData, physical_address_city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input
                      value={formData.physical_address_province || ''}
                      onChange={(e) => setFormData({...formData, physical_address_province: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={formData.physical_address_postal || ''}
                      onChange={(e) => setFormData({...formData, physical_address_postal: e.target.value})}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4 mt-4">
                <h4 className="font-medium">Invoice Eligibility Criteria</h4>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min Invoice Amount (R)</Label>
                    <Input
                      type="number"
                      value={formData.min_invoice_amount || 1000}
                      onChange={(e) => setFormData({...formData, min_invoice_amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Invoice Amount (R)</Label>
                    <Input
                      type="number"
                      value={formData.max_invoice_amount || 5000000}
                      onChange={(e) => setFormData({...formData, max_invoice_amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="gap-4 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label>Min Days to Maturity</Label>
                    <Input
                      type="number"
                      value={formData.min_days_to_maturity || 7}
                      onChange={(e) => setFormData({...formData, min_days_to_maturity: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Days to Maturity</Label>
                    <Input
                      type="number"
                      value={formData.max_days_to_maturity || 90}
                      onChange={(e) => setFormData({...formData, max_days_to_maturity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <h4 className="mb-4 font-medium">Financial Configuration</h4>
                  <div className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label>Credit Limit (R)</Label>
                      <Input
                        type="number"
                        value={formData.credit_limit || ''}
                        onChange={(e) => setFormData({...formData, credit_limit: e.target.value ? Number(e.target.value) : undefined})}
                        placeholder="Leave blank for no limit"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate Card</Label>
                      <Select 
                        value={formData.rate_card_id?.toString() || ''} 
                        onValueChange={(v) => setFormData({...formData, rate_card_id: v ? Number(v) : undefined})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate card" />
                        </SelectTrigger>
                        <SelectContent>
                          {rateCards.map((rc) => (
                            <SelectItem key={rc.rate_card_id} value={rc.rate_card_id.toString()}>
                              {rc.name} ({rc.base_annual_rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Buyer Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Buyer</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {selectedBuyer?.name}? This will prevent invoice processing for this buyer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend_reason">Reason for Suspension *</Label>
              <Textarea
                id="suspend_reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., Payment issues, compliance review, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={isPending || !suspendReason}>
              {isPending ? 'Suspending...' : 'Suspend Buyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
