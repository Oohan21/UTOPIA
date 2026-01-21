// src/lib/types/analytics.ts
export interface MarketTrend {
  date: string;
  total_listings: number;
  active_listings: number;
  new_listings: number;
  sold_listings: number;
  rented_listings: number;
  average_price: number;
  price_change_daily: number;
  price_change_weekly: number;
  price_change_monthly: number;
  total_views: number;
  total_inquiries: number;
}

export interface PlatformMetrics {
  system: {
    uptime_days: number;
    uptime_percentage: number;
    cpu_usage_percent: number;
    memory_usage_percent: number;
    memory_used_mb: number;
    memory_total_mb: number;
    disk_usage_percent: number;
    disk_used_gb: number;
    disk_total_gb: number;
    os: string;
    python_version: string;
    django_version: string;
  };
  database: {
    connections: number;
    name: string;
    version: string;
    size_mb: number;
  };
  application: {
    active_sessions: number;
    concurrent_users: number;
    total_users: number;
    active_users_last_24h: number;
    total_properties: number;
    active_properties: number;
    response_time_ms: number;
    error_rate_percent: number;
    requests_per_minute: number;
  };
  performance: {
    average_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    requests_per_second: number;
    throughput: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    metric: string;
    value: string;
  }>;
  metadata: {
    timestamp: string;
    period: string;
    report_interval: string;
    data_source: string;
  };
}

export interface UserAnalyticsData {
  user_info: {
    id: number;
    email: string;
    full_name: string;
    user_type: string;
    joined_date: string;
    last_activity: string;
  };
  property_stats: {
    total_listed: number;
    active: number;
    sold: number;
    rented: number;
    featured: number;
    promoted: number;
  };
  engagement_stats: {
    total_logins: number;
    properties_viewed: number;
    properties_saved: number;
    inquiries_sent: number;
    searches_performed: number;
  };
  performance_metrics: {
    total_views: number;
    total_inquiries: number;
    avg_response_time: number;
    conversion_rate: number;
  };
  recent_activity: Array<{
    type: string;
    description: string;
    timestamp: string;
    metadata: any;
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
    action_url: string;
  }>;
}

export interface PlatformAnalyticsData {
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  user_growth_rate: number;
  total_properties: number;
  verified_properties: number;
  featured_properties: number;
  promoted_properties: number;
  total_page_views: number;
  avg_session_duration: number;
  bounce_rate: number;
  total_inquiries: number;
  successful_contacts: number;
  total_promotions: number;
  total_revenue: number;
  api_response_time: number;
  error_rate: number;
  server_uptime: number;
  _source: string;
  _timestamp: string;
}

export interface AdminUserAnalytics {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  joined_date: string;
  last_activity: string;
  total_properties: number;
  active_properties: number;
  total_views: number;
  total_inquiries: number;
  recent_inquiries: number;
  conversion_rate: number;
  is_active_today: boolean;
}

export interface AdminUserAnalyticsResponse {
  users: AdminUserAnalytics[];
  platform_totals: {
    total_users: number;
    total_properties: number;
    total_views: number;
    total_inquiries: number;
    active_users_today: number;
    new_users_today: number;
  };
  time_period: {
    days: number;
    date_from: string;
    date_to: string;
  };
}

export interface UserGrowthData {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
}

export interface DailyActivityData {
  date: string;
  active_users: number;
  new_users: number;
  page_views: number;
  searches: number;
  inquiries: number;
  properties_listed: number;
}

export interface UserGrowthResponse {
  data: UserGrowthData[];
  summary: {
    total_users: number;
    period_start: string;
    period_end: string;
    days_analyzed: number;
    total_new_in_period: number;
    average_daily_growth: number;
  };
}

export interface DailyActivityResponse {
  data: DailyActivityData[];
  summary: {
    total_days: number;
    period_start: string;
    period_end: string;
    total_new_users: number;
    total_active_users: number;
    total_property_views: number;
    total_daily_inquiries: number;
  };
}

export interface MarketAnalyticsData {
  total_listings: number;
  active_listings: number;
  new_listings_today: number;
  average_price: number;
  price_change_weekly: number;
  total_views_today: number;
  total_inquiries_today: number;
  market_health: string;
  top_performing_cities: Array<{
    name: string;
    property_count: number;
    average_price: number;
    total_views: number;
  }>;
  property_type_distribution: Array<{
    property_type: string;
    count: number;
    avg_price: number;
  }>;
  price_distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export interface PriceAnalyticsData {
  price_range: {
    min_price: number;
    max_price: number;
    avg_price: number;
    median_price: number;
  };
  average_prices_by_city: Array<{
    city: string;
    avg_price: number;
    property_count: number;
  }>;
  average_prices_by_property_type: Array<{
    property_type: string;
    avg_price: number;
    count: number;
  }>;
  price_trends: MarketTrend[];
  price_forecast: {
    current_trend: string;
    price_change_percentage: number;
    forecast: string;
    confidence: string;
  };
}

export interface DemandAnalyticsData {
  demand_by_city: Array<{
    city: string;
    total_views: number;
    total_inquiries: number;
    property_count: number;
    demand_score: number;
  }>;
  demand_by_property_type: Array<{
    property_type: string;
    total_views: number;
    total_inquiries: number;
    count: number;
  }>;
  view_to_inquiry_ratio: {
    total_views: number;
    total_inquiries: number;
    conversion_rate: number;
    industry_average: number;
  };
  days_on_market_average: {
    average_days: number;
    minimum_days: number;
    maximum_days: number;
    sample_size: number;
  };
  seasonal_trends: {
    peak_season: string;
    low_season: string;
    seasonal_variation: string;
    recommendation: string;
  };
}

export interface AnalyticsDashboardData {
  platform_metrics: {
    total_users: number;
    new_users_today: number;
    total_properties: number;
    active_properties: number;
    verified_properties: number;
    featured_properties: number;
  };
  revenue_metrics: {
    total_revenue: number;
    revenue_today: number;
    total_transactions: number;
    avg_transaction_value: number;
  };
  engagement_metrics: {
    total_views_today: number;
    total_inquiries_today: number;
    active_users_today: number;
    user_retention_rate: number;
  };
  performance_metrics: {
    api_performance: string;
    error_rate: number;
    server_uptime: number;
    response_time: number;
  };
  recent_activity: {
    recent_users: Array<{
      email: string;
      joined: string;
    }>;
    recent_properties: Array<{
      title: string;
      price: number;
      listed: string;
    }>;
    recent_payments: Array<{
      amount: number;
      user: string;
      date: string;
    }>;
  };
  top_performers: {
    top_properties: Array<{
      title: string;
      views: number;
      inquiries: number;
      city: string;
    }>;
    top_users: Array<{
      email: string;
      properties: number;
      total_views: number;
    }>;
  };
}