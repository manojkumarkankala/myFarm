import { AuthProvider, useAuth } from '@/lib/auth';
import { SiteProvider } from '@/lib/site';
import { useRouter, matchPath } from '@/lib/router';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ServicesPage from '@/pages/ServicesPage';
import GalleryPage from '@/pages/GalleryPage';
import BookingPage from '@/pages/BookingPage';
import ContactPage from '@/pages/ContactPage';
import EquipmentDetailsPage from '@/pages/EquipmentDetailsPage';
import LegalPage from '@/pages/LegalPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageBookings from '@/pages/admin/ManageBookings';
import BookingDetails from '@/pages/admin/BookingDetails';
import ManageEquipment from '@/pages/admin/ManageEquipment';
import EquipmentEditor from '@/pages/admin/EquipmentEditor';
import ManageGallery from '@/pages/admin/ManageGallery';
import ManageAvailability from '@/pages/admin/ManageAvailability';
import ManageEnquiries from '@/pages/admin/ManageEnquiries';
import ManageProfile from '@/pages/admin/ManageProfile';
import ManageContent from '@/pages/admin/ManageContent';
import WebsiteSettingsPage from '@/pages/admin/WebsiteSettingsPage';
import ChangePassword from '@/pages/admin/ChangePassword';

function PublicShell() {
  const { route, navigate } = useRouter();
  const path = route.path;

  const render = () => {
    // Equipment details
    const eqMatch = matchPath('/equipment/:id', path);
    if (eqMatch) return <EquipmentDetailsPage equipmentId={eqMatch.id} navigate={navigate} />;

    // Booking with optional query
    const bookingMatch = path === '/booking' || path.startsWith('/booking?');
    if (bookingMatch) {
      const queryStr = path.includes('?') ? path.split('?')[1] : '';
      const query: Record<string, string> = {};
      queryStr.split('&').forEach((kv) => {
        const [k, v] = kv.split('=');
        if (k) query[k] = decodeURIComponent(v || '');
      });
      return <BookingPage navigate={navigate} query={query} />;
    }

    switch (path) {
      case '/': return <HomePage navigate={navigate} />;
      case '/about': return <AboutPage navigate={navigate} />;
      case '/services': return <ServicesPage navigate={navigate} />;
      case '/gallery': return <GalleryPage />;
      case '/contact': return <ContactPage />;
      case '/privacy': return <LegalPage navigate={navigate} type="privacy" />;
      case '/terms': return <LegalPage navigate={navigate} type="terms" />;
      default: return <NotFound navigate={navigate} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar navigate={navigate} currentPath={path} />
      <main className="flex-1">{render()}</main>
      <Footer navigate={navigate} />
      <FloatingButtons />
    </div>
  );
}

function AdminShell() {
  const { route, navigate } = useRouter();
  const { isAdmin, loading } = useAuth();
  const path = route.path;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-green-700" /></div>;
  }

  // Login page is public within admin area
  if (path === '/admin/login') {
    return <AdminLoginPage navigate={navigate} />;
  }

  if (!isAdmin) {
    return <AdminLoginPage navigate={navigate} />;
  }

  const render = () => {
    if (path === '/admin') return <AdminDashboard navigate={navigate} />;
    if (path === '/admin/bookings') return <ManageBookings navigate={navigate} />;
    const bd = matchPath('/admin/bookings/:id', path);
    if (bd) return <BookingDetails bookingId={bd.id} navigate={navigate} />;
    if (path === '/admin/equipment') return <ManageEquipment navigate={navigate} />;
    if (path === '/admin/equipment/new') return <EquipmentEditor equipmentId={null} navigate={navigate} />;
    const ee = matchPath('/admin/equipment/:id', path);
    if (ee) return <EquipmentEditor equipmentId={ee.id} navigate={navigate} />;
    if (path === '/admin/gallery') return <ManageGallery />;
    if (path === '/admin/availability') return <ManageAvailability />;
    if (path === '/admin/enquiries') return <ManageEnquiries />;
    if (path === '/admin/profile') return <ManageProfile />;
    if (path === '/admin/content') return <ManageContent />;
    if (path === '/admin/settings') return <WebsiteSettingsPage />;
    if (path === '/admin/password') return <ChangePassword />;
    return <NotFound navigate={navigate} />;
  };

  return <AdminLayout navigate={navigate} currentPath={path}>{render()}</AdminLayout>;
}

function NotFound({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-green-700">404</p>
      <p className="mt-3 text-stone-600">Page not found.</p>
      <button onClick={() => navigate('/')} className="btn-primary mt-5">Go Home</button>
    </div>
  );
}

function Routes() {
  const { route } = useRouter();
  const path = route.path;
  if (path.startsWith('/admin')) return <AdminShell />;
  return <PublicShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <Routes />
      </SiteProvider>
    </AuthProvider>
  );
}
