'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, ArrowLeft, Edit, Users, FileText, History, 
  DollarSign, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Upload, Eye, Trash2, Plus, Mail, Key, UserPlus
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  getBuyerById, getBuyerUsers, getBuyerStats, 
  getBuyerChangeLog, activateBuyer, type BuyerWithStats 
} from '@/lib/actions/buyers';
import { createUserForBuyer, sendWelcomeEmail } from '@/lib/actions/buyer-users';
import { 
  uploadBuyerDocument, verifyBuyerDocument, deleteBuyerDocument,
  getBuyerDocuments as fetchBuyerDocuments, type BuyerDocumentType 
} from '@/lib/actions/buyer-documents';
import Link from 'next/link';

export default function BuyerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const buyerId = Number(params.id);
  const [isPending, startTransition] = useTransition();
  
  // State
  const [buyer, setBuyer] = useState<BuyerWithStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [changeLog, setChangeLog] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showUploadDocDialog, setShowUploadDocDialog] = useState(false);
  
  // New user form
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    send_welcome_email: true
  });

  // Document upload form
  const [newDoc, setNewDoc] = useState<{
    document_type: BuyerDocumentType;
    file: File | null;
    expiry_date: string;
  }>({
    document_type: 'cipc_certificate',
    file: null,
    expiry_date: ''
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [buyerId]);

  async function loadData() {
    setLoading(true);
    try {
      const [buyerResult, usersResult, statsResult, docsResult, logResult] = await Promise.all([
        getBuyerById(buyerId),
        getBuyerUsers(buyerId),
        getBuyerStats(buyerId),
        fetchBuyerDocuments(buyerId),
        getBuyerChangeLog(buyerId)
      ]);

      if (buyerResult.success && buyerResult.data) {
        setBuyer(buyerResult.data);
      } else {
        toast.error('Buyer not found');
        router.push('/admin/buyers');
        return;
      }

      if (usersResult.success) setUsers(usersResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
      if (docsResult.success) setDocuments(docsResult.data || []);
      if (logResult.success) setChangeLog(logResult.data || []);
    } catch (error) {
      toast.error('Failed to load buyer details');
    } finally {
      setLoading(false);
    }
  }

  // Create AP user
  async function handleCreateUser() {
    if (!newUser.username || !newUser.email || !newUser.full_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check 4-user limit
    const apUsers = users.filter(u => u.role === 'accounts_payable');
    if (apUsers.length >= 4) {
      toast.error('Maximum 4 AP users per buyer allowed');
      return;
    }

    startTransition(async () => {
      const result = await createUserForBuyer({
        buyer_id: buyerId,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone || undefined,
        send_welcome_email: newUser.send_welcome_email
      });

      if (result.success) {
        toast.success(result.message || 'User created successfully');
        setShowAddUserDialog(false);
        setNewUser({ username: '', email: '', full_name: '', phone: '', send_welcome_email: true });
        loadData();
      } else {
        toast.error(result.message || 'Failed to create user');
      }
    });
  }

  // Resend welcome email
  async function handleResendWelcome(userId: number) {
    startTransition(async () => {
      const result = await sendWelcomeEmail(userId);
      if (result.success) {
        toast.success('Welcome email sent');
      } else {
        toast.error(result.message || 'Failed to send email');
      }
    });
  }

  // Upload document
  async function handleUploadDocument() {
    if (!newDoc.file) {
      toast.error('Please select a file');
      return;
    }

    startTransition(async () => {
      if (!newDoc.file) return;
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const result = await uploadBuyerDocument({
          buyer_id: buyerId,
          document_type: newDoc.document_type,
          file_name: newDoc.file!.name,
          file_data: base64,
          expiry_date: newDoc.expiry_date || undefined
        });

        if (result.success) {
          toast.success('Document uploaded successfully');
          setShowUploadDocDialog(false);
          setNewDoc({ document_type: 'cipc_certificate', file: null, expiry_date: '' });
          loadData();
        } else {
          toast.error(result.message || 'Failed to upload document');
        }
      };
      reader.readAsDataURL(newDoc.file);
    });
  }

  // Verify document
  async function handleVerifyDocument(documentId: number, verified: boolean) {
    startTransition(async () => {
      const result = await verifyBuyerDocument(documentId, verified);
      if (result.success) {
        toast.success(result.message);
        loadData();
      } else {
        toast.error(result.message || 'Failed to verify document');
      }
    });
  }

  // Delete document
  async function handleDeleteDocument(documentId: number) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    startTransition(async () => {
      const result = await deleteBuyerDocument(documentId);
      if (result.success) {
        toast.success('Document deleted');
        loadData();
      } else {
        toast.error(result.message || 'Failed to delete document');
      }
    });
  }

  // Activate buyer
  async function handleActivate() {
    startTransition(async () => {
      const result = await activateBuyer(buyerId);
      if (result.success) {
        toast.success('Buyer activated');
        loadData();
      } else {
        toast.error(result.message || 'Failed to activate buyer');
      }
    });
  }

  // Status badge helper
  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 w-3 h-3" />Active</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="mr-1 w-3 h-3" />Draft</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="mr-1 w-3 h-3" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Document type label
  function getDocTypeLabel(type: string) {
    const labels: Record<string, string> = {
      'cipc_certificate': 'CIPC Certificate',
      'tax_clearance': 'Tax Clearance',
      'financial_statements': 'Financial Statements',
      'bank_confirmation': 'Bank Confirmation',
      'trade_references': 'Trade References',
      'director_id': 'Director ID',
      'resolution': 'Board Resolution',
      'other': 'Other'
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="mx-auto p-6 container">
        <div className="flex justify-center items-center h-64">
          <div className="border-primary border-b-2 rounded-full w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!buyer) {
    return null;
  }

  const apUserCount = users.filter(u => u.role === 'accounts_payable').length;

  return (
    <div className="space-y-6 mx-auto p-6 container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/buyers">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-3xl">{buyer.name}</h1>
              {getStatusBadge(buyer.active_status)}
            </div>
            <p className="text-muted-foreground">
              Code: {buyer.code} | {buyer.industry_sector} | Risk Tier {buyer.risk_tier}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {buyer.active_status === 'draft' && (
            <Button onClick={handleActivate} disabled={isPending}>
              <CheckCircle2 className="mr-2 w-4 h-4" />
              Activate Buyer
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/buyers?edit=${buyerId}`}>
              <Edit className="mr-2 w-4 h-4" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats?.total_invoices || 0}</div>
            <p className="text-muted-foreground text-xs">
              R{Number(stats?.total_invoice_value || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-blue-600 text-2xl">{stats?.matched_invoices || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Offers Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats?.total_offers || 0}</div>
            <p className="text-muted-foreground text-xs">
              {stats?.accepted_offers || 0} accepted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats?.total_suppliers || 0}</div>
            <p className="text-muted-foreground text-xs">
              {stats?.active_suppliers || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Financed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600 text-2xl">
              R{Number(stats?.total_financed || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">
            AP Users ({apUserCount}/4)
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="gap-4 grid grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Legal Name</Label>
                    <p className="font-medium">{buyer.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Trading Name</Label>
                    <p className="font-medium">{buyer.trading_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Registration No</Label>
                    <p className="font-medium">{buyer.registration_no || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tax ID / VAT</Label>
                    <p className="font-medium">{buyer.tax_id || '-'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">
                    {buyer.physical_address_street ? (
                      <>
                        {buyer.physical_address_street}<br />
                        {buyer.physical_address_city}, {buyer.physical_address_province} {buyer.physical_address_postal}
                      </>
                    ) : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Primary Contact</Label>
                  <p className="font-medium">{buyer.primary_contact_name || '-'}</p>
                  <p className="text-sm">{buyer.contact_email}</p>
                  <p className="text-muted-foreground text-sm">{buyer.contact_phone || '-'}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Financial Contact</Label>
                  <p className="font-medium">{buyer.financial_contact_name || '-'}</p>
                  <p className="text-sm">{buyer.financial_contact_email || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Eligibility Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="gap-4 grid grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Min Amount</Label>
                    <p className="font-medium">R{Number(buyer.min_invoice_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Amount</Label>
                    <p className="font-medium">R{Number(buyer.max_invoice_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Min Days to Maturity</Label>
                    <p className="font-medium">{buyer.min_days_to_maturity} days</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Max Days to Maturity</Label>
                    <p className="font-medium">{buyer.max_days_to_maturity} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="gap-4 grid grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Credit Limit</Label>
                    <p className="font-medium">
                      {buyer.credit_limit ? `R${Number(buyer.credit_limit).toLocaleString()}` : 'No limit'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Exposure</Label>
                    <p className="font-medium">R{Number(buyer.current_exposure || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rate Card</Label>
                    <p className="font-medium">{buyer.rate_card_name || 'Default'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Risk Tier</Label>
                    <Badge className={
                      buyer.risk_tier === 'A' ? 'bg-blue-100 text-blue-800' :
                      buyer.risk_tier === 'B' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }>
                      Tier {buyer.risk_tier}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>AP Users</CardTitle>
                <CardDescription>
                  Accounts Payable users who can upload invoices for this buyer ({apUserCount}/4 max)
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowAddUserDialog(true)}
                disabled={apUserCount >= 4}
              >
                <UserPlus className="mr-2 w-4 h-4" />
                Add AP User
              </Button>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="py-8 text-muted-foreground text-center">
                  <Users className="opacity-50 mx-auto mb-4 w-12 h-12" />
                  <p>No users created for this buyer yet</p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => setShowAddUserDialog(true)}
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    Create First User
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || user.username}</p>
                            <p className="text-muted-foreground text-sm">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.active_status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">{user.active_status}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.must_change_password ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Key className="mr-1 w-3 h-3" />
                              Must Change
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">Set</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleResendWelcome(user.user_id)}
                            disabled={isPending}
                          >
                            <Mail className="mr-1 w-4 h-4" />
                            Resend Welcome
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Buyer Documents</CardTitle>
                <CardDescription>
                  CIPC certificates, tax clearance, financial statements
                </CardDescription>
              </div>
              <Button onClick={() => setShowUploadDocDialog(true)}>
                <Upload className="mr-2 w-4 h-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="py-8 text-muted-foreground text-center">
                  <FileText className="opacity-50 mx-auto mb-4 w-12 h-12" />
                  <p>No documents uploaded yet</p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => setShowUploadDocDialog(true)}
                  >
                    <Upload className="mr-2 w-4 h-4" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.document_id}>
                        <TableCell>
                          <p className="font-medium">{doc.file_name || doc.document_name}</p>
                        </TableCell>
                        <TableCell>{getDocTypeLabel(doc.document_type)}</TableCell>
                        <TableCell>
                          {doc.verification_status === 'verified' ? (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          ) : doc.verification_status === 'rejected' ? (
                            <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {doc.expiry_date 
                            ? new Date(doc.expiry_date).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="space-x-1 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {doc.verification_status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleVerifyDocument(doc.document_id, true)}
                                disabled={isPending}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleVerifyDocument(doc.document_id, false)}
                                disabled={isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.document_id)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Change History
              </CardTitle>
              <CardDescription>
                Track changes to buyer profile and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeLog.length === 0 ? (
                <div className="py-8 text-muted-foreground text-center">
                  <History className="opacity-50 mx-auto mb-4 w-12 h-12" />
                  <p>No changes recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {changeLog.map((log) => (
                    <div key={log.log_id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.field_name}</Badge>
                          {log.requires_approval && (
                            <Badge className={
                              log.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                              log.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {log.approval_status}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm">
                          <span className="text-muted-foreground line-through">{log.old_value || '(empty)'}</span>
                          {' → '}
                          <span className="font-medium">{log.new_value || '(empty)'}</span>
                        </p>
                        {log.change_reason && (
                          <p className="mt-1 text-muted-foreground text-sm">
                            Reason: {log.change_reason}
                          </p>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm text-right">
                        <p>{log.changed_by_name || 'System'}</p>
                        <p>{new Date(log.changed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add AP User</DialogTitle>
            <DialogDescription>
              Create a new Accounts Payable user for {buyer.name}. 
              A welcome email with temporary credentials will be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="gap-4 grid grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="e.g., aap_user1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@company.com"
                />
              </div>
            </div>
            <div className="gap-4 grid grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+27 ..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="send_email"
                checked={newUser.send_welcome_email}
                onChange={(e) => setNewUser({...newUser, send_welcome_email: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="send_email" className="font-normal">
                Send welcome email with temporary password
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDocDialog} onOpenChange={setShowUploadDocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload supporting documents for {buyer.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <Select
                  value={newDoc.document_type}
                  onValueChange={(v) => setNewDoc({...newDoc, document_type: v as BuyerDocumentType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cipc_certificate">CIPC Certificate</SelectItem>
                    <SelectItem value="tax_clearance">Tax Clearance</SelectItem>
                    <SelectItem value="financial_statements">Financial Statements</SelectItem>
                    <SelectItem value="bank_confirmation">Bank Confirmation</SelectItem>
                    <SelectItem value="trade_references">Trade References</SelectItem>
                    <SelectItem value="director_id">Director ID</SelectItem>
                    <SelectItem value="resolution">Board Resolution</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File *</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    newDoc.file ? 'border-green-500 bg-green-50' : 'hover:border-primary'
                  }`}
                  onClick={() => document.getElementById('doc-file-input')?.click()}
                >
                  <input
                    id="doc-file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('File must be less than 10MB');
                          return;
                        }
                        setNewDoc({...newDoc, file});
                      }
                    }}
                  />
                  {newDoc.file ? (
                    <>
                      <CheckCircle2 className="mx-auto mb-2 w-8 h-8 text-green-500" />
                      <p className="font-medium">{newDoc.file.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {(newDoc.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Click to upload or drag and drop
                      </p>
                      <p className="mt-1 text-muted-foreground text-xs">
                        PDF, PNG, JPG up to 10MB
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date (optional)</Label>
                <Input
                  type="date"
                  value={newDoc.expiry_date}
                  onChange={(e) => setNewDoc({...newDoc, expiry_date: e.target.value})}
                />
                <p className="text-muted-foreground text-xs">
                  Set expiry date for tax clearance certificates, etc.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDocDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={isPending || !newDoc.file}>
              {isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
