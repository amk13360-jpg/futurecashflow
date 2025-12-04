'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, AlertCircle, Clock, Users,
  FileText, DollarSign, TrendingUp, Edit, Eye, Pause,
  ChevronRight, ChevronLeft, MapPin, Phone, Mail, Settings2, Check, X
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

      {/* Create Buyer Dialog - Premium Wizard Style */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="flex flex-col gap-0 p-0 border-0 max-w-5xl w-[95vw] h-[92vh] max-h-[900px] overflow-hidden rounded-2xl shadow-2xl">
          {/* Stunning Header with Gradient & Pattern */}
          <div className="relative bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 px-8 pt-8 pb-10 overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 bg-white/20 blur-3xl rounded-full w-96 h-96 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 bg-white/10 blur-3xl rounded-full w-64 h-64 translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start gap-5">
                <div className="flex justify-center items-center bg-white/20 backdrop-blur-sm shadow-lg rounded-2xl w-16 h-16">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="font-bold text-white text-3xl tracking-tight">
                    Add New Buyer
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-blue-100 text-base">
                    Complete the onboarding wizard to set up a new buyer profile
                  </DialogDescription>
                </div>
                <Badge className="bg-white/20 hover:bg-white/20 backdrop-blur-sm px-4 py-2 border-0 text-white text-sm">
                  Step {createStep} of 5
                </Badge>
              </div>
              
              {/* Enhanced Progress Stepper */}
              <div className="mt-10">
                <div className="flex justify-between items-center relative">
                  {/* Progress line background */}
                  <div className="top-6 right-12 left-12 absolute bg-white/20 h-1 rounded-full" />
                  {/* Active progress line */}
                  <div 
                    className="top-6 left-12 absolute bg-white h-1 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `calc(${((createStep - 1) / 4) * 100}% - 48px)` }}
                  />
                  
                  {[
                    { step: 1, label: 'Company Info', icon: Building2, desc: 'Business details' },
                    { step: 2, label: 'Contacts', icon: Users, desc: 'Contact persons' },
                    { step: 3, label: 'Address', icon: MapPin, desc: 'Location' },
                    { step: 4, label: 'Settings', icon: Settings2, desc: 'Configuration' },
                    { step: 5, label: 'Review', icon: Check, desc: 'Confirm' },
                  ].map((item) => (
                    <div 
                      key={item.step} 
                      className="z-10 flex flex-col items-center cursor-pointer group"
                      onClick={() => item.step < createStep && setCreateStep(item.step)}
                    >
                      <div 
                        className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 
                          ${createStep === item.step 
                            ? 'bg-white text-blue-600 shadow-xl shadow-blue-900/30 scale-110 ring-4 ring-white/30' 
                            : createStep > item.step 
                              ? 'bg-green-400 text-white shadow-lg' 
                              : 'bg-white/20 text-white/70 group-hover:bg-white/30'
                          }`}
                      >
                        {createStep > item.step ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <item.icon className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`mt-3 text-sm font-semibold transition-colors ${createStep >= item.step ? 'text-white' : 'text-white/60'}`}>
                        {item.label}
                      </span>
                      <span className={`text-xs transition-colors ${createStep >= item.step ? 'text-blue-200' : 'text-white/40'}`}>
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content - Enhanced Styling */}
          <div className="flex-1 bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-8 py-8 overflow-y-auto">
            {/* Step 1: Company Information */}
            {createStep === 1 && (
              <div className="slide-in-from-right-5 space-y-8 mx-auto max-w-3xl animate-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex justify-center items-center bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 rounded-xl w-14 h-14">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Company Information</h3>
                    <p className="text-slate-500 dark:text-slate-400">Enter the buyer's legal business details</p>
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="name" className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      Legal Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Anglo American Platinum Ltd"
                      className={`h-12 text-base transition-all ${formErrors.name ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                    />
                    {formErrors.name && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="trading_name" className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Trading Name</Label>
                    <Input
                      id="trading_name"
                      value={formData.trading_name || ''}
                      onChange={(e) => setFormData({...formData, trading_name: e.target.value})}
                      placeholder="If different from legal name"
                      className="h-12 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      Buyer Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g., AAP001"
                      className={`h-12 text-base font-mono tracking-wider uppercase transition-all ${formErrors.code ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                    />
                    {formErrors.code && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.code}</p>}
                    <p className="text-slate-400 text-xs">Unique identifier used throughout the system</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_no" className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Company Registration No</Label>
                    <Input
                      id="registration_no"
                      value={formData.registration_no || ''}
                      onChange={(e) => setFormData({...formData, registration_no: e.target.value})}
                      placeholder="e.g., 2000/012345/06"
                      className="h-12 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id" className="font-semibold text-slate-700 dark:text-slate-300 text-sm">VAT Number</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id || ''}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      placeholder="e.g., 4123456789"
                      className="h-12 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Industry Sector</Label>
                    <Select 
                      value={formData.industry_sector} 
                      onValueChange={(v: any) => setFormData({...formData, industry_sector: v})}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mining"><span className="flex items-center gap-2">⛏️ Mining</span></SelectItem>
                        <SelectItem value="manufacturing"><span className="flex items-center gap-2">🏭 Manufacturing</span></SelectItem>
                        <SelectItem value="retail"><span className="flex items-center gap-2">🛒 Retail</span></SelectItem>
                        <SelectItem value="construction"><span className="flex items-center gap-2">🏗️ Construction</span></SelectItem>
                        <SelectItem value="agriculture"><span className="flex items-center gap-2">🌾 Agriculture</span></SelectItem>
                        <SelectItem value="services"><span className="flex items-center gap-2">💼 Services</span></SelectItem>
                        <SelectItem value="other"><span className="flex items-center gap-2">📦 Other</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Risk Tier</Label>
                    <Select 
                      value={formData.risk_tier} 
                      onValueChange={(v: any) => setFormData({...formData, risk_tier: v})}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-blue-100 rounded-full w-6 h-6">
                              <span className="bg-blue-500 rounded-full w-2.5 h-2.5" />
                            </div>
                            <div>
                              <span className="font-medium">Tier A</span>
                              <span className="ml-2 text-slate-400">Premium</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="B">
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-purple-100 rounded-full w-6 h-6">
                              <span className="bg-purple-500 rounded-full w-2.5 h-2.5" />
                            </div>
                            <div>
                              <span className="font-medium">Tier B</span>
                              <span className="ml-2 text-slate-400">Standard</span>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="C">
                          <div className="flex items-center gap-3">
                            <div className="flex justify-center items-center bg-orange-100 rounded-full w-6 h-6">
                              <span className="bg-orange-500 rounded-full w-2.5 h-2.5" />
                            </div>
                            <div>
                              <span className="font-medium">Tier C</span>
                              <span className="ml-2 text-slate-400">Higher Risk</span>
                            </div>
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
              <div className="slide-in-from-right-5 space-y-8 mx-auto max-w-3xl animate-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex justify-center items-center bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200 dark:shadow-green-900/30 rounded-xl w-14 h-14">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Contact Information</h3>
                    <p className="text-slate-500 dark:text-slate-400">Add primary and financial contact details</p>
                  </div>
                </div>

                {/* Primary Contact Card */}
                <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-linear-to-r from-blue-500 to-blue-600 h-1.5" />
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex justify-center items-center bg-blue-100 dark:bg-blue-900 rounded-lg w-10 h-10">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Primary Contact
                      <Badge className="bg-blue-100 hover:bg-blue-100 ml-auto text-blue-700 text-xs">Required</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="gap-5 grid grid-cols-1 md:grid-cols-2 pt-0">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Contact Name</Label>
                      <Input
                        value={formData.primary_contact_name || ''}
                        onChange={(e) => setFormData({...formData, primary_contact_name: e.target.value})}
                        placeholder="e.g., John Smith"
                        className="h-12 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={formData.contact_email || ''}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                        placeholder="e.g., john@company.com"
                        className={`h-12 text-base transition-all ${formErrors.contact_email ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}`}
                      />
                      {formErrors.contact_email && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.contact_email}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Phone Number</Label>
                      <Input
                        value={formData.contact_phone || ''}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        placeholder="+27 11 123 4567"
                        className="h-12 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Contact Card */}
                <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-green-600 h-1.5" />
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex justify-center items-center bg-emerald-100 dark:bg-emerald-900 rounded-lg w-10 h-10">
                        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Financial Contact
                      <Badge variant="outline" className="ml-auto text-xs">Optional</Badge>
                    </CardTitle>
                    <CardDescription className="ml-13 text-slate-500">For repayment tracking and financial communications</CardDescription>
                  </CardHeader>
                  <CardContent className="gap-5 grid grid-cols-1 md:grid-cols-2 pt-0">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Contact Name</Label>
                      <Input
                        value={formData.financial_contact_name || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_name: e.target.value})}
                        placeholder="e.g., Jane Doe"
                        className="h-12 text-base focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Email Address</Label>
                      <Input
                        type="email"
                        value={formData.financial_contact_email || ''}
                        onChange={(e) => setFormData({...formData, financial_contact_email: e.target.value})}
                        placeholder="e.g., finance@company.com"
                        className={`h-12 text-base transition-all ${formErrors.financial_contact_email ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500'}`}
                      />
                      {formErrors.financial_contact_email && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.financial_contact_email}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Address */}
            {createStep === 3 && (
              <div className="slide-in-from-right-5 space-y-8 mx-auto max-w-3xl animate-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex justify-center items-center bg-linear-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 rounded-xl w-14 h-14">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Physical Address</h3>
                    <p className="text-slate-500 dark:text-slate-400">Enter the buyer's business address</p>
                  </div>
                </div>

                <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                  <div className="bg-linear-to-r from-orange-500 to-amber-500 h-1.5" />
                  <CardContent className="space-y-6 pt-8 pb-8">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Street Address</Label>
                      <Input
                        value={formData.physical_address_street || ''}
                        onChange={(e) => setFormData({...formData, physical_address_street: e.target.value})}
                        placeholder="e.g., 123 Main Street, Suite 400"
                        className="h-12 text-base focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                      />
                    </div>
                    <div className="gap-5 grid grid-cols-1 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">City</Label>
                        <Input
                          value={formData.physical_address_city || ''}
                          onChange={(e) => setFormData({...formData, physical_address_city: e.target.value})}
                          placeholder="e.g., Johannesburg"
                          className="h-12 text-base focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Province</Label>
                        <Select 
                          value={formData.physical_address_province || ''} 
                          onValueChange={(v) => setFormData({...formData, physical_address_province: v})}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Gauteng">🏙️ Gauteng</SelectItem>
                            <SelectItem value="Western Cape">🌊 Western Cape</SelectItem>
                            <SelectItem value="KwaZulu-Natal">🌴 KwaZulu-Natal</SelectItem>
                            <SelectItem value="Eastern Cape">🏔️ Eastern Cape</SelectItem>
                            <SelectItem value="Mpumalanga">🌿 Mpumalanga</SelectItem>
                            <SelectItem value="Limpopo">🌳 Limpopo</SelectItem>
                            <SelectItem value="North West">🌾 North West</SelectItem>
                            <SelectItem value="Free State">🌻 Free State</SelectItem>
                            <SelectItem value="Northern Cape">🏜️ Northern Cape</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Postal Code</Label>
                        <Input
                          value={formData.physical_address_postal || ''}
                          onChange={(e) => setFormData({...formData, physical_address_postal: e.target.value})}
                          placeholder="e.g., 2000"
                          className="h-12 text-base focus:ring-2 focus:ring-orange-100 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-950/30 p-5 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex justify-center items-center bg-amber-100 dark:bg-amber-900 rounded-lg w-10 h-10 shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">Address is optional</p>
                    <p className="mt-1 text-amber-700 dark:text-amber-300 text-sm">
                      However, providing a complete address is recommended for compliance, document delivery, and regulatory requirements.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Configuration */}
            {createStep === 4 && (
              <div className="slide-in-from-right-5 space-y-8 mx-auto max-w-3xl animate-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex justify-center items-center bg-linear-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/30 rounded-xl w-14 h-14">
                    <Settings2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Configuration</h3>
                    <p className="text-slate-500 dark:text-slate-400">Set invoice eligibility and financial limits</p>
                  </div>
                </div>

                {/* Invoice Eligibility */}
                <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-linear-to-r from-violet-500 to-purple-600 h-1.5" />
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex justify-center items-center bg-violet-100 dark:bg-violet-900 rounded-lg w-10 h-10">
                        <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      Invoice Eligibility Criteria
                    </CardTitle>
                    <CardDescription className="ml-13 text-slate-500">Define which invoices can be processed for this buyer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          Min Invoice Amount (R)
                        </Label>
                        <Input
                          type="number"
                          value={formData.min_invoice_amount || 1000}
                          onChange={(e) => setFormData({...formData, min_invoice_amount: Number(e.target.value)})}
                          className={`h-12 text-base transition-all ${formErrors.min_invoice_amount ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-purple-100 focus:border-purple-500'}`}
                        />
                        {formErrors.min_invoice_amount && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.min_invoice_amount}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          Max Invoice Amount (R)
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_invoice_amount || 5000000}
                          onChange={(e) => setFormData({...formData, max_invoice_amount: Number(e.target.value)})}
                          className="h-12 text-base focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Min Days to Maturity
                        </Label>
                        <Input
                          type="number"
                          value={formData.min_days_to_maturity || 7}
                          onChange={(e) => setFormData({...formData, min_days_to_maturity: Number(e.target.value)})}
                          className={`h-12 text-base transition-all ${formErrors.min_days_to_maturity ? 'border-red-500 ring-2 ring-red-100' : 'focus:ring-2 focus:ring-purple-100 focus:border-purple-500'}`}
                        />
                        {formErrors.min_days_to_maturity && <p className="flex items-center gap-1 text-red-500 text-sm"><AlertCircle className="w-3 h-3" />{formErrors.min_days_to_maturity}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Max Days to Maturity
                        </Label>
                        <Input
                          type="number"
                          value={formData.max_days_to_maturity || 90}
                          onChange={(e) => setFormData({...formData, max_days_to_maturity: Number(e.target.value)})}
                          className="h-12 text-base focus:ring-2 focus:ring-purple-100 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Configuration */}
                <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className="bg-linear-to-r from-indigo-500 to-blue-600 h-1.5" />
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="flex justify-center items-center bg-indigo-100 dark:bg-indigo-900 rounded-lg w-10 h-10">
                        <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      Financial Configuration
                    </CardTitle>
                    <CardDescription className="ml-13 text-slate-500">Credit limits and rate card assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="gap-6 grid grid-cols-1 md:grid-cols-2 pt-0">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Credit Limit (R)</Label>
                      <Input
                        type="number"
                        value={formData.credit_limit || ''}
                        onChange={(e) => setFormData({...formData, credit_limit: e.target.value ? Number(e.target.value) : undefined})}
                        placeholder="Leave blank for no limit"
                        className="h-12 text-base focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      />
                      <p className="text-slate-400 text-xs">Maximum outstanding financed amount at any time</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Rate Card</Label>
                      <Select 
                        value={formData.rate_card_id?.toString() || ''} 
                        onValueChange={(v) => setFormData({...formData, rate_card_id: v ? Number(v) : undefined})}
                      >
                        <SelectTrigger className="h-12 text-base">
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
                      <p className="text-slate-400 text-xs">Can be assigned later after activation</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 5: Review */}
            {createStep === 5 && (
              <div className="slide-in-from-right-5 space-y-8 mx-auto max-w-3xl animate-in duration-300">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex justify-center items-center bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200 dark:shadow-green-900/30 rounded-xl w-14 h-14">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">Review & Confirm</h3>
                    <p className="text-slate-500 dark:text-slate-400">Review all information before creating the buyer</p>
                  </div>
                </div>

                <div className="gap-5 grid grid-cols-1 md:grid-cols-2">
                  {/* Company Info */}
                  <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-blue-500 to-indigo-500 h-1" />
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="flex items-center gap-3 font-semibold text-base">
                        <div className="flex justify-center items-center bg-blue-100 dark:bg-blue-900 rounded-lg w-8 h-8">
                          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Company
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Name</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{formData.name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Code</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-md font-mono font-medium text-slate-700 dark:text-slate-300">{formData.code || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Industry</span>
                        <span className="capitalize text-slate-700 dark:text-slate-300">{formData.industry_sector || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500">Risk Tier</span>
                        {formData.risk_tier && getRiskBadge(formData.risk_tier)}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Info */}
                  <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-green-500 to-emerald-500 h-1" />
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="flex items-center gap-3 font-semibold text-base">
                        <div className="flex justify-center items-center bg-green-100 dark:bg-green-900 rounded-lg w-8 h-8">
                          <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Primary</span>
                        <span className="text-slate-700 dark:text-slate-300">{formData.primary_contact_name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{formData.contact_email || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500">Phone</span>
                        <span className="text-slate-700 dark:text-slate-300">{formData.contact_phone || '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address */}
                  <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-orange-500 to-amber-500 h-1" />
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="flex items-center gap-3 font-semibold text-base">
                        <div className="flex justify-center items-center bg-orange-100 dark:bg-orange-900 rounded-lg w-8 h-8">
                          <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm">
                      {formData.physical_address_street ? (
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <p>{formData.physical_address_street}</p>
                          <p>{formData.physical_address_city}, {formData.physical_address_province}</p>
                          <p>{formData.physical_address_postal}</p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">Not provided</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Configuration */}
                  <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                    <div className="bg-linear-to-r from-purple-500 to-violet-500 h-1" />
                    <CardHeader className="pb-3 pt-5">
                      <CardTitle className="flex items-center gap-3 font-semibold text-base">
                        <div className="flex justify-center items-center bg-purple-100 dark:bg-purple-900 rounded-lg w-8 h-8">
                          <Settings2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Invoice Range</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">R{formData.min_invoice_amount?.toLocaleString()} - R{formData.max_invoice_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-slate-500">Maturity</span>
                        <span className="text-slate-700 dark:text-slate-300">{formData.min_days_to_maturity} - {formData.max_days_to_maturity} days</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-slate-500">Credit Limit</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formData.credit_limit ? `R${formData.credit_limit.toLocaleString()}` : 'No limit'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-start gap-4 bg-linear-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-5 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex justify-center items-center bg-amber-100 dark:bg-amber-900 rounded-full w-10 h-10 shrink-0">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Important Notice</p>
                    <p className="mt-1 text-amber-700 dark:text-amber-300 text-sm">
                      The buyer will be created in <Badge className="bg-slate-200 hover:bg-slate-200 mx-1 text-slate-700">Draft</Badge> status. You'll need to upload required documents and activate them before processing invoices.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Footer with Navigation */}
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-8 py-5 border-t border-slate-200 dark:border-slate-700">
            <div>
              {createStep > 1 && (
                <Button variant="ghost" onClick={prevStep} className="gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 px-5 h-11 text-base">
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="px-6 h-11 text-base">
                Cancel
              </Button>
              {createStep < 5 ? (
                <Button onClick={nextStep} className="gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 px-8 h-11 text-base">
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button 
                  onClick={handleCreate} 
                  disabled={isPending} 
                  className="gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 px-8 h-11 text-base"
                >
                  {isPending ? (
                    <>
                      <div className="border-white border-b-2 rounded-full w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Buyer
                      <Check className="w-5 h-5" />
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
