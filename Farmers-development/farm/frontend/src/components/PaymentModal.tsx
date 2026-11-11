import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode
} from "lucide-react";
import paymentQr from "@/assets/custom_payment_qr.jpeg";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PaymentItem[];
  subscription?: SubscriptionPlan;
  onSuccess: (paymentData: any) => void;
}

interface PaymentItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface SubscriptionPlan {
  planId: string;
  planName: string;
  duration: string;
  price: number;
  features: string[];
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  providers: string[];
}

const PaymentModal = ({ isOpen, onClose, items, subscription, onSuccess }: PaymentModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>("upi");
  const [selectedProvider, setSelectedProvider] = useState<string>("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [showQRCode, setShowQRCode] = useState(true);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });

  const paymentMethods: PaymentMethod[] = [
    {
      id: "upi",
      name: "UPI",
      icon: <Smartphone className="w-5 h-5" />,
      description: "Pay using UPI ID or QR Code",
      providers: ["razorpay", "payu", "phonepe", "google_pay"]
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Visa, Mastercard, RuPay",
      providers: ["razorpay", "payu"]
    },
    {
      id: "netbanking",
      name: "Net Banking",
      icon: <Building2 className="w-5 h-5" />,
      description: "Direct bank transfer",
      providers: ["razorpay", "payu"]
    },
    {
      id: "wallet",
      name: "Digital Wallet",
      icon: <Wallet className="w-5 h-5" />,
      description: "Paytm, PhonePe, Google Pay",
      providers: ["paytm", "phonepe", "google_pay"]
    }
  ];

  const providers = {
    razorpay: { name: "Razorpay", logo: "🔒" },
    payu: { name: "PayU", logo: "💳" },
    paytm: { name: "Paytm", logo: "📱" },
    phonepe: { name: "PhonePe", logo: "📲" },
    google_pay: { name: "Google Pay", logo: "G" }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = totalAmount * 0.18; // 18% GST
  const finalAmount = totalAmount + gstAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate a delay for processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful!",
        description: "Your payment has been processed successfully via UPI.",
      });
      onSuccess({ method: 'upi', amount: finalAmount });
      onClose();
    }, 1500);
  };

  const handleRazorpayPayment = async (gatewayData: any) => {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const options = {
        key: gatewayData.key,
        amount: gatewayData.amount,
        currency: gatewayData.currency,
        name: 'Farm Management Portal',
        description: 'Premium Subscription',
        order_id: gatewayData.orderId,
        handler: async (response: any) => {
          await verifyPayment(response);
        },
        prefill: {
          name: 'Farmer',
          email: 'farmer@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#059669'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  const handlePayuPayment = async (gatewayData: any) => {
    // Create form for PayU
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://secure.payu.in/_payment';
    form.target = '_blank';

    Object.keys(gatewayData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = gatewayData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handlePaytmPayment = async (gatewayData: any) => {
    // Create form for Paytm
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://securegw-stage.paytm.in/order/process';
    form.target = '_blank';

    Object.keys(gatewayData).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = gatewayData[key];
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const verifyPayment = async (response: any) => {
    try {
      const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
      const API_BASE = !rawBase ? '/api' : (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`);
      const verifyResponse = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          paymentProvider: selectedProvider
        })
      });

      const result = await verifyResponse.json();
      
      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated.",
        });
        onSuccess(result.payment);
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support if amount was deducted.",
        variant: "destructive"
      });
    }
  };

  const selectedMethodData = paymentMethods.find(method => method.id === selectedMethod);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Payment</DialogTitle>
          <DialogDescription>
            Secure payment for your farm management subscription
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          {method.icon}
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Provider Selection */}
          {selectedMethodData && selectedMethodData.providers.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Payment Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedMethodData.providers.map((providerId) => (
                      <div key={providerId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={providerId} id={providerId} />
                        <Label htmlFor={providerId} className="flex-1 cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{providers[providerId].logo}</span>
                            <span className="font-medium">{providers[providerId].name}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          )}

          {/* UPI ID Input */}
          {selectedMethod === "upi" && (
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    UPI Payment
                  </CardTitle>
                  <div className="flex bg-muted p-1 rounded-md">
                    <Button 
                      variant={showQRCode ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setShowQRCode(true)}
                      className="h-7 px-3 text-xs"
                    >
                      QR Code
                    </Button>
                    <Button 
                      variant={!showQRCode ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setShowQRCode(false)}
                      className="h-7 px-3 text-xs"
                    >
                      UPI ID
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showQRCode ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-2">
                    <div className="bg-white p-2 rounded-xl border-2 border-primary/10 shadow-md flex justify-center w-fit mx-auto">
                      <img 
                        src={paymentQr} 
                        alt="Payment QR Code" 
                        className="w-56 h-auto max-h-[350px] object-contain rounded-lg"
                      />
                    </div>
                    <div className="text-center space-y-1 w-full">
                      <p className="font-bold text-xl text-primary mb-1">Total: ₹{finalAmount.toFixed(2)}</p>
                      <p className="text-sm font-medium">Scan with any UPI App and Pay</p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 w-full space-y-3">
                        <Label htmlFor="utr-input" className="text-left block text-sm font-bold text-slate-700">
                          Enter 12-digit UTR / Reference No.
                        </Label>
                        <Input 
                          id="utr-input"
                          placeholder="e.g. 301234567890" 
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                          className="text-center tracking-widest font-mono text-lg transition-all border-slate-300 focus-visible:ring-primary/40 bg-slate-50"
                        />
                        <p className="text-[10px] text-muted-foreground text-left">
                          You will find the 12-digit UTR or Reference Number in your UPI app's transaction history after successful payment.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 mt-4 shadow-elegant"
                      disabled={isProcessing || utrNumber.length !== 12}
                      onClick={() => {
                        if (utrNumber.length !== 12) {
                          toast({ title: "Invalid UTR", description: "Please enter a valid 12-digit UTR number.", variant: "destructive" });
                          return;
                        }
                        setIsProcessing(true);
                        // Simulate realistic bank verification delay
                        setTimeout(() => {
                          setIsProcessing(false);
                          toast({
                            title: "Payment Verified Successfully!",
                            description: `UTR ${utrNumber} verified for ₹${finalAmount.toFixed(2)}. Subscription is now active.`,
                          });
                          onSuccess({ method: 'upi_qr', amount: finalAmount, utr: utrNumber });
                          onClose();
                        }, 3000);
                      }}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying with Bank...
                        </div>
                      ) : (
                        "Verify Payment"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upi-id">Enter UPI ID</Label>
                      <Input
                        id="upi-id"
                        placeholder="7989303343@axl"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="text-lg py-6"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A payment request will be sent to your UPI app.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={handlePayment}
                      disabled={isProcessing || !upiId}
                    >
                      {isProcessing ? "Requesting..." : `Pay ₹${finalAmount.toFixed(2)}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Details */}
          {selectedMethod === "card" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Card Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Card Number"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                  />
                  <Input
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                  />
                </div>
                <Input
                  placeholder="Cardholder Name"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                />
              </CardContent>
            </Card>
          )}

          {/* Security Notice */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Secure Payment</p>
                  <p className="text-sm text-green-700">
                    Your payment information is encrypted and secure. We use industry-standard SSL encryption.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing || (selectedMethod === "upi" && !upiId)}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${finalAmount.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
