export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment/Condo' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'office', label: 'Office Space' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'farm', label: 'Farm' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'other', label: 'Other' },
]

export const LISTING_TYPES = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
]

export const FURNISHING_TYPES = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
]

export const BEDROOM_OPTIONS = [
  { value: '0', label: 'No Bedroom' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
]

export const BATHROOM_OPTIONS = [
  { value: '0', label: 'No Bathroom' },
  { value: '1', label: '1+ Bathrooms' },
  { value: '2', label: '2+ Bathrooms' },
  { value: '3', label: '3+ Bathrooms' },
  { value: '4', label: '4+ Bathrooms' },
]

export const PRICE_RANGES = [
  { min: 0, max: 500000, label: 'Under 500,000 ETB' },
  { min: 500000, max: 1000000, label: '500K - 1M ETB' },
  { min: 1000000, max: 3000000, label: '1M - 3M ETB' },
  { min: 3000000, max: 5000000, label: '3M - 5M ETB' },
  { min: 5000000, max: 10000000, label: '5M - 10M ETB' },
  { min: 10000000, max: 50000000, label: '10M+ ETB' },
]

export const AREA_RANGES = [
  { min: 0, max: 50, label: 'Under 50 m²' },
  { min: 50, max: 100, label: '50 - 100 m²' },
  { min: 100, max: 200, label: '100 - 200 m²' },
  { min: 200, max: 500, label: '200 - 500 m²' },
  { min: 500, max: 1000, label: '500 - 1000 m²' },
  { min: 1000, max: 10000, label: '1000+ m²' },
]

export const SORT_OPTIONS = [
  { value: '-promotion_priority,-created_at', label: 'Promoted First' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-price_etb', label: 'Price: High to Low' },
  { value: 'price_etb', label: 'Price: Low to High' },
  { value: '-total_area', label: 'Area: Large to Small' },
  { value: 'total_area', label: 'Area: Small to Large' },
  { value: '-bedrooms', label: 'Bedrooms: High to Low' },
  { value: 'bedrooms', label: 'Bedrooms: Low to High' },
  { value: '-views_count', label: 'Most Viewed' },
  { value: 'views_count', label: 'Least Viewed' },
  { value: '-save_count', label: 'Most Saved' },
]

export const USER_TYPES = [
  { value: 'buyer', label: 'Buyer/Looking to Buy' },
  { value: 'seller', label: 'Seller/Property Owner' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'agent', label: 'Real Estate Agent' },
  { value: 'developer', label: 'Property Developer' },
]

export const adminNavigation = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: 'Home',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: 'Users',
    subItems: [
      { title: 'All Users', href: '/admin/users' },
      { title: 'Create User', href: '/admin/users/create' },
      { title: 'User Groups', href: '/admin/users/groups' },
    ],
  },
  {
    title: 'Properties',
    href: '/admin/properties',
    icon: 'Building2',
    subItems: [
      { title: 'All Properties', href: '/admin/properties' },
      { title: 'Create Property', href: '/admin/properties/create' },
      { title: 'Property Types', href: '/admin/properties/types' },
    ],
  },
  {
    title: 'Inquiries',
    href: '/admin/inquiries',
    icon: 'MessageSquare',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: 'BarChart3',
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: 'FileText',
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: 'Bell',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
];

export const PROPERTY_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
  { value: 'off_market', label: 'Off Market' },
]
export const USD_TO_ETB_RATE = 172