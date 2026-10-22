export interface Profile {
  id: string;
  email: string;
  role: string;
  owner_name: string | null;
  owner_photo: string | null;
  business_name: string | null;
  biography: string | null;
  farming_experience: string | null;
  mobile_number: string | null;
  whatsapp_number: string | null;
  email_address: string | null;
  business_address: string | null;
  village_town: string | null;
  service_areas: string | null;
  working_hours: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_title: string;
  hero_description: string | null;
  hero_image_url: string | null;
  hero_video_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  business_address: string | null;
  service_areas: string | null;
  footer_content: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  about_title: string | null;
  about_description: string | null;
  why_choose_us: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  slug: string | null;
  main_image_url: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  price: number;
  pricing_unit: string;
  min_booking_duration: string | null;
  service_locations: string | null;
  availability_status: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  equipment_images?: EquipmentImage[];
}

export interface EquipmentImage {
  id: string;
  equipment_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  equipment_id: string | null;
  name: string;
  description: string | null;
  price: number;
  pricing_unit: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url: string | null;
  category: string | null;
  equipment_type: string | null;
  location: string | null;
  event_date: string | null;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Availability {
  id: string;
  equipment_id: string;
  rule_type: 'working_hours' | 'block';
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  blocked_date: string | null;
  blocked_start_time: string | null;
  blocked_end_time: string | null;
  reason: string | null;
  is_recurring: boolean;
  created_at: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'rescheduled';

export interface Booking {
  id: string;
  reference_number: string;
  customer_name: string;
  customer_mobile: string;
  customer_whatsapp: string | null;
  equipment_id: string | null;
  equipment_name: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  farm_village: string;
  farm_address: string | null;
  land_area: number;
  land_area_unit: string;
  crop_type: string | null;
  work_required: string | null;
  additional_requirements: string | null;
  status: BookingStatus;
  rejection_reason: string | null;
  admin_notes: string | null;
  total_price: number | null;
  submitted_at: string;
  approved_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  rating: number;
  review: string;
  location: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}
