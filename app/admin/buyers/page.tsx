'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, AlertCircle, Clock, Users,
  FileText, DollarSign, TrendingUp, Edit, Eye, Pause,
  ChevronRight, ChevronLeft, MapPin, Phone, Mail, Settings2, Check, X, ArrowLeft
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerWithStats | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [createStep, setCreateStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
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

      console.log('Buyers result:', buyersResult);
      console.log('Rate cards result:', rateCardsResult);

      if (buyersResult.success && buyersResult.data) {
        setBuyers(buyersResult.data);
        setErrorMsg(null);
      } else {
        setBuyers([]);
        setErrorMsg(buyersResult.message || 'Failed to load buyers');
        console.error('Failed to load buyers:', buyersResult.message);
        toast.error(buyersResult.message || 'Failed to load buyers');
      }
      if (rateCardsResult.success && rateCardsResult.data) {
        setRateCards(rateCardsResult.data);
      }
    } catch (error) {
      setErrorMsg('Failed to load data');
      console.error('Load data error:', error);
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
    setCreateStep(1);
    setFormErrors({});
  }

  // Validate current step
  function validateStep(step: number): boolean {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name?.trim()) errors.name = 'Business name is required';
      if (!formData.code?.trim()) errors.code = 'Buyer code is required';
      if (formData.code && formData.code.length < 3) errors.code = 'Code must be at least 3 characters';
    }
    
    if (step === 2) {
      if (!formData.contact_email?.trim()) errors.contact_email = 'Primary email is required';
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        errors.contact_email = 'Invalid email format';
      }
      if (formData.financial_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.financial_contact_email)) {
        errors.financial_contact_email = 'Invalid email format';
      }
    }
    
    if (step === 4) {
      if (formData.min_invoice_amount && formData.max_invoice_amount) {
        if (formData.min_invoice_amount >= formData.max_invoice_amount) {
          errors.min_invoice_amount = 'Min must be less than max';
        }
      }
      if (formData.min_days_to_maturity && formData.max_days_to_maturity) {
        if (formData.min_days_to_maturity >= formData.max_days_to_maturity) {
          errors.min_days_to_maturity = 'Min must be less than max';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateStep(createStep)) {
      setCreateStep(prev => Math.min(prev + 1, 5));
    }
  }

  function prevStep() {
    setCreateStep(prev => Math.max(prev - 1, 1));
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
      {errorMsg && (
        <div className="bg-red-100 mb-4 p-4 border border-red-300 rounded-lg text-red-800">
          <strong>Error:</strong> {errorMsg}
          {errorMsg === 'Unauthorized' && (
            <div className="mt-2 text-sm">You are not authorized to view buyers. Please log in as an admin user.</div>
          )}
        </div>
      )}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to dashboard
      </Link>
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

      {/* Create Buyer Dialog - Wizard Style */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="flex flex-col gap-0 bg-card shadow-2xl p-0 border border-border w-full max-w-[95vw] sm:max-w-[95vw] xl:max-w-[1500px] h-auto max-h-[95vh] overflow-hidden text-foreground">
          {/* Header with Progress */}
          <div className="bg-primary px-8 pt-8 pb-10 text-primary-foreground">
            <DialogTitle className="font-bold text-2xl">Add New Buyer</DialogTitle>
            <DialogDescription className="mt-1 text-primary-foreground/80">
              Complete the steps below to onboard a new buyer
            </DialogDescription>
            
            {/* Progress Stepper */}
            <div className="flex justify-between items-center mt-6">
              {[
                { step: 1, label: 'Company', icon: Building2 },
                { step: 2, label: 'Contacts', icon: Users },
                { step: 3, label: 'Address', icon: MapPin },
                { step: 4, label: 'Settings', icon: Settings2 },
                { step: 5, label: 'Review', icon: Check },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer
                      ${createStep === item.step 
                        ? 'bg-primary-foreground text-primary border-primary-foreground shadow-lg scale-110' 
                        : createStep > item.step 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'bg-muted border-primary/30 text-primary/70'
                      }`}
                    onClick={() => item.step < createStep && setCreateStep(item.step)}
                  >
                    {createStep > item.step ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <item.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`hidden sm:block ml-2 text-sm font-medium ${createStep >= item.step ? 'text-primary-foreground' : 'text-primary-foreground/70'}`}>
                    {item.label}
                  </span>
                  {index < 4 && (
                    <div className={`hidden sm:block w-16 h-0.5 mx-4 ${createStep > item.step ? 'bg-primary/70' : 'bg-primary/30'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
            <div className="mx-auto max-w-6xl space-y-8">
            {/* Step 1: Company Information */}
            {createStep === 1 && (
              <div className="slide-in-from-right-5 space-y-6 animate-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Company Information</h3>
                    <p className="text-muted-foreground text-sm">Enter the buyer's business details</p>
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-2">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Legal Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Anglo American Platinum Ltd"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="trading_name">Trading Name</Label>
                    <Input
                      id="trading_name"
                      value={formData.trading_name || ''}
                      onChange={(e) => setFormData({...formData, trading_name: e.target.value})}
                      placeholder="If different from legal name"
                    />
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="flex items-center gap-1">
                      Buyer Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., AAP001"
                      className={formErrors.code ? 'border-red-500' : ''}
                    />
                    {formErrors.code && <p className="text-red-500 text-sm">{formErrors.code}</p>}
                    <p className="text-muted-foreground text-xs">Unique identifier for this buyer</p>
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

                <div className="gap-6 grid grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">VAT Number</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id || ''}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      placeholder="e.g., 4123456789"
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
                        <SelectItem value="mining">⛏️ Mining</SelectItem>
                        <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                        <SelectItem value="retail">🛒 Retail</SelectItem>
                        <SelectItem value="construction">🏗️ Construction</SelectItem>
                        <SelectItem value="agriculture">🌾 Agriculture</SelectItem>
                        <SelectItem value="services">💼 Services</SelectItem>
                        <SelectItem value="other">📦 Other</SelectItem>
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
                        <SelectItem value="A">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 rounded-full w-2 h-2" />
                            Tier A - Premium
                          </div>
                        </SelectItem>
                        <SelectItem value="B">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-500 rounded-full w-2 h-2" />
                            Tier B - Standard
                          </div>
                        </SelectItem>
                        <SelectItem value="C">
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-500 rounded-full w-2 h-2" />
                            Tier C - Higher Risk
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {createStep === 2 && (
              <div className="slide-in-from-right-5 space-y-6 animate-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    <p className="text-muted-foreground text-sm">Add primary and financial contact details</p>
                  </div>
                </div>

                <Card className="border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="w-4 h-4" />
                      Primary Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.primary_contact_name || ''}
                        onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                        placeholder="e.g., John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={formData.contact_email || ''}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        placeholder="e.g., john@company.com"
                        className={formErrors.contact_email ? 'border-red-500' : ''}
                      />
                      {formErrors.contact_email && <p className="text-red-500 text-sm">{formErrors.contact_email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={formData.contact_phone || ''}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        placeholder="+27 11 123 4567"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="w-4 h-4" />
                      Financial Contact
                      <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
                    </CardTitle>
                    <CardDescription>For repayment tracking and financial communications</CardDescription>
                  </CardHeader>
                  <CardContent className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.financial_contact_name || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_name: e.target.value})}
                        placeholder="e.g., Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        value={formData.financial_contact_email || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_email: e.target.value})}
                        placeholder="e.g., finance@company.com"
                        className={formErrors.financial_contact_email ? 'border-red-500' : ''}
                      />
                      {formErrors.financial_contact_email && <p className="text-red-500 text-sm">{formErrors.financial_contact_email}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Address */}
            {createStep === 3 && (
              <div className="slide-in-from-right-5 space-y-6 animate-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Physical Address</h3>
                    <p className="text-muted-foreground text-sm">Enter the buyer's business address</p>
                  </div>
                </div>

                <Card className="border border-border/60 bg-card/95 shadow-sm">
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input
                        value={formData.physical_address_street || ''}
                        onChange={(e) => setFormData({...formData, physical_address_street: e.target.value})}
                        placeholder="e.g., 123 Main Street, Suite 400"
                      />
                    </div>
                    <div className="gap-4 grid grid-cols-3">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={formData.physical_address_city || ''}
                          onChange={(e) => setFormData({...formData, physical_address_city: e.target.value})}
                          placeholder="e.g., Johannesburg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Province</Label>
                        <Select 
                          value={formData.physical_address_province || ''} 
                          onValueChange={(v) => setFormData({...formData, physical_address_province: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gauteng">Gauteng</SelectItem>
                            <SelectItem value="Western Cape">Western Cape</SelectItem>
                            <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                            <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                            <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                            <SelectItem value="Limpopo">Limpopo</SelectItem>
                            <SelectItem value="North West">North West</SelectItem>
                            <SelectItem value="Free State">Free State</SelectItem>
                            <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Postal Code</Label>
                        <Input
                          value={formData.physical_address_postal || ''}
                          onChange={(e) => setFormData({...formData, physical_address_postal: e.target.value})}
                          placeholder="e.g., 2000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-3 bg-primary/5 p-4 border border-primary/20 rounded-lg">
                  <AlertCircle className="mt-0.5 w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-primary text-sm">Address is optional</p>
                    <p className="text-primary/70 text-sm">
                      However, providing a complete address is recommended for compliance and regulatory requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Configuration */}
            {createStep === 4 && (
              <div className="slide-in-from-right-5 space-y-6 animate-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Settings2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Configuration</h3>
                    <p className="text-muted-foreground text-sm">Set invoice eligibility and financial limits</p>
                  </div>
                </div>

                <Card className="border border-border/60 bg-card/95 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4" />
                      Invoice Eligibility Criteria
                    </CardTitle>
                    <CardDescription>Define which invoices can be processed for this buyer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="gap-4 grid grid-cols-2">
                      <div className="space-y-2">
                        <Label>Min Invoice Amount (R)</Label>
                        <Input
                          type="number"
                          value={formData.min_invoice_amount || 1000}
                          onChange={(e) => setFormData({...formData, min_invoice_amount: Number(e.target.value)})}
                          className={formErrors.min_invoice_amount ? 'border-red-500' : ''}
                        />
                        {formErrors.min_invoice_amount && <p className="text-red-500 text-sm">{formErrors.min_invoice_amount}</p>}
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
                          className={formErrors.min_days_to_maturity ? 'border-red-500' : ''}
                        />
                        {formErrors.min_days_to_maturity && <p className="text-red-500 text-sm">{formErrors.min_days_to_maturity}</p>}
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="w-4 h-4" />
                      Financial Configuration
                    </CardTitle>
                    <CardDescription>Credit limits and rate card assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="gap-4 grid grid-cols-2">
                    <div className="space-y-2">
                      <Label>Credit Limit (R)</Label>
                      <Input
                        type="number"
                        value={formData.credit_limit || ''}
                        onChange={(e) => setFormData({...formData, credit_limit: e.target.value ? Number(e.target.value) : undefined})}
                        placeholder="Leave blank for no limit"
                      />
                      <p className="text-muted-foreground text-xs">Maximum outstanding financed amount</p>
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
                              <div className="flex justify-between items-center w-full">
                                <span>{rc.name}</span>
                                <Badge variant="secondary" className="ml-2">{rc.base_annual_rate}%</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">Can be assigned later after activation</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 5: Review */}
            {createStep === 5 && (
              <div className="slide-in-from-right-5 space-y-6 animate-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Review & Confirm</h3>
                    <p className="text-muted-foreground text-sm">Review all information before creating the buyer</p>
                  </div>
                </div>

                <div className="gap-4 grid grid-cols-2">
                  {/* Company Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="w-4 h-4" />
                        Company
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{formData.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Code</span>
                        <span className="font-mono">{formData.code || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Industry</span>
                        <span className="capitalize">{formData.industry_sector || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Risk Tier</span>
                        {formData.risk_tier && getRiskBadge(formData.risk_tier)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="w-4 h-4" />
                        Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Primary</span>
                        <span>{formData.primary_contact_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-primary">{formData.contact_email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span>{formData.contact_phone || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="w-4 h-4" />
                        Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm">
                      {formData.physical_address_street ? (
                        <div>
                          <p>{formData.physical_address_street}</p>
                          <p>{formData.physical_address_city}, {formData.physical_address_province}</p>
                          <p>{formData.physical_address_postal}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">Not provided</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Settings2 className="w-4 h-4" />
                        Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Range</span>
                        <span>R{formData.min_invoice_amount?.toLocaleString()} - R{formData.max_invoice_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maturity</span>
                        <span>{formData.min_days_to_maturity} - {formData.max_days_to_maturity} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Limit</span>
                        <span>{formData.credit_limit ? `R${formData.credit_limit.toLocaleString()}` : 'No limit'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="mt-0.5 w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Important Notice</p>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      The buyer will be created in <Badge variant="secondary" className="mx-1">Draft</Badge> status. You'll need to upload required documents and activate them before processing invoices.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="flex justify-between items-center p-6 border-t border-border/70 bg-card/95">
            <div>
              {createStep > 1 && (
                <Button variant="ghost" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              {createStep < 5 ? (
                <Button onClick={nextStep} className="gap-2">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreate} 
                  disabled={isPending} 
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isPending ? (
                    <>
                      <div className="border-white border-b-2 rounded-full w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Buyer
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
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
