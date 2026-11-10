import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Bell, User, ChevronDown, LayoutDashboard, Store, Info, 
  Home as HomeIcon, Settings, Wrench, ShieldCheck, Footprints, 
  ClipboardList, MapPin, Stethoscope, AlertTriangle, Menu, X,
  Activity, Zap, Users, ShoppingCart, Trash2, Plus, Minus, PackageOpen,
  Mic
} from "lucide-react";
import { useState, useEffect } from "react";
import NotificationCenter from "./NotificationCenter";
import CheckoutModal from "./CheckoutModal";
import { authApi } from "@/Backend/api/todoApi";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { cart, cartItemCount, removeFromCart, addToCart, clearCart } = useCart();
  const cartTotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (authApi.isAuthenticated()) {
          const profile = await authApi.getProfile();
          setCurrentUser(profile.user);
        }
      } catch (error) {
        console.error("Failed to fetch user in navbar", error);
      }
    };
    fetchUser();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    authApi.logout();
    navigate(0);
  };

  const navLinkClass = (path: string) => cn(
    "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md hover:bg-secondary",
    isActive(path) ? "text-primary bg-secondary/50" : "text-muted-foreground hover:text-primary"
  );

  const MobileNavLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
    <Link 
      to={to} 
      onClick={() => setIsMobileMenuOpen(false)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
        isActive(to) ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Top Action Bar */}
      <div className="border-b border-border/50 bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <SheetHeader className="p-6 border-b border-slate-50 text-left">
                  <SheetTitle className="flex items-center gap-2">
                     <img src="/Farming Logo.ico" alt="Logo" className="w-6 h-6" />
                     <span className="text-xl font-bold text-primary italic">AgroArmor</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 p-4">
                  <MobileNavLink to="/" icon={HomeIcon}>{t('home')}</MobileNavLink>
                  
                  <div className="my-4 h-px bg-slate-100 mx-2" />
                  
                  <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('healthDropdown')}</div>
                  <MobileNavLink to="/awareness" icon={AlertTriangle}>{t('awareness')}</MobileNavLink>
                  <MobileNavLink to="/hygiene-test" icon={Footprints}>{t('hygieneTest')}</MobileNavLink>
                  
                  <div className="my-4 h-px bg-slate-100 mx-2" />
                  
                  <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('servicesDropdown')}</div>
                  <MobileNavLink to="/marketplace" icon={Store}>{t('marketplace')}</MobileNavLink>
                  <MobileNavLink to="/medical" icon={Stethoscope}>{t('vetDoctors')}</MobileNavLink>
                  
                  <div className="my-4 h-px bg-slate-100 mx-2" />
                  
                  <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('toolsDropdown')}</div>
                  <MobileNavLink to="/todo-list" icon={ClipboardList}>{t('todoList')}</MobileNavLink>
                  <MobileNavLink to="/gps-tracking" icon={MapPin}>{t('gpsTracking')}</MobileNavLink>
                  <MobileNavLink to="/compliance" icon={ShieldCheck}>{t('compliance')}</MobileNavLink>
                  
                  <div className="my-4 h-px bg-slate-100 mx-2" />

                  <div className="px-4 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('agroarmor:open-voice'));
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      <Mic className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <span>Voice Navigation (ಧ್ವನಿ / आवाज)</span>
                    </button>
                  </div>
                  
                  <div className="mt-8 px-4">
                     <Button className="w-full h-12 bg-primary font-bold text-white shadow-elegant rounded-xl mb-4" onClick={handleLogout}>
                        {t('logout')}
                     </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-1.5 group shrink-0">
              <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors hidden md:flex">
                <img 
                  src="/Farming Logo.ico" 
                  alt="AgroArmor Logo" 
                  className="w-7 h-7" 
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-primary">AgroArmor</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link to="/subscription">
              <Button size="sm" className="hidden sm:flex gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-sm border-0">
                <Crown className="w-4 h-4" />
                <span>{t('premium')}</span>
              </Button>
              <Button size="icon" variant="ghost" className="sm:hidden text-amber-500">
                <Crown className="w-5 h-5" />
              </Button>
            </Link>

            <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-secondary rounded-full">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[10px] font-bold text-white items-center justify-center">
                        {cartItemCount}
                      </span>
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col p-0">
                <SheetHeader className="p-5 border-b bg-slate-50">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    {t('myCart') === 'myCart' ? 'My Cart' : t('myCart')}
                    {cartItemCount > 0 && (
                      <Badge className="bg-emerald-600 text-white ml-1">{cartItemCount}</Badge>
                    )}
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 gap-4 text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                        <PackageOpen className="w-10 h-10 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-600 text-lg">{t('emptyCart') === 'emptyCart' ? 'Your cart is empty' : t('emptyCart')}</p>
                        <p className="text-sm text-slate-400 mt-1">{t('addSuppliesDesc') === 'addSuppliesDesc' ? 'Add vaccines & supplies from the Marketplace' : t('addSuppliesDesc')}</p>
                      </div>
                      <Button size="sm" onClick={() => { setIsCartOpen(false); navigate('/marketplace'); }} className="bg-emerald-600 hover:bg-emerald-700">
                        <Store className="w-4 h-4 mr-2" /> {t('goToMarketplace') === 'goToMarketplace' ? 'Go to Marketplace' : t('goToMarketplace')}
                      </Button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-3 bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 mb-2">{item.categoryLabel}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-base font-black text-emerald-600">₹{item.price * (item.quantity || 1)}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id)}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-bold">{item.quantity || 1}</span>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addToCart(item)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span className="text-slate-600">{t('totalItems', { count: cartItemCount }) === 'totalItems' ? `Total (${cartItemCount} items)` : `${t('total')} (${cartItemCount} ${t('items')})`}</span>
                      <span className="text-2xl text-emerald-600">₹{cartTotal}</span>
                    </div>
                    <Button
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold text-base shadow-lg shadow-emerald-600/20"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                      }}
                    >
                      {t('proceedToCheckout') === 'proceedToCheckout' ? 'Proceed to Checkout' : t('proceedToCheckout')}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-2" /> {t('clearCart') === 'clearCart' ? 'Clear Cart' : t('clearCart')}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Bell Notification Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationOpen(true)}
              className="relative hover:bg-secondary rounded-full"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Voice Navigation Mic Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('agroarmor:open-voice'));
              }}
              className="relative hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              title="Voice Navigation (ಕನ್ನಡ, हिन्दी, English, தமிழ்...)"
              aria-label="Voice Navigation"
              id="navbar-voice-assistant-btn"
            >
              <Mic className="w-5 h-5 text-emerald-600" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary rounded-full overflow-hidden">
                  {currentUser?.photo ? (
                    <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <div className="flex items-center gap-3 p-2 mb-2 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold">
                     {currentUser?.photo ? (
                       <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
                     ) : (
                       currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />
                     )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold text-sm truncate">{currentUser?.name || 'User Name'}</span>
                    <span className="text-xs text-slate-500 truncate">{currentUser?.email || 'user@example.com'}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="py-2 cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> {t('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 py-2 cursor-pointer mt-1">
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar (Desktop) */}
      <div className="bg-white/95 backdrop-blur-sm shadow-sm hidden md:block">
        <div className="container mx-auto px-4 h-12 flex items-center gap-1">
          <Link to="/" className={navLinkClass('/')}>
            <HomeIcon className="w-4 h-4" />
            {t('home')}
          </Link>
          


          <Link to="/marketplace" className={navLinkClass('/marketplace')}>
            <Store className="w-4 h-4" />
            {t('marketplace')}
          </Link>

          {/* Health Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md hover:bg-secondary hover:text-primary",
                location.pathname.match(/\/(awareness|hygiene-test)/) ? "text-primary bg-secondary/50" : "text-muted-foreground"
              )}>
                <Activity className="w-4 h-4" />
                {t('healthDropdown')}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/awareness')}>
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> {t('awareness')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/hygiene-test')}>
                <Footprints className="w-4 h-4 mr-2 text-blue-500" /> {t('hygieneTest')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Services Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md hover:bg-secondary hover:text-primary",
                location.pathname.match(/\/(marketplace|medical|community)/) ? "text-primary bg-secondary/50" : "text-muted-foreground"
              )}>
                <Zap className="w-4 h-4" />
                {t('servicesDropdown')}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/marketplace')}>
                <Store className="w-4 h-4 mr-2 text-emerald-500" /> {t('marketplace')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/medical')}>
                <Stethoscope className="w-4 h-4 mr-2 text-red-500" /> {t('vetDoctors')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/community')}>
                <Users className="w-4 h-4 mr-2 text-blue-500" /> {t('community')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all rounded-md hover:bg-secondary hover:text-primary",
                location.pathname.match(/\/(todo-list|gps-tracking|compliance)/) ? "text-primary bg-secondary/50" : "text-muted-foreground"
              )}>
                <Wrench className="w-4 h-4" />
                {t('toolsDropdown')}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/todo-list')}>
                <ClipboardList className="w-4 h-4 mr-2 text-purple-500" /> {t('todoList')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/gps-tracking')}>
                <MapPin className="w-4 h-4 mr-2 text-green-500" /> {t('gpsTracking')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/compliance')}>
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" /> {t('compliance')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('agroarmor:open-voice'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 shadow-xs group"
              title="Voice Assistant & Navigation"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse group-hover:scale-110 transition-transform" />
              <span>Voice Navigation</span>
            </button>
          </div>

        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />

      {/* Checkout Modal wired from Cart Sheet */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onSuccess={() => {
          clearCart();
          setIsCheckoutOpen(false);
        }}
      />
    </nav>
  );
};

export default Navbar;
