import { useMemo, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { trackViewItemList, trackViewItem, trackAddToCart, trackPurchase, type GA4Item } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpeechButton } from "@/components/ui/speech-button";
import { useToast } from "@/hooks/use-toast";
import CheckoutModal from "@/components/CheckoutModal";
import poultryFeedImg from "@/assets/poultry-farm.jpg";
import vaccineImg from "@/assets/newcastle-disease.jpg";
import cattleFeedImg from "@/assets/cattle-health.jpg";
import fmdVaccineImg from "@/assets/fmd_vaccine.png";
import lsdVaccineImg from "@/assets/lsd_vaccine.png";
import bvdVaccineImg from "@/assets/bvd_vaccine.png";
import ranikhetVaccineImg from "@/assets/ranikhet_vaccine.png";
import layerMashImg from "@/assets/layer_mash.jpg";
import crumblesImg from "@/assets/crumbles.jpg";
import milletComboImg from "@/assets/millet_combo.jpg";
import pelletsImg from "@/assets/pellets.jpg";
import wheatGrassImg from "@/assets/vibex_wheat_seeds.png"; // fallback for sprouting seeds
import { useCart } from "@/contexts/CartContext";
import { notificationApi } from "@/Backend/api/todoApi";
import {
  Search,
  Filter,
  ShoppingCart,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  Package,
  Leaf,
  Droplets,
  Shield,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Tractor,
  Clock
} from "lucide-react";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: {
    name: string;
    location: string;
    rating: number;
    phone: string;
  };
  image: string;
  inStock: boolean;
  deliveryAvailable: boolean;
  features: string[];
  benefits: string[];
  sku: string;
  weight?: string;
  origin?: string;
  categoryLabel: string;
  /** Link to product info / images (e.g. Google search) */
  infoUrl?: string;
}

const Marketplace = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { cart, addToCart, clearCart } = useCart(); // Use useCart hook
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [cart, setCart] = useState<MarketplaceItem[]>([]); // Removed local cart state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<MarketplaceItem | null>(null);

  const categories = [
    { id: "all", nameKey: "allProducts", icon: <Package className="w-4 h-4" /> },
    { id: "vaccines", nameKey: "vaccinesLabel", icon: <Shield className="w-4 h-4" /> },
    { id: "feed", nameKey: "animalFeed", icon: <Leaf className="w-4 h-4" /> },
    { id: "equipment", nameKey: "equipmentLabel", icon: <Package className="w-4 h-4" /> },
    { id: "fertilizer", nameKey: "fertilizerLabel", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const defaultSeller = { name: "AgroArmor Farm Supplies", location: "India", rating: 4.8, phone: "+91 9876543210" };
  const defaultFeatures = ["Quality assured", "Delivery available", "Verified seller"];
  const defaultBenefits = ["Trusted by farmers", "Best prices"];

  const marketplaceItems: MarketplaceItem[] = useMemo(() => [
    // Vaccines
    { id: "v1", name: t("marketplaceItem2Name"), description: t("marketplaceItem2Description"), price: 850, category: "vaccines", seller: defaultSeller, image: fmdVaccineImg, inStock: true, deliveryAvailable: true, categoryLabel: t("vaccinesLabel"), sku: "FMD-PV-100", weight: "100 ml", origin: "India", features: [t("marketplaceItem2Feature1"), t("marketplaceItem2Feature2"), t("marketplaceItem2Feature3"), t("marketplaceItem2Feature4")], benefits: [t("marketplaceItem2Benefit1"), t("marketplaceItem2Benefit2"), t("marketplaceItem2Benefit3"), t("marketplaceItem2Benefit4")] },
    { id: "v2", name: t("vaccineItem2Name"), description: t("vaccineItem2Desc"), price: 650, category: "vaccines", seller: defaultSeller, image: lsdVaccineImg, inStock: true, deliveryAvailable: true, categoryLabel: t("vaccinesLabel"), sku: "LSD-50", weight: "50 doses", origin: "India", features: [t("vaccineItem2F1"), t("vaccineItem2F2"), t("vaccineItem2F3"), t("vaccineItem2F4")], benefits: [t("vaccineItem2B1"), t("vaccineItem2B2"), t("vaccineItem2B3"), t("vaccineItem2B4")] },
    { id: "v3", name: t("vaccineItem3Name"), description: t("vaccineItem3Desc"), price: 720, category: "vaccines", seller: defaultSeller, image: bvdVaccineImg, inStock: true, deliveryAvailable: true, categoryLabel: t("vaccinesLabel"), sku: "BVD-100", weight: "100 ml", origin: "India", features: [t("vaccineItem3F1"), t("vaccineItem3F2"), t("vaccineItem3F3"), t("vaccineItem3F4")], benefits: [t("vaccineItem3B1"), t("vaccineItem3B2"), t("vaccineItem3B3"), t("vaccineItem3B4")] },
    { id: "v5", name: t("vaccineItem5Name"), description: t("vaccineItem5Desc"), price: 450, category: "vaccines", seller: defaultSeller, image: ranikhetVaccineImg, inStock: true, deliveryAvailable: true, categoryLabel: t("vaccinesLabel"), sku: "ND-LR-200", weight: "200 doses", origin: "India", features: [t("vaccineItem5F1"), t("vaccineItem5F2"), t("vaccineItem5F3"), t("vaccineItem5F4")], benefits: [t("vaccineItem5B1"), t("vaccineItem5B2"), t("vaccineItem5B3"), t("vaccineItem5B4")] },
    
    // Feed & Fodder
    { id: "f3", name: t("vaccineItem11Name"), description: t("vaccineItem11Desc"), price: 950, category: "feed", seller: defaultSeller, image: cattleFeedImg, inStock: true, deliveryAvailable: true, categoryLabel: t("animalFeed"), sku: "CF-50", weight: "50 kg", origin: "India", features: [t("vaccineItem11F1"), t("vaccineItem11F2"), t("vaccineItem11F3"), t("vaccineItem11F4")], benefits: [t("vaccineItem11B1"), t("vaccineItem11B2"), t("vaccineItem11B3"), t("vaccineItem11B4")], infoUrl: "https://www.google.com/search?q=cattle+feed" },
    { id: "f4", name: t("vaccineItem12Name"), description: t("vaccineItem12Desc"), price: 750, category: "feed", seller: defaultSeller, image: crumblesImg, inStock: true, deliveryAvailable: true, categoryLabel: t("animalFeed"), sku: "MASH-50", weight: "50 kg", origin: "India", features: [t("vaccineItem12F1"), t("vaccineItem12F2"), t("vaccineItem12F3"), t("vaccineItem12F4")], benefits: [t("vaccineItem12B1"), t("vaccineItem12B2"), t("vaccineItem12B3"), t("vaccineItem12B4")], infoUrl: "https://www.google.com/search?q=mash+feed" },
    { id: "f5", name: "Scratch & Peck Layer Mash", description: "Organic naturally complete whole-grain layer feed, 16% protein.", price: 1200, category: "feed", seller: defaultSeller, image: layerMashImg, inStock: true, deliveryAvailable: true, categoryLabel: t("animalFeed"), sku: "SP-LM-10", weight: "10 lb", origin: "USA", features: ["16% Protein", "Whole Grain", "Organic"], benefits: ["Healthy Hens", "Better Eggs", "Natural Diet"], infoUrl: "" },
    { id: "f6", name: "Organic Wheat Grass Seeds", description: "Healthy, nutritious, delicious certified organic sprouting seeds.", price: 450, category: "feed", seller: defaultSeller, image: wheatGrassImg, inStock: true, deliveryAvailable: true, categoryLabel: t("animalFeed"), sku: "SP-WG-5", weight: "5 lb", origin: "USA", features: ["Certified Organic", "Fast Sprouting", "High Nutrition"], benefits: ["Fresh Greens", "Natural Minerals", "Indoor/Outdoor Use"], infoUrl: "" },
    
    // Grains & Combos
    { id: "g1", name: "Organic Millet Combo", description: "Barnyard, Browntop, Kodo, Foxtail, and Little Millet combo pack.", price: 850, category: "feed", seller: defaultSeller, image: milletComboImg, inStock: true, deliveryAvailable: true, categoryLabel: "Grains", sku: "MILLET-5", weight: "5 kg", origin: "India", features: ["100% Organic", "Unpolished", "Gluten Free"], benefits: ["High Fiber", "Healthy Diet", "Nutrient Rich"], infoUrl: "" },
    
    // Equipment & Fertilizers
    { id: "e3", name: "Elysian Wood Pellets", description: "Barbeque Biomass Pellets Fire Starter for Cooking, Wood Stove.", price: 279, category: "equipment", seller: defaultSeller, image: pelletsImg, inStock: true, deliveryAvailable: true, categoryLabel: "Fuel", sku: "ELY-WP-1", weight: "1 kg", origin: "India", features: ["100% Natural", "Low Ash", "High Heat"], benefits: ["Clean Burning", "Eco-friendly", "Safe"], infoUrl: "" },
  ], [t]);

  const filteredItems = marketplaceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Removed paymentItems aggregation as cart already handles quantities
  /*
  const paymentItems = Object.values(
    cart.reduce((acc, item) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          name: item.name,
          quantity: 0,
          price: item.price,
          category: item.category,
        };
      }
      acc[item.id].quantity += 1;
      return acc;
    }, {} as Record<string, { name: string; quantity: number; price: number; category: string }>)
  );
  */

  useEffect(() => {
    trackViewItemList("Marketplace Products", marketplaceItems.length);
  }, [marketplaceItems.length]);

  const handleVoiceSearch = (text: string) => {
    setSearchQuery(text);
    toast({
      title: t('voiceSearchTitle'),
      description: t('voiceSearchDescription', { query: text }),
    });
  };

  const handleAddToCart = async (item: MarketplaceItem) => {
    if (!item.inStock) {
      toast({
        title: t('outOfStockTitle'),
        description: t('outOfStockMsg'),
        variant: "destructive"
      });
      return;
    }

    addToCart(item);
    trackAddToCart({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      quantity: 1,
    });
    toast({
      title: '🛒 Added to Cart!',
      description: `${item.name} has been added to your cart.`,
    });

    // Fire a backend notification so it appears in Notification Center
    try {
      await notificationApi.create({
        type: 'marketplace',
        title: '🛒 Item Added to Cart',
        message: `You added "${item.name}" (₹${item.price}) to your cart. Open the cart icon to review your order.`,
        priority: 'low',
        metadata: { itemId: item.id, itemName: item.name, price: item.price, category: item.category }
      });
    } catch {
      // Notification creation is non-critical; ignore silently
    }
  };

  const handleViewDetails = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
    trackViewItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
    });
  };

  const handleContactSeller = (seller: MarketplaceItem['seller']) => {
    toast({
      title: t('contactSellerTitle'),
      description: t('contactSellerDescription', { seller: seller.name, phone: seller.phone }),
    });
  };

  const handleBuyNow = (item: MarketplaceItem) => {
    if (!item.inStock) {
      toast({
        title: t('outOfStockTitle'),
        description: t('outOfStockMsg'),
        variant: "destructive"
      });
      return;
    }
    setBuyNowItem(item);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {/* Promotional Banner */}
        <div className="mb-10 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-green-400 p-8 shadow-xl text-white relative">
          <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
             <Tractor className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-none text-sm px-3 py-1 backdrop-blur-sm">{t('marketplacePromoScheme')}</Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              {t('marketplacePromoTitle')}
            </h1>
            <p className="text-emerald-50 text-lg mb-6 max-w-xl">
              {t('marketplacePromoDesc')}
            </p>
            <Button 
              size="lg" 
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold border-none shadow-lg transition-transform hover:scale-105 active:scale-95"
              onClick={() => {
                toast({
                  title: '🎉 Offer Activated!',
                  description: 'Your 30% discount has been applied. Valid on all farm essentials below.',
                });
                document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('marketplacePromoButton')} <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">{t('marketplaceTitle')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('marketplaceSubtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <SpeechButton
                  onTextCapture={handleVoiceSearch}
                  className="flex-shrink-0"
                />
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden sm:inline">{t(category.nameKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-medium">
                    {t('cartSummary')} ({cart.length} {t('cartItems')})
                  </span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (cart.length > 0) {
                      setIsCheckoutOpen(true);
                    } else {
                      toast({
                        title: t('cartEmpty') || "Cart is Empty",
                        description: t('cartEmptyDescription') || "Add items to cart first.",
                      });
                    }
                  }}
                  disabled={cart.length === 0}
                >
                  {t('viewCart')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Recommendations */}
        <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-3 bg-amber-100 rounded-xl shadow-inner">
                 <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-slate-900">{t('recommendedForYou')}</h2>
                 <p className="text-sm text-slate-500 font-medium">{t('recommendationReason')}</p>
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceItems.slice(0, 3).map((item) => (
                <Card key={`rec-${item.id}`} className="border-2 border-primary/20 hover:border-primary/40 transition-colors bg-primary/5 shadow-elegant relative overflow-hidden group">
                   <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-primary text-white border-none shadow-md px-2 py-1">
                         <Zap className="w-3 h-3 mr-1" />
                         {t('bestMatchBadge')}
                      </Badge>
                   </div>
                   <CardContent className="p-6">
                      <div className="flex gap-4">
                         <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-white/50">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 space-y-2">
                            <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                            <p className="text-[10px] text-slate-500 line-clamp-2">{item.description}</p>
                            <div className="flex items-center justify-between pt-1">
                               <span className="text-lg font-bold text-primary">₹{item.price}</span>
                               <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary hover:bg-primary/10" onClick={() => handleAddToCart(item)}>
                                  <ShoppingCart className="w-4 h-4" />
                               </Button>
                            </div>
                         </div>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </div>

        {/* Products Grid */}
        <div id="products-grid" className="flex items-center gap-2 mb-6 mt-8">
           <Package className="w-5 h-5 text-slate-400" />
           <h2 className="text-2xl font-bold text-slate-900">{t('allProducts')}</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden relative group">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 flex gap-1">
                     <Badge className="bg-white/90 backdrop-blur-sm text-emerald-700 hover:bg-white border-emerald-100 flex items-center gap-1 py-1">
                        <ShieldCheck className="w-3 h-3" />
                        {t('verifiedBadge') === 'verifiedBadge' ? 'Verified Seller' : t('verifiedBadge')}
                     </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg flex items-center justify-between">
                   {item.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-end justify-between">
                  <div>
                     <span className="text-xs text-slate-400 line-through block mb-0.5">₹{item.price + 150}</span>
                     <span className="text-2xl font-extrabold text-slate-900">₹{item.price}</span>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {item.categoryLabel}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                    <Star className="w-3 h-3 mr-1 fill-amber-500" />
                    {item.seller.rating} <span className="text-slate-400 text-xs ml-1">(120)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{item.seller.name} • {item.seller.location}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-primary text-primary hover:bg-primary/5"
                      onClick={() => handleViewDetails(item)}
                    >
                      {t('viewDetails') === 'viewDetails' ? 'View Details' : t('viewDetails')}
                    </Button>
                    <div className="flex gap-2 flex-1">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-amber-500 hover:bg-amber-600 font-semibold"
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                      >
                         <ShoppingCart className="w-4 h-4 mr-1" /> {t('addBtn') === 'addBtn' ? 'Add' : t('addBtn')}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                        onClick={() => handleBuyNow(item)}
                        disabled={!item.inStock}
                      >
                        {t('buyNow') === 'buyNow' ? 'Buy Now' : t('buyNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noProductsFound')}</h3>
              <p className="text-muted-foreground">
                {t('adjustFilters')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
          {selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-white p-6 flex flex-col justify-center items-center relative">
                 <div className="absolute top-4 left-4 z-10 space-y-2">
                    <Badge className="bg-emerald-600 text-white border-none shadow-sm block w-fit py-1 px-3">
                       {selectedItem.categoryLabel}
                    </Badge>
                 </div>
                 <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                 </div>
              </div>
              
              <div className="p-8 space-y-6 flex flex-col justify-between">
                <div>
                   <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{selectedItem.name}</h2>
                   <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                      <span className="text-3xl font-black text-emerald-600">₹{selectedItem.price}</span>
                      <span className="text-lg text-slate-400 line-through">₹{selectedItem.price + 150}</span>
                      <Badge variant={selectedItem.inStock ? "default" : "secondary"} className="ml-auto bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shadow-none border border-emerald-200">
                        {selectedItem.inStock ? 'In Stock & Ready' : 'Out of Stock'}
                      </Badge>
                   </div>
                   
                   <p className="text-slate-600 leading-relaxed text-base mb-6">
                     {selectedItem.description}
                   </p>

                   <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
                         <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Shield className="w-5 h-5"/></div>
                         <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Brand</p>
                            <p className="font-bold text-slate-800 text-sm">AgroArmor Certified</p>
                         </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-3 items-center">
                         <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Package className="w-5 h-5"/></div>
                         <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">SKU</p>
                            <p className="font-bold text-slate-800 text-sm">{selectedItem.sku}</p>
                         </div>
                      </div>
                   </div>

                   <div className="mb-2">
                     <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> Key Features</h4>
                     <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                       {selectedItem.features.map((feature, index) => (
                         <li key={index} className="flex items-start gap-2">
                           <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                           <span className="text-sm font-medium text-slate-600">{feature}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>

                <div className="flex gap-3 pt-4 shrink-0">
                  <Button 
                    onClick={() => {
                        setIsDialogOpen(false);
                        handleBuyNow(selectedItem);
                    }}
                    disabled={!selectedItem.inStock}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-14 text-lg font-bold shadow-lg shadow-emerald-600/20"
                  >
                    {t('buyNow') === 'buyNow' ? 'Buy Now' : t('buyNow')}
                  </Button>
                  <Button 
                    onClick={() => {
                       addToCart(selectedItem);
                       trackAddToCart({
                         id: selectedItem.id,
                         name: selectedItem.name,
                         category: selectedItem.category,
                         price: selectedItem.price,
                         quantity: 1,
                       });
                       toast({title: "Added to Cart!", description: `${selectedItem.name} was added to your cart.`});
                    }}
                    variant="outline"
                    disabled={!selectedItem.inStock}
                    className="flex-1 h-14 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-lg font-bold"
                  >
                    <ShoppingCart className="mr-2 w-5 h-5" /> {t('addToCart') === 'addToCart' ? 'Add to Cart' : t('addToCart')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setBuyNowItem(null);
        }}
        items={buyNowItem ? [{
          ...buyNowItem,
          quantity: 1
        }] : cart.map(item => ({
          ...item,
          quantity: item.quantity || 1
        }))}
        onSuccess={(paymentData) => {
          // Save mock order
          const itemsBought = buyNowItem ? [{ ...buyNowItem, quantity: 1, date: new Date().toLocaleDateString() }] : cart.map(item => ({ ...item, quantity: item.quantity || 1, date: new Date().toLocaleDateString() }));
          const existingOrders = JSON.parse(localStorage.getItem('user_orders') || '[]');
          localStorage.setItem('user_orders', JSON.stringify([...itemsBought, ...existingOrders]));

          // Item subtotal excluding GST, with GST sent separately via tax
          const subtotal = paymentData?.subtotal ?? itemsBought.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
          const taxAmount = paymentData?.gstAmount ?? (subtotal * 0.18);
          const txnId = paymentData?.paymentId || paymentData?.orderId || `order_${Date.now()}`;

          const ga4Items: GA4Item[] = itemsBought.map(it => ({
            item_id: it.id || it.sku || 'product',
            item_name: it.name,
            item_category: it.category,
            price: it.price,
            quantity: it.quantity || 1,
          }));

          // Track GA4 Purchase with item subtotal as value, separate tax, and items array
          trackPurchase(txnId, subtotal, ga4Items, taxAmount);

          toast({
            title: t('orderPlaced') || "Order Placed Successfully!",
            description: t('orderPlacedDescription') || "Your order has been confirmed and will be delivered soon.",
          });
          setBuyNowItem(null);
          clearCart();
        }}
      />
    </div>
  );
};

export default Marketplace;
